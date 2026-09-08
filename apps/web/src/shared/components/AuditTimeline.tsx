import React from 'react';
import { Clock, Pencil, Trash2, RotateCcw, Sparkles } from 'lucide-react';

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
        {language === 'id' ? 'Audit Log' : 'Audit Log'}
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
        borderLeft: '1.5px solid var(--border-subtle)',
        paddingLeft: '14px',
        marginLeft: '4px',
      }}>
        {entries.map((e, i) => {
          const Icon = e.action === 'edit' ? Pencil : e.action === 'delete' ? Trash2 : e.action === 'undo' ? RotateCcw : Sparkles;
          const color = e.action === 'edit' ? 'var(--accent-warning)' : e.action === 'delete' ? 'var(--accent-danger)' : e.action === 'undo' ? 'var(--brand-primary)' : 'var(--accent-success)';
          const label = language === 'id'
            ? (e.action === 'edit' ? 'Edit prompt' : e.action === 'delete' ? 'Hapus' : e.action === 'undo' ? 'Undo' : 'Generate')
            : (e.action === 'edit' ? 'Edited prompt' : e.action === 'delete' ? 'Deleted' : e.action === 'undo' ? 'Undo' : 'Generated');

          return (
            <div key={i} style={{
              display: 'flex',
              gap: '8px',
              padding: '6px 0',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                left: '-18px',
                top: '10px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: color,
                border: '2px solid var(--bg-surface, #fff)',
                zIndex: 2,
              }} />
              <div style={{ flexShrink: 0, width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={12} color={color} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  <span style={{ color, fontWeight: 600 }}>{label}</span>{' '}
                  <span style={{ color: 'var(--text-dim)' }}>· {e.detail ?? `#${e.messageId.slice(0, 4)}`}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
                  {new Date(e.time).toLocaleTimeString(language === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
