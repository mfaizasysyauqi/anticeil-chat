'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Database } from 'lucide-react';
import { useSettingsStore } from '../../../settings/store/useSettingsStore';

export interface DatabaseNodeData {
  title: string;
  dbType: 'postgres' | 'mysql' | 'mongodb' | 'supabase' | 'firebase' | 'redis';
  operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert';
  table?: string;
  isRunning?: boolean;
}

const DB_COLORS: Record<string, { icon: string; badge: string }> = {
  postgres: { icon: '#336791', badge: '#336791' },
  mysql: { icon: '#4479A1', badge: '#4479A1' },
  mongodb: { icon: '#47A248', badge: '#47A248' },
  supabase: { icon: '#3ECF8E', badge: '#3ECF8E' },
  firebase: { icon: '#FFCA28', badge: '#F57C00' },
  redis: { icon: '#DC382D', badge: '#DC382D' },
};

export const DatabaseNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as DatabaseNodeData;
  const isDark = useSettingsStore((s) => s.theme) === 'dark';
  const db = DB_COLORS[nodeData.dbType] || DB_COLORS.postgres;

  return (
    <div
      style={{
        width: '260px',
        background: isDark ? '#1e1e1e' : '#FFFFFF',
        borderRadius: '14px',
        border: selected ? '2px solid #0073EA' : isDark ? '1.5px solid rgba(255,255,255,0.12)' : '1.5px solid #E2E8F0',
        boxShadow: selected ? '0 0 0 4px rgba(0,115,234,0.2), 0 8px 24px rgba(0,0,0,0.3)' : '0 4px 14px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ width: '10px', height: '10px', background: '#0073EA', border: isDark ? '2px solid #1e1e1e' : '2px solid #FFFFFF', boxShadow: '0 0 0 2px #0073EA' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: isDark ? 'rgba(51,103,145,0.12)' : '#F0F9FF', borderBottom: isDark ? '1px solid rgba(51,103,145,0.25)' : '1px solid #BAE6FD' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Database size={14} color={db.icon} />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 800, color: isDark ? '#7DD3FC' : '#0369A1', textTransform: 'uppercase' }}>DATABASE</span>
        </div>
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#FFFFFF', background: db.badge, padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase' }}>
          {nodeData.dbType || 'postgres'}
        </span>
      </div>

      <div style={{ padding: '12px 14px' }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 700, color: isDark ? '#F1F5F9' : '#1E293B' }}>
          {nodeData.title || 'Database Query'}
        </h4>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 600, fontFamily: 'monospace', color: isDark ? '#FB923C' : '#EA580C', background: isDark ? 'rgba(251,146,60,0.15)' : '#FFF7ED', padding: '2px 6px', borderRadius: '4px' }}>
            {(nodeData.operation || 'SELECT').toUpperCase()}
          </span>
          {nodeData.table && (
            <span style={{ fontSize: '10.5px', fontWeight: 600, fontFamily: 'monospace', color: isDark ? '#94A3B8' : '#475569', background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>
              {nodeData.table}
            </span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Right} style={{ width: '10px', height: '10px', background: '#0073EA', border: isDark ? '2px solid #1e1e1e' : '2px solid #FFFFFF', boxShadow: '0 0 0 2px #0073EA' }} />
    </div>
  );
});

DatabaseNode.displayName = 'DatabaseNode';
