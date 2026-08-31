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

// GET /api/docs/[id]/share — Get sharing settings & collaborators for a document
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: docId } = await params;
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const supabase = getSupabase(token);

    if (!supabase) {
      // Offline / Local database mode fallback
      return NextResponse.json({
        id: docId,
        isLinkSharingOn: true,
        viewToken: `v_${docId}`,
        editToken: `e_${docId}`,
        collaborators: [],
        ownerEmail: 'm.faizasysyauqi@gmail.com',
      });
    }

    const { data: doc, error } = await supabase
      .from('documents')
      .select('id, user_id, title, is_link_sharing_on, view_token, edit_token, collaborators, created_at')
      .eq('id', docId)
      .single();

    if (error || !doc) {
      return NextResponse.json({
        id: docId,
        isLinkSharingOn: true,
        viewToken: `v_${docId}`,
        editToken: `e_${docId}`,
        collaborators: [],
      });
    }

    // Get owner email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', doc.user_id)
      .single();

    return NextResponse.json({
      id: doc.id,
      isLinkSharingOn: doc.is_link_sharing_on ?? true,
      viewToken: doc.view_token || `v_${doc.id}`,
      editToken: doc.edit_token || `e_${doc.id}`,
      collaborators: Array.isArray(doc.collaborators) ? doc.collaborators : [],
      ownerEmail: profile?.email || 'Owner',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch share settings' }, { status: 500 });
  }
}

// POST /api/docs/[id]/share — Update sharing config and collaborators
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: docId } = await params;
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const body = await req.json();
    const { isLinkSharingOn, collaborators, viewToken, editToken } = body;

    const supabase = getSupabase(token);

    if (!supabase) {
      // Local fallback success
      return NextResponse.json({ success: true, isLinkSharingOn, collaborators });
    }

    // Update in Supabase documents table
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (typeof isLinkSharingOn === 'boolean') updatePayload.is_link_sharing_on = isLinkSharingOn;
    if (Array.isArray(collaborators)) updatePayload.collaborators = collaborators;
    if (viewToken) updatePayload.view_token = viewToken;
    if (editToken) updatePayload.edit_token = editToken;

    const { error } = await supabase
      .from('documents')
      .update(updatePayload)
      .eq('id', docId);

    if (error) {
      console.warn('[DocShare API] Supabase update warning:', error.message);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update share config' }, { status: 500 });
  }
}
