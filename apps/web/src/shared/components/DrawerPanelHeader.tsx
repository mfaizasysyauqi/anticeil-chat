'use client';

import React from 'react';
import { X, PanelLeftClose } from 'lucide-react';

/**
 * DrawerPanelHeader
 * Reusable 48px header bar matching the Navbar height exactly.
 * Used at the top of every sidebar drawer panel (chat, docs, media).
 */
export interface DrawerPanelHeaderProps {
  title: string;
  titleStyle?: 'primary' | 'label';
  onClose?: () => void;
  collapseLabel?: string;
  onCollapse?: () => void;
  /** CSS class that hides on certain breakpoints e.g. 'hide-on-drawer' */
  hideClass?: string;
  /** CSS class that shows on certain breakpoints e.g. 'show-on-drawer' */
  showClass?: string;
  className?: string;
  children?: React.ReactNode;
}

export function DrawerPanelHeader({
  title,
  titleStyle = 'label',
  onClose,
  collapseLabel,
  onCollapse,
  hideClass,
  showClass,
  className,
  children,
}: DrawerPanelHeaderProps) {
  const isPrimary = titleStyle === 'primary';
  const rootClass = [hideClass, showClass, className].filter(Boolean).join(' ');

  return (
    <div
      className={rootClass || undefined}
      style={{
        height: '48px',
        boxSizing: 'border-box',
        padding: '0 8px 0 12px',
        display: showClass ? 'none' : 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
        <span
          style={
            isPrimary
              ? {
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }
              : {
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }
          }
        >
          {title}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
        {children}

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <X size={17} />
          </button>
        )}

        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            aria-label={collapseLabel ?? 'Collapse sidebar'}
            title={collapseLabel ?? 'Collapse sidebar'}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <PanelLeftClose size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
