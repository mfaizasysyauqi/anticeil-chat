import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DocHistorySnapshot } from '@/features/docs/store/useDocsStore';

function getSupabase(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

// GET /api/docs/versions?docId=xxx
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const docId = req.nextUrl.searchParams.get('docId');
    if (!docId) return NextResponse.json({ error: 'docId required' }, { status: 400 });

    const supabase = getSupabase(token);
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Try querying doc_versions table
    const { data: rows, error: versionsErr } = await supabase
      .from('doc_versions')
      .select('*')
      .eq('doc_id', docId)
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });

    if (!versionsErr && rows && rows.length > 0) {
      const snapshots: DocHistorySnapshot[] = rows.map((r) => ({
        id: r.id,
        docId: r.doc_id,
        timestamp: Number(r.timestamp),
        description: r.description || 'Checkpoint',
        label: r.label || undefined,
        isNamed: Boolean(r.is_named),
        authorEmail: r.author_email || undefined,
        authorName: r.author_name || undefined,
        totalWords: r.total_words ? Number(r.total_words) : undefined,
        totalChars: r.total_chars ? Number(r.total_chars) : undefined,
        doc: r.doc_data,
      }));
      return NextResponse.json({ snapshots });
    }

    // 2. Fallback: check document's history column
    const { data: docRow } = await supabase
      .from('documents')
      .select('history')
      .eq('id', docId)
      .single();

    if (docRow?.history && Array.isArray(docRow.history)) {
      return NextResponse.json({ snapshots: docRow.history });
    }

    return NextResponse.json({ snapshots: [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

// POST /api/docs/versions — sync snapshots
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getSupabase(token);
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body: { docId: string; snapshots: DocHistorySnapshot[] } = await req.json();
    const { docId, snapshots } = body;
    if (!docId || !Array.isArray(snapshots)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 1. Try upserting to doc_versions table
    if (snapshots.length > 0) {
      const rows = snapshots.map((s) => ({
        id: s.id,
        user_id: user.id,
        doc_id: docId,
        timestamp: s.timestamp,
        description: s.description,
        label: s.label || null,
        is_named: Boolean(s.isNamed || s.label),
        author_name: s.authorName || 'You',
        author_email: s.authorEmail || user.email,
        total_words: s.totalWords || null,
        total_chars: s.totalChars || null,
        doc_data: s.doc,
        created_at: new Date(s.timestamp).toISOString(),
      }));

      const { error: upsertErr } = await supabase
        .from('doc_versions')
        .upsert(rows, { onConflict: 'id' });

      // If doc_versions table does not exist or fails, fallback to updating document's history column
      if (upsertErr) {
        await supabase
          .from('documents')
          .update({ history: snapshots, updated_at: new Date().toISOString() })
          .eq('id', docId);
      }
    }

    return NextResponse.json({ success: true, count: snapshots.length });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

// DELETE /api/docs/versions?docId=xxx&snapshotId=yyy
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const docId = req.nextUrl.searchParams.get('docId');
    const snapshotId = req.nextUrl.searchParams.get('snapshotId');
    if (!docId) return NextResponse.json({ error: 'docId required' }, { status: 400 });

    const supabase = getSupabase(token);
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (snapshotId) {
      await supabase.from('doc_versions').delete().eq('id', snapshotId).eq('user_id', user.id);
    } else {
      await supabase.from('doc_versions').delete().eq('doc_id', docId).eq('user_id', user.id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
