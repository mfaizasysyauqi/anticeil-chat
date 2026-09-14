'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Code,
  PenTool,
  Cpu,
  Sparkles,
  ArrowUpRight,
  KeyRound,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AIChatBubble } from '../../../shared/components/AIChatBubble';
import { useChatStore } from '../store/useChatStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { getTranslation, getModelById, getProviderById } from '@anticeil/core';

interface MessageListProps {
  onSelectStarter: (prompt: string) => void;
}

export function MessageList({ onSelectStarter }: MessageListProps) {
  const messages = useChatStore((s) => s.getActiveMessages());
  const activeSession = useChatStore((s) => s.getActiveSession());
  const language = useSettingsStore((s) => s.language);
  const hasConfiguredKey = useSettingsStore((s) => s.hasConfiguredKey);
  const t = getTranslation(language);
  
  // Fix hydration mismatch - don't render messages until mounted
  const [isMounted, setIsMounted] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const activeModel = getModelById(activeSession?.modelId || '');
  const activeProvider = activeSession?.providerId ? getProviderById(activeSession.providerId) : undefined;
  const isKeyConfigured = activeSession ? hasConfiguredKey(activeSession.providerId) : true;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    }
  }, [messages]);

  const starterCards = [
    {
      category: t.chat.starterCode,
      icon: Code,
      color: 'var(--brand-primary)',
      badgeBg: 'rgba(0, 115, 234, 0.12)',
      prompt: t.chat.starterCodePrompt,
    },
    {
      category: t.chat.starterAnalysis,
      icon: Cpu,
      color: 'var(--accent-reasoning)',
      badgeBg: 'rgba(162, 93, 220, 0.12)',
      prompt: t.chat.starterAnalysisPrompt,
    },
    {
      category: t.chat.starterWriting,
      icon: PenTool,
      color: 'var(--accent-warning)',
      badgeBg: 'rgba(253, 171, 61, 0.12)',
      prompt: t.chat.starterWritingPrompt,
    },
    {
      category: t.chat.starterCreative,
      icon: Sparkles,
      color: 'var(--accent-success)',
      badgeBg: 'rgba(0, 200, 117, 0.12)',
      prompt: t.chat.starterCreativePrompt,
    },
  ];

  // Always render empty state during SSR or when there are no messages
  if (!isMounted || messages.length === 0) {
    return (
      <div className="page-scroll-container" style={{ justifyContent: 'center' }}>
        <div className="page-content-wrapper" style={{ gap: 'var(--space-xl)', padding: 'var(--space-2xl) 0' }}>
          {/* Minimalist Editorial Hero Greeting */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                fontSize: 'var(--font-xs)',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-lg)',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-success)',
                }}
              />
              <span>{t.chat.heroBadge}</span>
            </div>

            <h1
              style={{
                fontSize: 'var(--font-3xl)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-sm)',
              }}
            >
              {t.chat.heroTitle}
            </h1>
            <p
              style={{
                fontSize: 'var(--font-md)',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              {t.chat.heroSubtitle} {activeModel?.name || t.chat.assistant} ({activeProvider?.name || 'BYOK'}).
            </p>
          </div>

          {/* Missing API Key Sleek Card */}
          {isMounted && !isKeyConfigured && (
            <div
              style={{
                padding: 'var(--space-md) var(--space-lg)',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(245, 158, 11, 0.06)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--space-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <KeyRound size={16} color="var(--accent-warning)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 'var(--font-base)', color: 'var(--text-primary)' }}>
                  {t.chat.keyRequired} <strong>{activeProvider?.name}</strong> {t.chat.toBeginStreaming}
                </span>
              </div>
              <Link
                href="/settings"
                style={{
                  fontSize: 'var(--font-sm)',
                  fontWeight: 600,
                  color: 'var(--brand-primary)',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-strong)',
                }}
              >
                {t.chat.configureKey} →
              </Link>
            </div>
          )}

          {/* Curated Bento Starter Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'var(--space-sm)',
            }}
          >
            {starterCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <button
                  key={i}
                  onClick={() => onSelectStarter(card.prompt)}
                  className="hover-card"
                  style={{
                    padding: 'var(--space-md) var(--space-lg)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 'var(--space-sm)',
                    boxShadow: 'var(--inner-glow)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: card.color,
                        background: card.badgeBg,
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <Icon size={12} color={card.color} />
                      {card.category}
                    </span>
                    <ArrowUpRight size={13} color="var(--text-muted)" />
                  </div>
                  <span
                    style={{
                      fontSize: 'var(--font-base)',
                      color: 'var(--text-primary)',
                      lineHeight: 1.45,
                      fontWeight: 450,
                    }}
                  >
                    {card.prompt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const compactedSummary = activeSession?.compactedSummary;
  const compactedCount = activeSession?.compactedMessageCount;

  return (
    <div
      ref={scrollRef}
      className="page-scroll-container"
    >
      <div className="page-content-wrapper" style={{ gap: 'var(--space-lg)' }}>
        {compactedSummary && (
          <CompactedMemoryDivider summary={compactedSummary} count={compactedCount} language={language} />
        )}
        {messages.map((msg) => (
          <AIChatBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            reasoningContent={msg.reasoningContent}
            agentSteps={msg.agentSteps}
            variant={msg.role === 'user' ? 'coauthor' : 'assistant'}
            assistantName="AI Assistant"
            assistantColor="var(--brand-primary)"
            language={language === 'id' ? 'id' : 'en'}
            timestamp={msg.timestamp}
            isEditing={msg.role === 'user' && editingMsgId === msg.id}
            editContent={editingMsgId === msg.id ? editingContent : undefined}
            versions={msg.versions}
            versionIndex={msg.versionIndex ?? 0}
            onNavigateVersion={(direction) => {
              if (activeSession) {
                useChatStore.getState().navigateMessageVersion(activeSession.id, msg.id, direction);
              }
            }}
            onCopy={() => navigator.clipboard.writeText(msg.content)}
            onEdit={msg.role === 'user' ? () => { setEditingMsgId(msg.id); setEditingContent(msg.content); } : undefined}
            onSaveEdit={async (newContent) => {
              if (activeSession) {
                await useChatStore.getState().editMessage(activeSession.id, msg.id, newContent);
              }
              setEditingMsgId(null);
              setEditingContent('');
            }}
            onCancelEdit={() => { setEditingMsgId(null); setEditingContent(''); }}
            onUndo={() => {/* undo via store */}}
          />
        ))}
      </div>
    </div>
  );
}

function CompactedMemoryDivider({
  summary,
  count,
  language = 'id',
}: {
  summary: string;
  count?: number;
  language?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '8px 0 12px 0',
        width: '100%',
        userSelect: 'none',
      }}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '9999px',
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.22)',
          color: '#818CF8',
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(99, 102, 241, 0.16)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
        }}
      >
        <Sparkles size={11} style={{ color: '#818CF8' }} />
        <span>
          ✦ Context Compacted {count ? `(${count} ${language === 'id' ? 'pesan diringkas' : 'messages summarized'})` : ''}
        </span>
        {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {isExpanded && (
        <div
          style={{
            marginTop: '8px',
            width: '100%',
            maxWidth: '680px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '11.5px',
            lineHeight: 1.55,
            color: 'var(--text-secondary, #9CA3AF)',
            whiteSpace: 'pre-wrap',
            maxHeight: '180px',
            overflowY: 'auto',
          }}
        >
          {summary}
        </div>
      )}
    </div>
  );
}
