import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

// PATCH /api/automations/workflows/[id] — update a workflow
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabase(token);
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  try {
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updatePayload.name = body.name;
    if (body.description !== undefined) updatePayload.description = body.description;
    if (body.trigger !== undefined) updatePayload.trigger = body.trigger;
    if (body.action !== undefined) updatePayload.action = body.action;
    if (body.status !== undefined) updatePayload.status = body.status;
    if (body.runsCount !== undefined) updatePayload.runs_count = body.runsCount;
    if (body.categoryId !== undefined) updatePayload.category_id = body.categoryId;
    if (body.nodes !== undefined) updatePayload.nodes = body.nodes;
    if (body.edges !== undefined) updatePayload.edges = body.edges;

    const { error } = await supabase
      .from('automations')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.warn('Supabase automations update notice:', error.message);
    }

    return NextResponse.json({ success: true, id, ...body });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/automations/workflows/[id] — delete a workflow
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabase(token);
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { error } = await supabase
      .from('automations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.warn('Supabase automations delete notice:', error.message);
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
