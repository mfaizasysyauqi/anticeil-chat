import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

// GET /api/automations/workflows — list all workflows for the authenticated user
export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabase(token);
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { data, error } = await supabase
      .from('automations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist yet, return empty list gracefully
      console.warn('Supabase automations table query notice:', error.message);
      return NextResponse.json({ workflows: [] });
    }

    const workflows = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      trigger: row.trigger || 'Manual',
      action: row.action || 'AI Execution',
      status: row.status || 'active',
      lastRun: row.last_run ? new Date(row.last_run).toLocaleString() : 'Belum pernah',
      runsCount: row.runs_count || 0,
      categoryId: row.category_id || null,
      nodes: row.nodes || [],
      edges: row.edges || [],
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
    }));

    return NextResponse.json({ workflows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, workflows: [] }, { status: 200 });
  }
}

// POST /api/automations/workflows — create or save a workflow
export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabase(token);
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = body.id || `wf_${Date.now().toString(36)}`;
  const name = typeof body.name === 'string' ? body.name.trim() : 'New Workflow';

  try {
    const { data, error } = await supabase
      .from('automations')
      .upsert({
        id,
        user_id: user.id,
        name,
        description: body.description || '',
        trigger: body.trigger || 'Manual Trigger',
        action: body.action || 'AI Processing',
        status: body.status || 'active',
        runs_count: body.runsCount || 0,
        category_id: body.categoryId || null,
        nodes: body.nodes || [],
        edges: body.edges || [],
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      console.warn('Supabase automations insert notice:', error.message);
      // Return client object so local UI is completely responsive
      return NextResponse.json({
        workflow: {
          id,
          name,
          description: body.description || '',
          trigger: body.trigger || 'Manual Trigger',
          action: body.action || 'AI Processing',
          status: body.status || 'active',
          runsCount: body.runsCount || 0,
          categoryId: body.categoryId || null,
          nodes: body.nodes || [],
          edges: body.edges || [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      }, { status: 201 });
    }

    return NextResponse.json({
      workflow: {
        id: data.id,
        name: data.name,
        description: data.description,
        trigger: data.trigger,
        action: data.action,
        status: data.status,
        runsCount: data.runs_count || 0,
        categoryId: data.category_id,
        nodes: data.nodes || [],
        edges: data.edges || [],
        createdAt: new Date(data.created_at).getTime(),
        updatedAt: new Date(data.updated_at || data.created_at).getTime(),
      },
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
