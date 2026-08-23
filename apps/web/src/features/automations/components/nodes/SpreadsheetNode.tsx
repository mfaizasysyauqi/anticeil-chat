'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Sheet } from 'lucide-react';
import { useSettingsStore } from '../../../settings/store/useSettingsStore';

export interface SpreadsheetNodeData {
  title: string;
  service: 'google-sheets' | 'excel' | 'csv' | 'airtable' | 'notion';
  operation: 'read' | 'append' | 'update' | 'clear';
  sheetName?: string;
  isRunning?: boolean;
}

const SVC: Record<string, { color: string }> = {
  'google-sheets': { color: '#34A853' },
  excel: { color: '#217346' },
  csv: { color: '#6B7280' },
  airtable: { color: '#18BFFF' },
  notion: { color: '#000000' },
};

export const SpreadsheetNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as SpreadsheetNodeData;
  const isDark = useSettingsStore((s) => s.theme) === 'dark';
  const svc = SVC[nodeData.service] || SVC['google-sheets'];

  return (
    <div style={{ width: '260px', background: isDark ? '#141824' : '#FFFFFF', borderRadius: '14px', border: selected ? '2px solid #0073EA' : isDark ? '1.5px solid rgba(255,255,255,0.12)' : '1.5px solid #E2E8F0', boxShadow: selected ? '0 0 0 4px rgba(0,115,234,0.2), 0 8px 24px rgba(0,0,0,0.3)' : '0 4px 14px rgba(0,0,0,0.06)', overflow: 'hidden', transition: 'all 0.2s ease', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <Handle type="target" position={Position.Left} style={{ width: '10px', height: '10px', background: '#0073EA', border: isDark ? '2px solid #141824' : '2px solid #FFFFFF', boxShadow: '0 0 0 2px #0073EA' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: isDark ? 'rgba(52,168,83,0.1)' : '#F0FDF4', borderBottom: isDark ? '1px solid rgba(52,168,83,0.2)' : '1px solid #BBF7D0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sheet size={14} color={svc.color} />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 800, color: isDark ? '#4ADE80' : '#15803D', textTransform: 'uppercase' }}>SPREADSHEET</span>
        </div>
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#FFF', background: svc.color, padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase' }}>{(nodeData.service || 'google-sheets').replace('-', ' ')}</span>
      </div>

      <div style={{ padding: '12px 14px' }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 700, color: isDark ? '#F1F5F9' : '#1E293B' }}>{nodeData.title || 'Spreadsheet'}</h4>
        <div style={{ display: 'flex', gap: '6px' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 600, fontFamily: 'monospace', color: isDark ? '#4ADE80' : '#059669', background: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5', padding: '2px 6px', borderRadius: '4px' }}>
            {(nodeData.operation || 'read').toUpperCase()}
          </span>
          {nodeData.sheetName && <span style={{ fontSize: '10.5px', color: isDark ? '#94A3B8' : '#64748B' }}>{nodeData.sheetName}</span>}
        </div>
      </div>

      <Handle type="source" position={Position.Right} style={{ width: '10px', height: '10px', background: '#0073EA', border: isDark ? '2px solid #141824' : '2px solid #FFFFFF', boxShadow: '0 0 0 2px #0073EA' }} />
    </div>
  );
});

SpreadsheetNode.displayName = 'SpreadsheetNode';
