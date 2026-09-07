'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  iconAlign?: 'center' | 'bottom';
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
  iconAlign = 'center',
  className: customClassName = '',
  style,
}: RailIconButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number; transform: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseEnter = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const spaceOnRight = viewportWidth - (rect.right + 12);

      if (spaceOnRight >= 160) {
        setTooltipPos({
          left: rect.right + 10,
          top: rect.top + rect.height / 2,
          transform: 'translateY(-50%)',
        });
      } else {
        const idealLeft = Math.max(16, Math.min(viewportWidth - 16, rect.left + rect.width / 2));
        setTooltipPos({
          left: idealLeft,
          top: Math.max(10, rect.top - 8),
          transform: 'translate(-50%, -100%)',
        });
      }
    }
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  const colorClass = colorType !== 'default' ? `${colorType}-btn` : 'docs-btn';
  const combinedClassName = `rail-icon-btn ${colorClass}${isActive ? ' active' : ''} ${customClassName}`.trim();

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: iconAlign === 'bottom' ? 'flex-end' : 'center',
        justifyContent: 'center',
        ...style,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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

      {/* Floating Tooltip via Portal */}
      {hovered && tooltipPos && mounted && typeof document !== 'undefined' && createPortal(
        <div
          className="animate-fade-in"
          style={{
            position: 'fixed',
            left: `${tooltipPos.left}px`,
            top: `${tooltipPos.top}px`,
            transform: tooltipPos.transform,
            backgroundColor: 'var(--bg-surface, #18181b)',
            border: '1px solid var(--border-strong, rgba(255,255,255,0.15))',
            borderRadius: '8px',
            padding: '5px 10px',
            whiteSpace: 'nowrap',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)',
            zIndex: 9999999,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            pointerEvents: 'none',
            maxWidth: 'calc(100vw - 24px)',
            boxSizing: 'border-box',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary, #ffffff)' }}>
            {label}
          </span>
        </div>,
        document.body
      )}
    </div>
  );
}
