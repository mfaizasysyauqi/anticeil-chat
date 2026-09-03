'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  History,
  RefreshCw,
  X,
  Bot,
  User,
  ChevronDown,
  Cpu,
  PanelLeftClose,
} from 'lucide-react';
import { useDocsStore } from '../store/useDocsStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { streamBYOKChat } from '../../chat/data/byokApi';
import { ChatMessage, LLMProviderId, getModelById, PROVIDER_DEFINITIONS } from '@anticeil/core';
import { ModelSelectorModal } from '../../chat/components/ModelSelectorModal';
import { ProviderBrandLogo } from '../../../shared/components/ProviderLogos';

export interface DocsCopilotSidebarProps {
  onInsertText?: (text: string) => void;
  isEmbedded?: boolean;
  onClose?: () => void;
}

export function DocsCopilotSidebar({
  onInsertText,
  isEmbedded = false,
  onClose,
}: DocsCopilotSidebarProps = {}) {
  const activeDocId = useDocsStore((s) => s.activeDocId);
  const documents = useDocsStore((s) => s.documents);
  const updateDocumentContent = useDocsStore((s) => s.updateDocumentContent);
  const createSubFile = useDocsStore((s) => s.createSubFile);
  const updateSubFileContent = useDocsStore((s) => s.updateSubFileContent);
  const updateSubFileName = useDocsStore((s) => s.updateSubFileName);
  const deleteSubFile = useDocsStore((s) => s.deleteSubFile);
  const setActiveFileId = useDocsStore((s) => s.setActiveFileId);
  const toggleCopilot = useDocsStore((s) => s.toggleCopilot);
  const copilotPendingPrompt = useDocsStore((s) => s.copilotPendingPrompt);
  const setCopilotPendingPrompt = useDocsStore((s) => s.setCopilotPendingPrompt);
  const createDocSnapshot = useDocsStore((s) => s.createDocSnapshot);
  const restoreDocSnapshot = useDocsStore((s) => s.restoreDocSnapshot);

  const language = useSettingsStore((s) => s.language);
  const globalProviderId = useSettingsStore((s) => s.activeProviderId);
  const globalModelId = useSettingsStore((s) => s.activeModelId);
  const apiKeys = useSettingsStore((s) => s.apiKeys);

  const activeDoc = documents.find((d) => d.id === activeDocId);

  // Model Selection State specifically for AI Co-Author (Text only)
  const [selectedProviderId, setSelectedProviderId] = useState<LLMProviderId>(
    globalProviderId || 'groq'
  );
  const [selectedModelId, setSelectedModelId] = useState<string>(
    globalModelId || 'llama-3.3-70b-versatile'
  );
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Auto-send pending prompt injected from outside (e.g. "Perbaiki AI" button)
  useEffect(() => {
    if (!copilotPendingPrompt) return;
    setCopilotPendingPrompt(null); // clear first to avoid double-fire
    handleSend(copilotPendingPrompt);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copilotPendingPrompt]);

  // Derive model and provider metadata
  const currentModelDef = getModelById(selectedModelId);
  const currentProviderDef = PROVIDER_DEFINITIONS.find((p) => p.id === selectedProviderId);
  const modelDisplayName = currentModelDef?.name || selectedModelId;
  const providerDisplayName = currentProviderDef?.name || selectedProviderId;

  // Execute Agent CRUD operations parsed from model output
  const executeDocAgentActions = (text: string): Array<{ type: string; name: string }> => {
    if (!activeDoc) return [];
    const executed: Array<{ type: string; name: string }> = [];

    // 1. Create file: <create_file name="filename.ext">content</create_file>
    const createRegex = /<create_file\s+name=["']([^"']+)["']>([\s\S]*?)<\/create_file>/gi;
    let createMatch;
    while ((createMatch = createRegex.exec(text)) !== null) {
      const fileName = createMatch[1].trim();
      const content = createMatch[2].trim();
      const existing = (activeDoc.files || []).find((f) => f.name.toLowerCase() === fileName.toLowerCase());
      if (existing) {
        updateSubFileContent(activeDoc.id, existing.id, content);
        executed.push({ type: 'update', name: fileName });
      } else {
        createSubFile(activeDoc.id, fileName, content);
        executed.push({ type: 'create', name: fileName });
      }
    }

    // 2. Update file: <update_file name="filename.ext">content</update_file>
    const updateRegex = /<update_file\s+name=["']([^"']+)["']>([\s\S]*?)<\/update_file>/gi;
    let updateMatch;
    while ((updateMatch = updateRegex.exec(text)) !== null) {
      const fileName = updateMatch[1].trim();
      const content = updateMatch[2].trim();
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

    // 3. Rename file: <rename_file from="old.ext" to="new.ext" />
    const renameRegex = /<rename_file\s+from=["']([^"']+)["']\s+to=["']([^"']+)["']\s*\/?>/gi;
    let renameMatch;
    while ((renameMatch = renameRegex.exec(text)) !== null) {
      const fromName = renameMatch[1].trim();
      const toName = renameMatch[2].trim();
      const existing = (activeDoc.files || []).find((f) => f.name.toLowerCase() === fromName.toLowerCase());
      if (existing) {
        updateSubFileName(activeDoc.id, existing.id, toName);
        executed.push({ type: 'rename', name: `${fromName} → ${toName}` });
      }
    }

    // 4. Delete file: <delete_file name="filename.ext" />
    const deleteRegex = /<delete_file\s+name=["']([^"']+)["']\s*\/?>/gi;
    let deleteMatch;
    while ((deleteMatch = deleteRegex.exec(text)) !== null) {
      const fileName = deleteMatch[1].trim();
      const existing = (activeDoc.files || []).find((f) => f.name.toLowerCase() === fileName.toLowerCase());
      if (existing) {
        deleteSubFile(activeDoc.id, existing.id);
        executed.push({ type: 'delete', name: fileName });
      }
    }

    // 5. Rewrite main document: <rewrite_main>content</rewrite_main>
    const rewriteMainRegex = /<rewrite_main>([\s\S]*?)<\/rewrite_main>/gi;
    let rewriteMatch;
    while ((rewriteMatch = rewriteMainRegex.exec(text)) !== null) {
      const content = rewriteMatch[1].trim();
      updateDocumentContent(activeDoc.id, content);
      executed.push({ type: 'update', name: activeDoc.title || 'Main Document' });
    }

    return executed;
  };

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputPrompt.trim();
    if (!promptToSend || isGenerating) return;

    if (!customPrompt) setInputPrompt('');

    // Capture checkpoint snapshot before AI modifies document
    const snapshotId = activeDoc ? createDocSnapshot(activeDoc.id, promptToSend.slice(0, 35)) : undefined;

    const userMsgId = 'u_' + Date.now();
    const assistantMsgId = 'a_' + Date.now();

    const newHistory = [
      ...messages,
      { id: userMsgId, role: 'user' as const, content: promptToSend },
      { id: assistantMsgId, role: 'assistant' as const, content: '', snapshotId },
    ];

    setMessages(newHistory);
    setIsGenerating(true);

    // Multi-File Project Context Extraction
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

Available Agent Action Tags (use these tags when instructed to create, edit, rename, or delete files):
1. Create a new sub-file (e.g. references.bib, chapter1.tex, appendix.tex):
<create_file name="filename.ext">
File content here...
</create_file>

2. Update / Rewrite an existing file:
<update_file name="filename.ext">
Complete updated file content...
</update_file>

3. Rename a file:
<rename_file from="old_name.ext" to="new_name.ext" />

4. Delete a file:
<delete_file name="filename.ext" />

5. Rewrite the main document:
<rewrite_main>
Updated main content here...
</rewrite_main>

When the user asks you to create, modify, or manage files, invoke the action tags and explain what you accomplished in clear, concise academic prose.${projectContext}`;

    const apiMessages: ChatMessage[] = newHistory
      .filter((m) => m.id !== assistantMsgId)
      .map((m) => ({
        id: m.id,
        sessionId: 'docs_copilot',
        role: m.role,
        content: m.content,
        timestamp: Date.now(),
        status: 'done' as const,
      }));

    const keyConfig = apiKeys[selectedProviderId] || { apiKey: '', isEnabled: true };

    try {
      let fullResponse = '';
      await streamBYOKChat({
        providerId: selectedProviderId,
        modelId: selectedModelId,
        systemPrompt,
        messages: apiMessages,
        apiKeyConfig: keyConfig,
        temperature: 0.6,
        onChunk: (chunk) => {
          if (chunk.delta) {
            fullResponse += chunk.delta;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId ? { ...msg, content: fullResponse } : msg
              )
            );
          }
        },
      });

      // After streaming completes, parse and execute autonomous file CRUD operations
      let executedActions = executeDocAgentActions(fullResponse);

      // If no XML action tags were used, but model provided code changes, automatically apply them (Full Auto)
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
    } catch (err) {
      console.warn('[DocsCopilot] Streaming error:', err);
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
    }
  };

  /**
   * Extracts clean code / LaTeX markup without XML tags or conversational headers
   */
  const extractCleanCodeToInsert = (rawText: string): string => {
    if (!rawText) return '';

    // 1. If wrapped in <update_file...> or <create_file...> or <rewrite_main>
    const fileTagMatch = rawText.match(/<(?:update_file|create_file|rewrite_main)[^>]*>([\s\S]*?)<\/(?:update_file|create_file|rewrite_main)>/i);
    if (fileTagMatch && fileTagMatch[1].trim()) {
      return fileTagMatch[1].trim();
    }

    // 2. If wrapped in markdown code fence ```latex ... ``` or ``` ... ```
    const codeFenceMatch = rawText.match(/```(?:latex|tex|markdown|md|bib|json)?\s*([\s\S]*?)```/i);
    if (codeFenceMatch && codeFenceMatch[1].trim()) {
      return codeFenceMatch[1].trim();
    }

    // 3. If there are trailing explanations, strip them
    let cleaned = rawText
      .replace(/<(?:update_file|create_file|rewrite_main|rename_file|delete_file)[^>]*>[\s\S]*?<\/(?:update_file|create_file|rewrite_main)>/gi, '')
      .replace(/<(?:rename_file|delete_file)[^>]*\/?>/gi, '');

    const explanationHeaderIdx = cleaned.search(/\n\s*#{1,4}\s*(?:Perubahan|Penjelasan|Catatan|Explanation|Summary|Changes|Changelog)/i);
    if (explanationHeaderIdx !== -1) {
      cleaned = cleaned.substring(0, explanationHeaderIdx).trim();
    }

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
          ? 'Buatkan tabel perbandingan metrik performa dalam format Markdown yang rapi.'
          : 'Generate a neat performance comparison matrix in Markdown table format.',
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
      {/* Model Selector Modal (Strictly Text / Chat Models Only) */}
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

      {/* Drawer Header: Title + Active Tag + Collapse Button (48px exact height) */}
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
            {language === 'id' ? 'AI Co-Author' : 'AI Co-Author'}
          </span>
          <span
            style={{
              fontSize: '10px',
              background: 'rgba(0, 115, 234, 0.12)',
              color: 'var(--brand-primary)',
              border: '1px solid rgba(0, 115, 234, 0.25)',
              borderRadius: '999px',
              padding: '0 6px',
              fontWeight: 650,
              lineHeight: '15px',
            }}
          >
            {language === 'id' ? 'Aktif' : 'Active'}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose || toggleCopilot}
          style={{
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '5px',
            backgroundColor: 'transparent',
            border: '1px solid transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          className="hover-subtle"
          title={language === 'id' ? 'Tutup Panel' : 'Collapse Panel'}
        >
          <PanelLeftClose size={13} />
        </button>
      </div>

      {/* Integrated Model Selector Pill Bar */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-sidebar)' }}>
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
          title="Pilih Model AI (Text Models Only)"
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
      </div>

      {/* Quick Action Chips (Seamless scroll with no scrollbar bar) */}
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
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: m.role === 'user' ? '88%' : '100%',
              width: m.role === 'assistant' ? '100%' : 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px',
                color: 'var(--text-muted)',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {m.role === 'user' ? (
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

            {/* Agent Actions Executed Badges */}
            {m.actions && m.actions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                {m.actions.map((act, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      color: '#10B981',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    <Sparkles size={11} />
                    <span>
                      {act.type === 'create'
                        ? (language === 'id' ? `File dibuat: ${act.name}` : `Created file: ${act.name}`)
                        : act.type === 'update'
                        ? (language === 'id' ? `File diperbarui: ${act.name}` : `Updated file: ${act.name}`)
                        : act.type === 'rename'
                        ? (language === 'id' ? `File diubah nama: ${act.name}` : `Renamed: ${act.name}`)
                        : (language === 'id' ? `File dihapus: ${act.name}` : `Deleted file: ${act.name}`)}
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
                  m.role === 'user'
                    ? 'var(--brand-primary, #0073ea)'
                    : 'var(--bg-surface)',
                color: m.role === 'user' ? '#ffffff' : 'var(--text-primary)',
                border:
                  m.role === 'user'
                    ? 'none'
                    : '1px solid var(--border-subtle)',
                boxShadow: m.role === 'user' ? 'none' : '0 1px 2px rgba(0,0,0,0.03)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {m.content || (isGenerating && m.role === 'assistant' ? (language === 'id' ? 'Menulis...' : 'Writing...') : '')}
            </div>

            {/* Assistant Action Buttons: Auto-Applied Badge + Undo Changes Button */}
            {m.role === 'assistant' && m.content && !isGenerating && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                  {m.snapshotId && (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeDoc && m.snapshotId && !m.reverted) {
                          const success = restoreDocSnapshot(activeDoc.id, m.snapshotId);
                          if (success) {
                            setMessages((prev) =>
                              prev.map((msg) => (msg.id === m.id ? { ...msg, reverted: true } : msg))
                            );
                          }
                        }
                      }}
                      disabled={m.reverted}
                      title={
                        m.reverted
                          ? (language === 'id' ? 'Perubahan telah dibatalkan' : 'Changes already undone')
                          : (language === 'id' ? 'Kembalikan dokumen ke kondisi sebelum AI mengedit' : 'Revert document to state before AI edits')
                      }
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '5px',
                        border: m.reverted ? '1px solid var(--border-subtle)' : '1px solid rgba(239, 68, 68, 0.35)',
                        backgroundColor: m.reverted ? 'var(--bg-subtle)' : 'rgba(239, 68, 68, 0.08)',
                        color: m.reverted ? 'var(--text-muted)' : '#EF4444',
                        fontSize: '10.5px',
                        fontWeight: 650,
                        cursor: m.reverted ? 'default' : 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      className={m.reverted ? '' : 'hover-subtle'}
                    >
                      <RotateCcw size={11} />
                      <span>
                        {m.reverted
                          ? (language === 'id' ? '✓ Dibatalkan' : '✓ Undone')
                          : (language === 'id' ? 'Batalkan Perubahan (Undo)' : 'Undo changes')}
                      </span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(m.content, m.id)}
                  title={language === 'id' ? 'Salin Teks' : 'Copy Text'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '5px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-surface)',
                    color: copiedId === m.id ? '#10B981' : 'var(--text-muted)',
                    fontSize: '10.5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  }}
                  className="hover-subtle"
                >
                  {copiedId === m.id ? <Check size={11} color="#10B981" /> : <Copy size={11} />}
                  <span>{copiedId === m.id ? (language === 'id' ? 'Tersalin' : 'Copied') : (language === 'id' ? 'Salin' : 'Copy')}</span>
                </button>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form at Bottom (Unified sleek bar) */}
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
