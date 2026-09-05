import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClient } from '@supabase/supabase-js';
import { getTierMaxFileLimit, UserTier } from '@anticeil/core';
import { r2, R2_BUCKET, r2Key, createCustomR2Client } from '../../../../src/lib/r2';

/**
 * POST /api/storage/upload
 * Unified upload endpoint supporting both Supabase Storage and Cloudflare R2 drivers.
 *
 * Body: { filename: string, contentType: string, category: string, size: number, storageDriver?: 'supabase' | 'r2' }
 * Headers: Optional x-storage-driver, x-custom-supabase-url, x-custom-supabase-anon-key, x-custom-r2-*
 *
 * Returns: { uploadUrl: string, key: string, publicUrl: string | null, driver: 'supabase' | 'r2' }
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');

    // Read custom headers if passed from client
    const headerDriver = req.headers.get('x-storage-driver') as 'supabase' | 'r2' | null;
    const customSupabaseUrl = req.headers.get('x-custom-supabase-url');
    const customSupabaseAnonKey = req.headers.get('x-custom-supabase-anon-key');

    const customR2AccountId = req.headers.get('x-custom-r2-account-id');
    const customR2BucketName = req.headers.get('x-custom-r2-bucket-name');
    const customR2AccessKeyId = req.headers.get('x-custom-r2-access-key-id');
    const customR2SecretAccessKey = req.headers.get('x-custom-r2-secret-access-key');
    const customR2PublicUrl = req.headers.get('x-custom-r2-public-url');

    const { filename, contentType, category = 'other', size, storageDriver } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'filename and contentType are required' }, { status: 400 });
    }

    // 1. Identify user
    const supabaseUrl = customSupabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = customSupabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser(token ?? '');

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Quota guard: validate per-file size based on user tier
    const userTier = (user.user_metadata?.tier || 'free') as UserTier;
    const maxFileLimit = getTierMaxFileLimit(userTier);
    if (typeof size === 'number' && size > maxFileLimit) {
      const maxMb = Math.round(maxFileLimit / (1024 * 1024));
      return NextResponse.json(
        { error: `File exceeds the ${maxMb} MB limit for ${userTier.toUpperCase()} tier.` },
        { status: 413 }
      );
    }

    // Build unique key: userId/category/timestamp-filename
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = r2Key(user.id, category, `${Date.now()}-${safeFilename}`);

    // Determine target driver
    const selectedDriver: 'supabase' | 'r2' =
      storageDriver ||
      headerDriver ||
      (customR2AccountId && customR2AccessKeyId ? 'r2' : 'supabase');

    // ─────────────────────────────────────────────────────────────
    // DRIVER 1: Supabase Storage (Default / Integrated)
    // ─────────────────────────────────────────────────────────────
    if (selectedDriver === 'supabase') {
      const SUPABASE_BUCKET = 'anticeil-media';

      // Create signed upload URL from Supabase
      const { data: signedData, error: signError } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .createSignedUploadUrl(key);

      if (signError || !signedData?.signedUrl) {
        console.warn('[Supabase Storage] signed upload URL failed:', signError);
        // Fallback: direct public URL
        const { data: publicData } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(key);
        return NextResponse.json({
          uploadUrl: `${supabaseUrl}/storage/v1/object/${SUPABASE_BUCKET}/${key}`,
          key,
          publicUrl: publicData?.publicUrl || null,
          driver: 'supabase',
        });
      }

      const { data: publicData } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(key);

      return NextResponse.json({
        uploadUrl: signedData.signedUrl,
        key,
        publicUrl: publicData?.publicUrl || null,
        driver: 'supabase',
      });
    }

    // ─────────────────────────────────────────────────────────────
    // DRIVER 2: Cloudflare R2 (Dedicated S3 / Zero Egress)
    // ─────────────────────────────────────────────────────────────
    let s3Client: S3Client = r2;
    let targetBucket = R2_BUCKET;
    let publicUrlBase = process.env.R2_PUBLIC_URL || '';

    if (customR2AccountId && customR2AccessKeyId && customR2SecretAccessKey) {
      s3Client = createCustomR2Client({
        accountId: customR2AccountId,
        accessKeyId: customR2AccessKeyId,
        secretAccessKey: customR2SecretAccessKey,
      });
      if (customR2BucketName) targetBucket = customR2BucketName;
      if (customR2PublicUrl) publicUrlBase = customR2PublicUrl;
    }

    const command = new PutObjectCommand({
      Bucket: targetBucket,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    });

    // Presigned URL valid for 5 minutes
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    const publicUrl = publicUrlBase ? `${publicUrlBase.replace(/\/$/, '')}/${key}` : null;

    return NextResponse.json({
      uploadUrl,
      key,
      publicUrl,
      driver: 'r2',
    });
  } catch (err: any) {
    console.error('[Storage Upload Presign Error]:', err);
    return NextResponse.json({ error: err?.message ?? 'Upload presign failed' }, { status: 500 });
  }
}
