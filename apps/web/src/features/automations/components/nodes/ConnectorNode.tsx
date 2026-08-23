'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Mail, Calendar, FolderOpen, Search, Send, Database } from 'lucide-react';

import { useSettingsStore } from '../../../settings/store/useSettingsStore';

export interface ConnectorNodeData {
  title: string;
  connectorType: 'gmail' | 'calendar' | 'drive' | 'tavily' | 'telegram';
  actionType: string;
  target?: string;
  isRunning?: boolean;
}

export const ConnectorNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as ConnectorNodeData;
  const isDark = useSettingsStore((s) => s.theme) === 'dark';

  const getConnectorMeta = () => {
    switch (nodeData.connectorType) {
      case 'gmail':
        return {
          icon: <Mail size={16} color="#EA4335" />,
          name: 'GMAIL',
          color: '#EA4335',
          bg: isDark ? 'rgba(234, 67, 53, 0.15)' : '#FEF2F2',
          border: isDark ? 'rgba(234, 67, 53, 0.35)' : '#FECACA',
        };
      case 'calendar':
        return {
          icon: <Calendar size={16} color="#1A73E8" />,
          name: 'CALENDAR',
          color: '#1A73E8',
          bg: isDark ? 'rgba(26, 115, 232, 0.15)' : '#EFF6FF',
          border: isDark ? 'rgba(26, 115, 232, 0.35)' : '#BFDBFE',
        };
      case 'drive':
        return {
          icon: <FolderOpen size={16} color="#0F9D58" />,
          name: 'DRIVE',
          color: '#0F9D58',
          bg: isDark ? 'rgba(15, 157, 88, 0.15)' : '#F0FDF4',
          border: isDark ? 'rgba(15, 157, 88, 0.35)' : '#BBF7D0',
        };
      case 'tavily':
        return {
          icon: <Search size={16} color="#7C3AED" />,
          name: 'SEARCH',
          color: '#7C3AED',
          bg: isDark ? 'rgba(124, 58, 237, 0.15)' : '#F5F3FF',
          border: isDark ? 'rgba(124, 58, 237, 0.35)' : '#DDD6FE',
        };
      case 'telegram':
        return {
          icon: <Send size={16} color="#0088CC" />,
          name: 'TELEGRAM',
          color: '#0088CC',
          bg: isDark ? 'rgba(0, 136, 204, 0.15)' : '#F0F9FF',
          border: isDark ? 'rgba(0, 136, 204, 0.35)' : '#BAE6FD',
        };
      default:
        return {
          icon: <Database size={16} color="#0073EA" />,
          name: 'CONNECTOR',
          color: '#0073EA',
          bg: isDark ? 'rgba(0, 115, 234, 0.15)' : '#F0F7FF',
          border: isDark ? 'rgba(0, 115, 234, 0.35)' : '#C2E0FF',
        };
    }
  };

  const meta = getConnectorMeta();

  return (
    <div
      style={{
        width: '240px',
        background: isDark ? '#141824' : '#FFFFFF',
        borderRadius: '14px',
        border: selected
          ? `2px solid ${meta.color}`
          : nodeData.isRunning
          ? `2px solid ${meta.color}`
          : `1.5px solid ${meta.border}`,
        boxShadow: selected
          ? `0 0 0 4px ${meta.color}35, 0 8px 24px rgba(0, 0, 0, 0.3)`
          : isDark
          ? '0 4px 14px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.1)'
          : '0 4px 14px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Input Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: '10px',
          height: '10px',
          background: meta.color,
          border: isDark ? '2px solid #141824' : '2px solid #FFFFFF',
          boxShadow: `0 0 0 2px ${meta.color}`,
        }}
      />

      {/* Node Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: meta.bg,
          borderBottom: `1px solid ${meta.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '7px',
              background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            {meta.icon}
          </div>
          <span style={{ fontSize: '12px', fontWeight: 800, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {meta.name}
          </span>
        </div>
        <span
          style={{
            fontSize: '10.5px',
            fontWeight: 700,
            color: meta.color,
            background: isDark ? `${meta.color}25` : `${meta.color}15`,
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          Tool
        </span>
      </div>

      {/* Node Content */}
      <div style={{ padding: '12px 14px' }}>
        <h4 style={{ margin: '0 0 3px 0', fontSize: '13.5px', fontWeight: 700, color: isDark ? '#F1F5F9' : '#181B34' }}>
          {nodeData.title || 'Aksi Konektor'}
        </h4>
        <p style={{ margin: 0, fontSize: '11.5px', color: isDark ? '#94A3B8' : '#6B7280', lineHeight: 1.4 }}>
          {nodeData.actionType || 'Eksekusi operasi tool secara aman'}
        </p>
      </div>

      {/* Output Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: '10px',
          height: '10px',
          background: meta.color,
          border: isDark ? '2px solid #141824' : '2px solid #FFFFFF',
          boxShadow: `0 0 0 2px ${meta.color}`,
        }}
      />
    </div>
  );
});

ConnectorNode.displayName = 'ConnectorNode';
