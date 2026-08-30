import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AnticeilDatabaseBackup, ChatMessage, ChatSession, ProjectFolderData } from '@anticeil/core';

function getSupabase(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export const dynamic = 'force-dynamic';

// GET /api/db/export — Export all Supabase cloud data for authenticated user
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 });

    const supabase = getSupabase(token);
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized: invalid session' }, { status: 401 });
    }

    const userId = user.id;

    // Fetch user profile (tier)
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', userId)
      .maybeSingle();

    const tier = (profile?.tier as 'free' | 'pro') || 'free';

    // Fetch all user database tables in parallel
    const [
      sessionsRes,
      messagesRes,
      foldersRes,
      promptsRes,
      connectorsRes,
      workspaceRes,
    ] = await Promise.allSettled([
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
      supabase
        .from('user_prompts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),
      supabase
        .from('user_connectors')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('workspace_data')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
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
          toolResults: m.tool_results || undefined,
          versions: m.versions || undefined,
          versionIndex: m.version_index ?? 0,
          branchContents: m.branch_contents || undefined,
          branchReasoningContents: m.branch_reasoning_contents || undefined,
        };
        if (!messagesBySession[m.session_id]) {
          messagesBySession[m.session_id] = [];
        }
        messagesBySession[m.session_id].push(item);
      }
    }

    const folders: ProjectFolderData[] =
      foldersRes.status === 'fulfilled' && Array.isArray(foldersRes.value.data)
        ? foldersRes.value.data.map((f) => ({
            id: f.id,
            name: f.name,
            createdAt: new Date(f.created_at).getTime(),
            sessionIds: Array.isArray(f.session_ids) ? f.session_ids : [],
          }))
        : [];

    const personas =
      promptsRes.status === 'fulfilled' && Array.isArray(promptsRes.value.data)
        ? promptsRes.value.data.map((p) => ({
            id: p.id,
            name: p.title,
            icon: p.icon || '💡',
            description: p.description || '',
            systemPrompt: p.system_prompt || p.content || '',
            defaultTemperature: p.default_temperature ?? 0.7,
            suggestedStarters: Array.isArray(p.suggested_starters) ? p.suggested_starters : [],
            category: p.category || 'general',
          }))
        : [];

    const connectorsMap: Record<string, any> = {};
    if (connectorsRes.status === 'fulfilled' && Array.isArray(connectorsRes.value.data)) {
      for (const c of connectorsRes.value.data) {
        connectorsMap[c.connector_id] = c.config;
      }
    }

    const workspaceData =
      workspaceRes.status === 'fulfilled' && workspaceRes.value.data?.data
        ? workspaceRes.value.data.data
        : undefined;

    const backupPayload: AnticeilDatabaseBackup = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      source: 'cloud',
      tier,
      userId,
      data: {
        sessions,
        messages: messagesBySession,
        folders,
        personas,
        connectors: connectorsMap,
        workspace: workspaceData,
      },
    };

    return NextResponse.json(backupPayload);
  } catch (err: any) {
    console.error('[Export Cloud DB Error]:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to export cloud database' },
      { status: 500 }
    );
  }
}
