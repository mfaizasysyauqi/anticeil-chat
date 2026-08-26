'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ArrowRightLeft } from 'lucide-react';
import { useSettingsStore } from '../../../settings/store/useSettingsStore';

export interface TransformNodeData {
  title: string;
  operation: 'map' | 'filter' | 'reduce' | 'merge' | 'split' | 'flatten' | 'sort' | 'aggregate';
  expression?: string;
  isRunning?: boolean;
}

const OP_COLORS: Record<string, string> = {
  map: '#0EA5E9', filter: '#F59E0B', reduce: '#8B5CF6', merge: '#10B981',
  split: '#EF4444', flatten: '#6366F1', sort: '#EC4899', aggregate: '#14B8A6',
};

export const TransformNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as TransformNodeData;
  const isDark = useSettingsStore((s) => s.theme) === 'dark';
  const opColor = OP_COLORS[nodeData.operation] || '#0EA5E9';

  return (
    <div style={{ width: '260px', background: isDark ? '#1e1e1e' : '#FFFFFF', borderRadius: '14px', border: selected ? '2px solid #0073EA' : isDark ? '1.5px solid rgba(255,255,255,0.12)' : '1.5px solid #E2E8F0', boxShadow: selected ? '0 0 0 4px rgba(0,115,234,0.2), 0 8px 24px rgba(0,0,0,0.3)' : '0 4px 14px rgba(0,0,0,0.06)', overflow: 'hidden', transition: 'all 0.2s ease', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <Handle type="target" position={Position.Left} style={{ width: '10px', height: '10px', background: '#0073EA', border: isDark ? '2px solid #1e1e1e' : '2px solid #FFFFFF', boxShadow: '0 0 0 2px #0073EA' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: isDark ? 'rgba(14,165,233,0.1)' : '#F0F9FF', borderBottom: isDark ? '1px solid rgba(14,165,233,0.2)' : '1px solid #BAE6FD' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowRightLeft size={14} color="#0EA5E9" />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 800, color: isDark ? '#38BDF8' : '#0369A1', textTransform: 'uppercase' }}>TRANSFORM</span>
        </div>
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#FFF', background: opColor, padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase' }}>{nodeData.operation || 'map'}</span>
      </div>

      <div style={{ padding: '12px 14px' }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 700, color: isDark ? '#F1F5F9' : '#1E293B' }}>{nodeData.title || 'Data Transform'}</h4>
        {nodeData.expression && (
          <pre style={{ margin: 0, fontSize: '10.5px', fontFamily: "'JetBrains Mono', monospace", color: isDark ? '#94A3B8' : '#64748B', background: isDark ? '#141414' : '#F8FAFC', padding: '4px 8px', borderRadius: '6px', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'pre', maxHeight: '36px' }}>
            {nodeData.expression}
          </pre>
        )}
      </div>

      <Handle type="source" position={Position.Right} style={{ width: '10px', height: '10px', background: '#0073EA', border: isDark ? '2px solid #1e1e1e' : '2px solid #FFFFFF', boxShadow: '0 0 0 2px #0073EA' }} />
    </div>
  );
});

TransformNode.displayName = 'TransformNode';
