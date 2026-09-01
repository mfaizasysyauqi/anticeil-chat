'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Wand2,
  Sigma,
  Table,
  BookOpen,
  Check,
  Copy,
  ArrowDownLeft,
  RefreshCw,
  X,
  Bot,
  User,
  ChevronDown,
  Cpu,
  PanelLeftClose,
} from 'lucide-react';
import { useDocsStore } from '../store/useDocsStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { streamBYOKChat } from '../../chat/data/byokApi';
import { ChatMessage, LLMProviderId, getModelById, PROVIDER_DEFINITIONS } from '@anticeil/core';
import { ModelSelectorModal } from '../../chat/components/ModelSelectorModal';
import { ProviderBrandLogo } from '../../../shared/components/ProviderLogos';

export interface DocsCopilotSidebarProps {
  onInsertText?: (text: string) => void;
  isEmbedded?: boolean;
  onClose?: () => void;
}

export function DocsCopilotSidebar({
  onInsertText,
  isEmbedded = false,
  onClose,
}: DocsCopilotSidebarProps = {}) {
  const activeDocId = useDocsStore((s) => s.activeDocId);
  const documents = useDocsStore((s) => s.documents);
  const updateDocumentContent = useDocsStore((s) => s.updateDocumentContent);
  const toggleCopilot = useDocsStore((s) => s.toggleCopilot);

  const language = useSettingsStore((s) => s.language);
  const globalProviderId = useSettingsStore((s) => s.activeProviderId);
  const globalModelId = useSettingsStore((s) => s.activeModelId);
  const apiKeys = useSettingsStore((s) => s.apiKeys);

  const activeDoc = documents.find((d) => d.id === activeDocId);

  // Model Selection State specifically for AI Co-Author (Text only)
  const [selectedProviderId, setSelectedProviderId] = useState<LLMProviderId>(
    globalProviderId || 'groq'
  );
  const [selectedModelId, setSelectedModelId] = useState<string>(
    globalModelId || 'llama-3.3-70b-versatile'
  );
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ id: string; role: 'user' | 'assistant'; content: string }>
  >([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        language === 'id'
          ? 'Halo! Saya AI Co-Author Anda. Saya siap membantu menulis bab, merumuskan persamaan LaTeX, membuat tabel data, diagram, atau memperbaiki tata bahasa ilmiah paper Anda.'
          : 'Hello! I am your AI Co-Author. I can help write sections, formulate LaTeX equations, generate data tables, diagrams, or polish academic prose.',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Derive model and provider metadata
  const currentModelDef = getModelById(selectedModelId);
  const currentProviderDef = PROVIDER_DEFINITIONS.find((p) => p.id === selectedProviderId);
  const modelDisplayName = currentModelDef?.name || selectedModelId;
  const providerDisplayName = currentProviderDef?.name || selectedProviderId;

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputPrompt.trim();
    if (!promptToSend || isGenerating) return;

    if (!customPrompt) setInputPrompt('');

    const userMsgId = 'u_' + Date.now();
    const assistantMsgId = 'a_' + Date.now();

    const newHistory = [
      ...messages,
      { id: userMsgId, role: 'user' as const, content: promptToSend },
      { id: assistantMsgId, role: 'assistant' as const, content: '' },
    ];

    setMessages(newHistory);
    setIsGenerating(true);

    const docContext = activeDoc?.content
      ? `\n\nCURRENT DOCUMENT CONTENT:\n\`\`\`markdown\n${activeDoc.content.slice(0, 4000)}\n\`\`\``
      : '';

    const systemPrompt = `You are an expert Academic & Technical AI Co-Author specializing in research writing, LaTeX/KaTeX mathematics, technical RFCs, and publication-grade Markdown.
Always provide clean, accurate, and structured Markdown and LaTeX math equations (using $inline$ and $$block$$).
Be concise, direct, and ready to be inserted into the document.${docContext}`;

    const apiMessages: ChatMessage[] = newHistory
      .filter((m) => m.id !== assistantMsgId)
      .map((m) => ({
        id: m.id,
        sessionId: 'docs_copilot',
        role: m.role,
        content: m.content,
        timestamp: Date.now(),
        status: 'done' as const,
      }));

    const keyConfig = apiKeys[selectedProviderId] || { apiKey: '', isEnabled: true };

    try {
      let fullResponse = '';
      await streamBYOKChat({
        providerId: selectedProviderId,
        modelId: selectedModelId,
        systemPrompt,
        messages: apiMessages,
        apiKeyConfig: keyConfig,
        temperature: 0.6,
        onChunk: (chunk) => {
          if (chunk.delta) {
            fullResponse += chunk.delta;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId ? { ...msg, content: fullResponse } : msg
              )
            );
          }
        },
      });
    } catch (err) {
      console.warn('[DocsCopilot] Streaming error:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content:
                  language === 'id'
                    ? 'Maaf, terjadi kendala saat menghubungi model AI. Silakan periksa koneksi atau API Key Anda di menu Pengaturan.'
                    : 'Sorry, an error occurred while streaming AI response. Please check your API key in Settings.',
              }
            : msg
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsert = (textToInsert: string) => {
    if (onInsertText) {
      onInsertText(textToInsert);
      return;
    }
    if (!activeDoc) return;
    const updated = activeDoc.content + '\n\n' + textToInsert;
    updateDocumentContent(activeDoc.id, updated);
  };

  const handleCopy = (content: string, msgId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickActions = [
    {
      label: language === 'id' ? 'Lanjutkan Paragraf' : 'Continue Writing',
      icon: <Wand2 size={12} />,
      prompt:
        language === 'id'
          ? 'Lanjutkan penulisan dari bagian terakhir dokumen ini dengan gaya akademis yang mengalir.'
          : 'Continue writing from the last section with rigorous academic prose.',
    },
    {
      label: language === 'id' ? 'Rumus LaTeX' : 'LaTeX Equation',
      icon: <Sigma size={12} />,
      prompt:
        language === 'id'
          ? 'Buatkan formulasi persamaan matematika LaTeX lengkap dengan penjelasan variabelnya.'
          : 'Generate a comprehensive LaTeX math formula block with variable explanations.',
    },
    {
      label: language === 'id' ? 'Tabel Data' : 'Data Table',
      icon: <Table size={12} />,
      prompt:
        language === 'id'
          ? 'Buatkan tabel perbandingan metrik performa dalam format Markdown yang rapi.'
          : 'Generate a neat performance comparison matrix in Markdown table format.',
    },
    {
      label: language === 'id' ? 'Sitasi BibTeX' : 'BibTeX Citations',
      icon: <BookOpen size={12} />,
      prompt:
        language === 'id'
          ? 'Berikan 3 referensi literatur ilmiah standar IEEE / Nature terkait topik dokumen ini.'
          : 'Provide 3 high-impact scientific references in standard academic format.',
    },
  ];

  return (
    <div
      style={{
        width: isEmbedded ? '100%' : '320px',
        height: '100%',
        backgroundColor: 'var(--bg-sidebar)',
        borderLeft: isEmbedded ? 'none' : '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Model Selector Modal (Strictly Text / Chat Models Only) */}
      {isModelSelectorOpen && (
        <ModelSelectorModal
          targetCapability="text"
          currentProviderId={selectedProviderId}
          currentModelId={selectedModelId}
          onClose={() => setIsModelSelectorOpen(false)}
          onSelectModel={(providerId, modelId) => {
            setSelectedProviderId(providerId);
            setSelectedModelId(modelId);
          }}
        />
      )}

      {/* Drawer Header: Title + Active Tag + Collapse Button (48px exact height) */}
      <div
        style={{
          height: '48px',
          boxSizing: 'border-box',
          padding: '0 12px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          backgroundColor: 'var(--bg-sidebar)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {language === 'id' ? 'AI Co-Author' : 'AI Co-Author'}
          </span>
          <span
            style={{
              fontSize: '10px',
              background: 'rgba(0, 115, 234, 0.12)',
              color: 'var(--brand-primary)',
              border: '1px solid rgba(0, 115, 234, 0.25)',
              borderRadius: '999px',
              padding: '0 6px',
              fontWeight: 650,
              lineHeight: '15px',
            }}
          >
            {language === 'id' ? 'Aktif' : 'Active'}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose || toggleCopilot}
          style={{
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '5px',
            backgroundColor: 'transparent',
            border: '1px solid transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          className="hover-subtle"
          title={language === 'id' ? 'Tutup Panel' : 'Collapse Panel'}
        >
          <PanelLeftClose size={13} />
        </button>
      </div>

      {/* Integrated Model Selector Pill Bar */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-sidebar)' }}>
        <button
          type="button"
          onClick={() => setIsModelSelectorOpen(true)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '5px 8px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
          className="hover-subtle"
          title="Pilih Model AI (Text Models Only)"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            <ProviderBrandLogo provider={selectedProviderId} size={13} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '11.5px', color: 'var(--text-primary)' }}>
              {modelDisplayName}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>
              {providerDisplayName}
            </span>
            <ChevronDown size={11} color="var(--text-muted)" />
          </div>
        </button>
      </div>

      {/* Quick Action Chips (Seamless scroll with no scrollbar bar) */}
      <div
        className="hide-scrollbar"
        style={{
          padding: '8px 10px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '5px',
          overflowX: 'auto',
          backgroundColor: 'var(--bg-sidebar)',
          scrollbarWidth: 'none',
        }}
      >
        {quickActions.map((qa) => (
          <button
            key={qa.label}
            type="button"
            onClick={() => handleSend(qa.prompt)}
            disabled={isGenerating}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 500,
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
            onMouseEnter={(e) => {
              if (!isGenerating) {
                e.currentTarget.style.borderColor = 'var(--brand-primary)';
                e.currentTarget.style.color = 'var(--brand-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isGenerating) {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >
            {qa.icon}
            <span>{qa.label}</span>
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: 'var(--bg-sidebar)',
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: m.role === 'user' ? '88%' : '100%',
              width: m.role === 'assistant' ? '100%' : 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px',
                color: 'var(--text-muted)',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {m.role === 'user' ? (
                <>
                  <span>{language === 'id' ? 'Anda' : 'You'}</span>
                  <User size={10} />
                </>
              ) : (
                <>
                  <Bot size={10} color="var(--brand-primary)" />
                  <span>AI Co-Author</span>
                </>
              )}
            </div>

            <div
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                lineHeight: 1.5,
                backgroundColor:
                  m.role === 'user'
                    ? 'var(--brand-primary, #0073ea)'
                    : 'var(--bg-surface)',
                color: m.role === 'user' ? '#ffffff' : 'var(--text-primary)',
                border:
                  m.role === 'user'
                    ? 'none'
                    : '1px solid var(--border-subtle)',
                boxShadow: m.role === 'user' ? 'none' : '0 1px 2px rgba(0,0,0,0.03)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {m.content || (isGenerating && m.role === 'assistant' ? (language === 'id' ? 'Menulis...' : 'Writing...') : '')}
            </div>

            {/* Assistant Action Buttons */}
            {m.role === 'assistant' && m.content && !isGenerating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <button
                  type="button"
                  onClick={() => handleInsert(m.content)}
                  title={language === 'id' ? 'Sisipkan ke Dokumen' : 'Insert to Document'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '5px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--brand-primary)',
                    fontSize: '10.5px',
                    fontWeight: 650,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  }}
                  className="hover-subtle"
                >
                  <ArrowDownLeft size={11} />
                  <span>{language === 'id' ? 'Sisipkan' : 'Insert'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(m.content, m.id)}
                  title={language === 'id' ? 'Salin Teks' : 'Copy Text'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '5px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-surface)',
                    color: copiedId === m.id ? '#10B981' : 'var(--text-muted)',
                    fontSize: '10.5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  }}
                  className="hover-subtle"
                >
                  {copiedId === m.id ? <Check size={11} color="#10B981" /> : <Copy size={11} />}
                  <span>{copiedId === m.id ? (language === 'id' ? 'Tersalin' : 'Copied') : (language === 'id' ? 'Salin' : 'Copy')}</span>
                </button>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form at Bottom (Modern sleek bar) */}
      <div
        style={{
          padding: '10px 12px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-sidebar)',
          flexShrink: 0,
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '8px',
            padding: '4px 8px',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'border-color 0.15s ease',
          }}
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder={
              language === 'id'
                ? 'Minta AI tulis bab, rumus TeX, atau tabel...'
                : 'Ask AI to write section, TeX formula, or table...'
            }
            disabled={isGenerating}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '12px',
              color: 'var(--text-primary)',
            }}
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isGenerating}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: inputPrompt.trim() && !isGenerating ? 'var(--brand-primary)' : 'transparent',
              color: inputPrompt.trim() && !isGenerating ? '#ffffff' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: inputPrompt.trim() && !isGenerating ? 'pointer' : 'default',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            {isGenerating ? <RefreshCw size={13} className="spin" /> : <Send size={13} />}
          </button>
        </form>
      </div>
    </div>
  );
}
