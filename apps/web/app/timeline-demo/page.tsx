'use client';

import React, { useState, useEffect } from 'react';
import {
  Brain,
  FileCode,
  Search,
  Terminal,
  Sparkles,
  Wrench,
  GitBranch,
  Play,
  CheckCircle2,
} from 'lucide-react';
import {
  Timeline,
  TimelineGroup,
  TimelineStep,
} from '@/shared/components/Timeline';

// ─── Demo Data ───────────────────────────────────────────────────────────────

const chatThinking: TimelineStep[] = [
  { id: 'c1', title: 'Menganalisis pertanyaan', status: 'done' },
  { id: 'c2', title: 'Mencari di knowledge base', status: 'done', icon: <Search size={9} strokeWidth={2.5} /> },
  { id: 'c3', title: 'Menyusun struktur jawaban', status: 'current', icon: <Brain size={9} strokeWidth={2.5} /> },
  { id: 'c4', title: 'Mengekstrak kode & output', status: 'pending' },
];

const docsEditing: TimelineStep[] = [
  {
    id: 'd1', title: 'Memahami konteks dokumen', status: 'done', icon: <FileCode size={9} strokeWidth={2.5} />,
  },
  {
    id: 'd2', title: 'Membuat kerangka perubahan', status: 'done',
    description: 'Memetakan 3 paragraf utama yang akan diperbaiki',
  },
  {
    id: 'd3', title: 'Memperbaiki tata bahasa', status: 'current',
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div>• "Saya pergi ke sekolah" → "Saya pergi ke sekolah."</div>
        <div>• "Mereka sudah pergi." → "Mereka sudah pergi."</div>
        <div>• "Anak itu bermain bola." → tetap (sudah sesuai)</div>
      </div>
    ),
  },
  { id: 'd4', title: 'Menerapkan perubahan ke dokumen', status: 'pending' },
];

const codeBuild: TimelineStep[] = [
  { id: 'b1', title: 'Analisis struktur proyek', status: 'done', icon: <GitBranch size={9} strokeWidth={2.5} /> },
  { id: 'b2', title: 'Menulis kode utama', status: 'done', icon: <FileCode size={9} strokeWidth={2.5} />,
    children: (
      <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '10.5px', color: '#A7F3D0', lineHeight: 1.5 }}>
{`function hello() {
  return "world";
}`}
      </pre>
    )
  },
  { id: 'b3', title: 'Menjalankan test suite', status: 'error', icon: <Terminal size={9} strokeWidth={2.5} />,
    description: '2 test gagal, 18 test passed',
  },
  { id: 'b4', title: 'Memperbaiki error', status: 'current', icon: <Wrench size={9} strokeWidth={2.5} /> },
  { id: 'b5', title: 'Membangun & mendeploy', status: 'pending', icon: <Play size={9} strokeWidth={2.5} /> },
];

const uploadSteps: TimelineStep[] = [
  { id: 'u1', title: 'Memvalidasi file', status: 'done' },
  { id: 'u2', title: 'Mengunggah ke server', status: 'done' },
  { id: 'u3', title: 'Memproses & mengkategorikan', status: 'done' },
  { id: 'u4', title: 'Selesai', status: 'done', icon: <CheckCircle2 size={9} strokeWidth={2.5} /> },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TimelineDemoPage() {
  // Streaming demo — pulses the "current" step
  const [streaming, setStreaming] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setStreaming((p) => !p), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-main)',
        padding: '48px 24px',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans, Inter, sans-serif)',
      }}
    >
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>

        {/* Header */}
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={26} style={{ color: '#6366F1' }} />
            Timeline Component
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px', lineHeight: 1.6 }}>
            Reusable, DRY timeline untuk <strong>ChatPage</strong>, <strong>DocsPage</strong>, dan <strong>AI Co-Author</strong>.
            100% inline styles, CSS variables, tanpa Tailwind. Terinspirasi dari Claude's thinking panel.
          </p>
        </header>

        {/* Demo grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* 1. Chat Thinking — compact */}
          <Card title="ChatPage — AI Thinking (compact mode)">
            <Timeline steps={chatThinking} compact />
          </Card>

          {/* 2. Chat Thinking — full mode with group */}
          <Card title="ChatPage — Worked for 12s (grouped + streaming)">
            <TimelineGroup
              label="Worked for 12s"
              steps={chatThinking.map((s) => ({ ...s, status: streaming && s.id === 'c3' ? 'current' : s.status }))}
              isStreaming={streaming}
              defaultExpanded
            />
          </Card>

          {/* 3. Docs Co-Author — expandable children */}
          <Card title="DocsPage — AI Co-Author (expandable detail)">
            <Timeline steps={docsEditing} />
          </Card>

          {/* 4. Code Build — with error state */}
          <Card title="Build Mode — status: error in step 3">
            <Timeline steps={codeBuild} />
          </Card>

          {/* 5. Upload Flow — all done */}
          <Card title="Upload Flow — all steps done">
            <Timeline steps={uploadSteps} />
          </Card>

          {/* 5b. After streaming finishes — timeline stays expanded, only collapsed by user click */}
          <Card title="Group After Done — timeline stays visible (user-collapsible)">
            <TimelineGroup
              label="Worked for 8s"
              steps={chatThinking.map((s) => ({ ...s, status: 'done' as const }))}
              defaultExpanded
            />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px', fontStyle: 'italic' }}>
              ↑ Klik "Worked for 8s" untuk collapse. Setelah streaming selesai, timeline tetap terbuka sampai user menutupnya sendiri.
            </p>
          </Card>

          {/* 6. Horizontal — progress */}
          <Card title="Horizontal — 4-step progress indicator">
            <Timeline
              steps={chatThinking.slice(0, 4)}
              direction="horizontal"
              showLine
              compact
            />
          </Card>

          {/* 7. Usage code */}
          <Card title="Usage">
            <pre
              style={{
                margin: 0,
                fontFamily: 'monospace',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                overflow: 'auto',
              }}
            >
{`import { Timeline, TimelineGroup, TimelineStep } from '@/shared/components/Timeline';

const steps: TimelineStep[] = [
  { id: '1', title: 'Planning',  status: 'done' },
  { id: '2', title: 'Executing', status: 'current' },
  { id: '3', title: 'Testing',   status: 'pending' },
];

<Timeline steps={steps} compact />`}
            </pre>
          </Card>

        </div>
      </div>
    </div>
  );
}

// ─── Card wrapper ────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        margin: '0 0 10px 0',
      }}>
        {title}
      </h2>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '18px 16px',
      }}>
        {children}
      </div>
    </section>
  );
}
