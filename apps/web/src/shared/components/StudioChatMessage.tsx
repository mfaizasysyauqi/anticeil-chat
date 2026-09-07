'use client';

import React, { useState } from 'react';
import {
  Bot,
  User,
  Copy,
  Check,
  Sparkles,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  FileText,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Pencil,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { AgentStepTimeline, AgentTimelineStep } from './AgentStepTimeline';

export interface StudioChatMessageProps {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoningContent?: string;
  actions?: Array<{ type: string; name: string }>;
  steps?: AgentTimelineStep[];
  docId?: string;
  onOpenFile?: (fileName: string, fileId?: string) => void;
  onOpenVersionHistory?: () => void;
  isStreaming?: boolean;
  assistantName?: string;
  assistantIcon?: React.ReactNode;
  assistantColor?: string;
  extraContent?: React.ReactNode;
  language?: 'id' | 'en';
  onCopy?: () => void;
  onEdit?: () => void;
  onUndo?: () => void;
  isReverted?: boolean;
  timestamp?: number;
  isSticky?: boolean;
}

/**
 * Reusable, DRY Chat Message Component for Docs Studio, Media Studio, and Chat Studio.
 * Seamlessly adapts to Light and Dark modes using CSS theme variables.
 */
export function StudioChatMessage({
  role,
  content,
  reasoningContent,
  actions,
  steps,
  docId,
  onOpenFile,
  onOpenVersionHistory,
  isStreaming = false,
  assistantName = 'AI Co-Author',
  assistantIcon,
  assistantColor = 'var(--brand-primary)',
  extraContent,
  language = 'id',
  onCopy,
  onEdit,
  onUndo,
  isReverted = false,
  timestamp,
  isSticky = false,
}: StudioChatMessageProps) {
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLongPrompt = isUser && (content.length > 90 || (content.match(/\n/g) || []).length >= 2);

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        gap: '4px',
        width: '100%',
        animation: 'fadeIn 0.2s ease-out',
        ...(isUser && isSticky
          ? {
              position: 'sticky',
              top: '-12px',
              zIndex: 10,
              marginTop: '-12px',
              marginBottom: '6px',
              paddingTop: '8px',
              paddingBottom: '8px',
              paddingLeft: '12px',
              paddingRight: '12px',
              width: '100%',
              boxSizing: 'border-box',
              backgroundColor: 'var(--bg-sidebar)',
              borderBottom: '1px solid var(--border-subtle)',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            }
          : {}),
      }}
    >
      {/* Header for Assistant */}
      {!isUser && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginBottom: '2px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: 'var(--radius-sm, 6px)',
                background: assistantColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                flexShrink: 0,
              }}
            >
              {assistantIcon || <Bot size={12} />}
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {assistantName}
            </span>
          </div>
        </div>
      )}

      {/* Antigravity Agent Step & Thought Execution Timeline */}
      {!isUser &&
        (reasoningContent || (actions && actions.length > 0) || (steps && steps.length > 0) || isStreaming) && (
          <div style={{ width: '100%' }}>
            <AgentStepTimeline
              reasoningContent={reasoningContent || ''}
              actions={actions}
              steps={steps}
              docId={docId}
              onOpenFile={onOpenFile}
              isStreaming={isStreaming && !content}
              language={language}
            />
          </div>
        )}

      {/* Main Message Bubble */}
      <div
        style={{
          maxWidth: isUser ? '90%' : '100%',
          width: isUser ? 'auto' : '100%',
          borderRadius: isUser ? 'var(--radius-xl, 16px)' : '0',
          padding: isUser ? '8px 12px' : '2px 0',
          background: isUser ? 'var(--bg-user-bubble)' : 'transparent',
          border: isUser ? '1px solid var(--border-subtle)' : 'none',
          boxShadow: isUser ? 'var(--shadow-sm)' : 'none',
          color: 'var(--text-primary)',
          fontSize: '13px',
          lineHeight: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          position: 'relative',
        }}
      >
        {isUser ? (
          <>
            <div
              style={{
                fontSize: '12.5px',
                lineHeight: 1.45,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: isPromptExpanded ? '320px' : '54px', // Max 3 lines default
                overflowY: isPromptExpanded ? 'auto' : 'hidden',
                paddingRight: '4px',
                transition: 'max-height 0.2s ease',
              }}
            >
              {content}
            </div>

            {/* Expand / Collapse toggle button for long user prompts */}
            {isLongPrompt && (
              <button
                type="button"
                onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--brand-primary)',
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: '2px 0 0 0',
                  textAlign: 'left',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  userSelect: 'none',
                }}
              >
                <span>
                  {isPromptExpanded
                    ? (language === 'id' ? 'Sembunyikan' : 'Show less')
                    : (language === 'id' ? 'Selengkapnya...' : 'Show more...')}
                </span>
                {isPromptExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            )}

            {/* Antigravity-style Action Bar inside user prompt bubble (Timestamp, Copy, Edit, Undo) — Hover visible only */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px',
                marginTop: '4px',
                fontSize: '11px',
                color: 'var(--text-muted)',
                userSelect: 'none',
                opacity: isHovered ? 1 : 0,
                pointerEvents: isHovered ? 'auto' : 'none',
                transition: 'opacity 0.15s ease-in-out',
              }}
            >
              <span style={{ fontSize: '10.5px', opacity: 0.75 }}>
                {formattedTime}
              </span>

              <button
                type="button"
                onClick={handleCopy}
                title={language === 'id' ? 'Salin prompt' : 'Copy prompt'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: copied ? 'var(--accent-success)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>

              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  title={language === 'id' ? 'Edit prompt' : 'Edit prompt'}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Pencil size={13} />
                </button>
              )}

              {onUndo && (
                <button
                  type="button"
                  onClick={onUndo}
                  disabled={isReverted}
                  title={
                    isReverted
                      ? (language === 'id' ? 'Perubahan telah dibatalkan' : 'Changes reverted')
                      : (language === 'id' ? 'Batalkan perubahan & hapus (Undo)' : 'Undo & delete changes')
                  }
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isReverted ? 'var(--text-muted)' : '#ef4444',
                    opacity: isReverted ? 0.5 : 1,
                    cursor: isReverted ? 'default' : 'pointer',
                    padding: '2px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <RotateCcw size={13} />
                  {isReverted && (
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {language === 'id' ? 'Dibatalkan' : 'Undone'}
                    </span>
                  )}
                </button>
              )}
            </div>
          </>
        ) : (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {content ? (
              <MarkdownRenderer content={content} />
            ) : isStreaming ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 0',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                }}
              >
                <Sparkles size={14} className="animate-spin" color="var(--brand-primary)" />
                <span>{language === 'id' ? 'Sedang menyusun respon...' : 'Drafting response...'}</span>
              </div>
            ) : null}

            {/* Antigravity-style File Changed Card with Review button */}
            {!isUser && actions && actions.length > 0 && !isStreaming && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  marginTop: '4px',
                  fontSize: '12px',
                  userSelect: 'none',
                }}
              >
                <button
                  type="button"
                  onClick={onOpenVersionHistory}
                  title="Lihat histori riwayat perubahan dokumen"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: onOpenVersionHistory ? 'pointer' : 'default',
                    padding: 0,
                  }}
                >
                  <span>
                    {actions.length} {actions.length === 1 ? 'file' : 'files'} changed
                  </span>
                  <span style={{ color: '#10B981', fontWeight: 600, fontSize: '11px' }}>+1</span>
                  <span style={{ color: '#EF4444', fontWeight: 600, fontSize: '11px' }}>-0</span>
                  <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
                </button>

                {onOpenVersionHistory && (
                  <button
                    type="button"
                    onClick={onOpenVersionHistory}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 9px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '11.5px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                    }}
                  >
                    <FileText size={12} />
                    <span>Review</span>
                  </button>
                )}
              </div>
            )}

            {/* Extra custom studio content (e.g. InteractiveDocCard, Media previews) */}
            {extraContent && <div style={{ width: '100%', marginTop: '4px' }}>{extraContent}</div>}
          </div>
        )}
      </div>

      {/* Assistant Action Bar (Timestamp on left, Copy & Feedback on right) — Hover visible only */}
      {!isUser && content && !isStreaming && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: '4px',
            opacity: isHovered ? 1 : 0,
            pointerEvents: isHovered ? 'auto' : 'none',
            transition: 'opacity 0.15s ease-in-out',
            userSelect: 'none',
          }}
        >
          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', opacity: 0.75 }}>
            {formattedTime}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={handleCopy}
              title={language === 'id' ? 'Salin teks' : 'Copy text'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 5px',
                borderRadius: '5px',
                background: 'transparent',
                border: 'none',
                color: copied ? 'var(--accent-success)' : 'var(--text-muted)',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>

            <button
              type="button"
              onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
              title={language === 'id' ? 'Bagus' : 'Good response'}
              style={{
                background: 'transparent',
                border: 'none',
                color: feedback === 'up' ? 'var(--brand-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <ThumbsUp size={13} />
            </button>

            <button
              type="button"
              onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
              title={language === 'id' ? 'Kurang baik' : 'Bad response'}
              style={{
                background: 'transparent',
                border: 'none',
                color: feedback === 'down' ? '#EF4444' : 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <ThumbsDown size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

