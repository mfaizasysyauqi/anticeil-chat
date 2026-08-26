'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Mail } from 'lucide-react';
import { useSettingsStore } from '../../../settings/store/useSettingsStore';

export interface EmailNodeData {
  title: string;
  service: 'gmail' | 'sendgrid' | 'resend' | 'smtp' | 'mailgun';
  to?: string;
  subject?: string;
  isRunning?: boolean;
}

const SVC_COLORS: Record<string, string> = {
  gmail: '#EA4335', sendgrid: '#1A82E2', resend: '#000000', smtp: '#6B7280', mailgun: '#F06B54',
};

export const EmailNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as EmailNodeData;
  const isDark = useSettingsStore((s) => s.theme) === 'dark';
  const color = SVC_COLORS[nodeData.service] || '#EA4335';

  return (
    <div style={{ width: '260px', background: isDark ? '#1e1e1e' : '#FFFFFF', borderRadius: '14px', border: selected ? '2px solid #0073EA' : isDark ? '1.5px solid rgba(255,255,255,0.12)' : '1.5px solid #E2E8F0', boxShadow: selected ? '0 0 0 4px rgba(0,115,234,0.2), 0 8px 24px rgba(0,0,0,0.3)' : '0 4px 14px rgba(0,0,0,0.06)', overflow: 'hidden', transition: 'all 0.2s ease', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <Handle type="target" position={Position.Left} style={{ width: '10px', height: '10px', background: '#0073EA', border: isDark ? '2px solid #1e1e1e' : '2px solid #FFFFFF', boxShadow: '0 0 0 2px #0073EA' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: isDark ? 'rgba(234,67,53,0.1)' : '#FEF2F2', borderBottom: isDark ? '1px solid rgba(234,67,53,0.2)' : '1px solid #FECACA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mail size={14} color={color} />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 800, color: isDark ? '#FCA5A5' : '#B91C1C', textTransform: 'uppercase' }}>EMAIL</span>
        </div>
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#FFF', background: color, padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase' }}>{nodeData.service || 'gmail'}</span>
      </div>

      <div style={{ padding: '12px 14px' }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 700, color: isDark ? '#F1F5F9' : '#1E293B' }}>{nodeData.title || 'Send Email'}</h4>
        {nodeData.to && <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: isDark ? '#94A3B8' : '#64748B' }}>To: {nodeData.to}</p>}
        {nodeData.subject && <p style={{ margin: 0, fontSize: '11px', color: isDark ? '#94A3B8' : '#64748B', fontStyle: 'italic' }}>"{nodeData.subject}"</p>}
      </div>

      <Handle type="source" position={Position.Right} style={{ width: '10px', height: '10px', background: '#0073EA', border: isDark ? '2px solid #1e1e1e' : '2px solid #FFFFFF', boxShadow: '0 0 0 2px #0073EA' }} />
    </div>
  );
});

EmailNode.displayName = 'EmailNode';
