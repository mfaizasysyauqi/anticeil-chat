import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  return createClient(url, key);
}

function generateShareId(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let result = 's_';
  for (let i = 0; i < 9; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action = 'create',
      shareId,
      projectId,
      userId,
      title = 'Untitled Document',
      format = 'latex',
      previewData = '',
      sourceCode = '',
      files = [],
      durationDays = 14,
    } = body;

    if (!projectId && !shareId) {
      return NextResponse.json({ error: 'projectId or shareId is required' }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({
        error: 'Supabase configuration missing',
        mock: true,
      }, { status: 500 });
    }

    // ── 1. STATUS: Check existing share status for project ───────────────────
    if (action === 'status') {
      const { data: existing, error } = await supabase
        .from('doc_shares')
        .select('id, project_id, title, format, created_at, updated_at, expires_at, is_active, view_count')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!existing || !existing.is_active) {
        return NextResponse.json({ share: null });
      }

      const isExpired = new Date(existing.expires_at).getTime() < Date.now();
      return NextResponse.json({
        share: {
          id: existing.id,
          projectId: existing.project_id,
          title: existing.title,
          format: existing.format,
          createdAt: existing.created_at,
          updatedAt: existing.updated_at,
          expiresAt: existing.expires_at,
          isActive: existing.is_active && !isExpired,
          isExpired,
          viewCount: existing.view_count || 0,
        },
      });
    }

    // ── 2. DISABLE / DELETE: Turn off link sharing ──────────────────────────
    if (action === 'disable' || action === 'delete') {
      let query = supabase.from('doc_shares').update({ is_active: false });
      if (shareId) {
        query = query.eq('id', shareId);
      } else if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { error } = await query;
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Share link disabled' });
    }

    // ── 3. UPDATE: Overwrite snapshot on same share_id (preserving expires_at) ─
    if (action === 'update') {
      // Find existing active share to preserve initial expires_at & created_at
      let query = supabase.from('doc_shares').select('*');
      if (shareId) {
        query = query.eq('id', shareId);
      } else {
        query = query.eq('project_id', projectId);
      }

      const { data: existing, error: findError } = await query
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (findError || !existing) {
        return NextResponse.json({ error: 'Existing share link not found to update' }, { status: 404 });
      }

      const cleanFiles = Array.isArray(files)
        ? files
            .filter((f) => f && f.name && !f.name.startsWith('assets/'))
            .map((f) => ({ id: f.id, name: f.name, content: f.content || '' }))
        : [];

      const { data: updated, error: updateError } = await supabase
        .from('doc_shares')
        .update({
          title,
          format,
          preview_data: previewData,
          source_code: sourceCode,
          files: cleanFiles,
          updated_at: new Date().toISOString(),
          is_active: true,
        })
        .eq('id', existing.id)
        .select('id, project_id, title, format, created_at, updated_at, expires_at, is_active, view_count')
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Shared version updated successfully',
        share: {
          id: updated.id,
          projectId: updated.project_id,
          title: updated.title,
          format: updated.format,
          createdAt: updated.created_at,
          updatedAt: updated.updated_at,
          expiresAt: updated.expires_at,
          isActive: updated.is_active,
          viewCount: updated.view_count || 0,
        },
      });
    }

    // ── 4. CREATE: Generate new snapshot share with stable share_id ─────────
    // Check if one already exists for this project
    const { data: existing } = await supabase
      .from('doc_shares')
      .select('id, expires_at, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const targetShareId = existing?.id || shareId || generateShareId();
    const days = [7, 14, 30].includes(Number(durationDays)) ? Number(durationDays) : 14;
    
    // If it exists, keep original expires_at unless expired; if fresh, compute now + days
    let expiresAt: string;
    if (existing?.expires_at && new Date(existing.expires_at).getTime() > Date.now()) {
      expiresAt = existing.expires_at;
    } else {
      expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    }

    const cleanFiles = Array.isArray(files)
      ? files
          .filter((f) => f && f.name && !f.name.startsWith('assets/'))
          .map((f) => ({ id: f.id, name: f.name, content: f.content || '' }))
      : [];

    const payload = {
      id: targetShareId,
      project_id: projectId,
      user_id: userId || null,
      title,
      format,
      preview_data: previewData,
      source_code: sourceCode,
      files: cleanFiles,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
      is_active: true,
    };

    const { data: saved, error: saveError } = await supabase
      .from('doc_shares')
      .upsert(payload, { onConflict: 'id' })
      .select('id, project_id, title, format, created_at, updated_at, expires_at, is_active, view_count')
      .single();

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Share link created successfully',
      share: {
        id: saved.id,
        projectId: saved.project_id,
        title: saved.title,
        format: saved.format,
        createdAt: saved.created_at,
        updatedAt: saved.updated_at,
        expiresAt: saved.expires_at,
        isActive: saved.is_active,
        viewCount: saved.view_count || 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
