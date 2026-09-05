'use client';

import React from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export interface SplitResizeDividerProps {
  isResizing?: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
  showSyncPill?: boolean;
  onSyncCodeToPreview?: () => void;
  onSyncPreviewToCode?: () => void;
}

/**
 * Overleaf / Anticeil standardized split pane resize divider
 * equipped with floating SyncTeX navigation buttons (Code ↔ Preview sync).
 */
export function SplitResizeDivider({
  isResizing = false,
  onMouseDown,
  className = 'resize-divider',
  style,
  showSyncPill = true,
  onSyncCodeToPreview,
  onSyncPreviewToCode,
}: SplitResizeDividerProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      className={className}
      style={{
        position: 'relative',
        width: '4px',
        cursor: 'col-resize',
        flexShrink: 0,
        backgroundColor: isResizing ? 'var(--brand-primary)' : 'var(--border-subtle)',
        transition: isResizing ? 'none' : 'background 0.15s',
        zIndex: 20,
        ...style,
      }}
    >
      {showSyncPill && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '110px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            backgroundColor: 'var(--bg-surface, #1e2430)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '4px 3px',
            boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.25))',
            cursor: 'default',
            zIndex: 25,
          }}
        >
          {/* Top Arrow: Jump Code -> Preview */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSyncCodeToPreview?.();
            }}
            title="SyncTeX: Lompat dari Kode ke Pratinjau / PDF (Code → Preview)"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s, transform 0.1s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
              e.currentTarget.style.color = 'var(--brand-primary)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <ArrowRight size={13} strokeWidth={2.5} />
          </button>

          {/* Bottom Arrow: Jump Preview -> Code */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSyncPreviewToCode?.();
            }}
            title="SyncTeX: Lompat dari Pratinjau / PDF ke Kode Editor (Preview → Code)"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s, transform 0.1s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
              e.currentTarget.style.color = 'var(--brand-primary)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <ArrowLeft size={13} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}
