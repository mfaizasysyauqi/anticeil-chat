import React, { useState, useMemo, useRef } from 'react';
import {
  Code2,
  Eye,
  Copy,
  Check,
  Download,
  RotateCw,
  ExternalLink,
  X,
  Globe,
  Palette,
  FileText,
  GitFork,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LAYOUT_PAGE_SPACING } from '@/lib/layout-constants';
import type { AiArtifact } from '../types';
import { getArtifactFileExtension, isArtifactPreviewable } from '../utils/artifact-parser';
import { AiMarkdown } from './ai-markdown';

interface ArtifactViewerProps {
  artifact: AiArtifact;
  onClose: () => void;
  className?: string;
}

export function ArtifactViewer({ artifact, onClose, className }: ArtifactViewerProps) {
  const canPreview = isArtifactPreviewable(artifact);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>(canPreview ? 'preview' : 'code');
  const [copied, setCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const type = artifact.type.toLowerCase();
  const lang = (artifact.language || '').toLowerCase();
  const fileExtension = getArtifactFileExtension(artifact);

  // Copy code handler
  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download code as file
  const handleDownload = () => {
    const filename = `${(artifact.title || 'artifact').toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.${fileExtension}`;
    const blob = new Blob([artifact.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Open preview in new standalone browser tab
  const handleOpenInNewTab = () => {
    const blob = new Blob([getSanitizedHtml(artifact.content)], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // Format HTML with Tailwind CDN and standard styles for iframe
  const getSanitizedHtml = (rawHtml: string): string => {
    if (rawHtml.includes('<!DOCTYPE html>') || rawHtml.includes('<html')) {
      // If head exists, inject tailwind if missing
      if (!rawHtml.includes('cdn.tailwindcss.com')) {
        return rawHtml.replace(
          /<head([^>]*)>/i,
          '<head$1><script src="https://cdn.tailwindcss.com"></script>'
        );
      }
      return rawHtml;
    }

    // Wrap fragment in complete HTML5 template
    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      margin: 0;
      padding: 1rem;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #0d0e10;
      color: #f3f4f6;
    }
    /* Custom scrollbars */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
  </style>
</head>
<body>
  ${rawHtml}
</body>
</html>`;
  };

  const iframeSrcDoc = useMemo(() => {
    if (type.includes('html') || lang === 'html') {
      return getSanitizedHtml(artifact.content);
    }
    if (type.includes('svg') || lang === 'svg') {
      return `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: #0f1012;
      background-image: linear-gradient(45deg, #18191c 25%, transparent 25%), linear-gradient(-45deg, #18191c 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #18191c 75%), linear-gradient(-45deg, transparent 75%, #18191c 75%);
      background-size: 20px 20px;
      background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
    }
    svg {
      max-width: 90%;
      max-height: 90vh;
      height: auto;
      filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5));
    }
  </style>
</head>
<body>
  ${artifact.content}
</body>
</html>`;
    }
    if (type.includes('react') || lang === 'jsx' || lang === 'tsx') {
      // Simple React preview via Babel Standalone
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { margin: 0; padding: 1.5rem; background: #0d0e10; color: #f3f4f6; font-family: ui-sans-serif, system-ui; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${artifact.content}
    try {
      const AppToRender = typeof App !== 'undefined' ? App : (typeof Component !== 'undefined' ? Component : null);
      if (AppToRender) {
        ReactDOM.createRoot(document.getElementById('root')).render(<AppToRender />);
      }
    } catch (e) {
      document.body.innerHTML += '<div style="color:#ef4444;padding:1rem;">Render error: ' + e.message + '</div>';
    }
  </script>
</body>
</html>`;
    }
    return '';
  }, [artifact.content, type, lang, refreshKey]);

  const lines = useMemo(() => {
    return (artifact.content || '').split('\n');
  }, [artifact.content]);

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-[#111214] text-foreground select-none overflow-hidden',
        isFullscreen ? 'fixed inset-0 z-50' : 'relative',
        className
      )}
    >
      {/* 1. Artifact Top Navigation Bar */}
      <div className={cn("h-12 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#16171a] gap-2", LAYOUT_PAGE_SPACING.HORIZONTAL)}>
        {/* Left: Icon, Title & Type */}
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            {type.includes('html') ? (
              <Globe className="w-3.5 h-3.5 text-blue-400" />
            ) : type.includes('svg') ? (
              <Palette className="w-3.5 h-3.5 text-pink-400" />
            ) : type.includes('markdown') ? (
              <FileText className="w-3.5 h-3.5 text-amber-400" />
            ) : type.includes('mermaid') ? (
              <GitFork className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Code2 className="w-3.5 h-3.5 text-primary" />
            )}
          </div>
          <span className="font-semibold text-xs truncate text-foreground max-w-[160px] sm:max-w-[240px]">
            {artifact.title || 'Artifact'}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 text-muted-foreground border border-white/10 shrink-0">
            .{fileExtension}
          </span>
        </div>

        {/* Center: Segmented Preview / Code Switch */}
        {canPreview && (
          <div className="flex items-center bg-[#0d0e10] p-0.5 rounded-lg border border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('code')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer',
                viewMode === 'code'
                  ? 'bg-white/10 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer',
                viewMode === 'preview'
                  ? 'bg-white/10 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>
        )}

        {/* Right: Actions (Copy, Download, Reload, External, Close) */}
        <div className="flex items-center gap-1 shrink-0">
          {viewMode === 'preview' && (
            <button
              type="button"
              onClick={() => setRefreshKey((prev) => prev + 1)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
              title="Muat Ulang Preview"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
            title={copied ? 'Tersalin!' : 'Salin Kode'}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
            title="Unduh Berkas"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {canPreview && (
            <button
              type="button"
              onClick={handleOpenInNewTab}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
              title="Buka di Tab Baru"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer hidden sm:flex"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer ml-1"
            title="Tutup Artifact"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Artifact Content View Area */}
      <div className="flex-1 min-h-0 relative overflow-hidden bg-[#0d0e10]">
        {viewMode === 'preview' && canPreview ? (
          type.includes('markdown') || lang === 'md' ? (
            <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-[#0f1012]">
              <div className="max-w-3xl mx-auto">
                <AiMarkdown content={artifact.content} />
              </div>
            </div>
          ) : (
            <iframe
              key={refreshKey}
              ref={iframeRef}
              srcDoc={iframeSrcDoc}
              title={artifact.title || 'Artifact Preview'}
              sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups"
              className="w-full h-full border-0 bg-transparent"
            />
          )
        ) : (
          /* Code View with Line Numbers */
          <div className="h-full flex overflow-auto custom-scrollbar font-mono text-xs select-text">
            {/* Line numbers gutter */}
            <div className="py-4 pl-3 pr-3 text-right bg-[#141518] text-muted-foreground/40 select-none border-r border-white/5 shrink-0 text-[11px] leading-relaxed">
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code text */}
            <pre className="p-4 overflow-x-auto flex-1 leading-relaxed text-[#e2e8f0] text-[11px]">
              <code>{artifact.content}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
