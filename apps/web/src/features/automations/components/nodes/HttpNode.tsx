'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Globe, ArrowRightLeft } from 'lucide-react';
import { useSettingsStore } from '../../../settings/store/useSettingsStore';

export interface HttpNodeData {
  title: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  authType?: 'none' | 'bearer' | 'apiKey' | 'basic';
  isRunning?: boolean;
}

export const HttpNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as HttpNodeData;
  const isDark = useSettingsStore((s) => s.theme) === 'dark';

  const getMethodColor = (m: string) => {
    switch (m) {
      case 'POST':
        return { bg: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5', text: '#059669', badge: '#10B981' };
      case 'PUT':
      case 'PATCH':
        return { bg: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7', text: '#D97706', badge: '#F59E0B' };
      case 'DELETE':
        return { bg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2', text: '#DC2626', badge: '#EF4444' };
      default:
        return { bg: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE', text: '#2563EB', badge: '#3B82F6' };
    }
  };

  const methodStyle = getMethodColor(nodeData.method || 'GET');

  return (
    <div
      style={{
        width: '260px',
        background: isDark ? '#1e1e1e' : '#FFFFFF',
        borderRadius: '14px',
        border: selected
          ? '2px solid #0073EA'
          : nodeData.isRunning
          ? '2px solid #10B981'
          : isDark
          ? '1.5px solid rgba(255, 255, 255, 0.12)'
          : '1.5px solid #E2E8F0',
        boxShadow: selected
          ? '0 0 0 4px rgba(0, 115, 234, 0.2), 0 8px 24px rgba(0, 0, 0, 0.3)'
          : '0 4px 14px rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: '10px',
          height: '10px',
          background: '#0073EA',
          border: isDark ? '2px solid #1e1e1e' : '2px solid #FFFFFF',
          boxShadow: '0 0 0 2px #0073EA',
        }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: isDark ? 'rgba(59, 130, 246, 0.1)' : '#F0F9FF',
          borderBottom: isDark ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid #BAE6FD',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Globe size={14} color="#0284C7" />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 800, color: isDark ? '#38BDF8' : '#0369A1', textTransform: 'uppercase' }}>
            HTTP REQUEST
          </span>
        </div>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 800,
            color: methodStyle.text,
            background: methodStyle.bg,
            padding: '2px 7px',
            borderRadius: '4px',
            fontFamily: 'monospace',
          }}
        >
          {nodeData.method || 'GET'}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px' }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 700, color: isDark ? '#F1F5F9' : '#1E293B' }}>
          {nodeData.title || 'Webhook / REST API'}
        </h4>
        <div
          style={{
            fontSize: '11px',
            fontFamily: 'monospace',
            color: isDark ? '#94A3B8' : '#64748B',
            background: isDark ? '#141414' : '#F8FAFC',
            padding: '4px 8px',
            borderRadius: '6px',
            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={nodeData.url}
        >
          {nodeData.url || 'https://api.example.com/endpoint'}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: '10px',
          height: '10px',
          background: '#0073EA',
          border: isDark ? '2px solid #1e1e1e' : '2px solid #FFFFFF',
          boxShadow: '0 0 0 2px #0073EA',
        }}
      />
    </div>
  );
});

HttpNode.displayName = 'HttpNode';
