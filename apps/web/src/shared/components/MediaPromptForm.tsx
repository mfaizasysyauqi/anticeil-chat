'use client';

import React from 'react';
import { ArrowUp, RefreshCw, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../features/auth/store/useAuthStore';

export interface MediaPromptFormProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isGenerating: boolean;
  placeholder: string;
  modelDisplayName: string;
  onModelSelectorOpen: () => void;
  language: 'en' | 'id';
  brandColor?: string; // For themed styling (e.g. '#fb7185' for video, '#60a5fa' for audio)
  additionalControls?: React.ReactNode; // For style/ratio selectors etc
}

export function MediaPromptForm({
  prompt,
  onPromptChange,
  onSubmit,
  isGenerating,
  placeholder,
  modelDisplayName,
  onModelSelectorOpen,
  language,
  brandColor = 'var(--brand-primary)',
  additionalControls,
}: MediaPromptFormProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    if (!user) {
      openAuthModal('login');
      return;
    }
    onSubmit(e);
  };

  // Auto-resize textarea height: min 2 lines (~44px), max 7 lines (~154px)
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      // 2 lines: ~44px, 7 lines: ~154px (line-height: ~22px)
      const minHeight = 44;
      const maxHeight = 154;
      const targetHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
      textareaRef.current.style.height = `${targetHeight}px`;
      textareaRef.current.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [prompt]);

  return (
    <form
      onSubmit={handleFormSubmit}
      style={{
        width: '100%',
        maxWidth: '860px',
        background: 'var(--bg-input, var(--bg-surface))',
        border: `1px solid ${
          isFocused ? 'var(--border-focus, ' + brandColor + ')' : 'var(--border-subtle)'
        }`,
        borderRadius: 'var(--radius-xl, 16px)',
        boxShadow: isFocused
          ? 'var(--shadow-lg, 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1))'
          : 'var(--shadow-md, 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1))',
        display: 'flex',
        flexDirection: 'column',
        padding: '10px 14px',
        position: 'relative',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleFormSubmit(e as unknown as React.FormEvent);
          }
        }}
        rows={2}
        style={{
          width: '100%',
          minHeight: '44px',
          maxHeight: '154px',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          color: 'var(--text-primary)',
          fontSize: '14px',
          lineHeight: '22px',
          padding: '2px',
        }}
      />

      {/* Bottom Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '8px',
          paddingTop: '6px',
          gap: '8px',
        }}
      >
        {/* Left Side: Additional Controls (Style/Ratio/Voice etc) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flex: 1,
            flexWrap: 'wrap',
            minWidth: 0,
          }}
        >
          {additionalControls}
        </div>

        {/* Right Side: Model Selector + Submit Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Model Selector Dropdown Text (Grok style matching ChatInput) */}
          <button
            type="button"
            onClick={onModelSelectorOpen}
            title={language === 'id' ? 'Pilih Model' : 'Select Model'}
            className="clickable-pill"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              padding: '5px 8px',
              borderRadius: 'var(--radius-md, 8px)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              maxWidth: '220px',
              transition: 'color 0.15s ease, background 0.15s ease',
            }}
          >
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: 'var(--text-primary)',
                fontWeight: 500,
                fontSize: '13px',
              }}
            >
              {modelDisplayName}
            </span>
            <ChevronDown size={14} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
          </button>

          {/* Send / Generate Submit Button (Round Circle matching ChatInput) */}
          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            title={language === 'id' ? 'Hasilkan' : 'Generate'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              border: 'none',
              background:
                prompt.trim() && !isGenerating
                  ? 'var(--text-primary)'
                  : 'var(--bg-subtle)',
              color:
                prompt.trim() && !isGenerating
                  ? 'var(--bg-main)'
                  : 'var(--text-muted)',
              boxShadow:
                prompt.trim() && !isGenerating
                  ? 'var(--shadow-sm)'
                  : 'none',
              cursor: prompt.trim() && !isGenerating ? 'pointer' : 'default',
              transition: 'all 0.15s ease',
            }}
          >
            {isGenerating ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <ArrowUp size={17} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
