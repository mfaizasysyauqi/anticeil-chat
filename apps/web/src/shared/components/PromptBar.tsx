'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Square, RefreshCw, ChevronDown, Paperclip, Plus, AtSign, X, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../features/auth/store/useAuthStore';

export interface PromptAttachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'text';
  mimeType: string;
  size: number;
  dataUrl?: string;
  textContent?: string;
}

export interface PromptBarProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onStop?: () => void;
  isGenerating?: boolean;
  placeholder?: string;
  modelDisplayName?: string;
  onModelSelectorOpen?: () => void;
  leftControls?: React.ReactNode;
  rightControls?: React.ReactNode;
  brandColor?: string;
  minHeight?: number;
  maxHeight?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  submitTooltip?: string;
  attachments?: PromptAttachment[];
  onAttachmentsChange?: (attachments: PromptAttachment[]) => void;
  allowAttachments?: boolean;
}

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_TEXT_CHARS = 20000;

export function PromptBar({
  prompt,
  onPromptChange,
  onSubmit,
  onStop,
  isGenerating = false,
  placeholder = 'Ask anything...',
  modelDisplayName,
  onModelSelectorOpen,
  leftControls,
  rightControls,
  brandColor = 'var(--brand-primary)',
  minHeight = 44,
  maxHeight = 154,
  autoFocus = false,
  disabled = false,
  submitTooltip,
  attachments = [],
  onAttachmentsChange,
  allowAttachments = true,
}: PromptBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  const showWarning = (msg: string) => {
    setWarningMessage(msg);
    setTimeout(() => setWarningMessage(null), 4000);
  };

  const processFiles = (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (!fileList.length) return;

    if (attachments.length + fileList.length > MAX_ATTACHMENTS) {
      showWarning(`Maksimal ${MAX_ATTACHMENTS} berkas lampiran per pesan.`);
      return;
    }

    fileList.forEach((file) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        showWarning(`Berkas "${file.name}" melebihi batas ukuran 5MB.`);
        return;
      }

      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const isImage = file.type.startsWith('image/');
      const isTextLike =
        file.type.startsWith('text/') ||
        /\.(txt|csv|json|bib|md|tex|typ|xml|js|ts|py|html|css)$/i.test(file.name);

      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          const newAtt: PromptAttachment = {
            id,
            name: file.name,
            type: 'image',
            mimeType: file.type || 'image/png',
            size: file.size,
            dataUrl,
          };
          if (onAttachmentsChange) {
            onAttachmentsChange([...attachments, newAtt]);
          }
        };
        reader.readAsDataURL(file);
      } else if (isTextLike) {
        const reader = new FileReader();
        reader.onload = (e) => {
          let text = (e.target?.result as string) || '';
          if (text.length > MAX_TEXT_CHARS) {
            text = text.slice(0, MAX_TEXT_CHARS) + '\n... [dipotong untuk menghemat token AI]';
          }
          const newAtt: PromptAttachment = {
            id,
            name: file.name,
            type: 'text',
            mimeType: file.type || 'text/plain',
            size: file.size,
            textContent: text,
          };
          if (onAttachmentsChange) {
            onAttachmentsChange([...attachments, newAtt]);
          }
        };
        reader.readAsText(file);
      } else {
        // Document / PDF / Binary
        const newAtt: PromptAttachment = {
          id,
          name: file.name,
          type: 'document',
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
        };
        if (onAttachmentsChange) {
          onAttachmentsChange([...attachments, newAtt]);
        }
      }
    });
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!allowAttachments) return;
    const items = e.clipboardData?.items;
    if (!items) return;

    const pastedFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) pastedFiles.push(file);
      }
    }

    if (pastedFiles.length > 0) {
      processFiles(pastedFiles);
    }
  };

  const removeAttachment = (id: string) => {
    if (onAttachmentsChange) {
      onAttachmentsChange(attachments.filter((a) => a.id !== id));
    }
  };

  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isGenerating) {
      if (onStop) onStop();
      return;
    }
    if ((!prompt.trim() && attachments.length === 0) || disabled) return;
    if (!user) {
      openAuthModal('login');
      return;
    }
    onSubmit(e);
  };

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const targetHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
      textareaRef.current.style.height = `${targetHeight}px`;
      textareaRef.current.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [prompt, minHeight, maxHeight]);

  return (
    <div
      className="chat-input-container"
      style={{
        padding: 'var(--space-sm) var(--page-pad-x) var(--space-xl) var(--page-pad-x)',
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    >
      <div
        className="chat-input-wrapper"
        style={{
          width: '100%',
          maxWidth: '860px',
          position: 'relative',
        }}
      >
        {/* Warning banner */}
        {warningMessage && (
          <div
            style={{
              position: 'absolute',
              top: '-36px',
              left: '0',
              right: '0',
              padding: '6px 12px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#EF4444',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 10,
            }}
          >
            <AlertCircle size={14} />
            <span>{warningMessage}</span>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.txt,.csv,.json,.bib,.md,.tex,.typ"
          onChange={(e) => {
            if (e.target.files) processFiles(e.target.files);
            e.target.value = '';
          }}
          style={{ display: 'none' }}
        />

        <form
          onSubmit={handleFormSubmit}
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {/* Cline-Style Main Input Card */}
          <div
            className="chat-input-wrapper"
            style={{
              width: '100%',
              background: 'var(--bg-input, #18181b)',
              border: `1px solid ${
                isFocused ? 'var(--border-strong)' : 'var(--border-subtle)'
              }`,
              borderRadius: '12px',
              padding: '12px 14px 8px 14px',
              display: 'flex',
              flexDirection: 'column',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              position: 'relative',
              boxSizing: 'border-box',
            }}
          >
            {/* Attachment Previews Bar */}
            {attachments.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  paddingBottom: '8px',
                  marginBottom: '6px',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: att.type === 'image' ? '3px 8px 3px 3px' : '4px 8px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '11.5px',
                      fontWeight: 550,
                      color: 'var(--text-primary)',
                      maxWidth: '200px',
                    }}
                  >
                    {att.type === 'image' && att.dataUrl ? (
                      <img
                        src={att.dataUrl}
                        alt={att.name}
                        style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }}
                      />
                    ) : (
                      <FileText size={14} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
                    )}
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                      }}
                    >
                      {att.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder={placeholder}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onPaste={handlePaste}
              autoFocus={autoFocus}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleFormSubmit();
                }
              }}
              rows={2}
              style={{
                width: '100%',
                minHeight: `${minHeight}px`,
                maxHeight: `${maxHeight}px`,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                color: 'var(--text-primary)',
                fontSize: '13.5px',
                lineHeight: '21px',
                padding: '0',
              }}
            />

            {/* Bottom Row Inside Card: Subtext Hint & Send/Stop Icon */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '6px',
                gap: '8px',
              }}
            >
              {/* Subtext Hint */}
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  opacity: 0.75,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                }}
              >
                Ketik @ untuk konteks, / untuk perintah, tahan Shift untuk seret berkas
              </span>

              {/* Send / Stop Icon Button inside bottom-right corner */}
              {isGenerating ? (
                <button
                  type="button"
                  onClick={() => {
                    if (onStop) onStop();
                  }}
                  title="Stop"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    background: 'var(--accent-danger, #ef4444)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  <Square size={12} fill="#FFFFFF" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={(!prompt.trim() && attachments.length === 0) || disabled}
                  title={submitTooltip || 'Send'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    background: 'transparent',
                    color:
                      (prompt.trim() || attachments.length > 0) && !disabled
                        ? 'var(--brand-primary, #3b82f6)'
                        : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: (prompt.trim() || attachments.length > 0) && !disabled ? 'pointer' : 'default',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                    opacity: (prompt.trim() || attachments.length > 0) && !disabled ? 1 : 0.45,
                  }}
                >
                  <ArrowUp size={16} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>

          {/* Cline-Style Dedicated Bottom Toolbar (Outside Input Card) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '2px 4px',
              gap: '8px',
              width: '100%',
              flexWrap: 'wrap',
            }}
          >
            {/* Left Controls: @, +, Category/Engine Dropdowns, Model Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexWrap: 'wrap',
                minWidth: 0,
              }}
            >
              {/* 1. Mention Context (@) Button */}
              <button
                type="button"
                onClick={() => {
                  onPromptChange(prompt ? `${prompt} @` : '@');
                  textareaRef.current?.focus();
                }}
                title="Mention context / file (@)"
                style={{
                  width: '24px',
                  height: '24px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0',
                  transition: 'color 0.15s ease, background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <AtSign size={14} />
              </button>

              {/* 2. Plus (+) Attach Button */}
              {allowAttachments && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach image or file (+)"
                  style={{
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '0',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Plus size={14} />
                </button>
              )}

              {/* Custom Left Controls (Category & Engine selectors) */}
              {leftControls}

              {/* 3. Cline-Style Model Selector Badge */}
              {modelDisplayName && (
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      openAuthModal('login');
                      return;
                    }
                    if (onModelSelectorOpen) onModelSelectorOpen();
                  }}
                  title="Select AI Model"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    padding: '3px 6px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    maxWidth: '260px',
                    minWidth: 0,
                    transition: 'color 0.15s ease, background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'var(--text-secondary)',
                      fontWeight: 500,
                      fontSize: '12px',
                      minWidth: 0,
                    }}
                  >
                    Anticeil Pass:{' '}
                    <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {modelDisplayName.replace(/ \((Anticeil Pass|Anticeil Free)\)/, '')}
                    </strong>
                  </span>
                  <ChevronDown size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                </button>
              )}
            </div>

            {/* Right Controls: rightControls & Cline-Style Mode Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: 'auto' }}>
              {rightControls}

              {/* Cline-Style Mode Pill (Plan | Act) */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'var(--bg-subtle, rgba(255,255,255,0.06))',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '5px',
                  padding: '2px',
                  gap: '1px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    padding: '2px 7px',
                    borderRadius: '3px',
                    color: 'var(--text-muted)',
                    cursor: 'default',
                  }}
                >
                  Plan
                </span>
                <span
                  style={{
                    padding: '2px 7px',
                    borderRadius: '3px',
                    background: 'var(--brand-primary, #3b82f6)',
                    color: '#FFFFFF',
                    cursor: 'default',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                >
                  Act
                </span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
