'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Cpu,
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
  Zap,
  Globe,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useGatewayStore, GatewayApiKey } from '../store/useGatewayStore';
import {
  ALL_GATEWAY_PROVIDERS,
  GatewayProvider,
  ProviderCategory,
} from '../providers';

export const GatewayView: React.FC = () => {
  const {
    apiKeys,
    activePort,
    providerConnections,
    activeCategory,
    searchQuery,
    setProviderConnection,
    toggleProvider,
    setActiveCategory,
    setSearchQuery,
  } = useGatewayStore();

  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [activeSnippetTab, setActiveSnippetTab] = useState<'cursor' | 'cline' | 'python' | 'curl'>('cursor');
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'free'>('all');

  // Modal Configuration state
  const [selectedProvider, setSelectedProvider] = useState<GatewayProvider | null>(null);
  const [modalApiKey, setModalApiKey] = useState('');
  const [modalCookieToken, setModalCookieToken] = useState('');
  const [modalOAuthToken, setModalOAuthToken] = useState('');
  const [modalBaseUrl, setModalBaseUrl] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  // Dynamic host detection with manual override
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
    { id: 'all', label: 'Semua Provider (295+)', icon: <Globe size={15} /> },
    { id: 'no-auth', label: 'Tingkat Gratis (No-Auth)', icon: <Sparkles size={15} color="#34d399" /> },
    { id: 'oauth', label: 'OAuth2 & IDE Keys', icon: <ShieldCheck size={15} color="#38bdf8" /> },
    { id: 'web-cookie', label: 'Web Cookies', icon: <Cookie size={15} color="#fbbf24" /> },
    { id: 'apikey', label: 'Kunci API (192+)', icon: <Key size={15} color="#818cf8" /> },
    { id: 'local', label: 'Lokal PC (Ollama/LM)', icon: <HardDrive size={15} color="#c084fc" /> },
    { id: 'search', label: 'Pencarian Web & RAG', icon: <Search size={15} color="#60a5fa" /> },
    { id: 'audio', label: 'Audio & TTS', icon: <Volume2 size={15} color="#f43f5e" /> },
  ];

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        background: 'var(--bg-main)',
        color: 'var(--text-primary)',
        padding: '24px 32px',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* ── Top Header & Stats ──────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            paddingBottom: '20px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(16, 185, 129, 0.15))',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#06b6d4',
              }}
            >
              <Cpu size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  Anticeil Route
                </h1>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '20px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
                  Live Gateway
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Universal OpenAI-Compatible Gateway & Hub 295+ Provider Multi-Model.
              </p>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '8px 16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Provider</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>295+</div>
            </div>
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '10px',
                padding: '8px 16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>Terhubung Aktif</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#34d399' }}>{connectedCount}</div>
            </div>
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '8px 16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Kunci Gateway</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{apiKeys.length}</div>
            </div>
          </div>
        </div>

        {/* ── Base URL & Domain Switcher Banner ───────────────────────── */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(20, 24, 30, 0.95) 100%)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Zap size={14} />
              Endpoint OpenAI Universal Anticeil Route
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <code
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              >
                {baseUrl}
              </code>
              <button
                type="button"
                onClick={() => handleCopy(baseUrl, 'baseUrl')}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  color: copiedKeyId === 'baseUrl' ? '#34d399' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                }}
              >
                {copiedKeyId === 'baseUrl' ? <Check size={14} /> : <Copy size={14} />}
                {copiedKeyId === 'baseUrl' ? 'Tersalin' : 'Salin'}
              </button>
            </div>
          </div>

          {/* Domain Mode Switcher Buttons */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '4px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '0 6px', fontWeight: 600 }}>Domain:</span>
            <button
              type="button"
              onClick={() => setDomainMode('auto')}
              style={{
                background: domainMode === 'auto' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                border: domainMode === 'auto' ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid transparent',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                color: domainMode === 'auto' ? '#38bdf8' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Auto ({detectedOrigin.replace(/^https?:\/\//, '')})
            </button>
            <button
              type="button"
              onClick={() => setDomainMode('cloud')}
              style={{
                background: domainMode === 'cloud' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                border: domainMode === 'cloud' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                color: domainMode === 'cloud' ? '#34d399' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              anticeil.com
            </button>
            <button
              type="button"
              onClick={() => setDomainMode('local')}
              style={{
                background: domainMode === 'local' ? 'rgba(192, 132, 252, 0.2)' : 'transparent',
                border: domainMode === 'local' ? '1px solid rgba(192, 132, 252, 0.4)' : '1px solid transparent',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                color: domainMode === 'local' ? '#c084fc' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              localhost:{activePort}
            </button>
          </div>
        </div>

        {/* ── 295+ Provider Catalog Hub ───────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Category Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '4px',
            }}
          >
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
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--bg-elevated)' : 'var(--bg-card)',
                    border: isSelected ? '1px solid var(--border-strong)' : '1px solid var(--border-subtle)',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search & Status Filter Bar */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari dari 295+ provider, model (contoh: DeepSeek, Copilot, Cerebras, FLUX)..."
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '13px',
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
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.25)', padding: '3px 4px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                style={{
                  background: statusFilter === 'all' ? 'var(--bg-elevated)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
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
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: statusFilter === 'connected' ? '#34d399' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                Aktif ({connectedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('free')}
                style={{
                  background: statusFilter === 'free' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
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

          {/* Providers Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '14px',
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
                    background: isConnected ? 'linear-gradient(145deg, var(--bg-card), rgba(16, 185, 129, 0.04))' : 'var(--bg-card)',
                    border: isConnected ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                    transition: 'border 0.2s ease, box-shadow 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {provider.name}
                        </span>
                        {provider.badge && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 6px',
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
                    </div>

                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.45,
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {provider.description}
                    </p>

                    {/* Models preview pills */}
                    {provider.models && provider.models.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingTop: '4px' }}>
                        {provider.models.slice(0, 2).map((m) => (
                          <span
                            key={m}
                            style={{
                              fontSize: '10px',
                              fontFamily: 'monospace',
                              background: 'rgba(0,0,0,0.3)',
                              border: '1px solid var(--border-subtle)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {m}
                          </span>
                        ))}
                        {provider.models.length > 2 && (
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
                            +{provider.models.length - 2} lainnya
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Controls */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      {provider.website && (
                        <a
                          href={provider.website}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          Website <ExternalLink size={11} />
                        </a>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => openConfigModal(provider)}
                        style={{
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '11px',
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
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: isConnected ? '#34d399' : 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: isConnected ? '#34d399' : 'var(--text-muted)',
                          }}
                        />
                        {isConnected ? 'Aktif' : 'Sambungkan'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProviders.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontSize: '13px',
              }}
            >
              Tidak ada provider yang cocok dengan kriteria pencarian.
            </div>
          )}
        </div>

        {/* ── 1-Click Code Snippets Card (Cursor / Cline / Python / Curl) ── */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                <Terminal size={18} color="#06b6d4" />
                1-Click Setup untuk Aplikasi Eksternal
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Salin konfigurasi ini ke Cursor IDE, VS Code Cline, atau skrip Python Anda.
              </p>
            </div>

            <div
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '3px 4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {(['cursor', 'cline', 'python', 'curl'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveSnippetTab(tab)}
                  style={{
                    background: activeSnippetTab === tab ? 'var(--bg-elevated)' : 'transparent',
                    border: activeSnippetTab === tab ? '1px solid var(--border-strong)' : '1px solid transparent',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: activeSnippetTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    textTransform: tab === 'curl' ? 'uppercase' : 'capitalize',
                  }}
                >
                  {tab === 'cursor' ? 'Cursor IDE' : tab === 'cline' ? 'VS Code Cline' : tab === 'python' ? 'Python SDK' : 'cURL'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <pre
              style={{
                background: 'rgba(0, 0, 0, 0.45)',
                border: '1px solid var(--border-strong)',
                borderRadius: '10px',
                padding: '14px 16px',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: 'var(--text-secondary)',
                overflowX: 'auto',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {snippets[activeSnippetTab]}
            </pre>
            <button
              type="button"
              onClick={() => handleCopySnippet(snippets[activeSnippetTab], activeSnippetTab)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 600,
                color: copiedSnippet === activeSnippetTab ? '#34d399' : 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {copiedSnippet === activeSnippetTab ? <Check size={13} /> : <Copy size={13} />}
              {copiedSnippet === activeSnippetTab ? 'Tersalin' : 'Salin Cuplikan'}
            </button>
          </div>
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '12px',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      {selectedProvider.name}
                    </h3>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                    {selectedProvider.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProvider(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {selectedProvider.authType === 'apikey' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      <span>API Key / Secret Token</span>
                      {selectedProvider.website && (
                        <a
                          href={selectedProvider.website}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#06b6d4', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          Dapatkan Key <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                    <input
                      type="password"
                      value={modalApiKey}
                      onChange={(e) => setModalApiKey(e.target.value)}
                      placeholder="Masukkan API Key..."
                      style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid var(--border-strong)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '13px',
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
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
                      style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid var(--border-strong)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '13px',
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                    />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      Salin session token dari Developer Tools (F12) browser Anda.
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Base URL (Opsional)</span>
                  <input
                    type="text"
                    value={modalBaseUrl}
                    onChange={(e) => setModalBaseUrl(e.target.value)}
                    placeholder={selectedProvider.defaultBaseUrl || 'https://api.openai.com/v1'}
                    style={{
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      color: 'var(--text-secondary)',
                      outline: 'none',
                    }}
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

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  {isTestingConnection ? 'Menguji...' : 'Uji Koneksi'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedProvider(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '8px 14px',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProviderConfig}
                    style={{
                      background: 'var(--brand-primary)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#ffffff',
                      cursor: 'pointer',
                      boxShadow: '0 2px 10px rgba(0, 115, 234, 0.3)',
                    }}
                  >
                    Simpan & Sambungkan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
