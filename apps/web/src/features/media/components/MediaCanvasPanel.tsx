'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Layers,
  SplitSquareVertical,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  Contrast,
  SlidersHorizontal,
  Image as ImageIcon,
  Film,
  Music,
  Play,
  Volume2,
} from 'lucide-react';
import { useMediaEditorStore, MediaRevision, MediaProject, getMediaType } from '../store/useMediaEditorStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { previewActionBarStyle } from '../../docs/styles/editorSharedStyles';
import { SplitResizeDivider } from '../../docs/components/shared';

/** Shared style for icon buttons — matches Navbar app bar 28×28 */
const iconBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '28px',
  height: '28px',
  borderRadius: '6px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

interface MediaCanvasPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject: MediaProject | null;
  activeRevision: MediaRevision | null;
  prevRevision: MediaRevision | null;
  language?: 'id' | 'en';
}

export function MediaCanvasPanel({
  isOpen,
  onClose,
  activeProject,
  activeRevision,
  prevRevision,
  language = 'id',
}: MediaCanvasPanelProps) {
  const {
    isGenerating,
    comparisonMode,
    setComparisonMode,
    setActiveRevision,
    zoomPercent,
    setZoomPercent,
    viewMode,
  } = useMediaEditorStore();

  const [panelWidth, setPanelWidth] = useState(620);
  const [isDragging, setIsDragging] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const [copied, setCopied] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isPreviewInverted, setIsPreviewInverted] = useState(false);
  const [isZoomDropdownOpen, setIsZoomDropdownOpen] = useState(false);

  const asideRef = useRef<HTMLElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(620);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingSlider = useRef(false);
  const zoomButtonRef = useRef<HTMLButtonElement>(null);
  const zoomDropdownRef = useRef<HTMLDivElement>(null);

  const { theme } = useSettingsStore();

  // Resizable panel divider
  const handleMouseDown = useCallback(
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
          const minWidth = 360;
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

  // Before / After slider drag handler
  const handleSliderMove = useCallback((clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pos);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingSlider.current) {
        handleSliderMove(e.clientX);
      }
    };
    const onMouseUp = () => {
      isDraggingSlider.current = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [handleSliderMove]);

  const handleDownload = async () => {
    if (!activeRevision?.url) return;
    try {
      const res = await fetch(activeRevision.url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const fileName = `anticeil_${activeProject?.title || 'media'}_v${activeRevision.version}.png`
        .toLowerCase()
        .replace(/[^a-z0-9_.-]/g, '_');
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(activeRevision.url, '_blank');
    }
  };

  const handleCopyPrompt = async () => {
    if (!activeRevision?.prompt) return;
    try {
      await navigator.clipboard.writeText(activeRevision.prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      // fallback
    }
  };

  if (!isOpen) return null;

  const isCanvasOnly = viewMode === 'canvas';
  const currentScale = zoomPercent === 0 ? 1 : zoomPercent / 100;

  return (
    <>
      {/* Resizable Divider Handle (DRY matching DocsCanvasPanel) */}
      {!isCanvasOnly && <SplitResizeDivider onMouseDown={handleMouseDown} showSyncPill={false} />}

      <aside
        ref={asideRef}
        aria-label="Media Live Canvas Panel"
        style={{
          width: isCanvasOnly ? '100%' : `${panelWidth}px`,
          flex: isCanvasOnly ? 1 : undefined,
          minWidth: isCanvasOnly ? '100%' : '240px',
          maxWidth: isCanvasOnly ? '100%' : '90vw',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-canvas, #070a10)',
          borderLeft: isCanvasOnly ? 'none' : '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative',
          zIndex: 15,
          flexShrink: isCanvasOnly ? 1 : 0,
          overflow: 'hidden',
          transition: isDragging ? 'none' : 'width 0.1s ease',
        }}
      >
        {/* ── Top Toolbar: Exact 36px Height matching Docs Studio & Code Editor ── */}
        <div style={previewActionBarStyle}>
          {/* Left: Project title & Version tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            {activeRevision && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(0, 115, 234, 0.12)',
                  color: 'var(--brand-primary)',
                  border: '1px solid rgba(0, 115, 234, 0.25)',
                  flexShrink: 0,
                }}
              >
                v{activeRevision.version}
              </span>
            )}

            <span
              style={{
                fontSize: '12px',
                fontWeight: 650,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '180px',
              }}
              title={activeProject?.title}
            >
              {activeProject?.title || (language === 'id' ? 'Media Preview' : 'Media Preview')}
            </span>
          </div>

          {/* Right Toolbar Controls (Zoom, Contrast, Download, Close) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
            {/* Contrast / Invert button */}
            <button
              type="button"
              onClick={() => setIsPreviewInverted((v) => !v)}
              style={{
                ...iconBtnStyle,
                color: isPreviewInverted ? 'var(--brand-primary)' : 'var(--text-muted)',
                backgroundColor: isPreviewInverted ? 'var(--bg-subtle)' : 'transparent',
              }}
              className="hover-subtle"
              title={language === 'id' ? 'Mode Kontras / Latar Belakang' : 'Contrast Mode'}
            >
              <Contrast size={14} />
            </button>

            {/* Zoom Controls */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              <button
                type="button"
                onClick={() => setZoomPercent(Math.max(25, (zoomPercent || 100) - 25))}
                style={{ ...iconBtnStyle, color: 'var(--text-muted)' }}
                className="hover-subtle"
                title="Zoom Out"
              >
                <Minus size={13} />
              </button>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  padding: '0 4px',
                  minWidth: '32px',
                  textAlign: 'center',
                }}
              >
                {zoomPercent === 0 ? 'Fit' : `${zoomPercent}%`}
              </span>

              <button
                type="button"
                onClick={() => setZoomPercent(Math.min(200, (zoomPercent || 100) + 25))}
                style={{ ...iconBtnStyle, color: 'var(--text-muted)' }}
                className="hover-subtle"
                title="Zoom In"
              >
                <Plus size={13} />
              </button>
            </div>

            <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border-subtle)', margin: '0 2px' }} />

            {/* Copy Prompt */}
            <button
              type="button"
              onClick={handleCopyPrompt}
              style={{ ...iconBtnStyle, color: copiedPrompt ? '#10B981' : 'var(--text-muted)' }}
              className="hover-subtle"
              title={language === 'id' ? 'Salin Prompt Media' : 'Copy Prompt'}
            >
              {copiedPrompt ? <Check size={14} /> : <Copy size={14} />}
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              style={{ ...iconBtnStyle, color: 'var(--text-muted)' }}
              className="hover-subtle"
              title={language === 'id' ? 'Unduh Gambar Resolusi Penuh' : 'Download Full Resolution'}
            >
              <Download size={14} />
            </button>

            <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border-subtle)', margin: '0 2px' }} />

            {/* Close Preview Panel */}
            <button
              type="button"
              onClick={onClose}
              style={{ ...iconBtnStyle, color: 'var(--text-muted)' }}
              className="hover-subtle"
              title={language === 'id' ? 'Tutup Preview' : 'Close Preview'}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Viewport Canvas Body ── */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'auto',
            padding: '24px',
            backgroundColor: isPreviewInverted
              ? theme === 'light'
                ? '#070a10'
                : '#f8fafc'
              : theme === 'light'
              ? '#cbd5e1'
              : '#070a10',
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          {isGenerating ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                padding: '28px',
                borderRadius: '12px',
                backgroundColor: 'rgba(0,0,0,0.5)',
                border: '1px solid var(--border-subtle)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Sparkles size={28} className="animate-spin text-brand" color="var(--brand-primary)" />
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {language === 'id' ? 'Sedang Merender Media...' : 'Rendering Media...'}
              </div>
            </div>
          ) : !activeRevision ? (
            <div
              style={{
                width: '100%',
                maxWidth: '480px',
                aspectRatio: '1/1',
                borderRadius: '12px',
                border: '2px dashed var(--border-subtle)',
                backgroundColor: 'rgba(255,255,255,0.02)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px',
                textAlign: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(0, 115, 234, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brand-primary)',
                }}
              >
                <ImageIcon size={24} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {language === 'id' ? 'Media Studio Canvas' : 'Media Studio Canvas'}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '1.4', maxWidth: '280px' }}>
                  {language === 'id'
                    ? 'Ketik prompt di AI Co-Editor untuk merender media live di canvas ini.'
                    : 'Type a prompt in AI Co-Editor to render live media on this canvas.'}
                </div>
              </div>
            </div>
          ) : comparisonMode && prevRevision ? (
            /* ── Before vs After Slider ── */
            <div
              ref={sliderContainerRef}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '650px',
                aspectRatio: activeRevision.ratio ? activeRevision.ratio.replace(':', '/') : '1/1',
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                border: '1px solid var(--border-subtle)',
                userSelect: 'none',
              }}
            >
              <img
                src={activeRevision.url}
                alt="After"
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
                  overflow: 'hidden',
                }}
              >
                <img
                  src={prevRevision.url}
                  alt="Before"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />
              </div>

              {/* Slider Line */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${sliderPos}%`,
                  width: '2px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 0 8px rgba(0,0,0,0.6)',
                  cursor: 'ew-resize',
                  zIndex: 20,
                }}
                onMouseDown={(e) => {
                  isDraggingSlider.current = true;
                  e.preventDefault();
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000000',
                    fontSize: '9px',
                    fontWeight: 800,
                  }}
                >
                  ⇄
                </div>
              </div>
            </div>
          ) : (
            /* ── Standard Media View (Image, Video, Audio) ── */
            <div
              style={{
                position: 'relative',
                transform: `scale(${currentScale})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
                width: '100%',
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {(() => {
                const type = getMediaType(activeRevision.url, activeRevision.mediaType);
                if (type === 'video') {
                  const aspectRatio = activeRevision.ratio ? activeRevision.ratio.replace(':', '/') : '16/9';
                  return (
                    <video
                      key={activeRevision.url}
                      src={activeRevision.url}
                      controls
                      autoPlay
                      loop
                      playsInline
                      style={{
                        width: '100%',
                        maxWidth: '900px',
                        maxHeight: 'calc(100vh - 140px)',
                        aspectRatio,
                        borderRadius: '10px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                        border: '1px solid var(--border-subtle)',
                        display: 'block',
                        objectFit: 'contain',
                        backgroundColor: '#000000',
                      }}
                    />
                  );
                }

                if (type === 'audio') {
                  return (
                    <div
                      style={{
                        width: '420px',
                        maxWidth: '90vw',
                        padding: '24px',
                        borderRadius: '16px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-strong)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '18px',
                      }}
                    >
                      <div
                        style={{
                          width: '72px',
                          height: '72px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(96, 165, 250, 0.15)',
                          border: '2px solid rgba(96, 165, 250, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#60a5fa',
                          boxShadow: '0 0 24px rgba(96, 165, 250, 0.25)',
                        }}
                      >
                        <Music size={32} />
                      </div>

                      <div style={{ textAlign: 'center', width: '100%' }}>
                        <div style={{ fontSize: '13.5px', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '4px' }}>
                          {activeProject?.title || activeRevision.prompt.slice(0, 40) || 'Audio Preview'}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {activeRevision.prompt}
                        </div>
                      </div>

                      {/* Native Audio Element */}
                      <audio
                        key={activeRevision.url}
                        src={activeRevision.url}
                        controls
                        autoPlay
                        style={{
                          width: '100%',
                          borderRadius: '8px',
                          outline: 'none',
                        }}
                      />
                    </div>
                  );
                }

                return (
                  <img
                    src={activeRevision.url}
                    alt={activeRevision.prompt}
                    style={{
                      width: '100%',
                      maxWidth: '900px',
                      maxHeight: 'calc(100vh - 140px)',
                      borderRadius: '10px',
                      boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                      border: '1px solid var(--border-subtle)',
                      display: 'block',
                      objectFit: 'contain',
                    }}
                  />
                );
              })()}
            </div>
          )}
        </div>

        {/* ── Bottom Revision Timeline (Matching Overleaf Version Bar) ── */}
        {activeProject && activeProject.revisions.length > 0 && (
          <div
            style={{
              height: '70px',
              backgroundColor: 'var(--bg-surface)',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              gap: '10px',
              overflowX: 'auto',
              flexShrink: 0,
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', flexShrink: 0 }}>
              <Layers size={13} />
              <span style={{ fontSize: '11px', fontWeight: 650 }}>
                {language === 'id' ? 'Versi' : 'Revisions'} ({activeProject.revisions.length})
              </span>
            </div>

            <div style={{ height: '20px', width: '1px', backgroundColor: 'var(--border-subtle)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {activeProject.revisions.map((rev) => {
                const isActive = rev.id === activeRevision?.id;
                const revType = getMediaType(rev.url, rev.mediaType);
                return (
                  <div
                    key={rev.id}
                    onClick={() => setActiveRevision(activeProject.id, rev.id)}
                    style={{
                      position: 'relative',
                      width: '48px',
                      height: '48px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: `2px solid ${isActive ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                      boxShadow: isActive ? '0 0 0 2px rgba(0, 115, 234, 0.3)' : 'none',
                      backgroundColor: 'var(--bg-subtle)',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title={`v${rev.version}: ${rev.revisionInstruction || rev.prompt}`}
                  >
                    {revType === 'video' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fb7185' }}>
                        <Film size={20} />
                      </div>
                    ) : revType === 'audio' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                        <Music size={20} />
                      </div>
                    ) : (
                      <img
                        src={rev.url}
                        alt={`v${rev.version}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: isActive ? 'var(--brand-primary)' : 'rgba(0,0,0,0.6)',
                        color: '#ffffff',
                        fontSize: '8.5px',
                        fontWeight: 700,
                        textAlign: 'center',
                        padding: '1px 0',
                      }}
                    >
                      v{rev.version}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
