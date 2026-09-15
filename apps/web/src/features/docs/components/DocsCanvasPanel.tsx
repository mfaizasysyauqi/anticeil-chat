'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  X,
  Code2,
  FileText,
  Minus,
  Plus,
  ChevronDown,
  ChevronUp,
  Contrast,
  Share2,
  Search,
  GitPullRequest,
  Users,
} from 'lucide-react';
import { useDocsStore } from '../store/useDocsStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { createClient } from '../../../shared/utils/supabase/client';
import { DocDiagnostic, computeDocLintResults, normalizeRuntimeError } from '../utils/docLinter';
import { getDocFileExtension } from '../utils/docDownloadUtils';
import { buildDocumentPreviewHtml } from '../utils/docPreviewBuilder';

import { previewActionBarStyle } from '../styles/editorSharedStyles';
import { SplitResizeDivider, DocLogsDrawer, DocExportDropdown, RecompileSplitButton } from './shared';
import { DocsSpreadsheetView } from './DocsSpreadsheetView';
import { DocsSlideView } from './DocsSlideView';
import { useDocModals } from '../hooks/useDocModals';

/** Shared style for icon buttons — matches Navbar app bar 28×28 */
const iconBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '28px',
  height: '28px',
  borderRadius: '6px',
  border: '1px solid transparent',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  flexShrink: 0,
};

// Stable colors for peer cursors
const PEER_COLORS = ['#F43F5E','#8B5CF6','#06B6D4','#10B981','#F59E0B','#3B82F6','#EC4899','#14B8A6'];

interface PeerCursor {
  userId: string;
  name: string;
  color: string;
  x: number; // 0–1 relative to aside
  y: number;
}

export function DocsCanvasPanel() {
  const router = useRouter();
  const isCanvasOpen = useDocsStore((s) => s.isCanvasOpen);
  const setIsCanvasOpen = useDocsStore((s) => s.setIsCanvasOpen);
  const viewMode = useDocsStore((s) => s.viewMode);
  const setCopilotPendingPrompt = useDocsStore((s) => s.setCopilotPendingPrompt);
  const selectedFormat = useDocsStore((s) => s.selectedFormat);

  const activeDocId = useDocsStore((s) => s.activeDocId);
  const documents = useDocsStore((s) => s.documents);

  const activeDoc = useMemo(() => {
    if (activeDocId) {
      const current = documents.find((d) => d.id === activeDocId);
      if (current && (!selectedFormat || current.format === selectedFormat)) {
        return current;
      }
    }
    if (selectedFormat) {
      const match = documents.find((d) => d.format === selectedFormat);
      if (match) return match;
    }
    return documents.find((d) => d.id === activeDocId) || documents[0] || null;
  }, [activeDocId, documents, selectedFormat]);

  const effectiveFormat = (selectedFormat || activeDoc?.format || 'latex') as 'latex' | 'typst' | 'sheet' | 'slide';

  const language = useSettingsStore((s) => (s.language === 'id' ? 'id' : 'en'));
  const theme = useSettingsStore((s) => s.theme);

  const user = useAuthStore((s) => s.user);
  const tier = useAuthStore((s) => s.tier);
  const hasCollaboration = tier !== 'free';

  const [peers, setPeers] = useState<PeerCursor[]>([]);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
  const rafRef = useRef<number | null>(null);

  const [panelWidth, setPanelWidth] = useState(580);
  const [isDragging, setIsDragging] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);

  const [isAutoCompile, setIsAutoCompile] = useState(true);
  const [compileMode, setCompileMode] = useState<'normal' | 'draft'>('normal');
  const [syntaxCheckMode, setSyntaxCheckMode] = useState<'check' | 'none'>('check');
  const [errorHandlingMode, setErrorHandlingMode] = useState<'stop' | 'continue'>('continue');
  const [isRecompiling, setIsRecompiling] = useState(false);

  // Runtime errors from the preview iframe (matches DocsView)
  const [runtimeErrors, setRuntimeErrors] = useState<DocDiagnostic[]>([]);

  // Pagination & Zoom state
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInputValue, setPageInputValue] = useState('1');
  const [zoomPercent, setZoomPercent] = useState<number>(0); // 0 = Auto Fit
  const [previewScale, setPreviewScale] = useState<number>(100);
  const [isZoomDropdownOpen, setIsZoomDropdownOpen] = useState<boolean>(false);
  const [zoomDropdownPos, setZoomDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const [isPreviewInverted, setIsPreviewInverted] = useState(false);
  const {
    isShareModalOpen,
    setIsShareModalOpen,
    isSearchOpen,
    setIsSearchOpen,
    isSuggestionsOpen,
    setIsSuggestionsOpen,
    isCollaboratorsOpen,
    setIsCollaboratorsOpen,
    docModalsElement,
  } = useDocModals(activeDoc);

  const reviewMode = useDocsStore((s) => s.reviewMode);
  const pendingSuggestionsCount = useMemo(
    () => activeDoc?.suggestions?.filter((s) => s.status === 'pending').length || 0,
    [activeDoc?.suggestions]
  );

  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(580);
  const asideRef = useRef<HTMLElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const zoomButtonRef = useRef<HTMLButtonElement>(null);
  const zoomDropdownRef = useRef<HTMLDivElement>(null);
  const myColorRef = useRef(PEER_COLORS[Math.floor(Math.random() * PEER_COLORS.length)]);

  // Resize drag handler: silky smooth 1:1 mouse follow matching code editor preview
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isDraggingRef.current = true;
      setIsDragging(true);
      startXRef.current = e.clientX;
      startWidthRef.current = asideRef.current?.offsetWidth || panelWidth;

      const parentEl = asideRef.current?.parentElement;
      const initialParentWidth = parentEl?.getBoundingClientRect().width || window.innerWidth - 260;

      let rafId: number | null = null;

      const onMouseMove = (ev: MouseEvent) => {
        if (!isDraggingRef.current) return;
        ev.preventDefault();

        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const delta = startXRef.current - ev.clientX;
          const minWidth = 320;
          const maxWidth = Math.max(initialParentWidth - 360, minWidth);
          const newWidth = Math.min(Math.max(startWidthRef.current + delta, minWidth), maxWidth);
          setPanelWidth(newWidth);
        });
      };

      const onMouseUp = () => {
        isDraggingRef.current = false;
        setIsDragging(false);
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', onMouseMove, { passive: false });
      window.addEventListener('mouseup', onMouseUp);
    },
    [panelWidth]
  );

  // ── Supabase Realtime Presence (non-free tiers only) ──────────────────────
  useEffect(() => {
    if (!hasCollaboration || !activeDocId) return;

    const supabase = createClient();
    const myId = user?.id ?? `anon-${Math.random().toString(36).slice(2)}`;
    const myName = user?.email?.split('@')[0] ?? 'Guest';
    const myColor = myColorRef.current;

    const channel = supabase.channel(`doc-presence:${activeDocId}`, {
      config: { presence: { key: myId } },
    });
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ name: string; color: string; x: number; y: number }>();
        const next: PeerCursor[] = [];
        for (const [uid, entries] of Object.entries(state)) {
          if (uid === myId) continue;
          const e = entries[0];
          if (e) next.push({ userId: uid, name: e.name, color: e.color, x: e.x, y: e.y });
        }
        setPeers(next);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const leftIds = new Set(leftPresences.map((p: any) => p.key ?? p.userId));
        setPeers((prev) => prev.filter((p) => !leftIds.has(p.userId)));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ name: myName, color: myColor, x: 0.5, y: 0.5 });
        }
      });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      setPeers([]);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCollaboration, activeDocId]);

  // Track this user's cursor on the aside element
  const handleMouseMoveOnAside = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!hasCollaboration || !channelRef.current || !asideRef.current) return;
    if (rafRef.current) return;
    const cx = e.clientX;
    const cy = e.clientY;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const rect = asideRef.current!.getBoundingClientRect();
      const x = (cx - rect.left) / rect.width;
      const y = (cy - rect.top) / rect.height;
      channelRef.current!.track({
        name: user?.email?.split('@')[0] ?? 'Guest',
        color: myColorRef.current,
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y)),
      });
    });
  }, [hasCollaboration, user]);

  // Listen to iframe postMessages (pages count, scale, runtime errors)
  useEffect(() => {
    function handleIframeMessage(event: MessageEvent) {
      if (!event.data) return;
      if (event.data.type === 'DOCS_PREVIEW_SCALE') {
        if (typeof event.data.scale === 'number') setPreviewScale(event.data.scale);
        if (typeof event.data.totalPages === 'number') setTotalPages(Math.max(1, event.data.totalPages));
      }
      if (event.data.type === 'DOCS_PAGES_COUNT') {
        setTotalPages(Math.max(1, event.data.count || 1));
      }
      // Runtime errors from iframe — normalized and deduplicated
      if (event.data.type === 'DOCS_PREVIEW_ERROR') {
        const errorMsg = event.data.message || 'Error executing preview scripts';
        const err = normalizeRuntimeError(errorMsg, event.data.lineno, event.data.colno);
        if (err) {
          setRuntimeErrors([err]);
        }
      }
      if (event.data.type === 'DOCS_PREVIEW_READY') {
        setRuntimeErrors([]);
      }
    }
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, []);

  // Send zoom changes to iframe
  const handleZoomChange = (newZoom: number | 'auto') => {
    if (newZoom === 'auto' || newZoom === 0) {
      setZoomPercent(0);
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({ type: 'DOCS_SET_ZOOM', zoom: 'auto' }, '*');
      }
    } else {
      const clamped = Math.max(25, Math.min(200, newZoom));
      setZoomPercent(clamped);
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({ type: 'DOCS_SET_ZOOM', zoom: clamped }, '*');
      }
    }
    setIsZoomDropdownOpen(false);
  };

  const handlePageChange = (newPage: number) => {
    const p = Math.max(1, Math.min(totalPages, newPage));
    setCurrentPage(p);
    setPageInputValue(String(p));
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'DOCS_GO_TO_PAGE', page: p }, '*');
    }
  };

  const handleTogglePreviewInvert = () => {
    const next = !isPreviewInverted;
    setIsPreviewInverted(next);
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'DOCS_SET_INVERTED', inverted: next },
        '*'
      );
    }
  };

  const toggleZoomDropdown = () => {
    if (!isZoomDropdownOpen && zoomButtonRef.current) {
      const rect = zoomButtonRef.current.getBoundingClientRect();
      setZoomDropdownPos({
        top: rect.bottom + 4,
        left: Math.max(10, rect.right - 125),
      });
      setIsZoomDropdownOpen(true);
    } else {
      setIsZoomDropdownOpen(false);
    }
  };

  // Close zoom dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        zoomButtonRef.current && !zoomButtonRef.current.contains(target) &&
        zoomDropdownRef.current && !zoomDropdownRef.current.contains(target)
      ) {
        setIsZoomDropdownOpen(false);
      }
    };
    if (isZoomDropdownOpen) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [isZoomDropdownOpen]);

  const handleOpenCodeEditor = () => {
    if (activeDoc) {
      router.push(`/docs/${activeDoc.id}`);
    }
  };

  const handleRecompile = () => {
    setIsRecompiling(true);
    setReloadKey((k) => k + 1);
    setTimeout(() => setIsRecompiling(false), 800);
  };

  const format = activeDoc?.format || 'latex';

  const ext = getDocFileExtension(format);
  const mainFileName =
    format === 'latex'
      ? 'main.tex'
      : format === 'typst'
      ? 'main.typ'
      : format === 'slide'
      ? 'main.slide'
      : 'sheet1.antsheet';

  // Run linter / diagnostics on ALL sub-files — identical to Code Editor verbosity (DRY via computeDocLintResults)
  const lintResult = useMemo(() => {
    if (!activeDoc) return { errors: [], warnings: [], infos: [], totalLogs: 0 };
    return computeDocLintResults(activeDoc, mainFileName, runtimeErrors);
  }, [activeDoc, mainFileName, runtimeErrors]);

  const handleJumpToLine = (line: number) => {
    if (activeDoc) {
      router.push(`/docs/${activeDoc.id}`);
    }
  };

  const handleSendSingleToAI = (d: DocDiagnostic) => {
    const errorMsg = d.message || '';
    const suggestion = d.suggestion ? `\nSaran: ${d.suggestion}` : '';
    const fileCtx = d.fileName ? ` di file ${d.fileName}` : '';
    const prompt =
      language === 'id'
        ? `Tolong bantu perbaiki masalah LaTeX berikut${fileCtx} (baris ${d.line}):\n\n[${d.type.toUpperCase()}] ${errorMsg}${suggestion}\n\nBerikan penjelasan ringkas serta kode yang sudah diperbaiki.`
        : `Please help fix this LaTeX issue${fileCtx} (line ${d.line}):\n\n[${d.type.toUpperCase()}] ${errorMsg}${suggestion}\n\nProvide a concise explanation and updated code.`;
    setCopilotPendingPrompt(prompt);
  };

  const handleSendAllToAI = () => {
    const allLogs = [...lintResult.errors, ...lintResult.warnings, ...lintResult.infos];
    const logText = allLogs
      .map(
        (d) =>
          `- [${d.type.toUpperCase()}] Baris ${d.line} (${d.fileName || 'main.tex'}): ${d.message}${
            d.suggestion ? ` (Saran: ${d.suggestion})` : ''
          }`
      )
      .join('\n');
    const prompt =
      language === 'id'
        ? `Tolong bantu saya menganalisis dan memperbarui kode dokumen LaTeX untuk menyelesaikan seluruh log & warning berikut:\n\n${logText}\n\nBerikan penjelasan ringkas serta perbaikan kode lengkap yang siap dipakai.`
        : `Please help me analyze and fix all of the following LaTeX output logs & warnings:\n\n${logText}\n\nProvide a concise explanation and updated complete code.`;
    setCopilotPendingPrompt(prompt);
  };

  // Reusable full publication-grade HTML document
  const compiledHtml = useMemo(() => {
    if (!activeDoc) return '';
    return buildDocumentPreviewHtml({
      doc: activeDoc,
      theme,
      language,
    });
  }, [activeDoc, theme, language]);

  if (!isCanvasOpen || viewMode === 'code') return null;

  const isPreviewOnly = viewMode === 'preview';

  return (
    <>
      {/* Resizable Divider Handle - Standardized DRY Shared Component (Only in Split View) */}
      {!isPreviewOnly && (
        <SplitResizeDivider
          isResizing={isDragging}
          onMouseDown={handleDragStart}
          showSyncPill={false}
        />
      )}

      {/* Main Canvas Panel Container */}
      <aside
        ref={asideRef}
        onMouseMove={handleMouseMoveOnAside}
        style={{
          width: isPreviewOnly ? '100%' : `${panelWidth}px`,
          flex: isPreviewOnly ? 1 : undefined,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-surface)',
          borderLeft: isPreviewOnly ? 'none' : '1px solid var(--border-subtle)',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: isPreviewOnly ? 1 : 0,
          zIndex: 9,
        }}
      >
        {/* ── Peer Cursors Overlay ── */}
        {hasCollaboration && peers.map((peer) => (
          <div
            key={peer.userId}
            style={{
              position: 'absolute',
              left: `${peer.x * 100}%`,
              top: `${peer.y * 100}%`,
              transform: 'translate(-2px, -2px)',
              pointerEvents: 'none',
              zIndex: 9999,
              transition: 'left 0.08s linear, top 0.08s linear',
            }}
          >
            {/* Cursor SVG */}
            <svg width="16" height="20" viewBox="0 0 16 20" fill="none" style={{ display: 'block' }}>
              <path d="M0 0L0 14L4 10L7 16L9 15L6 9L11 9L0 0Z" fill={peer.color} stroke="white" strokeWidth="1" />
            </svg>
            {/* Name label */}
            <span style={{
              display: 'block',
              marginTop: '2px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: peer.color,
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}>
              {peer.name}
            </span>
          </div>
        ))}
        {effectiveFormat === 'sheet' ? (
          <div style={{ flex: 1, height: '100%', width: '100%', minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <DocsSpreadsheetView viewMode="preview" isFocusMode={false} />
          </div>
        ) : effectiveFormat === 'slide' ? (
          <div style={{ flex: 1, height: '100%', width: '100%', minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <DocsSlideView viewMode="preview" isFocusMode={false} />
          </div>
        ) : (
          <>
        {/* ── Top Preview Toolbar (36px, matching Code Editor preview bar) ── */}
        <div
          className="hide-scrollbar"
          style={{
            ...previewActionBarStyle,
            padding: '0 7px 0 8px',
            backgroundColor: 'var(--bg-main)',
            height: '36px',
          }}
        >
          {/* Left: RecompileSplitButton + Logs Icon + Download */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
            {/* Recompile Split Button (DRY shared component, full compile options) */}
            <RecompileSplitButton
              isCompiling={isRecompiling}
              isAutoCompile={isAutoCompile}
              onRecompile={handleRecompile}
              onToggleAutoCompile={(enabled) => {
                setIsAutoCompile(enabled);
                if (enabled) handleRecompile();
              }}
              compileMode={compileMode}
              onChangeCompileMode={setCompileMode}
              syntaxCheckMode={syntaxCheckMode}
              onChangeSyntaxCheck={setSyntaxCheckMode}
              errorHandlingMode={errorHandlingMode}
              onChangeErrorHandling={setErrorHandlingMode}
              onStopCompilation={() => setIsRecompiling(false)}
              onResetRecompile={handleRecompile}
            />

            {/* Logs & Diagnostics Icon Button */}
            <button
              type="button"
              onClick={() => setIsLogDrawerOpen((prev) => !prev)}
              style={{
                ...iconBtnStyle,
                position: 'relative',
                backgroundColor: isLogDrawerOpen ? 'var(--bg-subtle)' : 'transparent',
                color:
                  lintResult.errors.length > 0
                    ? '#EF4444'
                    : lintResult.warnings.length > 0
                    ? '#F59E0B'
                    : 'var(--text-muted)',
              }}
              className="hover-subtle"
              title={
                lintResult.errors.length > 0
                  ? `${lintResult.errors.length} Error(s) found`
                  : lintResult.warnings.length > 0
                  ? `${lintResult.warnings.length} Warning(s) found`
                  : 'Logs and output files'
              }
            >
              <FileText size={14} />
              {lintResult.errors.length > 0 ? (
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
              ) : lintResult.warnings.length > 0 ? (
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

            {/* Download / Export Options Button & Popover (Standardized DRY Shared Component) */}
            <DocExportDropdown doc={activeDoc} />

            {/* Share View-Only Button */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              style={{
                ...iconBtnStyle,
                color: 'var(--text-muted)',
              }}
              className="hover-subtle"
              title={language === 'id' ? 'Bagikan Dokumen (View-Only)' : 'Share Document (View-Only)'}
            >
              <Share2 size={13.5} />
            </button>

            {/* In-App Grep / Project Search */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              style={{
                ...iconBtnStyle,
                color: 'var(--text-muted)',
              }}
              className="hover-subtle"
              title={language === 'id' ? 'Cari di Seluruh File (Ctrl+Shift+F)' : 'Find in All Files (Ctrl+Shift+F)'}
            >
              <Search size={13.5} />
            </button>

            {/* Track Changes / Suggestions Drawer Button */}
            <button
              type="button"
              onClick={() => setIsSuggestionsOpen((prev) => !prev)}
              style={{
                ...iconBtnStyle,
                position: 'relative',
                backgroundColor:
                  isSuggestionsOpen || reviewMode === 'reviewing'
                    ? 'rgba(59, 130, 246, 0.12)'
                    : 'transparent',
                color:
                  isSuggestionsOpen || reviewMode === 'reviewing' ? '#3B82F6' : 'var(--text-muted)',
              }}
              className="hover-subtle"
              title={
                language === 'id'
                  ? `Saran & Perubahan (${pendingSuggestionsCount} menunggu)`
                  : `Suggestions & Changes (${pendingSuggestionsCount} pending)`
              }
            >
              <GitPullRequest size={13.5} />
              {pendingSuggestionsCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    minWidth: '13px',
                    height: '13px',
                    padding: '0 3px',
                    borderRadius: '7px',
                    backgroundColor: '#3B82F6',
                    color: '#fff',
                    fontSize: '8.5px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >
                  {pendingSuggestionsCount > 9 ? '9+' : pendingSuggestionsCount}
                </span>
              )}
            </button>

            {/* Direct Email Collaborators Management */}
            <button
              type="button"
              onClick={() => setIsCollaboratorsOpen(true)}
              style={{
                ...iconBtnStyle,
                position: 'relative',
                color: (activeDoc?.collaborators?.length || 0) > 0 ? '#10B981' : 'var(--text-muted)',
              }}
              className="hover-subtle"
              title={language === 'id' ? 'Kelola Kolaborator Email' : 'Manage Email Collaborators'}
            >
              <Users size={13.5} />
            </button>
          </div>

          {/* Right: Invert Preview + Page Navigation + Zoom Controls + Open in Code Editor + Close Preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
            {/* Contrast / Invert Preview Button */}
            <button
              type="button"
              onClick={handleTogglePreviewInvert}
              style={{
                ...iconBtnStyle,
                backgroundColor: isPreviewInverted ? 'var(--bg-subtle)' : 'transparent',
                color: isPreviewInverted ? 'var(--brand-primary)' : 'var(--text-muted)',
              }}
              className="hover-subtle"
              title={language === 'id' ? 'Ubah Kontras/Tema Preview' : 'Toggle Preview Theme'}
            >
              <Contrast size={13} />
            </button>

            {/* Prev Page Button */}
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              style={{
                ...iconBtnStyle,
                width: '24px',
                height: '24px',
                color: currentPage <= 1 ? 'var(--border-strong)' : 'var(--text-muted)',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              }}
              className={currentPage > 1 ? 'hover-subtle' : ''}
              title="Previous Page"
            >
              <ChevronUp size={14} />
            </button>

            {/* Next Page Button */}
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              style={{
                ...iconBtnStyle,
                width: '24px',
                height: '24px',
                color: currentPage >= totalPages ? 'var(--border-strong)' : 'var(--text-muted)',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              }}
              className={currentPage < totalPages ? 'hover-subtle' : ''}
              title="Next Page"
            >
              <ChevronDown size={14} />
            </button>

            {/* Page Input / Total Pages */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <input
                type="text"
                value={pageInputValue}
                onChange={(e) => setPageInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = parseInt(pageInputValue, 10);
                    if (!isNaN(val)) handlePageChange(val);
                  }
                }}
                onBlur={() => {
                  const val = parseInt(pageInputValue, 10);
                  if (!isNaN(val)) handlePageChange(val);
                  else setPageInputValue(String(currentPage));
                }}
                style={{
                  width: '28px',
                  height: '22px',
                  textAlign: 'center',
                  fontSize: '11.5px',
                  fontWeight: 650,
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  padding: '0 2px',
                }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                / {totalPages}
              </span>
            </div>

            <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border-subtle)', margin: '0 2px' }} />

            {/* Zoom Out */}
            <button
              type="button"
              onClick={() => handleZoomChange((zoomPercent === 0 ? previewScale : zoomPercent) - 10)}
              style={{ ...iconBtnStyle, width: '24px', height: '24px', color: 'var(--text-muted)' }}
              className="hover-subtle"
              title="Zoom Out (-10%)"
            >
              <Minus size={13} strokeWidth={2.2} />
            </button>

            {/* Zoom In */}
            <button
              type="button"
              onClick={() => handleZoomChange((zoomPercent === 0 ? previewScale : zoomPercent) + 10)}
              style={{ ...iconBtnStyle, width: '24px', height: '24px', color: 'var(--text-muted)' }}
              className="hover-subtle"
              title="Zoom In (+10%)"
            >
              <Plus size={13} strokeWidth={2.2} />
            </button>

            {/* Zoom Dropdown Button */}
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <button
                ref={zoomButtonRef}
                type="button"
                onClick={toggleZoomDropdown}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: isZoomDropdownOpen ? 'var(--bg-subtle)' : 'transparent',
                  border: '1px solid transparent',
                  color: 'var(--text-primary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                }}
                className="hover-subtle"
                title="Zoom Level"
              >
                <span>{previewScale}%</span>
                <ChevronDown size={10} style={{ opacity: 0.7 }} />
              </button>

              {/* Zoom Dropdown Popover (Portal to prevent clipping) */}
              {isZoomDropdownOpen && zoomDropdownPos && typeof document !== 'undefined' && createPortal(
                <div
                  ref={zoomDropdownRef}
                  onClick={(e) => e.stopPropagation()}
                  className="animate-fade-in"
                  style={{
                    position: 'fixed',
                    top: `${zoomDropdownPos.top}px`,
                    left: `${zoomDropdownPos.left}px`,
                    zIndex: 999999999,
                    minWidth: '120px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '7px',
                    boxShadow: 'var(--shadow-xl, 0 12px 32px rgba(0,0,0,0.3))',
                    padding: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      handleZoomChange('auto');
                      setIsZoomDropdownOpen(false);
                    }}
                    style={{
                      padding: '5px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--text-primary)',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                    className="hover-subtle"
                  >
                    Auto Fit
                  </button>
                  {[50, 75, 100, 125, 150, 200].map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => {
                        handleZoomChange(z);
                        setIsZoomDropdownOpen(false);
                      }}
                      style={{
                        padding: '5px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: previewScale === z ? 'var(--bg-subtle)' : 'transparent',
                        color: previewScale === z ? 'var(--brand-primary)' : 'var(--text-primary)',
                        fontSize: '11.5px',
                        fontWeight: previewScale === z ? 700 : 500,
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                      className="hover-subtle"
                    >
                      {z}%
                    </button>
                  ))}
                </div>,
                document.body
              )}
            </div>

            <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border-subtle)', margin: '0 2px' }} />

            {/* Open in Code Editor Button */}
            <button
              type="button"
              onClick={handleOpenCodeEditor}
              style={{ ...iconBtnStyle, color: 'var(--text-muted)' }}
              className="hover-subtle"
              title={language === 'id' ? 'Buka di Code Editor' : 'Open in Code Editor'}
            >
              <Code2 size={14} />
            </button>

            {/* Close Preview Button */}
            <button
              type="button"
              onClick={() => setIsCanvasOpen(false)}
              style={{ ...iconBtnStyle, color: 'var(--text-muted)' }}
              className="hover-subtle"
              title={language === 'id' ? 'Tutup Preview' : 'Close Preview'}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Collapsible Log Panel / Drawer (Standardized DRY Shared Component) ── */}
        <DocLogsDrawer
          isOpen={isLogDrawerOpen}
          onClose={() => setIsLogDrawerOpen(false)}
          lintResults={lintResult}
          language={language}
          onJumpToLine={handleJumpToLine}
          onSendSingleToAI={handleSendSingleToAI}
          onSendAllToAI={handleSendAllToAI}
        />

        {/* ── Body: Publication-Grade Live Rendered Preview ── */}
        <div style={{ flex: 1, height: '100%', minHeight: 0, position: 'relative', overflow: 'hidden' }}>
          <iframe
            key={`preview_${activeDoc?.id}_${reloadKey}`}
            ref={iframeRef}
            srcDoc={compiledHtml}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: theme === 'light' ? '#cbd5e1' : '#070a10',
              pointerEvents: isDragging ? 'none' : 'auto',
            }}
            sandbox="allow-scripts allow-same-origin"
            title="Docs Live Preview"
          />
        </div>
          </>
        )}
      </aside>

      {docModalsElement}
    </>
  );
}
