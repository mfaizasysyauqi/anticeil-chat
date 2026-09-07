'use client';

import React from 'react';
import { Pencil } from 'lucide-react';

interface EditButtonProps {
  onClick: () => void;
  language?: 'id' | 'en';
  size?: number;
  disabled?: boolean;
}

/**
 * Hover button to start editing a user message.
 * Renders pencil icon that appears on hover.
 */
export function CoAuthorEditButton({ onClick, language = 'id', size = 14, disabled = false }: EditButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={language === 'id' ? 'Edit prompt' : 'Edit prompt'}
      style={{
        padding: '4px',
        borderRadius: '4px',
        border: 'none',
        background: 'var(--bg-surface)',
        color: 'var(--text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = 'var(--bg-hover, rgba(255, 255, 255, 0.1))';
          e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--bg-surface)';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
    >
      <Pencil size={size} />
    </button>
  );
}

interface EditTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  language?: 'id' | 'en';
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  autoFocus?: boolean;
}

/**
 * Inline textarea for editing a user message.
 * Shows save/cancel buttons.
 */
export function CoAuthorEditTextarea({
  value,
  onChange,
  onSave,
  onCancel,
  language = 'id',
  textareaRef,
  autoFocus = true,
}: EditTextareaProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '12px',
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        autoFocus={autoFocus}
        style={{
          width: '100%',
          background: 'var(--bg-main)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '10px',
          color: 'var(--text-primary)',
          fontSize: '13px',
          fontFamily: 'inherit',
          resize: 'vertical',
          outline: 'none',
        }}
      />
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {language === 'id' ? 'Batal' : 'Cancel'}
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!value.trim()}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            background: 'var(--brand-primary)',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 600,
            cursor: value.trim() ? 'pointer' : 'not-allowed',
            opacity: value.trim() ? 1 : 0.5,
            transition: 'all 0.15s',
          }}
        >
          {language === 'id' ? 'Simpan & Kirim' : 'Save & Send'}
        </button>
      </div>
    </div>
  );
}

interface UndoToastState {
  messageId: string;
  count: number;
}

interface UndoToastProps {
  state: UndoToastState | null;
  onUndo: () => void;
  language?: 'id' | 'en';
}

/**
 * Undo toast notification - shows deleted message count with Undo button.
 * Matches Claude Code's undo pattern.
 */
export function CoAuthorUndoToast({ state, onUndo, language = 'id' }: UndoToastProps) {
  if (!state) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
        zIndex: 9998,
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
        {language === 'id'
          ? `${state.count} pesan dihapus`
          : `${state.count} message${state.count > 1 ? 's' : ''} deleted`}
      </span>
      <button
        type="button"
        onClick={onUndo}
        style={{
          padding: '4px 12px',
          borderRadius: '6px',
          border: '1px solid var(--brand-primary)',
          backgroundColor: 'transparent',
          color: 'var(--brand-primary)',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--brand-primary)';
          e.currentTarget.style.color = '#FFFFFF';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--brand-primary)';
        }}
      >
        {language === 'id' ? 'Batalkan' : 'Undo'}
      </button>
    </div>
  );
}
