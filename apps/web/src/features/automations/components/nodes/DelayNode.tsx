'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Timer } from 'lucide-react';
import { useSettingsStore } from '../../../settings/store/useSettingsStore';

export interface DelayNodeData {
  title: string;
  delayType: 'fixed' | 'random' | 'until';
  duration?: string;
  unit?: 'seconds' | 'minutes' | 'hours' | 'days';
  isRunning?: boolean;
}

export const DelayNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as DelayNodeData;
  const isDark = useSettingsStore((s) => s.theme) === 'dark';

  return (
    <div style={{ width: '220px', background: isDark ? '#1e1e1e' : '#FFFFFF', borderRadius: '14px', border: selected ? '2px solid #0073EA' : isDark ? '1.5px solid rgba(255,255,255,0.12)' : '1.5px solid #E2E8F0', boxShadow: selected ? '0 0 0 4px rgba(0,115,234,0.2), 0 8px 24px rgba(0,0,0,0.3)' : '0 4px 14px rgba(0,0,0,0.06)', overflow: 'hidden', transition: 'all 0.2s ease', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <Handle type="target" position={Position.Left} style={{ width: '10px', height: '10px', background: '#0073EA', border: isDark ? '2px solid #1e1e1e' : '2px solid #FFFFFF', boxShadow: '0 0 0 2px #0073EA' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: isDark ? 'rgba(168,85,247,0.1)' : '#FAF5FF', borderBottom: isDark ? '1px solid rgba(168,85,247,0.2)' : '1px solid #E9D5FF' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Timer size={14} color="#A855F7" />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 800, color: isDark ? '#C084FC' : '#7E22CE', textTransform: 'uppercase' }}>DELAY</span>
        </div>
      </div>

      <div style={{ padding: '12px 14px' }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 700, color: isDark ? '#F1F5F9' : '#1E293B' }}>{nodeData.title || 'Wait'}</h4>
        <span style={{ fontSize: '11px', fontWeight: 600, color: isDark ? '#C084FC' : '#9333EA', background: isDark ? 'rgba(168,85,247,0.15)' : '#F3E8FF', padding: '2px 8px', borderRadius: '4px' }}>
          {nodeData.duration || '5'} {nodeData.unit || 'minutes'}
        </span>
      </div>

      <Handle type="source" position={Position.Right} style={{ width: '10px', height: '10px', background: '#0073EA', border: isDark ? '2px solid #1e1e1e' : '2px solid #FFFFFF', boxShadow: '0 0 0 2px #0073EA' }} />
    </div>
  );
});

DelayNode.displayName = 'DelayNode';
