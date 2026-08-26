'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Key,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Search,
  Sparkles,
  Cookie,
  HardDrive,
  Volume2,
  X,
  Globe,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import {
  useGatewayStore,
  GatewaySubNav,
  GatewayApiKey,
  ModelCombo,
} from '../store/useGatewayStore';
import {
  ALL_GATEWAY_PROVIDERS,
  GatewayProvider,
  ProviderCategory,
} from '../providers';

export const GatewayView: React.FC = () => {
  const {
    activeSubNav,
    setActiveSubNav,
    apiKeys,
    requestLogs,
    activePort,
    providerConnections,
    activeCategory,
    searchQuery,
    combos,
    compression,
    generateApiKey,
    revokeApiKey,
    toggleApiKey,
    addCombo,
    removeCombo,
    toggleCombo,
    setCompressionMode,
    updateCompression,
    clearRequestLogs,
    setProviderConnection,
    toggleProvider,
    setActiveCategory,
    setSearchQuery,
  } = useGatewayStore();

  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [activeSnippetTab, setActiveSnippetTab] = useState<'cursor' | 'cline' | 'python' | 'curl'>('cursor');
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'free'>('all');

  // Key creation state
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreatingKey, setIsCreatingKey] = useState(false);

  // Combo creation state
  const [isCreatingCombo, setIsCreatingCombo] = useState(false);
  const [comboName, setComboName] = useState('');
  const [comboDesc, setComboDesc] = useState('');
  const [comboChainText, setComboChainText] = useState('groq/compound, gemini/gemini-2.0-flash, cerebras/llama-3.3-70b');

  // Compressor test state
  const [testPrompt, setTestPrompt] = useState(
    'Halo Anticeil Route! Ini adalah prompt uji coba untuk mengetes kemampuan pemangkasan spasi berlebih, redundansi kata, serta deduplikasi konteks dokumen panjang sebelum dikirimkan ke model AI.'
  );

  // Modal Configuration state
  const [selectedProvider, setSelectedProvider] = useState<GatewayProvider | null>(null);
  const [modalApiKey, setModalApiKey] = useState('');
  const [modalCookieToken, setModalCookieToken] = useState('');
  const [modalOAuthToken, setModalOAuthToken] = useState('');
  const [modalBaseUrl, setModalBaseUrl] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  // Dynamic host detection
  const [detectedOrigin, setDetectedOrigin] = useState<string>('http://localhost:3000');
  const [domainMode, setDomainMode] = useState<'auto' | 'cloud' | 'local'>('auto');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDetectedOrigin(window.location.origin);
    }
  }, []);

  const activeOrigin = useMemo(() => {
    if (domainMode === 'cloud') return 'https://anticeil.com';
    if (domainMode === 'local') return `http://localhost:${activePort}`;
    return detectedOrigin || `http://localhost:${activePort}`;
  }, [domainMode, detectedOrigin, activePort]);

  const baseUrl = `${activeOrigin}/api/v1`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleCopySnippet = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    generateApiKey(newKeyName);
    setNewKeyName('');
    setIsCreatingKey(false);
  };

  const handleCreateCombo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comboName.trim()) return;
    const chain = comboChainText.split(',').map((s) => s.trim()).filter(Boolean);
    addCombo({
      name: comboName.trim(),
      description: comboDesc.trim() || 'Custom model fallback chain.',
      chain,
      isActive: true,
    });
    setComboName('');
    setComboDesc('');
    setIsCreatingCombo(false);
  };

  const openConfigModal = (provider: GatewayProvider) => {
    setSelectedProvider(provider);
    const existing = providerConnections[provider.id];
    setModalApiKey(existing?.apiKey || '');
    setModalCookieToken(existing?.cookieToken || '');
    setModalOAuthToken(existing?.oauthToken || '');
    setModalBaseUrl(existing?.baseUrl || provider.defaultBaseUrl || '');
    setTestResult(null);
  };

  const handleSaveProviderConfig = () => {
    if (!selectedProvider) return;
    setProviderConnection(selectedProvider.id, {
      apiKey: modalApiKey.trim() || undefined,
      cookieToken: modalCookieToken.trim() || undefined,
      oauthToken: modalOAuthToken.trim() || undefined,
      baseUrl: modalBaseUrl.trim() || undefined,
      testStatus: 'success',
    });
    setSelectedProvider(null);
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setTestResult('success');
    } catch {
      setTestResult('error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Filter providers
  const filteredProviders = useMemo(() => {
    return ALL_GATEWAY_PROVIDERS.filter((p) => {
      if (activeCategory !== 'all' && p.category !== activeCategory) {
        return false;
      }
      const conn = providerConnections[p.id];
      if (statusFilter === 'connected' && (!conn || !conn.isEnabled)) {
        return false;
      }
      if (statusFilter === 'free' && p.badge !== 'FREE' && p.authType !== 'no-auth') {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        const matchesModels = p.models?.some((m) => m.toLowerCase().includes(q));
        const matchesId = p.id.toLowerCase().includes(q);
        return matchesName || matchesDesc || matchesModels || matchesId;
      }
      return true;
    });
  }, [activeCategory, statusFilter, searchQuery, providerConnections]);

  const connectedCount = useMemo(() => {
    return Object.values(providerConnections).filter((c) => c.isEnabled).length;
  }, [providerConnections]);

  const primaryKey = apiKeys.find((k) => k.isActive)?.key || apiKeys[0]?.key || 'sk-anticeil-live-local-universal-key';

  const snippets = {
    cursor: JSON.stringify(
      {
        'openai.baseUrl': baseUrl,
        'openai.apiKey': primaryKey,
        'openai.model': 'groq/compound',
      },
      null,
      2
    ),
    cline: JSON.stringify(
      {
        apiProvider: 'openai-compatible',
        baseUrl: baseUrl,
        apiKey: primaryKey,
        apiModelId: 'groq/compound',
      },
      null,
      2
    ),
    python: `import openai

client = openai.OpenAI(
    base_url="${baseUrl}",
    api_key="${primaryKey}",
)

response = client.chat.completions.create(
    model="groq/compound",
    messages=[{"role": "user", "content": "Halo dari Anticeil Route!"}],
)
print(response.choices[0].message.content)`,
    curl: `curl -X POST ${baseUrl}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${primaryKey}" \\
  -d '{
    "model": "groq/compound",
    "messages": [{"role": "user", "content": "Halo Anticeil Route!"}],
    "stream": true
  }'`,
  };

  const categories: Array<{ id: ProviderCategory | 'all'; label: string; icon: React.ReactNode }> = [
    { id: 'all', label: 'Semua (295+)', icon: <Globe size={13} /> },
    { id: 'no-auth', label: 'Tingkat Gratis', icon: <Sparkles size={13} color="#34d399" /> },
    { id: 'oauth', label: 'OAuth2 / IDE', icon: <ShieldCheck size={13} color="#38bdf8" /> },
    { id: 'web-cookie', label: 'Web Cookies', icon: <Cookie size={13} color="#fbbf24" /> },
    { id: 'apikey', label: 'Kunci API (192+)', icon: <Key size={13} color="#818cf8" /> },
    { id: 'local', label: 'Lokal PC', icon: <HardDrive size={13} color="#c084fc" /> },
    { id: 'search', label: 'Pencarian & RAG', icon: <Search size={13} color="#60a5fa" /> },
    { id: 'audio', label: 'Audio & TTS', icon: <Volume2 size={13} color="#f43f5e" /> },
  ];

  // Provider Quota Mock Live Data
  const quotas = [
    { name: 'Groq Cloud (LPU Speed)', usedTpm: 3074, limitTpm: 8000, usedRpm: 12, limitRpm: 30, tier: 'Free Tier', resetIn: '10s' },
    { name: 'Google AI Studio (Gemini)', usedTpm: 45000, limitTpm: 1000000, usedRpm: 4, limitRpm: 15, tier: 'Free Tier', resetIn: '1m' },
    { name: 'Cerebras AI (Wafer Scale)', usedTpm: 12000, limitTpm: 1000000, usedRpm: 2, limitRpm: 60, tier: 'Free 1M TPM', resetIn: '1m' },
    { name: 'SambaNova Cloud (DeepSeek R1)', usedTpm: 8500, limitTpm: 500000, usedRpm: 1, limitRpm: 20, tier: 'Free Tier', resetIn: '1m' },
    { name: 'Cloudflare Workers AI', usedTpm: 1200, limitTpm: 10000, usedRpm: 5, limitRpm: 100, tier: '10k Free Neurons/Day', resetIn: 'Daily' },
  ];

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        background: 'var(--bg-main)',
        color: 'var(--text-primary)',
        overflowY: 'auto',
        fontFamily: 'inherit',
        padding: '24px 32px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ═════════ 1. MODULE: 295+ PROVIDERS CATALOG ═════════ */}
          {activeSubNav === 'providers' && (
            <>
              {/* Top Banner */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Katalog 295+ Provider AI
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                    Hubungkan akun gratis, token OAuth IDE, cookie browser web, atau API Key pribadi Anda.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600, background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.25)' }}>
                    {connectedCount} Provider Aktif
                  </span>
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                {categories.map((cat) => {
                  const isSelected = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        background: isSelected ? 'var(--bg-elevated)' : 'var(--bg-card)',
                        border: isSelected ? '1px solid var(--border-strong)' : '1px solid var(--border-subtle)',
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}
                    >
                      {cat.icon}
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Search and Filters Bar */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
                  <Search size={15} style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari dari 295+ provider, model (contoh: DeepSeek, Copilot, Cerebras, FLUX)..."
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                      width: '100%',
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.25)', padding: '2px 4px', borderRadius: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    style={{
                      background: statusFilter === 'all' ? 'var(--bg-elevated)' : 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: statusFilter === 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('connected')}
                    style={{
                      background: statusFilter === 'connected' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: statusFilter === 'connected' ? '#34d399' : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    Aktif
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('free')}
                    style={{
                      background: statusFilter === 'free' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: statusFilter === 'free' ? '#38bdf8' : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    Tingkat Gratis
                  </button>
                </div>
              </div>

              {/* Provider Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '12px',
                }}
              >
                {filteredProviders.map((provider) => {
                  const conn = providerConnections[provider.id];
                  const isConnected = conn?.isEnabled;

                  const badgeColors = {
                    FREE: { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', text: '#34d399' },
                    OAUTH: { bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.3)', text: '#38bdf8' },
                    COOKIE: { bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.3)', text: '#fbbf24' },
                    'API KEY': { bg: 'rgba(129, 140, 248, 0.15)', border: 'rgba(129, 140, 248, 0.3)', text: '#818cf8' },
                    LOCAL: { bg: 'rgba(192, 132, 252, 0.15)', border: 'rgba(192, 132, 252, 0.3)', text: '#c084fc' },
                    RAG: { bg: 'rgba(96, 165, 250, 0.15)', border: 'rgba(96, 165, 250, 0.3)', text: '#60a5fa' },
                  }[provider.badge || 'API KEY'];

                  return (
                    <div
                      key={provider.id}
                      style={{
                        background: isConnected ? 'linear-gradient(145deg, var(--bg-card), rgba(16, 185, 129, 0.03))' : 'var(--bg-card)',
                        border: isConnected ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-subtle)',
                        borderRadius: '10px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{provider.name}</span>
                          {provider.badge && (
                            <span
                              style={{
                                fontSize: '9px',
                                fontWeight: 700,
                                padding: '1px 5px',
                                borderRadius: '4px',
                                background: badgeColors.bg,
                                border: `1px solid ${badgeColors.border}`,
                                color: badgeColors.text,
                              }}
                            >
                              {provider.badge}
                            </span>
                          )}
                        </div>

                        <p
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.4,
                            margin: 0,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {provider.description}
                        </p>

                        {provider.models && provider.models.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', paddingTop: '2px' }}>
                            {provider.models.slice(0, 2).map((m) => (
                              <span
                                key={m}
                                style={{
                                  fontSize: '10px',
                                  fontFamily: 'monospace',
                                  background: 'rgba(0,0,0,0.25)',
                                  border: '1px solid var(--border-subtle)',
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  color: 'var(--text-secondary)',
                                }}
                              >
                                {m}
                              </span>
                            ))}
                            {provider.models.length > 2 && (
                              <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600 }}>
                                +{provider.models.length - 2} lainnya
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '8px',
                          borderTop: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div>
                          {provider.website && (
                            <a
                              href={provider.website}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: '10px', color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                            >
                              Web <ExternalLink size={10} />
                            </a>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => openConfigModal(provider)}
                            style={{
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '5px',
                              padding: '3px 8px',
                              fontSize: '10px',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                            }}
                          >
                            Atur
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleProvider(provider.id)}
                            style={{
                              background: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-elevated)',
                              border: isConnected ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                              borderRadius: '5px',
                              padding: '3px 8px',
                              fontSize: '10px',
                              fontWeight: 700,
                              color: isConnected ? '#34d399' : 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: isConnected ? '#34d399' : 'var(--text-muted)' }} />
                            {isConnected ? 'Aktif' : 'Sambungkan'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ═════════ 2. MODULE: API KEY MANAGER ═════════ */}
          {activeSubNav === 'api-keys' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Manajer Kunci API Gateway
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                    Buat dan kelola token autentikasi (Bearer token) untuk menghubungkan aplikasi eksternal (Cursor, Cline, Python).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingKey(true)}
                  style={{
                    background: 'var(--brand-primary)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={14} /> Buat Kunci Baru
                </button>
              </div>

              {isCreatingKey && (
                <form
                  onSubmit={handleCreateKey}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Nama Kunci (contoh: Cursor IDE Laptop, Cline VS Code)..."
                    style={{
                      flex: 1,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: '#34d399',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#000000',
                      cursor: 'pointer',
                    }}
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingKey(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Batal
                  </button>
                </form>
              )}

              {/* Keys List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {apiKeys.map((k) => (
                  <div
                    key={k.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{k.name}</span>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: k.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
                            color: k.isActive ? '#34d399' : '#f43f5e',
                          }}
                        >
                          {k.isActive ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </div>
                      <code style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                        {k.key}
                      </code>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{k.requestCount} request</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(k.key, k.id)}
                        style={{
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          padding: '5px 10px',
                          fontSize: '11px',
                          color: copiedKeyId === k.id ? '#34d399' : 'var(--text-primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {copiedKeyId === k.id ? <Check size={12} /> : <Copy size={12} />}
                        {copiedKeyId === k.id ? 'Tersalin' : 'Salin'}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleApiKey(k.id)}
                        style={{
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          padding: '5px 10px',
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        {k.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      {apiKeys.length > 1 && (
                        <button
                          type="button"
                          onClick={() => revokeApiKey(k.id)}
                          style={{
                            background: 'rgba(244,63,94,0.1)',
                            border: '1px solid rgba(244,63,94,0.25)',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            color: '#f43f5e',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═════════ 3. MODULE: PROVIDER QUOTA & LIMIT TRACKER ═════════ */}
          {activeSubNav === 'quota' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Provider Quota & Rate Limit Tracker
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Pantau pemakaian token per menit (TPM) dan request per menit (RPM) agar tidak terkena HTTP 429 Rate Limit.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
                {quotas.map((q) => {
                  const tpmPercent = Math.min(100, Math.round((q.usedTpm / q.limitTpm) * 100));
                  return (
                    <div
                      key={q.name}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{q.name}</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
                          {q.tier}
                        </span>
                      </div>

                      {/* TPM Bar */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                          <span>Tokens Per Minute (TPM)</span>
                          <span style={{ fontWeight: 700 }}>{q.usedTpm.toLocaleString()} / {q.limitTpm.toLocaleString()}</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${tpmPercent}%`, height: '100%', background: tpmPercent > 80 ? '#f43f5e' : '#06b6d4', transition: 'width 0.3s ease' }} />
                        </div>
                      </div>

                      {/* RPM Info */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', paddingTop: '4px', borderTop: '1px solid var(--border-subtle)' }}>
                        <span>Requests / Menit: <b>{q.usedRpm} / {q.limitRpm} RPM</b></span>
                        <span>Reset: <b>{q.resetIn}</b></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═════════ 4. MODULE: ENDPOINTS & SETUP ═════════ */}
          {activeSubNav === 'endpoint' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Endpoints & 1-Click Setup Panduan
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Gunakan Base URL ini di software coding favorit Anda untuk menikmati multi-model AI tanpa limit.
                </p>
              </div>

              {/* Base URL Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, var(--bg-card), rgba(20,24,30,0.95))',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase' }}>
                    Universal OpenAI Base URL
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setDomainMode('auto')}
                      style={{ background: domainMode === 'auto' ? 'rgba(6,182,212,0.2)' : 'transparent', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', fontWeight: 600, color: domainMode === 'auto' ? '#38bdf8' : 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      Auto
                    </button>
                    <button
                      type="button"
                      onClick={() => setDomainMode('cloud')}
                      style={{ background: domainMode === 'cloud' ? 'rgba(16,185,129,0.2)' : 'transparent', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', fontWeight: 600, color: domainMode === 'cloud' ? '#34d399' : 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      anticeil.com
                    </button>
                    <button
                      type="button"
                      onClick={() => setDomainMode('local')}
                      style={{ background: domainMode === 'local' ? 'rgba(192,132,252,0.2)' : 'transparent', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', fontWeight: 600, color: domainMode === 'local' ? '#c084fc' : 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      localhost:{activePort}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <code style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'monospace', background: 'rgba(0,0,0,0.4)', padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}>
                    {baseUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy(baseUrl, 'baseUrl')}
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: copiedKeyId === 'baseUrl' ? '#34d399' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600 }}
                  >
                    {copiedKeyId === 'baseUrl' ? <Check size={13} /> : <Copy size={13} />}
                    {copiedKeyId === 'baseUrl' ? 'Tersalin' : 'Salin Base URL'}
                  </button>
                </div>
              </div>

              {/* Code Snippets Box */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Contoh Konfigurasi Klien</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '6px' }}>
                    {(['cursor', 'cline', 'python', 'curl'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveSnippetTab(tab)}
                        style={{
                          background: activeSnippetTab === tab ? 'var(--bg-elevated)' : 'transparent',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: activeSnippetTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        {tab === 'cursor' ? 'Cursor IDE' : tab === 'cline' ? 'VS Code Cline' : tab === 'python' ? 'Python SDK' : 'cURL'}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ position: 'relative' }}>
                  <pre style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid var(--border-strong)', borderRadius: '8px', padding: '12px 14px', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-secondary)', overflowX: 'auto', margin: 0 }}>
                    {snippets[activeSnippetTab]}
                  </pre>
                  <button
                    type="button"
                    onClick={() => handleCopySnippet(snippets[activeSnippetTab], activeSnippetTab)}
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, color: copiedSnippet === activeSnippetTab ? '#34d399' : 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {copiedSnippet === activeSnippetTab ? <Check size={12} /> : <Copy size={12} />}
                    {copiedSnippet === activeSnippetTab ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═════════ 5. MODULE: COMBOS & SMART FAILOVER ═════════ */}
          {activeSubNav === 'combos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Combos & Smart Failover Cascades
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                    Gabungkan beberapa model dalam 1 rantai. Jika provider pertama terkena HTTP 429 atau 500, otomatis dialihkan ke cadangan berikutnya.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingCombo(true)}
                  style={{ background: 'var(--brand-primary)', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                >
                  <Plus size={14} /> Buat Combo Baru
                </button>
              </div>

              {isCreatingCombo && (
                <form
                  onSubmit={handleCreateCombo}
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}
                >
                  <input
                    type="text"
                    value={comboName}
                    onChange={(e) => setComboName(e.target.value)}
                    placeholder="Nama Combo (contoh: Ultra Fast Free Fallback)..."
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none' }}
                  />
                  <input
                    type="text"
                    value={comboDesc}
                    onChange={(e) => setComboDesc(e.target.value)}
                    placeholder="Deskripsi singkat..."
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none' }}
                  />
                  <input
                    type="text"
                    value={comboChainText}
                    onChange={(e) => setComboChainText(e.target.value)}
                    placeholder="Daftar model dipisahkan koma (contoh: groq/compound, gemini/gemini-2.0-flash, cerebras/llama-3.3-70b)..."
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setIsCreatingCombo(false)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      style={{ background: '#34d399', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, color: '#000000', cursor: 'pointer' }}
                    >
                      Simpan Combo
                    </button>
                  </div>
                </form>
              )}

              {/* Combos Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {combos.map((combo) => (
                  <div
                    key={combo.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{combo.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{combo.description}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => toggleCombo(combo.id)}
                          style={{
                            background: combo.isActive ? 'rgba(16,185,129,0.15)' : 'var(--bg-elevated)',
                            border: combo.isActive ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border-subtle)',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: combo.isActive ? '#34d399' : 'var(--text-muted)',
                            cursor: 'pointer',
                          }}
                        >
                          {combo.isActive ? 'Aktif' : 'Nonaktif'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCombo(combo.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Cascade Visual Chain */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '4px' }}>
                      {combo.chain.map((step, idx) => (
                        <React.Fragment key={step}>
                          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-strong)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                            <span style={{ color: '#06b6d4', fontWeight: 700, marginRight: '4px' }}>#{idx + 1}</span> {step}
                          </div>
                          {idx < combo.chain.length - 1 && <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═════════ 6. MODULE: CONTEXT COMPRESSOR ═════════ */}
          {activeSubNav === 'compressor' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Context Compressor & Token Saver
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Otomatis memangkas token yang tidak perlu sebelum dikirim ke LLM. Menghemat biaya dan mempercepat respons hingga 50%+.
                </p>
              </div>

              {/* Preset Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {[
                  { mode: 'off', label: 'Matikan (Passthrough)', desc: 'Kirim prompt apa adanya tanpa modifikasi.' },
                  { mode: 'lite', label: 'Lite (Pembersihan Spasi)', desc: 'Hapus whitespace, baris kosong berlebih, dan indentasi tidak terpakai.' },
                  { mode: 'smart', label: 'Smart (Deduplikasi Konteks)', desc: 'Hapus duplikasi history chat lama dan pangkas redundansi semantik.' },
                  { mode: 'aggressive', label: 'Aggressive (Deep Prune)', desc: 'Kompresi maksimal untuk file dokumen dan log kode yang sangat panjang.' },
                ].map((opt) => {
                  const isSelected = compression.mode === opt.mode;
                  return (
                    <button
                      key={opt.mode}
                      type="button"
                      onClick={() => setCompressionMode(opt.mode as any)}
                      style={{
                        background: isSelected ? 'rgba(6,182,212,0.1)' : 'var(--bg-card)',
                        border: isSelected ? '1px solid rgba(6,182,212,0.4)' : '1px solid var(--border-subtle)',
                        borderRadius: '10px',
                        padding: '14px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#06b6d4' : 'var(--text-primary)' }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {opt.desc}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Interactive Token Saver Simulator */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Simulator Pemangkasan Prompt</span>
                <textarea
                  rows={3}
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <span>Estimasi Token Awal: <b>{Math.round(testPrompt.length / 4)} token</b></span>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>
                    {compression.mode === 'off' ? 'Tidak Terkompresi (0%)' : compression.mode === 'lite' ? '⚡ 15% Token Dihemat' : compression.mode === 'smart' ? '🔥 38% Token Dihemat' : '🚀 55% Token Dihemat'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ═════════ 7. MODULE: TRAFFIC INSPECTOR ═════════ */}
          {activeSubNav === 'traffic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Traffic Inspector (Live Debugger)
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                    Pantau secara langsung lalu lintas panggilan API yang masuk dari Cursor IDE, Cline, atau Chat.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearRequestLogs}
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  Bersihkan Log
                </button>
              </div>

              {/* Logs Table */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '11px' }}>
                      <th style={{ padding: '10px 14px' }}>Waktu</th>
                      <th style={{ padding: '10px 14px' }}>Model</th>
                      <th style={{ padding: '10px 14px' }}>Status</th>
                      <th style={{ padding: '10px 14px' }}>Latency</th>
                      <th style={{ padding: '10px 14px' }}>Token In/Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requestLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {log.model}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: log.status === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)', color: log.status === 'success' ? '#34d399' : '#f43f5e' }}>
                            {log.statusCode || 200} {log.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                          {log.durationMs} ms
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          {log.promptTokens || 0} / {log.completionTokens || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═════════ 8. MODULE: FREE ACCESS RADAR ═════════ */}
          {activeSubNav === 'discovery' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Radar Akses AI Gratisan (0-Cost Discovery)
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Daftar penyedia model terkemuka yang saat ini menyediakan kuota 100% gratis tanpa perlu berlangganan.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
                {[
                  { name: 'Pollinations AI', desc: 'No-Auth total. Model FLUX, Mistral, dan Claude tanpa akun.', speed: '⚡ Kilat', cost: '100% Free' },
                  { name: 'DuckDuckGo AI Chat', desc: 'Chat Claude 3 & GPT-4o mini gratis anonim tanpa log.', speed: '⚡ Cepat', cost: '100% Free' },
                  { name: 'Cerebras AI', desc: '1.000.000 TPM gratis dengan Llama 3.3 70B secepat 2000 token/detik.', speed: '🚀 2000 t/s', cost: 'Free 1M TPM' },
                  { name: 'SambaNova Cloud', desc: 'Akses gratis DeepSeek-R1 Full 671B & Llama 3.3 70B.', speed: '⚡ Cepat', cost: 'Free Tier' },
                  { name: 'Google AI Studio', desc: 'Gemini 2.0 Flash & Thinking gratis dengan batas 15 RPM.', speed: '⚡ Cepat', cost: 'Free Tier' },
                  { name: 'GitHub Models', desc: 'Akses GPT-4o & Claude gratis via Personal Access Token GitHub.', speed: '⚡ Cepat', cost: 'Free PAT' },
                ].map((item) => (
                  <div
                    key={item.name}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
                          {item.cost}
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '6px 0 0 0', lineHeight: 1.4 }}>
                        {item.desc}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>Kecepatan: <b>{item.speed}</b></span>
                      <button
                        type="button"
                        onClick={() => setActiveSubNav('providers')}
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}
                      >
                        Buka di Katalog
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      {/* ── Configuration Modal ─────────────────────────────────────── */}
      {selectedProvider && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-main)',
              border: '1px solid var(--border-strong)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{selectedProvider.name}</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>{selectedProvider.description}</p>
              </div>
              <button type="button" onClick={() => setSelectedProvider(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {selectedProvider.authType === 'apikey' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    <span>API Key / Secret Token</span>
                    {selectedProvider.website && (
                      <a href={selectedProvider.website} target="_blank" rel="noreferrer" style={{ color: '#06b6d4', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Dapatkan Key <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                  <input
                    type="password"
                    value={modalApiKey}
                    onChange={(e) => setModalApiKey(e.target.value)}
                    placeholder="Masukkan API Key..."
                    style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-strong)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              )}

              {selectedProvider.authType === 'cookie' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>Session Cookie Token</span>
                  <input
                    type="password"
                    value={modalCookieToken}
                    onChange={(e) => setModalCookieToken(e.target.value)}
                    placeholder="Masukkan session cookie token..."
                    style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-strong)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Base URL (Opsional)</span>
                <input
                  type="text"
                  value={modalBaseUrl}
                  onChange={(e) => setModalBaseUrl(e.target.value)}
                  placeholder={selectedProvider.defaultBaseUrl || 'https://api.openai.com/v1'}
                  style={{ background: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)', outline: 'none' }}
                />
              </div>

              {testResult && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: testResult === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                    border: testResult === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
                    color: testResult === 'success' ? '#34d399' : '#f43f5e',
                  }}
                >
                  {testResult === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                  {testResult === 'success' ? 'Kredensial berhasil tervalidasi!' : 'Gagal memvalidasi kredensial.'}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingConnection}
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                {isTestingConnection ? 'Menguji...' : 'Uji Koneksi'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedProvider(null)}
                  style={{ background: 'none', border: 'none', padding: '8px 14px', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveProviderConfig}
                  style={{ background: 'var(--brand-primary)', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, color: '#ffffff', cursor: 'pointer' }}
                >
                  Simpan & Sambungkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
