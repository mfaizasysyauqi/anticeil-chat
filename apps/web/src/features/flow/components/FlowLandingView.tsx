'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Workflow,
  Sparkles,
  Zap,
  Cpu,
  Layers,
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
  Play,
  Share2,
  Database,
  Globe,
  Radio,
  FileText,
  Table,
  Terminal,
  MessageSquare,
  ShieldCheck,
  Code2,
  Bot,
  Boxes,
  Activity,
  CheckCircle,
  HelpCircle,
  Clock,
  KeyRound,
} from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { toast } from '../../../shared/hooks/useToast';
import { copyToClipboard } from '../../../shared/utils/clipboardUtils';

interface FlowLandingViewProps {
  onJoinWaitlist?: () => void;
}

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'ai' | 'condition' | 'action';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
  details: string;
}

interface FlowTemplate {
  id: string;
  title: string;
  titleId: string;
  category: string;
  desc: string;
  descId: string;
  nodes: WorkflowNode[];
  executionTime: string;
}

const FLOW_TEMPLATES: FlowTemplate[] = [
  {
    id: 'ai-triage',
    title: 'AI Customer Support & Auto-Triage',
    titleId: 'Auto-Triage & Dukungan Pelanggan AI',
    category: 'Customer Ops',
    desc: 'Listens to incoming webhook support tickets, runs sentiment analysis with DeepSeek/Claude, drafts contextual response, and alerts Discord.',
    descId: 'Menerima tiket masuk via webhook, analisis sentimen dengan DeepSeek/Claude, draf balasan kontekstual, dan notifikasi ke Discord.',
    executionTime: '820ms',
    nodes: [
      {
        id: 'n1',
        type: 'trigger',
        title: 'Webhook Trigger',
        subtitle: 'POST /api/v1/tickets',
        icon: <Radio size={16} />,
        color: '#10b981',
        badge: 'Trigger',
        details: 'Event: ticket.created with payload { customerId, subject, priority, body }',
      },
      {
        id: 'n2',
        type: 'ai',
        title: 'Anticeil AI Agent',
        subtitle: 'Claude 3.5 Sonnet / BYOK',
        icon: <Bot size={16} />,
        color: '#8b5cf6',
        badge: 'Reasoning',
        details: 'Analyzes urgency, extracts keywords, categorizes issue, and generates empathetic resolution steps.',
      },
      {
        id: 'n3',
        type: 'condition',
        title: 'Urgency Router',
        subtitle: 'Branch: High vs Normal',
        icon: <GitBranch size={16} />,
        color: '#f59e0b',
        badge: 'Logic',
        details: 'If priority == "critical" -> route to VIP On-Call channel, else standard queue.',
      },
      {
        id: 'n4',
        type: 'action',
        title: 'Discord & Sheet Sync',
        subtitle: 'Send Alert & Log Row',
        icon: <Share2 size={16} />,
        color: '#3b82f6',
        badge: 'Action',
        details: 'Posts rich embed card to #support-war-room and appends row to Google Sheet.',
      },
    ],
  },
  {
    id: 'code-review',
    title: 'Autonomous GitHub PR Code Reviewer',
    titleId: 'Reviewer Kode PR GitHub Mandiri',
    category: 'Engineering',
    desc: 'Triggers on PR open, fetches diffs, analyzes security vulnerabilities & test coverage with AI, and posts inline review comments.',
    descId: 'Memicu saat PR dibuka, mengambil diff, memeriksa kerentanan keamanan & cakupan tes dengan AI, lalu memposting komentar review.',
    executionTime: '1.4s',
    nodes: [
      {
        id: 'n1',
        type: 'trigger',
        title: 'GitHub Webhook',
        subtitle: 'pull_request.opened',
        icon: <Globe size={16} />,
        color: '#10b981',
        badge: 'Trigger',
        details: 'Payload contains branch, commit SHA, PR author, and changed files list.',
      },
      {
        id: 'n2',
        type: 'ai',
        title: 'DeepSeek R1 Architecture Reviewer',
        subtitle: 'Security & Clean Code Check',
        icon: <Bot size={16} />,
        color: '#8b5cf6',
        badge: 'Reasoning',
        details: 'Inspects code diff for OWASP top 10, memory leaks, missing error guards, and performance bottlenecks.',
      },
      {
        id: 'n3',
        type: 'action',
        title: 'GitHub PR Commenter',
        subtitle: 'POST /repos/{owner}/issues/comments',
        icon: <Terminal size={16} />,
        color: '#6366f1',
        badge: 'Action',
        details: 'Publishes formatted Markdown review report with code suggestions and score.',
      },
    ],
  },
  {
    id: 'doc-publisher',
    title: 'Multi-Source Knowledge Summarizer',
    titleId: 'Peringkas Pengetahuan Multi-Sumber',
    category: 'Content & Docs',
    desc: 'Collects daily research feeds, cleans formatting, compiles structured executive briefs, and saves directly to Anticeil Docs Studio.',
    descId: 'Mengumpulkan umpan riset harian, menyusun ringkasan eksekutif terstruktur, dan menyimpannya langsung ke Anticeil Docs Studio.',
    executionTime: '950ms',
    nodes: [
      {
        id: 'n1',
        type: 'trigger',
        title: 'Cron Scheduler',
        subtitle: 'Everyday at 08:00 AM UTC',
        icon: <Clock size={16} />,
        color: '#10b981',
        badge: 'Schedule',
        details: 'Recurring cron job initiates batch fetch from RSS and saved article URLs.',
      },
      {
        id: 'n2',
        type: 'ai',
        title: 'Anticeil Synthesis Engine',
        subtitle: 'GPT-4o / Gemini Flash',
        icon: <Bot size={16} />,
        color: '#8b5cf6',
        badge: 'Synthesis',
        details: 'Extracts core insights, cross-references sources, and formats LaTeX / Markdown sections.',
      },
      {
        id: 'n3',
        type: 'action',
        title: 'Anticeil Docs Exporter',
        subtitle: 'Save to /docs Workspace',
        icon: <FileText size={16} />,
        color: '#2563eb',
        badge: 'Storage',
        details: 'Creates a clean document in Anticeil Docs Studio with tags, table of contents, and citations.',
      },
    ],
  },
];

const INTEGRATION_PIECES = [
  { name: 'GitHub', category: 'Dev', icon: '🐙', color: '#f3f4f6' },
  { name: 'Discord', category: 'Chat', icon: '💬', color: '#5865F2' },
  { name: 'Slack', category: 'Chat', icon: '⚡', color: '#4A154B' },
  { name: 'Telegram', category: 'Chat', icon: '✈️', color: '#229ED9' },
  { name: 'OpenAI', category: 'AI', icon: '🧠', color: '#10a37f' },
  { name: 'Anthropic Claude', category: 'AI', icon: '🔮', color: '#d97706' },
  { name: 'DeepSeek', category: 'AI', icon: '🐋', color: '#3b82f6' },
  { name: 'Google Sheets', category: 'Data', icon: '📊', color: '#0F9D58' },
  { name: 'Supabase / Postgres', category: 'Data', icon: '🐘', color: '#3ECF8E' },
  { name: 'Notion', category: 'Productivity', icon: '📝', color: '#ffffff' },
  { name: 'Webhooks & HTTP', category: 'Dev', icon: '🌐', color: '#10b981' },
  { name: 'Cron Scheduler', category: 'Dev', icon: '⏱️', color: '#f59e0b' },
];

export function FlowLandingView({}: FlowLandingViewProps = {}) {
  const language = useSettingsStore((s) => s.language);
  const isId = language === 'id';

  // Waitlist state
  const [email, setEmail] = useState('');
  const [useCase, setUseCase] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(942);

  // Active Flow Template Tab
  const [activeTemplateId, setActiveTemplateId] = useState<string>('ai-triage');
  const activeTemplate = FLOW_TEMPLATES.find((t) => t.id === activeTemplateId) || FLOW_TEMPLATES[0];

  // Interactive Flow Simulator
  const [simulatingStep, setSimulatingStep] = useState<number>(-1);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([]);

  // Selected piece filter
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // FAQ expanded state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('anticeil_flow_waitlist_joined');
      if (saved) {
        setIsJoined(true);
      }
    }
  }, []);

  const handleRunSimulator = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulatingStep(0);
    setSimulatedLogs([`[0ms] 🟢 Trigger received for "${activeTemplate.title}"`]);

    const totalSteps = activeTemplate.nodes.length;

    activeTemplate.nodes.forEach((node, index) => {
      setTimeout(() => {
        setSimulatingStep(index);
        setSimulatedLogs((prev) => [
          ...prev,
          `[+${(index + 1) * 260}ms] ⚡ Step ${index + 1}/${totalSteps}: [${node.title}] -> Success (200 OK)`,
        ]);

        if (index === totalSteps - 1) {
          setTimeout(() => {
            setSimulatingStep(-1);
            setIsSimulating(false);
            setSimulatedLogs((prev) => [
              ...prev,
              `✨ [Complete] Flow executed in ${activeTemplate.executionTime}. All downstream hooks notified.`,
            ]);
            toast.success(
              isId ? 'Simulasi alur kerja selesai dengan sukses!' : 'Workflow simulation completed successfully!'
            );
          }, 400);
        }
      }, (index + 1) * 350);
    });
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
          'anticeil_flow_waitlist_joined',
          JSON.stringify({ email: cleanEmail, useCase: useCase.trim(), date: Date.now() })
        );
      }
      toast.success(
        isId
          ? 'Terima kasih! Anda telah terdaftar di daftar tunggu Anticeil Flow.'
          : 'Thank you! You have joined the Anticeil Flow early access waitlist.'
      );
    }, 600);
  };

  const filteredPieces =
    activeCategory === 'all'
      ? INTEGRATION_PIECES
      : INTEGRATION_PIECES.filter((p) => p.category.toLowerCase() === activeCategory.toLowerCase());

  const faqs = [
    {
      q: isId ? 'Apa itu Anticeil Flow?' : 'What is Anticeil Flow?',
      a: isId
        ? 'Anticeil Flow adalah platform otomatisasi alur kerja visual berbasis AI yang terhubung dengan 200+ aplikasi dan integrasi terbuka. Anda dapat menghubungkan trigger webhook, model AI dengan kunci API pribadi (BYOK), logika branching, dan aksi downstream tanpa perantara server pihak ketiga.'
        : 'Anticeil Flow is a visual AI workflow automation platform connected to 200+ open integration pieces. You can combine webhook triggers, AI reasoning steps with your own API keys (BYOK), conditional logic branching, and downstream actions with zero vendor lock-in.',
    },
    {
      q: isId ? 'Bagaimana Anticeil Flow terhubung dengan Anticeil Chat dan Anticeil Docs?' : 'How does Anticeil Flow connect with Anticeil Chat & Docs?',
      a: isId
        ? 'Semua artefak yang dihasilkan dalam Flow dapat langsung diekspor ke Docs Studio untuk penyusunan laporan, atau dipicu langsung melalui slash command di Anticeil Chat dan Anticeil Code.'
        : 'Any artifact generated within a Flow can be seamlessly piped into Docs Studio for publishing, or triggered directly via slash commands and connectors inside Anticeil Chat and Anticeil Code.',
    },
    {
      q: isId ? 'Apakah Anticeil Flow memerlukan biaya per eksekusi?' : 'Does Anticeil Flow charge per execution or run?',
      a: isId
        ? 'Tidak! Anticeil berpegang teguh pada prinsip Zero Markup & BYOK. Anda hanya membayar langsung ke penyedia model Anda (OpenAI, Anthropic, DeepSeek) atau menggunakan model lokal Ollama gratis.'
        : 'No! Anticeil adheres to the Zero-Markup & BYOK principle. You only pay directly to your model provider (OpenAI, Anthropic, DeepSeek) or run on local Ollama models completely free.',
    },
    {
      q: isId ? 'Bisakah saya melakukan self-host pada alur kerja saya?' : 'Can I self-host my workflows and connectors?',
      a: isId
        ? 'Ya. Anticeil Flow didukung oleh arsitektur open-core Activepieces dan Docker yang dapat dijalankan secara privat pada server atau VPS Anda sendiri.'
        : 'Yes. Anticeil Flow is built on an open-core Activepieces & Docker architecture that can be self-hosted entirely on your own private infrastructure.',
    },
  ];

  return (
    <div
      style={{
        flex: 1,
        minHeight: '100vh',
        height: '100%',
        overflowY: 'auto',
        background: 'var(--bg-canvas, #090a0f)',
        color: 'var(--text-primary, #f1f5f9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      {/* ── Standalone Top Navbar ── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          width: '100%',
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(9, 10, 15, 0.85)',
          borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="/chat" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <img src="/anticeil-logo.png" alt="Anticeil Logo" style={{ width: '28px', height: '28px', borderRadius: '7px' }} />
            <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary, #ffffff)', letterSpacing: '-0.02em' }}>
              Anticeil <span style={{ color: '#10b981', fontWeight: 600 }}>Flow</span>
            </span>
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/chat" style={{ fontSize: '13px', color: 'var(--text-secondary, #94a3b8)', textDecoration: 'none', fontWeight: 500 }}>
              {isId ? 'Chat' : 'Chat'}
            </Link>
            <Link href="/docs" style={{ fontSize: '13px', color: 'var(--text-secondary, #94a3b8)', textDecoration: 'none', fontWeight: 500 }}>
              Docs Studio
            </Link>
            <Link href="/code" style={{ fontSize: '13px', color: 'var(--text-secondary, #94a3b8)', textDecoration: 'none', fontWeight: 500 }}>
              Anticeil Code
            </Link>
            <Link href="/documentation" style={{ fontSize: '13px', color: 'var(--text-secondary, #94a3b8)', textDecoration: 'none', fontWeight: 500 }}>
              {isId ? 'Dokumentasi' : 'Documentation'}
            </Link>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link
            href="/chat"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
              color: 'var(--text-primary, #ffffff)',
              fontSize: '12.5px',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <MessageSquare size={13} color="var(--brand-primary, #0073ea)" />
            <span>{isId ? 'Buka Workspace' : 'Open Workspace'}</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
            }}
          >
            <span>{isId ? 'Daftar Akses Awal' : 'Get Early Access'}</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </header>

      {/* Background Ambient Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '750px',
          height: '420px',
          background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.14), rgba(139, 92, 246, 0.08), transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(70px)',
          zIndex: 0,
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '1160px',
          padding: '48px 24px 80px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '56px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* ─── Hero Section ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px' }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontSize: '12.5px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Workflow size={14} className="animate-spin-slow" />
            <span>{isId ? 'Anticeil Flow — Automasi Multi-Agent & 200+ Integrasi' : 'Anticeil Flow — Multi-Agent Workflows & 200+ Pieces'}</span>
          </div>

          {/* Main Title */}
          <h1
            style={{
              fontSize: 'clamp(32px, 5vw, 54px)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              margin: 0,
              maxWidth: '860px',
              background: 'linear-gradient(135deg, #ffffff 30%, #a7f3d0 70%, #6ee7b7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {isId
              ? 'Otomatisasi Alur Kerja Visual Berbasis AI Tanpa Hambatan'
              : 'Visual AI Workflow Automation with Zero Vendor Lock-in'}
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 'clamp(15px, 2vw, 17.5px)',
              color: 'var(--text-secondary, #94a3b8)',
              maxWidth: '720px',
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {isId
              ? 'Rancang pipeline multi-agent, hubungkan 200+ aplikasi (GitHub, Discord, Slack, Sheets), dan jalankan trigger webhook secara mandiri menggunakan kunci API pribadi Anda.'
              : 'Build autonomous multi-agent pipelines, connect 200+ pieces (GitHub, Discord, Slack, Sheets), and orchestrate webhook triggers with 100% private BYOK intelligence.'}
          </p>

          {/* Quick Stats / Highlights */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '24px',
              paddingTop: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span>{isId ? '200+ Open Connectors' : '200+ Open Connectors'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <ShieldCheck size={16} color="#10b981" />
              <span>{isId ? '100% BYOK & Zero Proxy' : '100% BYOK & Zero Proxy'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <Zap size={16} color="#10b981" />
              <span>{isId ? 'Self-Hostable Engine' : 'Self-Hostable Engine'}</span>
            </div>
          </div>
        </div>

        {/* ─── Interactive Workflow Simulator Canvas ─── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: 'var(--bg-surface, #11131a)',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top Canvas Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
              paddingBottom: '16px',
            }}
          >
            {/* Template Selector Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #64748b)', marginRight: '4px' }}>
                {isId ? 'PILIH TEMPLATE:' : 'SELECT TEMPLATE:'}
              </span>
              {FLOW_TEMPLATES.map((tmpl) => {
                const isActive = tmpl.id === activeTemplateId;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      setActiveTemplateId(tmpl.id);
                      setSimulatedLogs([]);
                      setSimulatingStep(-1);
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: isActive ? '1px solid #10b981' : '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                      background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                      color: isActive ? '#34d399' : 'var(--text-secondary, #94a3b8)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isId ? tmpl.titleId : tmpl.title}
                  </button>
                );
              })}
            </div>

            {/* Run Button */}
            <button
              onClick={handleRunSimulator}
              disabled={isSimulating}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '8px',
                background: isSimulating ? 'rgba(16, 185, 129, 0.4)' : '#10b981',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: isSimulating ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.15s ease',
              }}
            >
              {isSimulating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>{isId ? 'Menjalankan Alur...' : 'Executing Flow...'}</span>
                </>
              ) : (
                <>
                  <Play size={14} fill="#ffffff" />
                  <span>{isId ? 'Uji Jalankan Alur' : 'Test Run Flow'}</span>
                </>
              )}
            </button>
          </div>

          {/* Description */}
          <div style={{ fontSize: '13px', color: 'var(--text-secondary, #94a3b8)' }}>
            {isId ? activeTemplate.descId : activeTemplate.desc}
          </div>

          {/* Visual Node Graph Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              padding: '16px 0',
              position: 'relative',
            }}
          >
            {activeTemplate.nodes.map((node, idx) => {
              const isCurrentStep = simulatingStep === idx;
              const isPastStep = simulatingStep > idx;

              return (
                <div
                  key={node.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '16px',
                    borderRadius: '12px',
                    background: isCurrentStep
                      ? 'rgba(16, 185, 129, 0.12)'
                      : isPastStep
                      ? 'rgba(16, 185, 129, 0.05)'
                      : 'rgba(255, 255, 255, 0.02)',
                    border: isCurrentStep
                      ? '1.5px solid #10b981'
                      : isPastStep
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))',
                    boxShadow: isCurrentStep ? '0 0 20px rgba(16, 185, 129, 0.25)' : 'none',
                    transition: 'all 0.25s ease',
                    position: 'relative',
                  }}
                >
                  {/* Step Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `${node.color}20`,
                        color: node.color,
                      }}
                    >
                      {node.icon}
                    </div>

                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: `${node.color}15`,
                        color: node.color,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {node.badge}
                    </span>
                  </div>

                  {/* Step Titles */}
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary, #ffffff)' }}>
                      {node.title}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                      {node.subtitle}
                    </div>
                  </div>

                  {/* Step Details */}
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary, #94a3b8)',
                      lineHeight: 1.4,
                      background: 'rgba(0,0,0,0.25)',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.03)',
                    }}
                  >
                    {node.details}
                  </div>

                  {/* Status Indicator */}
                  {isCurrentStep && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                      <Activity size={12} className="animate-pulse" />
                      <span>{isId ? 'Memproses...' : 'Processing...'}</span>
                    </div>
                  )}
                  {isPastStep && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                      <CheckCircle size={12} />
                      <span>{isId ? 'Selesai (200 OK)' : 'Done (200 OK)'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Execution Log Terminal */}
          <div
            style={{
              background: '#0a0c10',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.06)',
              padding: '12px 16px',
              fontFamily: 'monospace',
              fontSize: '11.5px',
              color: '#94a3b8',
              maxHeight: '130px',
              overflowY: 'auto',
            }}
          >
            <div style={{ color: '#64748b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Terminal size={12} />
              <span>LIVE EXECUTION STREAM</span>
            </div>
            {simulatedLogs.length === 0 ? (
              <div style={{ color: '#475569', fontStyle: 'italic' }}>
                {isId ? 'Klik "Uji Jalankan Alur" untuk melihat streaming log eksekusi.' : 'Click "Test Run Flow" above to stream node execution logs.'}
              </div>
            ) : (
              simulatedLogs.map((log, i) => (
                <div key={i} style={{ color: log.includes('Success') || log.includes('Complete') ? '#34d399' : '#e2e8f0' }}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ─── 200+ Connectors & Integrations Ecosystem ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
              {isId ? 'Ekosistem 200+ Konektor Terbuka' : '200+ Open Connectors & Pieces'}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary, #94a3b8)', margin: 0 }}>
              {isId
                ? 'Integrasikan trigger, AI LLM, webhook, dan database tanpa dependensi proprietary.'
                : 'Wire up triggers, AI LLMs, webhooks, and databases without proprietary vendor lock-in.'}
            </p>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px' }}>
            {['all', 'AI', 'Dev', 'Chat', 'Data', 'Productivity'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: activeCategory === cat ? '1px solid #10b981' : '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                  background: activeCategory === cat ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  color: activeCategory === cat ? '#34d399' : 'var(--text-secondary, #94a3b8)',
                }}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Pieces Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
              gap: '12px',
            }}
          >
            {filteredPieces.map((piece) => (
              <div
                key={piece.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'var(--bg-surface, #11131a)',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '18px' }}>{piece.icon}</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary, #ffffff)' }}>
                    {piece.name}
                  </span>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748b)' }}>
                    {piece.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Key Value Pillars ─── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
          }}
        >
          {/* Card 1 */}
          <div
            style={{
              padding: '24px',
              borderRadius: '14px',
              background: 'var(--bg-surface, #11131a)',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}
            >
              <Cpu size={20} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
              {isId ? 'Multi-Agent BYOK Execution' : 'Multi-Agent BYOK Execution'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary, #94a3b8)', margin: 0, lineHeight: 1.5 }}>
              {isId
                ? 'Gunakan model AI pilihan Anda (Claude 3.5, DeepSeek R1, GPT-4o, Ollama) langsung tanpa markup harga per token.'
                : 'Bring your personal API keys or local Ollama instances directly with zero intermediary markups or token fees.'}
            </p>
          </div>

          {/* Card 2 */}
          <div
            style={{
              padding: '24px',
              borderRadius: '14px',
              background: 'var(--bg-surface, #11131a)',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6',
              }}
            >
              <Boxes size={20} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
              {isId ? 'Integrasi Anticeil Studio' : 'Unified Studio Ecosystem'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary, #94a3b8)', margin: 0, lineHeight: 1.5 }}>
              {isId
                ? 'Hubungkan otomatisasi Flow langsung dengan Anticeil Chat, Docs Studio, dan Anticeil Code VS Code Extension.'
                : 'Directly dispatch flow triggers from Anticeil Chat, export outputs into Docs Studio, or invoke from Anticeil Code.'}
            </p>
          </div>

          {/* Card 3 */}
          <div
            style={{
              padding: '24px',
              borderRadius: '14px',
              background: 'var(--bg-surface, #11131a)',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
              {isId ? 'Privat & Siap Self-Host' : 'Private & Self-Hostable'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary, #94a3b8)', margin: 0, lineHeight: 1.5 }}>
              {isId
                ? 'Data alur kerja dan kredensial Anda disimpan secara privat dengan enkripsi lokal tanpa telemetri eksternal.'
                : 'Store your workflow definitions, tokens, and payloads securely with local encryption and full self-hosting options.'}
            </p>
          </div>
        </div>

        {/* ─── Waitlist / Early Access Form ─── */}
        <div
          style={{
            padding: '36px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(139, 92, 246, 0.08))',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '600px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>
              {isId ? 'Dapatkan Akses Awal Anticeil Flow' : 'Get Early Access to Anticeil Flow'}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary, #94a3b8)', margin: 0 }}>
              {isId
                ? `Bergabunglah bersama ${waitlistCount.toLocaleString()} developer dan tim ops yang mengotomatisasi alur kerja AI mandiri.`
                : `Join ${waitlistCount.toLocaleString()} engineers and automation builders testing Anticeil Flow.`}
            </p>
          </div>

          {isJoined ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 24px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid #10b981',
                color: '#34d399',
                fontWeight: 700,
                fontSize: '14px',
              }}
            >
              <CheckCircle2 size={18} />
              <span>{isId ? 'Anda telah terdaftar di Akses Awal Anticeil Flow!' : 'You are registered for Anticeil Flow Early Access!'}</span>
            </div>
          ) : (
            <form
              onSubmit={handleJoinWaitlist}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                width: '100%',
                maxWidth: '540px',
                justifyContent: 'center',
              }}
            >
              <input
                type="email"
                required
                placeholder={isId ? 'Masukkan alamat email Anda...' : 'Enter your email address...'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  flex: '1 1 240px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--bg-surface, #11131a)',
                  border: '1px solid var(--border-strong, rgba(255,255,255,0.15))',
                  color: 'var(--text-primary, #ffffff)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                }}
              >
                {isSubmitting ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <>
                    <span>{isId ? 'Daftar Akses Awal' : 'Join Early Access'}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* ─── FAQ Accordion ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, textAlign: 'center' }}>
            {isId ? 'Pertanyaan yang Sering Diajukan' : 'Frequently Asked Questions'}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {faqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    borderRadius: '10px',
                    background: 'var(--bg-surface, #11131a)',
                    border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary, #ffffff)',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronDown size={15} color="var(--text-muted)" /> : <ChevronRight size={15} color="var(--text-muted)" />}
                  </button>
                  {isOpen && (
                    <div
                      style={{
                        padding: '0 18px 14px 18px',
                        fontSize: '13px',
                        color: 'var(--text-secondary, #94a3b8)',
                        lineHeight: 1.6,
                      }}
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
