'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  FileText,
  Table,
  Presentation,
  GraduationCap,
  Cpu,
  Sigma,
  FolderOpen,
  X,
  ArrowUpRight,
  Layers,
  Gauge,
  FileCode,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDocsStore, DocFormat } from '../store/useDocsStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useCreditStore } from '../../credits/store/useCreditStore';
import { useCoAuthorHistoryStore, CoAuthorMessage } from '../store/useCoAuthorHistoryStore';
import { useCoAuthorEditActions } from '../hooks/useCoAuthorEditActions';
import { streamBYOKChat } from '../../chat/data/byokApi';
import { ChatMessage, getModelById, isCloudTier, cleanAgenticStream } from '@anticeil/core';
import { ModelSelectorModal } from '../../chat/components/ModelSelectorModal';
import { PromptBar, PromptAttachment } from '../../../shared/components/PromptBar';
import { DropdownSelect } from '../../../shared/components/DropdownSelect';
import { ThinkingTimeline } from '../../chat/components/ThinkingTimeline';
import { MarkdownRenderer } from '../../../shared/components/MarkdownRenderer';
import { AIChatBubble } from '../../../shared/components/AIChatBubble';
import { InteractiveDocCard } from './shared/InteractiveDocCard';
import { executeDocAgentActions, extractCleanContent, stripAgentActionTags } from '../utils/docAgentUtils';

interface DocsLandingViewProps {
  onStartGenerate?: (prompt: string, format: DocFormat) => void;
}

export function DocsLandingView({ onStartGenerate }: DocsLandingViewProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const user = useAuthStore((s) => s.user);
  const authSession = useAuthStore((s) => s.session);
  const tier = useAuthStore((s) => s.tier);
  const isCloudUser = isCloudTier(tier);

  const docs = useDocsStore((s) => s.documents);
  const activeDocId = useDocsStore((s) => s.activeDocId);
  const setActiveDocId = useDocsStore((s) => s.setActiveDocId);
  const selectedFormat = useDocsStore((s) => s.selectedFormat);
  const setSelectedFormat = useDocsStore((s) => s.setSelectedFormat);

  const selectedCategory: 'doc' | 'slide' | 'sheet' =
    selectedFormat === 'sheet' ? 'sheet' : selectedFormat === 'slide' ? 'slide' : 'doc';

  const selectedEngine: 'latex' | 'typst' =
    selectedFormat === 'typst' ? 'typst' : 'latex';
  const createDocument = useDocsStore((s) => s.createDocument);
  const updateDocumentContent = useDocsStore((s) => s.updateDocumentContent);
  const updateDocumentTitle = useDocsStore((s) => s.updateDocumentTitle);
  const copilotPendingPrompt = useDocsStore((s) => s.copilotPendingPrompt);
  const setCopilotPendingPrompt = useDocsStore((s) => s.setCopilotPendingPrompt);

  const activeModelId = useSettingsStore((s) => s.activeModelId);
  const activeProviderId = useSettingsStore((s) => s.activeProviderId);
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const currentModel = getModelById(activeModelId);
  const modelDisplayName = currentModel?.name || activeModelId || 'Auto Router';

  const activeProjectId = useDocsStore((s) => s.activeProjectId);
  const setActiveProjectId = useDocsStore((s) => s.setActiveProjectId);
  const docFolders = useDocsStore((s) => s.folders);
  const language = useSettingsStore((s) => (s.language === 'id' ? 'id' : 'en'));

  const historyStore = useCoAuthorHistoryStore();
  const activeDoc = docs.find((d) => d.id === activeDocId);

  const [messages, setMessages] = useState<CoAuthorMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamingMsgIdRef = useRef<string | null>(null);

  const activeProject = docFolders.find((p) => p.id === activeProjectId);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load existing session messages when activeDoc changes
  useEffect(() => {
    if (isGenerating) return;
    if (activeDocId) {
      const stored = historyStore.getSession(activeDocId);
      if (stored && stored.messages.length > 0) {
        // Deduplicate messages by ID
        const seen = new Set<string>();
        const deduped = stored.messages.filter((m) => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
        setMessages(deduped);
      } else {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [activeDocId, isGenerating]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  // Handle pending prompt from router or store
  useEffect(() => {
    if (copilotPendingPrompt && mounted && !isGenerating) {
      const p = copilotPendingPrompt;
      setCopilotPendingPrompt(null);
      handleSendPrompt(p);
    }
  }, [copilotPendingPrompt, mounted, isGenerating]);

  const [attachments, setAttachments] = useState<PromptAttachment[]>([]);

  const handleSendPrompt = async (promptText: string, fromEdit?: boolean) => {
    const text = promptText.trim();
    if ((!text && attachments.length === 0) || isGenerating) return;

    // Check credits upfront (do not deduct until generation succeeds)
    const providerId = activeProviderId || 'anticeil';
    if (providerId === 'anticeil') {
      const allowed = useCreditStore.getState().canAfford('docs', 'anticeil');
      if (!allowed) {
        useCreditStore.getState().setLimitModalOpen(true, 'docs');
        return;
      }
    }

    // Format attachments into prompt context
    let formattedText = text;
    if (attachments.length > 0) {
      const attachmentContexts = attachments
        .map((att) => {
          if (att.type === 'text' && att.textContent) {
            return `[Attached Document/Code: ${att.name}]\n\`\`\`\n${att.textContent}\n\`\`\``;
          } else if (att.type === 'image' && att.dataUrl) {
            return `[Attached Screenshot/Image: ${att.name}] (Base64 Image Context: ${att.dataUrl})`;
          } else {
            return `[Attached File: ${att.name} (${Math.round(att.size / 1024)} KB)]`;
          }
        })
        .join('\n\n');

      formattedText = text
        ? `${text}\n\n--- LAMPIRAN KONTEKS BERKAS ---\n${attachmentContexts}`
        : `--- LAMPIRAN KONTEKS BERKAS ---\n${attachmentContexts}`;
    }

    const currentAttachments = [...attachments];
    setPrompt('');
    setAttachments([]);

    // Ensure we have an active document
    let targetDoc = activeDoc;
    let targetDocId = activeDocId;

    if (!targetDoc || !targetDocId) {
      const defaultTitle = (text || currentAttachments[0]?.name || 'Untitled').slice(0, 45);
      targetDocId = createDocument(defaultTitle, '', selectedFormat, activeProjectId);
      setActiveDocId(targetDocId);
      targetDoc = docs.find((d) => d.id === targetDocId) || {
        id: targetDocId,
        title: defaultTitle,
        content: '',
        format: selectedFormat,
        updatedAt: Date.now(),
        projectId: activeProjectId,
      };
    }

    const userMsgId = fromEdit ? null : 'u_' + Date.now();
    const assistantMsgId = 'a_' + Date.now();
    streamingMsgIdRef.current = assistantMsgId;

    const displayUserContent = text
      ? currentAttachments.length > 0
        ? `${text}\n\n📎 *[Attached ${currentAttachments.length} file(s): ${currentAttachments.map((a) => a.name).join(', ')}]*`
        : text
      : `📎 *[Attached ${currentAttachments.length} file(s): ${currentAttachments.map((a) => a.name).join(', ')}]*`;

    let updatedHistory;
    if (fromEdit) {
      // Only append assistant message; edited user msg already in messages
      const assistantMsg: CoAuthorMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        reasoningContent: '',
        timestamp: Date.now() + 1,
      };
      updatedHistory = [...messages];
      // Find edited user message by content (saved prompt) and keep only up to it
      const editedMsgIndex = updatedHistory.findIndex((m) => m.role === 'user' && m.content === text);
      if (editedMsgIndex >= 0) {
        updatedHistory = updatedHistory.slice(0, editedMsgIndex + 1);
      }
      updatedHistory.push(assistantMsg);
      setMessages(updatedHistory);
    } else {
      const userMsg: CoAuthorMessage = {
        id: userMsgId!,
        role: 'user',
        content: displayUserContent,
        timestamp: Date.now(),
      };
      const assistantMsg: CoAuthorMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        reasoningContent: '',
        timestamp: Date.now() + 1,
      };
      updatedHistory = [...messages, userMsg, assistantMsg];
      setMessages(updatedHistory);
      historyStore.saveMessage(targetDocId, targetDoc.title, userMsg);
    }
    if (fromEdit) {
      historyStore.saveMessage(targetDocId, targetDoc.title, { id: assistantMsgId, role: 'assistant', content: '', timestamp: Date.now() + 1 });
    }
    setIsGenerating(true);

    const activeApiKeyConfig = (apiKeys as Record<string, any>)[providerId] || { apiKey: '', isEnabled: false };

    let systemInstruction = '';
    if (selectedFormat === 'sheet') {
      systemInstruction =
        'You are an expert financial and data spreadsheet modeler specializing in AntSheet modular workbooks. Always organize the project into a Feature-First modular structure with multiple files using <create_file name="..."> tags:\n1. <create_file name="sheet1.antsheet">...Executive overview with ## Meta, ## Cells, formulas, and charts...</create_file>\n2. <create_file name="sheets/model.antsheet">...Detailed calculation sheet layer...</create_file>\n3. <create_file name="data/dictionary.md">...Data dictionary, metric definitions, and notes...</create_file>\nAlways generate each file completely without truncation.';
    } else if (selectedFormat === 'slide') {
      systemInstruction =
        'You are an elite presentation designer specializing in modular slide decks. Always organize the project into a Feature-First modular structure with multiple files using <create_file name="..."> tags:\n1. <create_file name="main.slide">...Master slide deck manifest that includes sub-slides using @[include](slides/01_title.md) separated by "---"...</create_file>\n2. <create_file name="slides/01_title.md">...Title slide...</create_file>\n3. <create_file name="slides/02_problem.md">...Problem statement & challenge...</create_file>\n4. <create_file name="slides/03_solution.md">...Solution & architecture...</create_file>\n5. <create_file name="slides/04_metrics.md">...Metrics & growth KPIs...</create_file>\n6. <create_file name="slides/05_roadmap.md">...Roadmap & conclusion...</create_file>\nAlways generate each file completely without truncation.';
    } else if (selectedFormat === 'typst') {
      systemInstruction = `You are an elite document author & Typst typesetting specialist.
Always organize the project into a clean Feature-First modular structure with multiple files using <create_file name="..."> tags:
- <create_file name="main.typ">: Master document written in clean Typst markup (#set page(paper: "a4"), #set text(font: "Liberation Sans", size: 11pt), #include "sections/01_intro.typ", etc.).
- <create_file name="sections/01_intro.typ">: Introduction & executive summary chapter using Typst headings (= Chapter 1) and bold markup.
- <create_file name="sections/02_analysis.typ">: Technical analysis, tables (#table(...)), and formulas using Typst math ($ E = m c^2 $).
- <create_file name="sections/03_summary.typ">: Conclusions & summary.
Always generate each file completely without truncation. Use native Typst markup ($...$ for math, = for headings, #grid for layouts, #table for tables).`;
    } else {
      systemInstruction = `You are an elite, publication-grade AI Document Architect & Technical Author specializing in modular LaTeX (.tex) and Markdown (.md) documents.
Your output must always be indistinguishable from high-end academic publications, executive whitepapers, and official reports.

STRICT DESIGN, PAGE SPLITTING & SYNTAX RULES:
1. MODULAR PROJECT STRUCTURE, PAGINATION & PAGE FLOW:
Always organize the project into a clean Feature-First modular structure with multiple files using <create_file name="..."> tags:
- <create_file name="main.tex">: Master document from \\documentclass[11pt,a4paper]{article} to \\end{document}.
  Exact sequence in main.tex:
  a. Preamble with packages (amsmath, hyperref, booktabs, xcolor, tcolorbox) & custom color definitions.
  b. \\begin{document}
  c. \\begin{titlepage} ... \\end{titlepage} (Cover page: centered horizontally & vertically, NO page number)
  d. \\newpage
  e. \\pagenumbering{roman}
  f. \\setcounter{page}{1}
  g. Preliminary sections: \\begin{tcolorbox}... Ringkasan Eksekutif / Kata Pengantar ... \\end{tcolorbox}
  h. \\newpage
  i. \\tableofcontents
  j. \\newpage
  k. \\pagenumbering{arabic}
  l. \\setcounter{page}{1}
  m. Major content chapters (EVERY chapter/bab must be on a new page by default):
     \\newpage
     \\input{sections/01_overview.tex}
     \\newpage
     \\input{sections/02_architecture.tex}
     \\newpage
     \\input{sections/03_details.tex}
     \\newpage
     \\input{sections/04_summary.tex}
  n. \\end{document}

2. EXQUISITE COVER PAGE STANDARD (in main.tex inside \\begin{titlepage}):
Every document MUST have a dedicated cover page that is centered horizontally and vertically:
- Structure:
  \\begin{titlepage}
  \\thispagestyle{empty}
  \\centering
  \\vspace*{\\fill}
  {\\small \\scshape \\color{darkgray} DOKUMEN RESMI / LAPORAN EKSEKUTIF / TUGAS AKHIR}\\\\[1cm]
  {\\Huge \\bfseries \\color{primaryblue} JUDUL UTAMA DOKUMEN}\\\\[0.4cm]
  {\\color{accentgold}\\hrule height 1.5pt}\\\\[0.6cm]
  \\begin{tcolorbox}[colback=lightgray,colframe=primaryblue,arc=3mm,width=0.92\\textwidth]
  \\centering
  {\\Large \\textbf{Subjudul atau Fokus Dokumen}}\\\\[0.25cm]
  {\\small Deskripsi ringkas mengenai ruang lingkup, metodologi, dan tujuan dokumen.}
  \\end{tcolorbox}\\\\[1cm]
  \\begin{tabular}{r l}
  \\textbf{Penyusun} & : Nama Tim / Penulis \\\\
  \\textbf{Institusi} & : Nama Instansi / Universitas \\\\
  \\textbf{Kategori} & : Laporan Teknis / Biografi / Skripsi \\\\
  \\textbf{Versi} & : 1.0 (Dokumen Lengkap) \\\\
  \\end{tabular}
  \\vspace*{\\fill}
  {\\small \\today \\quad | \\quad Jakarta, Indonesia}
  \\end{titlepage}

3. CHAPTER ISOLATION & DEFAULT NEWPAGE:
- Every chapter or section file (e.g. sections/01_overview.tex) MUST start with a \\section{...}.
- Each chapter in main.tex MUST be preceded by \\newpage so that each bab/chapter always starts on a fresh page.
- Preliminary pages (before main body: Ringkasan, Kata Pengantar, Daftar Isi) use Roman numerals (\\pagenumbering{roman}).
- Main body (from Chapter 1 / Section 1 onwards) uses standard Arabic numerals (\\pagenumbering{arabic}).

4. COMPILABLE & ROBUST LATEX SYNTAX:
- Always escape literal symbols in text: use \\& for ampersand, \\% for percent, \\_ for underscore, \\$ for dollar, \\# for hash.
- Use standard \\begin{description} \\item[Label:] Penjelasan \\end{description} for definition lists. DO NOT add [leftmargin=*].
- For tables (such as in sections/04_summary.tex), ALWAYS write complete data rows inside \\begin{tabular}{...} ... \\end{tabular} with actual data. End every row with \\\\ or \\\\ \\hline. Never place multiple rows on one line without \\\\.
- Use \\begin{tcolorbox}[colback=lightgray,colframe=primaryblue,arc=2mm,width=\\textwidth] for callouts and notes.
- NEVER mix raw Markdown (such as '###' or '**bold**') inside .tex files.
- NEVER truncate or stop generating halfway; always generate each file completely from beginning to end.`;
    }

    const apiMessages: ChatMessage[] = updatedHistory
      .filter((m) => m.id !== assistantMsgId)
      .map((m) => ({
        id: m.id,
        sessionId: 'docs_coauthor',
        role: m.role,
        content: m.id === userMsgId ? formattedText : m.content,
        timestamp: m.timestamp,
        status: 'done' as const,
      }));

    let fullResponse = '';
    let fullReasoning = '';
    let creditDeducted = false;

    try {
      await streamBYOKChat({
        providerId,
        modelId: activeModelId || 'qwen/qwen3.8-27b',
        systemPrompt: systemInstruction,
        messages: apiMessages,
        apiKeyConfig: activeApiKeyConfig,
        temperature: 0.6,
        tier: tier,
        maxTokens: 8192,
        onChunk: (chunk) => {
          if (chunk.delta) {
            fullResponse += chunk.delta;
          }
          if (chunk.reasoningDelta) {
            fullReasoning += chunk.reasoningDelta;
          }

          // Deduct credits on first actual content received
          if (!creditDeducted && (chunk.delta || chunk.reasoningDelta) && providerId === 'anticeil') {
            const promptLength = apiMessages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
            useCreditStore.getState().deductCredits('docs', 'anticeil', {
              modelId: activeModelId,
              promptLength,
              totalTokens: chunk.promptTokens,
            });
            creditDeducted = true;
          }

          const { cleanContent, reasoningContent } = cleanAgenticStream(
            fullResponse,
            fullReasoning,
            chunk.isDone || false
          );

          setMessages((prev) => {
            const hasAssistant = prev.some((msg) => msg.id === assistantMsgId);
            if (!hasAssistant) {
              return [
                ...prev,
                {
                  id: assistantMsgId,
                  role: 'assistant',
                  content: cleanContent || fullResponse,
                  reasoningContent: reasoningContent || fullReasoning,
                  timestamp: Date.now(),
                  agentSteps: [
                    { id: 'step-synthesis', phase: 'synthesis' as const, title: 'Generating…', content: (cleanContent || fullResponse).slice(0, 60), timestamp: Date.now() },
                  ],
                },
              ];
            }
            return prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    content: cleanContent || fullResponse,
                    reasoningContent: reasoningContent || fullReasoning,
                    agentSteps: [
                      ...(reasoningContent || fullReasoning ? [{ id: 'step-reasoning', phase: 'reasoning' as const, title: 'Reasoning', content: (reasoningContent || fullReasoning).slice(0, 120), timestamp: Date.now() }] : []),
                      { id: 'step-synthesis', phase: 'synthesis' as const, title: 'Generating…', content: (cleanContent || fullResponse).slice(0, 80), timestamp: Date.now() },
                    ],
                  }
                : msg
            );
          });

          // Execute multi-file actions live if tags are present
          const rawForActions = cleanContent || fullResponse;
          if (targetDocId && rawForActions.length > 20) {
            const executed = executeDocAgentActions(targetDocId, rawForActions);
            if (executed.length === 0) {
              const cleanCode = extractCleanContent(rawForActions);
              if (cleanCode && cleanCode.length > 15) {
                updateDocumentContent(targetDocId, cleanCode);
              }
            }
          }
        },
      });

      // Final persistence
      const { cleanContent: finalContent, reasoningContent: finalReasoning } = cleanAgenticStream(
        fullResponse,
        fullReasoning,
        true
      );
      if (targetDocId) {
        const finalRaw = finalContent || fullResponse;
        const executed = executeDocAgentActions(targetDocId, finalRaw);
        if (executed.length === 0) {
          const finalCleanCode = extractCleanContent(finalRaw);
          if (finalCleanCode) {
            updateDocumentContent(targetDocId, finalCleanCode);
          }
        }
      }

      if (targetDocId && targetDoc) {
        const finalMsg: CoAuthorMessage = {
          id: assistantMsgId,
          role: 'assistant',
          content: finalContent || fullResponse,
          reasoningContent: finalReasoning || fullReasoning || undefined,
          timestamp: Date.now(),
          agentSteps: [
            ...(finalReasoning || fullReasoning ? [{ id: 'step-reasoning', phase: 'thinking' as const, title: 'Thinking', content: (finalReasoning || fullReasoning).slice(0, 200), timestamp: Date.now() }] : []),
            { id: 'step-synthesis', phase: 'synthesis' as const, title: 'Synthesis', content: (finalContent || fullResponse).slice(0, 100), timestamp: Date.now() },
            { id: 'step-result', phase: 'result' as const, title: 'Result', content: `${(finalContent || fullResponse).split(' ').length} words generated`, timestamp: Date.now() },
          ],
        };
        historyStore.saveMessage(targetDocId, targetDoc.title, finalMsg);

        if (isCloudUser && authSession?.access_token) {
          historyStore.syncToCloud(targetDocId, authSession.access_token);
        }
      }
    } catch (err) {
      console.warn('[DocsLandingView] Streaming error:', err);
      // If credits were deducted but generation failed, refund them immediately
      if (creditDeducted && providerId === 'anticeil') {
        useCreditStore.getState().refundCredits('docs', 'anticeil');
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content:
                  language === 'id'
                    ? 'Maaf, terjadi kendala saat menghubungi model AI. Silakan periksa koneksi atau API Key Anda di Pengaturan.'
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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;
    handleSendPrompt(prompt.trim());
  };

  // ── Edit & Undo Hook (reusable logic - must be after handleSendPrompt) ──
  const editActions = useCoAuthorEditActions({
    activeDocId,
    messages,
    setMessages,
  });

  const formatOptions: { id: DocFormat; label: string; icon: React.ReactNode }[] = [
    {
      id: 'latex',
      label: language === 'id' ? 'Dokumen (LaTeX)' : 'Document (LaTeX)',
      icon: <FileText size={14} color="var(--brand-primary, #0073EA)" />,
    },
    {
      id: 'typst',
      label: language === 'id' ? 'Dokumen (Typst)' : 'Document (Typst)',
      icon: <FileCode size={14} color="var(--accent-success, #10B981)" />,
    },
    {
      id: 'sheet',
      label: 'Spreadsheet',
      icon: <Table size={14} color="var(--accent-success, #10B981)" />,
    },
    {
      id: 'slide',
      label: 'Slide',
      icon: <Presentation size={14} color="var(--brand-secondary, #8B5CF6)" />,
    },
  ];

  // Format-specific starter cards
  const starterCards = useMemo(() => {
    if (selectedFormat === 'sheet') {
      return [
        {
          format: 'sheet' as DocFormat,
          category: language === 'id' ? 'Model Keuangan' : 'Financial Model',
          icon: Table,
          color: '#10B981',
          badgeBg: 'rgba(16, 185, 129, 0.12)',
          title: language === 'id' ? 'Proyeksi Keuangan Startup 5 Tahun' : '5-Year Startup Financial Projections',
          prompt:
            language === 'id'
              ? 'Buatkan spreadsheet proyeksi keuangan 5 tahun dengan formula MRR, CAC, LTV, Burn Rate, dan chart ringkasan performa.'
              : 'Generate a 5-year financial projection spreadsheet with MRR, CAC, LTV, Burn Rate formulas, and performance charts.',
        },
        {
          format: 'sheet' as DocFormat,
          category: language === 'id' ? 'Analisis SaaS' : 'SaaS Analytics',
          icon: Sigma,
          color: '#06B6D4',
          badgeBg: 'rgba(6, 182, 212, 0.12)',
          title: language === 'id' ? 'Kohort Retensi & Metrik Pelanggan' : 'SaaS Retention & Cohort Model',
          prompt:
            language === 'id'
              ? 'Buatkan model tabel analisis kohort retensi pelanggan SaaS bulanan dengan formula churn rate dan net revenue retention.'
              : 'Build a SaaS monthly customer cohort retention analysis table with churn rate and net revenue retention formulas.',
        },
        {
          format: 'sheet' as DocFormat,
          category: language === 'id' ? 'Anggaran Marketing' : 'Marketing Budget',
          icon: Gauge,
          color: '#8B5CF6',
          badgeBg: 'rgba(139, 92, 246, 0.12)',
          title: language === 'id' ? 'Pelacak Anggaran & ROI Iklan Multi-Channel' : 'Marketing Budget & ROI Tracker',
          prompt:
            language === 'id'
              ? 'Rancang spreadsheet alokasi budget kampanye digital marketing (Google, Meta, LinkedIn) dengan kalkulator ROI dan ROAS.'
              : 'Design a multi-channel digital marketing budget allocation spreadsheet with automated ROI and ROAS calculators.',
        },
        {
          format: 'sheet' as DocFormat,
          category: language === 'id' ? 'Struktur Ekuitas' : 'Cap Table',
          icon: Table,
          color: '#F59E0B',
          badgeBg: 'rgba(245, 158, 11, 0.12)',
          title: language === 'id' ? 'Tabel Kepemilikan Saham & Dilusi Seri A' : 'Cap Table & Series A Dilution',
          prompt:
            language === 'id'
              ? 'Buatkan simulasi Cap Table kepemilikan saham pendiri, investor awal, ESOP, dan efek dilusi pendanaan putaran berikutnya.'
              : 'Draft a cap table equity distribution model for founders, angel investors, ESOP pool, and next funding round dilution.',
        },
      ];
    }

    if (selectedFormat === 'slide') {
      return [
        {
          format: 'slide' as DocFormat,
          category: language === 'id' ? 'Pitch Deck' : 'Pitch Deck',
          icon: Presentation,
          color: '#8B5CF6',
          badgeBg: 'rgba(139, 92, 246, 0.12)',
          title: language === 'id' ? 'Presentasi Investor Series A (10 Slide)' : 'Series A Investor Deck (10 Slides)',
          prompt:
            language === 'id'
              ? 'Buatkan 10 slide presentasi investor pitch deck berstruktur Problem, Solution, Market TAM, Traction, Business Model, dan Ask.'
              : 'Create a 10-slide investor pitch deck covering Problem, Solution, Market TAM, Traction, Business Model, and Ask.',
        },
        {
          format: 'slide' as DocFormat,
          category: language === 'id' ? 'Arsitektur Teknis' : 'Tech Architecture',
          icon: Layers,
          color: '#0073EA',
          badgeBg: 'rgba(0, 115, 234, 0.12)',
          title: language === 'id' ? 'Presentasi Desain Sistem & Infrastruktur' : 'System Design & Infrastructure Deck',
          prompt:
            language === 'id'
              ? 'Rancang slide presentasi arsitektur sistem cloud native terdistribusi lengkap dengan diagram komponen dan alur throughput.'
              : 'Design a technical slide presentation on distributed cloud-native architecture with component diagrams and throughput flows.',
        },
        {
          format: 'slide' as DocFormat,
          category: language === 'id' ? 'Peluncuran Produk' : 'Product Launch',
          icon: Sparkles,
          color: '#EC4899',
          badgeBg: 'rgba(236, 72, 153, 0.12)',
          title: language === 'id' ? 'Keynote Showcase Fitur & Roadmap Produk' : 'Product Launch & Roadmap Keynote',
          prompt:
            language === 'id'
              ? 'Buatkan presentasi keynote peluncuran produk baru dengan showcase fitur unggulan, proposisi nilai, dan linimasa rilis.'
              : 'Craft a product keynote presentation showcasing core hero features, unique value propositions, and release timelines.',
        },
        {
          format: 'slide' as DocFormat,
          category: language === 'id' ? 'Review Bisnis' : 'Business Review',
          icon: Presentation,
          color: '#10B981',
          badgeBg: 'rgba(16, 185, 129, 0.12)',
          title: language === 'id' ? 'Quarterly Business Review (QBR Executive)' : 'Executive Quarterly Business Review',
          prompt:
            language === 'id'
              ? 'Buatkan slide laporan QBR eksekutif yang merangkum pencapaian KPI kuartalan, pembelajaran, tantangan, dan target kuartal depan.'
              : 'Create an executive QBR slide deck summarizing quarterly KPI achievements, learnings, blockers, and next quarter targets.',
        },
      ];
    }

    // Default: LaTeX / Document
    return [
      {
        format: 'latex' as DocFormat,
        category: language === 'id' ? 'Dokumentasi & API' : 'Software & API Docs',
        icon: FileCode,
        color: '#0073EA',
        badgeBg: 'rgba(0, 115, 234, 0.12)',
        title: language === 'id' ? 'Dokumentasi Software & REST API' : 'Software & REST API Documentation',
        prompt:
          language === 'id'
            ? 'Buatkan dokumentasi teknis lengkap dan spesifikasi REST API untuk sistem backend microservice dengan arsitektur, autentikasi Bearer token, dan parameter endpoint.'
            : 'Draft a complete technical software documentation and REST API specification for a microservice backend with architecture diagrams, Bearer auth, and endpoint parameters.',
      },
      {
        format: 'latex' as DocFormat,
        category: language === 'id' ? 'Spesifikasi Produk' : 'Product PRD',
        icon: Layers,
        color: '#EC4899',
        badgeBg: 'rgba(236, 72, 153, 0.12)',
        title: language === 'id' ? 'Product Requirement Document (PRD)' : 'Product Requirement Document',
        prompt:
          language === 'id'
            ? 'Tuliskan dokumen PRD spesifikasi produk aplikasi modern lengkap dengan latar belakang masalah, user personas, functional requirements, dan OKRs.'
            : 'Write a comprehensive Product Requirement Document (PRD) with problem statement, user stories, functional requirements, and success metrics.',
      },
      {
        format: 'latex' as DocFormat,
        category: language === 'id' ? 'Paper & Thesis' : 'Academic & Thesis',
        icon: GraduationCap,
        color: '#8B5CF6',
        badgeBg: 'rgba(139, 92, 246, 0.12)',
        title: language === 'id' ? 'Paper Riset Ilmiah IEEE/ACM' : 'Academic Research Paper',
        prompt:
          language === 'id'
            ? 'Buatkan paper riset akademis lengkap format LaTeX IEEE tentang optimasi model kecerdasan buatan dengan rumus KaTeX dan tabel benchmark.'
            : 'Draft an academic research paper in IEEE LaTeX format on AI model optimization with KaTeX equations and empirical benchmark tables.',
      },
      {
        format: 'latex' as DocFormat,
        category: language === 'id' ? 'Laporan Bisnis' : 'Business Report',
        icon: Cpu,
        color: '#10B981',
        badgeBg: 'rgba(16, 185, 129, 0.12)',
        title: language === 'id' ? 'Laporan Eksekutif & Analisis Arsitektur' : 'Executive & Architecture Report',
        prompt:
          language === 'id'
            ? 'Tuliskan laporan arsitektur cloud enterprise dan analisis risiko implementasi sistem terdistribusi dengan matriks SLA dan evaluasi biaya.'
            : 'Write an executive cloud architecture report and distributed system risk analysis with SLA matrices and cost-benefit evaluations.',
      },
    ];
  }, [selectedFormat, language]);

  const heroBadge =
    selectedFormat === 'sheet'
      ? language === 'id'
        ? 'Spreadsheet Studio • Smart Formula • AI Co-Author'
        : 'Spreadsheet Studio • Smart Formulas • AI Co-Author'
      : selectedFormat === 'slide'
      ? language === 'id'
        ? 'Slide Studio • Pitch Decks • AI Co-Author'
        : 'Slide Studio • Pitch Decks • AI Co-Author'
      : language === 'id'
      ? 'Dokumen & LaTeX • KaTeX Math • AI Co-Author'
      : 'Docs & LaTeX • KaTeX Math • AI Co-Author';

  const heroTitle =
    selectedFormat === 'sheet'
      ? language === 'id'
        ? 'Data apa yang ingin dianalisis?'
        : 'What data shall we analyze?'
      : selectedFormat === 'slide'
      ? language === 'id'
        ? 'Presentasi apa yang ingin dibuat?'
        : 'What story shall we present?'
      : language === 'id'
      ? 'Mulai dari mana kita hari ini?'
      : 'Where should we begin?';

  const heroSubtitle =
    selectedFormat === 'sheet'
      ? language === 'id'
        ? 'Buat model keuangan, analisis metrik, dan tabel kalkulasi cerdas bersama AI Co-Author.'
        : 'Generate financial models, metric trackers, and automated calculations with AI Co-Author.'
      : selectedFormat === 'slide'
      ? language === 'id'
        ? 'Rancang slide deck investor, materi presentasi, dan visual interaktif bersama AI Co-Author.'
        : 'Craft investor pitch decks, keynote presentations, and interactive visual slides with AI Co-Author.'
      : language === 'id'
      ? 'Hasilkan paper riset, formula KaTeX, dan dokumen teknis lengkap bersama AI Co-Author.'
      : 'Draft research papers, KaTeX math formulas, spreadsheets, and presentation slides.';

  const activeColor =
    selectedFormat === 'sheet'
      ? 'var(--accent-success, #10B981)'
      : selectedFormat === 'slide'
      ? 'var(--brand-secondary, #8B5CF6)'
      : 'var(--brand-primary, #0073EA)';

  const handleOpenEditor = (targetId?: string) => {
    const id = targetId || activeDocId;
    if (id) {
      router.push(`/docs/${id}`);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Scrollable Upper / Middle Area ── */}
      <div
        ref={scrollRef}
        className="page-scroll-container"
        style={{
          flex: 1,
          overflowY: 'auto',
          justifyContent: hasMessages ? 'flex-start' : 'center',
        }}
      >
        <div
          className="page-content-wrapper"
          style={{
            gap: hasMessages ? 'var(--space-lg)' : 'var(--space-xl)',
            padding: 'var(--space-2xl) 0',
          }}
        >
          {/* EMPTY STATE: Minimalist Editorial Hero Greeting + Starter Cards */}
          {!hasMessages && (
            <>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: 'var(--font-xs)',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--space-lg)',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: activeColor,
                    }}
                  />
                  <span>{heroBadge}</span>
                </div>

                <h1
                  style={{
                    fontSize: 'var(--font-3xl)',
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-sm)',
                  }}
                >
                  {heroTitle}
                </h1>
                <p
                  style={{
                    fontSize: 'var(--font-md)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {heroSubtitle}
                </p>

                {/* Active Project Scope Pill if selected */}
                {activeProject && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '4px 12px',
                      background: 'rgba(0, 115, 234, 0.1)',
                      border: '1px solid rgba(0, 115, 234, 0.25)',
                      borderRadius: '20px',
                      color: 'var(--brand-primary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      marginTop: '12px',
                    }}
                  >
                    <FolderOpen size={13} />
                    <span>{language === 'id' ? `Folder: ${activeProject.name}` : `Folder: ${activeProject.name}`}</span>
                    <button
                      type="button"
                      onClick={() => setActiveProjectId(null)}
                      title={language === 'id' ? 'Lepas Filter Folder' : 'Clear Folder Filter'}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Starter Templates & Creative Prompts (2x2 Grid) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 2px' }}>
                  <Sparkles size={14} color={activeColor} />
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {language === 'id' ? 'Templat & Ide Prompt AI' : 'Starter Templates & Prompts'}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 'var(--space-sm)',
                    width: '100%',
                  }}
                >
                  {starterCards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSelectedFormat(card.format);
                          handleSendPrompt(card.prompt);
                        }}
                        className="hover-card"
                        style={{
                          padding: 'var(--space-md) var(--space-lg)',
                          borderRadius: 'var(--radius-lg)',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: 'var(--space-sm)',
                          boxShadow: 'var(--inner-glow)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: card.color,
                              background: card.badgeBg,
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-full)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                          >
                            <Icon size={12} color={card.color} />
                            {card.category}
                          </span>
                          <ArrowUpRight size={13} color="var(--text-muted)" />
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '3px' }}>
                            {card.title}
                          </div>
                          <span
                            style={{
                              fontSize: '12px',
                              color: 'var(--text-secondary)',
                              lineHeight: 1.4,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {card.prompt}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ACTIVE CHAT-FIRST STREAM VIEW (Kimi / Claude Artifacts Style) */}
          {hasMessages && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', width: '100%' }}>
              {messages.map((msg, index) => {
                const isUserMsg = msg.role === 'user';
                const isStreamingThis = isGenerating && msg.id === streamingMsgIdRef.current;
                const isEditingThis = editActions.editingMessageId === msg.id;

                return (
                  <div key={`${msg.id}_${index}`} style={{ width: '100%' }}>
                    <AIChatBubble
                      role={msg.role}
                      content={isUserMsg ? msg.content : stripAgentActionTags(msg.content)}
                      reasoningContent={msg.reasoningContent}
                      agentSteps={msg.agentSteps}
                      isStreaming={isStreamingThis}
                      assistantName="AI Co-Author"
                      assistantColor={activeColor}
                      language={language}
                      variant="coauthor"
                      isEditing={isUserMsg && isEditingThis}
                      editContent={isUserMsg && isEditingThis ? editActions.editingContent : undefined}
                      onEdit={isUserMsg && !isGenerating ? () => editActions.handleStartEdit(msg.id, msg.content) : undefined}
                      onSaveEdit={async (newContent) => {
                        const saved = await editActions.handleSaveEdit(newContent);
                        if (saved) {
                          await handleSendPrompt(saved, true);
                        }
                      }}
                      onCancelEdit={editActions.handleCancelEdit}
                      auditBadge={undefined}
                      extraContent={
                        !isUserMsg && activeDoc && index === messages.length - 1 ? (
                          <InteractiveDocCard
                            doc={activeDoc}
                            onOpenEditor={() => handleOpenEditor(activeDoc.id)}
                            language={language}
                            isGenerating={isStreamingThis}
                          />
                        ) : undefined
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Docked Bottom Prompt Bar (Matching ChatInput exactly) ── */}
      <PromptBar
        prompt={prompt}
        onPromptChange={setPrompt}
        attachments={attachments}
        onAttachmentsChange={setAttachments}
        onSubmit={handleSubmit}
        disabled={isGenerating}
        placeholder={
          activeProject
            ? language === 'id'
              ? `Buatkan ${selectedFormat === 'sheet' ? 'spreadsheet' : selectedFormat === 'slide' ? 'slide' : 'dokumen'} untuk folder "${activeProject.name}"...`
              : `Draft a ${selectedFormat === 'sheet' ? 'spreadsheet' : selectedFormat === 'slide' ? 'slide' : 'document'} for folder "${activeProject.name}"...`
            : language === 'id'
            ? `Ketik prompt atau deskripsikan ${selectedFormat === 'sheet' ? 'spreadsheet' : selectedFormat === 'slide' ? 'slide' : 'dokumen'} yang ingin dibuat...`
            : `Ask anything or describe the ${selectedFormat === 'sheet' ? 'spreadsheet' : selectedFormat === 'slide' ? 'slide' : 'document'} to create...`
        }
        modelDisplayName={modelDisplayName}
        onModelSelectorOpen={() => setIsModelSelectorOpen(true)}
        submitTooltip={
          selectedFormat === 'sheet'
            ? language === 'id'
              ? 'Buat Spreadsheet'
              : 'Generate Spreadsheet'
            : selectedFormat === 'slide'
            ? language === 'id'
              ? 'Buat Slide'
              : 'Generate Slide'
            : language === 'id'
            ? 'Buat Dokumen'
            : 'Generate Document'
        }
        leftControls={
          !hasMessages ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Category Dropdown: Document vs Slide vs Spreadsheet */}
              <DropdownSelect
                value={selectedCategory}
                options={[
                  {
                    value: 'doc',
                    label: language === 'id' ? 'Dokumen' : 'Document',
                    icon: <FileText size={13} color="var(--brand-primary, #0073EA)" />,
                  },
                  {
                    value: 'slide',
                    label: language === 'id' ? 'Slide Deck' : 'Slide Deck',
                    icon: <Presentation size={13} color="var(--brand-secondary, #8B5CF6)" />,
                  },
                  {
                    value: 'sheet',
                    label: language === 'id' ? 'Spreadsheet' : 'Spreadsheet',
                    icon: <Table size={13} color="var(--accent-success, #10B981)" />,
                  },
                ]}
                onChange={(cat) => {
                  if (cat === 'sheet') setSelectedFormat('sheet');
                  else if (cat === 'slide') setSelectedFormat('slide');
                  else setSelectedFormat(selectedEngine);
                }}
                brandColor={activeColor}
              />

              {/* Engine Dropdown: LaTeX vs Typst (Only for Document category) */}
              {selectedCategory === 'doc' && (
                <DropdownSelect
                  value={selectedEngine}
                  options={[
                    {
                      value: 'latex',
                      label: 'LaTeX (.tex)',
                      icon: <FileCode size={13} color="var(--brand-secondary, #8B5CF6)" />,
                    },
                    {
                      value: 'typst',
                      label: 'Typst (.typ)',
                      icon: <Sparkles size={13} color="var(--accent-success, #10B981)" />,
                    },
                  ]}
                  onChange={(eng) => setSelectedFormat(eng as DocFormat)}
                  brandColor="var(--brand-secondary, #8B5CF6)"
                />
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 650,
              }}
            >
              {selectedFormat === 'typst' ? (
                <>
                  <FileText size={13} color="var(--brand-primary)" />
                  <span>{language === 'id' ? 'Dokumen' : 'Document'}</span>
                  <span style={{ color: 'var(--text-muted)', margin: '0 2px' }}>•</span>
                  <Sparkles size={13} color="var(--accent-success, #10B981)" />
                  <span>{language === 'id' ? 'Engine Typst' : 'Typst Engine'}</span>
                </>
              ) : selectedFormat === 'latex' ? (
                <>
                  <FileText size={13} color="var(--brand-primary)" />
                  <span>{language === 'id' ? 'Dokumen' : 'Document'}</span>
                  <span style={{ color: 'var(--text-muted)', margin: '0 2px' }}>•</span>
                  <FileCode size={13} color="var(--brand-secondary, #8B5CF6)" />
                  <span>{language === 'id' ? 'Engine LaTeX' : 'LaTeX Engine'}</span>
                </>
              ) : selectedFormat === 'sheet' ? (
                <>
                  <Table size={13} color="var(--accent-success, #10B981)" />
                  <span>Spreadsheet</span>
                </>
              ) : (
                <>
                  <Presentation size={13} color="var(--brand-secondary, #8B5CF6)" />
                  <span>{language === 'id' ? 'Slide Presentasi' : 'Slide Deck'}</span>
                </>
              )}
            </div>
          )
        }
      />

      {isModelSelectorOpen && (
        <ModelSelectorModal onClose={() => setIsModelSelectorOpen(false)} />
      )}

      {/* Undo Toast - Claude-style: appears after edit/delete */}
      {editActions.undoToast && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          right: '24px',
          background: 'var(--bg-surface, #fff)',
          border: '1px solid var(--border-subtle, #e5e5e5)',
          borderRadius: '10px',
          padding: '14px 18px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 999,
          maxWidth: '320px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
            {language === 'id' ? 'Perubahan dihapus' : 'Changes deleted'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            {editActions.undoToast.count} {language === 'id' ? 'pesan' : 'message(s)'}
          </div>
          <button
            type="button"
            onClick={editActions.handleUndoDelete}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--brand-primary, #7C3AED)',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {language === 'id' ? 'Batalkan' : 'Undo'}
          </button>
        </div>
      )}

      {/* CSS for hover actions */}
      <style>{`
        .user-msg-actions { opacity: 0 !important; }
        div:hover > .user-msg-actions,
        .user-msg-actions:focus-within { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
