'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { HardDrive } from 'lucide-react';
import { useSettingsStore } from '../../../settings/store/useSettingsStore';

export interface StorageNodeData {
  title: string;
  provider: 's3' | 'r2' | 'gcs' | 'supabase-storage' | 'uploadthing';
  operation: 'upload' | 'download' | 'delete' | 'list';
  bucket?: string;
  isRunning?: boolean;
}

const P_COLORS: Record<string, string> = {
  s3: '#FF9900', r2: '#F38020', gcs: '#4285F4', 'supabase-storage': '#3ECF8E', uploadthing: '#EF4444',
};

export const StorageNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as StorageNodeData;
  const isDark = useSettingsStore((s) => s.theme) === 'dark';
  const color = P_COLORS[nodeData.provider] || '#FF9900';

  return (
    <div style={{ width: '260px', background: isDark ? '#1e1e1e' : '#FFFFFF', borderRadius: '14px', border: selected ? '2px solid #0073EA' : isDark ? '1.5px solid rgba(255,255,255,0.12)' : '1.5px solid #E2E8F0', boxShadow: selected ? '0 0 0 4px rgba(0,115,234,0.2), 0 8px 24px rgba(0,0,0,0.3)' : '0 4px 14px rgba(0,0,0,0.06)', overflow: 'hidden', transition: 'all 0.2s ease', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <Handle type="target" position={Position.Left} style={{ width: '10px', height: '10px', background: '#0073EA', border: isDark ? '2px solid #1e1e1e' : '2px solid #FFFFFF', boxShadow: '0 0 0 2px #0073EA' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: isDark ? 'rgba(255,153,0,0.1)' : '#FFFBEB', borderBottom: isDark ? '1px solid rgba(255,153,0,0.2)' : '1px solid #FDE68A' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HardDrive size={14} color={color} />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 800, color: isDark ? '#FCD34D' : '#92400E', textTransform: 'uppercase' }}>STORAGE</span>
        </div>
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#FFF', background: color, padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase' }}>{(nodeData.provider || 's3').toUpperCase()}</span>
      </div>

      <div style={{ padding: '12px 14px' }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 700, color: isDark ? '#F1F5F9' : '#1E293B' }}>{nodeData.title || 'Cloud Storage'}</h4>
        <div style={{ display: 'flex', gap: '6px' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 600, fontFamily: 'monospace', color: isDark ? '#FBBF24' : '#D97706', background: isDark ? 'rgba(251,191,36,0.15)' : '#FEF3C7', padding: '2px 6px', borderRadius: '4px' }}>
            {(nodeData.operation || 'upload').toUpperCase()}
          </span>
          {nodeData.bucket && <span style={{ fontSize: '10.5px', fontFamily: 'monospace', color: isDark ? '#94A3B8' : '#64748B' }}>{nodeData.bucket}</span>}
        </div>
      </div>

      <Handle type="source" position={Position.Right} style={{ width: '10px', height: '10px', background: '#0073EA', border: isDark ? '2px solid #1e1e1e' : '2px solid #FFFFFF', boxShadow: '0 0 0 2px #0073EA' }} />
    </div>
  );
});

StorageNode.displayName = 'StorageNode';
