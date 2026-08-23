import React, { useState } from 'react';
import {
  Bot,
  MessageSquare,
  Sparkles,
  KeyRound,
  Plus,
  Trash2,
  Cpu,
  ShieldCheck,
  Send,
  Square,
  Copy,
  Check,
  Brain,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  ExternalLink,
} from 'lucide-react';
import {
  PROVIDER_DEFINITIONS,
  DEFAULT_PERSONAS,
  Persona,
  LLMModel,
  ChatMessage,
  formatCostUsd,
  estimateTokens,
  calculateCostUsd,
  getModelById,
  DEFAULT_PROVIDER_ID,
  DEFAULT_MODEL_ID,
  parseSSELine,
  getProviderById,
} from '@chatbyok/core';

type Tab = 'chat' | 'prompts' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [apiKeys, setApiKeys] = useState<Record<string, { apiKey: string; baseUrl?: string }>>(() => {
    try {
      const saved = localStorage.getItem('chatbyok_desktop_keys');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [activeModelId, setActiveModelId] = useState<string>(DEFAULT_MODEL_ID);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const handleSaveKey = (providerId: string, apiKey: string, baseUrl?: string) => {
    const updated = {
      ...apiKeys,
      [providerId]: { apiKey: apiKey.trim(), baseUrl: baseUrl?.trim() },
    };
    setApiKeys(updated);
    localStorage.setItem('chatbyok_desktop_keys', JSON.stringify(updated));
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isGenerating) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sessionId: 'default',
      role: 'user',
      content: inputText.trim(),
      timestamp: Date.now(),
      status: 'done',
    };

    const aiMsg: ChatMessage = {
      id: `ai-${Date.now() + 1}`,
      sessionId: 'default',
      role: 'assistant',
      content: '',
      timestamp: Date.now() + 1,
      status: 'streaming',
    };

    const nextMessages = [...messages, userMsg, aiMsg];
    setMessages(nextMessages);
    setInputText('');
    setIsGenerating(true);

    const modelDef = getModelById(activeModelId);
    const providerId = modelDef?.providerId || DEFAULT_PROVIDER_ID;
    const providerDef = getProviderById(providerId);
    const keyConfig = apiKeys[providerId];
    const apiKey = keyConfig?.apiKey || '';
    const baseUrl = keyConfig?.baseUrl || providerDef?.defaultBaseUrl || '';

    try {
      const endpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: activeModelId,
          messages: nextMessages.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
          temperature: 0.7,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulated = '';

      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const parsed = parseSSELine(line, providerId);
          if (parsed?.delta) {
            accumulated += parsed.delta;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsg.id
                  ? {
                      ...m,
                      content: accumulated,
                      status: 'streaming',
                    }
                  : m
              )
            );
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsg.id
            ? {
                ...m,
                content: accumulated,
                status: 'done',
              }
            : m
        )
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Generation failed';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsg.id
            ? {
                ...m,
                content: `⚠️ Error: ${errorMessage}`,
                status: 'error',
                error: errorMessage,
              }
            : m
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--bg-main)' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '240px',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '16px',
        }}
      >
        <div>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <Bot size={18} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '15px' }}>ChatByok Desktop</span>
          </div>

          {/* Navigation */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              onClick={() => setActiveTab('chat')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: activeTab === 'chat' ? 'var(--bg-subtle)' : 'transparent',
                color: activeTab === 'chat' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: activeTab === 'chat' ? 600 : 400,
                fontSize: '13px',
                textAlign: 'left',
              }}
            >
              <MessageSquare size={16} />
              <span>Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('prompts')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: activeTab === 'prompts' ? 'var(--bg-subtle)' : 'transparent',
                color: activeTab === 'prompts' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: activeTab === 'prompts' ? 600 : 400,
                fontSize: '13px',
                textAlign: 'left',
              }}
            >
              <Sparkles size={16} />
              <span>Personas</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: activeTab === 'settings' ? 'var(--bg-subtle)' : 'transparent',
                color: activeTab === 'settings' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: activeTab === 'settings' ? 600 : 400,
                fontSize: '13px',
                textAlign: 'left',
              }}
            >
              <KeyRound size={16} />
              <span>API Keys</span>
            </button>
          </nav>
        </div>

        {/* Footer controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <ShieldCheck size={14} color="var(--accent-success)" />
            <span>Native Desktop</span>
          </div>
          <button
            onClick={toggleTheme}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </aside>

      {/* Main View */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeTab === 'chat' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <header
              style={{
                height: '52px',
                borderBottom: '1px solid var(--border-subtle)',
                padding: '0 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-surface)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={15} color="var(--brand-primary)" />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Model: {activeModelId}</span>
              </div>
              <button
                onClick={() => setMessages([])}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Clear History
              </button>
            </header>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {messages.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <Bot size={40} color="var(--brand-primary)" style={{ marginBottom: '12px' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: 700 }}>ChatByok Desktop</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px', marginTop: '4px' }}>
                    Direct connection to OpenAI, Claude, Gemini, DeepSeek, Groq, & local Ollama.
                  </p>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-lg)',
                      background: m.role === 'user' ? 'var(--brand-primary)' : 'var(--bg-surface)',
                      color: m.role === 'user' ? '#FFFFFF' : 'var(--text-primary)',
                      border: m.role === 'user' ? 'none' : '1px solid var(--border-subtle)',
                      maxWidth: '80%',
                      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.8 }}>
                        {m.role === 'user' ? 'You' : 'Assistant'}
                      </span>
                      <button
                        onClick={() => copyText(m.id, m.content)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: m.role === 'user' ? '#FFFFFF' : 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        {copiedId === m.id ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: '13px', lineHeight: 1.5 }}>
                      {m.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-md)',
                  padding: '6px 10px',
                }}
              >
                <input
                  type="text"
                  placeholder="Ask anything..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  style={{
                    background: 'var(--brand-primary)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 10px',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'prompts' && (
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Expert Personas</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              {DEFAULT_PERSONAS.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: '16px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>{p.name}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{p.description}</p>
                  <button
                    onClick={() => setActiveTab('chat')}
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 12px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Select Persona
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>API Key Management</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px' }}>
              {PROVIDER_DEFINITIONS.map((provider) => (
                <div
                  key={provider.id}
                  style={{
                    padding: '14px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>{provider.name}</span>
                    <a
                      href={provider.docUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '11px', color: 'var(--brand-primary)', textDecoration: 'none' }}
                    >
                      Get Key ↗
                    </a>
                  </div>
                  {provider.requiresApiKey && (
                    <input
                      type="password"
                      placeholder={`Enter ${provider.name} Key`}
                      defaultValue={apiKeys[provider.id]?.apiKey || ''}
                      onBlur={(e) => handleSaveKey(provider.id, e.target.value)}
                      style={{
                        padding: '8px 10px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-strong)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
