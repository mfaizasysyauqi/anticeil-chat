import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CoAuthorSession } from '@/features/docs/store/useCoAuthorHistoryStore';

function getSupabase(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

// GET /api/docs/coauthor-history?docId=xxx
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const docId = req.nextUrl.searchParams.get('docId');
    if (!docId) return NextResponse.json({ error: 'docId required' }, { status: 400 });

    const supabase = getSupabase(token);
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: sessionRow } = await supabase
      .from('coauthor_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('doc_id', docId)
      .single();

    if (!sessionRow) return NextResponse.json(null);

    const { data: msgs } = await supabase
      .from('coauthor_messages')
      .select('*')
      .eq('session_id', sessionRow.id)
      .order('timestamp', { ascending: true });

    const session: CoAuthorSession = {
      docId: sessionRow.doc_id,
      docTitle: sessionRow.doc_title,
      createdAt: new Date(sessionRow.created_at).getTime(),
      updatedAt: new Date(sessionRow.updated_at).getTime(),
      messages: (msgs || []).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        reasoningContent: m.reasoning_content || undefined,
        actions: m.actions || undefined,
        snapshotId: m.snapshot_id || undefined,
        reverted: m.reverted || false,
        timestamp: Number(m.timestamp),
      })),
    };

    return NextResponse.json(session);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

// POST /api/docs/coauthor-history — upsert session + all messages
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getSupabase(token);
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body: { session: CoAuthorSession } = await req.json();
    const { session } = body;
    if (!session?.docId) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    const sessionId = `${user.id}_${session.docId}`;

    await supabase.from('coauthor_sessions').upsert(
      {
        id: sessionId,
        user_id: user.id,
        doc_id: session.docId,
        doc_title: session.docTitle,
        created_at: new Date(session.createdAt).toISOString(),
        updated_at: new Date(session.updatedAt).toISOString(),
      },
      { onConflict: 'id' }
    );

    if (session.messages.length > 0) {
      const rows = session.messages.map((m) => ({
        id: m.id,
        session_id: sessionId,
        user_id: user.id,
        role: m.role,
        content: m.content,
        reasoning_content: m.reasoningContent || null,
        actions: m.actions || null,
        snapshot_id: m.snapshotId || null,
        reverted: m.reverted || false,
        timestamp: m.timestamp,
        created_at: new Date(m.timestamp).toISOString(),
      }));
      await supabase.from('coauthor_messages').upsert(rows, { onConflict: 'id' });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

// DELETE /api/docs/coauthor-history?docId=xxx
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const docId = req.nextUrl.searchParams.get('docId');
    if (!docId) return NextResponse.json({ error: 'docId required' }, { status: 400 });

    const supabase = getSupabase(token);
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sessionId = `${user.id}_${docId}`;
    await supabase.from('coauthor_messages').delete().eq('session_id', sessionId);
    await supabase.from('coauthor_sessions').delete().eq('id', sessionId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
