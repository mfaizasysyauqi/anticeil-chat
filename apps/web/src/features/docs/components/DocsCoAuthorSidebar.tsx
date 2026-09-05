'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { isCloudTier } from '@anticeil/core';
import {
  Sparkles,
  Send,
  Wand2,
  Sigma,
  Table,
  BookOpen,
  Check,
  Copy,
  RotateCcw,
  RefreshCw,
  Bot,
  User,
  ChevronDown,
  PanelLeftClose,
  Globe,
  History,
  Trash2,
} from 'lucide-react';
import { useDocsStore } from '../store/useDocsStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useCreditStore } from '../../credits/store/useCreditStore';
import { useCoAuthorHistoryStore, CoAuthorMessage } from '../store/useCoAuthorHistoryStore';
import { streamBYOKChat } from '../../chat/data/byokApi';
import { ChatMessage, LLMProviderId, getModelById, PROVIDER_DEFINITIONS } from '@anticeil/core';
import { ModelSelectorModal } from '../../chat/components/ModelSelectorModal';
import { ProviderBrandLogo } from '../../../shared/components/ProviderLogos';
import { ThinkingTimeline } from '../../chat/components/ThinkingTimeline';

export interface DocsCoAuthorSidebarProps {
  onInsertText?: (text: string) => void;
  isEmbedded?: boolean;
  onClose?: () => void;
}

export function DocsCoAuthorSidebar({
  onInsertText,
  isEmbedded = false,
  onClose,
}: DocsCoAuthorSidebarProps = {}) {
  const activeDocId = useDocsStore((s) => s.activeDocId);
  const documents = useDocsStore((s) => s.documents);
  const updateDocumentContent = useDocsStore((s) => s.updateDocumentContent);
  const createSubFile = useDocsStore((s) => s.createSubFile);
  const updateSubFileContent = useDocsStore((s) => s.updateSubFileContent);
  const updateSubFileName = useDocsStore((s) => s.updateSubFileName);
  const deleteSubFile = useDocsStore((s) => s.deleteSubFile);
  const setActiveFileId = useDocsStore((s) => s.setActiveFileId);
  const toggleCoAuthor = useDocsStore((s) => s.toggleCopilot);
  const coAuthorPendingPrompt = useDocsStore((s) => s.copilotPendingPrompt);
  const setCoAuthorPendingPrompt = useDocsStore((s) => s.setCopilotPendingPrompt);
  const createDocSnapshot = useDocsStore((s) => s.createDocSnapshot);
  const restoreDocSnapshot = useDocsStore((s) => s.restoreDocSnapshot);

  const language = useSettingsStore((s) => s.language);
  const globalProviderId = useSettingsStore((s) => s.activeProviderId);
  const globalModelId = useSettingsStore((s) => s.activeModelId);
  const apiKeys = useSettingsStore((s) => s.apiKeys);

  const authSession = useAuthStore((s) => s.session);
  const tier = useAuthStore((s) => s.tier);
  const isCloudUser = isCloudTier(tier);

  const historyStore = useCoAuthorHistoryStore();

  const activeDoc = documents.find((d) => d.id === activeDocId);

  const [selectedProviderId, setSelectedProviderId] = useState<LLMProviderId>(
    globalProviderId || 'groq'
  );
  const [selectedModelId, setSelectedModelId] = useState<string>(
    globalModelId || 'llama-3.3-70b-versatile'
  );
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      reasoningContent?: string;
      actions?: Array<{ type: string; name: string }>;
      snapshotId?: string;
      reverted?: boolean;
    }>
  >([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        language === 'id'
          ? 'Halo! Saya AI Co-Author Anda. Semua instruksi yang Anda berikan akan otomatis diedit langsung ke dokumen Anda (Full Auto). Anda juga dapat membatalkan perubahan (Undo) kapan saja.'
          : 'Hello! I am your AI Co-Author. All instructions will be automatically applied directly to your document (Full Auto). You can undo changes up to any point at any time.',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingMsgIdRef = useRef<string | null>(null);

  // Load history when active doc changes
  useEffect(() => {
    if (!activeDocId) return;
    const stored = historyStore.getSession(activeDocId);
    if (stored && stored.messages.length > 0) {
      setMessages((prev) => {
        // Only restore if we're still on the welcome message (fresh mount)
        if (prev.length === 1 && prev[0].id === 'welcome') {
          return stored.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            reasoningContent: m.reasoningContent,
            actions: m.actions,
            snapshotId: m.snapshotId,
            reverted: m.reverted,
          }));
        }
        return prev;
      });
    } else if (isCloudUser && authSession?.access_token) {
      // Try loading from cloud for starter+ users
      historyStore.loadFromCloud(activeDocId, authSession.access_token).then(() => {
        const cloudStored = historyStore.getSession(activeDocId);
        if (cloudStored && cloudStored.messages.length > 0) {
          setMessages((prev) => {
            if (prev.length === 1 && prev[0].id === 'welcome') {
              return cloudStored.messages.map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                reasoningContent: m.reasoningContent,
                actions: m.actions,
                snapshotId: m.snapshotId,
                reverted: m.reverted,
              }));
            }
            return prev;
          });
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDocId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Auto-send pending prompt injected from outside
  useEffect(() => {
    if (!coAuthorPendingPrompt) return;
    setCoAuthorPendingPrompt(null);
    handleSend(coAuthorPendingPrompt);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coAuthorPendingPrompt]);

  const currentModelDef = getModelById(selectedModelId);
  const currentProviderDef = PROVIDER_DEFINITIONS.find((p) => p.id === selectedProviderId);
  const modelDisplayName = currentModelDef?.name || selectedModelId;
  const providerDisplayName = currentProviderDef?.name || selectedProviderId;

  // ── Agent CRUD + Patch Action Executor ────────────────────────────────────
  const executeDocAgentActions = (text: string): Array<{ type: string; name: string }> => {
    if (!activeDoc) return [];
    const executed: Array<{ type: string; name: string }> = [];

    // 1. Create file
    const createRegex = /<create_file\s+name=["']([^"']+)["']>([\s\S]*?)<\/create_file>/gi;
    let m;
    while ((m = createRegex.exec(text)) !== null) {
      const fileName = m[1].trim();
      const content = m[2].trim();
      const existing = (activeDoc.files || []).find((f) => f.name.toLowerCase() === fileName.toLowerCase());
      if (existing) {
        updateSubFileContent(activeDoc.id, existing.id, content);
        executed.push({ type: 'update', name: fileName });
      } else {
        createSubFile(activeDoc.id, fileName, content);
        executed.push({ type: 'create', name: fileName });
      }
    }

    // 2. Update / rewrite file
    const updateRegex = /<update_file\s+name=["']([^"']+)["']>([\s\S]*?)<\/update_file>/gi;
    while ((m = updateRegex.exec(text)) !== null) {
      const fileName = m[1].trim();
      const content = m[2].trim();
      const existing = (activeDoc.files || []).find((f) => f.name.toLowerCase() === fileName.toLowerCase());
      if (existing) {
        updateSubFileContent(activeDoc.id, existing.id, content);
        executed.push({ type: 'update', name: fileName });
      } else if (
        fileName.toLowerCase() === 'main' ||
        fileName.toLowerCase() === (activeDoc.title || '').toLowerCase() ||
        fileName.toLowerCase() === 'main.tex' ||
        fileName.toLowerCase() === 'main.md'
      ) {
        updateDocumentContent(activeDoc.id, content);
        executed.push({ type: 'update', name: fileName });
      } else {
        createSubFile(activeDoc.id, fileName, content);
        executed.push({ type: 'create', name: fileName });
      }
    }

    // 3. Targeted patch — only replace a specific block, leaving the rest untouched
    //    Syntax: <patch_file name="file.tex" find="exact text to find">replacement text</patch_file>
    const patchRegex = /<patch_file\s+name=["']([^"']+)["']\s+find=["']([\s\S]*?)["']>([\s\S]*?)<\/patch_file>/gi;
    while ((m = patchRegex.exec(text)) !== null) {
      const fileName = m[1].trim();
      const findStr = m[2]; // do NOT trim — must match exactly
      const replacement = m[3].trim();
      let target = (activeDoc.files || []).find((f) => f.name.toLowerCase() === fileName.toLowerCase());
      if (!target && (fileName.toLowerCase() === 'main.tex' || fileName.toLowerCase() === 'main')) {
        // fall back to active file
        target = (activeDoc.files || []).find((f) => f.id === activeDoc.activeFileId);
      }
      if (target) {
        if (target.content.includes(findStr)) {
          const patched = target.content.replace(findStr, replacement);
          updateSubFileContent(activeDoc.id, target.id, patched);
          executed.push({ type: 'patch', name: fileName });
        }
      } else {
        // patch on main document content
        if (activeDoc.content.includes(findStr)) {
          const patched = activeDoc.content.replace(findStr, replacement);
          updateDocumentContent(activeDoc.id, patched);
          executed.push({ type: 'patch', name: activeDoc.title || 'Main' });
        }
      }
    }

    // 4. Rename file
    const renameRegex = /<rename_file\s+from=["']([^"']+)["']\s+to=["']([^"']+)["']\s*\/?>/gi;
    while ((m = renameRegex.exec(text)) !== null) {
      const fromName = m[1].trim();
      const toName = m[2].trim();
      const existing = (activeDoc.files || []).find((f) => f.name.toLowerCase() === fromName.toLowerCase());
      if (existing) {
        updateSubFileName(activeDoc.id, existing.id, toName);
        executed.push({ type: 'rename', name: `${fromName} → ${toName}` });
      }
    }

    // 5. Delete file
    const deleteRegex = /<delete_file\s+name=["']([^"']+)["']\s*\/?>/gi;
    while ((m = deleteRegex.exec(text)) !== null) {
      const fileName = m[1].trim();
      const existing = (activeDoc.files || []).find((f) => f.name.toLowerCase() === fileName.toLowerCase());
      if (existing) {
        deleteSubFile(activeDoc.id, existing.id);
        executed.push({ type: 'delete', name: fileName });
      }
    }

    // 6. Rewrite main document
    const rewriteMainRegex = /<rewrite_main>([\s\S]*?)<\/rewrite_main>/gi;
    while ((m = rewriteMainRegex.exec(text)) !== null) {
      const content = m[1].trim();
      updateDocumentContent(activeDoc.id, content);
      executed.push({ type: 'update', name: activeDoc.title || 'Main Document' });
    }

    return executed;
  };

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputPrompt.trim();
    if (!promptToSend || isGenerating) return;

    // Credit check & deduction for Anticeil Docs AI (1 credit per request)
    if (selectedProviderId === 'anticeil') {
      const allowed = useCreditStore.getState().deductCredits('docs', 'anticeil');
      if (!allowed) return;
    }

    if (!customPrompt) setInputPrompt('');

    const snapshotId = activeDoc ? createDocSnapshot(activeDoc.id, promptToSend.slice(0, 35)) : undefined;

    const userMsgId = 'u_' + Date.now();
    const assistantMsgId = 'a_' + Date.now();
    streamingMsgIdRef.current = assistantMsgId;

    const userMsg = { id: userMsgId, role: 'user' as const, content: promptToSend, timestamp: Date.now() };
    const assistantMsg = { id: assistantMsgId, role: 'assistant' as const, content: '', reasoningContent: '', snapshotId, timestamp: Date.now() + 1 };

    const newHistory = [...messages, userMsg, assistantMsg];

    // Save user message to history immediately
    if (activeDoc) {
      historyStore.saveMessage(activeDoc.id, activeDoc.title, { ...userMsg });
    }

    setMessages(newHistory);
    setIsGenerating(true);

    const subFiles = activeDoc?.files || [];
    const activeSubFile = subFiles.find((f) => f.id === activeDoc?.activeFileId);
    const subFilesTree = subFiles.map((f) => `- ${f.name} (${f.content.length} characters)`).join('\n');
    const subFilesContent = subFiles
      .map((f) => `--- File: ${f.name} ---\n\`\`\`\n${f.content.slice(0, 3000)}\n\`\`\``)
      .join('\n\n');

    const projectContext = activeDoc
      ? `\n\nPROJECT FILES & ARCHITECTURE:
- Project Title: "${activeDoc.title}"
- Format: ${activeDoc.format}
- Currently Open File: ${activeSubFile ? activeSubFile.name : 'Main Document'}
- File Tree:
${subFilesTree || '- Main document file (root)'}

FULL PROJECT CONTENTS:
--- Main Document Content ---
\`\`\`
${activeDoc.content.slice(0, 4000)}
\`\`\`

${subFilesContent}`
      : '';

    const systemPrompt = `You are an expert Academic & Scientific AI Co-Author specializing in LaTeX document composition, IEEE/Nature/ACM journal papers, thesis writing, and mathematical research.
The document workspace is a pure LaTeX environment (.tex, .bib, .cls, .sty).
Always output clean, standard, and compilable LaTeX syntax (e.g. \\section{}, \\subsection{}, \\begin{equation}, \\begin{table}, \\begin{tabular}, \\cite{}, \\begin{figure}, \\begin{thebibliography}) rather than Markdown syntax.

You have FULL READ and WRITE (CRUD) access to this document and all sub-files in the project.

Available Agent Action Tags — use these when instructed to create, edit, rename, or delete files:

1. **Targeted patch** (PREFERRED for small edits — only replaces the specified block, leaving the rest untouched):
<patch_file name="filename.tex" find="exact LaTeX text to find and replace">
replacement LaTeX text here
</patch_file>

2. Create a new sub-file:
<create_file name="filename.ext">
File content here...
</create_file>

3. Update / Rewrite an entire existing file (only when the change is large or structural):
<update_file name="filename.ext">
Complete updated file content...
</update_file>

4. Rewrite the main document (only when a complete overhaul is requested):
<rewrite_main>
Updated main content here...
</rewrite_main>

5. Rename a file:
<rename_file from="old_name.ext" to="new_name.ext" />

6. Delete a file:
<delete_file name="filename.ext" />

IMPORTANT — prefer patch_file over update_file / rewrite_main whenever the change is localized (e.g. editing a single equation, table, section, or paragraph). Only rewrite the full file when the user explicitly requests a full rewrite or when the change affects more than 40% of the file.

When the user asks you to create, modify, or manage files, invoke the action tags and explain what you accomplished in clear, concise academic prose.${projectContext}`;

    const apiMessages: ChatMessage[] = newHistory
      .filter((m) => m.id !== assistantMsgId)
      .map((m) => ({
        id: m.id,
        sessionId: 'docs_coauthor',
        role: m.role,
        content: m.content,
        timestamp: Date.now(),
        status: 'done' as const,
      }));

    const keyConfig = apiKeys[selectedProviderId] || { apiKey: '', isEnabled: true };
    const userTier = useAuthStore.getState().tier;

    try {
      let fullResponse = '';
      let fullReasoning = '';
      await streamBYOKChat({
        providerId: selectedProviderId,
        modelId: selectedModelId,
        systemPrompt,
        messages: apiMessages,
        apiKeyConfig: keyConfig,
        temperature: 0.6,
        tier: userTier,
        enableWebSearch,
        onChunk: (chunk) => {
          if (chunk.delta) {
            fullResponse += chunk.delta;
          }
          if (chunk.reasoningDelta) {
            fullReasoning += chunk.reasoningDelta;
          }
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: fullResponse, reasoningContent: fullReasoning }
                : msg
            )
          );
        },
      });

      // After streaming completes, parse and execute agent actions
      let executedActions = executeDocAgentActions(fullResponse);

      // Full Auto fallback — if no XML tags but clean code was returned, apply it
      if (executedActions.length === 0 && activeDoc) {
        const cleanCode = extractCleanCodeToInsert(fullResponse);
        if (cleanCode && cleanCode.length > 10 && cleanCode !== fullResponse.trim()) {
          const subFilesList = activeDoc.files || [];
          const curSubFile = subFilesList.find((f) => f.id === activeDoc.activeFileId);
          if (curSubFile) {
            updateSubFileContent(activeDoc.id, curSubFile.id, cleanCode);
            executedActions.push({ type: 'update', name: curSubFile.name });
          } else {
            updateDocumentContent(activeDoc.id, cleanCode);
            executedActions.push({ type: 'update', name: activeDoc.title || 'Dokumen' });
          }
        }
      }

      if (executedActions.length > 0) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, actions: executedActions } : msg
          )
        );
      }

      // Persist assistant message to history
      if (activeDoc) {
        const finalMsg: CoAuthorMessage = {
          id: assistantMsgId,
          role: 'assistant',
          content: fullResponse,
          reasoningContent: fullReasoning || undefined,
          actions: executedActions.length > 0 ? executedActions : undefined,
          snapshotId,
          timestamp: Date.now(),
        };
        historyStore.saveMessage(activeDoc.id, activeDoc.title, finalMsg);

        // Sync to cloud for starter+ users (fire and forget)
        if (isCloudUser && authSession?.access_token) {
          historyStore.syncToCloud(activeDoc.id, authSession.access_token);
        }
      }
    } catch (err) {
      console.warn('[DocsCoAuthor] Streaming error:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content:
                  language === 'id'
                    ? 'Maaf, terjadi kendala saat menghubungi model AI. Silakan periksa koneksi atau API Key Anda di menu Pengaturan.'
                    : 'Sorry, an error occurred while streaming AI response. Please check your API key in Settings.',
              }
            : msg
        )
      );
    } finally {
      setIsGenerating(false);
      streamingMsgIdRef.current = null;
    }
  };

  const extractCleanCodeToInsert = (rawText: string): string => {
    if (!rawText) return '';
    const fileTagMatch = rawText.match(/<(?:update_file|create_file|rewrite_main|patch_file)[^>]*>([\s\S]*?)<\/(?:update_file|create_file|rewrite_main|patch_file)>/i);
    if (fileTagMatch && fileTagMatch[1].trim()) return fileTagMatch[1].trim();
    const codeFenceMatch = rawText.match(/```(?:latex|tex|markdown|md|bib|json)?\s*([\s\S]*?)```/i);
    if (codeFenceMatch && codeFenceMatch[1].trim()) return codeFenceMatch[1].trim();
    let cleaned = rawText
      .replace(/<(?:update_file|create_file|rewrite_main|patch_file)[^>]*>[\s\S]*?<\/(?:update_file|create_file|rewrite_main|patch_file)>/gi, '')
      .replace(/<(?:rename_file|delete_file)[^>]*\/?>/gi, '');
    const explanationHeaderIdx = cleaned.search(/\n\s*#{1,4}\s*(?:Perubahan|Penjelasan|Catatan|Explanation|Summary|Changes|Changelog)/i);
    if (explanationHeaderIdx !== -1) cleaned = cleaned.substring(0, explanationHeaderIdx).trim();
    return cleaned.trim();
  };

  const handleCopy = (content: string, msgId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickActions = [
    {
      label: language === 'id' ? 'Lanjutkan Paragraf' : 'Continue Writing',
      icon: <Wand2 size={12} />,
      prompt:
        language === 'id'
          ? 'Lanjutkan penulisan dari bagian terakhir dokumen ini dengan gaya akademis yang mengalir.'
          : 'Continue writing from the last section with rigorous academic prose.',
    },
    {
      label: language === 'id' ? 'Rumus LaTeX' : 'LaTeX Equation',
      icon: <Sigma size={12} />,
      prompt:
        language === 'id'
          ? 'Buatkan formulasi persamaan matematika LaTeX lengkap dengan penjelasan variabelnya.'
          : 'Generate a comprehensive LaTeX math formula block with variable explanations.',
    },
    {
      label: language === 'id' ? 'Tabel Data' : 'Data Table',
      icon: <Table size={12} />,
      prompt:
        language === 'id'
          ? 'Buatkan tabel perbandingan metrik performa dalam format LaTeX tabular.'
          : 'Generate a neat LaTeX tabular performance comparison table.',
    },
    {
      label: language === 'id' ? 'Sitasi BibTeX' : 'BibTeX Citations',
      icon: <BookOpen size={12} />,
      prompt:
        language === 'id'
          ? 'Berikan 3 referensi literatur ilmiah standar IEEE / Nature terkait topik dokumen ini.'
          : 'Provide 3 high-impact scientific references in standard academic format.',
    },
  ];

  return (
    <div
      style={{
        width: isEmbedded ? '100%' : '320px',
        flex: 1,
        minHeight: 0,
        height: isEmbedded ? undefined : '100%',
        backgroundColor: 'var(--bg-sidebar)',
        borderLeft: isEmbedded ? 'none' : '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Model Selector Modal */}
      {isModelSelectorOpen && (
        <ModelSelectorModal
          targetCapability="text"
          currentProviderId={selectedProviderId}
          currentModelId={selectedModelId}
          onClose={() => setIsModelSelectorOpen(false)}
          onSelectModel={(providerId, modelId) => {
            setSelectedProviderId(providerId);
            setSelectedModelId(modelId);
          }}
        />
      )}

      {/* Header */}
      <div
        style={{
          height: '48px',
          boxSizing: 'border-box',
          padding: '0 12px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          backgroundColor: 'var(--bg-sidebar)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            AI Co-Author
          </span>
          <span
            style={{
              fontSize: '10px',
              background: isCloudUser ? 'rgba(16,185,129,0.12)' : 'rgba(0, 115, 234, 0.12)',
              color: isCloudUser ? '#10B981' : 'var(--brand-primary)',
              border: `1px solid ${isCloudUser ? 'rgba(16,185,129,0.3)' : 'rgba(0, 115, 234, 0.25)'}`,
              borderRadius: '999px',
              padding: '0 6px',
              fontWeight: 650,
              lineHeight: '15px',
            }}
            title={isCloudUser ? 'History synced to cloud' : 'History saved locally'}
          >
            {isCloudUser ? '☁ Cloud' : '💾 Local'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {/* History / Clear button */}
          {activeDocId && historyStore.getSession(activeDocId)?.messages.length ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(language === 'id' ? 'Hapus riwayat chat untuk dokumen ini?' : 'Clear chat history for this document?')) {
                  historyStore.clearSession(activeDocId);
                  if (isCloudUser && authSession?.access_token) {
                    fetch(`/api/docs/coauthor-history?docId=${encodeURIComponent(activeDocId)}`, {
                      method: 'DELETE',
                      headers: { Authorization: `Bearer ${authSession.access_token}` },
                    }).catch(() => {});
                  }
                  setMessages([{
                    id: 'welcome',
                    role: 'assistant',
                    content: language === 'id'
                      ? 'Riwayat chat dihapus. Halo lagi! Saya AI Co-Author Anda.'
                      : 'Chat history cleared. Hello again! I am your AI Co-Author.',
                  }]);
                }
              }}
              style={{
                width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '5px', backgroundColor: 'transparent', border: '1px solid transparent',
                color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s ease',
              }}
              className="hover-subtle"
              title={language === 'id' ? 'Hapus riwayat chat' : 'Clear chat history'}
            >
              <Trash2 size={12} />
            </button>
          ) : null}

          <button
            type="button"
            onClick={onClose || toggleCoAuthor}
            style={{
              width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '5px', backgroundColor: 'transparent', border: '1px solid transparent',
              color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s ease',
            }}
            className="hover-subtle"
            title={language === 'id' ? 'Tutup Panel' : 'Collapse Panel'}
          >
            <PanelLeftClose size={13} />
          </button>
        </div>
      </div>

      {/* Model Selector Pill + Web Search Toggle */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-sidebar)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button
          type="button"
          onClick={() => setIsModelSelectorOpen(true)}
          style={{
            width: '100%',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 10px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-subtle)',
            color: 'var(--text-primary)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxSizing: 'border-box',
          }}
          className="hover-subtle"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            <ProviderBrandLogo provider={selectedProviderId} size={13} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', color: 'var(--text-primary)' }}>
              {modelDisplayName}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 500 }}>
              {providerDisplayName}
            </span>
            <ChevronDown size={12} color="var(--text-muted)" />
          </div>
        </button>

        {/* Web Search Toggle */}
        <button
          type="button"
          onClick={() => setEnableWebSearch((v) => !v)}
          title={enableWebSearch ? 'Web search ON — click to disable' : 'Web search OFF — click to enable'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            borderRadius: '5px',
            border: `1px solid ${enableWebSearch ? 'rgba(16,185,129,0.4)' : 'var(--border-subtle)'}`,
            backgroundColor: enableWebSearch ? 'rgba(16,185,129,0.08)' : 'transparent',
            color: enableWebSearch ? '#10B981' : 'var(--text-muted)',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            width: 'fit-content',
          }}
        >
          <Globe size={11} />
          <span>{language === 'id' ? 'Pencarian Web' : 'Web Search'}</span>
          <span
            style={{
              marginLeft: '2px',
              padding: '1px 5px',
              borderRadius: '999px',
              fontSize: '9.5px',
              fontWeight: 700,
              backgroundColor: enableWebSearch ? '#10B981' : 'var(--bg-subtle)',
              color: enableWebSearch ? '#fff' : 'var(--text-muted)',
            }}
          >
            {enableWebSearch ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>

      {/* Quick Action Chips */}
      <div
        className="hide-scrollbar"
        style={{
          padding: '8px 10px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '5px',
          overflowX: 'auto',
          backgroundColor: 'var(--bg-sidebar)',
          scrollbarWidth: 'none',
        }}
      >
        {quickActions.map((qa) => (
          <button
            key={qa.label}
            type="button"
            onClick={() => handleSend(qa.prompt)}
            disabled={isGenerating}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 500,
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isGenerating) {
                e.currentTarget.style.borderColor = 'var(--brand-primary)';
                e.currentTarget.style.color = 'var(--brand-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isGenerating) {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >
            {qa.icon}
            <span>{qa.label}</span>
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: 'var(--bg-sidebar)',
        }}
      >
        {messages.map((msg) => {
          const isStreamingThis = isGenerating && msg.id === streamingMsgIdRef.current;
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: msg.role === 'user' ? '88%' : '100%',
                width: msg.role === 'assistant' ? '100%' : 'auto',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                {msg.role === 'user' ? (
                  <>
                    <span>{language === 'id' ? 'Anda' : 'You'}</span>
                    <User size={10} />
                  </>
                ) : (
                  <>
                    <Bot size={10} color="var(--brand-primary)" />
                    <span>AI Co-Author</span>
                  </>
                )}
              </div>

              {/* Thinking Timeline — shown for assistant messages that have reasoning */}
              {msg.role === 'assistant' && (msg.reasoningContent || isStreamingThis) && (
                <ThinkingTimeline
                  reasoningContent={msg.reasoningContent || ''}
                  isStreaming={isStreamingThis}
                />
              )}

              {/* Agent Actions Executed Badges */}
              {msg.actions && msg.actions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                  {msg.actions.map((act, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backgroundColor:
                          act.type === 'patch' ? 'rgba(59,130,246,0.1)' : 'rgba(16, 185, 129, 0.1)',
                        border:
                          act.type === 'patch'
                            ? '1px solid rgba(59,130,246,0.25)'
                            : '1px solid rgba(16, 185, 129, 0.25)',
                        color: act.type === 'patch' ? '#3B82F6' : '#10B981',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      <Sparkles size={11} />
                      <span>
                        {act.type === 'create'
                          ? (language === 'id' ? `File dibuat: ${act.name}` : `Created: ${act.name}`)
                          : act.type === 'patch'
                          ? (language === 'id' ? `Patched: ${act.name}` : `Patched: ${act.name}`)
                          : act.type === 'update'
                          ? (language === 'id' ? `File diperbarui: ${act.name}` : `Updated: ${act.name}`)
                          : act.type === 'rename'
                          ? (language === 'id' ? `Diubah nama: ${act.name}` : `Renamed: ${act.name}`)
                          : (language === 'id' ? `File dihapus: ${act.name}` : `Deleted: ${act.name}`)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  lineHeight: 1.5,
                  backgroundColor:
                    msg.role === 'user'
                      ? 'var(--brand-primary, #0073ea)'
                      : 'var(--bg-surface)',
                  color: msg.role === 'user' ? '#ffffff' : 'var(--text-primary)',
                  border:
                    msg.role === 'user'
                      ? 'none'
                      : '1px solid var(--border-subtle)',
                  boxShadow: msg.role === 'user' ? 'none' : '0 1px 2px rgba(0,0,0,0.03)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {msg.content || (isStreamingThis ? (language === 'id' ? 'Menulis...' : 'Writing...') : '')}
              </div>

              {/* Undo + Copy buttons */}
              {msg.role === 'assistant' && msg.content && !isGenerating && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                    {msg.snapshotId && (
                      <button
                        type="button"
                        onClick={() => {
                          if (activeDoc && msg.snapshotId && !msg.reverted) {
                            const success = restoreDocSnapshot(activeDoc.id, msg.snapshotId);
                            if (success) {
                              setMessages((prev) =>
                                prev.map((m2) => (m2.id === msg.id ? { ...m2, reverted: true } : m2))
                              );
                            }
                          }
                        }}
                        disabled={msg.reverted}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '5px',
                          border: msg.reverted ? '1px solid var(--border-subtle)' : '1px solid rgba(239, 68, 68, 0.35)',
                          backgroundColor: msg.reverted ? 'var(--bg-subtle)' : 'rgba(239, 68, 68, 0.08)',
                          color: msg.reverted ? 'var(--text-muted)' : '#EF4444',
                          fontSize: '10.5px',
                          fontWeight: 650,
                          cursor: msg.reverted ? 'default' : 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        className={msg.reverted ? '' : 'hover-subtle'}
                      >
                        <RotateCcw size={11} />
                        <span>
                          {msg.reverted
                            ? (language === 'id' ? '✓ Dibatalkan' : '✓ Undone')
                            : (language === 'id' ? 'Batalkan Perubahan (Undo)' : 'Undo changes')}
                        </span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(msg.content, msg.id)}
                    title={language === 'id' ? 'Salin Teks' : 'Copy Text'}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '5px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-surface)',
                      color: copiedId === msg.id ? '#10B981' : 'var(--text-muted)',
                      fontSize: '10.5px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    }}
                    className="hover-subtle"
                  >
                    {copiedId === msg.id ? <Check size={11} color="#10B981" /> : <Copy size={11} />}
                    <span>{copiedId === msg.id ? (language === 'id' ? 'Tersalin' : 'Copied') : (language === 'id' ? 'Salin' : 'Copy')}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div
        style={{
          padding: '8px 10px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-sidebar)',
          flexShrink: 0,
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: '6px',
            padding: '0 4px 0 10px',
            height: '32px',
            border: '1px solid var(--border-subtle)',
            boxSizing: 'border-box',
            transition: 'all 0.15s ease',
          }}
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder={
              language === 'id'
                ? 'Minta AI tulis bab, rumus TeX, atau tabel...'
                : 'Ask AI to write section, TeX formula, or table...'
            }
            disabled={isGenerating}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: 0,
              lineHeight: 1,
              fontSize: '12px',
              color: 'var(--text-primary)',
            }}
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isGenerating}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: inputPrompt.trim() && !isGenerating ? 'var(--brand-primary)' : 'transparent',
              color: inputPrompt.trim() && !isGenerating ? '#ffffff' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: inputPrompt.trim() && !isGenerating ? 'pointer' : 'default',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            {isGenerating ? <RefreshCw size={12} className="spin" /> : <Send size={12} />}
          </button>
        </form>
      </div>
    </div>
  );
}
