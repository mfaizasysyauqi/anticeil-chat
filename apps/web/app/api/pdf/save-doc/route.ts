import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { r2Key, r2PublicUrl, uploadToWorkerR2 } from '../../../../src/lib/r2';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');

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
      name = `document-${Date.now()}.pdf`,
      toolType = 'pdf',
      base64Data,
      categoryId,
      isPinned = false,
      size = 0,
    } = body;

    let buffer: Buffer | null = null;
    const contentType = 'application/pdf';

    if (base64Data) {
      const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
      buffer = Buffer.from(cleanBase64, 'base64');
    }

    if (!buffer) {
      return NextResponse.json({ error: 'No PDF data provided' }, { status: 400 });
    }

    const calculatedSize = buffer.byteLength || size;
    const key = r2Key(userId, 'docs', 'pdf');
    let savedUrl = '';

    // 1. Upload to Cloudflare R2 via Worker Bridge or S3
    const uploadRes = await uploadToWorkerR2(key, buffer, contentType);
    if (uploadRes && uploadRes.success) {
      savedUrl = (uploadRes as any).url || r2PublicUrl(key);
    } else {
      savedUrl = r2PublicUrl(key);
    }

    const docId = `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    // 2. Persist metadata into Supabase pdf_documents table if available
    if (userId !== 'anonymous') {
      try {
        await supabase.from('pdf_documents').insert({
          id: docId,
          user_id: userId,
          filename: name,
          file_size: calculatedSize,
          storage_key: key,
          storage_url: savedUrl,
          category_id: categoryId || null,
          is_pinned: isPinned,
          tool_type: toolType,
          created_at: now,
        });
      } catch (dbErr) {
        console.warn('[PDF Save] Supabase insert warning (fallback to client store):', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      document: {
        id: docId,
        name,
        toolType,
        url: savedUrl,
        r2Key: key,
        size: calculatedSize,
        categoryId: categoryId || null,
        isPinned,
        createdAt: now,
      },
    });
  } catch (err: any) {
    console.error('[PDF Save Error]:', err);
    return NextResponse.json({ error: err?.message || 'Failed to save PDF' }, { status: 500 });
  }
}
