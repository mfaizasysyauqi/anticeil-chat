import { NextRequest, NextResponse } from 'next/server';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import { r2, R2_BUCKET } from '../../../../src/lib/r2';

function categorize(key: string): 'docs' | 'images' | 'audio' | 'other' {
  const name = key.toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp|svg|mp4|mov|webm)$/.test(name)) return 'images';
  if (/\.(mp3|wav|ogg|m4a|flac|aac)$/.test(name)) return 'audio';
  if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|csv|txt|md)$/.test(name)) return 'docs';
  return 'other';
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');

    // Identify user via Supabase Auth
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await supabase.auth.getUser(token ?? '');
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = user.id;

    // List all objects in R2 under prefix `userId/`
    let totalBytes = 0;
    let fileCount = 0;
    const breakdown = { docs: 0, images: 0, audio: 0, other: 0 };
    let continuationToken: string | undefined;

    do {
      const res = await r2.send(
        new ListObjectsV2Command({
          Bucket: R2_BUCKET,
          Prefix: `${userId}/`,
          ContinuationToken: continuationToken,
          MaxKeys: 1000,
        })
      );

      for (const obj of res.Contents ?? []) {
        const size = obj.Size ?? 0;
        totalBytes += size;
        fileCount++;
        const category = categorize(obj.Key ?? '');
        breakdown[category] += size;
      }

      continuationToken = res.NextContinuationToken;
    } while (continuationToken);

    return NextResponse.json({ totalBytes, breakdown, fileCount });
  } catch (err: any) {
    // Return empty usage on network/R2 SSL issues rather than crashing the page with 500
    console.warn('[R2] storage usage warning (falling back to 0 bytes):', err?.message || err);
    return NextResponse.json({
      totalBytes: 0,
      breakdown: { docs: 0, images: 0, audio: 0, other: 0 },
      fileCount: 0,
      isUnavailable: true,
    });
  }
}
