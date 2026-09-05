import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseWithToken } from '@/shared/utils/supabase/tokenClient';

export const dynamic = 'force-dynamic';

// POST /api/db/purge — Purge user database records from Supabase Cloud after migrating to local
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 });

    const supabase = getSupabaseWithToken(token);
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized: invalid session' }, { status: 401 });
    }

    const userId = user.id;

    // Delete child records first, then parents
    const [messagesRes, sessionsRes, foldersRes, promptsRes, connectorsRes, workspaceRes, personasRes] =
      await Promise.allSettled([
        supabase.from('chat_messages').delete().eq('user_id', userId),
        supabase.from('chat_sessions').delete().eq('user_id', userId),
        supabase.from('project_folders').delete().eq('user_id', userId),
        supabase.from('user_prompts').delete().eq('user_id', userId),
        supabase.from('connectors').delete().eq('user_id', userId),
        supabase.from('workspace_files').delete().eq('user_id', userId),
        supabase.from('personas').delete().eq('user_id', userId),
      ]);

    return NextResponse.json({
      success: true,
      message: 'Cloud database records purged successfully',
      purged: {
        messages: messagesRes.status === 'fulfilled',
        sessions: sessionsRes.status === 'fulfilled',
        folders: foldersRes.status === 'fulfilled',
        prompts: promptsRes.status === 'fulfilled',
        connectors: connectorsRes.status === 'fulfilled',
        workspace: workspaceRes.status === 'fulfilled',
        personas: personasRes.status === 'fulfilled',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to purge cloud database' }, { status: 500 });
  }
}
