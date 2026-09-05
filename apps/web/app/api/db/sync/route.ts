import { NextRequest, NextResponse } from 'next/server';
import { ChatMessage, ChatSession } from '@anticeil/core';
import { getSupabaseWithToken } from '@/shared/utils/supabase/tokenClient';

// GET /api/db/sync — Fetch all sessions, messages, and folders for Pro tier live sync
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getSupabaseWithToken(token);
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = user.id;

    const [sessionsRes, messagesRes, foldersRes] = await Promise.allSettled([
      supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: true }),
      supabase
        .from('project_folders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),
    ]);

    const sessions: ChatSession[] =
      sessionsRes.status === 'fulfilled' && Array.isArray(sessionsRes.value.data)
        ? sessionsRes.value.data.map((s) => ({
            id: s.id,
            userId: s.user_id,
            title: s.title,
            providerId: s.provider_id,
            modelId: s.model_id,
            systemPrompt: s.system_prompt || '',
            createdAt: new Date(s.created_at).getTime(),
            updatedAt: new Date(s.updated_at).getTime(),
            temperature: s.temperature ?? 0.7,
            maxTokens: s.max_tokens,
            isPinned: s.is_pinned ?? false,
            projectId: s.project_id || undefined,
          }))
        : [];

    const messagesBySession: Record<string, ChatMessage[]> = {};
    if (messagesRes.status === 'fulfilled' && Array.isArray(messagesRes.value.data)) {
      for (const m of messagesRes.value.data) {
        const item: ChatMessage = {
          id: m.id,
          sessionId: m.session_id,
          role: m.role,
          content: m.content,
          reasoningContent: m.reasoning_content || undefined,
          timestamp: Number(m.timestamp) || new Date(m.created_at).getTime(),
          tokensUsed: m.tokens_used || undefined,
          estimatedCostUsd: m.estimated_cost_usd || undefined,
          status: m.status || 'done',
          error: m.error || undefined,
          attachments: m.attachments || undefined,
          imageUrl: m.image_url || undefined,
          videoUrl: m.video_url || undefined,
          toolResults: m.toolResults || undefined,
          versions: m.versions || undefined,
          versionIndex: m.version_index ?? 0,
          branchContents: m.branch_contents || undefined,
          branchReasoningContents: m.branch_reasoning_contents || undefined,
        };
        if (!messagesBySession[m.session_id]) messagesBySession[m.session_id] = [];
        messagesBySession[m.session_id].push(item);
      }
    }

    const folders =
      foldersRes.status === 'fulfilled' && Array.isArray(foldersRes.value.data)
        ? foldersRes.value.data.map((f) => ({
            id: f.id,
            name: f.name,
            createdAt: new Date(f.created_at).getTime(),
            sessionIds: Array.isArray(f.session_ids) ? f.session_ids : [],
          }))
        : [];

    return NextResponse.json({
      sessions,
      messages: messagesBySession,
      folders,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Sync failed' }, { status: 500 });
  }
}

// POST /api/db/sync — Upsert single session with its messages
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getSupabaseWithToken(token);
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = user.id;

    const { session, messages } = (await req.json()) as {
      session?: ChatSession;
      messages?: ChatMessage[];
    };

    if (session) {
      await supabase.from('chat_sessions').upsert(
        {
          id: session.id,
          user_id: userId,
          title: session.title,
          provider_id: session.providerId,
          model_id: session.modelId,
          system_prompt: session.systemPrompt || '',
          temperature: session.temperature ?? 0.7,
          max_tokens: session.maxTokens ?? null,
          is_pinned: Boolean(session.isPinned),
          project_id: session.projectId || null,
          created_at: new Date(session.createdAt).toISOString(),
          updated_at: new Date(session.updatedAt || Date.now()).toISOString(),
        },
        { onConflict: 'id' }
      );
    }

    if (Array.isArray(messages) && messages.length > 0) {
      const rows = messages.map((m) => ({
        id: m.id,
        session_id: m.sessionId,
        user_id: userId,
        role: m.role,
        content: m.content,
        reasoning_content: m.reasoningContent || null,
        timestamp: m.timestamp,
        tokens_used: m.tokensUsed || null,
        estimated_cost_usd: m.estimatedCostUsd || null,
        status: m.status || 'done',
        error: m.error || null,
        attachments: m.attachments || null,
        image_url: m.imageUrl || null,
        video_url: m.videoUrl || null,
        tool_results: m.toolResults || null,
        versions: m.versions || null,
        version_index: m.versionIndex ?? 0,
        branch_contents: m.branchContents || null,
        branch_reasoning_contents: m.branchReasoningContents || null,
        created_at: new Date(m.timestamp || Date.now()).toISOString(),
      }));

      await supabase.from('chat_messages').upsert(rows, { onConflict: 'id' });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to sync session' }, { status: 500 });
  }
}
