import React from 'react';

export interface SplitResizeDividerProps {
  isResizing?: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Overleaf / Anticeil standardized 4px split pane resize divider.
 * Provides consistent active highlight and cursor styling.
 */
export function SplitResizeDivider({
  isResizing = false,
  onMouseDown,
  className = 'resize-divider',
  style,
}: SplitResizeDividerProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      className={className}
      style={{
        width: '4px',
        cursor: 'col-resize',
        flexShrink: 0,
        backgroundColor: isResizing ? 'var(--brand-primary)' : 'var(--border-subtle)',
        transition: isResizing ? 'none' : 'background 0.15s',
        ...style,
      }}
    />
  );
}
