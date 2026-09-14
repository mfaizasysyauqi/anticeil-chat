'use client'

import * as React from 'react'
import { Check, Circle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Context ─────────────────────────────────────────────────────────────────
// Pass positions & grid column template from Timeline → subcomponents

type Positions = 'left' | 'right' | 'center'

const GRID_COLS: Record<Positions, string> = {
  left:   '14px 1fr',
  right:  '1fr 14px',
  center: '1fr 14px 1fr',
}

const TimelineContext = React.createContext<{ positions: Positions; gridCols: string }>({
  positions: 'left',
  gridCols: GRID_COLS.left,
})

// ─── Timeline (ul) ───────────────────────────────────────────────────────────

interface TimelineProps extends React.HTMLAttributes<HTMLUListElement> {
  positions?: Positions
}

const Timeline = React.forwardRef<HTMLUListElement, TimelineProps>(
  ({ children, className, positions = 'left', style, ...props }, ref) => (
    <TimelineContext.Provider value={{ positions, gridCols: GRID_COLS[positions] }}>
      <ul
        ref={ref}
        className={cn('w-full', className)}
        style={{
          display: 'grid',
          width: '100%',
          listStyle: 'none',
          padding: 0,
          margin: 0,
          rowGap: 0,
          ...style,
        }}
        {...props}
      >
        {children}
      </ul>
    </TimelineContext.Provider>
  ),
)
Timeline.displayName = 'Timeline'

// ─── TimelineItem (li) ───────────────────────────────────────────────────────

interface TimelineItemProps extends React.HTMLAttributes<HTMLLIElement> {
  status?: 'done' | 'default'
}

const TimelineItem = React.forwardRef<HTMLLIElement, TimelineItemProps>(
  ({ className, status, style, ...props }, ref) => {
    const { gridCols } = React.useContext(TimelineContext)
    return (
      <li
        ref={ref}
        className={cn('timeline-item', className)}
        style={{
          display: 'grid',
          gridTemplateColumns: gridCols,
          gridTemplateRows: 'auto 1fr',
          alignItems: 'start',
          columnGap: 10,
          listStyle: 'none',
          padding: 0,
          margin: 0,
          ...style,
        }}
        {...props}
      />
    )
  },
)
TimelineItem.displayName = 'TimelineItem'

// ─── TimelineDot ─────────────────────────────────────────────────────────────

interface TimelineDotProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: 'default' | 'current' | 'done' | 'error' | 'custom'
  customIcon?: React.ReactNode
}

const DOT_STYLES: Record<string, React.CSSProperties> = {
  default: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1.5px solid rgba(255, 255, 255, 0.16)',
    color: 'var(--text-muted, #9CA3AF)',
  },
  current: {
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
    border: '1.5px solid var(--brand-primary, #6366F1)',
    color: 'var(--brand-primary, #818CF8)',
    boxShadow: '0 0 8px rgba(99, 102, 241, 0.35)',
  },
  done: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    border: '1.5px solid rgba(99, 102, 241, 0.45)',
    color: 'var(--brand-primary, #818CF8)',
  },
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1.5px solid rgba(239, 68, 68, 0.45)',
    color: '#F87171',
  },
  custom: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1.5px solid rgba(255, 255, 255, 0.16)',
    color: 'var(--text-secondary, #D1D5DB)',
  },
}

function DotIcon({ status }: { status: TimelineDotProps['status'] }) {
  switch (status) {
    case 'done':    return <Check    style={{ width: 8.5, height: 8.5, strokeWidth: 2.5, flexShrink: 0 }} />
    case 'error':   return <X        style={{ width: 8.5, height: 8.5, strokeWidth: 2.5, flexShrink: 0 }} />
    case 'current': return <Circle   style={{ width: 5,   height: 5,   fill: 'currentColor', flexShrink: 0 }} />
    default:        return null
  }
}

const TimelineDot = React.forwardRef<HTMLDivElement, TimelineDotProps>(
  ({ className, status = 'default', customIcon, style, ...props }, ref) => {
    const { positions } = React.useContext(TimelineContext)
    const col = positions === 'left' ? '1 / 2' : '2 / 3'
    return (
      <div
        role="status"
        ref={ref}
        className={cn('timeline-dot', className)}
        style={{
          gridColumn: col,
          gridRow: '1 / 2',
          width: 14,
          height: 14,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxSizing: 'border-box',
          marginTop: 2,
          ...DOT_STYLES[status],
          ...style,
        }}
        {...props}
      >
        {customIcon ?? <DotIcon status={status} />}
      </div>
    )
  },
)
TimelineDot.displayName = 'TimelineDot'

// ─── TimelineLine ─────────────────────────────────────────────────────────────

interface TimelineLineProps extends React.HTMLAttributes<HTMLHRElement> {
  done?: boolean
}

const TimelineLine = React.forwardRef<HTMLHRElement, TimelineLineProps>(
  ({ className, done = false, style, ...props }, ref) => {
    const { positions } = React.useContext(TimelineContext)
    const col = positions === 'left' ? '1 / 2' : '2 / 3'
    return (
      <hr
        role="separator"
        aria-orientation="vertical"
        ref={ref}
        className={cn('timeline-line', className)}
        style={{
          gridColumn: col,
          gridRow: '2 / 3',
          margin: '0 auto',
          display: 'block',
          width: 1.5,
          height: '100%',
          minHeight: 12,
          border: 'none',
          borderRadius: 9999,
          backgroundColor: done
            ? 'var(--border-strong, rgba(255, 255, 255, 0.22))'
            : 'var(--border-subtle, rgba(255, 255, 255, 0.08))',
          ...style,
        }}
        {...props}
      />
    )
  },
)
TimelineLine.displayName = 'TimelineLine'

// ─── TimelineContent ─────────────────────────────────────────────────────────

interface TimelineContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'right' | 'left'
}

const TimelineContent = React.forwardRef<HTMLDivElement, TimelineContentProps>(
  ({ className, side = 'right', style, ...props }, ref) => {
    const { positions } = React.useContext(TimelineContext)
    const col =
      positions === 'left'
        ? '2 / 3'
        : positions === 'right'
        ? '1 / 2'
        : side === 'left'
        ? '1 / 2'
        : '3 / 4'
    const align =
      positions === 'right' || (positions === 'center' && side === 'left')
        ? 'right'
        : 'left'

    return (
      <div
        ref={ref}
        className={cn('timeline-content', className)}
        style={{
          gridColumn: col,
          gridRow: '2 / 3',
          paddingBottom: 16,
          paddingTop: 4,
          fontSize: 12,
          lineHeight: 1.55,
          color: 'var(--text-muted, #8e8e8e)',
          textAlign: align,
          ...style,
        }}
        {...props}
      />
    )
  },
)
TimelineContent.displayName = 'TimelineContent'

// ─── TimelineHeading ─────────────────────────────────────────────────────────

interface TimelineHeadingProps extends React.HTMLAttributes<HTMLParagraphElement> {
  side?: 'right' | 'left'
  variant?: 'primary' | 'secondary'
}

const TimelineHeading = React.forwardRef<HTMLParagraphElement, TimelineHeadingProps>(
  ({ className, side = 'right', variant = 'primary', style, ...props }, ref) => {
    const { positions } = React.useContext(TimelineContext)
    const col =
      positions === 'left'
        ? '2 / 3'
        : positions === 'right'
        ? '1 / 2'
        : side === 'left'
        ? '1 / 2'
        : '3 / 4'
    const align =
      positions === 'right' || (positions === 'center' && side === 'left')
        ? 'right'
        : 'left'

    return (
      <p
        role="heading"
        aria-level={variant === 'primary' ? 2 : 3}
        ref={ref}
        className={cn('timeline-heading', className)}
        style={{
          gridColumn: col,
          gridRow: '1 / 2',
          margin: 0,
          paddingTop: 0,
          fontSize: variant === 'primary' ? 13 : 12,
          fontWeight: variant === 'primary' ? 600 : 400,
          color: 'var(--text-primary, #f5f5f5)',
          lineHeight: 1.4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: align,
          ...style,
        }}
        {...props}
      />
    )
  },
)
TimelineHeading.displayName = 'TimelineHeading'

// ─── Exports ──────────────────────────────────────────────────────────────────

export {
  Timeline,
  TimelineDot,
  TimelineItem,
  TimelineContent,
  TimelineHeading,
  TimelineLine,
}
