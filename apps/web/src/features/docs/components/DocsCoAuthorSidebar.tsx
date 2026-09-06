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
  Plus,
  Image as ImageIcon,
  FileText,
  FileCode,
  X,
  FileUp,
  LayoutGrid,
  Plug,
  ChevronRight,
} from 'lucide-react';
import { useDocsStore } from '../store/useDocsStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useCreditStore } from '../../credits/store/useCreditStore';
import { useCoAuthorHistoryStore, CoAuthorMessage } from '../store/useCoAuthorHistoryStore';
import { streamBYOKChat } from '../../chat/data/byokApi';
import {
  ChatMessage,
  LLMProviderId,
  getModelById,
  PROVIDER_DEFINITIONS,
  FileAttachment,
  parseUploadedFile,
  generateConnectorsSystemInstruction,
} from '@anticeil/core';
import { ModelSelectorModal } from '../../chat/components/ModelSelectorModal';
import { ConnectorsModal } from '../../connectors/components/ConnectorsModal';
import { useConnectorsStore } from '../../connectors/store/useConnectorsStore';
import { ConnectorBrandIcon } from '../../connectors/components/ConnectorLogos';
import { ProviderBrandLogo } from '../../../shared/components/ProviderLogos';
import { StudioChatMessage } from '../../../shared/components/StudioChatMessage';
import { InteractiveDocCard } from './shared/InteractiveDocCard';
import { DocsVersionHistoryModal } from './DocsVersionHistoryModal';
import {
  executeDocAgentActions,
  extractCleanContent,
  stripAgentActionTags,
  ExecutedAgentAction,
} from '../utils/docAgentUtils';

function FileActionChip({
  action,
  docId,
}: {
  action: { type: string; name: string };
  docId: string;
}) {
  const documents = useDocsStore((s) => s.documents);
  const setActiveFileId = useDocsStore((s) => s.setActiveFileId);

  const doc = documents.find((d) => d.id === docId);
  const subFiles = doc?.files || [];
  const targetFile = subFiles.find(
    (f) => f.name.toLowerCase() === action.name.toLowerCase() || f.id === action.name
  );

  const actionText =
    action.type === 'create'
      ? 'Created'
      : action.type === 'rename'
      ? 'Renamed'
      : action.type === 'delete'
      ? 'Deleted'
      : 'Edited';

  const actionColor = action.type === 'delete' ? '#EF4444' : '#10B981';

  const handleClick = () => {
    if (targetFile) {
      setActiveFileId(docId, targetFile.id);
    } else if (docId) {
      const mainSubFile = subFiles.find(
        (f) =>
          f.name.toLowerCase().startsWith('main.') ||
          f.name.toLowerCase() === 'main'
      );
      if (mainSubFile) {
        setActiveFileId(docId, mainSubFile.id);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`Buka ${action.name} di editor`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 8px 3px 6px',
        borderRadius: '6px',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        color: 'var(--text-secondary)',
        fontSize: '12px',
        fontFamily: 'inherit',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      }}
    >
      <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{actionText}</span>
      <FileCode size={13} style={{ color: '#3B82F6' }} />
      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{action.name}</span>
      <span style={{ color: actionColor, fontWeight: 600, fontSize: '11px' }}>+1</span>
    </button>
  );
}


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

  const connectors = useConnectorsStore((s) => s.connectors);
  const activeConnectorIds = useConnectorsStore((s) => s.activeConnectorIds);
  const toggleActiveConnector = useConnectorsStore((s) => s.toggleActiveConnector);

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
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

  const [inputPrompt, setInputPrompt] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isConnectorsModalOpen, setIsConnectorsModalOpen] = useState(false);

  // Close Plus Dropdown Menu on Outside Click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setIsPlusMenuOpen(false);
      }
    };
    if (isPlusMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPlusMenuOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: FileAttachment[] = [];
    const currentTotalBytes = attachments.reduce((acc, a) => acc + (a.size || 0), 0);

    for (let i = 0; i < files.length; i++) {
      try {
        const parsed = await parseUploadedFile(files[i], currentTotalBytes);
        newAttachments.push(parsed);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Gagal memproses berkas';
        alert(message);
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const newAttachments: FileAttachment[] = [];
    const currentTotalBytes = attachments.reduce((acc, a) => acc + (a.size || 0), 0);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          try {
            const parsed = await parseUploadedFile(file, currentTotalBytes);
            newAttachments.push(parsed);
          } catch (err) {
            console.warn('Failed to parse pasted screenshot file:', err);
          }
        }
      }
    }

    if (newAttachments.length > 0) {
      setAttachments((prev) => [...prev, ...newAttachments]);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      reasoningContent?: string;
      actions?: Array<{ type: string; name: string }>;
      snapshotId?: string;
      reverted?: boolean;
      timestamp?: number;
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

  // ── Agent Action Execution Wrapper ────────────────────────────────────
  const runDocAgentActions = (text: string): Array<{ type: string; name: string }> => {
    if (!activeDoc) return [];
    return executeDocAgentActions(activeDoc.id, text);
  };

  const handleSend = async (customPrompt?: string) => {
    let rawPrompt = customPrompt || inputPrompt.trim();
    if ((!rawPrompt && attachments.length === 0) || isGenerating) return;

    let promptToSend = rawPrompt;
    if (attachments.length > 0) {
      const attSummary = attachments
        .map((att) => {
          if (att.isImage) {
            return `[Gambar/Media Terlampir: ${att.name} (${att.type || 'image'}) - Content: ${att.content.substring(0, 150)}]`;
          }
          return `[Lampiran Berkas: ${att.name}]:\n${att.content}`;
        })
        .join('\n\n');
      promptToSend = promptToSend
        ? `${promptToSend}\n\n--- MEDIA/BERKAS TERLAMPIR ---\n${attSummary}`
        : `--- MEDIA/BERKAS TERLAMPIR ---\n${attSummary}`;
    }

    // Credit check for Anticeil Docs AI (1 credit per request) — do not deduct until response arrives
    if (selectedProviderId === 'anticeil') {
      const allowed = useCreditStore.getState().canAfford('docs', 'anticeil');
      if (!allowed) {
        useCreditStore.getState().setLimitModalOpen(true, 'docs');
        return;
      }
    }

    if (!customPrompt) {
      setInputPrompt('');
      setAttachments([]);
    }

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

    const docFormat = activeDoc?.format || 'latex';
    let formatPreamble = '';
    if (docFormat === 'sheet') {
      formatPreamble = `You are an expert financial and data spreadsheet AI Co-Author specializing in AntSheet workbooks.
The project workspace is a Feature-First spreadsheet environment (.antsheet, .csv, .md).
Always output clean AntSheet syntax with ## Meta, ## Cells, formulas, and charts.`;
    } else if (docFormat === 'slide') {
      formatPreamble = `You are an elite presentation designer and AI Co-Author specializing in modular slide decks.
The project workspace is a Feature-First slide presentation environment (.slide, .md) using '---' slide delimiters or @[include] sub-slide modules.`;
    } else if (docFormat === 'markdown') {
      formatPreamble = `You are an expert technical documentation AI Co-Author specializing in modular Markdown documentation.`;
    } else {
      formatPreamble = `You are an elite, publication-grade AI Document Architect & Co-Author specializing in LaTeX (.tex) and Markdown document composition.
You excel at writing Software Documentation, REST API Specifications, Product Requirement Documents (PRDs), System RFCs, Executive Business Reports, Whitepapers, as well as Academic Papers, Thesis/Skripsi, and mathematical research.
The document workspace is a pure LaTeX environment (.tex, .bib, .cls, .sty).

STRICT PUBLICATION, COVER & PAGINATION STANDARDS:
- When creating or refining cover pages, use a publication-grade \\begin{titlepage} that is centered horizontally and vertically:
  * Structure:
    \\begin{titlepage}
    \\thispagestyle{empty}
    \\centering
    \\vspace*{\\fill}
    {\\small \\scshape \\color{darkgray} DOKUMEN RESMI / LAPORAN / SKRIPSI}\\\\[1cm]
    {\\Huge \\bfseries \\color{primaryblue} JUDUL UTAMA}\\\\[0.4cm]
    {\\color{accentgold}\\hrule height 1.5pt}\\\\[0.6cm]
    \\begin{tcolorbox}[colback=lightgray,colframe=primaryblue,arc=3mm,width=0.92\\textwidth]
    \\centering
    {\\Large \\textbf{Subjudul atau Fokus Dokumen}}\\\\[0.25cm]
    {\\small Deskripsi ringkas mengenai ruang lingkup, metodologi, dan tujuan dokumen.}
    \\end{tcolorbox}\\\\[1cm]
    \\begin{tabular}{r l}
    \\textbf{Penyusun} & : Nama \\\\
    \\textbf{Institusi} & : Nama Instansi \\\\
    \\textbf{Kategori} & : Laporan Teknis / Biografi / Skripsi \\\\
    \\textbf{Versi} & : 1.0 (Dokumen Lengkap) \\\\
    \\end{tabular}
    \\vspace*{\\fill}
    {\\small \\today \\quad | \\quad Lokasi / Institusi}
    \\end{titlepage}
- PAGINATION & CHAPTER FLOW:
  * Cover page (\\begin{titlepage}): NO page number (\\thispagestyle{empty}).
  * Preliminary pages before main body (Ringkasan Eksekutif, Kata Pengantar, Table of Contents): Roman numerals (\\newpage \\pagenumbering{roman} \\setcounter{page}{1}) -> i, ii, iii...
  * Main content (from Chapter 1 / Section 1 onwards): Arabic numerals (\\newpage \\pagenumbering{arabic} \\setcounter{page}{1}) -> 1, 2, 3...
  * EVERY chapter or section in main.tex MUST start with \\newpage so each bab begins on a fresh page!
- Always output clean, standard, and compilable LaTeX syntax:
  * Use \\& for ampersand, \\% for percent, \\_ for underscore, \\$ for dollar, \\# for hash in normal text.
  * Use \\begin{description} \\item[Label:] Keterangan \\end{description} for definition lists (DO NOT use [leftmargin=*]).
  * Use \\begin{tcolorbox}[colback=lightgray,colframe=primaryblue,arc=2mm,width=\\textwidth] for callouts.
  * For tables, ALWAYS write complete rows with actual data inside \\begin{tabular}{...} ... \\end{tabular}. End every row with \\\\ or \\\\ \\hline. Never place multiple rows on one line without \\\\.
  * NEVER output raw Markdown (such as '###' or '**bold**') inside .tex files.`;
    }

    const connectorsInstruction = generateConnectorsSystemInstruction(activeConnectorIds);

    const systemPrompt = `${formatPreamble}

${connectorsInstruction ? connectorsInstruction + '\n\n' : ''}CRITICAL IMAGE & MEDIA INSTRUCTION:
When the user asks to generate, create, or insert an image, picture, illustration, or logo (e.g., "buatkan gambar...", "buat logo..."):
- NEVER write raw vector path geometry (\`#let logo = box(...)\`), manual Bezier curves, or raw ASCII art for images/logos.
- Always use the image URL format: \`https://image.pollinations.ai/prompt/YOUR_PROMPT_KEYWORDS?width=1024&height=1024&nologo=true&seed=12345\`
- For Typst (.typ): Insert \`#align(center)[#image("https://image.pollinations.ai/prompt/YOUR_PROMPT_KEYWORDS?width=1024&height=1024&nologo=true&seed=12345", width: 50%)]\` or \`#image(...)\`.
- For LaTeX (.tex): Insert \`\\begin{figure}[htbp]\\centering\\includegraphics[width=0.5\\textwidth]{https://image.pollinations.ai/prompt/YOUR_PROMPT_KEYWORDS?width=1024&height=1024&nologo=true&seed=12345}\\end{figure}\`.

You have FULL READ and WRITE (CRUD) access to this document and all sub-files in the project.

Available Agent Action Tags — use these when instructed to create, edit, rename, or delete files:

1. **Targeted patch** (PREFERRED for small edits — only replaces the specified block, leaving the rest untouched):
<patch_file name="filename.ext" find="exact text to find and replace">
replacement text here
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

When the user asks you to create, modify, or manage files, invoke the action tags and explain what you accomplished in clear, concise prose.${projectContext}`;

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
      let creditDeducted = false;

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

          if (!creditDeducted && (chunk.delta || chunk.reasoningDelta) && selectedProviderId === 'anticeil') {
            useCreditStore.getState().deductCredits('docs', 'anticeil');
            creditDeducted = true;
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
      let executedActions = activeDoc ? executeDocAgentActions(activeDoc.id, fullResponse) : [];

      // Full Auto fallback — if no XML tags but clean code was returned, apply it
      if (executedActions.length === 0 && activeDoc) {
        const cleanCode = extractCleanContent(fullResponse);
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
          content: stripAgentActionTags(fullResponse),
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
      if (selectedProviderId === 'anticeil') {
        useCreditStore.getState().refundCredits('docs', 'anticeil');
      }

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

  const handleCopy = (content: string, msgId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };



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

      {/* Model Selector Pill */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-sidebar)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button
          type="button"
          onClick={() => {
            if (!user) {
              openAuthModal('login');
              return;
            }
            setIsModelSelectorOpen(true);
          }}
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
      </div>

      {/* Messages Feed */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: 'var(--bg-sidebar)',
        }}
      >
        {messages.map((msg, index) => {
          // If this is an assistant message following a user message, skip standalone rendering (rendered inside Turn container)
          if (msg.role === 'assistant' && index > 0 && messages[index - 1]?.role === 'user') {
            return null;
          }

          const assistantMsg = msg.role === 'user' && messages[index + 1]?.role === 'assistant' ? messages[index + 1] : undefined;
          const isAssistantStreaming = isGenerating && assistantMsg && assistantMsg.id === streamingMsgIdRef.current;
          const isWelcomeMsg = msg.role === 'assistant' && index === 0;

          if (isWelcomeMsg) {
            return (
              <StudioChatMessage
                key={msg.id}
                id={msg.id}
                role="assistant"
                content={msg.content}
                assistantName="AI Co-Author"
                assistantColor="var(--brand-primary)"
                language={language === 'id' ? 'id' : 'en'}
              />
            );
          }

          const turnSnapshotId = msg.snapshotId || (assistantMsg && assistantMsg.snapshotId);
          const isTurnReverted = msg.reverted || (assistantMsg && assistantMsg.reverted);

          const handleUndoTurn =
            msg.role === 'user' && activeDoc
              ? () => {
                  if (turnSnapshotId) {
                    restoreDocSnapshot(activeDoc.id, turnSnapshotId);
                  }
                  setInputPrompt(msg.content);
                  const idsToRemove = [msg.id];
                  if (assistantMsg) idsToRemove.push(assistantMsg.id);
                  setMessages((prev) => prev.filter((m2) => !idsToRemove.includes(m2.id)));
                  historyStore.removeMessages(activeDoc.id, idsToRemove);
                }
              : undefined;

          return (
            <div
              key={`turn_${msg.id}`}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                width: '100%',
              }}
            >
              {/* User Prompt (Sticky scoped to this turn container) */}
              <StudioChatMessage
                id={msg.id}
                role="user"
                content={msg.content}
                timestamp={msg.timestamp}
                isSticky={true}
                onUndo={handleUndoTurn}
                isReverted={isTurnReverted}
                language={language === 'id' ? 'id' : 'en'}
              />

              {/* Assistant Output Response for this Turn */}
              {assistantMsg && (
                <StudioChatMessage
                  id={assistantMsg.id}
                  role="assistant"
                  content={stripAgentActionTags(assistantMsg.content)}
                  reasoningContent={assistantMsg.reasoningContent}
                  actions={assistantMsg.actions}
                  docId={activeDoc?.id}
                  onOpenVersionHistory={() => setIsVersionModalOpen(true)}
                  isStreaming={isAssistantStreaming}
                  assistantName="AI Co-Author"
                  assistantColor="var(--brand-primary)"
                  language={language === 'id' ? 'id' : 'en'}
                  extraContent={
                    activeDoc && (index >= messages.length - 2 || assistantMsg.content.length > 80) ? (
                      <InteractiveDocCard
                        doc={activeDoc}
                        onOpenEditor={() => {
                          if (onClose) onClose();
                        }}
                        language={language === 'id' ? 'id' : 'en'}
                        isGenerating={isAssistantStreaming}
                      />
                    ) : undefined
                  }
                />
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
        {/* Attachments preview list */}
        {attachments.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
            {attachments.map((att) => (
              <div
                key={att.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                }}
              >
                {att.isImage ? <ImageIcon size={12} color="var(--brand-primary)" /> : <FileText size={12} />}
                <span style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {att.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--text-muted)',
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Active Chips Bar (Pencarian Web & Active Connectors) */}
        {(enableWebSearch || activeConnectorIds.length > 0) && (
          <div
            className="no-scrollbar"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflowX: 'auto',
              overflowY: 'hidden',
              flexWrap: 'nowrap',
              maxWidth: '100%',
              paddingBottom: '2px',
              marginBottom: '8px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {/* Active Web Search Chip */}
            {enableWebSearch && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 8px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#10B981',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                <Globe size={11} />
                <span>{language === 'id' ? 'Pencarian Web' : 'Web Search'}</span>
                <button
                  type="button"
                  onClick={() => setEnableWebSearch(false)}
                  title="Matikan pencarian web"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    color: '#10B981',
                    marginLeft: '2px',
                  }}
                >
                  <X size={11} />
                </button>
              </div>
            )}

            {/* Active Connector Badges */}
            {(['anticeil_image', 'anticeil_video', 'anticeil_audio', 'gmail', 'calendar', 'google_drive', 'notion', 'github', 'custom_webhook'] as const)
              .filter((id) => activeConnectorIds.includes(id))
              .map((connId) => {
              const conn = connectors[connId];
              if (!conn) return null;
              return (
                <div
                  key={connId}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    backgroundColor: 'var(--brand-subtle, rgba(99, 102, 241, 0.12))',
                    border: '1px solid var(--brand-primary, rgba(99, 102, 241, 0.3))',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--brand-primary)',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <ConnectorBrandIcon id={connId} size={13} />
                  <span>{conn.name}</span>
                  <button
                    type="button"
                    onClick={() => toggleActiveConnector(connId)}
                    title={`Lepas sematan ${conn.name}`}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--brand-primary)',
                      marginLeft: '2px',
                    }}
                  >
                    <X size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          onPaste={handlePaste}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: '6px',
            padding: '0 4px 0 6px',
            minHeight: '36px',
            border: '1px solid var(--border-subtle)',
            boxSizing: 'border-box',
            transition: 'all 0.15s ease',
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/*,.pdf,.txt,.csv,.json,.md,.tex,.typ"
            style={{ display: 'none' }}
          />

          {/* Plus (+) Button & Popup Menu Container */}
          <div ref={plusMenuRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setIsPlusMenuOpen((prev) => !prev)}
              title={language === 'id' ? 'Tambah lampiran, keterampilan, atau pencarian' : 'Add attachment, skills, or search'}
              disabled={isGenerating}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: isPlusMenuOpen ? 'var(--bg-subtle)' : 'transparent',
                color: isPlusMenuOpen ? 'var(--text-primary)' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isGenerating ? 'default' : 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
            >
              <Plus
                size={16}
                style={{
                  transform: isPlusMenuOpen ? 'rotate(45deg)' : 'none',
                  transition: 'transform 0.2s ease',
                }}
              />
            </button>

            {/* Popup Menu */}
            {isPlusMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 8px)',
                  left: '0',
                  width: '210px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-lg, 12px)',
                  boxShadow: 'var(--shadow-xl, 0 12px 30px rgba(0,0,0,0.35))',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  zIndex: 100,
                  animation: 'fadeIn 0.15s ease-out',
                }}
              >
                {/* 1. Unggah file */}
                <button
                  type="button"
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    fileInputRef.current?.click();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: 'var(--radius-md, 6px)',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '12.5px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <FileUp size={15} color="var(--text-secondary)" />
                  <span style={{ flex: 1 }}>{language === 'id' ? 'Unggah file' : 'Upload file'}</span>
                </button>

                {/* 2. Berkas terbaru */}
                <button
                  type="button"
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    fileInputRef.current?.click();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: 'var(--radius-md, 6px)',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '12.5px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={15} color="var(--text-secondary)" />
                    <span>{language === 'id' ? 'Berkas terbaru' : 'Recent files'}</span>
                  </div>
                  <ChevronRight size={13} color="var(--text-muted)" />
                </button>

                {/* 3. Keterampilan */}
                <button
                  type="button"
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    if (!user) {
                      openAuthModal('login');
                      return;
                    }
                    setIsModelSelectorOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: 'var(--radius-md, 6px)',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '12.5px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <LayoutGrid size={15} color="var(--text-secondary)" />
                    <span>{language === 'id' ? 'Keterampilan' : 'Skills'}</span>
                  </div>
                  <ChevronRight size={13} color="var(--text-muted)" />
                </button>

                {/* 4. Pencarian Web */}
                <button
                  type="button"
                  onClick={() => {
                    setEnableWebSearch((v) => !v);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: 'var(--radius-md, 6px)',
                    border: 'none',
                    backgroundColor: enableWebSearch ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                    color: enableWebSearch ? '#10B981' : 'var(--text-primary)',
                    fontSize: '12.5px',
                    fontWeight: enableWebSearch ? 600 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!enableWebSearch) e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                  }}
                  onMouseLeave={(e) => {
                    if (!enableWebSearch) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Globe size={15} color={enableWebSearch ? '#10B981' : 'var(--text-secondary)'} />
                    <span>{language === 'id' ? 'Pencarian Web' : 'Web Search'}</span>
                  </div>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '999px',
                      backgroundColor: enableWebSearch ? '#10B981' : 'var(--bg-subtle)',
                      color: enableWebSearch ? '#FFFFFF' : 'var(--text-muted)',
                    }}
                  >
                    {enableWebSearch ? 'ON' : 'OFF'}
                  </span>
                </button>

                <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '3px 4px' }} />

                {/* 5. Kelola Konektor */}
                <button
                  type="button"
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    setIsConnectorsModalOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: 'var(--radius-md, 6px)',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--brand-primary)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--brand-subtle, rgba(99, 102, 241, 0.12))')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Plug size={15} color="var(--brand-primary)" />
                  <span>{language === 'id' ? 'Kelola Konektor' : 'Manage Connectors'}</span>
                </button>
              </div>
            )}
          </div>

          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onPaste={handlePaste}
            placeholder={
              language === 'id'
                ? 'Minta AI tulis bab, rumus TeX... (Paste screenshot)'
                : 'Ask AI to write section, TeX... (Paste screenshot)'
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
            disabled={(!inputPrompt.trim() && attachments.length === 0) || isGenerating}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor:
                (inputPrompt.trim() || attachments.length > 0) && !isGenerating
                  ? 'var(--brand-primary)'
                  : 'transparent',
              color: (inputPrompt.trim() || attachments.length > 0) && !isGenerating ? '#ffffff' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: (inputPrompt.trim() || attachments.length > 0) && !isGenerating ? 'pointer' : 'default',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            {isGenerating ? <RefreshCw size={12} className="spin" /> : <Send size={12} />}
          </button>
        </form>
      </div>

      {/* Version History Modal Dialog */}
      <DocsVersionHistoryModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        activeDoc={activeDoc || null}
        language={language === 'id' ? 'id' : 'en'}
        isCloudUser={isCloudUser}
      />

      {isModelSelectorOpen && (
        <ModelSelectorModal onClose={() => setIsModelSelectorOpen(false)} />
      )}

      {isConnectorsModalOpen && (
        <ConnectorsModal
          isOpen={isConnectorsModalOpen}
          onClose={() => setIsConnectorsModalOpen(false)}
        />
      )}
    </div>
  );
}
