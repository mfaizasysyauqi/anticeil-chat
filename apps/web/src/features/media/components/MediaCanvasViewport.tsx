'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Download,
  Copy,
  Check,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Layers,
  SplitSquareVertical,
  Undo2,
  Redo2,
  Trash2,
  GitFork,
  CheckCircle2,
  Info,
  Clock,
  Eye,
  Film,
  Music,
} from 'lucide-react';
import { useMediaEditorStore, MediaRevision, MediaProject, getMediaType } from '../store/useMediaEditorStore';

interface MediaCanvasViewportProps {
  activeProject: MediaProject | null;
  activeRevision: MediaRevision | null;
  prevRevision: MediaRevision | null;
  language?: 'id' | 'en';
}

export function MediaCanvasViewport({
  activeProject,
  activeRevision,
  prevRevision,
  language = 'id',
}: MediaCanvasViewportProps) {
  const {
    isGenerating,
    comparisonMode,
    setComparisonMode,
    setActiveRevision,
    zoomPercent,
    setZoomPercent,
    deleteRevision,
  } = useMediaEditorStore();

  const [sliderPos, setSliderPos] = useState(50); // 0 to 100%
  const isDraggingSlider = useRef(false);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Slider drag handler
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

  const handleCopyImage = async () => {
    if (!activeRevision?.url) return;
    try {
      await navigator.clipboard.writeText(activeRevision.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
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

  const currentScale = zoomPercent === 0 ? 1 : zoomPercent / 100;

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-canvas, #070a10)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Top Canvas Action Bar ── */}
      <div
        style={{
          height: '42px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        {/* Left: Project Info & Version Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 650,
              color: 'var(--text-primary)',
              maxWidth: '220px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {activeProject?.title || (language === 'id' ? 'Media Studio Canvas' : 'Media Studio Canvas')}
          </span>

          {activeRevision && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '10px',
                backgroundColor: 'rgba(0, 115, 234, 0.12)',
                color: 'var(--brand-primary)',
                border: '1px solid rgba(0, 115, 234, 0.25)',
              }}
            >
              v{activeRevision.version}
            </span>
          )}

          {activeRevision?.ratio && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {activeRevision.ratio}
            </span>
          )}
        </div>

        {/* Right: Actions & View Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Zoom Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              padding: '1px',
            }}
          >
            <button
              type="button"
              onClick={() => setZoomPercent(Math.max(25, (zoomPercent || 100) - 25))}
              style={{
                border: 'none',
                background: 'transparent',
                padding: '4px',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span style={{ fontSize: '10px', fontWeight: 600, padding: '0 4px', color: 'var(--text-primary)' }}>
              {zoomPercent === 0 ? 'Fit' : `${zoomPercent}%`}
            </span>
            <button
              type="button"
              onClick={() => setZoomPercent(Math.min(200, (zoomPercent || 100) + 25))}
              style={{
                border: 'none',
                background: 'transparent',
                padding: '4px',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border-subtle)', margin: '0 2px' }} />

          {/* Copy Prompt */}
          <button
            type="button"
            onClick={handleCopyPrompt}
            style={{
              border: 'none',
              background: 'transparent',
              padding: '6px',
              cursor: 'pointer',
              color: copiedPrompt ? '#10B981' : 'var(--text-muted)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
            title={language === 'id' ? 'Salin Prompt' : 'Copy Prompt'}
          >
            {copiedPrompt ? <Check size={14} /> : <Copy size={14} />}
          </button>

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: 'var(--brand-primary)',
              color: '#ffffff',
              border: 'none',
              fontSize: '11px',
              fontWeight: 650,
              cursor: 'pointer',
              transition: 'opacity 0.15s ease',
            }}
            title={language === 'id' ? 'Unduh Gambar Resolusi Penuh' : 'Download Image'}
          >
            <Download size={13} />
            <span>{language === 'id' ? 'Unduh' : 'Download'}</span>
          </button>
        </div>
      </div>

      {/* ── Main Viewport Canvas ── */}
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
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {isGenerating ? (
          /* Loading State */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              padding: '32px',
              borderRadius: '12px',
              backgroundColor: 'rgba(0,0,0,0.4)',
              border: '1px solid var(--border-subtle)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Sparkles size={28} className="animate-spin text-brand" color="var(--brand-primary)" />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 650, color: 'var(--text-primary)' }}>
                {language === 'id' ? 'Sedang Meng-generate Media...' : 'Generating Media...'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {language === 'id'
                  ? 'AI sedang memproses prompt & revisi visual Anda'
                  : 'AI is rendering your visual revision'}
              </div>
            </div>
          </div>
        ) : !activeRevision ? (
          /* Empty State */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              maxWidth: '360px',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                backgroundColor: 'rgba(0, 115, 234, 0.08)',
                border: '1px solid rgba(0, 115, 234, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-primary)',
              }}
            >
              <Sparkles size={28} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {language === 'id' ? 'Mulai Projek Media Anda' : 'Start Your Media Project'}
              </div>
              <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
                {language === 'id'
                  ? 'Ketik prompt di panel AI Co-Editor sebelah kiri untuk meng-generate gambar pertama, lalu minta revisi beruntun secara iteratif.'
                  : 'Type a prompt on the left panel to generate your first media, then iteratively request revisions.'}
              </div>
            </div>
          </div>
        ) : comparisonMode && prevRevision ? (
          /* ── Before vs After Slider Comparison ── */
          <div
            ref={sliderContainerRef}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '850px',
              height: 'auto',
              maxHeight: '80vh',
              aspectRatio: activeRevision.ratio ? activeRevision.ratio.replace(':', '/') : '1/1',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              border: '1px solid var(--border-subtle)',
              userSelect: 'none',
            }}
          >
            {/* Base Image (After / Current Active Revision) */}
            <img
              src={activeRevision.url}
              alt="After Revision"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />

            {/* Overlay Image (Before / Previous Revision) clipped by sliderPos */}
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
                alt="Before Revision"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>

            {/* Slider Divider Line */}
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
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000000',
                  fontSize: '10px',
                  fontWeight: 800,
                  cursor: 'ew-resize',
                }}
              >
                ⇄
              </div>
            </div>

            {/* Labels */}
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: '#fff',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 650,
                backdropFilter: 'blur(4px)',
                zIndex: 10,
              }}
            >
              Before (v{prevRevision.version})
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                backgroundColor: 'rgba(0, 115, 234, 0.8)',
                color: '#fff',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 650,
                backdropFilter: 'blur(4px)',
                zIndex: 10,
              }}
            >
              After (v{activeRevision.version})
            </div>
          </div>
        ) : (
          /* ── Standard Media Viewport (Image, Video, Audio) ── */
          <div
            style={{
              position: 'relative',
              maxWidth: '100%',
              maxHeight: '100%',
              transform: `scale(${currentScale})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {(() => {
              const type = getMediaType(activeRevision.url, activeRevision.mediaType);
              if (type === 'video') {
                return (
                  <video
                    key={activeRevision.url}
                    src={activeRevision.url}
                    controls
                    autoPlay
                    loop
                    playsInline
                    style={{
                      maxWidth: '850px',
                      maxHeight: '75vh',
                      width: 'auto',
                      height: 'auto',
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
                      width: '480px',
                      maxWidth: '90vw',
                      padding: '28px',
                      borderRadius: '18px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-strong)',
                      boxShadow: '0 25px 60px rgba(0,0,0,0.45)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '20px',
                    }}
                  >
                    <div
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(96, 165, 250, 0.15)',
                        border: '2px solid rgba(96, 165, 250, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#60a5fa',
                        boxShadow: '0 0 28px rgba(96, 165, 250, 0.25)',
                      }}
                    >
                      <Music size={36} />
                    </div>

                    <div style={{ textAlign: 'center', width: '100%' }}>
                      <div style={{ fontSize: '15px', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {activeProject?.title || activeRevision.prompt.slice(0, 45) || 'Audio Preview'}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          lineHeight: '1.45',
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
                    maxWidth: '850px',
                    maxHeight: '75vh',
                    width: 'auto',
                    height: 'auto',
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

      {/* ── Bottom Revision History Strip / Timeline ── */}
      {activeProject && activeProject.revisions.length > 0 && (
        <div
          style={{
            height: '76px',
            backgroundColor: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: '12px',
            overflowX: 'auto',
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', flexShrink: 0 }}>
            <Layers size={14} />
            <span style={{ fontSize: '11px', fontWeight: 650 }}>
              {language === 'id' ? 'Riwayat Versi' : 'Revisions'} ({activeProject.revisions.length})
            </span>
          </div>

          <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--border-subtle)' }} />

          {/* Thumbnails list */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {activeProject.revisions.map((rev) => {
              const isActive = rev.id === activeRevision?.id;
              const revType = getMediaType(rev.url, rev.mediaType);
              return (
                <div
                  key={rev.id}
                  onClick={() => setActiveRevision(activeProject.id, rev.id)}
                  style={{
                    position: 'relative',
                    width: '56px',
                    height: '56px',
                    borderRadius: '8px',
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
                      <Film size={22} />
                    </div>
                  ) : revType === 'audio' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                      <Music size={22} />
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
                      fontSize: '9px',
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
    </div>
  );
}
