import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * POST /api/docs/share/validate-edit
 * Body: { docId: string; editToken: string }
 * Returns: { valid: boolean; docId?: string }
 *
 * Validates an edit-collaboration token against Supabase document_shares table.
 * Used when a user opens a doc via an edit-link to verify the token is still active.
 */
export async function POST(req: NextRequest) {
  try {
    const { docId, editToken } = await req.json();

    if (!docId || !editToken) {
      return NextResponse.json({ valid: false, error: 'Missing docId or editToken' }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      // Local-first fallback if Supabase not configured
      return NextResponse.json({ valid: true, docId });
    }

    const { data, error } = await supabase
      .from('document_shares')
      .select('id, expires_at, revoked')
      .eq('doc_id', docId)
      .eq('token', editToken)
      .eq('access_type', 'edit')
      .single();

    if (error || !data) {
      return NextResponse.json({ valid: false });
    }

    if (data.revoked) {
      return NextResponse.json({ valid: false, error: 'Link has been revoked' });
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Link has expired' });
    }

    return NextResponse.json({ valid: true, docId });
  } catch {
    return NextResponse.json({ valid: false, error: 'Server error' }, { status: 500 });
  }
}
