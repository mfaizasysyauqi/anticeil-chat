import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import { r2, R2_BUCKET, r2Key, r2PublicUrl } from '../../../../src/lib/r2';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');

    // Identify user via Supabase Auth
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const {
      data: { user },
    } = await supabase.auth.getUser(token ?? '');

    const userId = user?.id || 'anonymous';

    const body = await req.json();
    const {
      type = 'image',
      prompt = '',
      mediaUrl,
      base64Data,
      metadata = {},
    } = body;

    let buffer: Buffer | null = null;
    let contentType = 'image/png';
    let fileExt = 'png';
    const category = type === 'audio' ? 'audio' : type === 'video' ? 'videos' : 'images';

    if (type === 'audio') {
      contentType = 'audio/wav';
      fileExt = 'wav';
    } else if (type === 'video') {
      contentType = 'video/mp4';
      fileExt = 'mp4';
    } else {
      contentType = 'image/png';
      fileExt = 'png';
    }

    // 1. Obtain binary buffer
    if (base64Data) {
      const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
      buffer = Buffer.from(cleanBase64, 'base64');
    } else if (mediaUrl) {
      try {
        const response = await fetch(mediaUrl, {
          headers: { 'User-Agent': 'Anticeil-Studio/1.0' },
        });
        if (response.ok) {
          const ab = await response.arrayBuffer();
          buffer = Buffer.from(ab);
          const ct = response.headers.get('content-type');
          if (ct) contentType = ct;
          if (contentType.includes('jpeg') || contentType.includes('jpg')) fileExt = 'jpg';
          else if (contentType.includes('webp')) fileExt = 'webp';
          else if (contentType.includes('mp4')) fileExt = 'mp4';
          else if (contentType.includes('wav')) fileExt = 'wav';
        }
      } catch (fetchErr: any) {
        console.warn('[Imagine Save] Failed to fetch remote mediaUrl:', fetchErr?.message);
      }
    }

    let r2SavedKey = '';
    let publicUrl = mediaUrl || '';

    // 2. Upload to Cloudflare R2 if buffer exists and R2 credentials are configured
    if (buffer && buffer.length > 0) {
      try {
        if (process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
          const safeName = prompt.slice(0, 30).replace(/[^a-zA-Z0-9_-]/g, '_') || type;
          const key = r2Key(userId, category, `${Date.now()}-${safeName}.${fileExt}`);

          await r2.send(
            new PutObjectCommand({
              Bucket: R2_BUCKET,
              Key: key,
              Body: buffer,
              ContentType: contentType,
              ContentLength: buffer.length,
            })
          );

          r2SavedKey = key;
          const generatedPublicUrl = r2PublicUrl(key);
          if (generatedPublicUrl) {
            publicUrl = generatedPublicUrl;
          }
        }
      } catch (r2Err: any) {
        console.warn('[Imagine Save] R2 upload error:', r2Err?.message || r2Err);
      }
    }

    // 3. Record in Supabase imagine_generations (if user is authenticated)
    if (user) {
      try {
        await supabase.from('imagine_generations').insert({
          user_id: user.id,
          prompt,
          metadata: {
            ...metadata,
            r2_key: r2SavedKey || undefined,
            url: publicUrl,
            size: buffer?.length || 0,
            type,
            created_at: new Date().toISOString(),
          },
        });
      } catch (dbErr: any) {
        console.warn('[Imagine Save] Supabase insert warning:', dbErr?.message);
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      key: r2SavedKey,
      size: buffer?.length || 0,
      type,
    });
  } catch (err: any) {
    console.error('[Imagine Save Media] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to save media' },
      { status: 500 }
    );
  }
}
