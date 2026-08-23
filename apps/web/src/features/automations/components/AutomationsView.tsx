'use client';

import React, { useState } from 'react';
import {
  Workflow,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  Mail,
  Calendar,
  FolderOpen,
  ArrowRight,
  Sparkles,
  Zap,
  Activity,
  GitBranch,
  Database,
  Cpu,
  Layers,
  Pause,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { getTranslation } from '@anticeil/core';
import { WorkflowCanvasEditor } from './WorkflowCanvasEditor';

interface WorkflowItem {
  id: string;
  name: string;
  trigger: string;
  triggerIcon: any;
  action: string;
  actionIcon: any;
  status: 'active' | 'paused';
  lastRun: string;
  runsCount: number;
}

export function AutomationsView() {
  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);
  const ta = t.automations;

  // Selected workflow for visual React Flow studio
  const [selectedWorkflowForCanvas, setSelectedWorkflowForCanvas] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [workflows, setWorkflows] = useState<WorkflowItem[]>([
    {
      id: 'wf_1',
      name: language === 'id' ? 'Briefing Kalender Harian Otomatis → Telegram/Email' : 'Auto Daily Calendar Briefing → Telegram/Email',
      trigger: language === 'id' ? 'Jadwal Cron (Setiap hari pk 08.00)' : 'Cron Schedule (Everyday at 08:00 AM)',
      triggerIcon: Clock,
      action: language === 'id' ? 'Ambil acara Kalender + Ringkas Briefing dengan AI' : 'Fetch Calendar events + Synthesize Brief with Groq',
      actionIcon: Calendar,
      status: 'active',
      lastRun: language === 'id' ? 'Hari ini, 08:00' : 'Today, 08:00 AM',
      runsCount: 42,
    },
    {
      id: 'wf_2',
      name: language === 'id' ? 'Klasifikasi Email VIP Gmail & Draf Otomatis' : 'Gmail VIP Email Classifier & Auto-Drafting',
      trigger: language === 'id' ? 'Pesan Gmail Baru Diterima' : 'New Gmail Message Received',
      triggerIcon: Mail,
      action: language === 'id' ? 'AI Menyusun Konteks Balasan ke Draf Gmail' : 'Claude 3.7 Drafts Contextual Response to Drafts',
      actionIcon: Sparkles,
      status: 'active',
      lastRun: language === 'id' ? '15 mnt lalu' : '15 mins ago',
      runsCount: 128,
    },
    {
      id: 'wf_3',
      name: language === 'id' ? 'OCR Dokumen Google Drive & Indeks Pengetahuan' : 'Google Drive Document OCR & Knowledge Graph Ingestion',
      trigger: language === 'id' ? 'Berkas Baru di folder Drive /docs' : 'New File in Drive /docs folder',
      triggerIcon: FolderOpen,
      action: language === 'id' ? 'Ekstraksi Poin Penting & Pengindeksan Otomatis' : 'DeepSeek-R1 Extract Key Takeaways & Index',
      actionIcon: Database,
      status: 'paused',
      lastRun: language === 'id' ? 'Kemarin' : 'Yesterday',
      runsCount: 19,
    },
  ]);

  const [isRunningId, setIsRunningId] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleRunNow = (id: string) => {
    setIsRunningId(id);
    setTimeout(() => {
      setIsRunningId(null);
      setWorkflows((prev) =>
        prev.map((wf) =>
          wf.id === id
            ? { ...wf, runsCount: wf.runsCount + 1, lastRun: language === 'id' ? 'Baru saja' : 'Just now' }
            : wf
        )
      );
      setSuccessNotice(`✓ ${language === 'id' ? 'Alur #' + id + ' berhasil dieksekusi di sisi klien!' : 'Workflow #' + id + ' successfully executed client-side!'}`);
      setTimeout(() => setSuccessNotice(null), 3000);
    }, 1200);
  };

  const handleToggleStatus = (id: string) => {
    setWorkflows((prev) =>
      prev.map((wf) =>
        wf.id === id
          ? { ...wf, status: wf.status === 'active' ? 'paused' : 'active' }
          : wf
      )
    );
  };

  const handleCreateNew = () => {
    const newId = `wf_${Date.now().toString().slice(-4)}`;
    const newName = language === 'id' ? `Alur Otomatisasi Baru #${newId}` : `New Agent Workflow #${newId}`;
    const newWf: WorkflowItem = {
      id: newId,
      name: newName,
      trigger: language === 'id' ? 'Pemicu Acara Baru' : 'New Event Trigger',
      triggerIcon: Zap,
      action: language === 'id' ? 'Tindakan Agen AI Mandiri' : 'Autonomous AI Action',
      actionIcon: Cpu,
      status: 'active',
      lastRun: language === 'id' ? 'Belum pernah' : 'Never',
      runsCount: 0,
    };
    setWorkflows([newWf, ...workflows]);
    setSelectedWorkflowForCanvas({ id: newId, name: newName });
  };

  // If in Visual React Flow Studio mode, render full-canvas editor
  if (selectedWorkflowForCanvas) {
    return (
      <WorkflowCanvasEditor
        workflowId={selectedWorkflowForCanvas.id}
        workflowTitle={selectedWorkflowForCanvas.name}
        onBack={() => setSelectedWorkflowForCanvas(null)}
      />
    );
  }

  return (
    <div className="page-scroll-container">
      <div className="page-content-wrapper" style={{ maxWidth: '820px' }}>
        {/* Header with Consistent Horizontal Alignment */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
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

          {/* Clean New Workflow Button (Fixed duplicate + icon) */}
          <button
            type="button"
            onClick={handleCreateNew}
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

        {/* Success Toast Notice */}
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

        {/* Visual Pipeline Node Representation Card */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg, 12px)',
            padding: '18px 20px',
            marginBottom: '28px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GitBranch size={15} color="var(--brand-primary)" />
              <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {ta.pipelineCanvas}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() =>
                  setSelectedWorkflowForCanvas({
                    id: 'canvas_studio_demo',
                    name: language === 'id' ? 'Visual Studio (React Flow)' : 'Visual Studio (React Flow)',
                  })
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  background: 'var(--brand-primary)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 115, 234, 0.3)',
                }}
              >
                <Sparkles size={12} />
                <span>{language === 'id' ? 'Buka Visual Studio' : 'Open Visual Studio'}</span>
              </button>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--accent-success)',
                  background: 'rgba(0, 200, 117, 0.1)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {ta.instantExecute}
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              background: 'var(--bg-main)',
              padding: '14px',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px dashed var(--border-strong)',
            }}
          >
            {/* Step 1: Trigger Node */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-md, 8px)',
              }}
            >
              <Clock size={15} color="#FDAB3D" />
              <div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  {ta.trigger}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Cron / Webhook
                </div>
              </div>
            </div>

            <ArrowRight size={14} color="var(--text-muted)" />

            {/* Step 2: Agent LLM Node */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-md, 8px)',
              }}
            >
              <Cpu size={15} color="var(--brand-primary)" />
              <div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  {ta.action}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  LLM BYOK Synthesizer
                </div>
              </div>
            </div>

            <ArrowRight size={14} color="var(--text-muted)" />

            {/* Step 3: Destination Node */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-md, 8px)',
              }}
            >
              <Mail size={15} color="var(--accent-success)" />
              <div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Output
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Gmail / Calendar / Drive
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workflows List Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={15} color="var(--brand-primary)" />
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {ta.activeWorkflows}
            </h2>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                background: 'var(--bg-subtle)',
                color: 'var(--text-muted)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {workflows.length}
            </span>
          </div>
        </div>

        {/* Workflow Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
          {workflows.map((wf) => {
            const TriggerIcon = wf.triggerIcon;
            const ActionIcon = wf.actionIcon;
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
                {/* 1. Header: Icon, Title & Status Toggle */}
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
                      <h3
                        style={{
                          fontSize: '14.5px',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          margin: 0,
                          lineHeight: 1.4,
                        }}
                      >
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

                {/* 2. Middle Pipeline Steps */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}
                >
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
                    <TriggerIcon size={13} color="#D97706" style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Pemicu:</span>
                    <span>{wf.trigger}</span>
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
                    <ActionIcon size={13} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Aksi:</span>
                    <span>{wf.action}</span>
                  </div>
                </div>

                {/* 3. Footer: Stats Metadata (Left) & Action Buttons (Right) */}
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
                    <span>{ta.lastRun}: <strong>{wf.lastRun}</strong></span>
                    <span>•</span>
                    <span>{wf.runsCount} {ta.times}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedWorkflowForCanvas({ id: wf.id, name: wf.name })}
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
                      onClick={() => handleRunNow(wf.id)}
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
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
