'use client';

import React from 'react';
import { ArrowUp, RefreshCw, ChevronDown } from 'lucide-react';

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

  return (
    <form
      onSubmit={onSubmit}
      style={{
        background: 'var(--bg-surface)',
        border: `1.5px solid ${isFocused ? brandColor : 'var(--border-subtle)'}`,
        borderRadius: '16px',
        padding: '16px',
        maxWidth: '900px',
        width: '100%',
        boxShadow: isFocused
          ? `0 0 0 3px ${brandColor}20, var(--shadow-lg)`
          : 'var(--shadow-md)',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Textarea */}
      <textarea
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            if (prompt.trim() && !isGenerating) onSubmit(e as unknown as React.FormEvent);
          }
        }}
        rows={3}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--text-primary)',
          fontSize: '14px',
          fontFamily: 'inherit',
          resize: 'none',
          marginBottom: '12px',
          lineHeight: '1.6',
        }}
      />

      {/* Bottom Row: All Controls + Submit Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        {/* Left Side: Model Selector + Additional Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flex: 1,
            flexWrap: 'wrap',
            minWidth: 0,
          }}
        >
          {/* Model Selector Button */}
          <button
            type="button"
            onClick={onModelSelectorOpen}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              maxWidth: '240px',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-card)';
              e.currentTarget.style.borderColor = brandColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-subtle)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {modelDisplayName}
            </span>
            <ChevronDown size={13} color={brandColor} style={{ flexShrink: 0 }} />
          </button>

          {/* Separator */}
          {additionalControls && (
            <div
              style={{
                width: '1px',
                height: '24px',
                background: 'var(--border-subtle)',
                flexShrink: 0,
              }}
            />
          )}

          {/* Additional Controls (Style/Ratio/Voice/Speed/etc.) */}
          {additionalControls}
        </div>

        {/* Right Side: Submit Button */}
        <button
          type="submit"
          disabled={isGenerating || !prompt.trim()}
          title={language === 'id' ? 'Hasilkan' : 'Generate'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            border: 'none',
            background: prompt.trim() && !isGenerating ? brandColor : 'var(--bg-subtle)',
            color: prompt.trim() && !isGenerating ? '#ffffff' : 'var(--text-muted)',
            cursor: prompt.trim() && !isGenerating ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease',
            flexShrink: 0,
            opacity: prompt.trim() && !isGenerating ? 1 : 0.5,
          }}
        >
          {isGenerating ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <ArrowUp size={18} strokeWidth={2.5} />
          )}
        </button>
      </div>
    </form>
  );
}
