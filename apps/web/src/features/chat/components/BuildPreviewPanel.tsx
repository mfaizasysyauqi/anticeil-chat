'use client';
import React, { useState, useMemo } from 'react';
import {
  Eye,
  Code2,
  Globe,
  RotateCw,
  ExternalLink,
  Download,
  Maximize2,
  Minimize2,
  X,
  Smartphone,
  Tablet,
  Monitor,
  Sparkles,
  Copy,
  Check,
  Zap,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Layers,
  FileText,
  FileCode,
} from 'lucide-react';
import { useBuildStore, ViewportMode, ViewMode, Artifact } from '../store/useBuildStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { getTranslation } from '@anticeil/core';
import { LiveBrowserRunner } from './LiveBrowserRunner';
import { DocumentViewer, DocumentType } from './DocumentViewer';

export function BuildPreviewPanel() {
  const isOpen = useBuildStore((s) => s.isOpen);
  const artifacts = useBuildStore((s) => s.artifacts);
  const currentIndex = useBuildStore((s) => s.currentIndex);
  const activeArtifact = useBuildStore((s) => s.activeArtifact);
  const viewMode = useBuildStore((s) => s.viewMode);
  const viewport = useBuildStore((s) => s.viewport);
  const isFullscreen = useBuildStore((s) => s.isFullscreen);
  const reloadKey = useBuildStore((s) => s.reloadKey);

  const close = useBuildStore((s) => s.close);
  const setViewMode = useBuildStore((s) => s.setViewMode);
  const setViewport = useBuildStore((s) => s.setViewport);
  const toggleFullscreen = useBuildStore((s) => s.toggleFullscreen);
  const triggerReload = useBuildStore((s) => s.triggerReload);
  const openArtifact = useBuildStore((s) => s.openArtifact);
  const goToPreviousArtifact = useBuildStore((s) => s.goToPreviousArtifact);
  const goToNextArtifact = useBuildStore((s) => s.goToNextArtifact);
  const goToArtifactIndex = useBuildStore((s) => s.goToArtifactIndex);
  const resetToHub = useBuildStore((s) => s.resetToHub);

  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);
  const tb = t.buildMode;

  const [copied, setCopied] = useState(false);
  const [showArtifactList, setShowArtifactList] = useState(false);

  const isDocument = Boolean(
    activeArtifact && ['pdf', 'xlsx', 'docx', 'pptx', 'csv'].includes(activeArtifact.language.toLowerCase())
  );

  React.useEffect(() => {
    if (isDocument && viewMode === 'code') {
      setViewMode('preview');
    }
  }, [isDocument, viewMode, setViewMode]);

  // Compile sandboxed HTML bundle
  const iframeSrcDoc = useMemo(() => {
    if (!activeArtifact?.code) return '';

    const raw = activeArtifact.code.trim();
    const lang = activeArtifact.language.toLowerCase();

    // 1. Direct SVG
    if (lang === 'svg' || (raw.startsWith('<svg') && raw.endsWith('</svg>'))) {
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a; padding: 20px; }
    svg { max-width: 100%; max-height: 90vh; height: auto; }
  </style>
</head>
<body>
  ${raw}
</body>
</html>
      `;
    }

    // 2. React / JSX / TSX
    const isReact =
      lang === 'jsx' ||
      lang === 'tsx' ||
      lang === 'react' ||
      raw.includes('import React') ||
      raw.includes('export default function') ||
      raw.includes('function App(') ||
      raw.includes('const App =') ||
      raw.includes('useState(');

    if (isReact) {
      // Clean import / export lines for in-browser Babel
      let cleanCode = raw
        .replace(/import\s+.*?\s+from\s+['"][^'"]+['"];?/g, '')
        .replace(/export\s+default\s+/g, '')
        .replace(/export\s+/g, '');

      // Check main component name
      let componentName = 'App';
      if (cleanCode.includes('function App')) componentName = 'App';
      else if (cleanCode.includes('const App')) componentName = 'App';
      else {
        const match = cleanCode.match(/function\s+([A-Z][a-zA-Z0-9_]*)/);
        if (match && match[1]) componentName = match[1];
      }

      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Anticeil Build Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    #root { min-height: 100vh; }
  </style>
</head>
<body class="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
  <div id="root"></div>

  <script type="text/babel" data-presets="react,stage-3">
    const { useState, useEffect, useRef, useMemo, useCallback } = React;

    window.onerror = function(msg, url, line) {
      const el = document.getElementById('root');
      if (el) {
        el.innerHTML = '<div style="padding: 20px; color: #ef4444; font-family: monospace; background: #fee2e2; border: 1px solid #f87171; border-radius: 8px; margin: 16px;"><strong>Runtime Error:</strong> ' + msg + ' (Line ' + line + ')</div>';
      }
      return false;
    };

    try {
      ${cleanCode}

      if (typeof ${componentName} !== 'undefined') {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(${componentName}));
      } else {
        document.getElementById('root').innerHTML = '<div style="padding: 20px; color: #f59e0b; font-family: sans-serif;">Component ${componentName} rendered successfully.</div>';
      }
    } catch(err) {
      document.getElementById('root').innerHTML = '<div style="padding: 20px; color: #ef4444; font-family: monospace; background: #fee2e2; border: 1px solid #f87171; border-radius: 8px; margin: 16px;"><strong>Compilation Error:</strong> ' + err.message + '</div>';
    }
  </script>
</body>
</html>
      `;
    }

    // 3. Full HTML or HTML Snippet
    if (raw.includes('<!DOCTYPE html>') || raw.includes('<html')) {
      return raw;
    }

    // Wrap plain HTML / JS / Canvas snippet with modern utilities
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Anticeil Build Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen p-4">
  ${raw}
</body>
</html>
    `;
  }, [activeArtifact, reloadKey]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!activeArtifact?.code) return;
    navigator.clipboard.writeText(activeArtifact.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!activeArtifact?.code) return;
    const blob = new Blob([activeArtifact.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ext = activeArtifact.language === 'tsx' || activeArtifact.language === 'jsx' ? 'tsx' : 'html';
    a.href = url;
    a.download = `anticeil_build_${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePopout = () => {
    if (!iframeSrcDoc) return;
    const newWin = window.open('', '_blank');
    if (newWin) {
      newWin.document.open();
      newWin.document.write(iframeSrcDoc);
      newWin.document.close();
    }
  };

  const handleSampleStarter = (
    type: 'game' | 'dashboard' | 'calc' | 'pdf' | 'xlsx' | 'docx' | 'pptx'
  ) => {
    if (type === 'game') {
      openArtifact(
        `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    canvas { background: #111827; display: block; margin: 0 auto; border-radius: 12px; }
  </style>
</head>
<body class="bg-slate-900 text-white flex flex-col items-center justify-center min-h-screen p-4 select-none">
  <div class="text-center mb-4">
    <h1 class="text-2xl font-bold text-emerald-400">🐍 Classic Snake Game</h1>
    <p class="text-xs text-slate-400 mt-1">Use Arrow Keys or WASD to navigate</p>
    <div class="mt-2 text-lg font-semibold">Score: <span id="score" class="text-amber-400">0</span></div>
  </div>

  <canvas id="gameCanvas" width="340" height="340"></canvas>

  <div class="mt-4 flex gap-2">
    <button id="resetBtn" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-bold shadow-lg transition">Restart Game</button>
  </div>

  <script>
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const grid = 17;
    let count = 0;
    let score = 0;

    let snake = { x: 136, y: 136, dx: grid, dy: 0, cells: [], maxCells: 4 };
    let apple = { x: 68, y: 68 };

    function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min)) + min;
    }

    function loop() {
      requestAnimationFrame(loop);
      if (++count < 6) return;
      count = 0;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      snake.x += snake.dx;
      snake.y += snake.dy;

      if (snake.x < 0) snake.x = canvas.width - grid;
      else if (snake.x >= canvas.width) snake.x = 0;
      if (snake.y < 0) snake.y = canvas.height - grid;
      else if (snake.y >= canvas.height) snake.y = 0;

      snake.cells.unshift({ x: snake.x, y: snake.y });
      if (snake.cells.length > snake.maxCells) snake.cells.pop();

      // Draw Apple
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(apple.x + grid/2, apple.y + grid/2, grid/2 - 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw Snake
      ctx.fillStyle = '#10b981';
      snake.cells.forEach((cell, index) => {
        ctx.fillRect(cell.x + 1, cell.y + 1, grid - 2, grid - 2);

        if (cell.x === apple.x && cell.y === apple.y) {
          snake.maxCells++;
          score += 10;
          document.getElementById('score').innerText = score;
          apple.x = getRandomInt(0, 20) * grid;
          apple.y = getRandomInt(0, 20) * grid;
        }

        for (let i = index + 1; i < snake.cells.length; i++) {
          if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
            snake.x = 136; snake.y = 136; snake.cells = [];
            snake.maxCells = 4; snake.dx = grid; snake.dy = 0;
            score = 0;
            document.getElementById('score').innerText = score;
          }
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' && snake.dx === 0) { snake.dx = -grid; snake.dy = 0; }
      else if (e.key === 'ArrowUp' && snake.dy === 0) { snake.dy = -grid; snake.dx = 0; }
      else if (e.key === 'ArrowRight' && snake.dx === 0) { snake.dx = grid; snake.dy = 0; }
      else if (e.key === 'ArrowDown' && snake.dy === 0) { snake.dy = grid; snake.dx = 0; }
    });

    document.getElementById('resetBtn').onclick = () => {
      snake.x = 136; snake.y = 136; snake.cells = [];
      snake.maxCells = 4; snake.dx = grid; snake.dy = 0;
      score = 0;
      document.getElementById('score').innerText = score;
    };

    requestAnimationFrame(loop);
  </script>
</body>
</html>`,
        'html',
        'Snake Game'
      );
    } else if (type === 'dashboard') {
      openArtifact(
        `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-slate-950 text-slate-100 p-6 min-h-screen">
  <div class="max-w-4xl mx-auto space-y-6">
    <header class="flex justify-between items-center border-b border-slate-800 pb-4">
      <div>
        <h1 class="text-2xl font-black tracking-tight text-white flex items-center gap-2">
          <span class="text-blue-500">⚡</span> AI Performance Analytics
        </h1>
        <p class="text-xs text-slate-400 mt-1">Live Multi-Model Token Throughput & Cost Ratio</p>
      </div>
      <span class="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold">
        100% Client-Side
      </span>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div class="text-xs text-slate-400">Peak Speed</div>
        <div class="text-2xl font-black text-amber-400 mt-1">502 tok/s</div>
        <div class="text-xs text-emerald-400 mt-2">↑ Groq LPU Engine</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div class="text-xs text-slate-400">Monthly Savings</div>
        <div class="text-2xl font-black text-blue-400 mt-1">98.4%</div>
        <div class="text-xs text-slate-400 mt-2">vs $20/mo flat SaaS</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div class="text-xs text-slate-400">Active Pipeline</div>
        <div class="text-2xl font-black text-purple-400 mt-1">Zero Proxy</div>
        <div class="text-xs text-slate-400 mt-2">AES-256 Client Vault</div>
      </div>
    </div>

    <div class="bg-slate-900 border border-slate-800 p-5 rounded-xl">
      <h3 class="text-sm font-bold text-slate-200 mb-4">Throughput Comparison (Tokens / Second)</h3>
      <canvas id="speedChart" height="120"></canvas>
    </div>
  </div>

  <script>
    const ctx = document.getElementById('speedChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Groq LPU', 'GPT-4o Mini', 'Claude 3.7', 'DeepSeek-R1', 'Ollama Local'],
        datasets: [{
          label: 'Tokens/Sec',
          data: [498, 142, 98, 86, 65],
          backgroundColor: ['#FDAB3D', '#10B981', '#0073EA', '#A855F7', '#3B82F6'],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
          x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
        }
      }
    });
  </script>
</body>
</html>`,
        'html',
        'Analytics Dashboard'
      );
    } else if (type === 'calc') {
      openArtifact(
        `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-white min-h-screen flex items-center justify-center p-4">
  <div class="w-full max-w-xs bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
    <div class="text-xs font-bold text-slate-400 text-center uppercase tracking-wider">Smart Calculator</div>
    <div id="display" class="bg-slate-900 text-right p-4 rounded-xl text-3xl font-mono font-bold text-emerald-400 overflow-hidden">0</div>
    <div class="grid grid-cols-4 gap-2">
      <button onclick="clearDisplay()" class="p-3 bg-rose-900/40 text-rose-300 font-bold rounded-lg hover:bg-rose-900/60">C</button>
      <button onclick="append('/')" class="p-3 bg-slate-800 text-blue-400 font-bold rounded-lg hover:bg-slate-700">÷</button>
      <button onclick="append('*')" class="p-3 bg-slate-800 text-blue-400 font-bold rounded-lg hover:bg-slate-700">×</button>
      <button onclick="append('-')" class="p-3 bg-slate-800 text-blue-400 font-bold rounded-lg hover:bg-slate-700">-</button>
      <button onclick="append('7')" class="p-3 bg-slate-900 font-bold rounded-lg hover:bg-slate-800">7</button>
      <button onclick="append('8')" class="p-3 bg-slate-900 font-bold rounded-lg hover:bg-slate-800">8</button>
      <button onclick="append('9')" class="p-3 bg-slate-900 font-bold rounded-lg hover:bg-slate-800">9</button>
      <button onclick="append('+')" class="p-3 bg-slate-800 text-blue-400 font-bold rounded-lg hover:bg-slate-700">+</button>
      <button onclick="append('4')" class="p-3 bg-slate-900 font-bold rounded-lg hover:bg-slate-800">4</button>
      <button onclick="append('5')" class="p-3 bg-slate-900 font-bold rounded-lg hover:bg-slate-800">5</button>
      <button onclick="append('6')" class="p-3 bg-slate-900 font-bold rounded-lg hover:bg-slate-800">6</button>
      <button onclick="calculate()" class="row-span-2 p-3 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-lg flex items-center justify-center text-xl shadow-lg">=</button>
      <button onclick="append('1')" class="p-3 bg-slate-900 font-bold rounded-lg hover:bg-slate-800">1</button>
      <button onclick="append('2')" class="p-3 bg-slate-900 font-bold rounded-lg hover:bg-slate-800">2</button>
      <button onclick="append('3')" class="p-3 bg-slate-900 font-bold rounded-lg hover:bg-slate-800">3</button>
      <button onclick="append('0')" class="col-span-2 p-3 bg-slate-900 font-bold rounded-lg hover:bg-slate-800">0</button>
      <button onclick="append('.')" class="p-3 bg-slate-900 font-bold rounded-lg hover:bg-slate-800">.</button>
    </div>
  </div>
  <script>
    let current = '0';
    function update() { document.getElementById('display').innerText = current; }
    function clearDisplay() { current = '0'; update(); }
    function append(val) {
      if (current === '0' && val !== '.') current = val;
      else current += val;
      update();
    }
    function calculate() {
      try { current = String(eval(current)); } catch { current = 'Error'; }
      update();
    }
  </script>
</body>
</html>`,
        'html',
        'Smart Calculator'
      );
    } else if (type === 'pdf') {
      openArtifact('PDF_DOC', 'pdf', 'Technical Architecture Whitepaper.pdf');
    } else if (type === 'xlsx') {
      openArtifact('XLSX_DOC', 'xlsx', 'Financial Revenue & EBITDA Model.xlsx');
    } else if (type === 'docx') {
      openArtifact('DOCX_DOC', 'docx', 'Project Scope of Work & Deliverables.docx');
    } else if (type === 'pptx') {
      openArtifact('PPTX_DOC', 'pptx', 'Anticeil Enterprise Pitch Deck.pptx');
    }
  };

  // Viewport width styling
  const viewportWidth =
    viewport === 'mobile' ? '375px' : viewport === 'tablet' ? '768px' : '100%';

  return (
    <aside
      aria-label={tb.title}
      className="build-preview-panel"
      style={{
        width: isFullscreen ? '100%' : '50%',
        minWidth: isFullscreen ? '100%' : '380px',
        maxWidth: isFullscreen ? '100%' : '65%',
        height: '100%',
        backgroundColor: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-strong)',
        display: 'flex',
        flexDirection: 'column',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        right: isFullscreen ? 0 : 'auto',
        bottom: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 999 : 20,
        boxShadow: 'var(--shadow-lg)',
        transition: 'width 0.2s ease',
      }}
    >
      {/* 1. Header Toolbar */}
      <div
        style={{
          height: '48px',
          padding: '0 12px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-main)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        {/* Left: Mode Title & View Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              fontSize: '13px',
              color: 'var(--text-primary)',
            }}
          >
            <Zap size={15} color="var(--brand-primary)" />
            <span className="hide-on-mobile">{tb.title}</span>
          </div>

          {/* View Mode Toggle: Preview vs Code */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-subtle)',
              padding: '2px',
              borderRadius: 'var(--radius-md, 6px)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: viewMode === 'preview' ? 'var(--bg-surface)' : 'transparent',
                color: viewMode === 'preview' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: viewMode === 'preview' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <Eye size={13} />
              <span>{tb.previewTab}</span>
            </button>
            {/* Code Tab is ONLY visible for executable web/code artifacts, NOT for binary documents */}
            {!isDocument && (
              <button
                type="button"
                onClick={() => setViewMode('code')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: viewMode === 'code' ? 'var(--bg-surface)' : 'transparent',
                  color: viewMode === 'code' ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: viewMode === 'code' ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <Code2 size={13} />
                <span>{tb.codeTab}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setViewMode('browser')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: viewMode === 'browser' ? 'var(--bg-surface)' : 'transparent',
                color: viewMode === 'browser' ? 'var(--brand-primary)' : 'var(--text-muted)',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: viewMode === 'browser' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <Globe size={13} />
              <span>{tb.browserTab || 'Agent Browser'}</span>
            </button>
          </div>
        </div>

        {/* Center: Viewport Switcher (Only in Preview Mode) */}
        {viewMode === 'preview' && activeArtifact && (
          <div
            className="hide-on-mobile"
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-subtle)',
              padding: '2px',
              borderRadius: 'var(--radius-md, 6px)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              title={tb.desktopView}
              style={{
                padding: '4px 6px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: viewport === 'desktop' ? 'var(--bg-surface)' : 'transparent',
                color: viewport === 'desktop' ? 'var(--brand-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <Monitor size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewport('tablet')}
              title={tb.tabletView}
              style={{
                padding: '4px 6px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: viewport === 'tablet' ? 'var(--bg-surface)' : 'transparent',
                color: viewport === 'tablet' ? 'var(--brand-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <Tablet size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              title={tb.mobileView}
              style={{
                padding: '4px 6px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: viewport === 'mobile' ? 'var(--bg-surface)' : 'transparent',
                color: viewport === 'mobile' ? 'var(--brand-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <Smartphone size={14} />
            </button>
          </div>
        )}

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {activeArtifact && (
            <>
              {/* Reload */}
              <button
                type="button"
                onClick={triggerReload}
                title={tb.reload}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '5px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <RotateCw size={14} />
              </button>

              {/* Popout */}
              <button
                type="button"
                onClick={handlePopout}
                title={tb.openInNewTab}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '5px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ExternalLink size={14} />
              </button>

              {/* Download */}
              <button
                type="button"
                onClick={handleDownload}
                title={tb.download}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '5px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Download size={14} />
              </button>

              {/* Fullscreen */}
              <button
                type="button"
                onClick={toggleFullscreen}
                title={tb.fullscreen}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '5px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            </>
          )}

          {/* Close */}
          <button
            type="button"
            onClick={close}
            title={tb.close}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '5px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* 1.5 Artifact Navigation & Info Bar (When artifact is active) */}
      {activeArtifact && (
        <div
          style={{
            padding: '7px 12px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            flexWrap: 'wrap',
            zIndex: 15,
            position: 'relative',
          }}
        >
          {/* Left: Back to Hub + Active File Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
            <button
              type="button"
              onClick={resetToHub}
              className="clickable-pill"
              title={language === 'id' ? 'Kembali ke Katalog Menu Contoh' : 'Back to Example Demos Hub'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-primary)',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <ArrowLeft size={12} color="var(--brand-primary)" />
              <span>{language === 'id' ? 'Menu Contoh' : 'Demos Hub'}</span>
            </button>

            <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border-subtle)', flexShrink: 0 }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
              {['pdf', 'xlsx', 'docx', 'pptx'].includes(activeArtifact.language) ? (
                <FileText size={14} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
              ) : (
                <FileCode size={14} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
              )}
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {activeArtifact.title || 'Interactive Preview'}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(0, 115, 234, 0.1)',
                  color: 'var(--brand-primary)',
                  flexShrink: 0,
                }}
              >
                {activeArtifact.language}
              </span>
            </div>
          </div>

          {/* Right: Carousel Navigation (< 1 of 4 >) + Quick Switcher */}
          {artifacts.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, position: 'relative' }}>
              <button
                type="button"
                onClick={goToPreviousArtifact}
                disabled={currentIndex <= 0}
                title={language === 'id' ? 'Artifact Sebelumnya' : 'Previous Preview'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '5px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: currentIndex <= 0 ? 'transparent' : 'var(--bg-subtle)',
                  color: currentIndex <= 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: currentIndex <= 0 ? 'not-allowed' : 'pointer',
                  opacity: currentIndex <= 0 ? 0.35 : 1,
                  padding: 0,
                }}
              >
                <ChevronLeft size={14} />
              </button>

              {/* Artifact Index Dropdown Trigger */}
              <button
                type="button"
                onClick={() => setShowArtifactList(!showArtifactList)}
                title={language === 'id' ? 'Lihat Semua Dokumen & Kode' : 'View All Previews'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '5px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Layers size={11} color="var(--brand-primary)" />
                <span>{currentIndex + 1} / {artifacts.length}</span>
              </button>

              <button
                type="button"
                onClick={goToNextArtifact}
                disabled={currentIndex >= artifacts.length - 1}
                title={language === 'id' ? 'Artifact Selanjutnya' : 'Next Preview'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '5px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: currentIndex >= artifacts.length - 1 ? 'transparent' : 'var(--bg-subtle)',
                  color: currentIndex >= artifacts.length - 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: currentIndex >= artifacts.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: currentIndex >= artifacts.length - 1 ? 0.35 : 1,
                  padding: 0,
                }}
              >
                <ChevronRight size={14} />
              </button>

              {/* Dropdown Menu of all artifacts */}
              {showArtifactList && (
                <div
                  style={{
                    position: 'absolute',
                    top: '30px',
                    right: 0,
                    width: '240px',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-md, 8px)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 100,
                    padding: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <div style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {language === 'id' ? 'Riwayat Preview Sesi' : 'Session Previews'}
                  </div>
                  {artifacts.map((art, idx) => {
                    const isCur = idx === currentIndex;
                    return (
                      <button
                        key={art.id || idx}
                        type="button"
                        onClick={() => {
                          goToArtifactIndex(idx);
                          setShowArtifactList(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          padding: '6px 8px',
                          borderRadius: '5px',
                          border: 'none',
                          backgroundColor: isCur ? 'rgba(0, 115, 234, 0.1)' : 'transparent',
                          color: isCur ? 'var(--brand-primary)' : 'var(--text-primary)',
                          fontSize: '11.5px',
                          fontWeight: isCur ? 700 : 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {idx + 1}. {art.title}
                        </span>
                        <span style={{ fontSize: '9.5px', textTransform: 'uppercase', color: 'var(--text-muted)', flexShrink: 0 }}>
                          {art.language}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. Main Content Canvas */}
      <div
        style={{
          flex: 1,
          backgroundColor: 'var(--bg-subtle)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          padding: viewport !== 'desktop' && viewMode === 'preview' && activeArtifact ? '16px' : '0',
        }}
      >
        {viewMode === 'browser' ? (
          <LiveBrowserRunner />
        ) : activeArtifact ? (
          ['pdf', 'xlsx', 'docx', 'pptx', 'csv'].includes(activeArtifact.language) ? (
            /* Multi-Format Document Viewer */
            <DocumentViewer
              type={activeArtifact.language as DocumentType}
              title={activeArtifact.title || 'Document Preview'}
            />
          ) : viewMode === 'preview' ? (
            /* Live Sandbox Preview iframe */
            <div
              style={{
                width: viewportWidth,
                maxWidth: '100%',
                height: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: viewport !== 'desktop' ? '16px' : '0',
                overflow: 'hidden',
                boxShadow:
                  viewport !== 'desktop'
                    ? '0 20px 40px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.1)'
                    : 'none',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
              }}
            >
              <iframe
                key={reloadKey}
                srcDoc={iframeSrcDoc}
                sandbox="allow-scripts allow-modals allow-downloads allow-same-origin"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  backgroundColor: '#FFFFFF',
                }}
                title={activeArtifact.title || 'Interactive Preview'}
              />
            </div>
          ) : (
            /* Source Code View */
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'var(--bg-main)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '8px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--bg-surface)',
                }}
              >
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                  {activeArtifact.language.toUpperCase()} • {activeArtifact.code.split('\n').length} lines
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-main)',
                    color: copied ? 'var(--accent-success)' : 'var(--text-primary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <pre
                style={{
                  flex: 1,
                  margin: 0,
                  padding: '16px',
                  overflow: 'auto',
                  fontSize: '13px',
                  lineHeight: 1.55,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'var(--text-primary)',
                }}
              >
                <code>{activeArtifact.code}</code>
              </pre>
            </div>
          )
        ) : (
          /* Empty State - Grok / Claude Artifacts Style */
          <div
            style={{
              padding: '32px 24px',
              maxWidth: '480px',
              width: '100%',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(0, 115, 234, 0.15), rgba(162, 93, 220, 0.15))',
                border: '1px solid rgba(0, 115, 234, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-primary)',
              }}
            >
              <Sparkles size={24} />
            </div>

            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {tb.emptyTitle}
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                {tb.emptyDesc}
              </p>
            </div>

            {/* Riwayat Preview Sesi Jika Ada */}
            {artifacts.length > 0 && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {language === 'id' ? '⚡ Riwayat Preview Sesi Ini' : '⚡ Session Previews'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {artifacts.map((art, idx) => (
                    <button
                      key={art.id || idx}
                      type="button"
                      onClick={() => goToArtifactIndex(idx)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ color: 'var(--brand-primary)' }}>#{idx + 1}</span>
                      <span>{art.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', width: '100%', marginTop: '4px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left' }}>
                {tb.samplePrompt}
              </div>

              {/* 1. Realtime Browser Runner */}
              <button
                type="button"
                onClick={() => setViewMode('browser')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md, 8px)',
                  border: '1px solid rgba(0, 115, 234, 0.3)',
                  backgroundColor: 'rgba(0, 115, 234, 0.08)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={14} color="var(--brand-primary)" />
                  <span>🌐 Realtime Agent Browser Runner</span>
                </span>
                <span style={{ fontSize: '11px', color: 'var(--brand-primary)', fontWeight: 700 }}>Launch →</span>
              </button>

              {/* 2. PDF Document Preview */}
              <button
                type="button"
                onClick={() => handleSampleStarter('pdf')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md, 8px)',
                  border: '1px solid var(--border-strong)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>📄 Technical Whitepaper (PDF Document)</span>
                <span style={{ fontSize: '11px', color: 'var(--brand-primary)' }}>Preview →</span>
              </button>

              {/* 3. Excel Spreadsheet Preview */}
              <button
                type="button"
                onClick={() => handleSampleStarter('xlsx')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md, 8px)',
                  border: '1px solid var(--border-strong)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>📊 Financial Revenue Model (Excel Spreadsheet)</span>
                <span style={{ fontSize: '11px', color: 'var(--brand-primary)' }}>Preview →</span>
              </button>

              {/* 4. PowerPoint Slide Deck Preview */}
              <button
                type="button"
                onClick={() => handleSampleStarter('pptx')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md, 8px)',
                  border: '1px solid var(--border-strong)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>📽 Enterprise Pitch Deck (PowerPoint Slides)</span>
                <span style={{ fontSize: '11px', color: 'var(--brand-primary)' }}>Preview →</span>
              </button>

              {/* 5. Playable App Game */}
              <button
                type="button"
                onClick={() => handleSampleStarter('game')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md, 8px)',
                  border: '1px solid var(--border-strong)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>🎮 Playable Snake Game</span>
                <span style={{ fontSize: '11px', color: 'var(--brand-primary)' }}>Launch →</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
