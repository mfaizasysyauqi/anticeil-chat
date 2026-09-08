'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Bot,
  User,
  Copy,
  Check,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Pencil,
  X,
  FileText,
  Plus,
  Image as ImageIcon,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { AgentStepTimeline } from './AgentStepTimeline';
import { getTranslation } from '@anticeil/core';

// ============================================
// Types
// ============================================

export interface AIChatBubbleProps {
  /** Message role: 'user' or 'assistant' */
  role: 'user' | 'assistant';
  /** Message content */
  content: string;
  /** Reasoning/thinking content for assistant */
  reasoningContent?: string;
  /** Whether message is currently streaming */
  isStreaming?: boolean;
  /** Assistant name to display */
  assistantName?: string;
  /** Custom assistant icon node */
  assistantIcon?: React.ReactNode;
  /** Assistant brand color */
  assistantColor?: string;
  /** Language for translations */
  language?: 'id' | 'en';
  /** Current timestamp */
  timestamp?: number;
  /** Whether this is a Co-Author style message (for edit/undo features) */
  variant?: 'coauthor' | 'assistant';
  /** Edit mode state */
  isEditing?: boolean;
  /** Edit text value */
  editContent?: string;
  /** Whether message has been reverted (Co-Author undo) */
  isReverted?: boolean;
  /** Small audit badge for edited / deleted / undone state */
  auditBadge?: string;
  agentSteps?: import('@anticeil/core').AgentStep[];
  actions?: Array<{ type: string; name: string }>;
  attachments?: Array<{
    id: string;
    name: string;
    type?: string;
    size?: number;
    isImage?: boolean;
    content?: string;
  }>;
  // Callbacks
  onCopy?: () => void;
  onEdit?: () => void;
  onSaveEdit?: (newContent: string) => void;
  onCancelEdit?: () => void;
  onUndo?: () => void;
  onOpenFile?: (fileName: string, fileId?: string) => void;
  // Custom render for extra content
  extraHeader?: React.ReactNode;
  extraContent?: React.ReactNode;
  extraFooter?: React.ReactNode;
}

// ============================================
// Utility Components
// ============================================

/**
 * Assistant Header - displays avatar, name, and optional badges
 */
function AssistantHeader({
  name,
  icon,
  color = 'var(--brand-primary)',
  badges,
}: {
  name: string;
  icon?: React.ReactNode;
  color?: string;
  badges?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: '4px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: 'var(--radius-sm, 6px)',
            background: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            flexShrink: 0,
          }}
        >
          {icon || <Bot size={11} />}
        </div>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {name}
        </span>
      </div>
      {badges && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{badges}</div>}
    </div>
  );
}

/**
 * Attachment Preview Chip - shows file attachments with icon and size
 */
function AttachmentChip({
  attachment,
  language = 'id',
}: {
  attachment: AIChatBubbleProps['attachments'] extends (infer T)[] ? T : never;
  language?: 'id' | 'en';
}) {
  const getIcon = () => {
    if (attachment.isImage) return <ImageIcon size={13} color="var(--brand-primary)" />;
    return <FileText size={13} color="var(--text-secondary)" />;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: 'var(--bg-subtle)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-md)',
        padding: '4px 8px',
        fontSize: '11px',
        color: 'var(--text-primary)',
        maxWidth: '240px',
      }}
    >
      {getIcon()}
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontWeight: 500,
        }}
      >
        {attachment.name}
      </span>
      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({formatSize(attachment.size)})</span>
    </div>
  );
}

/**
 * Expandable Prompt Text - shows truncated content with expand/collapse
 */
function ExpandablePrompt({
  content,
  isExpanded,
  onToggle,
  language = 'id',
}: {
  content: string;
  isExpanded: boolean;
  onToggle: () => void;
  language?: 'id' | 'en';
}) {
  const isLongPrompt = content.length > 90 || (content.match(/\n/g) || []).length >= 2;

  if (!isLongPrompt) {
    return (
      <div
        style={{
          fontSize: '12.5px',
          lineHeight: 1.45,
          color: 'var(--text-primary)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          fontSize: '12.5px',
          lineHeight: 1.45,
          color: 'var(--text-primary)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxHeight: isExpanded ? '320px' : '54px',
          overflowY: isExpanded ? 'auto' : 'hidden',
          paddingRight: '4px',
          transition: 'max-height 0.2s ease',
        }}
      >
        {content}
      </div>
      <button
        type="button"
        onClick={onToggle}
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
          {isExpanded
            ? language === 'id'
              ? 'Sembunyikan'
              : 'Show less'
            : language === 'id'
            ? 'Selengkapnya...'
            : 'Show more...'}
        </span>
        {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>
    </>
  );
}

/**
 * Message Action Bar - copy, edit, undo, feedback buttons (hover visible)
 */
function MessageActionBar({
  role,
  language = 'id',
  isHovered,
  timestamp,
  copied,
  feedback,
  variant = 'assistant',
  showCopy = true,
  showEdit = false,
  showFeedback = true,
  onCopy,
  onEdit,
  onFeedback,
  onRemove,
}: {
  role: 'user' | 'assistant';
  language?: 'id' | 'en';
  isHovered: boolean;
  timestamp?: number;
  copied: boolean;
  feedback?: 'up' | 'down' | null;
  variant?: 'coauthor' | 'assistant';
  showCopy?: boolean;
  showEdit?: boolean;
  showFeedback?: boolean;
  onCopy?: () => void;
  onEdit?: () => void;
  onFeedback?: (type: 'up' | 'down') => void;
  onRemove?: () => void;
}) {
  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const actionButtonStyle = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'all 0.15s ease',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: role === 'user' ? 'flex-end' : 'space-between',
        width: '100%',
        marginTop: role === 'assistant' ? '4px' : '2px',
        opacity: isHovered ? 1 : 0.01,
        pointerEvents: isHovered ? 'auto' : 'none',
        transition: 'opacity 0.15s ease-in-out',
        userSelect: 'none',
      }}
    >
      {role === 'user' ? (
        // User: timestamp on left, actions on right
        <>
          {timestamp && (
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', opacity: 0.75, marginRight: '8px' }}>
              {formattedTime}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: role === 'user' ? '6px' : '8px' }}>
            {showCopy && (
              <button
                type="button"
                onClick={onCopy}
                title={language === 'id' ? 'Salin' : 'Copy'}
                style={{
                  ...actionButtonStyle,
                  color: copied ? 'var(--accent-success)' : 'var(--text-muted)',
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
            )}
            {showEdit && (
              <>
                <button
                  type="button"
                  onClick={onEdit}
                  title={language === 'id' ? 'Edit / Undo' : 'Edit / Undo'}
                  style={{ ...actionButtonStyle, color: 'var(--text-muted)' }}
                >
                  <Pencil size={13} />
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        // Assistant: timestamp on left, actions on right (same layout as MessageBubble.tsx)
        <>
          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', opacity: 0.75, marginRight: '8px' }}>
            {formattedTime}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {showCopy && (
              <button
                type="button"
                onClick={onCopy}
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
            )}
            {showFeedback && (
              <>
                <button
                  type="button"
                  onClick={() => onFeedback?.('up')}
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
                  onClick={() => onFeedback?.('down')}
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
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Streaming Indicator - animated dots while generating
 */
function StreamingIndicator({ language = 'id' }: { language?: 'id' | 'en' }) {
  return (
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
      <div style={{ display: 'flex', gap: '4px' }}>
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--brand-primary)',
            animation: 'bounce 1.4s ease-in-out infinite both',
          }}
        />
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--brand-primary)',
            animation: 'bounce 1.4s ease-in-out 0.2s infinite both',
          }}
        />
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--brand-primary)',
            animation: 'bounce 1.4s ease-in-out 0.4s infinite both',
          }}
        />
      </div>
      <span>{language === 'id' ? 'Sedang berpikir...' : 'Thinking...'}</span>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

/**
 * AIChatBubble - Reusable chat message bubble component
 *
 * Provides consistent bubble styling for both AI Co-Author and AI Assistant messages.
 * Supports:
 * - Expandable user prompts (Co-Author style)
 * - Edit/Undo functionality (Co-Author variant)
 * - Assistant headers with custom icons/colors
 * - Streaming indicators
 * - Copy, feedback, and action buttons
 * - Theme-aware styling via CSS variables
 *
 * Usage:
 * ```tsx
 * <AIChatBubble
 *   role="user"
 *   content="Hello!"
 *   language="id"
 *   onCopy={() => copyToClipboard(content)}
 * />
 *
 * <AIChatBubble
 *   role="assistant"
 *   content="Hello! How can I help?"
 *   assistantName="AI Assistant"
 *   assistantColor="var(--brand-primary)"
 *   variant="assistant"
 * />
 * ```
 */
export function AIChatBubble({
  role,
  content,
  reasoningContent,
  isStreaming = false,
  assistantName = 'AI',
  assistantIcon,
  assistantColor = 'var(--brand-primary)',
  language = 'id',
  timestamp,
  variant = 'assistant',
  isEditing = false,
  editContent = '',

  auditBadge,
  agentSteps,
  actions,
  reasoningContent,
  attachments,
  onCopy,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onUndo,
  onOpenFile,
  extraHeader,
  extraContent,
  extraFooter,
}: AIChatBubbleProps) {
  const t = getTranslation(language);
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [localEditContent, setLocalEditContent] = useState(editContent || content);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(isStreaming ?? false);

  React.useEffect(() => {
    if (isStreaming) setIsTimelineExpanded(true);
  }, [isStreaming]);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const isUser = role === 'user';

  // Sync local edit content when editContent prop changes
  React.useEffect(() => {
    if (isEditing) {
      setLocalEditContent(editContent ?? content);
    }
  }, [isEditing, editContent, content]);

  // Focus textarea when entering edit mode
  React.useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.focus();
      const len = editTextareaRef.current.value.length;
      editTextareaRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  const handleCopy = useCallback(() => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  }, [content, onCopy]);

  const handleSaveEdit = useCallback(() => {
    const trimmed = localEditContent.trim();
    if (trimmed) {
      onSaveEdit?.(trimmed);
    } else {
      onCancelEdit?.();
    }
  }, [localEditContent, onSaveEdit, onCancelEdit]);

  const handleFeedback = useCallback((type: 'up' | 'down') => {
    setFeedback((prev) => (prev === type ? null : type));
  }, []);

  // Timeline auto-expand/collapse per streaming
  React.useEffect(() => {
    if (isStreaming) setIsTimelineExpanded(true);
    else {
      // Collapse when idle unless there was an edit/delete event (auditBadge present suggests activity)
      if (!auditBadge) setIsTimelineExpanded(false);
    }
  }, [isStreaming, auditBadge]);

  // ============================================
  // Render
  // ============================================

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
      }}
    >
      {/* Extra Header */}
      {extraHeader && !isUser && <div style={{ width: '100%' }}>{extraHeader}</div>}

      {/* Assistant Header */}
      {!isUser && (
        <AssistantHeader
          name={assistantName}
          icon={assistantIcon}
          color={assistantColor}
          badges={
            isStreaming && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '10.5px',
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                }}
              >
                <Sparkles size={10} color="var(--brand-primary)" />
                {t.chat.thinking || 'Thinking'}
              </span>
            )
          }
        />
      )}

      {/* Main Bubble */}
      <div
        style={{
          maxWidth: isUser ? '90%' : '100%',
          borderRadius: isUser ? 'var(--radius-xl)' : '0',
          padding: isUser ? '10px 16px' : '2px 0',
          background: isUser ? 'var(--bg-user-bubble)' : 'transparent',
          border: isUser ? '1px solid var(--border-subtle)' : 'none',
          boxShadow: isUser ? 'var(--shadow-sm)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          position: 'relative',
        }}
      >
        {/* Audit Badge */}
        {auditBadge && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10px',
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(0,115,234,0.08)',
            color: 'var(--brand-primary)',
            border: '1px solid rgba(0,115,234,0.15)',
            letterSpacing: '0.03em',
            alignSelf: 'flex-start',
            marginBottom: '2px',
          }}>
            {auditBadge}
          </span>
        )}

        {/* Edit Mode */}
        {isUser && isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '100%' }}>
            <textarea
              ref={editTextareaRef}
              value={localEditContent}
              onChange={(e) => setLocalEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveEdit();
                }
                if (e.key === 'Escape') onCancelEdit?.();
              }}
              style={{
                width: '100%',
                minHeight: '120px',
                background: 'var(--bg-user-bubble)',
                border: '1px solid var(--border-focus)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                lineHeight: 1.5,
                padding: '8px 10px',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onCancelEdit}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '5px 12px',
                  cursor: 'pointer',
                }}
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                style={{
                  background: 'var(--brand-primary)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '5px 12px',
                  cursor: 'pointer',
                }}
              >
                {t.common.saveAndSubmit}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Attachments */}
            {isUser && attachments && attachments.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  marginBottom: '4px',
                }}
              >
                {attachments.map((att) => (
                  <AttachmentChip key={att.id} attachment={att} language={language} />
                ))}
              </div>
            )}

            {/* Message Content */}
            {isUser ? (
              <ExpandablePrompt
                content={content}
                isExpanded={isPromptExpanded}
                onToggle={() => setIsPromptExpanded(!isPromptExpanded)}
                language={language}
              />
            ) : (
              <>
                {/* Reasoning/Thinking display */}
                {reasoningContent && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      fontStyle: 'italic',
                      padding: '8px 12px',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '8px',
                      borderLeft: '3px solid var(--brand-primary)',
                    }}
                  >
                    {reasoningContent}
                  </div>
                )}

                {/* Timeline Component — above output (consistent with chat page) */}
                {!isUser && (agentSteps || reasoningContent || actions) && (
                  <AgentStepTimeline
                    steps={agentSteps}
                    reasoningContent={reasoningContent}
                    actions={actions}
                    isStreaming={isStreaming ?? false}
                    language={language === 'id' ? 'id' : 'en'}
                  />
                )}

                {/* Assistant Content or Streaming */}
                {content ? (
                  <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                    <MarkdownRenderer content={content} />
                  </div>
                ) : isStreaming ? (
                  <StreamingIndicator language={language} />
                ) : null}
              </>
            )}

            {/* Extra Content */}
            {extraContent && !isUser && !isStreaming && (
              <div style={{ width: '100%', marginTop: '4px' }}>{extraContent}</div>
            )}
          </>
        )}
      </div>

      {/* Extra Footer */}
      {extraFooter && <div style={{ width: '100%' }}>{extraFooter}</div>}

      {/* Action Bar */}
      {!isUser && content && !isStreaming && (
        <MessageActionBar
          role={role}
          language={language}
          isHovered={isHovered}
          timestamp={timestamp}
          copied={copied}
          feedback={feedback}
          variant={variant}
          onCopy={handleCopy}
          onFeedback={handleFeedback}
        />
      )}

      {/* User Action Bar */}
      {isUser && !isEditing && (
        <MessageActionBar
          role={role}
          language={language}
          isHovered={isHovered}
          timestamp={timestamp}
          copied={copied}
          feedback={null}
          variant={variant}
          showCopy={true}
          showEdit={variant === 'coauthor' || variant === 'assistant'}
          onCopy={handleCopy}
          onEdit={onEdit}
        />
      )}
    </div>
  );
}

// ============================================
// Convenience Components
// ============================================

/**
 * UserPromptBubble - Convenient wrapper for user messages
 */
export function UserPromptBubble({
  content,
  attachments,
  timestamp,
  variant = 'assistant',
  language = 'id',
  onCopy,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onUndo,
}: Omit<AIChatBubbleProps, 'role' | 'assistantName' | 'assistantIcon' | 'assistantColor' | 'reasoningContent' | 'isStreaming' | 'isReverted'>) {
  return (
    <AIChatBubble
      role="user"
      content={content}
      attachments={attachments}
      timestamp={timestamp}
      variant={variant}
      language={language}
      onCopy={onCopy}
      onEdit={onEdit}
      onSaveEdit={onSaveEdit}
      onCancelEdit={onCancelEdit}
      onUndo={onUndo}
    />
  );
}

/**
 * AssistantMessageBubble - Convenient wrapper for assistant messages
 */
export function AssistantMessageBubble({
  content,
  reasoningContent,
  isStreaming = false,
  assistantName = 'AI Assistant',
  assistantIcon,
  assistantColor = 'var(--brand-primary)',
  timestamp,
  language = 'id',
  onCopy,
  extraHeader,
  extraContent,
  extraFooter,
}: Omit<AIChatBubbleProps, 'role' | 'variant' | 'attachments' | 'isEditing' | 'editContent' | 'isReverted' | 'onEdit' | 'onSaveEdit' | 'onCancelEdit' | 'onUndo' | 'onOpenFile'>) {
  return (
    <AIChatBubble
      role="assistant"
      content={content}
      reasoningContent={reasoningContent}
      isStreaming={isStreaming}
      assistantName={assistantName}
      assistantIcon={assistantIcon}
      assistantColor={assistantColor}
      timestamp={timestamp}
      language={language}
      onCopy={onCopy}
      extraHeader={extraHeader}
      extraContent={extraContent}
      extraFooter={extraFooter}
    />
  );
}

/**
 * CoAuthorMessageBubble - Convenience wrapper for Co-Author style messages
 */
export function CoAuthorMessageBubble({
  content,
  isStreaming = false,
  timestamp,
  isReverted,
  variant = 'coauthor',
  language = 'id',
  onCopy,
  onUndo,
}: Omit<AIChatBubbleProps, 'role' | 'assistantName' | 'assistantIcon' | 'assistantColor' | 'reasoningContent' | 'attachments' | 'isEditing' | 'editContent' | 'onEdit' | 'onSaveEdit' | 'onCancelEdit' | 'onOpenFile' | 'extraHeader' | 'extraContent' | 'extraFooter'>) {
  return (
    <AIChatBubble
      role="user"
      content={content}
      isStreaming={isStreaming}
      timestamp={timestamp}
      isReverted={isReverted}
      variant={variant}
      language={language}
      onCopy={onCopy}
      onUndo={onUndo}
    />
  );
}