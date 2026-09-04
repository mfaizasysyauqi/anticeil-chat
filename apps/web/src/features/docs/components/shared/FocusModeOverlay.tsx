import React from 'react';
import { Minimize2, FileText } from 'lucide-react';

export interface FocusModeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  activeFileName?: string;
  value?: string;
  onChange?: (val: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

/**
 * Standardized Focus Mode (Zen Mode) overlay.
 * Renders full-viewport distraction-free backdrop with exit button (Esc / Minimize2).
 * Supports either children OR built-in distraction-free code textarea.
 */
export function FocusModeOverlay({
  isOpen,
  onClose,
  children,
  activeFileName,
  value,
  onChange,
  onKeyDown,
}: FocusModeOverlayProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999999,
        backgroundColor: 'var(--bg-main)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top minimal exit bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-subtle)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          <FileText size={14} color="var(--brand-primary)" />
          <span>{activeFileName || 'Editor'}</span>
          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 400 }}>(Focus Mode)</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '5px',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'all 0.15s ease',
          }}
          title="Exit Focus Mode (Ctrl+Shift+M / Esc)"
        >
          <Minimize2 size={13} />
          <span>Exit Focus Mode</span>
          <kbd
            style={{
              padding: '1px 4px',
              fontSize: '10px',
              borderRadius: '3px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              marginLeft: '2px',
            }}
          >
            Esc
          </kbd>
        </button>
      </div>

      {/* Main Focus Content */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {children ? (
          children
        ) : (
          <textarea
            value={value ?? ''}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={onKeyDown}
            autoFocus
            spellCheck={false}
            style={{
              flex: 1,
              width: '100%',
              maxWidth: '900px',
              margin: '0 auto',
              padding: '32px 24px',
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              caretColor: 'var(--brand-primary)',
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
              fontSize: '14px',
              lineHeight: '24px',
              tabSize: 2,
              border: 'none',
              outline: 'none',
              resize: 'none',
              boxSizing: 'border-box',
              overflowY: 'auto',
            }}
          />
        )}
      </div>
    </div>
  );
}

