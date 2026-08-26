'use client';

import React, { useState } from 'react';
import { Node } from '@xyflow/react';
import {
  Sliders,
  Trash2,
  X,
  Sparkles,
  Globe,
  Code2,
  Database,
  Mail,
  Timer,
  ArrowRightLeft,
  Sheet,
  HardDrive,
  Clock,
  Send,
  Calendar,
  FolderOpen,
  GitBranch,
  Copy,
  Check,
  Zap,
  Info,
} from 'lucide-react';

interface NodeInspectorPanelProps {
  node: Node;
  isDark: boolean;
  isMobile: boolean;
  language: string;
  onUpdateNodeData: (key: string, value: any) => void;
  onDeleteNode: () => void;
  onClose: () => void;
}

export function NodeInspectorPanel({
  node,
  isDark,
  isMobile,
  language,
  onUpdateNodeData,
  onDeleteNode,
  onClose,
}: NodeInspectorPanelProps) {
  const [activeTab, setActiveTab] = useState<'params' | 'variables' | 'settings'>('params');
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  const data = (node.data || {}) as Record<string, any>;
  const nodeType = node.type || '';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVar(text);
    setTimeout(() => setCopiedVar(null), 1500);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '7px 10px',
    borderRadius: '7px',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #CBD5E1',
    background: isDark ? '#0B0F19' : '#FFFFFF',
    color: isDark ? '#F8FAFC' : '#1E293B',
    fontSize: '12px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: "'Inter', sans-serif",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: '64px',
    resize: 'vertical',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11.5px',
    lineHeight: 1.4,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    color: isDark ? '#94A3B8' : '#64748B',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const getNodeIcon = () => {
    switch (nodeType) {
      case 'aiAgentNode':
        return <Sparkles size={14} color="#7C3AED" />;
      case 'httpNode':
        return <Globe size={14} color="#0284C7" />;
      case 'codeNode':
        return <Code2 size={14} color="#10B981" />;
      case 'databaseNode':
        return <Database size={14} color="#336791" />;
      case 'emailNode':
        return <Mail size={14} color="#EA4335" />;
      case 'delayNode':
        return <Timer size={14} color="#A855F7" />;
      case 'transformNode':
        return <ArrowRightLeft size={14} color="#0EA5E9" />;
      case 'spreadsheetNode':
        return <Sheet size={14} color="#34A853" />;
      case 'storageNode':
        return <HardDrive size={14} color="#F59E0B" />;
      case 'triggerNode':
        return <Clock size={14} color="#D97706" />;
      case 'logicNode':
        return <GitBranch size={14} color="#0891B2" />;
      case 'connectorNode':
        if (data.connectorType === 'telegram') return <Send size={14} color="#0088CC" />;
        if (data.connectorType === 'calendar') return <Calendar size={14} color="#1A73E8" />;
        if (data.connectorType === 'drive') return <FolderOpen size={14} color="#0F9D58" />;
        return <Mail size={14} color="#EA4335" />;
      default:
        return <Zap size={14} color="#0073EA" />;
    }
  };

  return (
    <div
      style={{
        background: isDark ? 'rgba(17, 24, 39, 0.98)' : 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(12px)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
        borderRadius: '14px',
        padding: '14px',
        boxShadow: isDark
          ? '0 12px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
          : '0 12px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        minWidth: 0,
        maxHeight: '75vh',
        overflowX: 'hidden',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 50,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #F1F5F9', minWidth: 0, gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {getNodeIcon()}
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 800, color: isDark ? '#F8FAFC' : '#1E293B', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {language === 'id' ? 'Konfigurasi Node' : 'Node Config'}
            </span>
            <div style={{ fontSize: '10px', color: isDark ? '#94A3B8' : '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {nodeType}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={onDeleteNode}
            style={{
              background: isDark ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2',
              border: 'none',
              color: '#EF4444',
              padding: '4px 8px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            title="Hapus Node"
          >
            <Trash2 size={11} /> {language === 'id' ? 'Hapus' : 'Delete'}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: isDark ? '#94A3B8' : '#64748B',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          background: isDark ? 'rgba(0,0,0,0.3)' : '#F1F5F9',
          padding: '3px',
          borderRadius: '8px',
          minWidth: 0,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {[
          { id: 'params', label: language === 'id' ? 'Parameter' : 'Parameters' },
          { id: 'variables', label: language === 'id' ? 'Variabel' : 'Variables' },
          { id: 'settings', label: language === 'id' ? 'Opsi' : 'Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '5px 2px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === tab.id ? (isDark ? '#1F2937' : '#FFFFFF') : 'transparent',
              color: activeTab === tab.id ? (isDark ? '#FFFFFF' : '#0F172A') : (isDark ? '#9CA3AF' : '#64748B'),
              fontSize: '11px',
              fontWeight: activeTab === tab.id ? 700 : 500,
              cursor: 'pointer',
              boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Parameters */}
      {activeTab === 'params' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
          {/* Universal Title */}
          <div>
            <label style={labelStyle}>{language === 'id' ? 'Nama / Judul Node' : 'Node Title'}</label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => onUpdateNodeData('title', e.target.value)}
              placeholder="Contoh: AI Briefing Synthesizer"
              style={inputStyle}
            />
          </div>

          {/* 1. AI AGENT NODE */}
          {nodeType === 'aiAgentNode' && (
            <>
              <div>
                <label style={labelStyle}>AI Provider & BYOK</label>
                <select
                  value={data.provider || 'anthropic'}
                  onChange={(e) => {
                    const prov = e.target.value;
                    let defaultModel = 'claude-3-7-sonnet';
                    if (prov === 'deepseek') defaultModel = 'deepseek-r1';
                    if (prov === 'groq') defaultModel = 'llama-3.3-70b-versatile';
                    if (prov === 'openai') defaultModel = 'gpt-4o';
                    if (prov === 'google') defaultModel = 'gemini-2.5-flash';
                    onUpdateNodeData('provider', prov);
                    onUpdateNodeData('model', defaultModel);
                  }}
                  style={selectStyle}
                >
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="deepseek">DeepSeek (R1 / V3)</option>
                  <option value="groq">Groq Ultra-Fast LPUs</option>
                  <option value="openai">OpenAI (GPT-4o)</option>
                  <option value="google">Google (Gemini 2.5)</option>
                  <option value="ollama">Ollama (Local Offline)</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Model AI</label>
                <input
                  type="text"
                  value={data.model || 'claude-3-7-sonnet'}
                  onChange={(e) => onUpdateNodeData('model', e.target.value)}
                  placeholder="claude-3-7-sonnet / deepseek-r1 / gpt-4o"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  <span>Creativity Temperature</span>
                  <span style={{ fontFamily: 'monospace', color: '#0073EA' }}>{data.temperature ?? 0.7}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={data.temperature ?? 0.7}
                  onChange={(e) => onUpdateNodeData('temperature', parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#0073EA', cursor: 'pointer' }}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  <span>System Prompt / Instruksi</span>
                </label>
                <textarea
                  value={data.promptSnippet || ''}
                  onChange={(e) => onUpdateNodeData('promptSnippet', e.target.value)}
                  placeholder="Analisis agenda hari ini, identifikasi bentrok, dan susun poin persiapan briefing..."
                  style={textareaStyle}
                  rows={3}
                />
              </div>
            </>
          )}

          {/* 2. HTTP REQUEST NODE */}
          {nodeType === 'httpNode' && (
            <>
              <div>
                <label style={labelStyle}>HTTP Method</label>
                <select
                  value={data.method || 'GET'}
                  onChange={(e) => onUpdateNodeData('method', e.target.value)}
                  style={selectStyle}
                >
                  <option value="GET">GET (Ambil Data)</option>
                  <option value="POST">POST (Kirim Data Baru)</option>
                  <option value="PUT">PUT (Perbarui Data)</option>
                  <option value="PATCH">PATCH (Perbarui Sebagian)</option>
                  <option value="DELETE">DELETE (Hapus)</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>URL Endpoint</label>
                <input
                  type="text"
                  value={data.url || ''}
                  onChange={(e) => onUpdateNodeData('url', e.target.value)}
                  placeholder="https://api.example.com/v1/resource"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Auth Type</label>
                <select
                  value={data.authType || 'none'}
                  onChange={(e) => onUpdateNodeData('authType', e.target.value)}
                  style={selectStyle}
                >
                  <option value="none">Tanpa Autentikasi (Public)</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="apiKey">API Key Header</option>
                  <option value="basic">Basic Auth</option>
                </select>
              </div>

              {['POST', 'PUT', 'PATCH'].includes(data.method || 'GET') && (
                <div>
                  <label style={labelStyle}>JSON Request Body</label>
                  <textarea
                    value={data.body || '{\n  "query": "{{ $trigger.data }}"\n}'}
                    onChange={(e) => onUpdateNodeData('body', e.target.value)}
                    style={textareaStyle}
                    rows={3}
                  />
                </div>
              )}
            </>
          )}

          {/* 3. CUSTOM CODE NODE */}
          {nodeType === 'codeNode' && (
            <>
              <div>
                <label style={labelStyle}>Bahasa Pemrograman</label>
                <select
                  value={data.language || 'javascript'}
                  onChange={(e) => onUpdateNodeData('language', e.target.value)}
                  style={selectStyle}
                >
                  <option value="javascript">JavaScript (Edge Runtime)</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python (Pyodide WebAssembly)</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  <span>Script Code Transformer</span>
                </label>
                <textarea
                  value={data.codeSnippet || 'return items.map(i => ({\n  ...i,\n  processedAt: new Date().toISOString()\n}));'}
                  onChange={(e) => onUpdateNodeData('codeSnippet', e.target.value)}
                  style={{ ...textareaStyle, minHeight: '90px' }}
                  rows={4}
                />
              </div>
            </>
          )}

          {/* 4. DATABASE NODE */}
          {nodeType === 'databaseNode' && (
            <>
              <div>
                <label style={labelStyle}>Database Engine</label>
                <select
                  value={data.dbType || 'postgres'}
                  onChange={(e) => onUpdateNodeData('dbType', e.target.value)}
                  style={selectStyle}
                >
                  <option value="postgres">PostgreSQL</option>
                  <option value="supabase">Supabase Postgres</option>
                  <option value="mysql">MySQL</option>
                  <option value="mongodb">MongoDB</option>
                  <option value="redis">Redis KV</option>
                  <option value="firebase">Firebase Firestore</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Operasi Data</label>
                <select
                  value={data.operation || 'select'}
                  onChange={(e) => onUpdateNodeData('operation', e.target.value)}
                  style={selectStyle}
                >
                  <option value="select">SELECT / Query Data</option>
                  <option value="insert">INSERT / Tambah Record</option>
                  <option value="update">UPDATE / Perbarui Record</option>
                  <option value="upsert">UPSERT / Insert or Update</option>
                  <option value="delete">DELETE / Hapus Record</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Nama Tabel / Collection</label>
                <input
                  type="text"
                  value={data.table || ''}
                  onChange={(e) => onUpdateNodeData('table', e.target.value)}
                  placeholder="users / leads / daily_briefings"
                  style={inputStyle}
                />
              </div>
            </>
          )}

          {/* 5. TRIGGER NODE */}
          {nodeType === 'triggerNode' && (
            <>
              <div>
                <label style={labelStyle}>Tipe Pemicu</label>
                <select
                  value={data.triggerType || 'cron'}
                  onChange={(e) => onUpdateNodeData('triggerType', e.target.value)}
                  style={selectStyle}
                >
                  <option value="cron">Jadwal Otomatis (Cron 24/7)</option>
                  <option value="webhook">Inbound Webhook API</option>
                  <option value="manual">Manual Trigger</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Jadwal / Preset Cron</label>
                <select
                  value={data.schedule || 'Setiap hari pukul 08:00 WIB'}
                  onChange={(e) => onUpdateNodeData('schedule', e.target.value)}
                  style={selectStyle}
                >
                  <option value="Setiap hari pukul 08:00 WIB">Setiap hari pukul 08:00 WIB (0 8 * * *)</option>
                  <option value="Setiap 15 Menit">Setiap 15 Menit (*/15 * * * *)</option>
                  <option value="Setiap Jam">Setiap Jam (0 * * * *)</option>
                  <option value="Setiap Senin Pagi">Setiap Senin Pagi (0 9 * * 1)</option>
                  <option value="Custom Cron Expression">Kustom Cron Expression</option>
                </select>
              </div>
            </>
          )}

          {/* 6. LOGIC NODE */}
          {nodeType === 'logicNode' && (
            <>
              <div>
                <label style={labelStyle}>Aturan Evaluasi Kondisi</label>
                <input
                  type="text"
                  value={data.condition || 'output.priority === "HIGH"'}
                  onChange={(e) => onUpdateNodeData('condition', e.target.value)}
                  placeholder="data.count > 0 && data.status === 'valid'"
                  style={inputStyle}
                />
              </div>
              <div style={{ fontSize: '11px', color: isDark ? '#94A3B8' : '#64748B', lineHeight: 1.4, background: isDark ? 'rgba(8,145,178,0.1)' : '#F0FDFA', padding: '8px', borderRadius: '6px', border: isDark ? '1px solid rgba(8,145,178,0.2)' : '1px solid #CCFBF1' }}>
                💡 Pin output atas bernilai <strong>TRUE</strong>, pin output bawah bernilai <strong>FALSE</strong>.
              </div>
            </>
          )}

          {/* 7. CONNECTOR NODE */}
          {nodeType === 'connectorNode' && (
            <>
              <div>
                <label style={labelStyle}>Tipe Layanan</label>
                <select
                  value={data.connectorType || 'telegram'}
                  onChange={(e) => onUpdateNodeData('connectorType', e.target.value)}
                  style={selectStyle}
                >
                  <option value="telegram">Telegram Bot</option>
                  <option value="calendar">Google Calendar</option>
                  <option value="gmail">Gmail</option>
                  <option value="drive">Google Drive</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Aksi (Action)</label>
                <input
                  type="text"
                  value={data.actionType || 'Send Message Alert'}
                  onChange={(e) => onUpdateNodeData('actionType', e.target.value)}
                  placeholder="Send Message Alert / List Today Events"
                  style={inputStyle}
                />
              </div>
            </>
          )}

          {/* 8. EMAIL NODE */}
          {nodeType === 'emailNode' && (
            <>
              <div>
                <label style={labelStyle}>Layanan Email</label>
                <select
                  value={data.service || 'gmail'}
                  onChange={(e) => onUpdateNodeData('service', e.target.value)}
                  style={selectStyle}
                >
                  <option value="gmail">Gmail API</option>
                  <option value="resend">Resend</option>
                  <option value="sendgrid">SendGrid</option>
                  <option value="mailgun">Mailgun</option>
                  <option value="smtp">Custom SMTP Server</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Penerima (To)</label>
                <input
                  type="email"
                  value={data.to || ''}
                  onChange={(e) => onUpdateNodeData('to', e.target.value)}
                  placeholder="client@example.com / {{ $json.email }}"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Subjek Email</label>
                <input
                  type="text"
                  value={data.subject || ''}
                  onChange={(e) => onUpdateNodeData('subject', e.target.value)}
                  placeholder="Laporan Mingguan Anticeil"
                  style={inputStyle}
                />
              </div>
            </>
          )}

          {/* 9. DELAY NODE */}
          {nodeType === 'delayNode' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={labelStyle}>Durasi Jeda</label>
                  <input
                    type="number"
                    min="1"
                    value={data.duration || '5'}
                    onChange={(e) => onUpdateNodeData('duration', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Satuan Waktu</label>
                  <select
                    value={data.unit || 'minutes'}
                    onChange={(e) => onUpdateNodeData('unit', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="seconds">Detik</option>
                    <option value="minutes">Menit</option>
                    <option value="hours">Jam</option>
                    <option value="days">Hari</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* 10. TRANSFORM NODE */}
          {nodeType === 'transformNode' && (
            <>
              <div>
                <label style={labelStyle}>Operasi Transform</label>
                <select
                  value={data.operation || 'map'}
                  onChange={(e) => onUpdateNodeData('operation', e.target.value)}
                  style={selectStyle}
                >
                  <option value="map">Map (Transformasi Per Item)</option>
                  <option value="filter">Filter (Saring Item)</option>
                  <option value="reduce">Reduce (Akumulasi)</option>
                  <option value="merge">Merge Objects</option>
                  <option value="sort">Sort / Urutkan</option>
                  <option value="flatten">Flatten Array</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Ekspresi Transform</label>
                <textarea
                  value={data.expression || 'items.map(i => ({ ...i, processed: true }))'}
                  onChange={(e) => onUpdateNodeData('expression', e.target.value)}
                  style={textareaStyle}
                  rows={3}
                />
              </div>
            </>
          )}

          {/* 11. SPREADSHEET NODE */}
          {nodeType === 'spreadsheetNode' && (
            <>
              <div>
                <label style={labelStyle}>Layanan Spreadsheet</label>
                <select
                  value={data.service || 'google-sheets'}
                  onChange={(e) => onUpdateNodeData('service', e.target.value)}
                  style={selectStyle}
                >
                  <option value="google-sheets">Google Sheets</option>
                  <option value="excel">Microsoft Excel (365)</option>
                  <option value="airtable">Airtable</option>
                  <option value="notion">Notion Database</option>
                  <option value="csv">CSV File</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Operasi</label>
                <select
                  value={data.operation || 'read'}
                  onChange={(e) => onUpdateNodeData('operation', e.target.value)}
                  style={selectStyle}
                >
                  <option value="read">Baca Baris Data (Read)</option>
                  <option value="append">Tambah Baris Baru (Append)</option>
                  <option value="update">Update Sel / Baris</option>
                  <option value="clear">Bersihkan Sheet</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Nama Sheet / Tab</label>
                <input
                  type="text"
                  value={data.sheetName || 'Sheet1'}
                  onChange={(e) => onUpdateNodeData('sheetName', e.target.value)}
                  placeholder="Sheet1 / Data_2026"
                  style={inputStyle}
                />
              </div>
            </>
          )}

          {/* 12. STORAGE NODE */}
          {nodeType === 'storageNode' && (
            <>
              <div>
                <label style={labelStyle}>Provider Penyimpanan</label>
                <select
                  value={data.provider || 'r2'}
                  onChange={(e) => onUpdateNodeData('provider', e.target.value)}
                  style={selectStyle}
                >
                  <option value="r2">Cloudflare R2</option>
                  <option value="s3">Amazon S3</option>
                  <option value="supabase-storage">Supabase Storage</option>
                  <option value="gcs">Google Cloud Storage</option>
                  <option value="uploadthing">UploadThing</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Aksi File</label>
                <select
                  value={data.operation || 'upload'}
                  onChange={(e) => onUpdateNodeData('operation', e.target.value)}
                  style={selectStyle}
                >
                  <option value="upload">Upload File</option>
                  <option value="download">Download / Baca File</option>
                  <option value="list">Daftar File di Bucket</option>
                  <option value="delete">Hapus File</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Nama Bucket / Direktori</label>
                <input
                  type="text"
                  value={data.bucket || 'assets'}
                  onChange={(e) => onUpdateNodeData('bucket', e.target.value)}
                  placeholder="assets / exports / backups"
                  style={inputStyle}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 2: Dynamic Variables Picker */}
      {activeTab === 'variables' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
          <div style={{ fontSize: '11px', color: isDark ? '#94A3B8' : '#64748B', lineHeight: 1.4, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
            Klik variabel di bawah untuk menyalin tag dinamis ke kolom template/prompt:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: 0 }}>
            {[
              { tag: '{{ $trigger.data }}', desc: 'Payload data dari trigger awal' },
              { tag: '{{ $json.output }}', desc: 'Output data dari blok sebelumnya' },
              { tag: '{{ $json.body }}', desc: 'Isi konten respon HTTP / Webhook' },
              { tag: '{{ $calendar.events }}', desc: 'Daftar event dari Google Calendar' },
              { tag: '{{ $ai.reasoning }}', desc: 'Hasil analisis sintesis AI' },
              { tag: '{{ $env.DATE_ISO }}', desc: 'Timestamp eksekusi alur saat ini' },
            ].map((v) => (
              <div
                key={v.tag}
                onClick={() => handleCopy(v.tag)}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  background: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  minWidth: 0,
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '11.5px', fontFamily: 'monospace', fontWeight: 700, color: '#0073EA', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {v.tag}
                  </div>
                  <div style={{ fontSize: '10px', color: isDark ? '#94A3B8' : '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {v.desc}
                  </div>
                </div>
                {copiedVar === v.tag ? (
                  <Check size={13} color="#10B981" style={{ flexShrink: 0 }} />
                ) : (
                  <Copy size={13} color={isDark ? '#64748B' : '#94A3B8'} style={{ flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Settings & Execution Safety */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
          <div>
            <label style={labelStyle}>Opsi Retry saat Gagal</label>
            <select
              value={data.retryCount || '0'}
              onChange={(e) => onUpdateNodeData('retryCount', e.target.value)}
              style={selectStyle}
            >
              <option value="0">Jangan Coba Ulang (Fail Fast)</option>
              <option value="1">1 Kali Coba Ulang</option>
              <option value="3">3 Kali Coba Ulang (Exponential Backoff)</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Maksimal Waktu Tunggu (Timeout)</label>
            <select
              value={data.timeoutSeconds || '30'}
              onChange={(e) => onUpdateNodeData('timeoutSeconds', e.target.value)}
              style={selectStyle}
            >
              <option value="10">10 Detik</option>
              <option value="30">30 Detik (Default)</option>
              <option value="60">60 Detik (Cloudflare Worker Limit)</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Perilaku Jika Error</label>
            <select
              value={data.onError || 'stop'}
              onChange={(e) => onUpdateNodeData('onError', e.target.value)}
              style={selectStyle}
            >
              <option value="stop">Hentikan Alur Kerja (Stop Workflow)</option>
              <option value="continue">Lanjutkan ke Node Berikutnya (Continue on Fail)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
