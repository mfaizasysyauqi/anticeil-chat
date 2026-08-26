'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Key,
  Copy,
  Check,
  Plus,
  Trash2,
  Terminal,
  Code2,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Search,
  Cpu,
  ChevronRight,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { useGatewayStore, GatewayApiKey } from '../store/useGatewayStore';
import { getAllGatewayModels } from '../services/routerEngine';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

export function GatewayView() {
  const language = useSettingsStore((s) => s.language);
  const theme = useSettingsStore((s) => s.theme);
  const isDark = theme === 'dark';

  const apiKeys = useGatewayStore((s) => s.apiKeys);
  const generateApiKey = useGatewayStore((s) => s.generateApiKey);
  const revokeApiKey = useGatewayStore((s) => s.revokeApiKey);
  const toggleApiKey = useGatewayStore((s) => s.toggleApiKey);

  const [origin, setOrigin] = useState('http://localhost:3000');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [selectedSnippetTab, setSelectedSnippetTab] = useState<'cursor' | 'cline' | 'python' | 'curl'>('cursor');
  const [modelSearch, setModelSearch] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const baseUrl = `${origin}/api/v1`;
  const allModels = useMemo(() => getAllGatewayModels(), []);
  const activePrimaryApiKey = apiKeys.find((k) => k.isActive)?.key || 'sk-anticeil-live-local-universal-key';

  const filteredModels = useMemo(() => {
    if (!modelSearch.trim()) return allModels.slice(0, 16);
    return allModels.filter(
      (m) =>
        m.id.toLowerCase().includes(modelSearch.toLowerCase()) ||
        m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
        m.provider.toLowerCase().includes(modelSearch.toLowerCase())
    );
  }, [allModels, modelSearch]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleCreateKey = () => {
    const key = generateApiKey(newKeyName.trim() || undefined);
    setNewKeyName('');
    setIsCreatingKey(false);
    handleCopy(key.key, key.id);
  };

  // Code snippets for 1-click copy
  const cursorConfigSnippet = JSON.stringify(
    {
      "openai.baseUrl": baseUrl,
      "openai.apiKey": activePrimaryApiKey,
      "openai.model": "claude-3-7-sonnet"
    },
    null,
    2
  );

  const pythonSnippet = `from openai import OpenAI

# Inisialisasi client OpenAI ke Anticeil Local Router Gateway
client = OpenAI(
    base_url="${baseUrl}",
    api_key="${activePrimaryApiKey}",
)

# Panggil model mana saja (Claude, GPT, DeepSeek, Llama 3 via Groq)
response = client.chat.completions.create(
    model="claude-3-7-sonnet", # atau "gpt-4o", "deepseek-r1", "gemini-2.0-flash"
    messages=[
        {"role": "system", "content": "You are a senior coding assistant."},
        {"role": "user", "content": "Jelaskan konsep Dependency Injection dalam 2 paragraf."},
    ],
    temperature=0.7,
)

print(response.choices[0].message.content)`;

  const curlSnippet = `curl -X POST ${baseUrl}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${activePrimaryApiKey}" \\
  -d '{
    "model": "deepseek-r1",
    "messages": [{"role": "user", "content": "Halo Anticeil Route!"}],
    "stream": false
  }'`;

  const clineSnippet = `{
  "apiProvider": "openai-compatible",
  "openAiBaseUrl": "${baseUrl}",
  "openAiApiKey": "${activePrimaryApiKey}",
  "openAiModelId": "claude-3-7-sonnet"
}`;

  return (
    <div className="page-scroll-container">
      <div className="page-content-wrapper" style={{ maxWidth: '1080px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '26px' }}>⚡</span>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Anticeil Route (Local AI Gateway)
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
              Active on Localhost
            </span>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
            {language === 'id'
              ? 'Gunakan Anticeil sebagai proxy AI Gateway lokal yang kompatibel dengan format standar OpenAI untuk Cursor, VS Code (Cline), Obsidian, dan script Python.'
              : 'Use Anticeil as a local OpenAI-compatible AI Gateway proxy for Cursor IDE, VS Code (Cline/Continue), Obsidian, and Python scripts.'}
          </p>
        </div>

        {/* ── 1. Base URL Endpoint Card ── */}
        <div
          style={{
            background: isDark ? 'linear-gradient(135deg, rgba(0, 115, 234, 0.08) 0%, rgba(24, 24, 27, 0.6) 100%)' : 'linear-gradient(135deg, #F0F7FF 0%, #FFFFFF 100%)',
            border: isDark ? '1px solid rgba(0, 115, 234, 0.3)' : '1px solid #BFDBFE',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--brand-primary, #0073EA)', marginBottom: '4px' }}>
                OpenAI-Compatible Base URL
              </div>
              <div style={{ fontSize: '18px', fontWeight: 750, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-primary)' }}>
                {baseUrl}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleCopy(baseUrl, 'base_url')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  background: 'var(--brand-primary, #0073EA)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 115, 234, 0.3)',
                  transition: 'all 0.15s ease',
                }}
              >
                {copiedText === 'base_url' ? <Check size={15} /> : <Copy size={15} />}
                <span>{copiedText === 'base_url' ? (language === 'id' ? 'Tersalin!' : 'Copied!') : (language === 'id' ? 'Salin Base URL' : 'Copy Base URL')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. API Key Management ── */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {language === 'id' ? 'Kunci API Gateway (Local Keys)' : 'Gateway API Keys'}
              </h2>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {language === 'id' ? 'Kunci otorisasi untuk mengakses gateway lokal Anticeil.' : 'Authorization keys for local gateway access.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCreatingKey(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={14} />
              <span>{language === 'id' ? 'Buat Kunci Baru' : 'Generate New Key'}</span>
            </button>
          </div>

          {/* Create Key Modal / Input Box */}
          {isCreatingKey && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
                padding: '12px',
                borderRadius: '10px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-strong)',
              }}
            >
              <input
                type="text"
                placeholder={language === 'id' ? 'Label Kunci (misal: Cursor IDE)' : 'Key label (e.g. Cursor IDE)'}
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateKey()}
                autoFocus
                style={{
                  flex: 1,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleCreateKey}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  background: 'var(--brand-primary, #0073EA)',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {language === 'id' ? 'Buat' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingKey(false)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '6px',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                }}
              >
                {language === 'id' ? 'Batal' : 'Cancel'}
              </button>
            </div>
          )}

          {/* Keys List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {apiKeys.map((keyItem) => (
              <div
                key={keyItem.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                  border: '1px solid var(--border-subtle)',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px' }}>
                  <Key size={16} color="var(--brand-primary, #0073EA)" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 650, color: 'var(--text-primary)' }}>
                      {keyItem.name}
                    </div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-muted)' }}>
                      {keyItem.key.slice(0, 15)}••••••••••••••••{keyItem.key.slice(-4)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleCopy(keyItem.key, keyItem.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      background: 'transparent',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                    }}
                  >
                    {copiedText === keyItem.id ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                    <span>{copiedText === keyItem.id ? (language === 'id' ? 'Disalin' : 'Copied') : (language === 'id' ? 'Salin Key' : 'Copy Key')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => revokeApiKey(keyItem.id)}
                    title={language === 'id' ? 'Hapus Kunci' : 'Revoke Key'}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '5px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3. 1-Click Integration Presets ── */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>
            {language === 'id' ? 'Panduan Integrasi Cepat (1-Click Config)' : 'Quick Integration Presets'}
          </h2>

          {/* Snippet Tabs */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {[
              { id: 'cursor', label: 'Cursor IDE', icon: Code2 },
              { id: 'cline', label: 'VS Code (Cline / Continue)', icon: Layers },
              { id: 'python', label: 'Python SDK', icon: Sparkles },
              { id: 'curl', label: 'cURL / Shell', icon: Terminal },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedSnippetTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedSnippetTab(tab.id as any)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isActive ? 'var(--brand-primary, #0073EA)' : 'var(--bg-subtle)',
                    color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={13} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Snippet Code Container */}
          <div
            style={{
              position: 'relative',
              background: isDark ? '#0A0A0A' : '#1E293B',
              borderRadius: '12px',
              padding: '14px',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '12.5px',
              color: '#F1F5F9',
              overflowX: 'auto',
            }}
          >
            <button
              type="button"
              onClick={() =>
                handleCopy(
                  selectedSnippetTab === 'cursor'
                    ? cursorConfigSnippet
                    : selectedSnippetTab === 'cline'
                    ? clineSnippet
                    : selectedSnippetTab === 'python'
                    ? pythonSnippet
                    : curlSnippet,
                  'snippet'
                )
              }
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {copiedText === 'snippet' ? <Check size={11} /> : <Copy size={11} />}
              <span>{copiedText === 'snippet' ? (language === 'id' ? 'Disalin' : 'Copied') : (language === 'id' ? 'Salin Kode' : 'Copy Code')}</span>
            </button>

            <pre style={{ margin: 0, lineHeight: 1.5 }}>
              {selectedSnippetTab === 'cursor' && cursorConfigSnippet}
              {selectedSnippetTab === 'cline' && clineSnippet}
              {selectedSnippetTab === 'python' && pythonSnippet}
              {selectedSnippetTab === 'curl' && curlSnippet}
            </pre>
          </div>
        </div>

        {/* ── 4. Available Models Directory ── */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {language === 'id' ? 'Model yang Tersedia di Gateway' : 'Available Gateway Models'}
              </h2>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {language === 'id' ? `${allModels.length} model terdaftar siap dipanggil lewat API.` : `${allModels.length} registered models ready to call.`}
              </p>
            </div>

            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={language === 'id' ? 'Cari model...' : 'Search model...'}
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '6px 10px 6px 30px',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
            {filteredModels.map((m) => (
              <div
                key={m.id}
                onClick={() => handleCopy(m.id, `model_${m.id}`)}
                className="clickable-pill"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 650, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.id}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {m.provider}
                  </div>
                </div>
                {copiedText === `model_${m.id}` ? (
                  <Check size={13} color="#10B981" />
                ) : (
                  <Copy size={13} color="var(--text-muted)" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
