import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AnticeilDatabaseBackup } from '@anticeil/core';

function getSupabase(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export const dynamic = 'force-dynamic';

// POST /api/db/import — Import an AnticeilDatabaseBackup JSON into Supabase
export async function POST(req: NextRequest) {
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
    const body = await req.json();
    const mode: 'merge' | 'replace' = body.mode === 'replace' ? 'replace' : 'merge';
    const backup: AnticeilDatabaseBackup = body.backup || body;

    if (!backup || !backup.data) {
      return NextResponse.json({ error: 'Invalid backup format: missing data payload' }, { status: 400 });
    }

    const { sessions = [], messages = {}, folders = [], personas = [], connectors = {}, workspace } =
      backup.data;

    // If replace mode, wipe existing records for this user first
    if (mode === 'replace') {
      await Promise.allSettled([
        supabase.from('chat_messages').delete().eq('user_id', userId),
        supabase.from('chat_sessions').delete().eq('user_id', userId),
        supabase.from('project_folders').delete().eq('user_id', userId),
        supabase.from('user_prompts').delete().eq('user_id', userId),
        supabase.from('user_connectors').delete().eq('user_id', userId),
        supabase.from('workspace_data').delete().eq('user_id', userId),
      ]);
    }

    let importedSessionsCount = 0;
    let importedMessagesCount = 0;
    let importedFoldersCount = 0;
    let importedPromptsCount = 0;
    let importedConnectorsCount = 0;

    // 1. Import Folders
    if (folders.length > 0) {
      const folderRows = folders.map((f) => ({
        id: f.id,
        user_id: userId,
        name: f.name,
        session_ids: f.sessionIds || [],
        created_at: f.createdAt ? new Date(f.createdAt).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: fErr } = await supabase
        .from('project_folders')
        .upsert(folderRows, { onConflict: 'id' });

      if (!fErr) importedFoldersCount = folderRows.length;
    }

    // 2. Import Sessions
    if (sessions.length > 0) {
      const sessionRows = sessions.map((s) => ({
        id: s.id,
        user_id: userId,
        title: s.title || 'Conversation',
        provider_id: s.providerId || 'groq',
        model_id: s.modelId || 'compound-beta',
        system_prompt: s.systemPrompt || '',
        temperature: s.temperature ?? 0.7,
        max_tokens: s.maxTokens ?? null,
        is_pinned: Boolean(s.isPinned),
        project_id: s.projectId || null,
        created_at: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
        updated_at: s.updatedAt ? new Date(s.updatedAt).toISOString() : new Date().toISOString(),
      }));

      const { error: sErr } = await supabase
        .from('chat_sessions')
        .upsert(sessionRows, { onConflict: 'id' });

      if (!sErr) importedSessionsCount = sessionRows.length;
    }

    // 3. Import Messages
    const allMessageRows: any[] = [];
    for (const [sessionId, msgList] of Object.entries(messages)) {
      if (!Array.isArray(msgList)) continue;
      for (const m of msgList) {
        allMessageRows.push({
          id: m.id,
          session_id: sessionId,
          user_id: userId,
          role: m.role || 'user',
          content: m.content || '',
          reasoning_content: m.reasoningContent || null,
          timestamp: m.timestamp || Date.now(),
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
        });
      }
    }

    if (allMessageRows.length > 0) {
      // Chunk messages in batches of 100 to avoid payload size limits
      const chunkSize = 100;
      for (let i = 0; i < allMessageRows.length; i += chunkSize) {
        const chunk = allMessageRows.slice(i, i + chunkSize);
        const { error: mErr } = await supabase
          .from('chat_messages')
          .upsert(chunk, { onConflict: 'id' });

        if (!mErr) importedMessagesCount += chunk.length;
      }
    }

    // 4. Import Personas / Prompts
    if (personas.length > 0) {
      const promptRows = personas.map((p) => ({
        id: p.id,
        user_id: userId,
        title: p.name,
        content: p.systemPrompt || '',
        description: p.description || '',
        icon: p.icon || '💡',
        category: p.category || 'general',
        system_prompt: p.systemPrompt || '',
        default_temperature: p.defaultTemperature ?? 0.7,
        suggested_starters: p.suggestedStarters || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: pErr } = await supabase
        .from('user_prompts')
        .upsert(promptRows, { onConflict: 'id' });

      if (!pErr) importedPromptsCount = promptRows.length;
    }

    // 5. Import Connectors
    if (connectors && typeof connectors === 'object') {
      const connectorRows = Object.entries(connectors).map(([cid, cfg]) => ({
        id: `${userId}_${cid}`,
        user_id: userId,
        connector_id: cid,
        config: cfg || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      if (connectorRows.length > 0) {
        const { error: cErr } = await supabase
          .from('user_connectors')
          .upsert(connectorRows, { onConflict: 'user_id,connector_id' });

        if (!cErr) importedConnectorsCount = connectorRows.length;
      }
    }

    // 6. Import Workspace Data if available
    if (workspace) {
      await supabase.from('workspace_data').upsert(
        {
          id: `workspace_${userId}`,
          user_id: userId,
          data: workspace,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    }

    return NextResponse.json({
      success: true,
      mode,
      imported: {
        sessions: importedSessionsCount,
        messages: importedMessagesCount,
        folders: importedFoldersCount,
        prompts: importedPromptsCount,
        connectors: importedConnectorsCount,
      },
    });
  } catch (err: any) {
    console.error('[Import Cloud DB Error]:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to import cloud database' },
      { status: 500 }
    );
  }
}
