'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import {
  Table as TableIcon,
  Code2,
  Columns2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Wand2,
  Plus,
  Filter,
  BarChart3,
  Layers,
  Sigma,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  Trash2,
  Link,
  Tag,
  Grid,
  PieChart,
  FileSpreadsheet,
  Printer,
  Calculator,
  Keyboard,
  ExternalLink,
  Maximize2,
  Minimize2,
  MessageSquarePlus,
} from 'lucide-react';
import { useDocsStore } from '../store/useDocsStore';
import { SplashScreen } from '../../../shared/components/SplashScreen';
import { CommentBackdrop } from './CommentBackdrop';
import { selectCommentRange, measureCommentDomPositions } from '../utils/commentUtils';
import { DocFileTabsBar, SplitResizeDivider, RecompileSplitButton, FocusModeOverlay } from './shared';
import { useSplitResize } from '../hooks/useSplitResize';
import { handleStandardEditorKeyDown } from '../utils/editorKeyUtils';
import { downloadDocAsZip } from '../utils/zipUtils';

import {
  toolbarBtnStyle,
  separatorStyle,
  popoverItemStyle,
} from '../styles/editorSharedStyles';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import {
  parseWorkbook,
  parseAntsheet,
  serializeWorkbook,
  serializeAntsheet,
  validateAntsheet,
  convertFromUniverWorkbook,
  parseCSV,
} from 'antsheet';
import { exportToXLSX } from 'antsheet/xlsx';
import { exportToCSV } from 'antsheet/csv';
import { evaluateWorkbook } from 'antsheet/formula';

const SpreadsheetLoading = () => {
  const language = useSettingsStore((s) => s.language);
  return (
    <SplashScreen
      title="Anticeil Sheet"
      subtitle={
        language === 'id'
          ? 'Memuat Grid & Spreadsheet Engine...'
          : 'Loading Grid & Spreadsheet Engine...'
      }
    />
  );
};

const UniverSheetsCore = dynamic(() => import('./UniverSheetsCore'), {
  ssr: false,
  loading: () => <SpreadsheetLoading />,
});

const DEFAULT_STARTER_ANTSHEET = `# Financial Overview

## Meta
columnWidth: A=180, B=130, C=130, D=140
rowHeight: 1=36, 6=32
freezeRow: 1
freezeColumn: 1
filter: A1:D5

## Cells
A1 = "Category" | fontWeight: bold, fontSize: 13, backgroundColor: #1e293b, color: #ffffff, textAlign: center
B1 = "Q1 (IDR)"   | fontWeight: bold, fontSize: 13, backgroundColor: #1e293b, color: #ffffff, textAlign: center
C1 = "Q2 (IDR)"   | fontWeight: bold, fontSize: 13, backgroundColor: #1e293b, color: #ffffff, textAlign: center
D1 = "Growth"     | fontWeight: bold, fontSize: 13, backgroundColor: #1e293b, color: #ffffff, textAlign: center

A2 = "Hardware & Servers"
B2 = 145000000 | format: currency:IDR, textAlign: right
C2 = 182000000 | format: currency:IDR, textAlign: right
D2 = "=(C2-B2)/B2" | format: percentage, textAlign: right, color: #16a34a, fontWeight: bold

A3 = "Software Subscriptions"
B3 = 45000000 | format: currency:IDR, textAlign: right
C3 = 52000000 | format: currency:IDR, textAlign: right
D3 = "=(C3-B3)/B3" | format: percentage, textAlign: right, color: #16a34a, fontWeight: bold

A4 = "Cloud Infrastructure"
B4 = 88000000 | format: currency:IDR, textAlign: right
C4 = 94000000 | format: currency:IDR, textAlign: right
D4 = "=(C4-B4)/B4" | format: percentage, textAlign: right, color: #16a34a, fontWeight: bold

A5 = "Consulting & Services"
B5 = 32000000 | format: currency:IDR, textAlign: right
C5 = 28000000 | format: currency:IDR, textAlign: right
D5 = "=(C5-B5)/B5" | format: percentage, textAlign: right, color: #dc2626, fontWeight: bold

A6 = "Total Expenses" | fontWeight: bold, backgroundColor: #f8fafc, borderTop: 2 solid #94a3b8
B6 = "=SUM(B2:B5)" | fontWeight: bold, format: currency:IDR, textAlign: right, backgroundColor: #f8fafc, borderTop: 2 solid #94a3b8
C6 = "=SUM(C2:C5)" | fontWeight: bold, format: currency:IDR, textAlign: right, backgroundColor: #f8fafc, borderTop: 2 solid #94a3b8
D6 = "=(C6-B6)/B6" | fontWeight: bold, format: percentage, textAlign: right, backgroundColor: #f8fafc, borderTop: 2 solid #94a3b8

## DataValidation
rule1 = list | range: A2:A5, options: ["Hardware & Servers", "Software Subscriptions", "Cloud Infrastructure", "Consulting & Services"]

## ConditionalFormatting
cf1 = highlight | range: D2:D5, operator: ">=", value: 0.15, backgroundColor: #dcfce7, color: #15803d
cf2 = highlight | range: D2:D5, operator: "<", value: 0, backgroundColor: #fee2e2, color: #b91c1c

## Charts
chart1 = bar | title: "Expense Comparison Q1 vs Q2", x: A, series: [B, C], position: F2:N14
`;

function normalizeToAntsheet(rawContent?: string): string {
  if (!rawContent || !rawContent.trim()) return DEFAULT_STARTER_ANTSHEET;
  const trimmed = rawContent.trim();

  const isAlreadyAntsheet =
    trimmed.startsWith('#') ||
    trimmed.includes('## Cells') ||
    trimmed.includes('## Meta') ||
    trimmed.includes('## Merges') ||
    trimmed.includes('## Charts') ||
    trimmed.includes('## DataValidation') ||
    trimmed.includes('## ConditionalFormatting') ||
    /^[A-Z]+\d+\s*=/m.test(trimmed);

  if (isAlreadyAntsheet && !trimmed.startsWith('{') && !trimmed.startsWith('[')) return trimmed;

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && 'sheets' in parsed) {
        const wb = convertFromUniverWorkbook(parsed);
        if (wb.sheets.length > 0 && Object.keys(wb.sheets[0].cells).length > 0)
          return serializeWorkbook(wb);
      }
    } catch (e) {
      console.warn('Failed to convert JSON workbook to AntSheet:', e);
    }
  }

  try {
    const doc = parseCSV(trimmed);
    if (Object.keys(doc.cells).length > 0) return serializeAntsheet(doc);
  } catch {
    // fallback
  }

  return DEFAULT_STARTER_ANTSHEET;
}

export interface DocsSpreadsheetViewProps {
  viewMode?: 'split' | 'code' | 'preview';
  setViewMode?: (mode: 'split' | 'code' | 'preview') => void;
  isFocusMode?: boolean;
  setIsFocusMode?: React.Dispatch<React.SetStateAction<boolean>> | ((val: boolean | ((prev: boolean) => boolean)) => void);
}

export function DocsSpreadsheetView({
  viewMode: propViewMode,
  setViewMode: propSetViewMode,
  isFocusMode: propFocusMode,
  setIsFocusMode: propSetFocusMode,
}: DocsSpreadsheetViewProps = {}) {
  const activeDocId           = useDocsStore((s) => s.activeDocId);
  const documents             = useDocsStore((s) => s.documents);
  const updateDocumentContent = useDocsStore((s) => s.updateDocumentContent);
  const updateSubFileContent  = useDocsStore((s) => s.updateSubFileContent);
  const setActiveFileId       = useDocsStore((s) => s.setActiveFileId);

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
  const docFiles = activeDoc?.files || [];
  const activeSubFile = docFiles.find((f) => f.id === activeDoc?.activeFileId) || docFiles[0];

  const [code,           setCode]           = useState(() => normalizeToAntsheet(activeDoc?.content));
  const [copied,         setCopied]         = useState(false);
  const [internalViewMode, setInternalViewMode] = useState<'split' | 'code' | 'preview'>('split');
  const viewMode = propViewMode ?? internalViewMode;
  const setViewMode = propSetViewMode ?? setInternalViewMode;

  const containerRef   = useRef<HTMLDivElement>(null);
  const { splitRatio, isResizing, startResize } = useSplitResize(containerRef, { defaultRatio: 0.48 });
  const [previewContent, setPreviewContent] = useState(code);
  const [isCompiling,    setIsCompiling]    = useState(false);
  const [recompileKey,   setRecompileKey]   = useState(0);
  const [themeMode,      setThemeMode]      = useState<'dark' | 'light'>('dark');

  // Sheet tab navigation
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);

  // Derive sheet names from code (for navigator display)
  const sheetNames = useMemo(() => {
    const names: string[] = [];
    const lines = code.split(/\r?\n/);
    let currentName: string | null = null;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ') && trimmed.length > 2) {
        if (currentName !== null) names.push(currentName);
        currentName = trimmed.slice(2).trim();
      }
    }
    if (currentName !== null) names.push(currentName);
    return names.length > 0 ? names : ['Sheet1'];
  }, [code]);

  const totalSheets = sheetNames.length;

  const handleGoToSheet = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(idx, totalSheets - 1));
    setActiveSheetIndex(clamped);
    // Switch active Univer sheet via exposed window.__univerAPI
    try {
      const api = (window as any).__univerAPI;
      if (api) {
        const wb = api.getActiveWorkbook?.();
        if (wb) {
          const sheets = wb.getSheets?.() ?? [];
          const target = sheets[clamped];
          if (target) wb.setActiveSheet?.(target);
        }
      }
    } catch { /* ignore if Univer not ready */ }
  }, [totalSheets]);

  // Popovers
  const [isAutoCompile, setIsAutoCompile] = useState(true);
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [isSectionMenuOpen, setIsSectionMenuOpen] = useState(false);
  const [isFunctionsMenuOpen, setIsFunctionsMenuOpen] = useState(false);
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);
  const [internalFocusMode, setInternalFocusMode] = useState(false);
  const isFocusMode = propFocusMode ?? internalFocusMode;
  const setIsFocusMode = propSetFocusMode ?? setInternalFocusMode;

  const downloadButtonRef  = useRef<HTMLButtonElement>(null);
  const sectionButtonRef   = useRef<HTMLButtonElement>(null);
  const functionsButtonRef = useRef<HTMLButtonElement>(null);
  const layoutButtonRef    = useRef<HTMLButtonElement>(null);

  const [downloadMenuPos, setDownloadMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [sectionMenuPos, setSectionMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [functionsMenuPos, setFunctionsMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [layoutMenuPos, setLayoutMenuPos] = useState<{ top: number; right: number } | null>(null);

  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const backdropContainerRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

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

  // Sync initial content on document or active subfile change
  useEffect(() => {
    if (!activeDoc) return;
    const targetContent = activeSubFile?.content ?? activeDoc.content ?? '';
    const isMarkdownFile = activeSubFile?.name?.endsWith('.md') || activeSubFile?.name?.endsWith('.txt');
    const n = isMarkdownFile ? targetContent : normalizeToAntsheet(targetContent);
    setCode(n);
    setPreviewContent(n);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDocId, activeDoc?.activeFileId]);

  // Debounced sync code -> preview & store
  useEffect(() => {
    const t = setTimeout(() => {
      if (isAutoCompile) {
        setPreviewContent(code);
      }
      if (activeDoc && activeSubFile && activeSubFile.content !== code) {
        updateSubFileContent(activeDoc.id, activeSubFile.id, code);
      } else if (activeDoc && activeDoc.content !== code) {
        updateDocumentContent(activeDoc.id, code);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [code, activeDoc, activeSubFile, updateSubFileContent, updateDocumentContent, isAutoCompile]);

  // Theme observer
  useEffect(() => {
    const update = () =>
      setThemeMode(
        typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light'
          ? 'light'
          : 'dark'
      );
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  // Close all popovers on outside click
  useEffect(() => {
    const onWindowClick = () => {
      setIsDownloadMenuOpen(false);
      setIsSectionMenuOpen(false);
      setIsFunctionsMenuOpen(false);
    };
    window.addEventListener('click', onWindowClick);
    return () => window.removeEventListener('click', onWindowClick);
  }, []);

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current)
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
  };

  const validation = useMemo(() => {
    try {
      return validateAntsheet(code);
    } catch {
      return { valid: true, errors: [], warnings: [] };
    }
  }, [code]);

  const lineCount = useMemo(() => Math.max(1, code.split('\n').length), [code]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    handleStandardEditorKeyDown(e, code, setCode, handleRecompile);
  };

  const insertSnippet = (snippet: string) => {
    if (!textareaRef.current) return;
    const ta = textareaRef.current;
    const { selectionStart: s, selectionEnd: en } = ta;
    setCode(ta.value.substring(0, s) + snippet + ta.value.substring(en));
    setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = s + snippet.length; }, 0);
  };

  const handleRecompile = () => {
    setIsCompiling(true);
    try {
      const t = code.trim();
      setPreviewContent(t);
      setRecompileKey((k) => k + 1);
      if (activeDoc && activeDoc.content !== t) updateDocumentContent(activeDoc.id, t);
    } finally {
      setTimeout(() => setIsCompiling(false), 350);
    }
  };

  const toggleDownloadMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSectionMenuOpen(false);
    setIsFunctionsMenuOpen(false);
    if (isDownloadMenuOpen) {
      setIsDownloadMenuOpen(false);
    } else if (downloadButtonRef.current) {
      const rect = downloadButtonRef.current.getBoundingClientRect();
      setDownloadMenuPos({ top: rect.bottom + 4, left: rect.left });
      setIsDownloadMenuOpen(true);
    }
  };

  const toggleSectionMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloadMenuOpen(false);
    setIsFunctionsMenuOpen(false);
    if (isSectionMenuOpen) {
      setIsSectionMenuOpen(false);
    } else if (sectionButtonRef.current) {
      const rect = sectionButtonRef.current.getBoundingClientRect();
      setSectionMenuPos({ top: rect.bottom + 4, left: rect.left });
      setIsSectionMenuOpen(true);
    }
  };

  const toggleFunctionsMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloadMenuOpen(false);
    setIsSectionMenuOpen(false);
    if (isFunctionsMenuOpen) {
      setIsFunctionsMenuOpen(false);
    } else if (functionsButtonRef.current) {
      const rect = functionsButtonRef.current.getBoundingClientRect();
      setFunctionsMenuPos({ top: rect.bottom + 4, left: rect.left });
      setIsFunctionsMenuOpen(true);
    }
  };

  const handleFormatCode = () => {
    try {
      const f = serializeWorkbook(parseWorkbook(code));
      setCode(f);
      setPreviewContent(f);
    } catch (err) {
      console.warn('Formatting failed:', err);
    }
  };

  const handleEvaluateFormulas = () => {
    try {
      const f = serializeWorkbook(evaluateWorkbook(parseWorkbook(code)));
      setCode(f);
      setPreviewContent(f);
    } catch (err) {
      console.warn('Formula evaluation failed:', err);
    }
  };

  const download = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: name });
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportXLSX = () => {
    try {
      download(
        new Blob([exportToXLSX(parseAntsheet(code)) as any], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        `${activeDoc?.title || 'spreadsheet'}.xlsx`
      );
    } catch (err) {
      alert((language === 'id' ? 'Gagal ekspor Excel: ' : 'Failed to export Excel: ') + String(err));
    }
  };

  const handleExportCSV = () => {
    try {
      download(
        new Blob([exportToCSV(parseAntsheet(code))], { type: 'text/csv;charset=utf-8;' }),
        `${activeDoc?.title || 'spreadsheet'}.csv`
      );
    } catch (err) {
      alert((language === 'id' ? 'Gagal ekspor CSV: ' : 'Failed to export CSV: ') + String(err));
    }
  };

  const handleExportAntSheetFile = () => {
    download(
      new Blob([code], { type: 'text/plain;charset=utf-8;' }),
      `${activeDoc?.title || 'spreadsheet'}.antsheet`
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Ctrl+Shift+M → toggle focus mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setIsFocusMode((f) => !f);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const toggleLayoutMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloadMenuOpen(false);
    setIsSectionMenuOpen(false);
    setIsFunctionsMenuOpen(false);
    if (isLayoutMenuOpen) {
      setIsLayoutMenuOpen(false);
    } else if (layoutButtonRef.current) {
      const rect = layoutButtonRef.current.getBoundingClientRect();
      setLayoutMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
      setIsLayoutMenuOpen(true);
    }
  };

  const activeFileName = activeSubFile?.name || (activeDoc?.title ? `${activeDoc.title}.antsheet` : 'sheet1.antsheet');

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-primary)',
        overflow: 'hidden',
        userSelect: isResizing ? 'none' : 'auto',
      }}
    >
      {/* ── Left Pane: Code Editor ────────────────────────────────────────── */}
      {!isFocusMode
        ? (viewMode === 'split' || viewMode === 'code') && (
        <div
          style={{
            flex: viewMode === 'code' ? 1 : `${splitRatio} 1 0%`,
            minWidth: viewMode === 'split' ? '240px' : 0,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-main)',
            overflow: 'hidden',
          }}
        >
          {/* 1. Overleaf-Style File Tabs Bar (34px) - DRY Shared Component */}
          <DocFileTabsBar
            activeDoc={activeDoc}
            activeFileId={activeSubFile?.id}
            onSelectFile={setActiveFileId}
            formatIcon="sheet"
          />

          {/* 2. Overleaf-Style Full-Icon Editor Toolbar (34px, No Text) */}
          <div
            style={{
              height: '34px',
              padding: '0 6px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              gap: '1px',
              overflowX: 'auto',
              flexShrink: 0,
              flexWrap: 'nowrap',
              scrollbarWidth: 'none',
            }}
            className="hide-scrollbar"
          >
            {/* Undo / Redo */}
            <button
              type="button"
              onClick={() => { textareaRef.current?.focus(); document.execCommand('undo'); }}
              style={toolbarBtnStyle}
              title="Undo (Ctrl+Z)"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M3 13C5.5 6.5 12 5 17 8s6 9 2 13"/></svg>
            </button>
            <button
              type="button"
              onClick={() => { textareaRef.current?.focus(); document.execCommand('redo'); }}
              style={toolbarBtnStyle}
              title="Redo (Ctrl+Y)"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M21 13C18.5 6.5 12 5 7 8S1 17 5 21"/></svg>
            </button>

            <div style={separatorStyle} />

            {/* TT Section / Header Popover */}
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <button
                ref={sectionButtonRef}
                type="button"
                onClick={toggleSectionMenu}
                style={{
                  ...toolbarBtnStyle,
                  padding: '1px 4px',
                  gap: '2px',
                  backgroundColor: isSectionMenuOpen ? 'var(--bg-subtle)' : 'transparent',
                  borderColor: isSectionMenuOpen ? 'var(--border-subtle)' : 'transparent',
                }}
                title={language === 'id' ? 'Gaya Blok / Bagian AntSheet' : 'AntSheet Block / Section Styles'}
              >
                <span style={{ fontFamily: 'serif', fontWeight: 800, fontSize: '12px', lineHeight: 1, letterSpacing: '-0.5px' }}>
                  T<span style={{ fontSize: '9.5px' }}>T</span>
                </span>
                <ChevronDown size={10} style={{ opacity: 0.7, transform: isSectionMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
              </button>

              {/* Section Popover */}
              {isSectionMenuOpen && sectionMenuPos && typeof document !== 'undefined' && createPortal(
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="animate-fade-in"
                  style={{
                    position: 'fixed',
                    top: `${sectionMenuPos.top}px`,
                    left: `${sectionMenuPos.left}px`,
                    zIndex: 999999999,
                    minWidth: '200px',
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
                    {language === 'id' ? 'Blok / Bagian AntSheet' : 'AntSheet Block / Section'}
                  </div>
                  <button
                    type="button"
                    onClick={() => { insertSnippet('\n# Sheet 1: Financials\n'); setIsSectionMenuOpen(false); }}
                    className="clickable-pill"
                    style={popoverItemStyle}
                  >
                    <span style={{ fontWeight: 700, fontSize: '14px', width: '20px' }}>#</span>
                    <span>{language === 'id' ? 'Judul Sheet (# Sheet)' : 'Sheet Title (# Sheet)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { insertSnippet('\n## Cells\nA1 = "Item"\n'); setIsSectionMenuOpen(false); }}
                    className="clickable-pill"
                    style={popoverItemStyle}
                  >
                    <span style={{ fontWeight: 700, fontSize: '13px', width: '20px', color: '#60a5fa' }}>##</span>
                    <span>{language === 'id' ? 'Data Sel (## Cells)' : 'Cell Data (## Cells)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { insertSnippet('\n## Meta\ncolumnWidth: A=180, B=130\nfreezeRow: 1\n'); setIsSectionMenuOpen(false); }}
                    className="clickable-pill"
                    style={popoverItemStyle}
                  >
                    <span style={{ fontWeight: 700, fontSize: '13px', width: '20px', color: '#f59e0b' }}>##</span>
                    <span>{language === 'id' ? 'Pengaturan Grid (## Meta)' : 'Grid Settings (## Meta)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { insertSnippet('\n## Charts\nchart1 = bar | title: "Revenue", x: A, series: [B], position: E2:K12\n'); setIsSectionMenuOpen(false); }}
                    className="clickable-pill"
                    style={popoverItemStyle}
                  >
                    <span style={{ fontWeight: 700, fontSize: '13px', width: '20px', color: '#a78bfa' }}>##</span>
                    <span>{language === 'id' ? 'Grafik (## Charts)' : 'Charts (## Charts)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { insertSnippet('\n## DataValidation\nrule1 = list | range: D2:D50, options: ["Pending", "Done"]\n'); setIsSectionMenuOpen(false); }}
                    className="clickable-pill"
                    style={popoverItemStyle}
                  >
                    <span style={{ fontWeight: 700, fontSize: '13px', width: '20px', color: '#10b981' }}>##</span>
                    <span>{language === 'id' ? 'Validasi (## DataValidation)' : 'Validation (## DataValidation)'}</span>
                  </button>
                </div>,
                document.body
              )}
            </div>

            {/* Typography Modifiers: Bold, Italic, Strikethrough, Underline, Code */}
            <button
              type="button"
              onClick={() => insertSnippet(' | fontWeight: bold')}
              style={{ ...toolbarBtnStyle, fontWeight: 700 }}
              title={language === 'id' ? 'Tebal (fontWeight: bold)' : 'Bold (fontWeight: bold)'}
            >
              B
            </button>
            <button
              type="button"
              onClick={() => insertSnippet(' | fontStyle: italic')}
              style={{ ...toolbarBtnStyle, fontStyle: 'italic', fontFamily: 'serif' }}
              title={language === 'id' ? 'Miring (fontStyle: italic)' : 'Italic (fontStyle: italic)'}
            >
              I
            </button>
            <button
              type="button"
              onClick={() => insertSnippet(' | textDecoration: line-through')}
              style={{ ...toolbarBtnStyle, textDecoration: 'line-through' }}
              title={language === 'id' ? 'Coret (textDecoration: line-through)' : 'Strikethrough (textDecoration: line-through)'}
            >
              S
            </button>
            <button
              type="button"
              onClick={() => insertSnippet(' | textDecoration: underline')}
              style={{ ...toolbarBtnStyle, textDecoration: 'underline' }}
              title={language === 'id' ? 'Garis Bawah (textDecoration: underline)' : 'Underline (textDecoration: underline)'}
            >
              U
            </button>
            <button
              type="button"
              onClick={() => insertSnippet(' | fontFamily: monospace')}
              style={toolbarBtnStyle}
              title={language === 'id' ? 'Font Kode / Monospace' : 'Code / Monospace Font'}
            >
              <Code2 size={12} />
            </button>

            <div style={separatorStyle} />

            {/* Formula $x$, Evaluate Σ, Functions Dropdown Ω */}
            <button
              type="button"
              onClick={() => insertSnippet('="=SUM(B2:B5)" | fontWeight: bold')}
              style={{ ...toolbarBtnStyle, fontWeight: 700, color: '#f59e0b', fontSize: '10.5px' }}
              title={language === 'id' ? 'Sisipkan Rumus Formula (=SUM, dll)' : 'Insert Formula (=SUM, etc.)'}
            >
              $x$
            </button>
            <button
              type="button"
              onClick={handleEvaluateFormulas}
              style={{ ...toolbarBtnStyle, color: '#38bdf8' }}
              title={language === 'id' ? 'Hitung / Evaluasi Formula In-Place (Σ)' : 'Evaluate Formulas In-Place (Σ)'}
            >
              <Sigma size={12} />
            </button>

            {/* Functions Dropdown Ω */}
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <button
                ref={functionsButtonRef}
                type="button"
                onClick={toggleFunctionsMenu}
                style={{
                  ...toolbarBtnStyle,
                  padding: '1px 3px',
                  gap: '2px',
                  color: '#8b5cf6',
                  backgroundColor: isFunctionsMenuOpen ? 'var(--bg-subtle)' : 'transparent',
                  borderColor: isFunctionsMenuOpen ? 'var(--border-subtle)' : 'transparent',
                }}
                title={language === 'id' ? 'Daftar Fungsi Formula (Ω)' : 'Formula Functions (Ω)'}
              >
                <span style={{ fontSize: '11.5px', fontWeight: 700 }}>Ω</span>
                <ChevronDown size={10} style={{ opacity: 0.7, transform: isFunctionsMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
              </button>

              {/* Functions Popover */}
              {isFunctionsMenuOpen && functionsMenuPos && typeof document !== 'undefined' && createPortal(
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="animate-fade-in"
                  style={{
                    position: 'fixed',
                    top: `${functionsMenuPos.top}px`,
                    left: `${functionsMenuPos.left}px`,
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
                    {language === 'id' ? 'Fungsi Formula Spreadsheet' : 'Spreadsheet Formula Functions'}
                  </div>
                  {[
                    { label: '=SUM(range)', desc: language === 'id' ? 'Penjumlahan total' : 'Sum of numbers', code: '="=SUM(A1:A10)"' },
                    { label: '=AVERAGE(range)', desc: language === 'id' ? 'Rata-rata nilai' : 'Average value', code: '="=AVERAGE(A1:A10)"' },
                    { label: '=IF(cond, then, else)', desc: language === 'id' ? 'Kondisi logika' : 'Logical condition', code: '="=IF(A1>100, \\"High\\", \\"Low\\")"' },
                    { label: '=COUNT(range)', desc: language === 'id' ? 'Hitung jumlah sel berisi angka' : 'Count numeric cells', code: '="=COUNT(A1:A10)"' },
                    { label: '=MAX(range) / MIN(range)', desc: language === 'id' ? 'Nilai tertinggi / terendah' : 'Maximum / minimum value', code: '="=MAX(A1:A10)"' },
                    { label: '=CONCAT(a, b)', desc: language === 'id' ? 'Gabungkan teks string' : 'Concatenate text', code: '="=CONCAT(A1, \\" - \\", B1)"' },
                    { label: '=VLOOKUP(val, range, col, false)', desc: language === 'id' ? 'Cari data dalam tabel' : 'Lookup value in table', code: '="=VLOOKUP(A1, B1:D20, 2, FALSE)"' },
                  ].map((fn) => (
                    <button
                      key={fn.label}
                      type="button"
                      onClick={() => { insertSnippet(fn.code); setIsFunctionsMenuOpen(false); }}
                      className="clickable-pill"
                      style={popoverItemStyle}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '11.5px', color: 'var(--brand-primary)' }}>{fn.label}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{fn.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>,
                document.body
              )}
            </div>

            <div style={separatorStyle} />

            {/* Hyperlink, Tag coordinate, DataValidation dropdown, Color rule, Grid Table, Chart */}
            <button
              type="button"
              onClick={() => insertSnippet(' | link: "https://example.com"')}
              style={toolbarBtnStyle}
              title={language === 'id' ? 'Sisipkan Link Tautan (link: ...)' : 'Insert Link (link: ...)'}
            >
              <Link size={12} />
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('\nA1 = "Item"')}
              style={toolbarBtnStyle}
              title={language === 'id' ? 'Sisipkan Sel Koordinat (A1 = ...)' : 'Insert Cell Coordinate (A1 = ...)'}
            >
              <Tag size={12} />
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('\n## DataValidation\nrule1 = list | range: D2:D50, options: ["Pending", "In Progress", "Done"]\n')}
              style={{ ...toolbarBtnStyle, color: '#f59e0b' }}
              title={language === 'id' ? 'Validasi Daftar Dropdown' : 'Dropdown List Validation'}
            >
              <Filter size={12} />
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('\n## ConditionalFormatting\ncf1 = highlight | range: C2:C20, operator: ">=", value: 90, backgroundColor: #dcfce7, color: #15803d\n')}
              style={{ ...toolbarBtnStyle, color: '#10b981' }}
              title={language === 'id' ? 'Aturan Warna Bersyarat (Conditional Formatting)' : 'Conditional Formatting Rules'}
            >
              <Sparkles size={12} />
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('\nA1 = "Header 1"\nB1 = "Header 2"\nA2 = "Data 1"\nB2 = 100\n')}
              style={{ ...toolbarBtnStyle, color: '#10b981' }}
              title={language === 'id' ? 'Sisipkan Contoh Tabel 2x2' : 'Insert 2x2 Sample Table'}
            >
              <Grid size={12} />
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('\n## Charts\nchart1 = bar | title: "Revenue", x: A, series: [B], position: E2:K12\n')}
              style={{ ...toolbarBtnStyle, color: '#a78bfa' }}
              title={language === 'id' ? 'Sisipkan Grafik Bar / Kolom' : 'Insert Bar / Column Chart'}
            >
              <BarChart3 size={12} />
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('\n## Charts\nchart1 = pie | title: "Distribution", x: A, series: [B], position: E2:K12\n')}
              style={{ ...toolbarBtnStyle, color: '#0073ea' }}
              title={language === 'id' ? 'Sisipkan Grafik Pie / Donat (~)' : 'Insert Pie / Donut Chart (~)'}
            >
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#0073ea' }}>~</span>
            </button>

            <div style={separatorStyle} />

            {/* + Sheet Multi-sheet & Auto-Format */}
            <button
              type="button"
              onClick={() => insertSnippet('\n---\n\n# Sheet 2: Summary\n\n## Cells\nA1 = "=Sheet1!A1"\n')}
              style={{ ...toolbarBtnStyle, color: '#ec4899' }}
              title={language === 'id' ? 'Tambah Sheet Baru (Multi-Sheet)' : 'Add New Sheet (Multi-Sheet)'}
            >
              <Layers size={12} />
            </button>
            <button
              type="button"
              onClick={handleFormatCode}
              style={{ ...toolbarBtnStyle, color: '#a78bfa' }}
              title={language === 'id' ? 'Rapikan & Auto-Format Kode AntSheet' : 'Format AntSheet Code'}
            >
              <Wand2 size={12} />
            </button>

            <div style={separatorStyle} />

            {/* Comment Trigger */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => triggerAddCommentFromSelection(textareaRef.current, code)}
              style={{ ...toolbarBtnStyle, flexShrink: 0 }}
              title={language === 'id' ? 'Tambah Komentar Review (Ctrl+Shift+C)' : 'Add Review Comment (Ctrl+Shift+C)'}
            >
              <MessageSquarePlus size={12} />
            </button>
          </div>

          {/* 3. Code Editor Textarea Area */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
            {/* Line Gutter */}
            <div
              ref={lineNumbersRef}
              style={{
                width: '42px',
                backgroundColor: 'var(--bg-surface)',
                borderRight: '1px solid var(--border-subtle)',
                paddingTop: '16px',
                paddingBottom: '16px',
                paddingRight: '8px',
                paddingLeft: '0px',
                textAlign: 'right',
                color: 'var(--text-muted)',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontSize: '12.5px',
                lineHeight: '21px',
                userSelect: 'none',
                overflow: 'hidden',
                flexShrink: 0,
                boxSizing: 'border-box',
              }}
            >
              {Array.from({ length: lineCount }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: '21px',
                    lineHeight: '21px',
                    fontSize: '12.5px',
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Textarea with Comment Backdrop */}
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
                fontStyle={{
                  fontSize: '12.5px',
                  lineHeight: '21px',
                  paddingTop: '16px',
                  paddingBottom: '16px',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                }}
              />
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
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
                  handleKeyDown(e);
                }}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                placeholder={`# Sheet Name\n\n## Cells\nA1 = "Hello AntSheet"`}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  paddingTop: '16px',
                  paddingBottom: '16px',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  margin: 0,
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  caretColor: 'var(--brand-primary)',
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontSize: '12.5px',
                  lineHeight: '21px',
                  tabSize: 2,
                  whiteSpace: 'pre',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box',
                  overflowX: 'auto',
                  overflowY: 'auto',
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* Focus Mode: full-screen editor overlay */}
      <FocusModeOverlay
        isOpen={isFocusMode}
        onClose={() => setIsFocusMode(false)}
        activeFileName={activeFileName}
        value={code}
        onChange={(val) => setCode(val)}
        onKeyDown={handleKeyDown}
      />

      {/* ── Resize Handle Divider ─────────────────────────────────────────── */}
      {!isFocusMode && viewMode === 'split' && (
        <SplitResizeDivider
          isResizing={isResizing}
          onMouseDown={startResize}
        />
      )}

      {/* ── Right Pane: Live Preview & Compilation ────────────────────────── */}
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
          {/* Overleaf-Style Compilation & Action Bar (36px) */}
          <div
            style={{
              height: '36px',
              backgroundColor: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 8px',
              flexShrink: 0,
              fontSize: '12px',
              userSelect: 'none',
              overflowX: 'auto',
              overflowY: 'hidden',
              whiteSpace: 'nowrap',
              gap: '8px',
            }}
            className="hide-scrollbar"
          >
            {/* Left: Recompile Split Button + Logs + Download Options Menu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              {/* Recompile Split Button - DRY Shared Component */}
              <RecompileSplitButton
                isCompiling={isCompiling}
                isAutoCompile={isAutoCompile}
                onRecompile={handleRecompile}
                onToggleAutoCompile={setIsAutoCompile}
                onResetRecompile={handleRecompile}
                title={language === 'id' ? 'Kompilasi Ulang Spreadsheet (Ctrl+Enter)' : 'Recompile Spreadsheet (Ctrl+Enter)'}
              />

              {/* Logs / Issues Icon Button (Matches Overleaf Diagnostics in Docs Editor) */}
              <button
                type="button"
                onClick={() => setIsLogDrawerOpen(!isLogDrawerOpen)}
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '5px',
                  backgroundColor: isLogDrawerOpen ? 'var(--bg-subtle)' : 'transparent',
                  border: isLogDrawerOpen ? '1px solid var(--border-subtle)' : '1px solid transparent',
                  color: !validation.valid ? '#EF4444' : validation.warnings?.length ? '#F59E0B' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                className="hover-subtle"
                title={
                  validation.valid
                    ? (language === 'id' ? 'Logs & Kompilasi Status (Lihat log)' : 'Logs & Compilation Status (View log)')
                    : (language === 'id' ? `${validation.errors.length} Masalah ditemukan` : `${validation.errors.length} Issue(s) found`)
                }
              >
                <FileText size={14} />
                {!validation.valid ? (
                  <span
                    style={{
                      position: 'absolute',
                      top: '3px',
                      right: '3px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-danger, #EF4444)',
                    }}
                  />
                ) : validation.warnings?.length ? (
                  <span
                    style={{
                      position: 'absolute',
                      top: '3px',
                      right: '3px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-warning, #F59E0B)',
                    }}
                  />
                ) : null}
              </button>

              {/* Download / Export Options Button & Popover */}
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <button
                  ref={downloadButtonRef}
                  type="button"
                  onClick={toggleDownloadMenu}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '5px',
                    backgroundColor: isDownloadMenuOpen ? 'var(--bg-subtle)' : 'transparent',
                    border: isDownloadMenuOpen ? '1px solid var(--border-subtle)' : '1px solid transparent',
                    color: isDownloadMenuOpen ? 'var(--brand-primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  className="hover-subtle"
                  title={language === 'id' ? 'Unduh / Ekspor Spreadsheet (Opsi Download)' : 'Download / Export Spreadsheet (Download Options)'}
                >
                  <Download size={14} />
                </button>

                {/* Download Options Popover */}
                {isDownloadMenuOpen && downloadMenuPos && typeof document !== 'undefined' && createPortal(
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="animate-fade-in"
                    style={{
                      position: 'fixed',
                      top: `${downloadMenuPos.top}px`,
                      left: `${downloadMenuPos.left}px`,
                      width: '210px',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-strong)',
                      boxShadow: 'var(--shadow-xl, 0 12px 30px rgba(0,0,0,0.25))',
                      padding: '4px',
                      zIndex: 999999999,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    <div style={{ padding: '4px 8px 3px', fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {language === 'id' ? 'Opsi Unduhan' : 'Download Options'}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeDoc) downloadDocAsZip(activeDoc);
                        setIsDownloadMenuOpen(false);
                      }}
                      className="clickable-pill"
                      style={popoverItemStyle}
                    >
                      <Download size={13} color="#3b82f6" />
                      <span>{language === 'id' ? 'Unduh ZIP AntSheet (.zip)' : 'Download AntSheet ZIP (.zip)'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleExportXLSX();
                        setIsDownloadMenuOpen(false);
                      }}
                      className="clickable-pill"
                      style={popoverItemStyle}
                    >
                      <FileSpreadsheet size={13} color="#10b981" />
                      <span>{language === 'id' ? 'File Excel (.xlsx)' : 'Excel File (.xlsx)'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleExportCSV();
                        setIsDownloadMenuOpen(false);
                      }}
                      className="clickable-pill"
                      style={popoverItemStyle}
                    >
                      <FileText size={13} color="#0073ea" />
                      <span>{language === 'id' ? 'File CSV (.csv)' : 'CSV File (.csv)'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleExportAntSheetFile();
                        setIsDownloadMenuOpen(false);
                      }}
                      className="clickable-pill"
                      style={popoverItemStyle}
                    >
                      <Code2 size={13} color="#8b5cf6" />
                      <span>{language === 'id' ? 'File AntSheet (.antsheet)' : 'AntSheet File (.antsheet)'}</span>
                    </button>
                    <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '3px 0' }} />
                    <button
                      type="button"
                      onClick={() => {
                        handleCopy();
                        setIsDownloadMenuOpen(false);
                      }}
                      className="clickable-pill"
                      style={popoverItemStyle}
                    >
                      {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} color="#f59e0b" />}
                      <span>{copied ? (language === 'id' ? 'Tersalin ke Clipboard' : 'Copied to Clipboard') : (language === 'id' ? 'Salin Kode AntSheet' : 'Copy AntSheet Code')}</span>
                    </button>
                  </div>,
                  document.body
                )}
              </div>
            </div>

        </div>


          {/* Collapsible Overleaf-Style Logs / Diagnostics Drawer */}
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
                const lines = code.split('\n');
                const sheetsCount = (code.match(/^#\s+\S/gm) || []).length || 1;
                const cellsCount = (code.match(/^[A-Z]+\d+\s*=/gm) || []).length;
                // Match antsheet formula syntax: cell = "=SUM(...)" or cell = "=formula" or comment: "formula: =..."
                const formulasCount = (code.match(/=\s*"=[^"]+"|formula:\s*"=[^"]+"/g) || []).length;
                const chartsCount = (code.match(/## Charts/g) || []).length ? (code.match(/^chart\d+\s*=/gm) || []).length : 0;

                // Detect cells with formula errors (#VALUE!, #REF!, #DIV/0!, #NAME?, #N/A, #NUM!)
                const errorCells: Array<{ ref: string; error: string; line: number }> = [];
                const ERROR_PATTERN = /(#VALUE!|#REF!|#DIV\/0!|#NAME\?|#N\/A|#NUM!)/;
                lines.forEach((l, idx) => {
                  const trimmed = l.trim();
                  const cellMatch = trimmed.match(/^([A-Z]+\d+)\s*=\s*"([^"]*)"/i);
                  if (cellMatch) {
                    const errMatch = cellMatch[2].match(ERROR_PATTERN);
                    if (errMatch) {
                      errorCells.push({ ref: cellMatch[1], error: errMatch[1], line: idx + 1 });
                    }
                  }
                });

                const logItems: Array<{
                  id: string;
                  type: 'error' | 'warning' | 'info';
                  line: number;
                  message: string;
                  suggestion?: string;
                }> = [];

                // 1. Errors from validation
                if (!validation.valid && validation.errors?.length) {
                  validation.errors.forEach((err, idx) => {
                    const matchLine = typeof err === 'string' ? err.match(/line\s*(\d+)|baris\s*(\d+)/i) : null;
                    const line = matchLine ? parseInt(matchLine[1] || matchLine[2], 10) : 1;
                    logItems.push({
                      id: `err_${idx}`,
                      type: 'error',
                      line,
                      message: typeof err === 'string' ? err : (language === 'id' ? 'Format sintaks tidak valid' : 'Invalid syntax format'),
                      suggestion: language === 'id' ? 'Periksa kembali tanda kutip atau pemisah pipa (|) pada sel.' : 'Check quotation marks or pipe (|) delimiters on the cell.',
                    });
                  });
                }

                // 2. Warnings from validation
                if (validation.warnings?.length) {
                  validation.warnings.forEach((warn, idx) => {
                    const matchLine = typeof warn === 'string' ? warn.match(/line\s*(\d+)|baris\s*(\d+)/i) : null;
                    const line = matchLine ? parseInt(matchLine[1] || matchLine[2], 10) : 1;
                    logItems.push({
                      id: `warn_${idx}`,
                      type: 'warning',
                      line,
                      message: typeof warn === 'string' ? warn : (language === 'id' ? 'Peringatan pada data sel' : 'Warning in cell data'),
                    });
                  });
                }

                // 3. Formula error cells as warnings
                errorCells.forEach((ec, idx) => {
                  logItems.push({
                    id: `formula_err_${idx}`,
                    type: 'warning',
                    line: ec.line,
                    message: language === 'id' ? `Sel ${ec.ref} menghasilkan error formula: ${ec.error}` : `Cell ${ec.ref} returned formula error: ${ec.error}`,
                    suggestion:
                      ec.error === '#VALUE!'
                        ? (language === 'id' ? 'Pastikan semua sel yang direferensi berisi angka, bukan teks.' : 'Ensure all referenced cells contain numbers, not text.')
                        : ec.error === '#DIV/0!'
                        ? (language === 'id' ? 'Pembagian dengan nol — pastikan sel pembagi tidak kosong atau bernilai 0.' : 'Division by zero — ensure divisor cell is not empty or 0.')
                        : ec.error === '#REF!'
                        ? (language === 'id' ? 'Referensi sel tidak ditemukan atau di luar jangkauan sheet.' : 'Cell reference not found or out of sheet bounds.')
                        : (language === 'id' ? 'Periksa kembali referensi sel dan tipe datanya.' : 'Check cell reference and data type.'),
                  });
                });

                // 4. Info compilation summary
                if (validation.valid) {
                  logItems.push({
                    id: 'info_success',
                    type: 'info',
                    line: 1,
                    message: language === 'id'
                      ? `Kompilasi sukses. Terdeteksi ${sheetsCount} sheet, ${cellsCount} sel data, ${formulasCount} formula, dan ${lines.length} baris kode.${
                          errorCells.length > 0 ? ` ⚠ ${errorCells.length} sel mengandung error formula.` : ''
                        }`
                      : `Compilation successful. Detected ${sheetsCount} sheet(s), ${cellsCount} data cells, ${formulasCount} formulas, and ${lines.length} lines of code.${
                          errorCells.length > 0 ? ` ⚠ ${errorCells.length} cells contain formula errors.` : ''
                        }`,
                    suggestion: chartsCount > 0 ? (language === 'id' ? `Termasuk ${chartsCount} visualisasi grafik aktif.` : `Includes ${chartsCount} active chart visualizations.`) : undefined,
                  });
                }

                const jumpToLine = (lineNum: number) => {
                  if (!textareaRef.current) return;
                  const ta = textareaRef.current;
                  const allLines = ta.value.split('\n');
                  let charCount = 0;
                  const targetLine = Math.max(0, Math.min(lineNum - 1, allLines.length - 1));
                  for (let i = 0; i < targetLine; i++) {
                    charCount += allLines[i].length + 1;
                  }
                  ta.focus();
                  ta.setSelectionRange(charCount, charCount + (allLines[targetLine]?.length || 0));
                  const lineHeight = 20;
                  ta.scrollTop = Math.max(0, targetLine * lineHeight - 60);
                };

                return logItems.map((d) => (
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
                        d.type === 'error' ? 'var(--accent-danger, #EF4444)' : d.type === 'warning' ? 'var(--accent-warning, #F59E0B)' : 'var(--brand-primary)'
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
                            color: d.type === 'error' ? 'var(--accent-danger, #EF4444)' : d.type === 'warning' ? 'var(--accent-warning, #F59E0B)' : 'var(--brand-primary)',
                          }}
                        >
                          {d.type}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {language === 'id' ? `Baris ${d.line}` : `Line ${d.line}`} ({activeFileName})
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

                    {/* Quick Action: Jump to Line */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => jumpToLine(d.line)}
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
                        {language === 'id' ? 'Lompat ke Baris' : 'Jump to Line'}
                      </button>
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}

          {/* Univer Sheet Rendering Container */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <UniverSheetsCore
              key={`${activeDocId ?? 'sheet'}-${themeMode}-${recompileKey}`}
              initialContent={previewContent}
              readOnly={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}