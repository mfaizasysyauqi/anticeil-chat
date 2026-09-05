'use client';

import React, { useState, useEffect } from 'react';
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

  // Credit Store
  const dailyCredits = useCreditStore((s) => s.credits) || 0;
  const maxCredits = useCreditStore((s) => s.maxDailyCredits) || MAX_DAILY_CREDITS;
  const paidCredits = useCreditStore((s) => s.paidCredits) || 0;
  const totalCredits = (dailyCredits || 0) + (paidCredits || 0);

  const language = useSettingsStore((s) => s.language);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const creditPercentage = Math.min(100, Math.max(0, (dailyCredits / maxCredits) * 100));
  const creditColor =
    totalCredits === 0
      ? 'var(--accent-danger, #ef4444)'
      : hoverCredit
      ? 'var(--rail-credit-color, #f59e0b)'
      : 'var(--text-secondary, #94a3b8)';

  // Format compact representation
  const compactCredits = formatCompactNumber(totalCredits, language);

  // Dynamic font sizing based on compact text length
  const creditFontSize =
    compactCredits.length <= 2
      ? '10.5px'
      : compactCredits.length === 3
      ? '9.5px'
      : '8.5px';

  return (
    <div
      style={{
        width: '100%',
        height: '56px',
        borderTop: '1px solid var(--border-subtle)',
        padding: 0,
        background: 'var(--bg-main)',
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
          type="button"
          onClick={onOpenTopup}
          onMouseEnter={() => setHoverCredit(true)}
          onMouseLeave={() => setHoverCredit(false)}
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

        {/* Hover Tag / Tooltip (shows full precise count) */}
        {hoverCredit && (
          <div
            style={{
              position: 'absolute',
              left: 'calc(100% + 10px)',
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
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              animation: 'fadeIn 0.12s ease-out',
              pointerEvents: 'none',
            }}
          >
            <span style={{ color: '#f59e0b' }}>⚡</span>
            <span>
              {language === 'id'
                ? `${totalCredits.toLocaleString()} Kredit AI (Klik untuk Top-up)`
                : `${totalCredits.toLocaleString()} AI Credits (Click to Top-up)`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
