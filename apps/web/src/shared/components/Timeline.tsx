'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Loader2,
  Circle,
} from 'lucide-react';

// ─── Inject spin keyframe once ────────────────────────────────────────────────
const SPIN_STYLE_ID = 'anticeil-timeline-spin';
if (typeof document !== 'undefined' && !document.getElementById(SPIN_STYLE_ID)) {
  const styleEl = document.createElement('style');
  styleEl.id = SPIN_STYLE_ID;
  styleEl.textContent = `
    @keyframes anticeil-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes anticeil-pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .anticeil-timeline-spin { animation: anticeil-spin 1s linear infinite; }
    .anticeil-timeline-pulse { animation: anticeil-pulse-dot 1.5s ease-in-out infinite; }
  `;
  document.head.appendChild(styleEl);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type TimelineStatus = 'pending' | 'current' | 'done' | 'error';

export interface TimelineStep {
  id: string;
  /** Main label shown next to the dot */
  title: string;
  /** Optional subtitle below the title */
  description?: string;
  status?: TimelineStatus;
  /** Override the dot icon */
  icon?: React.ReactNode;
  /** Expandable detail — renders a collapsible panel */
  children?: React.ReactNode;
  /** Makes the whole row clickable */
  onClick?: () => void;
}

export interface TimelineProps {
  steps: TimelineStep[];
  /** vertical (default) stacks rows; horizontal lays them in a row */
  direction?: 'vertical' | 'horizontal';
  showLine?: boolean;
  /** Tighter spacing — good for inline AI thinking panels */
  compact?: boolean;
  style?: React.CSSProperties;
}

export interface TimelineGroupProps {
  /** Header text, e.g. "Worked for 12s" */
  label: string;
  steps: TimelineStep[];
  defaultExpanded?: boolean;
  compact?: boolean;
  /** Streaming indicator pulse on the label */
  isStreaming?: boolean;
  style?: React.CSSProperties;
}

// ─── Status config ────────────────────────────────────────────────────────────

function useStatusConfig(status: TimelineStatus = 'pending') {
  switch (status) {
    case 'done':
      return {
        ringBg:     'rgba(16, 185, 129, 0.14)',
        ringBorder: 'rgba(16, 185, 129, 0.45)',
        color:      '#10B981',
        dot:        <Check size={9} strokeWidth={2.5} />,
        lineColor:  'rgba(16, 185, 129, 0.28)',
      };
    case 'error':
      return {
        ringBg:     'rgba(239, 68, 68, 0.14)',
        ringBorder: 'rgba(239, 68, 68, 0.45)',
        color:      '#EF4444',
        dot:        <X size={9} strokeWidth={2.5} />,
        lineColor:  'rgba(239, 68, 68, 0.28)',
      };
    case 'current':
      return {
        ringBg:     'rgba(99, 102, 241, 0.14)',
        ringBorder: 'rgba(99, 102, 241, 0.5)',
        color:      '#6366F1',
        dot:        <Loader2 size={9} className="anticeil-timeline-spin" />,
        lineColor:  'rgba(99, 102, 241, 0.28)',
      };
    default:
      return {
        ringBg:     'rgba(255, 255, 255, 0.04)',
        ringBorder: 'rgba(255, 255, 255, 0.14)',
        color:      'var(--text-muted)',
        dot:        <Circle size={7} strokeWidth={2} />,
        lineColor:  'rgba(255, 255, 255, 0.08)',
      };
  }
}

// ─── TimelineStepItem ─────────────────────────────────────────────────────────

interface StepItemProps {
  step: TimelineStep;
  isLast: boolean;
  showLine: boolean;
  compact: boolean;
  direction: 'vertical' | 'horizontal';
}

function TimelineStepItem({ step, isLast, showLine, compact, direction }: StepItemProps) {
  const [expanded, setExpanded] = useState(false);
  const hasDetail = !!step.children;
  const isClickable = hasDetail || !!step.onClick;

  const cfg = useStatusConfig(step.status);
  const isVertical = direction === 'vertical';

  const gap = compact ? '10px' : '14px';
  const dotSize = compact ? '15px' : '18px';
  const fontSize = compact ? '12px' : '13px';
  const descSize = compact ? '11px' : '11.5px';
  const connectorMin = compact ? '8px' : '12px';

  const handleClick = () => {
    if (step.onClick) step.onClick();
    else if (hasDetail) setExpanded((p) => !p);
  };

  /* ---------- vertical layout ---------- */
  if (isVertical) {
    return (
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', position: 'relative' }}>
        {/* Left column: dot + vertical line */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: dotSize, flexShrink: 0, marginTop: compact ? '5px' : '7px' }}>
          {/* Dot */}
          <div
            onClick={isClickable ? handleClick : undefined}
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: '50%',
              background: cfg.ringBg,
              border: `1.5px solid ${cfg.ringBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: cfg.color,
              cursor: isClickable ? 'pointer' : 'default',
              flexShrink: 0,
              transition: 'border-color 0.2s, background 0.2s',
            }}
          >
            {step.icon ?? cfg.dot}
          </div>

          {/* Vertical connector line */}
          {showLine && !isLast && (
            <div style={{
              width: '1.5px',
              flex: 1,
              minHeight: connectorMin,
              background: cfg.lineColor,
              marginTop: '3px',
              borderRadius: '99px',
              transition: 'background 0.3s',
            }} />
          )}
        </div>

        {/* Right column: content */}
        <div style={{
          flex: 1,
          paddingLeft: '10px',
          paddingBottom: isLast ? 0 : gap,
          minWidth: 0,
        }}>
          {/* Title row */}
          <button
            type="button"
            onClick={isClickable ? handleClick : undefined}
            disabled={!isClickable}
            style={{
              all: 'unset',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: isClickable ? 'pointer' : 'default',
              width: '100%',
            }}
          >
            <span style={{
              fontSize,
              fontWeight: step.status === 'current' ? 600 : 500,
              color: step.status === 'current' ? cfg.color : step.status === 'done' ? 'var(--text-primary)' : 'var(--text-secondary)',
              lineHeight: 1.45,
              transition: 'color 0.15s',
            }}>
              {step.title}
            </span>

            {hasDetail && (
              <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </span>
            )}
          </button>

          {/* Description */}
          {step.description && (
            <p style={{ fontSize: descSize, color: 'var(--text-muted)', margin: '2px 0 0 0', lineHeight: 1.5 }}>
              {step.description}
            </p>
          )}

          {/* Expandable detail panel */}
          {hasDetail && expanded && (
            <div style={{
              marginTop: '8px',
              padding: compact ? '7px 9px' : '9px 12px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid var(--border-subtle)',
              fontSize: descSize,
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
            }}>
              {step.children}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ---------- horizontal layout ---------- */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
      {/* Top row: line — dot — line */}
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        {/* Left connector */}
        {showLine && (
          <div style={{ flex: 1, height: '1.5px', background: cfg.lineColor, borderRadius: '99px' }} />
        )}

        {/* Dot */}
        <div
          onClick={isClickable ? handleClick : undefined}
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            background: cfg.ringBg,
            border: `1.5px solid ${cfg.ringBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: cfg.color,
            cursor: isClickable ? 'pointer' : 'default',
            flexShrink: 0,
          }}
        >
          {step.icon ?? cfg.dot}
        </div>

        {/* Right connector — hidden for last item */}
        {showLine && !isLast && (
          <div style={{ flex: 1, height: '1.5px', background: cfg.lineColor, borderRadius: '99px' }} />
        )}
        {isLast && <div style={{ flex: 1 }} />}
      </div>

      {/* Label below dot */}
      <div style={{ marginTop: '8px', textAlign: 'center', paddingInline: '4px' }}>
        <span style={{ fontSize: descSize, fontWeight: step.status === 'current' ? 600 : 400, color: step.status === 'current' ? cfg.color : 'var(--text-secondary)' }}>
          {step.title}
        </span>
      </div>
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

/**
 * Reusable Timeline component for Anticeil — ChatPage, DocsPage, AI Co-Author.
 * 100% inline styles, CSS variables, no Tailwind.
 *
 * @example
 * ```tsx
 * <Timeline
 *   steps={[
 *     { id: '1', title: 'Planning',  status: 'done' },
 *     { id: '2', title: 'Executing', status: 'current' },
 *     { id: '3', title: 'Testing',   status: 'pending' },
 *   ]}
 *   compact
 * />
 * ```
 */
export function Timeline({ steps, direction = 'vertical', showLine = true, compact = false, style }: TimelineProps) {
  if (!steps.length) return null;
  return (
    <div style={{
      display: 'flex',
      flexDirection: direction === 'vertical' ? 'column' : 'row',
      alignItems: direction === 'horizontal' ? 'flex-start' : 'stretch',
      width: '100%',
      ...style,
    }}>
      {steps.map((step, i) => (
        <TimelineStepItem
          key={step.id}
          step={step}
          isLast={i === steps.length - 1}
          showLine={showLine}
          compact={compact}
          direction={direction}
        />
      ))}
    </div>
  );
}

// ─── TimelineGroup ────────────────────────────────────────────────────────────

/**
 * Collapsible Timeline group — mirrors the "Worked for Xs ▶" accordion in
 * Claude and in Anticeil's existing AgentStepTimeline.
 *
 * @example
 * ```tsx
 * <TimelineGroup label="Worked for 8s" steps={steps} defaultExpanded isStreaming />
 * ```
 */
export function TimelineGroup({
  label,
  steps,
  defaultExpanded = false,
  compact = false,
  isStreaming = false,
  style,
}: TimelineGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Auto-expand while streaming, but stay expanded when done (don't auto-collapse)
  useEffect(() => {
    if (isStreaming) {
      setExpanded(true);
    }
  }, [isStreaming]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', ...style }}>
      {/* Accordion trigger */}
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        style={{
          all: 'unset',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          width: 'fit-content',
          color: 'var(--text-secondary)',
          fontSize: compact ? '12px' : '12.5px',
          fontWeight: 600,
          lineHeight: 1,
          transition: 'color 0.15s',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        <span>{label}</span>

        {/* Streaming pulse dot */}
        {isStreaming && (
          <span className="anticeil-timeline-pulse" style={{
            display: 'inline-block',
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: '#6366F1',
            boxShadow: '0 0 5px #6366F1',
          }} />
        )}

        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* Step list */}
      {expanded && (
        <div style={{
          paddingLeft: '10px',
          marginLeft: '7px',
          borderLeft: '1px solid var(--border-subtle)',
          paddingTop: '6px',
        }}>
          <Timeline steps={steps} compact={compact} />
        </div>
      )}
    </div>
  );
}
