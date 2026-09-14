'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  Timeline as BaseTimeline,
  TimelineItem,
  TimelineDot,
  TimelineLine,
  TimelineContent,
  TimelineHeading,
} from '@/components/ui/timeline';

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

// ─── Step Item ────────────────────────────────────────────────────────────────

function StepItem({
  step,
  isLast,
  showLine,
  compact,
}: {
  step: TimelineStep;
  isLast: boolean;
  showLine: boolean;
  compact: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasDetail = Boolean(step.children);
  const isClickable = hasDetail || Boolean(step.onClick);

  const handleClick = () => {
    if (step.onClick) step.onClick();
    if (hasDetail) setExpanded((p) => !p);
  };

  const dotStatus: 'default' | 'current' | 'done' | 'error' | 'custom' = step.icon
    ? 'custom'
    : step.status === 'done'
    ? 'done'
    : step.status === 'error'
    ? 'error'
    : step.status === 'current'
    ? 'current'
    : 'default';

  return (
    <TimelineItem
      status={step.status === 'done' ? 'done' : 'default'}
      style={{ paddingBottom: isLast ? 0 : compact ? 10 : 16 }}
    >
      <TimelineDot status={dotStatus} customIcon={step.icon} />
      {showLine && !isLast && (
        <TimelineLine
          done={step.status === 'done'}
          style={{ minHeight: compact ? 12 : 18 }}
        />
      )}

      <TimelineContent style={{ paddingLeft: 4 }}>
        <button
          type="button"
          onClick={isClickable ? handleClick : undefined}
          style={{
            all: 'unset',
            cursor: isClickable ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            width: '100%',
          }}
        >
          <TimelineHeading
            style={{
              fontSize: compact ? '11.5px' : '12.5px',
              fontWeight: step.status === 'current' ? 600 : 500,
              color:
                step.status === 'current'
                  ? 'var(--brand-primary, #6366F1)'
                  : step.status === 'done'
                  ? 'var(--text-primary)'
                  : 'var(--text-secondary)',
            }}
          >
            {step.title}
          </TimelineHeading>

          {hasDetail && (
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </span>
          )}
        </button>

        {step.description && (
          <p
            style={{
              fontSize: compact ? '10.5px' : '11.5px',
              color: 'var(--text-muted)',
              margin: '2px 0 0 0',
              lineHeight: 1.5,
            }}
          >
            {step.description}
          </p>
        )}

        {hasDetail && expanded && (
          <div
            style={{
              marginTop: 6,
              padding: compact ? '6px 8px' : '8px 10px',
              borderRadius: '8px',
              background: 'var(--bg-subtle, rgba(255,255,255,0.025))',
              border: '1px solid var(--border-subtle)',
              fontSize: compact ? '11px' : '12px',
              color: 'var(--text-secondary)',
            }}
          >
            {step.children}
          </div>
        )}
      </TimelineContent>
    </TimelineItem>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

/**
 * Reusable step-based Timeline component for Anticeil.
 * Built on top of `@/components/ui/timeline` primitives.
 */
export function Timeline({
  steps,
  direction = 'vertical',
  showLine = true,
  compact = false,
  style,
}: TimelineProps) {
  if (!steps.length) return null;

  if (direction === 'horizontal') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          width: '100%',
          gap: 8,
          ...style,
        }}
      >
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          const dotStatus = step.icon
            ? 'custom'
            : step.status === 'done'
            ? 'done'
            : step.status === 'error'
            ? 'error'
            : step.status === 'current'
            ? 'current'
            : 'default';

          return (
            <div
              key={step.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                {showLine && (
                  <div
                    style={{
                      flex: 1,
                      height: '1.5px',
                      background:
                        step.status === 'done'
                          ? 'var(--text-primary)'
                          : 'var(--border-subtle, rgba(255,255,255,0.15))',
                    }}
                  />
                )}
                <TimelineDot status={dotStatus} customIcon={step.icon} />
                {showLine && !isLast && (
                  <div
                    style={{
                      flex: 1,
                      height: '1.5px',
                      background:
                        step.status === 'done'
                          ? 'var(--text-primary)'
                          : 'var(--border-subtle, rgba(255,255,255,0.15))',
                    }}
                  />
                )}
                {isLast && <div style={{ flex: 1 }} />}
              </div>
              <div style={{ marginTop: 6, textAlign: 'center', paddingInline: 4 }}>
                <span
                  style={{
                    fontSize: compact ? '10.5px' : '11.5px',
                    fontWeight: step.status === 'current' ? 600 : 400,
                    color:
                      step.status === 'current'
                        ? 'var(--brand-primary, #6366F1)'
                        : 'var(--text-secondary)',
                  }}
                >
                  {step.title}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <BaseTimeline style={style}>
      {steps.map((step, i) => (
        <StepItem
          key={step.id}
          step={step}
          isLast={i === steps.length - 1}
          showLine={showLine}
          compact={compact}
        />
      ))}
    </BaseTimeline>
  );
}

// ─── TimelineGroup ────────────────────────────────────────────────────────────

export function TimelineGroup({
  label,
  steps,
  defaultExpanded = false,
  compact = false,
  isStreaming = false,
  style,
}: TimelineGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded || isStreaming);

  useEffect(() => {
    if (isStreaming) {
      setExpanded(true);
    }
  }, [isStreaming]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        style={{
          all: 'unset',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
          width: 'fit-content',
          color: 'var(--text-secondary)',
          fontSize: compact ? '12px' : '12.5px',
          fontWeight: 600,
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        <span>{label}</span>

        {isStreaming && (
          <span
            style={{
              display: 'inline-block',
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#6366F1',
              boxShadow: '0 0 5px #6366F1',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        )}

        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {expanded && (
        <div
          style={{
            paddingLeft: 10,
            marginLeft: 7,
            borderLeft: '1px solid var(--border-subtle)',
            paddingTop: 6,
          }}
        >
          <Timeline steps={steps} compact={compact} />
        </div>
      )}
    </div>
  );
}
