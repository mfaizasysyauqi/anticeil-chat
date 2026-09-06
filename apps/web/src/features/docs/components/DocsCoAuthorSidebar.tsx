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
  cleanAgenticStream,
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
  autoRepairLatexContent,
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
      : action.type === 'checked'
      ? 'Checked'
      : 'Edited';

  const actionColor = action.type === 'delete' ? '#EF4444' : action.type === 'checked' ? '#10B981' : '#10B981';

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

  const activeProviderId = useSettingsStore((s) => s.activeProviderId);
  const activeModelId = useSettingsStore((s) => s.activeModelId);
  const setActiveProviderAndModel = useSettingsStore((s) => s.setActiveProviderAndModel);

  const selectedProviderId = activeProviderId || 'anticeil';
  const selectedModelId =
    activeModelId === 'gemini-2.0-flash'
      ? 'gemini-3.6-flash'
      : (activeModelId || 'gemini-3.6-flash');
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

    setAttachments((prev) => {
      const existingKeys = new Set(prev.map((a) => `${a.name}_${a.size}`));
      return [...prev, ...newAttachments.filter((a) => !existingKeys.has(`${a.name}_${a.size}`))];
    });
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
      setAttachments((prev) => {
        const existingKeys = new Set(prev.map((a) => `${a.name}_${a.size}`));
        return [...prev, ...newAttachments.filter((a) => !existingKeys.has(`${a.name}_${a.size}`))];
      });
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
            timestamp: m.timestamp,
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
                timestamp: m.timestamp,
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
    const subFilesTree = subFiles.map((f) => `- ${f.name} (${f.content.length} chars)`).join('\n');
    
    // Lean context: active file content (max 1800 chars) + main file (max 1200 chars) to prevent 7000 ITPM limit
    const activeFileSnippet = activeSubFile ? activeSubFile.content.slice(0, 1800) : activeDoc?.content.slice(0, 1800) || '';
    const otherFilesSummary = subFiles
      .filter((f) => f.id !== activeDoc?.activeFileId)
      .slice(0, 5)
      .map((f) => `- ${f.name}: ${f.content.slice(0, 200).replace(/\n+/g, ' ')}...`)
      .join('\n');

    const projectContext = activeDoc
      ? `\n\nPROJECT FILES:
- Project Title: "${activeDoc.title}"
- Format: ${activeDoc.format}
- Currently Open File: ${activeSubFile ? activeSubFile.name : 'Main Document'}
- File Tree:
${subFilesTree || '- Main document file (root)'}
${otherFilesSummary ? `\nOther Project Modules:\n${otherFilesSummary}\n` : ''}
CURRENT FILE CONTENT:
\`\`\`
${activeFileSnippet}
\`\`\``
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
    } else if (docFormat === 'typst') {
      formatPreamble = `You are an elite document author & Typst typesetting specialist.
The document workspace is a pure Typst environment (.typ).

STRICT TYPST STANDARDS:
- Always use native Typst markup ($...$ for math, = for headings, #grid for multi-column layouts, #table for tables, #block/#box for containers).
- MULTI-COLUMN GRID LAYOUTS:
  When the user asks for a 2-column or N-column grid (e.g., character profiles, cards, galleries):
  * Wrap each full column's content (Image + Title + Description) inside a single bracketed block [...] per column.
    Example:
    #grid(
      columns: (1fr, 1fr),
      gutter: 20pt,
      [
        #align(center)[
          #box(width: 140pt, height: 140pt, radius: 70pt, stroke: 3pt + rgb("#2d6a4f"), clip: true, image("assets/kancil.png"))
          
          *Si Kancil*
          
          Satwa herbivora kecil yang sangat cerdik...
        ]
      ],
      [
        #align(center)[
          #box(radius: 12pt, stroke: 2pt + rgb("#2d6a4f"), clip: true, image("assets/buaya.png"))
          
          *Si Buaya*
          
          Predator pemelihara ekosistem sungai...
        ]
      ]
    )
  * NEVER pass loose image and text as separate arguments to a 2-column grid.
- Always ensure balanced parentheses and brackets with no stray syntax.`;
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

${connectorsInstruction ? connectorsInstruction + '\n\n' : ''}STRICT COLOR CONTRAST RULES:
- ALWAYS guarantee high visual contrast between text and background across all documents (Typst, LaTeX, Markdown, Slides):
  * When using a dark background (such as #2d6a4f, #1b4332, #0f172a, navy, dark green) for table headers, callout boxes, or badges: the text inside MUST be crisp pure white. In Typst tables with dark header fill, format headers as: [#text(fill: white)[*Nama Kolom*]] or [#text(fill: rgb("#ffffff"))[*Nama Kolom*]].
  * NEVER leave dark text on dark background or light text on light background.

CRITICAL IMAGE & ASSET MANAGEMENT INSTRUCTION:
When the user asks to generate, create, or insert an image, photo, illustration, or logo (e.g., "tambah gambar...", "buat logo...", "generate image"):
- NEVER write raw vector path geometry (#let logo = box(...)), manual Bezier curves, or raw ASCII art.
- NEVER dump raw tool_call JSON, raw tool blocks, or JSON strings into document text files.
- ALWAYS create the image asset file under the assets/ subfolder using <create_file name="assets/nama_gambar.jpg">https://image.pollinations.ai/prompt/YOUR_PROMPT_KEYWORDS?width=1024&height=1024&nologo=true&seed=12345</create_file>.
- ALWAYS import/reference the asset in your document using its relative assets/ path:
  * For Typst (.typ) standard image: #align(center)[#image("assets/nama_gambar.jpg", width: 75%)]
  * For LaTeX (.tex) standard image: \\begin{figure}[htbp]\\centering\\includegraphics[width=0.8\\textwidth]{assets/nama_gambar.jpg}\\end{figure}
  * For Markdown (.md / .slide): ![Judul Gambar](assets/nama_gambar.jpg)

STRICT CIRCULAR & ROUNDED IMAGE RULES:
1. **TYPST PERFECT CIRCLE (STRICTLY BANS CAPSULE / OVAL STRETCHING)**:
   - When asked to make an image circular (lingkaran / circle / bulat / avatar / profile):
   - NEVER use relative width or height (e.g. width: 100%, width: 60%, width: auto) inside a circle or block, because Typst stretches it horizontally into an ugly capsule / oval / stadium shape!
   - ALWAYS use a fixed-dimension #box (or #circle) with identical width and height in points (pt), with radius exactly half of the width, clip: true, and an explicit square image with fit: "cover":
   Structure:
   #align(center)[
     #box(width: 140pt, height: 140pt, radius: 70pt, clip: true, stroke: 2pt + rgb("#2d6a4f"))[
       #image("assets/nama_gambar.jpg", width: 140pt, height: 140pt, fit: "cover")
     ]
   ]
   Or with #circle:
   #align(center)[
     #circle(radius: 70pt, clip: true, stroke: 2pt + rgb("#2d6a4f"))[
       #image("assets/nama_gambar.jpg", width: 140pt, height: 140pt, fit: "cover")
     ]
   ]
   *CRITICAL: The #image MUST explicitly specify width: 140pt, height: 140pt, fit: "cover"! Setting width and height to the exact same fixed pt size guarantees that the image fills the circle 100% without flat top/bottom edges and without oval distortion.*

2. **TYPST ROUNDED RECTANGLE (Borders / Corners)**:
   - For soft rounded corners (not circular):
   #align(center)[
     #block(radius: 12pt, clip: true)[
       #image("assets/nama_gambar.jpg", width: 70%)
     ]
   ]

3. **LATEX PERFECT CIRCLE**:
   \\begin{center}
   \\begin{tcolorbox}[width=5cm,height=5cm,arc=2.5cm,auto outer arc,clip upper,boxsep=0pt,left=0pt,right=0pt,top=0pt,bottom=0pt,colframe=primaryblue,colback=white]
   \\includegraphics[width=5cm,height=5cm,keepaspectratio=false]{assets/nama_gambar.jpg}
   \\end{tcolorbox}
   \\end{center}

You have FULL READ and WRITE (CRUD) access to this document and all sub-files in the project.

MANDATORY AGENT WORKFLOW:
1. ALWAYS begin every response with a <think> block (1-2 concise sentences) detailing what file you are inspecting, your reasoning, and the exact changes you are making. This is strictly required to power the Antigravity Agent Work Timeline:
<think>
Menganalisis file main.typ dan memperbaiki styling gambar sampul agar berbentuk lingkaran sempurna (circle) menggunakan #box berdimensi 140pt x 140pt, radius: 70pt, clip: true, dan image width: 140pt, height: 140pt, fit: "cover".
</think>

2. MANDATORY EXECUTION RULE — NO CONVERSATIONAL-ONLY PROMISES:
Whenever the user asks to modify, fix, style, update, write, add, or delete ANY code, text, or file in the document:
YOU MUST ALWAYS EMIT THE ACTUAL CODE CHANGES VIA ACTION TAGS (<patch_file> or <update_file>).
NEVER, UNDER ANY CIRCUMSTANCES, ONLY SAY IN TEXT THAT YOU UPDATED OR FIXED THE FILE WITHOUT EMITTING THE ACTION TAG!
Saying you updated a file without outputting an action tag will NOT modify the file in the editor!

AVAILABLE ACTION TAGS:

1. **Targeted patch** (PREFERRED for localized changes):
<patch_file name="filename.ext">
<find>
exact original code snippet to find
</find>
<replace>
exact replacement code snippet
</replace>
</patch_file>

2. **Update / Rewrite file** (when change is extensive or structural):
<update_file name="filename.ext">
Complete updated file content...
</update_file>

3. **Create new file**:
<create_file name="filename.ext">
File content here...
</create_file>

4. **Rewrite main document**:
<rewrite_main>
Updated main content here...
</rewrite_main>

5. **Rename file**:
<rename_file from="old_name.ext" to="new_name.ext" />

6. **Delete file**:
<delete_file name="filename.ext" />

After emitting the action tags, provide a brief, polite explanation of what was changed.${projectContext}`;

    // Auto-prune persisted history: keep max 60 msgs and drop anything older than 7 days
    if (activeDoc) {
      const cutoffMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const session = historyStore.getSession(activeDoc.id);
      if (session) {
        const stale = session.messages
          .filter((m) => (m.timestamp ?? 0) < cutoffMs)
          .map((m) => m.id);
        if (stale.length > 0) historyStore.removeMessages(activeDoc.id, stale);
      }
    }

    // Sliding window: send only last 10 messages to avoid 413 / ITPM limits
    const CONTEXT_WINDOW = 10;
    const historyForApi = newHistory.filter((m) => m.id !== assistantMsgId);
    const windowedHistory =
      historyForApi.length > CONTEXT_WINDOW
        ? historyForApi.slice(-CONTEXT_WINDOW)
        : historyForApi;

    const apiMessages: ChatMessage[] = windowedHistory.map((m) => ({
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

          const { cleanContent, reasoningContent: streamReasoning } = cleanAgenticStream(
            fullResponse,
            fullReasoning,
            false
          );

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    content: cleanContent,
                    reasoningContent: streamReasoning || fullReasoning || undefined,
                  }
                : msg
            )
          );
        },
      });

      const { cleanContent: finalCleanContent, reasoningContent: finalReasoning } = cleanAgenticStream(
        fullResponse,
        fullReasoning,
        true
      );

      // After streaming completes, parse and execute agent actions
      let executedActions = activeDoc ? executeDocAgentActions(activeDoc.id, fullResponse) : [];

      // Full Auto fallback — if no XML tags but full clean document code was returned, apply it safely
      if (executedActions.length === 0 && activeDoc) {
        const cleanCode = extractCleanContent(fullResponse);
        if (cleanCode && cleanCode.length > 30 && cleanCode !== fullResponse.trim()) {
          const subFilesList = activeDoc.files || [];
          const curSubFile = subFilesList.find((f) => f.id === activeDoc.activeFileId);
          const existingContent = curSubFile ? curSubFile.content : activeDoc.content;

          // Check if cleanCode is a full document rewrite (has preamble / headers / covers > 50% lines)
          const cleanLines = cleanCode.split('\n').length;
          const existingLines = existingContent.split('\n').length;
          const isFullDocument =
            cleanLines > 10 &&
            (existingLines <= 5 || cleanLines >= existingLines * 0.4 || /#set page|\\documentclass|^#\s+=|\\begin\{document\}/m.test(cleanCode));

          if (isFullDocument) {
            if (curSubFile) {
              updateSubFileContent(activeDoc.id, curSubFile.id, cleanCode);
              executedActions.push({ type: 'update', name: curSubFile.name });
            } else {
              updateDocumentContent(activeDoc.id, cleanCode);
              executedActions.push({ type: 'update', name: activeDoc.title || 'Dokumen' });
            }
          }
        }
      }

      // Syntax Verification & Auto-Repair Loop Phase
      if (activeDoc) {
        const latestDoc = useDocsStore.getState().documents.find((d) => d.id === activeDoc.id);
        if (latestDoc) {
          const filesToCheck = (latestDoc.files || []).filter((f) =>
            executedActions.some((a) => a.name.toLowerCase() === f.name.toLowerCase())
          );

          if (filesToCheck.length > 0) {
            for (const file of filesToCheck) {
              const repaired = autoRepairLatexContent(file.content, file.name);
              if (repaired && repaired !== file.content) {
                updateSubFileContent(latestDoc.id, file.id, repaired);
              }
              executedActions.push({ type: 'checked', name: file.name });
            }
          } else {
            // Check active subfile or main document content
            const activeSub = (latestDoc.files || []).find((f) => f.id === latestDoc.activeFileId) || (latestDoc.files || [])[0];
            if (activeSub) {
              const repaired = autoRepairLatexContent(activeSub.content, activeSub.name);
              if (repaired && repaired !== activeSub.content) {
                updateSubFileContent(latestDoc.id, activeSub.id, repaired);
              }
              executedActions.push({ type: 'checked', name: activeSub.name });
            } else if (latestDoc.content) {
              const repaired = autoRepairLatexContent(latestDoc.content, 'main.typ');
              if (repaired && repaired !== latestDoc.content) {
                updateDocumentContent(latestDoc.id, repaired);
              }
              executedActions.push({ type: 'checked', name: 'main.typ' });
            }
          }
        }
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: finalCleanContent,
                reasoningContent: finalReasoning || fullReasoning || undefined,
                actions: executedActions.length > 0 ? executedActions : undefined,
              }
            : msg
        )
      );

      // Persist assistant message to history
      if (activeDoc) {
        const finalMsg: CoAuthorMessage = {
          id: assistantMsgId,
          role: 'assistant',
          content: stripAgentActionTags(finalCleanContent),
          reasoningContent: finalReasoning || fullReasoning || undefined,
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
            setActiveProviderAndModel(providerId, modelId);
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
                  // Find index of this turn in the messages list
                  const msgIndex = messages.findIndex((m2) => m2.id === msg.id);
                  if (msgIndex !== -1) {
                    // Cascade undo: remove this turn AND all subsequent turns after it
                    const idsToRemove = messages.slice(msgIndex).map((m2) => m2.id);
                    historyStore.removeMessages(activeDoc.id, idsToRemove);
                    if (isCloudUser && authSession?.access_token) {
                      historyStore.syncToCloud(activeDoc.id, authSession.access_token);
                    }
                    setMessages((prev) => prev.slice(0, msgIndex));
                  }
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
