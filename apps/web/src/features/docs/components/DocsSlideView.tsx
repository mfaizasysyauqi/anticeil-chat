'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Play,
  ChevronLeft,
  ChevronRight,
  Plus,
  Maximize2,
  Minimize2,
  Download,
  Printer,
  Sparkles,
  Layers,
  Palette,
  Columns,
  Code2,
  Eye,
  RefreshCw,
  ChevronDown,
  FileText,
  Copy,
  Check,
  Search,
  Sigma,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  HelpCircle,
  ExternalLink,
  MessageSquarePlus,
} from 'lucide-react';
import { useDocsStore } from '../store/useDocsStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { CommentBackdrop } from './CommentBackdrop';
import { selectCommentRange, measureCommentDomPositions } from '../utils/commentUtils';
import { SplashScreen } from '../../../shared/components/SplashScreen';
import {
  fileTabsBarStyle,
  editorToolbarStyle,
  toolbarBtnStyle,
  separatorStyle,
  popoverItemStyle,
  previewActionBarStyle,
  recompileBtnStyle,
  recompileDropdownArrowStyle,
} from '../styles/editorSharedStyles';

export interface DocsSlideViewProps {
  viewMode?: 'split' | 'code' | 'preview';
  setViewMode?: (mode: 'split' | 'code' | 'preview') => void;
  isFocusMode?: boolean;
  setIsFocusMode?: React.Dispatch<React.SetStateAction<boolean>> | ((val: boolean | ((prev: boolean) => boolean)) => void);
}

export function DocsSlideView({
  viewMode: propViewMode,
  setViewMode: propSetViewMode,
  isFocusMode: propFocusMode,
  setIsFocusMode: propSetFocusMode,
}: DocsSlideViewProps = {}) {
  const activeDocId = useDocsStore((s) => s.activeDocId);
  const documents = useDocsStore((s) => s.documents);
  const updateDocumentContent = useDocsStore((s) => s.updateDocumentContent);
  const setActiveFileId = useDocsStore((s) => s.setActiveFileId);
  const theme = useSettingsStore((s) => s.theme);
  const language = useSettingsStore((s) => s.language);

  // Active Comment UI state from store
  const activeHighlightedCommentId = useDocsStore((s) => s.activeHighlightedCommentId);
  const isAddingComment = useDocsStore((s) => s.isAddingComment);
  const draftSelectedText = useDocsStore((s) => s.draftSelectedText);
  const draftFromLine = useDocsStore((s) => s.draftFromLine);
  const draftToLine = useDocsStore((s) => s.draftToLine);
  const draftCharStart = useDocsStore((s) => s.draftCharStart);
  const draftCharEnd = useDocsStore((s) => s.draftCharEnd);
  const triggerAddCommentFromSelection = useDocsStore((s) => s.triggerAddCommentFromSelection);
  const setCommentDomPositions = useDocsStore((s) => s.setCommentDomPositions);
  const registerActiveTextarea = useDocsStore((s) => s.registerActiveTextarea);

  const activeDoc = documents.find((d) => d.id === activeDocId);

  if (!activeDoc) {
    return <SplashScreen title="Anticeil Slide" subtitle="Memuat Presentation Engine & Slide Stage..." />;
  }
  const docFiles = activeDoc?.files || [];
  const activeSubFile = docFiles.find((f) => f.id === activeDoc?.activeFileId) || docFiles[0];
  const activeFileName = activeSubFile?.name || activeDoc?.title || 'main.slide';

  // Content state
  const [code, setCode] = useState(() => activeDoc?.content || '');
  const [previewContent, setPreviewContent] = useState(code);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [slideTheme, setSlideTheme] = useState<'dark' | 'light' | 'midnight'>(
    theme === 'light' ? 'light' : 'midnight'
  );

  // View modes & Split ratios (aligned with Docs and Sheet)
  const [internalViewMode, setInternalViewMode] = useState<'split' | 'code' | 'preview'>('split');
  const viewMode = propViewMode ?? internalViewMode;
  const setViewMode = propSetViewMode ?? setInternalViewMode;

  const [internalFocusMode, setInternalFocusMode] = useState(false);
  const isFocusMode = propFocusMode ?? internalFocusMode;
  const setIsFocusMode = propSetFocusMode ?? setInternalFocusMode;

  const [splitRatio, setSplitRatio] = useState(0.48);
  const [isResizing, setIsResizing] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isAutoCompile, setIsAutoCompile] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Popover menus
  const [isRecompileDropdownOpen, setIsRecompileDropdownOpen] = useState(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [isStructureMenuOpen, setIsStructureMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const recompileButtonRef = useRef<HTMLButtonElement>(null);
  const downloadButtonRef = useRef<HTMLButtonElement>(null);
  const structureButtonRef = useRef<HTMLButtonElement>(null);
  const themeButtonRef = useRef<HTMLButtonElement>(null);

  const [recompileDropdownPos, setRecompileDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const [downloadMenuPos, setDownloadMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [structureMenuPos, setStructureMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [themeMenuPos, setThemeMenuPos] = useState<{ top: number; left: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropContainerRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  const [editorScrollTop, setEditorScrollTop] = useState(0);
  const [editorScrollLeft, setEditorScrollLeft] = useState(0);

  const handleEditorScroll = () => {
    if (textareaRef.current) {
      const top = textareaRef.current.scrollTop;
      const left = textareaRef.current.scrollLeft;
      setEditorScrollTop(top);
      setEditorScrollLeft(left);
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = top;
      }
    }
  };

  // Register active textarea for comment trigger from global/sidebar buttons
  useEffect(() => {
    registerActiveTextarea(textareaRef.current);
  });

  // Sync comment selection when clicked in review panel
  useEffect(() => {
    if (activeHighlightedCommentId && activeDoc?.comments) {
      const comment = activeDoc.comments.find((c) => c.id === activeHighlightedCommentId);
      if (comment) {
        selectCommentRange(comment, code, textareaRef.current);
      }
    }
  }, [activeHighlightedCommentId, activeDoc?.comments, code]);

  // Measure comment backdrop DOM positions
  useEffect(() => {
    if (!backdropContainerRef.current) return;
    const map = measureCommentDomPositions(backdropContainerRef.current);
    setCommentDomPositions(map);
  }, [code, activeDoc?.comments, isAddingComment, draftFromLine, setCommentDomPositions]);

  // Sync zoom level with iframe scaler
  useEffect(() => {
    previewIframeRef.current?.contentWindow?.postMessage(
      { type: 'SLIDE_SET_ZOOM', zoom: zoomLevel },
      '*'
    );
  }, [zoomLevel]);

  // Sync document content when active document changes
  useEffect(() => {
    if (!activeDoc) return;
    const text = activeDoc.content || '';
    setCode(text);
    setPreviewContent(text);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDocId]);

  // Debounced sync code -> preview & store
  useEffect(() => {
    const t = setTimeout(() => {
      if (isAutoCompile) {
        setPreviewContent(code);
      }
      if (activeDoc && activeDoc.content !== code) {
        updateDocumentContent(activeDoc.id, code);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [code, activeDoc, updateDocumentContent, isAutoCompile]);

  // Sync slide theme with global theme changes
  useEffect(() => {
    setSlideTheme(theme === 'light' ? 'light' : 'midnight');
  }, [theme]);

  // Close popovers on outside mousedown (mousedown fires before click, so
  // stopPropagation on the button click doesn't race with this handler)
  useEffect(() => {
    const onOutside = () => {
      setIsRecompileDropdownOpen(false);
      setIsDownloadMenuOpen(false);
      setIsStructureMenuOpen(false);
      setIsThemeMenuOpen(false);
    };
    window.addEventListener('mousedown', onOutside);
    return () => window.removeEventListener('mousedown', onOutside);
  }, []);

  // Split raw markdown into individual slide chunks using '---' delimiter
  const slides = useMemo(() => {
    const raw = previewContent.trim();
    if (!raw) {
      return [
        '# Judul Presentasi\n\n### Subjudul atau Ringkasan\n\n* Poin penting 1\n* Poin penting 2\n* Poin penting 3',
      ];
    }
    const parts = raw.split(/\n---\n/);
    return parts.length > 0 ? parts : [raw];
  }, [previewContent]);

  const validIndex = Math.min(Math.max(0, currentSlideIndex), Math.max(0, slides.length - 1));

  // Keyboard navigation for presentation & editor shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && isFullscreen)) {
        if (isFullscreen || viewMode === 'preview') {
          e.preventDefault();
          setCurrentSlideIndex((i) => Math.min(i + 1, slides.length - 1));
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (isFullscreen || viewMode === 'preview') {
          e.preventDefault();
          setCurrentSlideIndex((i) => Math.max(i - 1, 0));
        }
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      } else if (e.key === 'F5') {
        e.preventDefault();
        setIsFullscreen((f) => !f);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, isFullscreen, viewMode]);

  // Recompile manual trigger
  const handleRecompile = () => {
    setIsCompiling(true);
    setPreviewContent(code);
    if (activeDoc && activeDoc.content !== code) {
      updateDocumentContent(activeDoc.id, code);
    }
    setTimeout(() => setIsCompiling(false), 300);
  };

  // Helper to insert markdown shortcuts with native undo/redo preservation
  const insertShortcut = (before: string, after: string = '', defaultText: string = '') => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const val = el.value;
    const selected = val.substring(start, end) || defaultText;
    const textToInsert = before + selected + after;

    let success = false;
    try {
      success = document.execCommand('insertText', false, textToInsert);
    } catch {
      success = false;
    }

    if (success) {
      const event = new Event('input', { bubbles: true });
      el.dispatchEvent(event);
      const newSelStart = start + before.length;
      const newSelEnd = newSelStart + selected.length;
      el.setSelectionRange(newSelStart, newSelEnd);
    } else {
      const next = val.substring(0, start) + textToInsert + val.substring(end);
      setCode(next);
      if (activeDoc) updateDocumentContent(activeDoc.id, next);
    }
  };

  // Add a new slide to document
  const handleAddNewSlide = () => {
    const newSlideTemplate = `\n---\n\n## Judul Slide Baru\n\n- Poin utama bahasan\n- Data dan analisis pendukung\n- Kesimpulan ringkas\n`;
    insertShortcut(newSlideTemplate, '', '');
    setTimeout(() => {
      setCurrentSlideIndex(slides.length);
    }, 100);
  };

  // Split-resizer mouse drag handlers (1:1 with Docs and Sheet)
  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startRatio = splitRatio;

    const onMove = (moveEv: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = moveEv.clientX - startX;
      const newRatio = Math.max(0.2, Math.min(0.8, startRatio + deltaX / rect.width));
      setSplitRatio(newRatio);
    };

    const onUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [splitRatio]);



  // Tab key indent handler
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const { selectionStart: s, selectionEnd: en } = ta;
      const val = ta.value;
      const next = val.substring(0, s) + '  ' + val.substring(en);
      setCode(next);
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = s + 2;
      }, 0);
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRecompile();
    }
  };

  // Extract theme comment from markdown code
  useEffect(() => {
    const match = code.match(/<!--\s*theme:\s*(midnight|dark|light)\s*-->/i);
    if (match && match[1]) {
      const detected = match[1].toLowerCase() as 'midnight' | 'dark' | 'light';
      if (detected !== slideTheme) {
        setSlideTheme(detected);
      }
    }
  }, [code, slideTheme]);

  // Handler to select theme and write tag to markdown code
  const handleSelectTheme = (newTheme: 'midnight' | 'dark' | 'light') => {
    setSlideTheme(newTheme);

    const themeCommentRegex = /<!--\s*theme:\s*(midnight|dark|light)\s*-->/i;
    let nextCode = code;
    if (themeCommentRegex.test(nextCode)) {
      nextCode = nextCode.replace(themeCommentRegex, `<!-- theme: ${newTheme} -->`);
    } else {
      nextCode = `<!-- theme: ${newTheme} -->\n\n` + nextCode;
    }

    setCode(nextCode);
    setPreviewContent(nextCode);
    if (activeDoc) {
      updateDocumentContent(activeDoc.id, nextCode);
    }
  };

  // Compile individual slide markdown to sandboxed HTML
  const getSlideHtml = (content: string) => {
    let bgStyle = '';
    let textColor = '';
    let h1Color = '';
    let h2Color = '';
    let h2Border = '';
    let h3Color = '';
    let cardBg = '';
    let cardBorder = '';
    let blockquoteBorder = '';
    let blockquoteBg = '';
    let codeColor = '';
    let codeBg = '';
    let preBg = '';
    let preBorder = '';
    let tableThBg = '';
    let isDark = false;

    if (slideTheme === 'midnight') {
      // 1. Midnight: Cosmic Sci-Fi Navy Gradient & Luminous Sky Cyan
      isDark = true;
      bgStyle = 'background: linear-gradient(135deg, #030712 0%, #081534 50%, #0d2252 100%);';
      textColor = '#e0f2fe';
      h1Color = '#38bdf8';
      h2Color = '#7dd3fc';
      h2Border = '2px solid rgba(56, 189, 248, 0.5)';
      h3Color = '#38bdf8';
      cardBg = 'rgba(13, 34, 82, 0.55)';
      cardBorder = 'rgba(56, 189, 248, 0.25)';
      blockquoteBorder = '#38bdf8';
      blockquoteBg = 'rgba(56, 189, 248, 0.08)';
      codeColor = '#38bdf8';
      codeBg = 'rgba(56, 189, 248, 0.15)';
      preBg = '#020617';
      preBorder = '1px solid rgba(56, 189, 248, 0.3)';
      tableThBg = 'rgba(14, 165, 233, 0.25)';
    } else if (slideTheme === 'dark') {
      // 2. Dark Tech: Pure Matte Obsidian Charcoal & Clean Emerald Accents (Distinct from Midnight!)
      isDark = true;
      bgStyle = 'background-color: #121214;';
      textColor = '#e4e4e7';
      h1Color = '#ffffff';
      h2Color = '#fafafa';
      h2Border = '2px solid #10b981';
      h3Color = '#34d399';
      cardBg = 'rgba(255, 255, 255, 0.04)';
      cardBorder = 'rgba(255, 255, 255, 0.1)';
      blockquoteBorder = '#10b981';
      blockquoteBg = 'rgba(16, 185, 129, 0.07)';
      codeColor = '#6ee7b7';
      codeBg = 'rgba(16, 185, 129, 0.12)';
      preBg = '#09090b';
      preBorder = '1px solid #27272a';
      tableThBg = '#27272a';
    } else {
      // 3. Light Clean: Minimalist Editorial White & Royal Anticeil Blue
      isDark = false;
      bgStyle = 'background-color: #ffffff;';
      textColor = '#1e293b';
      h1Color = '#0073ea';
      h2Color = '#0f172a';
      h2Border = '2px solid #e2e8f0';
      h3Color = '#0073ea';
      cardBg = '#f8fafc';
      cardBorder = '#e2e8f0';
      blockquoteBorder = '#0073ea';
      blockquoteBg = '#f1f5f9';
      codeColor = '#0073ea';
      codeBg = '#f1f5f9';
      preBg = '#0f172a';
      preBorder = '1px solid #334155';
      tableThBg = '#f1f5f9';
    }

    const isGlobalDark = theme !== 'light';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"><\/script>

  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: ${isGlobalDark ? '#090d16' : '#e2e8f0'};
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    }
    #page-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      box-sizing: border-box;
      overflow: hidden;
    }
    #scaler-outer {
      position: relative;
      margin: auto;
      flex-shrink: 0;
      overflow: visible;
      transition: width 0.08s ease, height 0.08s ease;
    }
    #scaler-wrapper {
      position: absolute;
      top: 0;
      left: 0;
      width: 960px;
      height: 540px;
      transform-origin: 0 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.08s ease;
    }
    .slide-canvas {
      width: 960px;
      height: 540px;
      ${bgStyle}
      color: ${textColor};
      border-radius: 12px;
      box-shadow: ${isDark ? '0 20px 50px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.08)' : '0 15px 35px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)'};
      padding: 44px 56px;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      overflow: hidden;
      position: relative;
    }
    .slide-inner {
      margin: auto 0;
      width: 100%;
      box-sizing: border-box;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    h1, h2, h3 {
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.22;
      margin-bottom: 12px;
    }
    h1 { font-size: 38px; color: ${h1Color}; }
    h2 { font-size: 28px; color: ${h2Color}; border-bottom: ${h2Border}; padding-bottom: 6px; }
    h3 { font-size: 22px; color: ${h3Color}; }
    p  { font-size: 17px; line-height: 1.6; margin-bottom: 12px; opacity: 0.95; }
    ul, ol { font-size: 17px; line-height: 1.65; margin-bottom: 12px; padding-left: 28px; }
    li { margin-bottom: 6px; }
    blockquote {
      background: ${blockquoteBg};
      border-left: 4px solid ${blockquoteBorder};
      padding: 10px 18px;
      border-radius: 8px;
      font-style: italic;
      font-size: 16px;
      margin: 14px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      background: ${cardBg};
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid ${cardBorder};
      font-size: 15px;
    }
    th, td {
      padding: 8px 14px;
      text-align: left;
      border-bottom: 1px solid ${cardBorder};
    }
    th { background: ${tableThBg}; font-weight: 700; }
    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      background: ${codeBg};
      padding: 2px 6px;
      border-radius: 4px;
      color: ${codeColor};
    }
    pre {
      background: ${preBg};
      border: ${preBorder};
      padding: 14px;
      border-radius: 8px;
      overflow: hidden;
      font-size: 14px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .katex-display { margin: 12px 0 !important; padding: 4px 0; }
    img { max-width: 100%; max-height: 320px; object-fit: contain; border-radius: 6px; }
    hr { border: none; border-top: 1px solid ${cardBorder}; margin: 14px 0; }
    strong { font-weight: 700; }
    em { font-style: italic; }
    a { color: ${h1Color}; text-decoration: none; }
  </style>
</head>
<body>
  <div id="page-container">
    <div id="scaler-outer">
      <div id="scaler-wrapper">
        <div class="slide-canvas">
          <div class="slide-inner" id="slide-content"></div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const raw = ${JSON.stringify(content)};
    marked.setOptions({ gfm: true, breaks: true });
    const container = document.getElementById('slide-content');
    container.innerHTML = marked.parse(raw);

    renderMathInElement(container, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false},
      ],
      throwOnError: false
    });

    mermaid.initialize({ startOnLoad: true, theme: '${isDark ? 'dark' : 'default'}' });

    var SLIDE_W = 960;
    var SLIDE_H = 540;
    var userZoomLevel = ${zoomLevel};

    // Auto-fit content inside slide so long text never overflows the 540px slide
    function fitSlideContent() {
      if (!container) return;
      var maxH = 430; // 540px - 88px padding - safety buffer
      container.style.transform = 'none';
      var scrollH = container.scrollHeight;
      if (scrollH > maxH) {
        var ratio = maxH / scrollH;
        container.style.transform = 'scale(' + Math.max(0.35, ratio) + ')';
        container.style.transformOrigin = 'center center';
      }
    }

    // Proportional auto-adjust scale based on container size and zoom level
    function updateSlideScale() {
      var outer = document.getElementById('scaler-outer');
      var wrapper = document.getElementById('scaler-wrapper');
      var pageBox = document.getElementById('page-container');
      if (!outer || !wrapper || !pageBox) return;

      fitSlideContent();

      var availW = Math.max(10, pageBox.clientWidth - 24);
      var availH = Math.max(10, pageBox.clientHeight - 24);

      var baseScale = Math.min(availW / SLIDE_W, availH / SLIDE_H);
      var scale = Math.max(0.05, baseScale * (userZoomLevel / 100));

      wrapper.style.transform = 'scale(' + scale + ')';
      outer.style.width = Math.round(SLIDE_W * scale) + 'px';
      outer.style.height = Math.round(SLIDE_H * scale) + 'px';
    }

    updateSlideScale();

    // Listen to zoom message from parent
    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'SLIDE_SET_ZOOM') {
        userZoomLevel = Number(e.data.zoom) || 100;
        updateSlideScale();
      }
    });

    window.addEventListener('resize', updateSlideScale);
    if (window.ResizeObserver) {
      new ResizeObserver(updateSlideScale).observe(document.documentElement);
    }
  </script>
</body>
</html>
    `;
  };

  // Export handlers
  const handleExportMarkdown = () => {
    const blob = new Blob([code], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeDoc?.title || 'presentation'}.slide`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportHtml = () => {
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${activeDoc?.title || 'Presentation'}</title></head><body>${slides.map((s, i) => `<div style="page-break-after: always; padding: 40px;"><h2>Slide ${i+1}</h2><div>${s}</div></div>`).join('')}</body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeDoc?.title || 'presentation'}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const lineCount = useMemo(() => Math.max(1, code.split('\n').length), [code]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: 'var(--bg-main)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ── 1. Left Editor Column (Overleaf Tabs + Formatting Toolbar + Textarea) ── */}
      {!isFocusMode && (viewMode === 'split' || viewMode === 'code') && (
        <div
          style={{
            flex: viewMode === 'code' ? 1 : `${splitRatio} 1 0%`,
            minWidth: viewMode === 'split' ? '240px' : 0,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-main)',
            borderRight: 'none',
            overflow: 'hidden',
          }}
        >
          {/* 1.1 Overleaf-Style File Tabs (34px) */}
          <div style={fileTabsBarStyle} className="hide-scrollbar">
            {docFiles.length > 0 ? (
              docFiles.map((file) => {
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
                    }}
                  >
                    <Layers size={11} color={isActive ? 'var(--brand-primary)' : 'var(--text-muted)'} />
                    <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {file.name}
                    </span>
                    {file.isMain && (
                      <span
                        style={{
                          display: 'inline-block',
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          backgroundColor: '#10B981',
                          flexShrink: 0,
                        }}
                        title="Main Slide Deck"
                      />
                    )}
                  </button>
                );
              })
            ) : (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '0 12px',
                  height: '33px',
                  borderTop: '2px solid var(--brand-primary)',
                  backgroundColor: 'var(--bg-main)',
                  borderRight: '1px solid var(--border-subtle)',
                  fontSize: '11.5px',
                  color: 'var(--text-primary)',
                  fontWeight: 650,
                  flexShrink: 0,
                }}
              >
                <Layers size={11} color="var(--brand-primary)" />
                <span>{activeFileName}</span>
                <span
                  style={{
                    display: 'inline-block',
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    flexShrink: 0,
                  }}
                  title="Main Slide Deck"
                />
              </div>
            )}
          </div>

          {/* 1.2 Overleaf-Style Formatting Toolbar — icon-only, no text labels */}
          <div
            style={{
              ...editorToolbarStyle,
              width: '100%',
              boxSizing: 'border-box',
              overflowX: 'auto',
              overflowY: 'hidden',
              flexWrap: 'nowrap',
            }}
            className="hide-scrollbar"
            onWheel={(e) => {
              if (e.deltaY !== 0) e.currentTarget.scrollLeft += e.deltaY;
            }}
          >
            {/* Undo / Redo */}
            <button
              type="button"
              onClick={() => {
                textareaRef.current?.focus();
                document.execCommand('undo');
              }}
              style={{ ...toolbarBtnStyle, flexShrink: 0 }}
              title="Undo (Ctrl+Z)"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M3 13C5.5 6.5 12 5 17 8s6 9 2 13"/></svg>
            </button>
            <button
              type="button"
              onClick={() => {
                textareaRef.current?.focus();
                document.execCommand('redo');
              }}
              style={{ ...toolbarBtnStyle, flexShrink: 0 }}
              title="Redo (Ctrl+Y)"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M21 13C18.5 6.5 12 5 7 8S1 17 5 21"/></svg>
            </button>

            <div style={{ ...separatorStyle, flexShrink: 0 }} />

            {/* TT Slide Structure Dropdown */}
            <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
              <button
                ref={structureButtonRef}
                type="button"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (structureButtonRef.current) {
                    const rect = structureButtonRef.current.getBoundingClientRect();
                    setStructureMenuPos({ top: rect.bottom + 4, left: rect.left });
                  }
                  setIsStructureMenuOpen((v) => !v);
                }}
                style={{
                  ...toolbarBtnStyle,
                  padding: '1px 4px',
                  gap: '2px',
                  backgroundColor: isStructureMenuOpen ? 'var(--bg-subtle)' : 'transparent',
                  borderColor: isStructureMenuOpen ? 'var(--border-subtle)' : 'transparent',
                  flexShrink: 0,
                }}
                title="Struktur / Bagian Slide (TT)"
              >
                <span style={{ fontFamily: 'serif', fontWeight: 800, fontSize: '12px', lineHeight: 1, letterSpacing: '-0.5px' }}>
                  T<span style={{ fontSize: '9.5px' }}>T</span>
                </span>
                <ChevronDown size={10} style={{ opacity: 0.7, transform: isStructureMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
              </button>

              {isStructureMenuOpen && structureMenuPos && typeof document !== 'undefined' && createPortal(
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  className="animate-fade-in"
                  style={{
                    position: 'fixed',
                    top: `${structureMenuPos.top}px`,
                    left: `${structureMenuPos.left}px`,
                    zIndex: 999999999,
                    minWidth: '220px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-xl, 0 12px 32px rgba(0,0,0,0.3))',
                    padding: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1px',
                  }}
                >
                  <div style={{ padding: '4px 8px 3px', fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Struktur Slide Deck
                  </div>
                  <button
                    type="button"
                    onMouseDown={() => { insertShortcut('\n# Judul Slide Utama\n\n'); setIsStructureMenuOpen(false); }}
                    style={popoverItemStyle}
                  >
                    <span style={{ fontWeight: 800, fontSize: '14px', width: '22px', color: 'var(--brand-primary)' }}>#</span>
                    <span>Judul Slide Utama (H1)</span>
                  </button>
                  <button
                    type="button"
                    onMouseDown={() => { insertShortcut('\n## Subjudul Topik\n\n'); setIsStructureMenuOpen(false); }}
                    style={popoverItemStyle}
                  >
                    <span style={{ fontWeight: 700, fontSize: '13px', width: '22px', color: '#60a5fa' }}>##</span>
                    <span>Subjudul / Section (H2)</span>
                  </button>
                  <button
                    type="button"
                    onMouseDown={() => { insertShortcut('\n### Poin Pembahasan\n\n'); setIsStructureMenuOpen(false); }}
                    style={popoverItemStyle}
                  >
                    <span style={{ fontWeight: 700, fontSize: '12px', width: '22px', color: '#a78bfa' }}>###</span>
                    <span>Topik Ringkas (H3)</span>
                  </button>
                  <button
                    type="button"
                    onMouseDown={() => { insertShortcut('\n> "Kutipan atau poin utama presentasi"\n\n'); setIsStructureMenuOpen(false); }}
                    style={popoverItemStyle}
                  >
                    <Quote size={13} style={{ width: '22px', color: '#f59e0b' }} />
                    <span>Kutipan / Callout Poin</span>
                  </button>
                  <button
                    type="button"
                    onMouseDown={() => { insertShortcut('\n---\n\n## Slide Berikutnya\n\n'); setIsStructureMenuOpen(false); }}
                    style={popoverItemStyle}
                  >
                    <span style={{ fontWeight: 700, fontSize: '12px', width: '22px', color: '#10b981' }}>---</span>
                    <span>Pemisah Slide Baru (Break)</span>
                  </button>
                </div>,
                document.body
              )}
            </div>

            {/* Typography: Bold, Italic, Strikethrough, Underline, Code */}
            <button
              type="button"
              onClick={() => insertShortcut('**', '**', 'teks tebal')}
              style={{ ...toolbarBtnStyle, fontWeight: 700, flexShrink: 0 }}
              title="Tebal (Ctrl+B)"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => insertShortcut('*', '*', 'teks miring')}
              style={{ ...toolbarBtnStyle, fontStyle: 'italic', fontFamily: 'serif', flexShrink: 0 }}
              title="Miring (Ctrl+I)"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => insertShortcut('~~', '~~', 'teks coret')}
              style={{ ...toolbarBtnStyle, textDecoration: 'line-through', flexShrink: 0 }}
              title="Coret (Strikethrough)"
            >
              S
            </button>
            <button
              type="button"
              onClick={() => insertShortcut('<u>', '</u>', 'teks garis bawah')}
              style={{ ...toolbarBtnStyle, textDecoration: 'underline', flexShrink: 0 }}
              title="Garis Bawah (Underline)"
            >
              U
            </button>
            <button
              type="button"
              onClick={() => insertShortcut('`', '`', 'kode')}
              style={{ ...toolbarBtnStyle, flexShrink: 0 }}
              title="Kode Inline"
            >
              <Code2 size={12} />
            </button>

            <div style={{ ...separatorStyle, flexShrink: 0 }} />

            {/* Lists: Bullet, Numbered, Blockquote */}
            <button
              type="button"
              onClick={() => insertShortcut('\n- ', '', 'poin slide')}
              style={{ ...toolbarBtnStyle, flexShrink: 0 }}
              title="Daftar Poin (Bullet List)"
            >
              <List size={12} />
            </button>
            <button
              type="button"
              onClick={() => insertShortcut('\n1. ', '', 'langkah pertama')}
              style={{ ...toolbarBtnStyle, flexShrink: 0 }}
              title="Daftar Bernomor (Numbered List)"
            >
              <ListOrdered size={12} />
            </button>
            <button
              type="button"
              onClick={() => insertShortcut('\n> ', '', 'kutipan inspiratif')}
              style={{ ...toolbarBtnStyle, flexShrink: 0 }}
              title="Blok Kutipan (Quote)"
            >
              <Quote size={12} />
            </button>

            <div style={{ ...separatorStyle, flexShrink: 0 }} />

            {/* Code Block, Formula, Table */}
            <button
              type="button"
              onClick={() => insertShortcut('\n```javascript\n', '\n```\n', '// kode program')}
              style={{ ...toolbarBtnStyle, flexShrink: 0 }}
              title="Blok Kode Program"
            >
              <FileText size={12} />
            </button>
            <button
              type="button"
              onClick={() => insertShortcut('$$', '$$', 'E = mc^2')}
              style={{ ...toolbarBtnStyle, fontWeight: 700, color: '#f59e0b', fontSize: '10.5px', flexShrink: 0 }}
              title="Formula Matematika LaTeX ($x$)"
            >
              $x$
            </button>
            <button
              type="button"
              onClick={() => insertShortcut('\n| Kolom 1 | Kolom 2 |\n|---|---|\n| Data A | Data B |\n')}
              style={{ ...toolbarBtnStyle, flexShrink: 0 }}
              title="Sisipkan Tabel Markdown"
            >
              <TableIcon size={12} />
            </button>

            <div style={{ ...separatorStyle, flexShrink: 0 }} />

            {/* Comment Trigger */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => triggerAddCommentFromSelection(textareaRef.current, code)}
              style={{ ...toolbarBtnStyle, flexShrink: 0 }}
              title="Tambah Komentar Review (Ctrl+Shift+C)"
            >
              <MessageSquarePlus size={12} />
            </button>

            {/* Theme Selector Popover in Formatting Toolbar */}
            <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
              <button
                ref={themeButtonRef}
                type="button"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (themeButtonRef.current) {
                    const rect = themeButtonRef.current.getBoundingClientRect();
                    setThemeMenuPos({ top: rect.bottom + 4, left: rect.left });
                  }
                  setIsThemeMenuOpen((v) => !v);
                }}
                style={{
                  ...toolbarBtnStyle,
                  padding: '2px 7px',
                  gap: '5px',
                  backgroundColor: isThemeMenuOpen ? 'var(--bg-subtle)' : 'transparent',
                  border: isThemeMenuOpen ? '1px solid var(--border-subtle)' : '1px solid transparent',
                  color: 'var(--text-primary)',
                  fontWeight: 650,
                  fontSize: '11px',
                  flexShrink: 0,
                }}
                className="hover-subtle"
                title="Pilih Tema Slide"
              >
                <Palette
                  size={13}
                  color={slideTheme === 'midnight' ? '#38bdf8' : slideTheme === 'dark' ? '#10b981' : '#0073ea'}
                  style={{ flexShrink: 0 }}
                />
                <ChevronDown size={10} style={{ opacity: 0.7, transform: isThemeMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease', flexShrink: 0 }} />
              </button>

              {isThemeMenuOpen && themeMenuPos && typeof document !== 'undefined' && createPortal(
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  className="animate-fade-in"
                  style={{
                    position: 'fixed',
                    top: `${themeMenuPos.top}px`,
                    left: `${themeMenuPos.left}px`,
                    zIndex: 999999999,
                    minWidth: '220px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-xl, 0 12px 30px rgba(0,0,0,0.25))',
                    padding: '5px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <div style={{ padding: '4px 8px 3px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Tema Tampilan Slide
                  </div>
                  <button
                    type="button"
                    onMouseDown={() => { handleSelectTheme('midnight'); setIsThemeMenuOpen(false); }}
                    style={{
                      ...popoverItemStyle,
                      backgroundColor: slideTheme === 'midnight' ? 'var(--bg-subtle)' : 'transparent',
                    }}
                  >
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#081534', border: '1.5px solid #38bdf8', flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 650 }}>Midnight</span>
                      <span style={{ fontSize: '10px', color: '#38bdf8' }}>Cosmic Navy & Sky Cyan</span>
                    </div>
                    {slideTheme === 'midnight' && <Check size={13} strokeWidth={2.5} color="#38bdf8" style={{ marginLeft: 'auto' }} />}
                  </button>
                  <button
                    type="button"
                    onMouseDown={() => { handleSelectTheme('dark'); setIsThemeMenuOpen(false); }}
                    style={{
                      ...popoverItemStyle,
                      backgroundColor: slideTheme === 'dark' ? 'var(--bg-subtle)' : 'transparent',
                    }}
                  >
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#121214', border: '1.5px solid #10b981', flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 650 }}>Dark Tech</span>
                      <span style={{ fontSize: '10px', color: '#10b981' }}>Matte Obsidian & Emerald</span>
                    </div>
                    {slideTheme === 'dark' && <Check size={13} strokeWidth={2.5} color="#10b981" style={{ marginLeft: 'auto' }} />}
                  </button>
                  <button
                    type="button"
                    onMouseDown={() => { handleSelectTheme('light'); setIsThemeMenuOpen(false); }}
                    style={{
                      ...popoverItemStyle,
                      backgroundColor: slideTheme === 'light' ? 'var(--bg-subtle)' : 'transparent',
                    }}
                  >
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffffff', border: '1.5px solid #0073ea', flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 650 }}>Light Clean</span>
                      <span style={{ fontSize: '10px', color: '#0073ea' }}>Pure White & Royal Blue</span>
                    </div>
                    {slideTheme === 'light' && <Check size={13} strokeWidth={2.5} color="#0073ea" style={{ marginLeft: 'auto' }} />}
                  </button>
                </div>,
                document.body
              )}
            </div>

            <div style={{ ...separatorStyle, flexShrink: 0 }} />

            {/* Fast Add New Slide Button */}
            <button
              type="button"
              onClick={handleAddNewSlide}
              style={{
                ...toolbarBtnStyle,
                padding: '0 8px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--brand-primary)',
                flexShrink: 0,
              }}
              title="Tambah Slide Baru dengan pembatas (---)"
            >
              <Plus size={14} strokeWidth={2.6} style={{ flexShrink: 0 }} />
            </button>
          </div>

          {/* 1.3 Textarea + Line Numbers Body */}
          <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden', height: '100%', minHeight: 0 }}>
            {/* Line numbers gutter */}
            <div
              ref={lineNumbersRef}
              aria-hidden="true"
              style={{
                width: '46px',
                paddingTop: '16px',
                paddingBottom: '16px',
                paddingRight: '10px',
                textAlign: 'right',
                color: 'var(--text-muted)',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontSize: '13px',
                lineHeight: '1.6',
                userSelect: 'none',
                overflow: 'hidden',
                borderRight: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-main)',
                flexShrink: 0,
                boxSizing: 'border-box',
              }}
            >
              {Array.from({ length: lineCount }).map((_, i) => (
                <div key={i} style={{ fontSize: '13px', lineHeight: '1.6' }}>
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Markdown Textarea with Comment Backdrop */}
            <div style={{ position: 'relative', flex: 1, height: '100%', overflow: 'hidden' }}>
              <CommentBackdrop
                backdropRef={backdropContainerRef}
                rawText={code}
                comments={activeDoc?.comments || []}
                activeHighlightedCommentId={activeHighlightedCommentId}
                isAddingComment={isAddingComment}
                draftSelectedText={draftSelectedText}
                draftFromLine={draftFromLine}
                draftToLine={draftToLine}
                draftCharStart={draftCharStart}
                draftCharEnd={draftCharEnd}
                scrollTop={editorScrollTop}
                scrollLeft={editorScrollLeft}
              />
              <textarea
                ref={textareaRef}
                value={code}
                onScroll={handleEditorScroll}
                onSelect={(e) => {
                  (e.currentTarget as any)._lastSelection = {
                    start: e.currentTarget.selectionStart,
                    end: e.currentTarget.selectionEnd,
                  };
                }}
                onKeyUp={(e) => {
                  (e.currentTarget as any)._lastSelection = {
                    start: e.currentTarget.selectionStart,
                    end: e.currentTarget.selectionEnd,
                  };
                }}
                onMouseUp={(e) => {
                  (e.currentTarget as any)._lastSelection = {
                    start: e.currentTarget.selectionStart,
                    end: e.currentTarget.selectionEnd,
                  };
                }}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
                    e.preventDefault();
                    triggerAddCommentFromSelection(textareaRef.current, code);
                    return;
                  }
                  handleEditorKeyDown(e);
                }}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (activeDoc) updateDocumentContent(activeDoc.id, e.target.value);
                }}
                placeholder={`Tulis konten presentasi markdown...\nGunakan --- untuk memisahkan slide berikutnya.`}
                spellCheck={false}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  padding: '16px 20px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  caretColor: 'var(--brand-primary)',
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontSize: '13px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre',
                  overflow: 'auto',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Focus Mode: full-screen editor overlay */}
      {isFocusMode && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'var(--bg-main)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              height: '36px',
              flexShrink: 0,
              backgroundColor: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {activeFileName}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', flex: 1 }}>
              Focus Mode — tekan Ctrl+Shift+M atau klik tombol untuk keluar
            </span>
            <button
              type="button"
              onClick={() => setIsFocusMode(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 9px',
                borderRadius: '5px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Minimize2 size={12} /> Keluar Focus Mode
            </button>
          </div>
          <textarea
            autoFocus
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (activeDoc) updateDocumentContent(activeDoc.id, e.target.value);
            }}
            onKeyDown={handleEditorKeyDown}
            style={{
              flex: 1,
              resize: 'none',
              border: 'none',
              outline: 'none',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-primary)',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontSize: '13px',
              lineHeight: '1.7',
              padding: '24px 40px',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* ── 2. Resize Handle Divider (1:1 Mouse Follow) ───────────────────── */}
      {!isFocusMode && viewMode === 'split' && (
        <div
          onMouseDown={startResize}
          style={{
            width: '5px',
            cursor: 'col-resize',
            flexShrink: 0,
            backgroundColor: isResizing ? 'var(--brand-primary)' : 'var(--border-subtle)',
            transition: isResizing ? 'none' : 'background 0.15s',
          }}
          className="resize-divider"
        />
      )}

      {/* ── 3. Right Preview Pane: Live Overleaf-Style Compilation & Canvas ── */}
      {!isFocusMode && (viewMode === 'split' || viewMode === 'preview') && (
        <div
          style={{
            flex: viewMode === 'preview' ? 1 : `${1 - splitRatio} 1 0%`,
            minWidth: viewMode === 'split' ? '240px' : 0,
            height: '100%',
            backgroundColor: 'var(--bg-main)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* 3.1 Overleaf-Style Action Bar (36px) */}
          <div style={previewActionBarStyle} className="hide-scrollbar">
            {/* Left: Recompile Split Button + Download + Theme Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              {/* Recompile Split Button */}
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'stretch' }}>
                <button
                  type="button"
                  onClick={handleRecompile}
                  style={recompileBtnStyle}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#007033')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#00843D')}
                  title="Kompilasi Ulang Slide (Ctrl+Enter)"
                >
                  <RefreshCw size={11} style={{ animation: isCompiling ? 'spin 0.5s linear infinite' : 'none' }} />
                  <span>Recompile</span>
                </button>

                <button
                  ref={recompileButtonRef}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (recompileButtonRef.current) {
                      const rect = recompileButtonRef.current.getBoundingClientRect();
                      setRecompileDropdownPos({ top: rect.bottom + 4, left: rect.left - 100 });
                    }
                    setIsRecompileDropdownOpen((v) => !v);
                  }}
                  style={recompileDropdownArrowStyle}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#007033')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#00843D')}
                  title="Opsi Kompilasi"
                >
                  <ChevronDown size={11} style={{ transform: isRecompileDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                </button>

                {/* Recompile Popover */}
                {isRecompileDropdownOpen && recompileDropdownPos && typeof document !== 'undefined' && createPortal(
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="animate-fade-in"
                    style={{
                      position: 'fixed',
                      top: `${recompileDropdownPos.top}px`,
                      left: `${recompileDropdownPos.left}px`,
                      zIndex: 999999999,
                      minWidth: '220px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: '6px',
                      boxShadow: 'var(--shadow-xl, 0 12px 32px rgba(0,0,0,0.35))',
                      padding: '6px 0',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ padding: '4px 14px 2px 14px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                      Auto-Compile
                    </div>
                    <div
                      onClick={() => setIsAutoCompile(!isAutoCompile)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 14px',
                        cursor: 'pointer',
                        fontSize: '12.5px',
                        color: 'var(--text-primary)',
                      }}
                      className="hover-subtle"
                    >
                      <span>Auto-compile saat mengetik</span>
                      {isAutoCompile && <Check size={14} strokeWidth={2.4} color="var(--brand-primary)" />}
                    </div>
                    <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />
                    <div
                      onClick={() => {
                        handleRecompile();
                        setIsRecompileDropdownOpen(false);
                      }}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12.5px',
                        color: '#0073ea',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                      className="hover-subtle"
                    >
                      Kompilasi dari awal (Reset)
                    </div>
                  </div>,
                  document.body
                )}
              </div>

              {/* Present (F5) Button (Between Recompile and Download) */}
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  height: '24px',
                  padding: '0 10px',
                  borderRadius: '5px',
                  backgroundColor: 'var(--brand-primary)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                  boxShadow: '0 2px 8px rgba(0, 115, 234, 0.3)',
                  flexShrink: 0,
                }}
                title="Tampilkan Presentasi Layar Penuh (F5)"
              >
                <Play size={10} fill="#ffffff" />
                <span>{language === 'id' ? 'Presentasi (F5)' : 'Present (F5)'}</span>
              </button>

              {/* Download / Export Menu */}
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <button
                  ref={downloadButtonRef}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (downloadButtonRef.current) {
                      const rect = downloadButtonRef.current.getBoundingClientRect();
                      setDownloadMenuPos({ top: rect.bottom + 4, left: rect.left });
                    }
                    setIsDownloadMenuOpen((v) => !v);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '5px',
                    backgroundColor: isDownloadMenuOpen ? 'var(--bg-subtle)' : 'transparent',
                    border: '1px solid transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  className="hover-subtle"
                  title="Unduh / Ekspor Slide"
                >
                  <Download size={14} />
                </button>

                {isDownloadMenuOpen && downloadMenuPos && typeof document !== 'undefined' && createPortal(
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="animate-fade-in"
                    style={{
                      position: 'fixed',
                      top: `${downloadMenuPos.top}px`,
                      left: `${downloadMenuPos.left}px`,
                      zIndex: 999999999,
                      minWidth: '220px',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-strong)',
                      boxShadow: 'var(--shadow-xl, 0 12px 30px rgba(0,0,0,0.25))',
                      padding: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    <div style={{ padding: '4px 8px 3px', fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Opsi Ekspor Slide
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        window.print();
                        setIsDownloadMenuOpen(false);
                      }}
                      style={popoverItemStyle}
                    >
                      <Printer size={13} color="var(--brand-primary)" />
                      <span>Cetak / Simpan PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleExportHtml();
                        setIsDownloadMenuOpen(false);
                      }}
                      style={popoverItemStyle}
                    >
                      <Layers size={13} color="#8B5CF6" />
                      <span>Ekspor HTML Standalone</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleExportMarkdown();
                        setIsDownloadMenuOpen(false);
                      }}
                      style={popoverItemStyle}
                    >
                      <FileText size={13} color="#10B981" />
                      <span>File Markdown (.slide)</span>
                    </button>
                  </div>,
                  document.body
                )}
              </div>
            </div>


            {/* Right: Slide Pager + Zoom Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              {/* Prev Slide */}
              <button
                type="button"
                disabled={validIndex === 0}
                onClick={() => setCurrentSlideIndex((i) => Math.max(i - 1, 0))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  border: '1px solid transparent',
                  color: validIndex === 0 ? 'var(--border-strong)' : 'var(--text-muted)',
                  cursor: validIndex === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
                className={validIndex > 0 ? 'hover-subtle' : ''}
                title="Slide Sebelumnya (←)"
              >
                <ChevronLeft size={14} />
              </button>

              {/* Slide Counter Capsule */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '24px',
                    height: '22px',
                    padding: '0 4px',
                    fontSize: '11.5px',
                    fontWeight: 650,
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)',
                  }}
                >
                  {validIndex + 1}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  / {slides.length}
                </span>
              </div>

              {/* Next Slide */}
              <button
                type="button"
                disabled={validIndex === slides.length - 1}
                onClick={() => setCurrentSlideIndex((i) => Math.min(i + 1, slides.length - 1))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  border: '1px solid transparent',
                  color: validIndex === slides.length - 1 ? 'var(--border-strong)' : 'var(--text-muted)',
                  cursor: validIndex === slides.length - 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
                className={validIndex < slides.length - 1 ? 'hover-subtle' : ''}
                title="Slide Selanjutnya (→)"
              >
                <ChevronRight size={14} />
              </button>

              <div style={separatorStyle} />

              {/* Zoom Controls */}
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '22px',
                  height: '22px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
                className="hover-subtle"
                title="Zoom Out"
              >
                -
              </button>

              <span
                onClick={() => setZoomLevel(100)}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  minWidth: '38px',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
                title="Klik untuk reset zoom 100%"
              >
                {zoomLevel}%
              </span>

              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(180, z + 10))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '22px',
                  height: '22px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
                className="hover-subtle"
                title="Zoom In"
              >
                +
              </button>
            </div>
          </div>

          {/* 3.2 Stage: fills remaining vertical space, holds the auto-scaling iframe */}
          <div
            style={{
              flex: 1,
              width: '100%',
              minHeight: 0,
              backgroundColor: theme === 'light' ? '#e2e8f0' : '#090d16',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <iframe
              ref={previewIframeRef}
              srcDoc={getSlideHtml(slides[validIndex] || '')}
              sandbox="allow-scripts allow-modals allow-same-origin"
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              title={`Slide ${validIndex + 1}`}
            />
          </div>

          {/* 3.3 Bottom Filmstrip Thumbnails — separated at bottom bar */}
          <div
            style={{
              flexShrink: 0,
              width: '100%',
              backgroundColor: theme === 'light' ? '#f8fafc' : '#070a12',
              borderTop: theme === 'light' ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
              padding: '6px 16px',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '820px',
                boxSizing: 'border-box',
                overflowX: 'auto',
                overflowY: 'hidden',
                padding: '2px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                scrollbarWidth: 'thin',
              }}
              className="custom-scrollbar"
            >
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlideIndex(idx)}
                  style={{
                    width: '60px',
                    height: '34px',
                    borderRadius: '6px',
                    border:
                      idx === validIndex
                        ? '2px solid var(--brand-primary)'
                        : theme === 'light'
                        ? '1px solid #cbd5e1'
                        : '1px solid rgba(255, 255, 255, 0.2)',
                    backgroundColor:
                      idx === validIndex
                        ? 'rgba(0, 115, 234, 0.15)'
                        : theme === 'light'
                        ? '#ffffff'
                        : 'rgba(255, 255, 255, 0.05)',
                    color:
                      idx === validIndex
                        ? 'var(--brand-primary)'
                        : theme === 'light'
                        ? '#64748b'
                        : 'rgba(255, 255, 255, 0.6)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Fullscreen Presentation Overlay (F5) ───────────────────────── */}
      {isFullscreen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: '#000000',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Top Exit Control */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              zIndex: 10,
            }}
          >
            <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px', fontWeight: 600 }}>
              {validIndex + 1} / {slides.length} • Tekan ESC untuk keluar
            </span>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#ffffff',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              ✕ Keluar
            </button>
          </div>

          {/* Fullscreen 16:9 Canvas Stage */}
          <div
            style={{
              width: '100vw',
              height: '100vh',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <iframe
              srcDoc={getSlideHtml(slides[validIndex] || '')}
              sandbox="allow-scripts allow-modals allow-same-origin"
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              title="Fullscreen Presentation"
            />
          </div>

          {/* Bottom Floating Navigation Arrows */}
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              padding: '6px 16px',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <button
              type="button"
              disabled={validIndex === 0}
              onClick={() => setCurrentSlideIndex((i) => Math.max(i - 1, 0))}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: validIndex === 0 ? 0.3 : 1,
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: 700 }}>
              {validIndex + 1} / {slides.length}
            </span>
            <button
              type="button"
              disabled={validIndex === slides.length - 1}
              onClick={() => setCurrentSlideIndex((i) => Math.min(i + 1, slides.length - 1))}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: validIndex === slides.length - 1 ? 0.3 : 1,
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
