import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClient } from '@supabase/supabase-js';
import { r2, R2_BUCKET, r2Key } from '../../../../src/lib/r2';

/**
 * POST /api/storage/upload
 * Body: { filename: string, contentType: string, category: string, size: number }
 * Returns: { uploadUrl: string, key: string, publicUrl: string }
 *
 * Client uploads the file directly to R2 via the presigned PUT URL.
 * This keeps the Next.js server lightweight — no file bytes flow through it.
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');

    // Identify user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await supabase.auth.getUser(token ?? '');
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { filename, contentType, category = 'other', size } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'filename and contentType are required' }, { status: 400 });
    }

    // 1 GB quota guard (server-side double check)
    const ONE_GB = 1024 * 1024 * 1024;
    if (typeof size === 'number' && size > ONE_GB) {
      return NextResponse.json({ error: 'File exceeds 1 GB quota' }, { status: 413 });
    }

    // Build unique key: userId/category/timestamp-filename
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = r2Key(user.id, category, `${Date.now()}-${safeFilename}`);

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    });

    // Presigned URL valid for 5 minutes
    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });

    const publicUrl = process.env.R2_PUBLIC_URL
      ? `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`
      : null;

    return NextResponse.json({ uploadUrl, key, publicUrl });
  } catch (err: any) {
    console.error('[R2] upload presign error:', err);
    return NextResponse.json({ error: err?.message ?? 'Failed' }, { status: 500 });
  }
}
