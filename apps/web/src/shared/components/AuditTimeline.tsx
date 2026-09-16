import React from 'react';
import { Clock, Pencil, Trash2, RotateCcw, Sparkles } from 'lucide-react';
import {
  Timeline,
  TimelineItem,
  TimelineDot,
  TimelineLine,
  TimelineContent,
  TimelineHeading,
} from '@/components/ui/timeline';

export interface AuditEntry {
  time: number;
  action: 'edit' | 'delete' | 'undo' | 'generate';
  messageId: string;
  label: string;
  detail?: string;
}

export interface AuditTimelineProps {
  entries: AuditEntry[];
  language?: 'id' | 'en';
  /** Auto-collapse when not actively streaming/editing */
  isStreaming?: boolean;
}

const ACTION_META: Record<AuditEntry['action'], { Icon: React.ElementType; color: string }> = {
  edit:     { Icon: Pencil,    color: 'var(--accent-warning)' },
  delete:   { Icon: Trash2,   color: 'var(--accent-danger)' },
  undo:     { Icon: RotateCcw, color: 'var(--brand-primary)' },
  generate: { Icon: Sparkles,  color: 'var(--accent-success)' },
};

const ACTION_LABEL: Record<AuditEntry['action'], { id: string; en: string }> = {
  edit:     { id: 'Edit prompt',  en: 'Edited prompt' },
  delete:   { id: 'Hapus',       en: 'Deleted' },
  undo:     { id: 'Undo',        en: 'Undo' },
  generate: { id: 'Generate',    en: 'Generated' },
};

export function AuditTimeline({ entries, language = 'en', isStreaming = false }: AuditTimelineProps) {
  const [collapsed, setCollapsed] = React.useState(!isStreaming);

  React.useEffect(() => {
    setCollapsed(!isStreaming);
  }, [isStreaming]);

  if (entries.length === 0) return null;

  return (
    <div style={{ width: '100%' }}>
      {/* Header with toggle */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: '4px 0',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-dim)',
          textAlign: 'left',
        }}
      >
        <Clock size={12} />
        Audit Log
        <span style={{
          marginLeft: 'auto',
          fontSize: '10px',
          fontWeight: 600,
          color: 'var(--text-muted)',
          background: 'var(--bg-subtle)',
          padding: '1px 5px',
          borderRadius: 'var(--radius-full)',
        }}>
          {entries.length}
        </span>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
      </button>

      {/* Collapsible body */}
      <div style={{
        overflow: 'hidden',
        maxHeight: collapsed ? '0px' : '400px',
        transition: 'max-height 0.25s ease',
        paddingLeft: '4px',
        marginTop: collapsed ? 0 : '4px',
      }}>
        <Timeline positions="left">
          {entries.map((e, i) => {
            const isLast = i === entries.length - 1;
            const { Icon, color } = ACTION_META[e.action];
            const label = ACTION_LABEL[e.action][language];
            const timeStr = new Date(e.time).toLocaleTimeString(
              language === 'id' ? 'id-ID' : 'en-US',
              { hour: '2-digit', minute: '2-digit', second: '2-digit' }
            );

            return (
              <TimelineItem key={e.messageId + i}>
                <TimelineHeading side="right" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  <span style={{ color, fontWeight: 600 }}>{label}</span>
                  {' '}
                  <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>· {e.detail ?? `#${e.messageId.slice(0, 4)}`}</span>
                </TimelineHeading>
                <TimelineDot
                  status="custom"
                  style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, border: `1.5px solid ${color}`, color }}
                  customIcon={<Icon size={8} style={{ strokeWidth: 2.5, flexShrink: 0 }} />}
                />
                {!isLast && <TimelineLine done />}
                <TimelineContent side="right" style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', paddingBottom: 10 }}>
                  {timeStr}
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
      </div>
    </div>
  );
}
