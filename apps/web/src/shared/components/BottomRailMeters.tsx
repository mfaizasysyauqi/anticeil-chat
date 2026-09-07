'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useCreditStore, MAX_DAILY_CREDITS } from '../../features/credits/store/useCreditStore';
import { useSettingsStore } from '../../features/settings/store/useSettingsStore';

/**
 * Compact Number Formatter for tight 32px circle rings
 * Bahasa Indonesia: <1rb, rb, jt, M (Miliar), T (Triliun)
 * English: <1k, k, M (Million), B (Billion), T (Trillion)
 */
export function formatCompactNumber(val: number, lang: string = 'id'): string {
  if (!val || val < 0) return '0';
  if (val < 1000) return val.toString();

  const isId = lang === 'id';

  if (val < 1000000) {
    const k = val / 1000;
    const formatted = k % 1 === 0 ? k.toFixed(0) : k.toFixed(1);
    return `${formatted}${isId ? 'rb' : 'k'}`;
  }

  if (val < 1000000000) {
    const m = val / 1000000;
    const formatted = m % 1 === 0 ? m.toFixed(0) : m.toFixed(1);
    return `${formatted}${isId ? 'jt' : 'M'}`;
  }

  if (val < 1000000000000) {
    const b = val / 1000000000;
    const formatted = b % 1 === 0 ? b.toFixed(0) : b.toFixed(1);
    return `${formatted}${isId ? 'M' : 'B'}`;
  }

  const t = val / 1000000000000;
  const formatted = t % 1 === 0 ? t.toFixed(0) : t.toFixed(1);
  return `${formatted}T`;
}

interface CircularProgressRingProps {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
}

function CircularProgressRing({
  value,
  size = 32,
  strokeWidth = 3,
  color = '#f59e0b',
  children,
}: CircularProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-subtle, rgba(255, 255, 255, 0.12))"
          strokeWidth={strokeWidth}
        />
        {/* Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      {/* Content centered directly inside the circle ring */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}

interface BottomRailMetersProps {
  onOpenTopup?: () => void;
  onOpenTiers?: () => void;
  circleSize?: number;
}

export function BottomRailMeters({
  onOpenTopup,
  circleSize = 32,
}: BottomRailMetersProps) {
  const [mounted, setMounted] = useState(false);
  const [hoverCredit, setHoverCredit] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number; transform: string } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Credit Store
  const dailyCredits = useCreditStore((s) => s.credits) || 0;
  const maxCredits = useCreditStore((s) => s.maxDailyCredits) || MAX_DAILY_CREDITS;
  const paidCredits = useCreditStore((s) => s.paidCredits) || 0;
  const totalCredits = (dailyCredits || 0) + (paidCredits || 0);

  const language = useSettingsStore((s) => s.language);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseEnter = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const spaceOnRight = viewportWidth - (rect.right + 12);

      if (spaceOnRight >= 250) {
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
    setHoverCredit(true);
  };

  const handleMouseLeave = () => {
    setHoverCredit(false);
  };

  if (!mounted) return null;

  const creditPercentage = Math.min(100, Math.max(0, (dailyCredits / maxCredits) * 100));
  const creditColor =
    totalCredits === 0
      ? 'var(--accent-danger, #ef4444)'
      : hoverCredit
      ? 'var(--rail-credit-color, #f59e0b)'
      : 'var(--text-secondary, #94a3b8)';

  // Label: total usable credits (daily + paid). Ring arc: daily % only (has a clear max)
  const compactCredits = formatCompactNumber(totalCredits, language);

  // Dynamic font sizing
  const creditFontSize =
    compactCredits.length <= 2 ? '10.5px'
    : compactCredits.length === 3 ? '9.5px'
    : '8.5px';

  return (
    <div
      style={{
        width: '100%',
        height: '48px',
        borderTop: '1px solid var(--border-subtle)',
        padding: 0,
        background: 'var(--bg-sidebar)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* ⚡ AI Credit Circular Ring */}
        <button
          ref={buttonRef}
          type="button"
          onClick={onOpenTopup}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            outline: 'none',
            transition: 'transform 0.15s ease',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <CircularProgressRing value={creditPercentage} size={circleSize} strokeWidth={3} color={creditColor}>
            <span
              style={{
                fontSize: creditFontSize,
                fontWeight: 800,
                color: creditColor,
                fontFamily: 'monospace, sans-serif',
                lineHeight: 1,
                userSelect: 'none',
                letterSpacing: '-0.2px',
              }}
            >
              {compactCredits}
            </span>
          </CircularProgressRing>
        </button>

        {/* Hover Tag / Tooltip (rendered in Portal to escape drawer stacking & overflow:hidden) */}
        {hoverCredit && tooltipPos && mounted && typeof document !== 'undefined' && createPortal(
          <div
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
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              animation: 'fadeIn 0.12s ease-out',
              pointerEvents: 'none',
              maxWidth: 'calc(100vw - 24px)',
              boxSizing: 'border-box',
            }}
          >
            <span style={{ color: '#f59e0b', flexShrink: 0 }}>⚡</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {language === 'id'
                ? `${dailyCredits.toLocaleString()} harian${paidCredits > 0 ? ` + ${paidCredits.toLocaleString()} top-up` : ''} · Klik untuk Top-up`
                : `${dailyCredits.toLocaleString()} daily${paidCredits > 0 ? ` + ${paidCredits.toLocaleString()} top-up` : ''} · Click to Top-up`}
            </span>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}
