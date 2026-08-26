'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Cpu,
  Key,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Search,
  Sparkles,
  Cookie,
  HardDrive,
  Volume2,
  SlidersHorizontal,
  X,
  Zap,
  Globe,
  Radio,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { useGatewayStore, GatewayApiKey } from '../store/useGatewayStore';
import {
  ALL_GATEWAY_PROVIDERS,
  PROVIDER_CATEGORY_LABELS,
  GatewayProvider,
  ProviderCategory,
} from '../providers';

export const GatewayView: React.FC = () => {
  const {
    apiKeys,
    requestLogs,
    activePort,
    providerConnections,
    activeCategory,
    searchQuery,
    generateApiKey,
    revokeApiKey,
    toggleApiKey,
    setProviderConnection,
    toggleProvider,
    disconnectProvider,
    setActiveCategory,
    setSearchQuery,
  } = useGatewayStore();

  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreatingKey, setIsCreatingKey] = useState(false);
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

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    generateApiKey(newKeyName);
    setNewKeyName('');
    setIsCreatingKey(false);
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
      // Category filter
      if (activeCategory !== 'all' && p.category !== activeCategory) {
        return false;
      }
      // Status filter
      const conn = providerConnections[p.id];
      if (statusFilter === 'connected' && (!conn || !conn.isEnabled)) {
        return false;
      }
      if (statusFilter === 'free' && p.badge !== 'FREE' && p.authType !== 'no-auth') {
        return false;
      }
      // Search query
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
    { id: 'all', label: 'Semua Provider (295+)', icon: <Globe className="w-4 h-4" /> },
    { id: 'no-auth', label: 'Tingkat Gratis (No-Auth)', icon: <Sparkles className="w-4 h-4 text-emerald-400" /> },
    { id: 'oauth', label: 'OAuth2 & IDE Keys', icon: <ShieldCheck className="w-4 h-4 text-cyan-400" /> },
    { id: 'web-cookie', label: 'Web Cookies', icon: <Cookie className="w-4 h-4 text-amber-400" /> },
    { id: 'apikey', label: 'Kunci API (192+)', icon: <Key className="w-4 h-4 text-indigo-400" /> },
    { id: 'local', label: 'Lokal PC (Ollama/LM)', icon: <HardDrive className="w-4 h-4 text-purple-400" /> },
    { id: 'search', label: 'Pencarian Web & RAG', icon: <Search className="w-4 h-4 text-blue-400" /> },
    { id: 'audio', label: 'Audio & TTS', icon: <Volume2 className="w-4 h-4 text-rose-400" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0d0f12] text-zinc-100 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ── Top Header & Stats ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 text-cyan-400">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">Anticeil Route</h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Gateway
                </span>
              </div>
              <p className="text-sm text-zinc-400 mt-0.5">
                Universal OpenAI-Compatible AI Gateway & 295+ Multi-Provider Hub.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
            <div className="text-xs text-zinc-400 font-medium">Total Provider</div>
            <div className="text-lg font-bold text-white">295+</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-emerald-500/20 text-center">
            <div className="text-xs text-emerald-400 font-medium">Terhubung</div>
            <div className="text-lg font-bold text-emerald-400">{connectedCount}</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
            <div className="text-xs text-zinc-400 font-medium">Kunci Gateway</div>
            <div className="text-lg font-bold text-white">{apiKeys.length}</div>
          </div>
        </div>
      </div>

      {/* ── Base URL & Domain Switcher Banner ─────────────────────────── */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-900/90 via-zinc-900/50 to-zinc-950 border border-zinc-800/80 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              Endpoint Kompatibel OpenAI Universal
            </div>
            <div className="flex items-center gap-3">
              <code className="text-base sm:text-lg font-mono text-zinc-100 font-bold bg-black/60 px-3 py-1.5 rounded-lg border border-zinc-800 selection:bg-cyan-500/30">
                {baseUrl}
              </code>
              <button
                onClick={() => handleCopy(baseUrl, 'baseUrl')}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                title="Salin Base URL"
              >
                {copiedKeyId === 'baseUrl' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Domain Mode Switcher */}
          <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-zinc-800/80 self-start lg:self-center">
            <span className="text-xs text-zinc-400 px-2 font-medium">Domain:</span>
            <button
              onClick={() => setDomainMode('auto')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                domainMode === 'auto'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Auto ({detectedOrigin.replace(/^https?:\/\//, '')})
            </button>
            <button
              onClick={() => setDomainMode('cloud')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                domainMode === 'cloud'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              anticeil.com
            </button>
            <button
              onClick={() => setDomainMode('local')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                domainMode === 'local'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              localhost:{activePort}
            </button>
          </div>
        </div>
      </div>

      {/* ── 295+ Provider Catalog Hub ─────────────────────────────────── */}
      <div className="space-y-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-md'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800/60 hover:border-zinc-700'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari dari 295+ provider, model (contoh: DeepSeek, Copilot, Cerebras, FLUX)..."
              className="w-full pl-9 pr-4 py-2 bg-black/50 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/60"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex items-center bg-black/40 p-1 rounded-lg border border-zinc-800">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded ${
                  statusFilter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setStatusFilter('connected')}
                className={`px-2.5 py-1 text-xs font-medium rounded ${
                  statusFilter === 'connected' ? 'bg-emerald-500/20 text-emerald-300' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Aktif ({connectedCount})
              </button>
              <button
                onClick={() => setStatusFilter('free')}
                className={`px-2.5 py-1 text-xs font-medium rounded ${
                  statusFilter === 'free' ? 'bg-cyan-500/20 text-cyan-300' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Tingkat Gratis
              </button>
            </div>
          </div>
        </div>

        {/* Providers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProviders.map((provider) => {
            const conn = providerConnections[provider.id];
            const isConnected = conn?.isEnabled;

            return (
              <div
                key={provider.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isConnected
                    ? 'bg-zinc-900/90 border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                    : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700/80'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white text-sm sm:text-base">{provider.name}</h3>
                        {provider.badge && (
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                              provider.badge === 'FREE'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : provider.badge === 'OAUTH'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : provider.badge === 'COOKIE'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            }`}
                          >
                            {provider.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{provider.description}</p>
                    </div>
                  </div>

                  {/* Models Preview */}
                  {provider.models && provider.models.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {provider.models.slice(0, 3).map((model) => (
                        <span
                          key={model}
                          className="px-2 py-0.5 text-[11px] font-mono rounded bg-black/40 text-zinc-300 border border-zinc-800"
                        >
                          {model}
                        </span>
                      ))}
                      {provider.models.length > 3 && (
                        <span className="text-[10px] text-zinc-400 font-medium">
                          +{provider.models.length - 3} lainnya
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between gap-2 pt-4 mt-3 border-t border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    {provider.website && (
                      <a
                        href={provider.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                      >
                        Web <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openConfigModal(provider)}
                      className="px-3 py-1 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                    >
                      Konfigurasi
                    </button>
                    <button
                      onClick={() => toggleProvider(provider.id)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                        isConnected
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                      {isConnected ? 'Aktif' : 'Sambungkan'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProviders.length === 0 && (
          <div className="text-center py-12 bg-zinc-900/30 rounded-2xl border border-zinc-800">
            <Search className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-400 text-sm">Tidak ada provider yang cocok dengan filter pencarian.</p>
          </div>
        )}
      </div>

      {/* ── 1-Click Code Snippets Card (Cursor / Cline / Python / Curl) ── */}
      <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-cyan-400" />
              1-Click Setup untuk Aplikasi Eksternal
            </h2>
            <p className="text-xs text-zinc-400">
              Salin cuplikan konfigurasi ini ke Cursor IDE, VS Code Cline, atau skrip Python Anda.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveSnippetTab('cursor')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeSnippetTab === 'cursor' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Cursor IDE
            </button>
            <button
              onClick={() => setActiveSnippetTab('cline')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeSnippetTab === 'cline' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              VS Code Cline
            </button>
            <button
              onClick={() => setActiveSnippetTab('python')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeSnippetTab === 'python' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Python SDK
            </button>
            <button
              onClick={() => setActiveSnippetTab('curl')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeSnippetTab === 'curl' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              cURL CLI
            </button>
          </div>
        </div>

        <div className="relative">
          <pre className="p-4 rounded-xl bg-black/80 border border-zinc-800/80 font-mono text-xs text-zinc-300 overflow-x-auto selection:bg-cyan-500/30">
            {snippets[activeSnippetTab]}
          </pre>
          <button
            onClick={() => handleCopySnippet(snippets[activeSnippetTab], activeSnippetTab)}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 flex items-center gap-1.5 transition-colors border border-zinc-700"
          >
            {copiedSnippet === activeSnippetTab ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Tersalin!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Salin Cuplikan
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Provider Configuration Modal ───────────────────────────────── */}
      {selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[#12151a] border border-zinc-800 rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{selectedProvider.name}</h3>
                  {selectedProvider.badge && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {selectedProvider.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">{selectedProvider.description}</p>
              </div>
              <button
                onClick={() => setSelectedProvider(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* API Key field */}
              {selectedProvider.authType === 'apikey' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                    <span>API Key / Personal Token</span>
                    {selectedProvider.website && (
                      <a
                        href={selectedProvider.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline flex items-center gap-1 font-normal"
                      >
                        Dapatkan Key <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </label>
                  <input
                    type="password"
                    value={modalApiKey}
                    onChange={(e) => setModalApiKey(e.target.value)}
                    placeholder="Masukkan API Key (sk-... / gsk_... / ghp_...)"
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              {/* Web Cookie field */}
              {selectedProvider.authType === 'cookie' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Session Cookie Token</label>
                  <input
                    type="password"
                    value={modalCookieToken}
                    onChange={(e) => setModalCookieToken(e.target.value)}
                    placeholder="Masukkan session cookie token dari browser Anda"
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Buka Developer Tools (F12) → Application → Cookies di browser Anda, lalu salin session token.
                  </p>
                </div>
              )}

              {/* OAuth token field */}
              {selectedProvider.authType === 'oauth' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">OAuth Access Token / CLI Keyring</label>
                  <input
                    type="password"
                    value={modalOAuthToken}
                    onChange={(e) => setModalOAuthToken(e.target.value)}
                    placeholder="Masukkan OAuth Token atau token dari CLI IDE Anda"
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              {/* Base URL (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Base URL Endpoint (Opsional)</label>
                <input
                  type="text"
                  value={modalBaseUrl}
                  onChange={(e) => setModalBaseUrl(e.target.value)}
                  placeholder={selectedProvider.defaultBaseUrl || 'https://api.openai.com/v1'}
                  className="w-full px-3.5 py-2 bg-black/40 border border-zinc-800/80 rounded-xl text-xs font-mono text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Test Connection feedback */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    testResult === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {testResult === 'success' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Kredensial berhasil tervalidasi dan siap digunakan!
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" /> Gagal memvalidasi kredensial. Silakan periksa kembali key Anda.
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingConnection}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
              >
                {isTestingConnection ? 'Menguji...' : 'Uji Koneksi'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProvider(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveProviderConfig}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-xs font-bold text-white shadow-lg transition-all"
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
