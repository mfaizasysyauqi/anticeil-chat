'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { useDocsStore } from '../store/useDocsStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

export function DocsSlideView() {
  const activeDocId = useDocsStore((s) => s.activeDocId);
  const documents = useDocsStore((s) => s.documents);
  const updateDocumentContent = useDocsStore((s) => s.updateDocumentContent);
  const theme = useSettingsStore((s) => s.theme);
  const language = useSettingsStore((s) => s.language);

  const activeDoc = documents.find((d) => d.id === activeDocId);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [slideTheme, setSlideTheme] = useState<'dark' | 'light' | 'midnight'>(
    theme === 'light' ? 'light' : 'midnight'
  );
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');

  // Sync slide theme when global theme toggles
  useEffect(() => {
    setSlideTheme(theme === 'light' ? 'light' : 'midnight');
  }, [theme]);

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [slideScrollTop, setSlideScrollTop] = useState(0);

  // Split raw markdown into individual slide chunks using '---' delimiter
  const rawContent = activeDoc?.content || '';
  const slides = useMemo(() => {
    if (!rawContent.trim()) {
      return [
        '# Judul Presentasi\n\n### Subjudul atau Ringkasan\n\n* Poin penting 1\n* Poin penting 2\n* Poin penting 3',
      ];
    }
    const parts = rawContent.split(/\n---\n/);
    return parts.length > 0 ? parts : [rawContent];
  }, [rawContent]);

  // Keep index within bounds
  const validIndex = Math.min(Math.max(0, currentSlideIndex), Math.max(0, slides.length - 1));

  // Handle keyboard navigation for slides
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
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

  // Add a new slide to the document
  const handleAddNewSlide = () => {
    if (!activeDoc) return;
    const newSlideTemplate = `\n---\n\n## Judul Slide Baru\n\n- Poin utama bahasan\n- Data dan analisis pendukung\n- Kesimpulan ringkas\n`;
    const updated = activeDoc.content + newSlideTemplate;
    updateDocumentContent(activeDoc.id, updated);
    setCurrentSlideIndex(slides.length);
  };

  // Compile individual slide markdown to sandboxed HTML
  const getSlideHtml = (content: string) => {
    const isDark = slideTheme === 'dark' || slideTheme === 'midnight';
    const bgColor =
      slideTheme === 'midnight'
        ? 'linear-gradient(135deg, #090d16 0%, #0d1527 50%, #111e38 100%)'
        : slideTheme === 'dark'
        ? '#0f172a'
        : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const headingColor = isDark ? '#ffffff' : '#0073ea';
    const cardBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
    const cardBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';

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
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: ${bgColor};
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      color: ${textColor};
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    .slide-canvas {
      width: 100%;
      height: 100%;
      padding: 48px 64px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      box-sizing: border-box;
    }
    h1, h2, h3 {
      font-weight: 800;
      letter-spacing: -0.03em;
      margin: 0 0 16px 0;
      line-height: 1.2;
    }
    h1 { font-size: 38px; color: ${headingColor}; }
    h2 { font-size: 30px; color: ${headingColor}; border-bottom: 2px solid ${isDark ? 'rgba(0, 115, 234, 0.4)' : '#e2e8f0'}; padding-bottom: 8px; }
    h3 { font-size: 20px; color: #60a5fa; }
    p { font-size: 18px; line-height: 1.6; margin: 0 0 16px 0; opacity: 0.9; }
    ul, ol { font-size: 18px; line-height: 1.8; margin: 0 0 16px 0; padding-left: 28px; }
    li { margin-bottom: 8px; }
    blockquote {
      background: ${cardBg};
      border-left: 4px solid #0073ea;
      padding: 12px 20px;
      border-radius: 8px;
      font-style: italic;
      font-size: 17px;
      margin: 16px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      background: ${cardBg};
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid ${cardBorder};
      font-size: 15px;
    }
    th, td {
      padding: 10px 16px;
      text-align: left;
      border-bottom: 1px solid ${cardBorder};
    }
    th {
      background: ${isDark ? 'rgba(0, 115, 234, 0.2)' : '#f1f5f9'};
      font-weight: 700;
    }
    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      background: ${cardBg};
      padding: 2px 6px;
      border-radius: 4px;
      color: #38bdf8;
    }
    pre {
      background: #000000;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 14px;
    }
    .katex-display {
      margin: 16px 0 !important;
      padding: 8px 0;
    }
  </style>
</head>
<body>
  <div class="slide-canvas" id="slide-content"></div>

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
  </script>
</body>
</html>
    `;
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-main)',
        overflow: 'hidden',
      }}
    >
      {/* ── Slide Control Ribbon ── */}
      <div
        style={{
          height: '42px',
          padding: '0 14px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        {/* Left: View Mode Toggle & Add Slide */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleAddNewSlide}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--brand-primary)',
              fontSize: '12px',
              fontWeight: 650,
              cursor: 'pointer',
            }}
          >
            <Plus size={13} />
            <span>Slide Baru</span>
          </button>

          <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-subtle)' }} />

          {/* Theme Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tema:</span>
            <button
              type="button"
              onClick={() => setSlideTheme('midnight')}
              style={{
                ...themeBtnStyle,
                backgroundColor: slideTheme === 'midnight' ? '#090d16' : 'transparent',
                color: slideTheme === 'midnight' ? '#38bdf8' : 'var(--text-secondary)',
                border: slideTheme === 'midnight' ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
              }}
            >
              Midnight
            </button>
            <button
              type="button"
              onClick={() => setSlideTheme('dark')}
              style={{
                ...themeBtnStyle,
                backgroundColor: slideTheme === 'dark' ? '#0f172a' : 'transparent',
                color: slideTheme === 'dark' ? '#ffffff' : 'var(--text-secondary)',
                border: slideTheme === 'dark' ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
              }}
            >
              Dark Tech
            </button>
            <button
              type="button"
              onClick={() => setSlideTheme('light')}
              style={{
                ...themeBtnStyle,
                backgroundColor: slideTheme === 'light' ? '#ffffff' : 'transparent',
                color: slideTheme === 'light' ? '#0f172a' : 'var(--text-secondary)',
                border: slideTheme === 'light' ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
              }}
            >
              Light Clean
            </button>
          </div>
        </div>

        {/* Center: Slide Pager Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            disabled={validIndex === 0}
            onClick={() => setCurrentSlideIndex((i) => Math.max(i - 1, 0))}
            style={pagerBtnStyle}
            title="Slide Sebelumnya (←)"
          >
            <ChevronLeft size={15} />
          </button>

          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', minWidth: '60px', textAlign: 'center' }}>
            {validIndex + 1} / {slides.length}
          </span>

          <button
            type="button"
            disabled={validIndex === slides.length - 1}
            onClick={() => setCurrentSlideIndex((i) => Math.min(i + 1, slides.length - 1))}
            style={pagerBtnStyle}
            title="Slide Selanjutnya (→)"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Right: Fullscreen Presentation Mode Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '6px',
              backgroundColor: 'var(--brand-primary)',
              border: 'none',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 115, 234, 0.3)',
            }}
          >
            <Play size={13} fill="#ffffff" />
            <span>Mulai Presentasi (F5)</span>
          </button>
        </div>
      </div>

      {/* ── Main Workspace Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Raw Markdown Editor */}
        <div
          style={{
            flex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-main)',
            borderRight: '1px solid var(--border-subtle)',
            minWidth: 0,
          }}
        >
          <div
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--bg-subtle)',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: '11px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>Gunakan <code>---</code> untuk memisahkan slide berikutnya</span>
            <span>{slides.length} Slide Terdeteksi</span>
          </div>

          <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden', height: '100%', minHeight: 0 }}>
            {/* Line numbers gutter */}
            <div
              aria-hidden="true"
              style={{
                width: '46px',
                paddingTop: '16px',
                paddingBottom: '16px',
                paddingRight: '10px',
                textAlign: 'right',
                color: 'var(--text-muted)',
                fontFamily: "'JetBrains Mono', monospace",
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
              <div style={{ transform: `translateY(-${slideScrollTop}px)` }}>
                {Array.from({ length: Math.max(1, rawContent.split('\n').length) }).map((_, i) => (
                  <div key={i} style={{ fontSize: '13px', lineHeight: '1.6' }}>
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            <textarea
              ref={textareaRef}
              value={rawContent}
              onScroll={(e) => setSlideScrollTop(e.currentTarget.scrollTop)}
              onChange={(e) => {
                if (activeDoc) updateDocumentContent(activeDoc.id, e.target.value);
              }}
              placeholder="Tulis konten slide dengan Markdown...\nGunakan --- untuk slide berikutnya."
              style={{
                width: '100%',
                height: '100%',
                padding: '16px 20px',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-primary)',
                fontFamily: "'JetBrains Mono', monospace",
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

        {/* Right: Live 16:9 Slide Canvas Preview */}
        <div
          style={{
            flex: 1.25,
            height: '100%',
            backgroundColor: theme === 'light' ? '#e2e8f0' : '#090d16',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            boxSizing: 'border-box',
            position: 'relative',
          }}
        >
          {/* 16:9 Aspect Ratio Frame */}
          <div
            style={{
              width: '100%',
              maxWidth: '820px',
              aspectRatio: '16 / 9',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow:
                theme === 'light'
                  ? '0 15px 35px rgba(0, 0, 0, 0.12)'
                  : '0 20px 50px rgba(0, 0, 0, 0.7)',
              border:
                theme === 'light'
                  ? '1px solid #cbd5e1'
                  : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a',
            }}
          >
            <iframe
              srcDoc={getSlideHtml(slides[validIndex] || '')}
              sandbox="allow-scripts allow-modals allow-same-origin"
              style={{ width: '100%', height: '100%', border: 'none' }}
              title={`Slide ${validIndex + 1}`}
            />
          </div>

          {/* Filmstrip Bottom Thumbnails */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '16px',
              overflowX: 'auto',
              maxWidth: '820px',
              padding: '4px',
            }}
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

      {/* ── Fullscreen Presentation Overlay (F5) ── */}
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

          {/* Fullscreen 16:9 Canvas */}
          <div
            style={{
              width: '94vw',
              maxWidth: '1440px',
              aspectRatio: '16 / 9',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
            }}
          >
            <iframe
              srcDoc={getSlideHtml(slides[validIndex] || '')}
              sandbox="allow-scripts allow-modals allow-same-origin"
              style={{ width: '100%', height: '100%', border: 'none' }}
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
              style={fullscreenPagerBtnStyle}
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
              style={fullscreenPagerBtnStyle}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const themeBtnStyle: React.CSSProperties = {
  padding: '3px 8px',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const pagerBtnStyle: React.CSSProperties = {
  background: 'var(--bg-subtle)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-primary)',
  borderRadius: '4px',
  padding: '3px 6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const fullscreenPagerBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#ffffff',
  padding: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
