'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export type RailColorType = 'chat' | 'docs' | 'media' | 'default';

export interface RailIconButtonProps {
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  colorType?: RailColorType;
  badgeCount?: number;
  showIndicatorBar?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function RailIconButton({
  href,
  onClick,
  icon,
  label,
  isActive = false,
  colorType = 'default',
  badgeCount,
  showIndicatorBar = false,
  className: customClassName = '',
  style,
}: RailIconButtonProps) {
  const [hovered, setHovered] = useState(false);

  const colorClass = colorType !== 'default' ? `${colorType}-btn` : 'docs-btn';
  const combinedClassName = `rail-icon-btn ${colorClass}${isActive ? ' active' : ''} ${customClassName}`.trim();

  return (
    <div
      style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {showIndicatorBar && isActive && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '7px',
            bottom: '7px',
            width: '3px',
            backgroundColor: 'var(--brand-primary)',
            borderRadius: '0 2px 2px 0',
          }}
        />
      )}

      {href ? (
        <Link href={href} onClick={onClick} className={combinedClassName} aria-label={label}>
          {icon}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className={combinedClassName} aria-label={label}>
          {icon}
        </button>
      )}

      {badgeCount !== undefined && badgeCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            minWidth: '13px',
            height: '13px',
            padding: '0 3px',
            borderRadius: '999px',
            backgroundColor: 'var(--brand-primary)',
            color: '#ffffff',
            fontSize: '8.5px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            pointerEvents: 'none',
          }}
        >
          {badgeCount}
        </span>
      )}

      {/* Floating Tooltip */}
      {hovered && (
        <div
          className="animate-fade-in"
          style={{
            position: 'absolute',
            left: 'calc(100% + 12px)',
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: 'var(--bg-surface, #18181b)',
            border: '1px solid var(--border-strong, rgba(255,255,255,0.15))',
            borderRadius: '8px',
            padding: '5px 10px',
            whiteSpace: 'nowrap',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary, #ffffff)' }}>
            {label}
          </span>
        </div>
      )}
    </div>
  );
}
