'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Trash2,
  Pin,
  Sparkles,
  Download,
  Eye,
  Code2,
  Columns,
  Search,
  Bold,
  Italic,
  Heading,
  Sigma,
  Table as TableIcon,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Printer,
  ChevronDown,
  ArrowLeft,
  Layers,
  Presentation,
  Check,
  X,
  Star,
  FilePlus,
  Edit2,
  Info,
  Folder,
  FolderOpen,
  ChevronRight,
  FolderPlus,
  ListTree,
  Replace,
  CornerDownLeft,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Play,
  RefreshCw,
  ChevronUp,
} from 'lucide-react';
import { useDocsStore, DocsViewMode, DocFormat } from '../store/useDocsStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { getBundledDocContent } from '../utils/docResolver';
import { lintDocumentContent, DocDiagnostic } from '../utils/docLinter';
import { DocsCopilotSidebar } from './DocsCopilotSidebar';
import { DocsTemplateModal } from './DocsTemplateModal';
import { DocsLandingView } from './DocsLandingView';
import { DocsGeneratingView } from './DocsGeneratingView';
import { DocsSpreadsheetView } from './DocsSpreadsheetView';
import { DocsSlideView } from './DocsSlideView';
import { streamBYOKChat } from '../../chat/data/byokApi';
import { ChatMessage, LLMProviderId } from '@anticeil/core';

export function DocsView() {
  const documents = useDocsStore((s) => s.documents);
  const activeDocId = useDocsStore((s) => s.activeDocId);
  const studioPhase = useDocsStore((s) => s.studioPhase);
  const viewMode = useDocsStore((s) => s.viewMode);
  const isCopilotOpen = useDocsStore((s) => s.isCopilotOpen);
  const isSidebarOpen = useDocsStore((s) => s.isSidebarOpen);

  const setStudioPhase = useDocsStore((s) => s.setStudioPhase);
  const setActiveDocId = useDocsStore((s) => s.setActiveDocId);
  const createDocument = useDocsStore((s) => s.createDocument);
  const createFromTemplate = useDocsStore((s) => s.createFromTemplate);
  const updateDocumentContent = useDocsStore((s) => s.updateDocumentContent);
  const updateDocumentTitle = useDocsStore((s) => s.updateDocumentTitle);
  const deleteDocument = useDocsStore((s) => s.deleteDocument);
  const togglePin = useDocsStore((s) => s.togglePin);
  const setViewMode = useDocsStore((s) => s.setViewMode);
  const toggleCopilot = useDocsStore((s) => s.toggleCopilot);
  const toggleSidebar = useDocsStore((s) => s.toggleSidebar);

  // Overleaf-style Sub-file Store Actions
  const createSubFile = useDocsStore((s) => s.createSubFile);
  const updateSubFileContent = useDocsStore((s) => s.updateSubFileContent);
  const updateSubFileName = useDocsStore((s) => s.updateSubFileName);
  const deleteSubFile = useDocsStore((s) => s.deleteSubFile);
  const setMainSubFile = useDocsStore((s) => s.setMainSubFile);
  const setActiveFileId = useDocsStore((s) => s.setActiveFileId);

  const language = useSettingsStore((s) => s.language);
  const theme = useSettingsStore((s) => s.theme);

  // Mini Sidebar & Active Drawer Tab ('files' | 'search' | 'outline' | 'ai')
  const [activeDrawerTab, setActiveDrawerTab] = useState<'files' | 'search' | 'outline' | 'ai'>('files');

  // Overleaf Compilation Log Bar & Drawer State
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);
  const [activeLogTab, setActiveLogTab] = useState<'all' | 'errors' | 'warnings' | 'info'>('all');
  const [isRecompiling, setIsRecompiling] = useState(false);
  const [previewScale, setPreviewScale] = useState(100);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'DOCS_PREVIEW_SCALE' && typeof e.data.scale === 'number') {
        setPreviewScale(e.data.scale);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Search in Document state
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [docReplaceQuery, setDocReplaceQuery] = useState('');
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Subfile & Folder UI state
  const [isAddingSubFile, setIsAddingSubFile] = useState(false);
  const [newSubFileName, setNewSubFileName] = useState('');
  const [isAddingSubFolder, setIsAddingSubFolder] = useState(false);
  const [newSubFolderName, setNewSubFolderName] = useState('');
  const [addingInFolder, setAddingInFolder] = useState<string | null>(null);
  const [newFileInFolderName, setNewFileInFolderName] = useState('');
  const [editingSubFileId, setEditingSubFileId] = useState<string | null>(null);
  const [editingSubFileName, setEditingSubFileName] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  const toggleFolderCollapse = (folderName: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderName)) next.delete(folderName);
      else next.add(folderName);
      return next;
    });
  };

  // Jump to specific line in the editor textarea
  const jumpToLine = (lineNumber: number) => {
    const el = textareaRef.current;
    if (!el || !activeDoc) return;
    const lines = (activeSubFile?.content || activeDoc.content).split('\n');
    let charIndex = 0;
    for (let i = 0; i < lineNumber && i < lines.length; i++) {
      charIndex += lines[i].length + 1;
    }
    el.focus();
    el.setSelectionRange(charIndex, charIndex + (lines[lineNumber]?.length || 0));
    el.scrollTop = Math.max(0, lineNumber * 21 - 100);
  };

  // Generation state
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [streamedText, setStreamedText] = useState('');
  const [isGenerationFinished, setIsGenerationFinished] = useState(false);

  // Panel resize state (widths in px; 0 = flex auto)
  const [leftWidth, setLeftWidth] = useState(250);
  const [editorWidth, setEditorWidth] = useState(0); // 0 = flex:1
  const [copilotWidth, setCopilotWidth] = useState(320);
  const [isDragging, setIsDragging] = useState(false);

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  // 1. Drag Left Drawer (1:1 Mouse Follow)
  const handleLeftDrawerDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const startX = e.clientX;
    const startWidth = leftWidth;

    const onMove = (ev: MouseEvent) => {
      ev.preventDefault();
      const newWidth = Math.max(160, Math.min(500, startWidth + (ev.clientX - startX)));
      setLeftWidth(newWidth);
    };

    const onUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
  }, [leftWidth]);

  // 2. Drag Editor Width (1:1 Mouse Follow)
  const handleEditorDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const startX = e.clientX;
    const currentWidth = editorContainerRef.current?.offsetWidth || editorWidth || 450;

    const onMove = (ev: MouseEvent) => {
      ev.preventDefault();
      const newWidth = Math.max(200, Math.min(window.innerWidth - 300, currentWidth + (ev.clientX - startX)));
      setEditorWidth(newWidth);
    };

    const onUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
  }, [editorWidth]);

  // 3. Drag Copilot Width (1:1 Mouse Follow)
  const handleCopilotDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const startX = e.clientX;
    const startWidth = copilotWidth;

    const onMove = (ev: MouseEvent) => {
      ev.preventDefault();
      const newWidth = Math.max(220, Math.min(650, startWidth - (ev.clientX - startX)));
      setCopilotWidth(newWidth);
    };

    const onUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
  }, [copilotWidth]);

  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0];

  // Active sub-file in the Overleaf multi-file tree
  const docFiles = activeDoc?.files || [];
  const activeSubFile =
    docFiles.find((f) => f.id === activeDoc?.activeFileId) ||
    docFiles.find((f) => f.isMain) ||
    docFiles[0] ||
    null;

  // Bundled content for live preview & compilation
  const bundledContent = useMemo(() => {
    if (!activeDoc) return '';
    return getBundledDocContent(activeDoc);
  }, [activeDoc]);

  // Start Agentic Generation
  const handleStartGenerate = async (promptText: string, format: DocFormat) => {
    setCurrentPrompt(promptText);
    setStreamedText('');
    setIsGenerationFinished(false);
    setStudioPhase('generating');

    let systemInstruction = '';
    if (format === 'sheet') {
      systemInstruction =
        'You are an expert financial and data spreadsheet modeler. Output a comprehensive Markdown table representing a complete spreadsheet with numerical columns, headers, and calculation formulas.';
    } else if (format === 'slide') {
      systemInstruction =
        'You are an elite presentation designer. Create a 5 to 7 slide widescreen (16:9) presentation deck in Markdown. Separate each slide strictly using "---" on a new line. Include title slide, agenda, problem-solution, key metrics, technical architecture or diagrams, and conclusion.';
    } else {
      systemInstruction =
        'You are an elite Academic and Technical Paper author. Output a complete, publication-ready research paper or technical document in Markdown with rich LaTeX mathematical formulas (using $inline$ and $$block$$), section headings, data tables, and BibTeX references.';
    }

    const messages: ChatMessage[] = [
      {
        id: 'msg_' + Date.now(),
        sessionId: 'docs_gen',
        role: 'user',
        content: `Create a complete document based on this prompt: "${promptText}". Format strictly as clean Markdown with LaTeX math and tables where appropriate.`,
        timestamp: Date.now(),
        status: 'done',
      },
    ];

    let accumulated = '';
    try {
      await streamBYOKChat({
        providerId: 'groq' as LLMProviderId,
        modelId: 'llama-3.3-70b-versatile',
        systemPrompt: systemInstruction,
        messages,
        apiKeyConfig: { apiKey: '', isEnabled: true },
        temperature: 0.6,
        onChunk: (chunk) => {
          if (chunk.delta) {
            accumulated += chunk.delta;
            setStreamedText(accumulated);
          }
        },
      });
    } catch (err) {
      console.warn('[DocsView] Generation streaming error:', err);
    } finally {
      setIsGenerationFinished(true);

      // Create or update document
      const docTitle = promptText.slice(0, 40) + (promptText.length > 40 ? '...' : '');
      const newId = createDocument(docTitle, accumulated || promptText, format);
      setActiveDocId(newId);
    }
  };

  // Filtered sub-files for the Overleaf project file tree
  const filteredSubFiles = useMemo(() => {
    return docFiles.filter((f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [docFiles, searchQuery]);

  // Grouped sub-files into root files and subfolders
  const { rootFiles, folderMap } = useMemo(() => {
    const roots: typeof docFiles = [];
    const folders: Record<string, typeof docFiles> = {};

    for (const f of filteredSubFiles) {
      const clean = f.name.replace(/\\/g, '/');
      const slashIndex = clean.indexOf('/');
      if (slashIndex > 0) {
        const folderName = clean.substring(0, slashIndex);
        if (!folders[folderName]) folders[folderName] = [];
        folders[folderName].push(f);
      } else {
        roots.push(f);
      }
    }

    return { rootFiles: roots, folderMap: folders };
  }, [filteredSubFiles, docFiles]);

  // Document Headings & Section Outline for Outline Tab
  const documentHeadings = useMemo(() => {
    const text = activeSubFile?.content || activeDoc?.content || '';
    if (!text) return [];

    const headings: Array<{ line: number; text: string; level: number }> = [];
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Markdown: #, ##, ###, ####
      const mdMatch = line.match(/^(#{1,4})\s+(.+)$/);
      if (mdMatch) {
        headings.push({
          line: i,
          level: mdMatch[1].length,
          text: mdMatch[2].trim(),
        });
        continue;
      }
      // LaTeX: \section{}, \subsection{}, \subsubsection{}
      const secMatch = line.match(/\\(section|subsection|subsubsection)\*?\{([^}]+)\}/);
      if (secMatch) {
        const type = secMatch[1];
        const level = type === 'section' ? 1 : type === 'subsection' ? 2 : 3;
        headings.push({
          line: i,
          level,
          text: secMatch[2].trim(),
        });
      }
    }
    return headings;
  }, [activeSubFile?.content, activeDoc?.content]);

  // Document Find & Replace matches
  const searchMatches = useMemo(() => {
    if (!docSearchQuery.trim()) return [];
    const text = activeSubFile?.content || activeDoc?.content || '';
    const matches: Array<{ line: number; match: string; index: number; lineText: string }> = [];
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const target = isCaseSensitive ? line : line.toLowerCase();
      const q = isCaseSensitive ? docSearchQuery : docSearchQuery.toLowerCase();
      let startIdx = 0;
      while ((startIdx = target.indexOf(q, startIdx)) !== -1) {
        matches.push({
          line: i,
          match: line.substring(startIdx, startIdx + q.length),
          index: startIdx,
          lineText: line.trim(),
        });
        startIdx += q.length;
      }
    }
    return matches;
  }, [activeSubFile?.content, activeDoc?.content, docSearchQuery, isCaseSensitive]);

  const handleReplaceAll = () => {
    if (!docSearchQuery || !activeDoc) return;
    const currentText = activeSubFile?.content ?? activeDoc.content;
    const flags = isCaseSensitive ? 'g' : 'gi';
    const escaped = docSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const updated = currentText.replace(new RegExp(escaped, flags), docReplaceQuery);
    if (activeSubFile) {
      updateSubFileContent(activeDoc.id, activeSubFile.id, updated);
    } else {
      updateDocumentContent(activeDoc.id, updated);
    }
  };

  // Word & Line stats based on bundled document
  const stats = useMemo(() => {
    const text = bundledContent || activeDoc?.content || '';
    if (!text) return { words: 0, chars: 0, lines: 0 };
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const lines = text.split('\n').length;
    return { words, chars, lines };
  }, [bundledContent, activeDoc?.content]);

  // Compilation & Linter diagnostics (Errors, Warnings, Info)
  const lintResults = useMemo(() => {
    const text = activeSubFile?.content ?? activeDoc?.content ?? '';
    return lintDocumentContent(text, docFiles, activeSubFile?.name || 'main.tex');
  }, [activeSubFile?.content, activeDoc?.content, docFiles, activeSubFile?.name]);

  const handleRecompile = () => {
    setIsRecompiling(true);
    setTimeout(() => {
      setIsRecompiling(false);
    }, 350);
  };

  // Markdown + KaTeX + Mermaid Sandboxed Compilation HTML using bundled content
  const previewHtml = useMemo(() => {
    const raw = bundledContent || activeDoc?.content || '';
    if (!raw) return '';
    const isLight = theme === 'light';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${activeDoc.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  
  <!-- KaTeX CSS & JS -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"><\/script>
  
  <!-- Marked Markdown Parser -->
  <script src="https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js"><\/script>
  
  <!-- Mermaid Diagrams -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"><\/script>

  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background-color: ${isLight ? '#cbd5e1' : '#070a10'};
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #1e293b;
      overflow-x: hidden !important; /* Zero horizontal scrollbar! */
      overflow-y: auto;
    }
    #page-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 4px;
      width: 100%;
      min-height: 100%;
      box-sizing: border-box;
    }
    #scaler-wrapper {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      margin: 0 auto;
    }
    .paper-sheet {
      position: absolute;
      top: 0;
      left: 0;
      width: 794px; /* Fixed Standard A4 Paper Width (210mm) */
      min-height: 1123px; /* Fixed Standard A4 Paper Height (297mm) */
      background: #ffffff;
      padding: 64px 72px; /* Standard 1-inch Academic Paper Margins */
      border-radius: 2px;
      box-shadow: ${
        isLight
          ? '0 4px 16px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.08)'
          : '0 6px 20px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)'
      };
      line-height: 1.7;
      font-size: 14.5px;
      color: #1a202c;
      transform-origin: 0 0;
      box-sizing: border-box;
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Inter', system-ui, sans-serif;
      color: #0f172a;
      font-weight: 700;
      line-height: 1.3;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
    h1 { font-size: 26px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
    h2 { font-size: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
    h3 { font-size: 16px; }
    p { margin-top: 0; margin-bottom: 1em; }
    a { color: #0073ea; text-decoration: none; }
    a:hover { text-decoration: underline; }
    blockquote {
      margin: 1.2em 0;
      padding: 8px 16px;
      border-left: 4px solid #0073ea;
      background: #f8fafc;
      color: #475569;
      font-style: italic;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5em 0;
      font-size: 13.5px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background-color: #f1f5f9;
      font-weight: 600;
      color: #0f172a;
    }
    tr:nth-child(even) { background-color: #f8fafc; }
    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12.5px;
      background: #f1f5f9;
      padding: 2px 5px;
      border-radius: 4px;
      color: #0f172a;
    }
    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 13px;
    }
    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
    }
    .katex-display {
      margin: 1.2em 0 !important;
      overflow-x: auto;
      overflow-y: hidden;
      padding: 6px 0;
    }
    .mermaid {
      display: flex;
      justify-content: center;
      margin: 24px 0;
    }
    /* Slim and elegant preview scrollbar */
    html {
      scrollbar-width: thin;
      scrollbar-color: rgba(148, 163, 184, 0.45) transparent;
    }
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(148, 163, 184, 0.45);
      border-radius: 6px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(148, 163, 184, 0.75);
    }
    @media print {
      body {
        background: transparent !important;
        padding: 0 !important;
      }
      .paper-sheet {
        position: static !important;
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 100% !important;
        min-height: auto !important;
        transform: none !important;
      }
    }
  </style>
</head>
<body>
  <div id="page-container">
    <div id="scaler-wrapper">
      <div class="paper-sheet" id="rendered-content"></div>
    </div>
  </div>

  <script>
    const rawMarkdown = ${JSON.stringify(raw)};
    
    marked.setOptions({
      gfm: true,
      breaks: true,
    });

    const parsedHtml = marked.parse(rawMarkdown);
    const container = document.getElementById('rendered-content');
    container.innerHTML = parsedHtml;

    // Render KaTeX formulas
    renderMathInElement(container, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false},
        {left: '\\\\(', right: '\\\\)', display: false},
        {left: '\\\\[', right: '\\\\]', display: true}
      ],
      throwOnError: false
    });

    // Render Mermaid diagrams
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      fontFamily: 'Inter, system-ui, sans-serif',
    });

    // Overleaf Infinite Micro-Scaling Auto-Fit
    function autoFitWidth() {
      const paper = document.getElementById('rendered-content');
      const wrapper = document.getElementById('scaler-wrapper');
      if (!paper || !wrapper) return;

      // documentElement.clientWidth excludes the vertical scrollbar!
      const clientWidth = document.documentElement.clientWidth || (window.innerWidth - 12);
      const paperBaseWidth = 794;
      const safePadding = 24; // 12px safe margin on both sides
      const availableWidth = Math.max(16, clientWidth - safePadding);

      // Free auto-scale ratio
      const scale = Math.min(1.0, availableWidth / paperBaseWidth);
      paper.style.transform = 'scale(' + scale + ')';

      const paperHeight = paper.offsetHeight || 1123;
      const scaledWidth = paperBaseWidth * scale;
      const scaledHeight = paperHeight * scale;

      wrapper.style.width = scaledWidth + 'px';
      wrapper.style.height = (scaledHeight + 32) + 'px';

      // Post scale percentage to parent for Overleaf zoom display
      try {
        window.parent.postMessage({ type: 'DOCS_PREVIEW_SCALE', scale: Math.round(scale * 100) }, '*');
      } catch (e) {}
    }

    // Attach ResizeObserver to documentElement for instant scaling on scrollbar show/hide
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => autoFitWidth());
      ro.observe(document.documentElement);
    }
    window.addEventListener('resize', autoFitWidth);
    window.addEventListener('load', autoFitWidth);
    setTimeout(autoFitWidth, 30);
    setTimeout(autoFitWidth, 150);
  </script>
</body>
</html>
    `;
  }, [activeDoc?.content, activeDoc?.title, theme]);

  // Insert markdown shortcut helpers
  const insertShortcut = (before: string, after: string = '', defaultText: string = '') => {
    const el = textareaRef.current;
    if (!el || !activeDoc) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.substring(start, end) || defaultText;

    const updated = text.substring(0, start) + before + selected + after + text.substring(end);
    if (activeSubFile) {
      updateSubFileContent(activeDoc.id, activeSubFile.id, updated);
    } else {
      updateDocumentContent(activeDoc.id, updated);
    }

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 10);
  };

  // Export handlers
  const handleExportPDF = () => {
    if (previewIframeRef.current?.contentWindow) {
      previewIframeRef.current.contentWindow.print();
    }
  };

  const handleExportMarkdown = () => {
    if (!activeDoc) return;
    const exportText = bundledContent || activeDoc.content || '';
    const blob = new Blob([exportText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (activeDoc.title || 'document').replace(/\s+/g, '_') + '.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportLatex = () => {
    if (!activeDoc) return;
    const exportText = bundledContent || activeDoc.content || '';
    const latexHeader = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{graphicx}
\\usepackage{hyperref}

\\title{${activeDoc.title}}
\\author{Anticeil Agentic Studio}
\\date{\\today}

\\begin{document}
\\maketitle

${exportText}

\\end{document}`;

    const blob = new Blob([latexHeader], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (activeDoc.title || 'document').replace(/\s+/g, '_') + '.tex';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── PHASE 1: LANDING VIEW ──
  if (studioPhase === 'landing') {
    return <DocsLandingView onStartGenerate={handleStartGenerate} />;
  }

  // ── PHASE 2: GENERATING VIEW ──
  if (studioPhase === 'generating') {
    return (
      <DocsGeneratingView
        promptText={currentPrompt}
        generatedContent={streamedText}
        isFinished={isGenerationFinished}
        onViewResult={() => setStudioPhase('editor')}
      />
    );
  }

  // ── PHASE 3: DEDICATED FULL-SCREEN EDITOR VIEW ──
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        backgroundColor: 'var(--bg-main)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Mobile & Tablet Backdrop Overlay (< 1024px) */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={toggleSidebar}
      />

      {/* Responsive Left Sidebar Wrapper (Drawer on Mobile/Tablet < 1024px, Normal Rail + Drawer on Desktop) */}
      <aside
        className={`docs-sidebar-wrapper ${isSidebarOpen ? 'drawer-open' : ''}`}
        style={{
          display: 'flex',
          height: '100%',
          flexShrink: 0,
        }}
      >
        {/* 0. Far-Left Mini Sidebar (Exact 48px width matching main Sidebar.tsx) */}
        <div
          style={{
            width: '48px',
            height: '100%',
            backgroundColor: 'var(--bg-main)',
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 0 12px 0',
            flexShrink: 0,
            zIndex: 10,
          }}
        >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          {/* Logo container matching exact 48px header height for 1:1 symmetry */}
          <div
            style={{
              height: '48px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Link
              href="/"
              title="Anticeil Home"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                transition: 'transform 0.15s ease',
              }}
            >
              <img
                src="/anticeil-logo.png"
                alt="Anticeil Logo"
                style={{ width: '26px', height: '26px', objectFit: 'contain', borderRadius: '6px' }}
              />
            </Link>
          </div>

          {/* Quick App Tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', paddingTop: '4px', width: '100%' }}>
            {/* Tab: Files */}
            <button
              type="button"
              onClick={() => {
                if (!isSidebarOpen) {
                  toggleSidebar();
                  setActiveDrawerTab('files');
                } else if (activeDrawerTab === 'files') {
                  toggleSidebar();
                } else {
                  setActiveDrawerTab('files');
                }
              }}
              style={{
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                backgroundColor: isSidebarOpen && activeDrawerTab === 'files' ? 'rgba(0, 115, 234, 0.12)' : 'transparent',
                border: 'none',
                color: isSidebarOpen && activeDrawerTab === 'files' ? 'var(--brand-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.15s ease',
              }}
              className="hover-subtle"
              title={language === 'id' ? 'Struktur File (Files)' : 'Project Files'}
            >
              {isSidebarOpen && activeDrawerTab === 'files' && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '7px',
                    bottom: '7px',
                    width: '3px',
                    backgroundColor: 'var(--brand-primary)',
                    borderRadius: '0 2px 2px 0',
                  }}
                />
              )}
              <FileText size={16} />
            </button>

            {/* Tab: Search */}
            <button
              type="button"
              onClick={() => {
                if (!isSidebarOpen) {
                  toggleSidebar();
                  setActiveDrawerTab('search');
                } else if (activeDrawerTab === 'search') {
                  toggleSidebar();
                } else {
                  setActiveDrawerTab('search');
                }
              }}
              style={{
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                backgroundColor: isSidebarOpen && activeDrawerTab === 'search' ? 'rgba(0, 115, 234, 0.12)' : 'transparent',
                border: 'none',
                color: isSidebarOpen && activeDrawerTab === 'search' ? 'var(--brand-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.15s ease',
              }}
              className="hover-subtle"
              title={language === 'id' ? 'Pencarian & Ganti (Search)' : 'Search & Replace'}
            >
              {isSidebarOpen && activeDrawerTab === 'search' && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '7px',
                    bottom: '7px',
                    width: '3px',
                    backgroundColor: 'var(--brand-primary)',
                    borderRadius: '0 2px 2px 0',
                  }}
                />
              )}
              <Search size={16} />
            </button>

            {/* Tab: Outline */}
            <button
              type="button"
              onClick={() => {
                if (!isSidebarOpen) {
                  toggleSidebar();
                  setActiveDrawerTab('outline');
                } else if (activeDrawerTab === 'outline') {
                  toggleSidebar();
                } else {
                  setActiveDrawerTab('outline');
                }
              }}
              style={{
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                backgroundColor: isSidebarOpen && activeDrawerTab === 'outline' ? 'rgba(0, 115, 234, 0.12)' : 'transparent',
                border: 'none',
                color: isSidebarOpen && activeDrawerTab === 'outline' ? 'var(--brand-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.15s ease',
              }}
              className="hover-subtle"
              title={language === 'id' ? 'Daftar Isi / Outline' : 'Document Outline'}
            >
              {isSidebarOpen && activeDrawerTab === 'outline' && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '7px',
                    bottom: '7px',
                    width: '3px',
                    backgroundColor: 'var(--brand-primary)',
                    borderRadius: '0 2px 2px 0',
                  }}
                />
              )}
              <ListTree size={16} />
            </button>

            {/* Tab: AI Assist */}
            <button
              type="button"
              onClick={() => {
                if (!isSidebarOpen) {
                  toggleSidebar();
                  setActiveDrawerTab('ai');
                } else if (activeDrawerTab === 'ai') {
                  toggleSidebar();
                } else {
                  setActiveDrawerTab('ai');
                }
              }}
              style={{
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                backgroundColor: isSidebarOpen && activeDrawerTab === 'ai' ? 'rgba(0, 115, 234, 0.15)' : 'transparent',
                border: 'none',
                color: isSidebarOpen && activeDrawerTab === 'ai' ? 'var(--brand-primary)' : 'var(--brand-primary)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.15s ease',
              }}
              className="hover-subtle"
              title={language === 'id' ? 'AI Co-Author Assistant' : 'AI Co-Author Assistant'}
            >
              {isSidebarOpen && activeDrawerTab === 'ai' && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '7px',
                    bottom: '7px',
                    width: '3px',
                    backgroundColor: 'var(--brand-primary)',
                    borderRadius: '0 2px 2px 0',
                  }}
                />
              )}
              <Sparkles size={16} />
            </button>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%' }}>
          <button
            type="button"
            onClick={() => setStudioPhase('landing')}
            style={{
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            className="hover-subtle"
            title={language === 'id' ? 'Kembali ke Beranda Dokumen' : 'Back to Docs Home'}
          >
            <ArrowLeft size={16} />
          </button>
        </div>
      </div>

      {/* 1. Left Document Drawer (Multi-tab: Files | Search | Outline | AI Assistant) */}
      {isSidebarOpen && (
        <>
          <div
            style={{
              width: `${leftWidth}px`,
              height: '100%',
              borderRight: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
              {/* TAB 1: FILES TREE */}
              {activeDrawerTab === 'files' && (
                <>
                  {/* Drawer Header: Title + New File, New Folder & Collapse Buttons (Exact 48px height) */}
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
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {language === 'id' ? 'Struktur File' : 'Project Files'}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          background: 'var(--bg-subtle)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '999px',
                          padding: '0 5px',
                          lineHeight: '15px',
                        }}
                      >
                        {docFiles.length}
                      </span>
                    </div>

                    {/* New File, New Folder & Collapse Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingSubFile(!isAddingSubFile);
                          setIsAddingSubFolder(false);
                          setAddingInFolder(null);
                        }}
                        style={{
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '5px',
                          backgroundColor: isAddingSubFile ? 'rgba(0, 115, 234, 0.12)' : 'transparent',
                          border: isAddingSubFile ? '1px solid rgba(0, 115, 234, 0.3)' : '1px solid transparent',
                          color: isAddingSubFile ? 'var(--brand-primary)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        className="hover-subtle"
                        title={language === 'id' ? 'Tambah File Baru' : 'New File'}
                      >
                        <FilePlus size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingSubFolder(!isAddingSubFolder);
                          setIsAddingSubFile(false);
                          setAddingInFolder(null);
                        }}
                        style={{
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '5px',
                          backgroundColor: isAddingSubFolder ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                          border: isAddingSubFolder ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
                          color: isAddingSubFolder ? '#F59E0B' : 'var(--text-muted)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        className="hover-subtle"
                        title={language === 'id' ? 'Tambah Folder Baru' : 'New Folder'}
                      >
                        <FolderPlus size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={toggleSidebar}
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
                          marginLeft: '2px',
                        }}
                        className="hover-subtle"
                        title={language === 'id' ? 'Tutup Panel' : 'Collapse Panel'}
                      >
                        <PanelLeftClose size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Sub-header: Search Filter & Inline Add Input */}
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)' }}>

                    {/* Add New Root File Inline Input */}
                    {isAddingSubFile && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                        <input
                          type="text"
                          placeholder="e.g. abstract.tex, references.bib"
                          value={newSubFileName}
                          onChange={(e) => setNewSubFileName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const trimmed = newSubFileName.trim();
                              if (trimmed && activeDoc) {
                                const newId = createSubFile(activeDoc.id, trimmed);
                                setActiveFileId(activeDoc.id, newId);
                                setNewSubFileName('');
                                setIsAddingSubFile(false);
                              }
                            }
                            if (e.key === 'Escape') setIsAddingSubFile(false);
                          }}
                          autoFocus
                          style={{
                            flex: 1,
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-strong)',
                            borderRadius: '4px',
                            padding: '3px 6px',
                            fontSize: '11px',
                            color: 'var(--text-primary)',
                            outline: 'none',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = newSubFileName.trim();
                            if (trimmed && activeDoc) {
                              const newId = createSubFile(activeDoc.id, trimmed);
                              setActiveFileId(activeDoc.id, newId);
                              setNewSubFileName('');
                              setIsAddingSubFile(false);
                            }
                          }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--accent-success)', cursor: 'pointer', padding: '1px' }}
                        >
                          <Check size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingSubFile(false)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}

                    {/* Add New Folder Inline Input */}
                    {isAddingSubFolder && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 600 }}>📁</span>
                        <input
                          type="text"
                          placeholder="e.g. chapters, tables, sections"
                          value={newSubFolderName}
                          onChange={(e) => setNewSubFolderName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const trimmed = newSubFolderName.trim().replace(/\/+$/, '');
                              if (trimmed && activeDoc) {
                                const initialFileName = `${trimmed}/01-intro.tex`;
                                const newId = createSubFile(activeDoc.id, initialFileName);
                                setActiveFileId(activeDoc.id, newId);
                                setNewSubFolderName('');
                                setIsAddingSubFolder(false);
                              }
                            }
                            if (e.key === 'Escape') setIsAddingSubFolder(false);
                          }}
                          autoFocus
                          style={{
                            flex: 1,
                            background: 'var(--bg-surface)',
                            border: '1px solid #F59E0B',
                            borderRadius: '4px',
                            padding: '3px 6px',
                            fontSize: '11px',
                            color: 'var(--text-primary)',
                            outline: 'none',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = newSubFolderName.trim().replace(/\/+$/, '');
                            if (trimmed && activeDoc) {
                              const initialFileName = `${trimmed}/01-intro.tex`;
                              const newId = createSubFile(activeDoc.id, initialFileName);
                              setActiveFileId(activeDoc.id, newId);
                              setNewSubFolderName('');
                              setIsAddingSubFolder(false);
                            }
                          }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--accent-success)', cursor: 'pointer', padding: '1px' }}
                        >
                          <Check size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingSubFolder(false)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}

                    {/* Sub-file Filter Search */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        height: '30px',
                        boxSizing: 'border-box',
                      }}
                    >
                      <Search size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                      <input
                        type="text"
                        placeholder={language === 'id' ? 'Cari file di proyek ini...' : 'Search project files...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                          flex: 1,
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                          fontSize: '11.5px',
                          color: 'var(--text-primary)',
                        }}
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Overleaf Folder & File Tree */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
                    {filteredSubFiles.length === 0 ? (
                      <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {language === 'id' ? 'Tidak ada file yang cocok' : 'No matching files'}
                      </div>
                    ) : (
                      <>
                        {/* 1. Folders Section */}
                        {Object.keys(folderMap)
                          .sort()
                          .map((folderName) => {
                            const isCollapsed = collapsedFolders.has(folderName);
                            const filesInFolder = folderMap[folderName];

                            return (
                              <div key={folderName} style={{ marginBottom: '4px' }}>
                                {/* Folder Header Row */}
                                <div
                                  onClick={() => toggleFolderCollapse(folderName)}
                                  className="clickable-pill"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '5px 6px',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 650,
                                    color: 'var(--text-primary)',
                                    userSelect: 'none',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                                    <ChevronRight
                                      size={12}
                                      color="var(--text-muted)"
                                      style={{
                                        transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                                        transition: 'transform 0.15s ease',
                                        flexShrink: 0,
                                      }}
                                    />
                                    {isCollapsed ? (
                                      <Folder size={13} color="#F59E0B" style={{ flexShrink: 0 }} />
                                    ) : (
                                      <FolderOpen size={13} color="#F59E0B" style={{ flexShrink: 0 }} />
                                    )}
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {folderName}/
                                    </span>
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>
                                      ({filesInFolder.length})
                                    </span>
                                  </div>

                                  {/* Add File directly to this folder */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAddingInFolder(addingInFolder === folderName ? null : folderName);
                                      if (isCollapsed) toggleFolderCollapse(folderName);
                                    }}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: 'var(--text-muted)',
                                      cursor: 'pointer',
                                      padding: '2px',
                                      display: 'flex',
                                      alignItems: 'center',
                                    }}
                                    title={language === 'id' ? `Tambah file ke folder ${folderName}` : `Add file to ${folderName}`}
                                  >
                                    <Plus size={11} />
                                  </button>
                                </div>

                                {/* Inline input for adding file into this folder */}
                                {addingInFolder === folderName && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 6px 3px 22px', marginTop: '2px' }}>
                                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{folderName}/</span>
                                    <input
                                      type="text"
                                      placeholder="nama_file.tex"
                                      value={newFileInFolderName}
                                      onChange={(e) => setNewFileInFolderName(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          const trimmed = newFileInFolderName.trim();
                                          if (trimmed && activeDoc) {
                                            const fullPath = `${folderName}/${trimmed}`;
                                            const newId = createSubFile(activeDoc.id, fullPath);
                                            setActiveFileId(activeDoc.id, newId);
                                            setNewFileInFolderName('');
                                            setAddingInFolder(null);
                                          }
                                        }
                                        if (e.key === 'Escape') setAddingInFolder(null);
                                      }}
                                      autoFocus
                                      style={{
                                        flex: 1,
                                        background: 'var(--bg-surface)',
                                        border: '1px solid var(--border-strong)',
                                        borderRadius: '4px',
                                        padding: '2px 5px',
                                        fontSize: '11px',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const trimmed = newFileInFolderName.trim();
                                        if (trimmed && activeDoc) {
                                          const fullPath = `${folderName}/${trimmed}`;
                                          const newId = createSubFile(activeDoc.id, fullPath);
                                          setActiveFileId(activeDoc.id, newId);
                                          setNewFileInFolderName('');
                                          setAddingInFolder(null);
                                        }
                                      }}
                                      style={{ background: 'transparent', border: 'none', color: 'var(--accent-success)', cursor: 'pointer', padding: '1px' }}
                                    >
                                      <Check size={11} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setAddingInFolder(null)}
                                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px' }}
                                    >
                                      <X size={11} />
                                    </button>
                                  </div>
                                )}

                                {/* Folder Files List */}
                                {!isCollapsed && (
                                  <div style={{ paddingLeft: '14px', borderLeft: '1px solid var(--border-subtle)', marginLeft: '10px', marginTop: '2px' }}>
                                    {filesInFolder.map((file) => {
                                      const isActive = activeSubFile?.id === file.id;
                                      const isEditingThis = editingSubFileId === file.id;
                                      const baseFileName = file.name.substring(folderName.length + 1);

                                      const getSubFileIcon = () => {
                                        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
                                        if (ext === '.tex') return <Sigma size={12} color="#8B5CF6" style={{ flexShrink: 0 }} />;
                                        if (ext === '.bib') return <BookOpen size={12} color="#F59E0B" style={{ flexShrink: 0 }} />;
                                        if (ext === '.csv') return <TableIcon size={12} color="#10B981" style={{ flexShrink: 0 }} />;
                                        if (ext === '.slide') return <Presentation size={12} color="#8B5CF6" style={{ flexShrink: 0 }} />;
                                        return <FileText size={12} color="#0073EA" style={{ flexShrink: 0 }} />;
                                      };

                                      if (isEditingThis) {
                                        return (
                                          <div
                                            key={file.id}
                                            style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 4px', marginBottom: '2px' }}
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <input
                                              type="text"
                                              value={editingSubFileName}
                                              onChange={(e) => setEditingSubFileName(e.target.value)}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  const trimmed = editingSubFileName.trim();
                                                  if (trimmed && activeDoc) updateSubFileName(activeDoc.id, file.id, trimmed);
                                                  setEditingSubFileId(null);
                                                }
                                                if (e.key === 'Escape') setEditingSubFileId(null);
                                              }}
                                              autoFocus
                                              style={{
                                                flex: 1,
                                                background: 'var(--bg-surface)',
                                                border: '1px solid var(--border-strong)',
                                                borderRadius: '4px',
                                                padding: '2px 5px',
                                                fontSize: '11px',
                                                color: 'var(--text-primary)',
                                                outline: 'none',
                                              }}
                                            />
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const trimmed = editingSubFileName.trim();
                                                if (trimmed && activeDoc) updateSubFileName(activeDoc.id, file.id, trimmed);
                                                setEditingSubFileId(null);
                                              }}
                                              style={{ background: 'transparent', border: 'none', color: 'var(--accent-success)', cursor: 'pointer', padding: '1px' }}
                                            >
                                              <Check size={11} />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setEditingSubFileId(null)}
                                              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px' }}
                                            >
                                              <X size={11} />
                                            </button>
                                          </div>
                                        );
                                      }

                                      return (
                                        <div
                                          key={file.id}
                                          onClick={() => activeDoc && setActiveFileId(activeDoc.id, file.id)}
                                          className="clickable-pill"
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '4px 6px',
                                            borderRadius: '5px',
                                            backgroundColor: isActive ? 'rgba(0, 115, 234, 0.12)' : 'transparent',
                                            color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            fontSize: '11.5px',
                                            fontWeight: isActive || file.isMain ? 600 : 400,
                                            marginBottom: '1px',
                                            gap: '4px',
                                          }}
                                        >
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0, flex: 1 }}>
                                            {getSubFileIcon()}
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                              {baseFileName}
                                            </span>
                                            {file.isMain && (
                                              <span
                                                style={{
                                                  fontSize: '8.5px',
                                                  fontWeight: 700,
                                                  color: '#10B981',
                                                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                                  borderRadius: '3px',
                                                  padding: '0 3px',
                                                  lineHeight: '13px',
                                                  flexShrink: 0,
                                                }}
                                              >
                                                MAIN
                                              </span>
                                            )}
                                          </div>

                                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} onClick={(e) => e.stopPropagation()}>
                                            {!file.isMain && (
                                              <button
                                                type="button"
                                                onClick={() => activeDoc && setMainSubFile(activeDoc.id, file.id)}
                                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px' }}
                                                title={language === 'id' ? 'Jadikan File Utama' : 'Set as Main'}
                                              >
                                                <Star size={10} />
                                              </button>
                                            )}
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingSubFileId(file.id);
                                                setEditingSubFileName(file.name);
                                              }}
                                              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px' }}
                                              title={language === 'id' ? 'Ganti Nama' : 'Rename'}
                                            >
                                              <Edit2 size={10} />
                                            </button>
                                            {docFiles.length > 1 && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  if (confirm(`Hapus file "${file.name}"?`)) {
                                                    if (activeDoc) deleteSubFile(activeDoc.id, file.id);
                                                  }
                                                }}
                                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px' }}
                                                title={language === 'id' ? 'Hapus' : 'Delete'}
                                              >
                                                <Trash2 size={10} />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                        {/* 2. Root Files Section */}
                        {rootFiles.map((file) => {
                          const isActive = activeSubFile?.id === file.id;
                          const isEditingThis = editingSubFileId === file.id;

                          const getSubFileIcon = () => {
                            const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
                            if (ext === '.tex') return <Sigma size={12} color="#8B5CF6" style={{ flexShrink: 0 }} />;
                            if (ext === '.bib') return <BookOpen size={12} color="#F59E0B" style={{ flexShrink: 0 }} />;
                            if (ext === '.csv') return <TableIcon size={12} color="#10B981" style={{ flexShrink: 0 }} />;
                            if (ext === '.slide') return <Presentation size={12} color="#8B5CF6" style={{ flexShrink: 0 }} />;
                            return <FileText size={12} color="#0073EA" style={{ flexShrink: 0 }} />;
                          };

                          if (isEditingThis) {
                            return (
                              <div
                                key={file.id}
                                style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 4px', marginBottom: '2px' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="text"
                                  value={editingSubFileName}
                                  onChange={(e) => setEditingSubFileName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const trimmed = editingSubFileName.trim();
                                      if (trimmed && activeDoc) updateSubFileName(activeDoc.id, file.id, trimmed);
                                      setEditingSubFileId(null);
                                    }
                                    if (e.key === 'Escape') setEditingSubFileId(null);
                                  }}
                                  autoFocus
                                  style={{
                                    flex: 1,
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border-strong)',
                                    borderRadius: '4px',
                                    padding: '2px 5px',
                                    fontSize: '11px',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const trimmed = editingSubFileName.trim();
                                    if (trimmed && activeDoc) updateSubFileName(activeDoc.id, file.id, trimmed);
                                    setEditingSubFileId(null);
                                  }}
                                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-success)', cursor: 'pointer', padding: '1px' }}
                                >
                                  <Check size={11} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingSubFileId(null)}
                                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px' }}
                                >
                                  <X size={11} />
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={file.id}
                              onClick={() => activeDoc && setActiveFileId(activeDoc.id, file.id)}
                              className="clickable-pill"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '5px 8px',
                                borderRadius: '6px',
                                backgroundColor: isActive ? 'rgba(0, 115, 234, 0.12)' : 'transparent',
                                color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: isActive || file.isMain ? 600 : 400,
                                marginBottom: '2px',
                                gap: '6px',
                                position: 'relative',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                                {getSubFileIcon()}
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {file.name}
                                </span>
                                {file.isMain && (
                                  <span
                                    style={{
                                      fontSize: '9px',
                                      fontWeight: 700,
                                      color: '#10B981',
                                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                      border: '1px solid rgba(16, 185, 129, 0.3)',
                                      borderRadius: '4px',
                                      padding: '0 4px',
                                      lineHeight: '14px',
                                      flexShrink: 0,
                                    }}
                                  >
                                    MAIN
                                  </span>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} onClick={(e) => e.stopPropagation()}>
                                {!file.isMain && (
                                  <button
                                    type="button"
                                    onClick={() => activeDoc && setMainSubFile(activeDoc.id, file.id)}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: 'var(--text-muted)',
                                      cursor: 'pointer',
                                      padding: '2px',
                                    }}
                                    title={language === 'id' ? 'Jadikan File Utama (Entrypoint)' : 'Set as Main File'}
                                  >
                                    <Star size={11} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSubFileId(file.id);
                                    setEditingSubFileName(file.name);
                                  }}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: '2px',
                                  }}
                                  title={language === 'id' ? 'Ganti Nama File' : 'Rename File'}
                                >
                                  <Edit2 size={11} />
                                </button>
                                {docFiles.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Hapus file "${file.name}"?`)) {
                                        if (activeDoc) deleteSubFile(activeDoc.id, file.id);
                                      }
                                    }}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: 'var(--text-muted)',
                                      cursor: 'pointer',
                                      padding: '2px',
                                    }}
                                    title={language === 'id' ? 'Hapus File' : 'Delete File'}
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>

                </>
              )}

              {/* TAB 2: SEARCH & REPLACE */}
              {activeDrawerTab === 'search' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {language === 'id' ? 'Pencarian Dokumen' : 'Search & Replace'}
                    </span>
                    <button
                      type="button"
                      onClick={toggleSidebar}
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

                  <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column' }}>
                    {/* Find Input */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        height: '30px',
                        boxSizing: 'border-box',
                        marginBottom: '6px',
                      }}
                    >
                      <Search size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                      <input
                        type="text"
                        placeholder={language === 'id' ? 'Cari kata atau rumus...' : 'Find text or math...'}
                        value={docSearchQuery}
                        onChange={(e) => setDocSearchQuery(e.target.value)}
                        style={{
                          flex: 1,
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                          fontSize: '11.5px',
                          color: 'var(--text-primary)',
                        }}
                      />
                      {docSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setDocSearchQuery('')}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    {/* Replace Input */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        height: '30px',
                        boxSizing: 'border-box',
                        marginBottom: '8px',
                      }}
                    >
                      <Replace size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                      <input
                        type="text"
                        placeholder={language === 'id' ? 'Ganti dengan...' : 'Replace with...'}
                        value={docReplaceQuery}
                        onChange={(e) => setDocReplaceQuery(e.target.value)}
                        style={{
                          flex: 1,
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                          fontSize: '11.5px',
                          color: 'var(--text-primary)',
                        }}
                      />
                      {docReplaceQuery && (
                        <button
                          type="button"
                          onClick={() => setDocReplaceQuery('')}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    {/* Search Options & Action */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isCaseSensitive}
                          onChange={(e) => setIsCaseSensitive(e.target.checked)}
                        />
                        <span>Case Sensitive</span>
                      </label>

                      {searchMatches.length > 0 && (
                        <button
                          type="button"
                          onClick={handleReplaceAll}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--brand-primary)',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {language === 'id' ? 'Ganti Semua' : 'Replace All'}
                        </button>
                      )}
                    </div>

                    {/* Matches Stats */}
                    {docSearchQuery && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
                        {searchMatches.length > 0
                          ? `${searchMatches.length} ${language === 'id' ? 'hasil ditemukan' : 'matches found'}`
                          : (language === 'id' ? 'Tidak ada hasil ditemukan' : 'No matches found')}
                      </div>
                    )}

                    {/* Match List */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                      {searchMatches.map((m, idx) => (
                        <div
                          key={idx}
                          onClick={() => jumpToLine(m.line)}
                          className="clickable-pill"
                          style={{
                            padding: '6px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--bg-subtle)',
                            marginBottom: '4px',
                            cursor: 'pointer',
                            fontSize: '11.5px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '10px', marginBottom: '2px' }}>
                            <span>Baris {m.line + 1}</span>
                            <CornerDownLeft size={10} />
                          </div>
                          <div style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {m.lineText}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: OUTLINE */}
              {activeDrawerTab === 'outline' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {language === 'id' ? 'Daftar Isi / Outline' : 'Document Outline'}
                    </span>
                    <button
                      type="button"
                      onClick={toggleSidebar}
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

                  <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                    {documentHeadings.length === 0 ? (
                      <div style={{ padding: '24px 8px', textAlign: 'center', fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {language === 'id'
                          ? 'Belum ada bab/section di file ini. Gunakan heading # atau \\section{} untuk membuat struktur.'
                          : 'No sections or headings found. Use # or \\section{} to structure your document.'}
                      </div>
                    ) : (
                      documentHeadings.map((h, idx) => (
                        <div
                          key={idx}
                          onClick={() => jumpToLine(h.line)}
                          className="clickable-pill"
                          style={{
                            padding: '6px 8px',
                            paddingLeft: `${8 + (h.level - 1) * 12}px`,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: h.level === 1 ? '12px' : '11.5px',
                            fontWeight: h.level === 1 ? 650 : h.level === 2 ? 550 : 400,
                            color: h.level === 1 ? 'var(--brand-primary)' : 'var(--text-primary)',
                            marginBottom: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '9px',
                              padding: '1px 4px',
                              borderRadius: '3px',
                              backgroundColor: 'var(--bg-subtle)',
                              color: 'var(--text-muted)',
                              fontFamily: 'monospace',
                            }}
                          >
                            H{h.level}
                          </span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {h.text}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: AI ASSISTANT / CO-AUTHOR */}
              {activeDrawerTab === 'ai' && (
                <DocsCopilotSidebar
                  isEmbedded
                  onInsertText={(text) => insertShortcut(text, '', '')}
                  onClose={() => toggleSidebar()}
                />
              )}
            </div>

            {/* Resize handle: Left Drawer ↔ Editor */}
            <div
              onMouseDown={handleLeftDrawerDragStart}
              style={{
                width: '5px',
                cursor: 'col-resize',
                flexShrink: 0,
                backgroundColor: 'var(--border-subtle)',
                transition: 'background 0.15s',
              }}
              className="resize-divider hide-on-drawer"
            />
          </>
        )}
      </aside>

      {/* 2. Right Main Workspace Area (Top Navbar + Editor Area) */}
      <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* ── Top Header Toolbar (Exact 48px Height matching Sidebar & Drawer Header) ── */}
        <header
          className="hide-scrollbar"
          style={{
            height: '48px',
            boxSizing: 'border-box',
            padding: '0 14px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexShrink: 0,
            overflowX: 'auto',
            overflowY: 'hidden',
            whiteSpace: 'nowrap',
            scrollbarWidth: 'none',
          }}
        >
          {/* Left: Drawer toggle / expand, Back button, File icon + editable title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 'max-content', flexShrink: 0 }}>
            {/* Mobile burger */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="show-on-drawer hover-subtle"
              title="Buka Navigasi"
              style={{
                background: 'transparent', border: 'none',
                color: 'var(--text-secondary)', cursor: 'pointer',
                width: '30px', height: '30px', borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
              aria-label="Toggle navigation drawer"
            >
              <Menu size={16} />
            </button>

            {/* Desktop expand (only when collapsed) */}
            {!isSidebarOpen && (
              <button
                type="button"
                onClick={toggleSidebar}
                className="hide-on-drawer hover-subtle"
                title={language === 'id' ? 'Buka Sidebar' : 'Expand Sidebar'}
                style={{
                  background: 'transparent', border: 'none',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                  width: '30px', height: '30px', borderRadius: '6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen size={15} />
              </button>
            )}

            {/* Back button */}
            <button
              type="button"
              onClick={() => setStudioPhase('landing')}
              className="hover-subtle"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                height: '30px', padding: '0 10px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '11.5px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s ease', flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-strong)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              title="Kembali ke Buat Baru"
            >
              <ArrowLeft size={12} />
              <span>Buat Baru</span>
            </button>

            {/* Divider */}
            <span style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-subtle)', flexShrink: 0 }} />

            {/* File icon + editable title + format badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
              {activeDoc?.format === 'sheet' ? (
                <TableIcon size={14} color="#10B981" style={{ flexShrink: 0 }} />
              ) : activeDoc?.format === 'slide' ? (
                <Layers size={14} color="#8B5CF6" style={{ flexShrink: 0 }} />
              ) : (
                <FileText size={14} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
              )}

              {activeDoc ? (
                <input
                  type="text"
                  size={Math.max(1, (activeDoc.title || '').length)}
                  value={activeDoc.title}
                  onChange={(e) => updateDocumentTitle(activeDoc.id, e.target.value)}
                  placeholder="Judul dokumen..."
                  style={{
                    background: 'transparent',
                    border: '1px solid transparent',
                    outline: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    maxWidth: '320px',
                    minWidth: '32px',
                    width: 'auto',
                    // @ts-ignore
                    fieldSizing: 'content',
                    padding: '2px 5px',
                    borderRadius: '5px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                  onFocus={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                    e.currentTarget.style.borderColor = 'var(--brand-primary)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                />
              ) : (
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Docs Studio</span>
              )}
            </div>
          </div>

          {/* Right: View Mode Toggle + Stats + Export */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {/* View Mode Toggle */}
            {activeDoc?.format !== 'sheet' && activeDoc?.format !== 'slide' && (
              <div
                style={{
                  display: 'flex', alignItems: 'center',
                  height: '30px',
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '2px',
                  borderRadius: '7px',
                  border: '1px solid var(--border-subtle)',
                  flexShrink: 0,
                }}
              >
                {(['split', 'code', 'preview'] as const).map((mode) => {
                  const icons = { split: <Columns size={11} />, code: <Code2 size={11} />, preview: <Eye size={11} /> };
                  const labels = { split: 'Split', code: 'Kode', preview: 'Preview' };
                  const active = viewMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        height: '100%', padding: '0 9px',
                        borderRadius: '5px', border: 'none',
                        background: active ? 'var(--bg-surface)' : 'transparent',
                        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontSize: '11.5px', fontWeight: active ? 700 : 500,
                        cursor: 'pointer',
                        boxShadow: active ? 'var(--shadow-sm)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {icons[mode]}
                      <span>{labels[mode]}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Stats + auto-save */}
            {activeDoc?.format !== 'sheet' && (
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  height: '30px', padding: '0 9px',
                  fontSize: '11px', color: 'var(--text-muted)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px', fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', flexShrink: 0 }} />
                {stats.words} kata · {stats.lines} baris
              </span>
            )}

            {/* Export Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  height: '30px', padding: '0 12px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--brand-primary)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '11.5px', fontWeight: 650,
                  cursor: 'pointer',
                }}
              >
                <Download size={12} />
                <span>Ekspor</span>
                <ChevronDown size={11} />
              </button>

              {isExportMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: '6px',
                    width: '180px',
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-strong)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '4px',
                    zIndex: 999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      handleExportPDF();
                      setIsExportMenuOpen(false);
                    }}
                    className="clickable-pill"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                    }}
                  >
                    <Printer size={13} color="var(--brand-primary)" />
                    <span>Cetak / Unduh PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleExportMarkdown();
                      setIsExportMenuOpen(false);
                    }}
                    className="clickable-pill"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                    }}
                  >
                    <FileText size={13} color="#10B981" />
                    <span>File Markdown (.md)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleExportLatex();
                      setIsExportMenuOpen(false);
                    }}
                    className="clickable-pill"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                    }}
                  >
                    <Sigma size={13} color="#8B5CF6" />
                    <span>File LaTeX (.tex)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Main Editor Content ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* 2. Main Editor Content: Spreadsheet vs Slide Deck vs Markdown/LaTeX Split */}
          {activeDoc?.format === 'sheet' ? (
            <div style={{ flex: 1, height: '100%', minWidth: 0 }}>
              <DocsSpreadsheetView />
            </div>
          ) : activeDoc?.format === 'slide' ? (
            <div style={{ flex: 1, height: '100%', minWidth: 0 }}>
              <DocsSlideView />
            </div>
          ) : (
            <>
              {/* Center: Source Code Editor */}
              {(viewMode === 'split' || viewMode === 'code') && (
                <div
                  ref={editorContainerRef}
                  style={{
                    flex: editorWidth > 0 ? `0 0 ${editorWidth}px` : 1,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'var(--bg-main)',
                    borderRight: 'none',
                    minWidth: 0,
                  }}
                >
                  {/* Overleaf-Style File Tabs */}
                <div
                  style={{
                    height: '34px',
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    flexShrink: 0,
                    scrollbarWidth: 'none',
                  }}
                  className="hide-scrollbar"
                >
                  {docFiles.length > 0 ? docFiles.map((file) => {
                    const isActive = file.id === activeSubFile?.id;
                    return (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => setActiveFileId(activeDoc!.id, file.id)}
                        title={file.name}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '0 12px',
                          height: isActive ? '33px' : '30px',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          cursor: 'pointer',
                          border: 'none',
                          borderRight: '1px solid var(--border-subtle)',
                          borderTop: isActive ? '2px solid var(--brand-primary)' : '2px solid transparent',
                          backgroundColor: isActive ? 'var(--bg-main)' : 'transparent',
                          color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                          fontSize: '11.5px',
                          fontWeight: isActive ? 650 : 400,
                          transition: 'all 0.1s ease',
                          position: 'relative',
                          marginBottom: isActive ? 0 : undefined,
                        }}
                      >
                        <FileText size={11} color={isActive ? 'var(--brand-primary)' : 'var(--text-muted)'} />
                        <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {file.name}
                        </span>
                        {file.isMain && (
                          <span style={{
                            display: 'inline-block',
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            backgroundColor: '#10B981',
                            flexShrink: 0,
                          }} title="Entrypoint" />
                        )}
                      </button>
                    );
                  }) : (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0 12px', height: '33px', borderTop: '2px solid var(--brand-primary)', backgroundColor: 'var(--bg-main)', borderRight: '1px solid var(--border-subtle)', fontSize: '11.5px', color: 'var(--text-primary)', fontWeight: 650, flexShrink: 0 }}>
                      <FileText size={11} color="var(--brand-primary)" />
                      <span>{activeDoc?.title || 'main.md'}</span>
                    </div>
                  )}
                </div>

                {/* Editor Toolbar (Shortcuts for Markdown & LaTeX) */}
                <div
                  style={{
                    height: '38px',
                    padding: '0 12px',
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    overflowX: 'auto',
                    flexShrink: 0,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => insertShortcut('**', '**', 'teks tebal')}
                    style={toolbarBtnStyle}
                    title="Tebal (Bold)"
                  >
                    <Bold size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertShortcut('*', '*', 'teks miring')}
                    style={toolbarBtnStyle}
                    title="Miring (Italic)"
                  >
                    <Italic size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertShortcut('## ', '', 'Judul Bagian')}
                    style={toolbarBtnStyle}
                    title="Heading 2"
                  >
                    <Heading size={13} />
                  </button>

                  <div style={separatorStyle} />

                  <button
                    type="button"
                    onClick={() => insertShortcut('$$', '$$', 'E = mc^2')}
                    style={toolbarBtnStyle}
                    title="Rumus Matematika Inline ($...$)"
                  >
                    <span style={{ fontSize: '11px', fontWeight: 700 }}>$x$</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertShortcut('\n$$\n', '\n$$\n', '\\int_{0}^{\\infty} f(x) dx = 1')}
                    style={toolbarBtnStyle}
                    title="Persamaan Matematika Block ($$...$$)"
                  >
                    <Sigma size={13} color="#8B5CF6" />
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>Persamaan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertShortcut(
                        '\n| Kolom 1 | Kolom 2 | Kolom 3 |\n| :--- | :--- | :--- |\n| Baris 1 | Data A | Data B |\n'
                      )
                    }
                    style={toolbarBtnStyle}
                    title="Tabel Markdown"
                  >
                    <TableIcon size={13} color="#10B981" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertShortcut(
                        '\n```mermaid\ngraph TD\n    A[Mulai] --> B[Proses]\n    B --> C{Keputusan?}\n```\n'
                      )
                    }
                    style={toolbarBtnStyle}
                    title="Diagram Alur Mermaid"
                  >
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#0073ea' }}>Mermaid</span>
                  </button>
                </div>

                {/* Code Textarea for Active Subfile with line wrapping */}
                <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                  <textarea
                    ref={textareaRef}
                    value={activeSubFile?.content ?? activeDoc?.content ?? ''}
                    onChange={(e) => {
                      if (activeDoc && activeSubFile) {
                        updateSubFileContent(activeDoc.id, activeSubFile.id, e.target.value);
                      } else if (activeDoc) {
                        updateDocumentContent(activeDoc.id, e.target.value);
                      }
                    }}
                    placeholder={`Ketik isi file ${activeSubFile?.name || 'main.tex'} di sini...`}
                    style={{
                      width: '100%',
                      height: '100%',
                      padding: '16px 20px',
                      backgroundColor: 'var(--bg-main)',
                      color: 'var(--text-primary)',
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      fontSize: '13px',
                      lineHeight: '1.6',
                      border: 'none',
                      outline: 'none',
                      resize: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Resize handle: Editor ↔ Preview */}
            {viewMode === 'split' && (
              <div
                onMouseDown={handleEditorDragStart}
                style={{
                  width: '5px',
                  cursor: 'col-resize',
                  flexShrink: 0,
                  backgroundColor: 'var(--border-subtle)',
                  transition: 'background 0.15s',
                }}
                className="resize-divider"
              />
            )}

            {/* Right: Live Overleaf-Style Preview */}
            {(viewMode === 'split' || viewMode === 'preview') && (
              <div
                style={{
                  flex: viewMode === 'split' ? 1.15 : 1,
                  height: '100%',
                  backgroundColor: theme === 'light' ? '#e2e8f0' : '#090d16',
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0,
                  position: 'relative',
                }}
              >
                {/* Overleaf-Style Compilation & Diagnostics Bar */}
                <div
                  style={{
                    height: '38px',
                    backgroundColor: 'var(--bg-surface)',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 10px',
                    flexShrink: 0,
                    fontSize: '12px',
                    userSelect: 'none',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    whiteSpace: 'nowrap',
                    gap: '12px',
                  }}
                  className="custom-scrollbar"
                >
                  {/* Left: Recompile Button + Log Counters */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {/* Recompile Button */}
                    <button
                      type="button"
                      onClick={handleRecompile}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: '5px',
                        backgroundColor: '#10B981',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        flexShrink: 0,
                      }}
                      className="hover-subtle"
                      title={language === 'id' ? 'Kompilasi Ulang Dokumen (Recompile)' : 'Recompile Document'}
                    >
                      <RefreshCw size={12} style={{ animation: isRecompiling ? 'spin 0.5s linear infinite' : 'none' }} />
                      <span>{language === 'id' ? 'Recompile' : 'Recompile'}</span>
                    </button>

                    <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border-subtle)', flexShrink: 0 }} />

                    {/* All Logs */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLogTab('all');
                        setIsLogDrawerOpen(!isLogDrawerOpen || activeLogTab !== 'all');
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isLogDrawerOpen && activeLogTab === 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontSize: '11px',
                        fontWeight: isLogDrawerOpen && activeLogTab === 'all' ? 700 : 500,
                        cursor: 'pointer',
                        padding: '3px 6px',
                        borderRadius: '4px',
                        flexShrink: 0,
                      }}
                      className="hover-subtle"
                    >
                      <span>All logs</span>{' '}
                      <span style={{ fontWeight: 700 }}>{lintResults.totalLogs}</span>
                    </button>

                    {/* Errors Counter */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLogTab('errors');
                        setIsLogDrawerOpen(!isLogDrawerOpen || activeLogTab !== 'errors');
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        backgroundColor:
                          lintResults.errors.length > 0
                            ? 'rgba(239, 68, 68, 0.12)'
                            : isLogDrawerOpen && activeLogTab === 'errors'
                            ? 'var(--bg-subtle)'
                            : 'transparent',
                        border: lintResults.errors.length > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid transparent',
                        color: lintResults.errors.length > 0 ? '#EF4444' : 'var(--text-muted)',
                        fontSize: '11px',
                        fontWeight: lintResults.errors.length > 0 ? 700 : 500,
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                      title="Klik untuk melihat daftar error"
                    >
                      <AlertCircle size={12} color={lintResults.errors.length > 0 ? '#EF4444' : 'var(--text-muted)'} />
                      <span>Errors</span>
                      <span style={{ fontWeight: 700 }}>{lintResults.errors.length}</span>
                    </button>

                    {/* Warnings Counter */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLogTab('warnings');
                        setIsLogDrawerOpen(!isLogDrawerOpen || activeLogTab !== 'warnings');
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        backgroundColor:
                          lintResults.warnings.length > 0
                            ? 'rgba(245, 158, 11, 0.12)'
                            : isLogDrawerOpen && activeLogTab === 'warnings'
                            ? 'var(--bg-subtle)'
                            : 'transparent',
                        border: lintResults.warnings.length > 0 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
                        color: lintResults.warnings.length > 0 ? '#F59E0B' : 'var(--text-muted)',
                        fontSize: '11px',
                        fontWeight: lintResults.warnings.length > 0 ? 700 : 500,
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                      title="Klik untuk melihat daftar warning"
                    >
                      <AlertTriangle size={12} color={lintResults.warnings.length > 0 ? '#F59E0B' : 'var(--text-muted)'} />
                      <span>Warnings</span>
                      <span style={{ fontWeight: 700 }}>{lintResults.warnings.length}</span>
                    </button>

                    {/* Info Counter */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLogTab('info');
                        setIsLogDrawerOpen(!isLogDrawerOpen || activeLogTab !== 'info');
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        backgroundColor: isLogDrawerOpen && activeLogTab === 'info' ? 'var(--bg-subtle)' : 'transparent',
                        border: '1px solid transparent',
                        color: 'var(--text-muted)',
                        fontSize: '11px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      <span>Info</span>
                      <span style={{ fontWeight: 700 }}>{lintResults.infos.length}</span>
                    </button>
                  </div>

                  {/* Right: Zoom / Auto-Fit Scale Badge + Log toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        backgroundColor: 'var(--bg-subtle)',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontWeight: 600,
                        fontFamily: 'monospace',
                        flexShrink: 0,
                      }}
                      title="Auto-Fit Page Width"
                    >
                      <span style={{ color: 'var(--text-primary)' }}>{previewScale}%</span>
                      <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>Auto Fit</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsLogDrawerOpen(!isLogDrawerOpen)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isLogDrawerOpen ? 'var(--brand-primary)' : 'var(--text-muted)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0,
                      }}
                      className="hover-subtle"
                    >
                      <span>{isLogDrawerOpen ? (language === 'id' ? 'Sembunyikan Log' : 'Hide Logs') : (language === 'id' ? 'Lihat Log' : 'View Logs')}</span>
                      <ChevronUp
                        size={13}
                        style={{
                          transform: isLogDrawerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.15s ease',
                        }}
                      />
                    </button>
                  </div>
                </div>

                {/* Collapsible Log Panel / Drawer */}
                {isLogDrawerOpen && (
                  <div
                    style={{
                      maxHeight: '220px',
                      backgroundColor: 'var(--bg-surface)',
                      borderBottom: '1px solid var(--border-subtle)',
                      boxShadow: 'var(--shadow-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      overflowY: 'auto',
                      padding: '10px 14px',
                      zIndex: 20,
                    }}
                  >
                    {(() => {
                      const displayed =
                        activeLogTab === 'errors'
                          ? lintResults.errors
                          : activeLogTab === 'warnings'
                          ? lintResults.warnings
                          : activeLogTab === 'info'
                          ? lintResults.infos
                          : [...lintResults.errors, ...lintResults.warnings, ...lintResults.infos];

                      if (displayed.length === 0) {
                        return (
                          <div style={{ padding: '16px', textAlign: 'center', color: '#10B981', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <CheckCircle2 size={15} color="#10B981" />
                            <span>{language === 'id' ? 'Tidak ada masalah ditemukan. Dokumen bersih!' : 'No issues found. Document is clean!'}</span>
                          </div>
                        );
                      }

                      return displayed.map((d) => (
                        <div
                          key={d.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            backgroundColor:
                              d.type === 'error'
                                ? 'rgba(239, 68, 68, 0.08)'
                                : d.type === 'warning'
                                ? 'rgba(245, 158, 11, 0.08)'
                                : 'var(--bg-subtle)',
                            borderLeft: `3px solid ${
                              d.type === 'error' ? '#EF4444' : d.type === 'warning' ? '#F59E0B' : 'var(--brand-primary)'
                            }`,
                            marginBottom: '6px',
                            gap: '8px',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  color: d.type === 'error' ? '#EF4444' : d.type === 'warning' ? '#F59E0B' : 'var(--brand-primary)',
                                }}
                              >
                                {d.type}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Baris {d.line} ({d.fileName || 'main.tex'})
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                              {d.message}
                            </div>
                            {d.suggestion && (
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                💡 {d.suggestion}
                              </div>
                            )}
                          </div>

                          {/* Quick Actions: Jump to Line & Fix with AI */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => {
                                jumpToLine(d.line - 1);
                              }}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--bg-surface)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)',
                                fontSize: '11px',
                                fontWeight: 500,
                                cursor: 'pointer',
                              }}
                              className="hover-subtle"
                            >
                              Lompat ke Baris
                            </button>
                            {d.type === 'error' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveDrawerTab('ai');
                                  if (!isSidebarOpen) toggleSidebar();
                                }}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: 'rgba(0, 115, 234, 0.12)',
                                  border: '1px solid rgba(0, 115, 234, 0.3)',
                                  color: 'var(--brand-primary)',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                <Sparkles size={11} />
                                <span>Perbaiki AI</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}

                <iframe
                  ref={previewIframeRef}
                  srcDoc={previewHtml}
                  sandbox="allow-scripts allow-modals allow-same-origin"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    backgroundColor: 'transparent',
                    pointerEvents: isDragging ? 'none' : 'auto',
                  }}
                  title="Live Document Preview"
                />
              </div>
            )}
          </>
        )}
        </div>
      </div>

      {/* Template Modal */}
      <DocsTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={(tplId) => createFromTemplate(tplId)}
      />
    </div>
  );
}

const toolbarBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 7px',
  borderRadius: '4px',
  border: '1px solid transparent',
  backgroundColor: 'transparent',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  fontSize: '11.5px',
  transition: 'all 0.15s ease',
};

const separatorStyle: React.CSSProperties = {
  width: '1px',
  height: '16px',
  backgroundColor: 'var(--border-subtle)',
  margin: '0 4px',
};
