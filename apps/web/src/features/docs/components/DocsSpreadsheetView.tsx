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
} from 'lucide-react';
import { useDocsStore } from '../store/useDocsStore';
import { SplashScreen } from '../../../shared/components/SplashScreen';
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

const UniverSheetsCore = dynamic(() => import('./UniverSheetsCore'), {
  ssr: false,
  loading: () => (
    <SplashScreen title="Anticeil Sheets" subtitle="Memuat Grid & Spreadsheet Engine..." />
  ),
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
  const setActiveFileId       = useDocsStore((s) => s.setActiveFileId);

  const activeDoc = documents.find((d) => d.id === activeDocId);
  const docFiles = activeDoc?.files || [];
  const activeSubFile = docFiles.find((f) => f.id === activeDoc?.activeFileId) || docFiles[0];

  const [code,           setCode]           = useState(() => normalizeToAntsheet(activeDoc?.content));
  const [copied,         setCopied]         = useState(false);
  const [internalViewMode, setInternalViewMode] = useState<'split' | 'code' | 'preview'>('split');
  const viewMode = propViewMode ?? internalViewMode;
  const setViewMode = propSetViewMode ?? setInternalViewMode;

  const [splitRatio,     setSplitRatio]     = useState(0.48);
  const [isResizing,     setIsResizing]     = useState(false);
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
  const [isRecompileDropdownOpen, setIsRecompileDropdownOpen] = useState(false);
  const [isAutoCompile, setIsAutoCompile] = useState(true);
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [isSectionMenuOpen, setIsSectionMenuOpen] = useState(false);
  const [isFunctionsMenuOpen, setIsFunctionsMenuOpen] = useState(false);
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);
  const [internalFocusMode, setInternalFocusMode] = useState(false);
  const isFocusMode = propFocusMode ?? internalFocusMode;
  const setIsFocusMode = propSetFocusMode ?? setInternalFocusMode;

  const recompileButtonRef = useRef<HTMLButtonElement>(null);
  const downloadButtonRef  = useRef<HTMLButtonElement>(null);
  const sectionButtonRef   = useRef<HTMLButtonElement>(null);
  const functionsButtonRef = useRef<HTMLButtonElement>(null);
  const layoutButtonRef    = useRef<HTMLButtonElement>(null);

  const [recompileDropdownPos, setRecompileDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const [downloadMenuPos, setDownloadMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [sectionMenuPos, setSectionMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [functionsMenuPos, setFunctionsMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [layoutMenuPos, setLayoutMenuPos] = useState<{ top: number; right: number } | null>(null);

  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const containerRef   = useRef<HTMLDivElement>(null);

  // Sync initial content on document change
  useEffect(() => {
    if (!activeDoc) return;
    const n = normalizeToAntsheet(activeDoc.content);
    setCode(n);
    setPreviewContent(n);
    if (activeDoc.content !== n) updateDocumentContent(activeDoc.id, n);
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
    }, 200);
    return () => clearTimeout(t);
  }, [code, activeDoc, updateDocumentContent, isAutoCompile]);

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
      setIsRecompileDropdownOpen(false);
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
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const { selectionStart: s, selectionEnd: en } = ta;
      setCode(ta.value.substring(0, s) + '  ' + ta.value.substring(en));
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = s + 2; }, 0);
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRecompile();
    }
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

  const toggleRecompileDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloadMenuOpen(false);
    setIsSectionMenuOpen(false);
    setIsFunctionsMenuOpen(false);
    if (isRecompileDropdownOpen) {
      setIsRecompileDropdownOpen(false);
    } else if (recompileButtonRef.current) {
      const rect = recompileButtonRef.current.getBoundingClientRect();
      setRecompileDropdownPos({ top: rect.bottom + 4, left: rect.left });
      setIsRecompileDropdownOpen(true);
    }
  };

  const toggleDownloadMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRecompileDropdownOpen(false);
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
    setIsRecompileDropdownOpen(false);
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
    setIsRecompileDropdownOpen(false);
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
      alert('Gagal export Excel: ' + String(err));
    }
  };

  const handleExportCSV = () => {
    try {
      download(
        new Blob([exportToCSV(parseAntsheet(code))], { type: 'text/csv;charset=utf-8;' }),
        `${activeDoc?.title || 'spreadsheet'}.csv`
      );
    } catch (err) {
      alert('Gagal export CSV: ' + String(err));
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

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      const ratio = (e.clientX - r.left) / r.width;
      if (ratio >= 0.2 && ratio <= 0.8) setSplitRatio(ratio);
    };
    const onUp = () => setIsResizing(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isResizing]);

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
    setIsRecompileDropdownOpen(false);
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
          {/* 1. Overleaf-Style File Tabs Bar (34px) */}
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
                    <TableIcon size={11} color={isActive ? 'var(--brand-primary)' : 'var(--text-muted)'} />
                    <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                        title="Main Sheet"
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
                <TableIcon size={11} color="var(--brand-primary)" />
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
                  title="Main Sheet"
                />
              </div>
            )}
          </div>

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
                title="Gaya Blok / Section AntSheet"
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
                    Blok / Bagian AntSheet
                  </div>
                  <button
                    type="button"
                    onClick={() => { insertSnippet('\n# Sheet 1: Financials\n'); setIsSectionMenuOpen(false); }}
                    className="clickable-pill"
                    style={popoverItemStyle}
                  >
                    <span style={{ fontWeight: 700, fontSize: '14px', width: '20px' }}>#</span>
                    <span>Judul Sheet (# Sheet)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { insertSnippet('\n## Cells\nA1 = "Item"\n'); setIsSectionMenuOpen(false); }}
                    className="clickable-pill"
                    style={popoverItemStyle}
                  >
                    <span style={{ fontWeight: 700, fontSize: '13px', width: '20px', color: '#60a5fa' }}>##</span>
                    <span>Data Sel (## Cells)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { insertSnippet('\n## Meta\ncolumnWidth: A=180, B=130\nfreezeRow: 1\n'); setIsSectionMenuOpen(false); }}
                    className="clickable-pill"
                    style={popoverItemStyle}
                  >
                    <span style={{ fontWeight: 700, fontSize: '13px', width: '20px', color: '#f59e0b' }}>##</span>
                    <span>Pengaturan Grid (## Meta)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { insertSnippet('\n## Charts\nchart1 = bar | title: "Revenue", x: A, series: [B], position: E2:K12\n'); setIsSectionMenuOpen(false); }}
                    className="clickable-pill"
                    style={popoverItemStyle}
                  >
                    <span style={{ fontWeight: 700, fontSize: '13px', width: '20px', color: '#a78bfa' }}>##</span>
                    <span>Grafik (## Charts)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { insertSnippet('\n## DataValidation\nrule1 = list | range: D2:D50, options: ["Pending", "Done"]\n'); setIsSectionMenuOpen(false); }}
                    className="clickable-pill"
                    style={popoverItemStyle}
                  >
                    <span style={{ fontWeight: 700, fontSize: '13px', width: '20px', color: '#10b981' }}>##</span>
                    <span>Validasi (## DataValidation)</span>
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
              title="Tebal (fontWeight: bold)"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => insertSnippet(' | fontStyle: italic')}
              style={{ ...toolbarBtnStyle, fontStyle: 'italic', fontFamily: 'serif' }}
              title="Miring (fontStyle: italic)"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => insertSnippet(' | textDecoration: line-through')}
              style={{ ...toolbarBtnStyle, textDecoration: 'line-through' }}
              title="Coret (textDecoration: line-through)"
            >
              S
            </button>
            <button
              type="button"
              onClick={() => insertSnippet(' | textDecoration: underline')}
              style={{ ...toolbarBtnStyle, textDecoration: 'underline' }}
              title="Garis Bawah (textDecoration: underline)"
            >
              U
            </button>
            <button
              type="button"
              onClick={() => insertSnippet(' | fontFamily: monospace')}
              style={toolbarBtnStyle}
              title="Font Kode / Monospace"
            >
              <Code2 size={12} />
            </button>

            <div style={separatorStyle} />

            {/* Formula $x$, Evaluate Σ, Functions Dropdown Ω */}
            <button
              type="button"
              onClick={() => insertSnippet('="=SUM(B2:B5)" | fontWeight: bold')}
              style={{ ...toolbarBtnStyle, fontWeight: 700, color: '#f59e0b', fontSize: '10.5px' }}
              title="Sisipkan Rumus Formula (=SUM, dll)"
            >
              $x$
            </button>
            <button
              type="button"
              onClick={handleEvaluateFormulas}
              style={{ ...toolbarBtnStyle, color: '#38bdf8' }}
              title="Hitung / Evaluasi Formula In-Place (Σ)"
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
                title="Daftar Fungsi Formula (Ω)"
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
                    Fungsi Formula Spreadsheet
                  </div>
                  {[
                    { label: '=SUM(range)', desc: 'Penjumlahan total', code: '="=SUM(A1:A10)"' },
                    { label: '=AVERAGE(range)', desc: 'Rata-rata nilai', code: '="=AVERAGE(A1:A10)"' },
                    { label: '=IF(cond, then, else)', desc: 'Kondisi logika', code: '="=IF(A1>100, \\"High\\", \\"Low\\")"' },
                    { label: '=COUNT(range)', desc: 'Hitung jumlah sel berisi angka', code: '="=COUNT(A1:A10)"' },
                    { label: '=MAX(range) / MIN(range)', desc: 'Nilai tertinggi / terendah', code: '="=MAX(A1:A10)"' },
                    { label: '=CONCAT(a, b)', desc: 'Gabungkan teks string', code: '="=CONCAT(A1, \\" - \\", B1)"' },
                    { label: '=VLOOKUP(val, range, col, false)', desc: 'Cari data dalam tabel', code: '="=VLOOKUP(A1, B1:D20, 2, FALSE)"' },
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
              title="Sisipkan Link Tautan (link: ...)"
            >
              <Link size={12} />
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('\nA1 = "Item"')}
              style={toolbarBtnStyle}
              title="Sisipkan Sel Koordinat (A1 = ...)"
            >
              <Tag size={12} />
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('\n## DataValidation\nrule1 = list | range: D2:D50, options: ["Pending", "In Progress", "Done"]\n')}
              style={{ ...toolbarBtnStyle, color: '#f59e0b' }}
              title="Dropdown List Validation"
            >
              <Filter size={12} />
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('\n## ConditionalFormatting\ncf1 = highlight | range: C2:C20, operator: ">=", value: 90, backgroundColor: #dcfce7, color: #15803d\n')}
              style={{ ...toolbarBtnStyle, color: '#10b981' }}
              title="Aturan Warna Bersyarat (Conditional Formatting)"
            >
              <Sparkles size={12} />
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('\nA1 = "Header 1"\nB1 = "Header 2"\nA2 = "Data 1"\nB2 = 100\n')}
              style={{ ...toolbarBtnStyle, color: '#10b981' }}
              title="Sisipkan Contoh Tabel 2x2"
            >
              <Grid size={12} />
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('\n## Charts\nchart1 = bar | title: "Revenue", x: A, series: [B], position: E2:K12\n')}
              style={{ ...toolbarBtnStyle, color: '#a78bfa' }}
              title="Sisipkan Grafik Bar / Kolom"
            >
              <BarChart3 size={12} />
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('\n## Charts\nchart1 = pie | title: "Distribution", x: A, series: [B], position: E2:K12\n')}
              style={{ ...toolbarBtnStyle, color: '#0073ea' }}
              title="Sisipkan Grafik Pie / Donat (~)"
            >
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#0073ea' }}>~</span>
            </button>

            <div style={separatorStyle} />

            {/* + Sheet Multi-sheet & Auto-Format */}
            <button
              type="button"
              onClick={() => insertSnippet('\n---\n\n# Sheet 2: Summary\n\n## Cells\nA1 = "=Sheet1!A1"\n')}
              style={{ ...toolbarBtnStyle, color: '#ec4899' }}
              title="Tambah Sheet Baru (Multi-Sheet)"
            >
              <Layers size={12} />
            </button>
            <button
              type="button"
              onClick={handleFormatCode}
              style={{ ...toolbarBtnStyle, color: '#a78bfa' }}
              title="Rapikan & Auto-Format Kode AntSheet"
            >
              <Wand2 size={12} />
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

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onScroll={handleScroll}
              onKeyDown={handleKeyDown}
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
                backgroundColor: 'var(--bg-main)',
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
      ) : null}

      {/* Focus Mode: full-screen editor overlay */}
      {isFocusMode && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          backgroundColor: 'var(--bg-main)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            height: '36px', flexShrink: 0,
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center',
            padding: '0 12px', gap: '8px',
          }}>
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
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '3px 9px', borderRadius: '5px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)', fontSize: '11.5px',
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Minimize2 size={12} /> Keluar Focus Mode
            </button>
          </div>
          <textarea
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1, resize: 'none', border: 'none', outline: 'none',
              backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)',
              fontFamily: '\'JetBrains Mono\', \'Fira Code\', monospace',
              fontSize: '13px', lineHeight: '1.7', padding: '24px 40px',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* ── Resize Handle Divider ─────────────────────────────────────────── */}
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
              {/* Recompile Split Button (Exact Overleaf Look) */}
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'stretch' }}>
                <button
                  type="button"
                  onClick={handleRecompile}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 9px',
                    borderTopLeftRadius: '5px',
                    borderBottomLeftRadius: '5px',
                    backgroundColor: '#00843D',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#007033')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#00843D')}
                  title="Kompilasi Ulang Spreadsheet (Ctrl+Enter)"
                >
                  <RefreshCw size={11} style={{ animation: isCompiling ? 'spin 0.5s linear infinite' : 'none' }} />
                  <span>Recompile</span>
                </button>

                <button
                  ref={recompileButtonRef}
                  type="button"
                  onClick={toggleRecompileDropdown}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 5px',
                    borderTopRightRadius: '5px',
                    borderBottomRightRadius: '5px',
                    backgroundColor: '#00843D',
                    border: 'none',
                    borderLeft: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#007033')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#00843D')}
                  title="Opsi Kompilasi"
                >
                  <ChevronDown size={12} style={{ transform: isRecompileDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                </button>

                {/* Recompile Dropdown Popover */}
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
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-xl, 0 12px 32px rgba(0,0,0,0.3))',
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    <div
                      onClick={() => setIsAutoCompile(!isAutoCompile)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: 'var(--text-primary)',
                      }}
                      className="hover-subtle"
                    >
                      <span style={{ fontWeight: 600 }}>Auto Compile</span>
                      <span
                        style={{
                          fontSize: '10.5px',
                          padding: '1px 6px',
                          borderRadius: '999px',
                          fontWeight: 700,
                          backgroundColor: isAutoCompile ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-subtle)',
                          color: isAutoCompile ? '#10B981' : 'var(--text-muted)',
                        }}
                      >
                        {isAutoCompile ? 'ON' : 'OFF'}
                      </span>
                    </div>

                    <div
                      onClick={() => {
                        handleRecompile();
                        setIsRecompileDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 8px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: 'var(--text-primary)',
                      }}
                      className="hover-subtle"
                    >
                      <Sparkles size={12} color="var(--brand-primary)" />
                      <span>Re-eval & render canvas</span>
                    </div>

                    <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />

                    <div
                      onClick={() => {
                        handleRecompile();
                        setIsRecompileDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 8px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '11.5px',
                        color: 'var(--text-muted)',
                      }}
                      className="hover-subtle"
                    >
                      <Trash2 size={12} />
                      <span>Reset grid state</span>
                    </div>
                  </div>,
                  document.body
                )}
              </div>

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
                title={validation.valid ? 'Logs & Kompilasi Status (Lihat log)' : `${validation.errors.length} Issue(s) found`}
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
                      backgroundColor: '#EF4444',
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
                      backgroundColor: '#F59E0B',
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
                  title="Unduh / Ekspor Spreadsheet (Download Options)"
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
                      Download Options
                    </div>
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
                      <span>File Excel (.xlsx)</span>
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
                      <span>File CSV (.csv)</span>
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
                      <span>File AntSheet (.antsheet)</span>
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
                      <span>{copied ? 'Tersalin ke Clipboard' : 'Salin Kode AntSheet'}</span>
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
                      message: typeof err === 'string' ? err : 'Format sintaks tidak valid',
                      suggestion: 'Periksa kembali tanda kutip atau pemisah pipa (|) pada sel.',
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
                      message: typeof warn === 'string' ? warn : 'Peringatan pada data sel',
                    });
                  });
                }

                // 3. Formula error cells as warnings
                errorCells.forEach((ec, idx) => {
                  logItems.push({
                    id: `formula_err_${idx}`,
                    type: 'warning',
                    line: ec.line,
                    message: `Sel ${ec.ref} menghasilkan error formula: ${ec.error}`,
                    suggestion:
                      ec.error === '#VALUE!'
                        ? 'Pastikan semua sel yang direferensi berisi angka, bukan teks.'
                        : ec.error === '#DIV/0!'
                        ? 'Pembagian dengan nol — pastikan sel pembagi tidak kosong atau bernilai 0.'
                        : ec.error === '#REF!'
                        ? 'Referensi sel tidak ditemukan atau di luar jangkauan sheet.'
                        : 'Periksa kembali referensi sel dan tipe datanya.',
                  });
                });

                // 4. Info compilation summary
                if (validation.valid) {
                  logItems.push({
                    id: 'info_success',
                    type: 'info',
                    line: 1,
                    message: `Kompilasi sukses. Terdeteksi ${sheetsCount} sheet, ${cellsCount} sel data, ${formulasCount} formula, dan ${lines.length} baris kode.${
                      errorCells.length > 0 ? ` ⚠ ${errorCells.length} sel mengandung error formula.` : ''
                    }`,
                    suggestion: chartsCount > 0 ? `Termasuk ${chartsCount} visualisasi grafik aktif.` : undefined,
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
                          Baris {d.line} ({activeFileName})
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
                        Lompat ke Baris
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

// ── Overleaf Design Tokens & Shared Styles (exact match to DocsView.tsx) ──────
const toolbarBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2px 4px',
  minWidth: '22px',
  height: '24px',
  borderRadius: '4px',
  border: '1px solid transparent',
  backgroundColor: 'transparent',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  fontSize: '11px',
  transition: 'all 0.15s ease',
  flexShrink: 0,
};

const separatorStyle: React.CSSProperties = {
  width: '1px',
  height: '14px',
  backgroundColor: 'var(--border-subtle)',
  margin: '0 2px',
  flexShrink: 0,
};

const popoverItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 8px',
  borderRadius: '5px',
  border: 'none',
  backgroundColor: 'transparent',
  color: 'var(--text-primary)',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  width: '100%',
  textAlign: 'left',
  transition: 'background-color 0.12s ease',
};