import { NextRequest, NextResponse } from 'next/server';
import {
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import { r2, R2_BUCKET, createCustomR2Client } from '../../../../src/lib/r2';

/**
 * POST /api/storage/transfer
 *
 * Bidirectional media migration between Cloudflare R2 and Supabase Storage.
 *
 * Body:
 * {
 *   direction: 'r2_to_supabase' | 'supabase_to_r2',
 *   customSupabase?: { url: string; anonKey: string },
 *   customR2?: { accountId: string; bucketName: string; accessKeyId: string; secretAccessKey: string; publicUrl?: string }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');

    const { direction, customSupabase, customR2 } = await req.json();

    if (direction !== 'r2_to_supabase' && direction !== 'supabase_to_r2') {
      return NextResponse.json(
        { error: 'Invalid direction. Must be "r2_to_supabase" or "supabase_to_r2"' },
        { status: 400 }
      );
    }

    // 1. Resolve Supabase Client
    const supabaseUrl = customSupabase?.url?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = customSupabase?.anonKey?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser(token ?? '');

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized user session' }, { status: 401 });
    }

    // 2. Resolve R2 S3 Client & Bucket
    let s3Client: S3Client = r2;
    let r2BucketName = R2_BUCKET;

    if (
      customR2?.accountId &&
      customR2?.accessKeyId &&
      customR2?.secretAccessKey
    ) {
      s3Client = createCustomR2Client({
        accountId: customR2.accountId,
        accessKeyId: customR2.accessKeyId,
        secretAccessKey: customR2.secretAccessKey,
      });
      r2BucketName = customR2.bucketName?.trim() || 'anticeil-media';
    }

    const SUPABASE_MEDIA_BUCKET = 'anticeil-media';

    let transferredCount = 0;
    let transferredBytes = 0;

    // Helper: stream to Buffer
    const streamToBuffer = async (stream: any): Promise<Buffer> => {
      const chunks: Uint8Array[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    };

    // ─────────────────────────────────────────────────────────────
    // DIRECTION 1: Cloudflare R2 ➔ Supabase Storage
    // ─────────────────────────────────────────────────────────────
    if (direction === 'r2_to_supabase') {
      // List all objects in user's R2 prefix or root
      const userPrefix = `${user.id}/`;
      const listCommand = new ListObjectsV2Command({
        Bucket: r2BucketName,
        Prefix: userPrefix,
      });

      const listRes = await s3Client.send(listCommand);
      const objects = listRes.Contents || [];

      // Also fallback search if stored with direct names
      if (objects.length === 0) {
        const rootList = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: r2BucketName,
            MaxKeys: 200,
          })
        );
        if (rootList.Contents) {
          objects.push(...rootList.Contents);
        }
      }

      for (const obj of objects) {
        if (!obj.Key || obj.Key.endsWith('/')) continue;

        try {
          // Download from R2
          const getRes = await s3Client.send(
            new GetObjectCommand({
              Bucket: r2BucketName,
              Key: obj.Key,
            })
          );

          if (getRes.Body) {
            const buffer = await streamToBuffer(getRes.Body);
            const contentType = getRes.ContentType || 'application/octet-stream';

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
              .from(SUPABASE_MEDIA_BUCKET)
              .upload(obj.Key, buffer, {
                contentType,
                upsert: true,
              });

            if (!uploadError) {
              transferredCount++;
              transferredBytes += obj.Size || buffer.length;
            } else {
              console.warn(`[Transfer] Failed to upload ${obj.Key} to Supabase:`, uploadError);
            }
          }
        } catch (objErr) {
          console.warn(`[Transfer] Error transferring ${obj.Key}:`, objErr);
        }
      }

      return NextResponse.json({
        success: true,
        direction,
        count: transferredCount,
        transferredBytes,
        message:
          transferredCount > 0
            ? `Successfully transferred ${transferredCount} file(s) from Cloudflare R2 to Supabase Storage.`
            : 'No media files found in Cloudflare R2 to transfer.',
      });
    }

    // ─────────────────────────────────────────────────────────────
    // DIRECTION 2: Supabase Storage ➔ Cloudflare R2
    // ─────────────────────────────────────────────────────────────
    if (direction === 'supabase_to_r2') {
      // Recursively list files from Supabase Storage bucket
      const listFolder = async (folderPath: string): Promise<string[]> => {
        const filePaths: string[] = [];
        const { data: items, error } = await supabase.storage
          .from(SUPABASE_MEDIA_BUCKET)
          .list(folderPath, { limit: 200 });

        if (error || !items) return filePaths;

        for (const item of items) {
          const fullPath = folderPath ? `${folderPath}/${item.name}` : item.name;
          if (item.id === null || !item.metadata) {
            // It's a subfolder
            const subItems = await listFolder(fullPath);
            filePaths.push(...subItems);
          } else {
            // It's a file
            filePaths.push(fullPath);
          }
        }
        return filePaths;
      };

      // Check user folder first, or whole bucket
      let fileList = await listFolder(user.id);
      if (fileList.length === 0) {
        fileList = await listFolder('');
      }

      for (const filePath of fileList) {
        try {
          // Download from Supabase
          const { data: blob, error: downloadError } = await supabase.storage
            .from(SUPABASE_MEDIA_BUCKET)
            .download(filePath);

          if (blob && !downloadError) {
            const arrayBuffer = await blob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Upload to Cloudflare R2
            await s3Client.send(
              new PutObjectCommand({
                Bucket: r2BucketName,
                Key: filePath,
                Body: buffer,
                ContentType: blob.type || 'application/octet-stream',
                ContentLength: buffer.length,
              })
            );

            transferredCount++;
            transferredBytes += buffer.length;
          }
        } catch (fileErr) {
          console.warn(`[Transfer] Error transferring ${filePath} to R2:`, fileErr);
        }
      }

      return NextResponse.json({
        success: true,
        direction,
        count: transferredCount,
        transferredBytes,
        message:
          transferredCount > 0
            ? `Successfully transferred ${transferredCount} file(s) from Supabase Storage to Cloudflare R2.`
            : 'No media files found in Supabase Storage to transfer.',
      });
    }

    return NextResponse.json({ error: 'Unknown transfer action' }, { status: 400 });
  } catch (err: any) {
    console.error('[Storage Transfer Error]:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to process media storage transfer' },
      { status: 500 }
    );
  }
}
