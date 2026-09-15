'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Code2,
  Terminal,
  Sparkles,
  ShieldCheck,
  Zap,
  Cpu,
  Layers,
  FileCode,
  FileText,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Lock,
  GitBranch,
  RefreshCw,
  Sliders,
  Send,
  Wand2,
  Workflow,
  HelpCircle,
  Clock,
  Play,
  Share2,
} from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { toast } from '../../../shared/hooks/useToast';
import { copyToClipboard } from '../../../shared/utils/clipboardUtils';

interface CodeLandingViewProps {
  onJoinWaitlist?: () => void;
}

export function CodeLandingView({}: CodeLandingViewProps = {}) {
  const language = useSettingsStore((s) => s.language);
  const isId = language === 'id';

  // Waitlist state
  const [email, setEmail] = useState('');
  const [githubHandle, setGithubHandle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(1482);

  // Interactive VS Code Simulator Tab state
  const [activeCodeTab, setActiveCodeTab] = useState<'fullstack' | 'latex' | 'typst'>('fullstack');
  const [activeSimulatorStep, setActiveSimulatorStep] = useState<number>(2);

  // Copied install command feedback
  const [copiedCmd, setCopiedCmd] = useState(false);

  // FAQ expanded state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  useEffect(() => {
    // Check if user already joined waitlist in local storage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('anticeil_code_waitlist_joined');
      if (saved) {
        setIsJoined(true);
      }
    }
  }, []);

  const handleCopyInstallCmd = () => {
    const cmd = 'code --install-extension anticeil.anticeil-code';
    copyToClipboard(cmd, isId ? 'Perintah instalasi disalin!' : 'Install command copied!');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2500);
  };

  const handleJoinWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      toast.error(isId ? 'Mohon masukkan alamat email yang valid' : 'Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsJoined(true);
      setWaitlistCount((prev) => prev + 1);
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'anticeil_code_waitlist_joined',
          JSON.stringify({ email: cleanEmail, github: githubHandle.trim(), date: Date.now() })
        );
      }
      toast.success(
        isId
          ? '🎉 Selamat! Anda telah terdaftar dalam Anticeil Code Beta Early Access.'
          : '🎉 Welcome aboard! You have joined the Anticeil Code Beta Early Access.'
      );
    }, 600);
  };

  // Code Simulation Mock Data
  const simulationData = {
    fullstack: {
      file: 'src/features/docs/solver.ts',
      lang: 'typescript',
      diffOld: `export async function verifyAndApplyDocDiff(docId: string, diff: string) {
  // Legacy: direct full overwrite without surgical tolerance
  const doc = await fetchDoc(docId);
  return applyFullContent(doc, diff);
}`,
      diffNew: `export async function verifyAndApplyDocDiff(docId: string, diff: string) {
  // Anticeil AST Verification & Surgical Whitespace-Tolerant Patch
  const doc = await getDocContext(docId);
  const verified = await runAstLinter(diff, doc.syntaxMode);
  if (!verified.isValid) throw new DocLinterError(verified.issues);
  return applySurgicalPatch(doc.tree, verified.fixedCode);
}`,
      actionDesc: isId
        ? 'AI Co-Author mereparasi AST type check dan menerapkan patch multi-file tanpa halusinasi.'
        : 'AI Co-Author verified AST syntax and applied surgical multi-file patch with zero hallucinations.',
    },
    latex: {
      file: 'papers/quantum_agents.tex',
      lang: 'latex',
      diffOld: `\\section{Quantum State Formulations}
% Missing equation align environment
E = mc^2 \\quad \\psi(x,t) = A e^{i(kx - \\omega t)}`,
      diffNew: `\\section{Quantum State Formulations}
\\begin{equation}
  \\label{eq:quantum_state}
  \\psi(x,t) = A e^{i(kx - \\omega t)} \\implies \\hat{H}\\psi = i\\hbar \\frac{\\partial\\psi}{\\partial t}
\\end{equation}
% Auto-repaired by Anticeil LaTeX Verification Engine`,
      actionDesc: isId
        ? 'AI Co-Author memperbaiki environment LaTeX math, label referensi, dan kompilasi otomatis.'
        : 'AI Co-Author auto-repaired LaTeX math environments, reference labels, and build diagnostics.',
    },
    typst: {
      file: 'reports/architecture.typ',
      lang: 'typst',
      diffOld: `#let title = "Anticeil Agent Architecture"
= Introduction
We introduce the BYOK multi-agent runtime.`,
      diffNew: `#import "@preview/ilm:1.4.0": *
#show: ilm.with(
  title: [Anticeil Agent Architecture],
  author: "Anticeil Labs",
  abstract: [Zero-telemetry local-first co-author runtime for VS Code.],
)
= Introduction
We introduce the BYOK multi-agent runtime featuring surgical patch diffs.`,
      actionDesc: isId
        ? 'AI Co-Author mengimpor package Typst modern dan menyusun template publikasi otomatis.'
        : 'AI Co-Author imported modern Typst packages and scaffolded publication templates.',
    },
  };

  const currentSim = simulationData[activeCodeTab];

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99, 102, 241, 0.12), transparent 70%), var(--bg-main)',
        color: 'var(--text-primary)',
        padding: '0 0 80px 0',
      }}
    >
      {/* ── Top Ambient Hero Glow Banner ── */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '48px 24px 24px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Release Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 14px',
            borderRadius: '999px',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            color: '#a5b4fc',
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '20px',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.15)',
          }}
        >
          <Sparkles size={14} color="#818cf8" />
          <span>{isId ? 'Ekstensi VS Code Resmi • Ditenagai Engine AI Co-Author' : 'Official VS Code Extension • Powered by AI Co-Author Engine'}</span>
          <span
            style={{
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '4px',
              background: '#6366f1',
              color: '#ffffff',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            Coming Soon
          </span>
        </div>

        {/* Hero Title */}
        <h1
          style={{
            fontSize: 'clamp(36px, 5.5vw, 64px)',
            fontWeight: 800,
            letterSpacing: '-0.035em',
            lineHeight: 1.1,
            margin: '0 0 20px 0',
            maxWidth: '960px',
            background: 'linear-gradient(180deg, #ffffff 30%, rgba(255, 255, 255, 0.65) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {isId ? (
            <>
              Kekuatan <span style={{ background: 'linear-gradient(90deg, #818cf8, #c084fc, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Docs Studio & AI Co-Author</span> Langsung di VS Code Anda.
            </>
          ) : (
            <>
              The <span style={{ background: 'linear-gradient(90deg, #818cf8, #c084fc, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Agentic AI Co-Author</span> Built Directly Into Your VS Code.
            </>
          )}
        </h1>

        {/* Hero Subtitle */}
        <p
          style={{
            fontSize: 'clamp(15px, 1.8vw, 18px)',
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
            maxWidth: '780px',
            margin: '0 auto 36px auto',
          }}
        >
          {isId
            ? 'Anticeil Code membawa kecerdasan manipulasi multi-file (<create_file>, <patch_file>), verifikasi linter AST real-time, dan kebebasan 100% BYOK privat langsung ke editor favorit Anda. Tanpa telemetri pihak ketiga.'
            : 'Anticeil Code brings surgical multi-file agentic editing, real-time AST verification diagnostics, and 100% private zero-telemetry BYOK flexibility straight to VS Code and Cursor.'}
        </p>

        {/* Waitlist Box & Quick Command Bar */}
        <div
          style={{
            width: '100%',
            maxWidth: '560px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            marginBottom: '40px',
          }}
        >
          {!isJoined ? (
            <form
              onSubmit={handleJoinWaitlist}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                padding: '6px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: '12px',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
              }}
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isId ? 'Masukkan email Anda untuk Early Access...' : 'Enter your email for Early Access...'}
                style={{
                  flex: 1,
                  minWidth: '220px',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: '10px 14px',
                  fontSize: '13.5px',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'wait' : 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                }}
              >
                {isSubmitting ? (
                  <RefreshCw size={15} className="animate-spin" />
                ) : (
                  <>
                    <span>{isId ? 'Daftar Waitlist' : 'Join Waitlist'}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div
              style={{
                padding: '14px 20px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={18} color="#10B981" />
              <span>
                {isId
                  ? 'Anda sudah terdaftar di Beta Early Access! Kami akan mengabari Anda segera.'
                  : 'You are on the Beta Early Access list! We will notify you upon launch.'}
              </span>
            </div>
          )}

          {/* Social Proof & CLI Copy Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '0 4px',
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
              <span>
                <strong style={{ color: 'var(--text-primary)' }}>{waitlistCount.toLocaleString()}</strong> {isId ? 'developer telah bergabung' : 'developers already registered'}
              </span>
            </div>

            {/* Copy Extension Command */}
            <button
              type="button"
              onClick={handleCopyInstallCmd}
              title="Copy VS Code Extension install CLI"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: copiedCmd ? '#10B981' : 'var(--text-secondary)',
                fontSize: '11.5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Terminal size={12} color="var(--rail-code-color, #818cf8)" />
              <code>code --install-extension anticeil</code>
              {copiedCmd ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
            </button>
          </div>
        </div>

        {/* ── Interactive VS Code Live Mockup / Simulator ── */}
        <div
          style={{
            width: '100%',
            maxWidth: '1080px',
            margin: '20px auto 0 auto',
            borderRadius: '16px',
            background: '#121214',
            border: '1px solid var(--border-strong)',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 0 40px rgba(99, 102, 241, 0.1)',
            overflow: 'hidden',
            textAlign: 'left',
          }}
        >
          {/* Editor Top Bar (Window Controls & Tabs) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#18181b',
              borderBottom: '1px solid var(--border-subtle)',
              padding: '8px 16px',
              fontSize: '12px',
            }}
          >
            {/* Traffic Lights */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ marginLeft: '12px', color: 'var(--text-muted)', fontSize: '11.5px', fontWeight: 500 }}>
                Anticeil Code • VS Code Workspace Simulation
              </span>
            </div>

            {/* Mode Switcher Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '6px' }}>
              <button
                type="button"
                onClick={() => setActiveCodeTab('fullstack')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  background: activeCodeTab === 'fullstack' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                  color: activeCodeTab === 'fullstack' ? '#a5b4fc' : 'var(--text-muted)',
                  fontSize: '11.5px',
                  fontWeight: activeCodeTab === 'fullstack' ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                <FileCode size={12} />
                <span>Full-Stack TS</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeTab('latex')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  background: activeCodeTab === 'latex' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                  color: activeCodeTab === 'latex' ? '#a5b4fc' : 'var(--text-muted)',
                  fontSize: '11.5px',
                  fontWeight: activeCodeTab === 'latex' ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                <FileText size={12} />
                <span>LaTeX Paper</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeTab('typst')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  background: activeCodeTab === 'typst' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                  color: activeCodeTab === 'typst' ? '#a5b4fc' : 'var(--text-muted)',
                  fontSize: '11.5px',
                  fontWeight: activeCodeTab === 'typst' ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                <Layers size={12} />
                <span>Typst Document</span>
              </button>
            </div>
          </div>

          {/* Simulator Main Grid: Sidebar (Co-Author Chat) + Code Editor (Diff) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr', minHeight: '380px' }}>
            {/* Left Column: Anticeil Co-Author IDE Sidebar */}
            <div
              style={{
                background: '#141416',
                borderRight: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '16px',
              }}
            >
              <div>
                {/* Agent Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      background: 'rgba(99, 102, 241, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Code2 size={15} color="#818cf8" />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Anticeil Co-Author
                    </div>
                    <div style={{ fontSize: '10px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
                      <span>Ready (Claude 3.7 / DeepSeek V3 BYOK)</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Conversation Bubble */}
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '12px',
                    lineHeight: 1.5,
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ color: 'var(--text-muted)', fontSize: '10.5px', marginBottom: '4px', fontWeight: 600 }}>
                    USER REQUEST
                  </div>
                  <div style={{ color: 'var(--text-primary)' }}>
                    {activeCodeTab === 'fullstack' && 'Fix AST diagnostic errors in doc solver & optimize surgical patches.'}
                    {activeCodeTab === 'latex' && 'Format quantum equations into an aligned numbered block with labels.'}
                    {activeCodeTab === 'typst' && 'Scaffold an academic publication template for Anticeil architecture.'}
                  </div>
                </div>

                {/* Agent Action Box */}
                <div
                  style={{
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '11.5px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a5b4fc', fontWeight: 600, marginBottom: '6px' }}>
                    <Wand2 size={13} />
                    <span>Agent Action & AST Verification</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '11px', lineHeight: 1.45 }}>
                    {currentSim.actionDesc}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '8px',
                      fontSize: '10px',
                      color: '#10b981',
                      background: 'rgba(16, 185, 129, 0.1)',
                      padding: '3px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    <Check size={11} />
                    <span>0 Diagnostic errors • Verification passed</span>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Controls in Mockup */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '16px' }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: '#10b981',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <Check size={12} />
                  <span>Accept Patch</span>
                </button>
                <button
                  type="button"
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                  }}
                >
                  Reject
                </button>
              </div>
            </div>

            {/* Right Column: Code Editor with Surgical Diff View */}
            <div style={{ background: '#0e0e10', display: 'flex', flexDirection: 'column' }}>
              {/* File Tab Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#141416',
                  borderBottom: '1px solid var(--border-subtle)',
                  padding: '6px 14px',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  fontFamily: 'monospace',
                }}
              >
                <FileCode size={13} color="var(--rail-code-color, #818cf8)" />
                <span>{currentSim.file}</span>
                <span
                  style={{
                    fontSize: '9.5px',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#a5b4fc',
                  }}
                >
                  Surgical Diff
                </span>
              </div>

              {/* Diff Code Area */}
              <div
                style={{
                  flex: 1,
                  padding: '16px',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '12.5px',
                  lineHeight: 1.6,
                  overflowX: 'auto',
                }}
              >
                {/* Removed Lines */}
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    borderLeft: '3px solid #ef4444',
                    padding: '6px 10px',
                    borderRadius: '2px',
                    marginBottom: '8px',
                    color: '#fca5a5',
                  }}
                >
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>- {currentSim.diffOld}</pre>
                </div>

                {/* Added Lines */}
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    borderLeft: '3px solid #10b981',
                    padding: '6px 10px',
                    borderRadius: '2px',
                    color: '#86efac',
                  }}
                >
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>+ {currentSim.diffNew}</pre>
                </div>
              </div>

              {/* Status Bar */}
              <div
                style={{
                  background: '#18181b',
                  borderTop: '1px solid var(--border-subtle)',
                  padding: '4px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '10.5px',
                  color: 'var(--text-muted)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <GitBranch size={11} /> main
                  </span>
                  <span>UTF-8</span>
                  <span>{currentSim.lang.toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a5b4fc' }}>
                  <Zap size={11} /> Anticeil Co-Author v0.9 Beta
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 6 Core Pillars Bento Grid ── */}
      <div
        id="features"
        style={{
          maxWidth: '1200px',
          margin: '60px auto 0 auto',
          padding: '0 24px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2
            style={{
              fontSize: 'clamp(26px, 3.5vw, 36px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 12px 0',
            }}
          >
            {isId ? 'Didesain untuk Coding Cepat, Akurat, dan Privat' : 'Engineered for Surgical Speed, Precision, & Privacy'}
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto' }}>
            {isId
              ? 'Arsitektur teruji dari Docs Studio yang dirancang khusus untuk alur kerja VS Code tanpa beban server berlebihan.'
              : 'Proven architecture from Docs Studio reimagined for VS Code without server bloat or privacy compromises.'}
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {/* Card 1: Agentic Multi-File */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: '14px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Workflow size={20} color="#818cf8" />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>
              {isId ? 'Manipulasi Multi-File Agentic' : 'Agentic Multi-File Patching'}
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {isId
                ? 'Co-Author membaca struktur repository, merencanakan perubahan, dan mengeksekusi tag <create_file>, <patch_file>, dan <delete_file> secara otomatis tanpa mengharuskan Anda copy-paste manual.'
                : 'Co-Author parses entire project trees, choreographs multi-step file generation, and surgical whitespace-tolerant line patching across multiple files simultaneously.'}
            </p>
          </div>

          {/* Card 2: Real-Time AST Verification */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: '14px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={20} color="#10B981" />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>
              {isId ? 'Self-Healing AST & Linter Verification' : 'AST Verification & Self-Healing Engine'}
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {isId
                ? 'Sebelum menerapkan kode ke file Anda, engine verifikasi internal otomatis memeriksa syntax, kurung kurawal, environment math LaTeX, dan type error untuk mencegah bug sejak awal.'
                : 'Built-in diagnostic verification intercepts broken syntax, unmatched brackets, broken math environments, and compilation errors before committing patches to disk.'}
            </p>
          </div>

          {/* Card 3: Strict BYOK & 100% Zero-Telemetry */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: '14px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(249, 115, 22, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Lock size={20} color="#f97316" />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>
              {isId ? '100% BYOK & Zero-Telemetry Privacy' : 'Strict BYOK & 100% Zero-Telemetry'}
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {isId
                ? 'Kode dan kunci API Anda tidak pernah disimpan di server Anticeil. Panggilan langsung dari mesin lokal Anda ke OpenRouter, Claude, OpenAI, DeepSeek, atau model lokal Ollama.'
                : 'Direct client-to-provider connectivity. Your source code and proprietary keys are never sent to third-party telemetry servers. Fully compatible with Local Ollama.'}
            </p>
          </div>

          {/* Card 4: LaTeX & Scientific Technical Authoring */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: '14px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={20} color="#38bdf8" />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>
              {isId ? 'Dukungan Kelas Satu LaTeX & Dokumen Ilmiah' : 'First-Class LaTeX, Typst & Technical Papers'}
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {isId
                ? 'Bukan hanya untuk bahasa pemrograman biasa. Anticeil Code memiliki pemahaman mendalam untuk formula matematika, tabel bibtex, slide presentasi, dan format dokumen kompleks.'
                : 'Beyond general code, Anticeil Code excels at writing academic papers, research thesis, math proofs, bibliography references, and slide decks natively in VS Code.'}
            </p>
          </div>

          {/* Card 5: Smithery & MCP Tool Integrations */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: '14px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(168, 85, 247, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Cpu size={20} color="#c084fc" />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>
              {isId ? 'Model Context Protocol (MCP) & Smithery' : 'Model Context Protocol (MCP) & Smithery'}
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {isId
                ? 'Hubungkan server MCP untuk query database, eksekusi command line lokal, penarikan data GitHub PR, dan web scraping otomatis dalam siklus coding Anda.'
                : 'Plug in Smithery and custom MCP servers to give your editor live database introspection, terminal command runners, and GitHub PR context.'}
            </p>
          </div>

          {/* Card 6: Free Rotation Gateway */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: '14px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(234, 179, 8, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Zap size={20} color="#eab308" />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>
              {isId ? 'Pool Kunci Gratis Bawaan (Groq & Gemini)' : 'Built-in Free Rotation Key Pools'}
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {isId
                ? 'Belum punya API key sendiri? Gunakan pool gateway gratis bawaan Anticeil untuk kecepatan inference instan Groq LPU dan kecerdasan Google Gemini tanpa setup rumit.'
                : 'No API key yet? Use our built-in rotating key pool for blazing fast Groq LPU inference and Google Gemini without initial setup barriers.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Feature Comparison Matrix Table ── */}
      <div
        style={{
          maxWidth: '1000px',
          margin: '70px auto 0 auto',
          padding: '0 24px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0' }}>
            {isId ? 'Perbandingan Anticeil Code' : 'Why Developers Choose Anticeil Code'}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {isId ? 'Bagaimana Anticeil Code berbeda dari asisten AI konvensional lainnya.' : 'How Anticeil Code compares to traditional AI coding assistants.'}
          </p>
        </div>

        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: '14px',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 600 }}>Capability</th>
                <th style={{ padding: '14px 18px', color: '#a5b4fc', fontWeight: 700 }}>Anticeil Code</th>
                <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: 500 }}>GitHub Copilot</th>
                <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: 500 }}>Generic IDE Plugins</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: isId ? '100% Zero-Telemetry & BYOK' : '100% Zero-Telemetry & BYOK', a: '✅ Direct Client', b: '❌ Server Proxied', c: '⚠️ Limited' },
                { feature: isId ? 'Surgical Whitespace-Tolerant Patching' : 'Surgical Whitespace-Tolerant Patching', a: '✅ Exact Diffing', b: '❌ Whole file gen', c: '❌ Halusinasi' },
                { feature: isId ? 'AST Diagnostic Self-Healing Linter' : 'AST Diagnostic Self-Healing Linter', a: '✅ Built-in', b: '❌ Not included', c: '❌ None' },
                { feature: isId ? 'LaTeX / Typst / Academic Paper Support' : 'LaTeX / Typst / Academic Paper Support', a: '✅ First-class', b: '⚠️ Basic code only', c: '❌ Poor' },
                { feature: isId ? 'Support Local LLMs (Ollama / LM Studio)' : 'Support Local LLMs (Ollama / LM Studio)', a: '✅ Native 1-Click', b: '❌ Cloud locked', c: '⚠️ Complex setup' },
                { feature: isId ? 'Model Context Protocol (MCP) Bridge' : 'Model Context Protocol (MCP) Bridge', a: '✅ Smithery & Direct', b: '❌ Proprietary', c: '⚠️ Partial' },
              ].map((row, idx) => (
                <tr key={idx} style={{ borderBottom: idx < 5 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <td style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-primary)' }}>{row.feature}</td>
                  <td style={{ padding: '12px 18px', color: '#a5b4fc', fontWeight: 600, background: 'rgba(99, 102, 241, 0.05)' }}>{row.a}</td>
                  <td style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>{row.b}</td>
                  <td style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>{row.c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── FAQ Section (Accordion) ── */}
      <div
        style={{
          maxWidth: '840px',
          margin: '70px auto 0 auto',
          padding: '0 24px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0' }}>
            {isId ? 'Pertanyaan yang Sering Diajukan (FAQ)' : 'Frequently Asked Questions'}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {isId ? 'Semua hal yang perlu Anda ketahui tentang Anticeil Code.' : 'Everything you need to know about the Anticeil Code extension.'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            {
              q: isId ? 'Kapan Anticeil Code akan dirilis ke VS Code Marketplace?' : 'When will Anticeil Code be released on VS Code Marketplace?',
              a: isId
                ? 'Kami sedang dalam tahap finalisasi alpha testing. Anggota waitlist akan mendapatkan akses awal eksklusif dalam gelombang rilis tertutup (Closed Beta) sebelum publikasi resmi di VS Code Marketplace dan Open VSX Registry.'
                : 'We are in final alpha testing. Waitlist members will receive exclusive early access during the closed beta phase before the official public release on VS Code Marketplace and Open VSX Registry.',
            },
            {
              q: isId ? 'Apakah Anticeil Code gratis digunakan?' : 'Is Anticeil Code free to use?',
              a: isId
                ? 'Ya! Ekstensi ini gratis diunduh. Anda bisa menggunakan kunci API Anda sendiri (BYOK) atau memanfaatkan pool gateway gratis bawaan Anticeil.'
                : 'Yes! The extension itself is free to download. You can bring your own API keys (BYOK) or use Anticeil\'s built-in free rotation gateway pools.',
            },
            {
              q: isId ? 'Bagaimana privasi kode saya terjamin?' : 'How is my code privacy guaranteed?',
              a: isId
                ? 'Anticeil Code beroperasi 100% secara lokal. Seluruh prompt dan patch diff dikirimkan langsung dari IDE lokal Anda ke provider AI yang Anda pilih tanpa melalui perantara server kami.'
                : 'Anticeil Code operates 100% locally. All prompts, context trees, and patch diffs are sent directly from your editor to your chosen LLM provider without passing through intermediate proxy servers.',
            },
            {
              q: isId ? 'Apakah ekstensi ini mendukung Cursor dan VSCodium?' : 'Does it support Cursor, Windsurf, and VSCodium?',
              a: isId
                ? 'Ya! Anticeil Code kompatibel dengan seluruh keluarga editor berbasis VS Code, termasuk Cursor, Windsurf, Positron, dan VSCodium.'
                : 'Yes! Anticeil Code is fully compatible with the entire VS Code editor family, including Cursor, Windsurf, Positron, and VSCodium.',
            },
          ].map((item, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span>{item.q}</span>
                  {isOpen ? <ChevronDown size={16} color="var(--text-muted)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
                </button>
                {isOpen && (
                  <div
                    style={{
                      padding: '0 20px 16px 20px',
                      fontSize: '13.5px',
                      lineHeight: 1.6,
                      color: 'var(--text-secondary)',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '12px',
                    }}
                  >
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom Call To Action Banner ── */}
      <div
        style={{
          maxWidth: '960px',
          margin: '70px auto 0 auto',
          padding: '40px 32px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(168, 85, 247, 0.12))',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#6366f1',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)',
          }}
        >
          <Code2 size={24} color="#ffffff" />
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
          {isId ? 'Siap Mengubah Pengalaman Ngoding Anda?' : 'Ready to Elevate Your Coding Workflow?'}
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
          {isId
            ? 'Bergabunglah dengan ribuan developer yang mengutamakan privasi data, verifikasi otomatis, dan kebebasan BYOK.'
            : 'Join thousands of developers building faster with zero telemetry, automated AST verification, and total BYOK control.'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{
              padding: '12px 28px',
              borderRadius: '10px',
              background: '#6366f1',
              border: 'none',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.5)',
              transition: 'transform 0.15s ease',
            }}
          >
            {isId ? 'Daftar Early Access Sekarang' : 'Join Early Access Now'}
          </button>
          <Link
            href="/docs"
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{isId ? 'Coba Docs Studio Web' : 'Try Docs Studio Web'}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
