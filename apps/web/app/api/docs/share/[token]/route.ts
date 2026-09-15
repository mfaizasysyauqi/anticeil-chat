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

// GET /api/docs/share/[token] — Fetch shared document snapshot or document by token
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: shareToken } = await params;
    if (!shareToken) {
      return NextResponse.json({ error: 'Share token is required' }, { status: 400 });
    }

    const authToken = req.headers.get('authorization')?.replace('Bearer ', '');
    const supabase = getSupabase(authToken);

    if (!supabase) {
      return NextResponse.json({
        error: 'Offline mode — snapshot not available',
        token: shareToken,
      }, { status: 200 });
    }

    // ── 1. First check doc_shares table (View-Only Snapshot Sharing) ─────────
    const { data: shareRow, error: shareErr } = await supabase
      .from('doc_shares')
      .select('*')
      .eq('id', shareToken)
      .maybeSingle();

    if (shareRow) {
      if (!shareRow.is_active) {
        return NextResponse.json({
          error: 'inactive',
          message: 'Tautan berbagi ini telah dinonaktifkan oleh pemilik dokumen.',
        }, { status: 403 });
      }

      const isExpired = new Date(shareRow.expires_at).getTime() < Date.now();
      if (isExpired) {
        return NextResponse.json({
          error: 'expired',
          message: 'Tautan berbagi ini telah kedaluwarsa.',
          title: shareRow.title,
          expiresAt: shareRow.expires_at,
          updatedAt: shareRow.updated_at,
        }, { status: 410 });
      }

      // Increment view count asynchronously
      supabase
        .from('doc_shares')
        .update({ view_count: (shareRow.view_count || 0) + 1 })
        .eq('id', shareRow.id)
        .then(() => {});

      return NextResponse.json({
        type: 'snapshot',
        share: {
          id: shareRow.id,
          projectId: shareRow.project_id,
          title: shareRow.title || 'Untitled Document',
          format: shareRow.format || 'latex',
          previewData: shareRow.preview_data || '',
          sourceCode: shareRow.source_code || '',
          files: shareRow.files || [],
          createdAt: shareRow.created_at,
          updatedAt: shareRow.updated_at,
          expiresAt: shareRow.expires_at,
          viewCount: (shareRow.view_count || 0) + 1,
        },
      });
    }

    // ── 2. Fallback: Legacy documents table check ────────────────────────────
    const isEdit = shareToken.startsWith('e_');
    const isView = shareToken.startsWith('v_');

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
      return NextResponse.json({
        error: 'not_found',
        message: 'Dokumen tidak ditemukan atau link tidak valid.',
        token: shareToken,
      }, { status: 404 });
    }

    if (!doc.is_link_sharing_on) {
      return NextResponse.json({
        error: 'inactive',
        message: 'Tautan berbagi dinonaktifkan untuk dokumen ini.',
      }, { status: 403 });
    }

    return NextResponse.json({
      type: 'document',
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
