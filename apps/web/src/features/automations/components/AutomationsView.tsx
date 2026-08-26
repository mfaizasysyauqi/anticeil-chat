'use client';

import React, { useState, useRef } from 'react';
import {
  Workflow,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Zap,
  Activity,
  GitBranch,
  Database,
  Cpu,
  Layers,
  Pause,
  ExternalLink,
  Cloud,
  Terminal,
  X,
  Wand2,
  History,
  LayoutGrid,
  ChevronDown,
  ArrowUp,
  RefreshCw,
  Plug,
} from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { getTranslation, getModelById } from '@anticeil/core';
import { WorkflowCanvasEditor } from './WorkflowCanvasEditor';
import { ModelSelectorModal } from '../../chat/components/ModelSelectorModal';
import { useAutomationStore, AutomationWorkflow, WorkflowRunLog } from '../store/useAutomationStore';
import { useAuthStore } from '../../auth/store/useAuthStore';

export interface WorkflowTemplateItem {
  id: string;
  name: string;
  category: string;
  description: string;
  badge?: string;
  triggerName: string;
  triggerType: string;
  actionName: string;
  actionType: string;
  outputName: string;
  outputType: string;
  nodes: any[];
  edges: any[];
}

export function AutomationsView() {
  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);
  const ta = t.automations;

  const session = useAuthStore((s) => s.session);
  const workflows = useAutomationStore((s) => s.workflows);
  const runsHistory = useAutomationStore((s) => s.runsHistory);
  const activeWorkflowId = useAutomationStore((s) => s.activeWorkflowId);
  const activeWorkflowTitle = useAutomationStore((s) => s.activeWorkflowTitle);
  const setActiveWorkflow = useAutomationStore((s) => s.setActiveWorkflow);
  const createWorkflow = useAutomationStore((s) => s.createWorkflow);
  const deleteWorkflow = useAutomationStore((s) => s.deleteWorkflow);
  const toggleWorkflowStatus = useAutomationStore((s) => s.toggleWorkflowStatus);
  const incrementRunsCount = useAutomationStore((s) => s.incrementRunsCount);
  const addRunLog = useAutomationStore((s) => s.addRunLog);
  const fetchWorkflows = useAutomationStore((s) => s.fetchWorkflows);

  // Sync from Supabase on mount if authenticated
  React.useEffect(() => {
    if (session?.access_token) {
      fetchWorkflows(session.access_token);
    }
  }, [session?.access_token, fetchWorkflows]);

  // Tab State: 'templates' | 'my_workflows' | 'runs'
  const [activeTab, setActiveTab] = useState<'templates' | 'my_workflows' | 'runs'>('templates');

  // AI Prompt Chatform State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Model info from shared settings (same as ChatInput)
  const activeProviderId = useSettingsStore((s) => s.activeProviderId);
  const activeModelId = useSettingsStore((s) => s.activeModelId);
  const getModelsForProvider = useSettingsStore((s) => s.getModelsForProvider);
  const providerModels = getModelsForProvider ? getModelsForProvider(activeProviderId) : [];
  const matchedModel = providerModels.find((m) => m.id === activeModelId) || getModelById(activeModelId);
  const modelDisplayName = matchedModel?.name || activeModelId || 'Select Model';

  const [isRunningId, setIsRunningId] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Ready-to-use Workflow Templates
  const workflowTemplates: WorkflowTemplateItem[] = [
    {
      id: 'tpl_calendar_briefing',
      name: language === 'id' ? 'Briefing Kalender Harian Otomatis → Telegram/Email' : 'Auto Daily Calendar Briefing → Telegram/Email',
      category: language === 'id' ? 'Produktivitas' : 'Productivity',
      badge: 'Popular',
      description: language === 'id'
        ? 'Setiap jam 08.00 pagi, ambil semua jadwal dari Google Calendar, rangkum dengan AI, dan kirim ringkasannya ke Telegram/Email Anda.'
        : 'Everyday at 8 AM, fetches schedule from Google Calendar, summarizes key agenda with AI, and sends briefing to Telegram/Email.',
      triggerName: 'Cron 08:00 WIB',
      triggerType: 'schedule',
      actionName: 'Groq / Llama 3.3 Synthesizer',
      actionType: 'ai',
      outputName: 'Telegram Bot / Gmail',
      outputType: 'connector',
      nodes: [
        { id: '1', type: 'triggerNode', position: { x: 50, y: 150 }, data: { title: 'Jadwal Harian (08:00)', eventType: 'cron' } },
        { id: '2', type: 'connectorNode', position: { x: 320, y: 150 }, data: { title: 'Google Calendar (Ambil Acara)', connectorType: 'google-calendar' } },
        { id: '3', type: 'aiAgentNode', position: { x: 590, y: 150 }, data: { title: 'AI Ringkasan Agenda', model: 'llama-3.3-70b-versatile' } },
        { id: '4', type: 'connectorNode', position: { x: 860, y: 150 }, data: { title: 'Kirim ke Telegram Bot', connectorType: 'telegram' } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', animated: true },
        { id: 'e2-3', source: '2', target: '3', animated: true },
        { id: 'e3-4', source: '3', target: '4', animated: true },
      ],
    },
    {
      id: 'tpl_gmail_vip_classifier',
      name: language === 'id' ? 'Klasifikasi Email VIP Gmail & Draf Balasan Otomatis' : 'Gmail VIP Classifier & Auto-Draft Response',
      category: language === 'id' ? 'Email & Komunikasi' : 'Email & Communication',
      badge: 'Smart AI',
      description: language === 'id'
        ? 'Deteksi email masuk di Gmail. Jika berasal dari klien VIP/penting, susun draf balasan kontekstual dengan Claude 3.7 ke Gmail Draft.'
        : 'Detects incoming Gmail messages. For VIP contacts, Claude 3.7 drafts contextual responses into your Gmail drafts automatically.',
      triggerName: 'Pesan Masuk Gmail',
      triggerType: 'gmail',
      actionName: 'Claude 3.7 Sonnet Reasoning',
      actionType: 'ai',
      outputName: 'Simpan ke Draf Gmail',
      outputType: 'connector',
      nodes: [
        { id: '1', type: 'triggerNode', position: { x: 50, y: 150 }, data: { title: 'Gmail Inbox Trigger', eventType: 'gmail' } },
        { id: '2', type: 'logicNode', position: { x: 320, y: 150 }, data: { title: 'Filter Kontak VIP' } },
        { id: '3', type: 'aiAgentNode', position: { x: 590, y: 150 }, data: { title: 'Claude 3.7 Draft Balasan', model: 'claude-3-7-sonnet' } },
        { id: '4', type: 'connectorNode', position: { x: 860, y: 150 }, data: { title: 'Buat Draf Gmail', connectorType: 'gmail' } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', animated: true },
        { id: 'e2-3', source: '2', target: '3', animated: true },
        { id: 'e3-4', source: '3', target: '4', animated: true },
      ],
    },
    {
      id: 'tpl_drive_notion_ocr',
      name: language === 'id' ? 'OCR Dokumen Google Drive & Indeks Basis Pengetahuan' : 'Google Drive OCR & Knowledge Base Ingestion',
      category: language === 'id' ? 'Dokumen & Riset' : 'Docs & Knowledge',
      description: language === 'id'
        ? 'Setiap ada berkas PDF/Gambar baru di folder Drive, ekstrak teks dokumen dengan AI OCR dan catat ringkasan penting ke Notion / Supabase.'
        : 'Whenever a PDF or image is dropped into Drive, AI extracts key metadata and logs clean summaries to Notion / Supabase database.',
      triggerName: 'Berkas Baru di Drive',
      triggerType: 'drive',
      actionName: 'DeepSeek-R1 / Vision OCR',
      actionType: 'ai',
      outputName: 'Basis Data Notion',
      outputType: 'connector',
      nodes: [
        { id: '1', type: 'triggerNode', position: { x: 50, y: 150 }, data: { title: 'Drive File Uploaded', eventType: 'drive' } },
        { id: '2', type: 'aiAgentNode', position: { x: 320, y: 150 }, data: { title: 'DeepSeek OCR Extractor', model: 'deepseek-r1' } },
        { id: '3', type: 'connectorNode', position: { x: 590, y: 150 }, data: { title: 'Simpan ke Notion Database', connectorType: 'notion' } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', animated: true },
        { id: 'e2-3', source: '2', target: '3', animated: true },
      ],
    },
    {
      id: 'tpl_webhook_telegram_alert',
      name: language === 'id' ? 'Webhook Eksternal & Notifikasi Peringatan Instan' : 'Webhook Ingestion & Instant Telegram Alerts',
      category: language === 'id' ? 'Developer & DevOps' : 'Developer & DevOps',
      badge: 'Real-time',
      description: language === 'id'
        ? 'Terima webhook dari GitHub, Stripe, atau sistem backend. AI menyaring log krusial dan mengirim peringatan real-time ke Telegram.'
        : 'Receive webhooks from GitHub, Stripe, or servers. AI filters critical anomalies and delivers instant alerts to Telegram channels.',
      triggerName: 'HTTP Webhook Endpoint',
      triggerType: 'webhook',
      actionName: 'AI Log Anomaly Filter',
      actionType: 'ai',
      outputName: 'Notifikasi Telegram',
      outputType: 'connector',
      nodes: [
        { id: '1', type: 'triggerNode', position: { x: 50, y: 150 }, data: { title: 'Cloudflare Webhook Entry', eventType: 'webhook' } },
        { id: '2', type: 'aiAgentNode', position: { x: 320, y: 150 }, data: { title: 'AI Log Filter & Format', model: 'gpt-4o-mini' } },
        { id: '3', type: 'connectorNode', position: { x: 590, y: 150 }, data: { title: 'Telegram Channel Alert', connectorType: 'telegram' } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', animated: true },
        { id: 'e2-3', source: '2', target: '3', animated: true },
      ],
    },
    {
      id: 'tpl_lead_sheets_sync',
      name: language === 'id' ? 'Sinkronisasi Kontak Lead Baru & Scoring ke Spreadsheet' : 'Lead Qualification & Scoring to Spreadsheet',
      category: language === 'id' ? 'Marketing & CRM' : 'Marketing & CRM',
      description: language === 'id'
        ? 'Ketika ada formulir kontak baru, AI menilai kualitas prospek (Lead Score 1-100) dan mencatat datanya secara rapi ke Spreadsheet.'
        : 'Evaluates new contact inquiries with AI lead scoring (1-100) and syncs enriched records into Google Sheets / Storage.',
      triggerName: 'Formulir Kontak Masuk',
      triggerType: 'form',
      actionName: 'AI Lead Scorer (Fast LPU)',
      actionType: 'ai',
      outputName: 'Google Sheets / Storage',
      outputType: 'spreadsheet',
      nodes: [
        { id: '1', type: 'triggerNode', position: { x: 50, y: 150 }, data: { title: 'Lead Form Submission', eventType: 'form' } },
        { id: '2', type: 'aiAgentNode', position: { x: 320, y: 150 }, data: { title: 'Groq Lead Scoring Engine', model: 'llama-3.3-70b-versatile' } },
        { id: '3', type: 'spreadsheetNode', position: { x: 590, y: 150 }, data: { title: 'Sync to Leads Sheet' } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', animated: true },
        { id: 'e2-3', source: '2', target: '3', animated: true },
      ],
    },
    {
      id: 'tpl_support_ai_assistant',
      name: language === 'id' ? 'Agen Customer Support Mandiri 24/7' : '24/7 Autonomous AI Support Agent',
      category: language === 'id' ? 'Layanan Pelanggan' : 'Customer Support',
      badge: 'Autonomous',
      description: language === 'id'
        ? 'Menjawab pertanyaan tiket pengguna secara instan dengan mencocokkan dokumen SOP dan mengirimkan solusi via Email/Telegram.'
        : 'Instantly resolves user support tickets by referencing knowledge docs and replies automatically via Email or Telegram.',
      triggerName: 'Tiket Masuk Pelanggan',
      triggerType: 'support',
      actionName: 'RAG Knowledge Search + Synthesizer',
      actionType: 'ai',
      outputName: 'Balasan Email / Chat',
      outputType: 'connector',
      nodes: [
        { id: '1', type: 'triggerNode', position: { x: 50, y: 150 }, data: { title: 'Support Ticket Trigger', eventType: 'support' } },
        { id: '2', type: 'databaseNode', position: { x: 320, y: 150 }, data: { title: 'Vector Search SOP Docs' } },
        { id: '3', type: 'aiAgentNode', position: { x: 590, y: 150 }, data: { title: 'Claude 3.7 Support Solver', model: 'claude-3-7-sonnet' } },
        { id: '4', type: 'connectorNode', position: { x: 860, y: 150 }, data: { title: 'Send Email Resolution', connectorType: 'email' } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', animated: true },
        { id: 'e2-3', source: '2', target: '3', animated: true },
        { id: 'e3-4', source: '3', target: '4', animated: true },
      ],
    },
  ];

  // Clone template into real user workflow
  const handleUseTemplate = async (tpl: WorkflowTemplateItem) => {
    const newId = `wf_${Date.now().toString(36)}`;
    const newWf = await createWorkflow({
      id: newId,
      name: tpl.name,
      description: tpl.description,
      trigger: tpl.triggerName,
      action: tpl.actionName,
      status: 'active',
      nodes: tpl.nodes,
      edges: tpl.edges,
    }, session?.access_token);

    setActiveWorkflow(newWf.id, newWf.name);
  };

  // Generate workflow from Natural Language Prompt
  const handleGenerateWorkflowFromPrompt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsGeneratingAi(true);
    const p = aiPrompt.toLowerCase();

    const newId = `wf_${Date.now().toString(36)}`;
    let name = aiPrompt.slice(0, 48);
    let trigger = 'Pemicu Acara Otomatis';
    let action = 'AI Agent Processing';
    let nodes: any[] = [];
    let edges: any[] = [];

    if (p.includes('calendar') || p.includes('jadwal') || p.includes('kalender')) {
      name = language === 'id' ? 'Otomasi Kalender & Briefing Harian' : 'Calendar & Daily Briefing Automation';
      trigger = 'Cron 08:00 Pagi';
      action = 'Google Calendar + AI Summary';
      nodes = [
        { id: '1', type: 'triggerNode', position: { x: 50, y: 150 }, data: { title: 'Jadwal Pagi (Cron)' } },
        { id: '2', type: 'connectorNode', position: { x: 320, y: 150 }, data: { title: 'Google Calendar Fetch', connectorType: 'google-calendar' } },
        { id: '3', type: 'aiAgentNode', position: { x: 590, y: 150 }, data: { title: 'AI Synthesizer', model: 'llama-3.3-70b-versatile' } },
      ];
      edges = [
        { id: 'e1-2', source: '1', target: '2', animated: true },
        { id: 'e2-3', source: '2', target: '3', animated: true },
      ];
    } else if (p.includes('email') || p.includes('gmail') || p.includes('surat')) {
      name = language === 'id' ? 'Klasifikasi & Draf Gmail Otomatis' : 'Gmail Auto-Classifier & Drafts';
      trigger = 'Email Masuk Gmail';
      action = 'Claude 3.7 Contextual Drafting';
      nodes = [
        { id: '1', type: 'triggerNode', position: { x: 50, y: 150 }, data: { title: 'Gmail Inbox Trigger', eventType: 'gmail' } },
        { id: '2', type: 'aiAgentNode', position: { x: 320, y: 150 }, data: { title: 'Claude 3.7 Contextual Drafting', model: 'claude-3-7-sonnet' } },
        { id: '3', type: 'connectorNode', position: { x: 590, y: 150 }, data: { title: 'Buat Draf Gmail', connectorType: 'gmail' } },
      ];
      edges = [
        { id: 'e1-2', source: '1', target: '2', animated: true },
        { id: 'e2-3', source: '2', target: '3', animated: true },
      ];
    } else if (p.includes('telegram') || p.includes('bot') || p.includes('pesan')) {
      name = language === 'id' ? 'Bot Telegram & AI Responder' : 'Telegram Bot & AI Responder';
      trigger = 'Telegram Incoming Message';
      action = 'AI Multi-Model Resolver';
      nodes = [
        { id: '1', type: 'triggerNode', position: { x: 50, y: 150 }, data: { title: 'Telegram Webhook', eventType: 'telegram' } },
        { id: '2', type: 'aiAgentNode', position: { x: 320, y: 150 }, data: { title: 'AI Assistant Reasoning', model: 'gpt-4o' } },
        { id: '3', type: 'connectorNode', position: { x: 590, y: 150 }, data: { title: 'Kirim Balasan Telegram', connectorType: 'telegram' } },
      ];
      edges = [
        { id: 'e1-2', source: '1', target: '2', animated: true },
        { id: 'e2-3', source: '2', target: '3', animated: true },
      ];
    } else {
      nodes = [
        { id: '1', type: 'triggerNode', position: { x: 50, y: 150 }, data: { title: 'Pemicu Acara Masuk' } },
        { id: '2', type: 'aiAgentNode', position: { x: 320, y: 150 }, data: { title: 'AI Agent Processor', model: 'llama-3.3-70b-versatile' } },
        { id: '3', type: 'connectorNode', position: { x: 590, y: 150 }, data: { title: 'Eksekusi Output Terintegrasi' } },
      ];
      edges = [
        { id: 'e1-2', source: '1', target: '2', animated: true },
        { id: 'e2-3', source: '2', target: '3', animated: true },
      ];
    }

    const newWf = await createWorkflow({
      id: newId,
      name,
      description: aiPrompt,
      trigger,
      action,
      status: 'active',
      nodes,
      edges,
    }, session?.access_token);

    setIsGeneratingAi(false);
    setAiPrompt('');
    setActiveWorkflow(newWf.id, newWf.name);
  };

  const handleRunNow = async (id: string, name?: string) => {
    setIsRunningId(id);
    const start = Date.now();
    try {
      const res = await fetch('/api/automations/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: id,
          triggerSource: 'manual',
          nodes: [
            { id: 'trigger', type: 'triggerNode', data: { title: 'Pemicu Alur Manual' } },
            { id: 'action', type: 'connectorNode', data: { title: 'Eksekusi Aksi Terintegrasi' } },
          ],
        }),
      });
      const data = await res.json();
      const durationMs = data.totalDurationMs || (Date.now() - start);

      await incrementRunsCount(id, session?.access_token);

      // Log run in history
      addRunLog({
        id: `run_${Date.now()}`,
        workflowId: id,
        workflowName: name || 'Workflow',
        status: 'success',
        triggerSource: 'Manual UI Run',
        durationMs,
        timestamp: Date.now(),
        outputSummary: 'Pipeline nodes executed successfully on Cloudflare edge.',
      });

      setSuccessNotice(`✓ ${language === 'id' ? `Alur #${id} berhasil dieksekusi di Cloudflare Edge (${durationMs}ms)!` : `Workflow #${id} successfully executed on Cloudflare Edge (${durationMs}ms)!`}`);
    } catch (err: any) {
      addRunLog({
        id: `run_${Date.now()}`,
        workflowId: id,
        workflowName: name || 'Workflow',
        status: 'failed',
        triggerSource: 'Manual UI Run',
        durationMs: Date.now() - start,
        timestamp: Date.now(),
        outputSummary: err?.message || 'Execution error',
      });
      setSuccessNotice(`✘ Gagal mengeksekusi alur: ${err?.message}`);
    } finally {
      setIsRunningId(null);
      setTimeout(() => setSuccessNotice(null), 4000);
    }
  };

  const handleToggleStatus = (id: string) => {
    toggleWorkflowStatus(id, session?.access_token);
  };

  const handleCreateBlank = async () => {
    const newId = `wf_${Date.now().toString(36)}`;
    const newName = language === 'id' ? `Alur Otomatisasi Baru #${newId.slice(-4)}` : `New Agent Workflow #${newId.slice(-4)}`;
    const newWf = await createWorkflow({
      id: newId,
      name: newName,
      trigger: language === 'id' ? 'Pemicu Acara Baru' : 'New Event Trigger',
      action: language === 'id' ? 'Tindakan Agen AI Mandiri' : 'Autonomous AI Action',
      status: 'active',
    }, session?.access_token);
    setActiveWorkflow(newWf.id, newWf.name);
  };

  // If in Visual React Flow Studio mode, render full-canvas editor
  if (activeWorkflowId) {
    return (
      <WorkflowCanvasEditor
        workflowId={activeWorkflowId}
        workflowTitle={activeWorkflowTitle || 'Canvas Workflow'}
        onBack={() => setActiveWorkflow(null, null)}
      />
    );
  }

  return (
    <div className="page-scroll-container">
      <div className="page-content-wrapper">
        {/* ── 1. Header with Title & Action ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '24px' }}>⚡</span>
              <h1
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                  margin: 0,
                }}
              >
                {ta.title}
              </h1>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              {ta.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateBlank}
            className="clickable-pill"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md, 8px)',
              background: 'var(--brand-primary)',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 115, 234, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={15} />
            <span>{ta.newWorkflow}</span>
          </button>
        </div>

        {/* ── 2. AI Chatform — styled identically to ChatInput ── */}
        <div
          style={{
            background: 'var(--bg-input, var(--bg-surface))',
            border: `1px solid ${isFocused ? 'var(--border-focus, var(--brand-primary))' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-xl, 16px)',
            boxShadow: isFocused ? 'var(--shadow-lg)' : 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            padding: '10px 14px',
            marginBottom: '24px',
            transition: 'all 0.2s ease',
          }}
        >
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={aiPrompt}
            onChange={(e) => {
              setAiPrompt(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerateWorkflowFromPrompt();
              }
            }}
            placeholder={
              language === 'id'
                ? 'Jelaskan alur otomatisasi yang diinginkan, atau tekan / untuk prompt cepat...'
                : 'Describe the workflow you want to build, or press / for quick prompts...'
            }
            rows={1}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              color: 'var(--text-primary)',
              fontSize: '14px',
              lineHeight: 1.55,
              padding: '2px',
              maxHeight: '160px',
              fontFamily: 'inherit',
            }}
          />

          {/* Bottom toolbar — exact ChatInput layout */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '8px',
              paddingTop: '6px',
            }}
          >
            {/* Left: + Button and quick starter prompt pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                title={language === 'id' ? 'Prompt cepat' : 'Quick prompts'}
                className="clickable-pill"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '50%',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
                onClick={() => {
                  const starters = [
                    language === 'id'
                      ? 'Kirim ringkasan Google Calendar harian ke Telegram setiap pagi pk 08.00'
                      : 'Every day at 8 AM fetch my Google Calendar, summarize with AI, send to Telegram',
                    language === 'id'
                      ? 'Klasifikasikan pesan masuk Gmail dan susun draf balasan kontekstual dengan Claude 3.7'
                      : 'Classify incoming Gmail from VIP contacts and auto-draft contextual replies with Claude 3.7',
                    language === 'id'
                      ? 'Buat bot Telegram otomatis untuk menjawab pertanyaan pelanggan 24/7'
                      : 'Build a 24/7 Telegram bot that answers customer questions using company knowledge docs',
                  ];
                  const next = starters.find((s) => s !== aiPrompt) || starters[0];
                  setAiPrompt(next);
                  textareaRef.current?.focus();
                }}
              >
                <Plus size={19} />
              </button>

              {/* Starter chips */}
              {!aiPrompt && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                  {[
                    {
                      emoji: '⚡',
                      label: language === 'id' ? 'Briefing Kalender' : 'Calendar Brief',
                      prompt: language === 'id' ? 'Kirim ringkasan Google Calendar harian ke Telegram setiap pagi pk 08.00' : 'Every day at 8 AM fetch my Google Calendar, summarize with AI, send to Telegram',
                    },
                    {
                      emoji: '📩',
                      label: language === 'id' ? 'Gmail VIP Filter' : 'Gmail VIP',
                      prompt: language === 'id' ? 'Klasifikasikan pesan masuk Gmail dari kontak VIP dan susun draf balasan dengan Claude 3.7' : 'Classify incoming Gmail from VIP contacts and auto-draft contextual replies with Claude 3.7',
                    },
                    {
                      emoji: '🤖',
                      label: language === 'id' ? 'Telegram Bot' : 'Telegram Bot',
                      prompt: language === 'id' ? 'Buat bot Telegram otomatis untuk menjawab pertanyaan pelanggan 24/7' : 'Build a 24/7 Telegram bot that answers customer questions using company knowledge docs',
                    },
                  ].map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setAiPrompt(s.prompt);
                        textareaRef.current?.focus();
                      }}
                      className="clickable-pill"
                      style={{
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-subtle)',
                        color: 'var(--text-secondary)',
                        borderRadius: '16px',
                        padding: '3px 10px',
                        fontSize: '11.5px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--brand-primary)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      {s.emoji} {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Model Selector + Circular Send Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {/* Model Selector Dropdown Button */}
              <button
                type="button"
                onClick={() => setIsModelSelectorOpen(true)}
                className="clickable-pill"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  padding: '5px 8px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  maxWidth: '220px',
                  transition: 'color 0.15s ease, background 0.15s ease',
                }}
              >
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                    fontSize: '13px',
                  }}
                >
                  {modelDisplayName}
                </span>
                <ChevronDown size={14} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
              </button>

              {/* Circular Send Button */}
              <button
                type="button"
                onClick={() => handleGenerateWorkflowFromPrompt()}
                disabled={isGeneratingAi || !aiPrompt.trim()}
                title={language === 'id' ? 'Generate Workflow' : 'Generate Workflow'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '34px',
                  height: '34px',
                  background:
                    isGeneratingAi || !aiPrompt.trim()
                      ? 'var(--bg-subtle)'
                      : 'var(--text-primary)',
                  border: 'none',
                  borderRadius: '50%',
                  color: isGeneratingAi || !aiPrompt.trim() ? 'var(--text-muted)' : 'var(--bg-main)',
                  cursor: isGeneratingAi || !aiPrompt.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                {isGeneratingAi ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <ArrowUp size={16} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ModelSelectorModal Dialog */}
        {isModelSelectorOpen && (
          <ModelSelectorModal onClose={() => setIsModelSelectorOpen(false)} />
        )}

        {/* ── 3. Success Toast Notice ── */}
        {successNotice && (
          <div
            style={{
              background: 'rgba(0, 200, 117, 0.12)',
              border: '1px solid var(--accent-success)',
              color: 'var(--accent-success)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md, 8px)',
              fontSize: '12.5px',
              fontWeight: 600,
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={15} />
            <span>{successNotice}</span>
          </div>
        )}

        {/* ── 4. Main Tab Navigation ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '24px',
            paddingBottom: '2px',
          }}
        >
          {/* Tab 1: Templates Gallery */}
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 16px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              borderBottom: activeTab === 'templates' ? '2px solid var(--brand-primary)' : '2px solid transparent',
              background: 'transparent',
              color: activeTab === 'templates' ? 'var(--brand-primary)' : 'var(--text-secondary)',
              fontSize: '13.5px',
              fontWeight: activeTab === 'templates' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <LayoutGrid size={15} />
            <span>{language === 'id' ? 'Galeri Template Alur' : 'Workflow Templates'}</span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '999px',
                background: 'rgba(0, 115, 234, 0.1)',
                color: 'var(--brand-primary)',
              }}
            >
              {workflowTemplates.length}
            </span>
          </button>

          {/* Tab 2: My Workflows */}
          <button
            type="button"
            onClick={() => setActiveTab('my_workflows')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 16px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              borderBottom: activeTab === 'my_workflows' ? '2px solid var(--brand-primary)' : '2px solid transparent',
              background: 'transparent',
              color: activeTab === 'my_workflows' ? 'var(--brand-primary)' : 'var(--text-secondary)',
              fontSize: '13.5px',
              fontWeight: activeTab === 'my_workflows' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Workflow size={15} />
            <span>{language === 'id' ? 'Alur Kerja Saya' : 'My Active Pipelines'}</span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '999px',
                background: 'var(--bg-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              {workflows.length}
            </span>
          </button>

          {/* Tab 3: Runs & Execution Logs */}
          <button
            type="button"
            onClick={() => setActiveTab('runs')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 16px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              borderBottom: activeTab === 'runs' ? '2px solid var(--brand-primary)' : '2px solid transparent',
              background: 'transparent',
              color: activeTab === 'runs' ? 'var(--brand-primary)' : 'var(--text-secondary)',
              fontSize: '13.5px',
              fontWeight: activeTab === 'runs' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <History size={15} />
            <span>{language === 'id' ? 'Riwayat Eksekusi & Runs' : 'Execution Logs & Runs'}</span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '999px',
                background: 'var(--bg-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              {runsHistory.length}
            </span>
          </button>
        </div>

        {/* ── 5. TAB CONTENT ── */}

        {/* TAB A: Templates Gallery */}
        {activeTab === 'templates' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px', marginBottom: '40px' }}>
              {workflowTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xl, 16px)',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div>
                    {/* Top category & badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {tpl.category}
                      </span>
                      {tpl.badge && (
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'rgba(0, 115, 234, 0.1)',
                            color: 'var(--brand-primary)',
                          }}
                        >
                          {tpl.badge}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                      {tpl.name}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                      {tpl.description}
                    </p>

                    {/* Pipeline Steps Preview */}
                    <div
                      style={{
                        background: 'var(--bg-main)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        fontSize: '11.5px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                        <Clock size={12} color="#D97706" style={{ flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>1. Pemicu:</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tpl.triggerName}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                        <Cpu size={12} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>2. AI Agent:</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tpl.actionName}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                        <Plug size={12} color="var(--accent-success)" style={{ flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>3. Output:</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tpl.outputName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Clone / Use Button */}
                  <button
                    type="button"
                    onClick={() => handleUseTemplate(tpl)}
                    className="clickable-pill"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      background: 'rgba(0, 115, 234, 0.08)',
                      border: '1px solid rgba(0, 115, 234, 0.25)',
                      color: 'var(--brand-primary)',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      width: '100%',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--brand-primary)';
                      e.currentTarget.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 115, 234, 0.08)';
                      e.currentTarget.style.color = 'var(--brand-primary)';
                    }}
                  >
                    <GitBranch size={13} />
                    <span>{language === 'id' ? 'Gunakan Template & Buka Canvas' : 'Use Template & Open Canvas'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB B: My Active Workflows */}
        {activeTab === 'my_workflows' && (
          <div>
            {workflows.length === 0 ? (
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px dashed var(--border-strong)',
                  borderRadius: 'var(--radius-xl, 16px)',
                  padding: '48px 24px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  marginBottom: '40px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    color: '#F59E0B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Workflow size={24} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {language === 'id' ? 'Belum Ada Alur Kerja Aktif' : 'No Active Workflows Yet'}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '440px', lineHeight: 1.5 }}>
                  {language === 'id'
                    ? 'Pilih salah satu dari Galeri Template atau ketik deskripsi alur kerja di form AI di atas untuk membuat pipeline pertama Anda.'
                    : 'Pick a template from the gallery or enter your prompt in the AI box above to create your first pipeline.'}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('templates')}
                  style={{
                    marginTop: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 18px',
                    borderRadius: 'var(--radius-md, 8px)',
                    background: 'var(--brand-primary)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0, 115, 234, 0.35)',
                  }}
                >
                  <LayoutGrid size={15} />
                  <span>{language === 'id' ? 'Jelajahi Galeri Template' : 'Browse Templates'}</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                {workflows.map((wf) => {
                  const isRunning = isRunningId === wf.id;

                  return (
                    <div
                      key={wf.id}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-xl, 16px)',
                        padding: '20px 22px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Header: Title & Status */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              background: wf.status === 'active' ? 'rgba(0, 115, 234, 0.1)' : 'var(--bg-subtle)',
                              color: wf.status === 'active' ? 'var(--brand-primary)' : 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Workflow size={18} />
                          </div>
                          <div>
                            <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
                              {wf.name}
                            </h3>
                          </div>
                        </div>

                        {/* Status Toggle Pill */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(wf.id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '11px',
                            fontWeight: 600,
                            border: 'none',
                            background: wf.status === 'active' ? 'rgba(0, 200, 117, 0.12)' : 'var(--bg-subtle)',
                            color: wf.status === 'active' ? 'var(--accent-success)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            flexShrink: 0,
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: wf.status === 'active' ? 'var(--accent-success)' : 'var(--text-muted)',
                            }}
                          />
                          <span>{wf.status === 'active' ? ta.active : ta.paused}</span>
                        </button>
                      </div>

                      {/* Middle Pipeline Steps */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            background: 'var(--bg-main)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <Clock size={13} color="#D97706" style={{ flexShrink: 0 }} />
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Pemicu:</span>
                          <span>{wf.trigger || 'Manual'}</span>
                        </div>

                        <ArrowRight size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />

                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            background: 'var(--bg-main)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <Sparkles size={13} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Aksi:</span>
                          <span>{wf.action || 'AI Execution'}</span>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '12px',
                          paddingTop: '12px',
                          borderTop: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                          <span>{ta.lastRun}: <strong>{wf.lastRun || 'Belum pernah'}</strong></span>
                          <span>•</span>
                          <span>{wf.runsCount} {ta.times}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setActiveWorkflow(wf.id, wf.name)}
                            className="clickable-pill"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              background: 'rgba(0, 115, 234, 0.08)',
                              border: '1px solid rgba(0, 115, 234, 0.2)',
                              color: 'var(--brand-primary)',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <GitBranch size={13} />
                            <span>Visual Studio</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRunNow(wf.id, wf.name)}
                            disabled={isRunning}
                            className="clickable-pill"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '6px 14px',
                              borderRadius: '8px',
                              background: 'var(--bg-subtle)',
                              border: '1px solid var(--border-strong)',
                              color: 'var(--text-primary)',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: isRunning ? 'not-allowed' : 'pointer',
                              opacity: isRunning ? 0.6 : 1,
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Play size={12} color="var(--brand-primary)" />
                            <span>{isRunning ? ta.running : ta.runNow}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(language === 'id' ? `Hapus alur "${wf.name}"?` : `Delete workflow "${wf.name}"?`)) {
                                deleteWorkflow(wf.id, session?.access_token);
                              }
                            }}
                            title={language === 'id' ? 'Hapus alur kerja' : 'Delete workflow'}
                            style={{
                              padding: '6px',
                              borderRadius: '8px',
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'color 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB C: Execution Logs & Runs */}
        {activeTab === 'runs' && (
          <div>
            {runsHistory.length === 0 ? (
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px dashed var(--border-strong)',
                  borderRadius: 'var(--radius-xl, 16px)',
                  padding: '48px 24px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  marginBottom: '40px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(0, 115, 234, 0.1)',
                    color: 'var(--brand-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <History size={24} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {language === 'id' ? 'Belum Ada Riwayat Eksekusi' : 'No Execution Runs Logged Yet'}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '440px', lineHeight: 1.5 }}>
                  {language === 'id'
                    ? 'Jalankan alur kerja Anda melalui tombol "Run Now" atau pemicu cron/webhook untuk melihat log eksekusi Cloudflare Worker di sini.'
                    : 'Trigger any of your workflows via "Run Now" or webhook/cron to see edge execution traces here.'}
                </p>
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xl, 16px)',
                  overflow: 'hidden',
                  marginBottom: '40px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={16} color="var(--brand-primary)" />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {language === 'id' ? 'Log Eksekusi Cloudflare Edge Worker' : 'Cloudflare Edge Worker Run Logs'}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {runsHistory.length} {language === 'id' ? 'catatan terakhir' : 'recent logs'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {runsHistory.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        padding: '14px 20px',
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: log.status === 'success' ? '#10B981' : '#EF4444',
                            boxShadow: log.status === 'success' ? '0 0 8px rgba(16, 185, 129, 0.6)' : '0 0 8px rgba(239, 68, 68, 0.6)',
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {log.workflowName}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {log.outputSummary || log.triggerSource}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'var(--bg-main)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          ⚡ {log.durationMs}ms
                        </span>

                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
