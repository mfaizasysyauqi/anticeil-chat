import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase(token?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  });
}

// GET /api/docs/share/[token] — Fetch shared document content and subfiles by token
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: shareToken } = await params;
    const isEdit = shareToken.startsWith('e_');
    const isView = shareToken.startsWith('v_');

    const authToken = req.headers.get('authorization')?.replace('Bearer ', '');
    const supabase = getSupabase(authToken);

    if (!supabase) {
      // Fallback
      return NextResponse.json({
        error: 'Offline mode — open document directly in Anticeil Studio',
        token: shareToken,
        mode: isEdit ? 'edit' : 'view',
      }, { status: 200 });
    }

    // Query document by view_token, edit_token, or doc id
    let query = supabase.from('documents').select('*');
    if (isEdit) {
      query = query.eq('edit_token', shareToken);
    } else if (isView) {
      query = query.eq('view_token', shareToken);
    } else {
      query = query.eq('id', shareToken);
    }

    const { data: doc, error } = await query.single();

    if (error || !doc) {
      return NextResponse.json({ error: 'Document not found or link has expired' }, { status: 404 });
    }

    if (!doc.is_link_sharing_on) {
      return NextResponse.json({ error: 'Link sharing is turned off for this document' }, { status: 403 });
    }

    return NextResponse.json({
      document: {
        id: doc.id,
        title: doc.title,
        content: doc.content,
        format: doc.format,
        files: doc.files || [],
        activeFileId: doc.active_file_id,
        updatedAt: new Date(doc.updated_at).getTime(),
        accessMode: isEdit ? 'edit' : 'view',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch shared document' }, { status: 500 });
  }
}
