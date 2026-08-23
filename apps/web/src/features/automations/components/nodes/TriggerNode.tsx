'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Clock, Play, Zap, Webhook } from 'lucide-react';

export interface TriggerNodeData {
  title: string;
  triggerType: 'cron' | 'manual' | 'webhook';
  schedule?: string;
  webhookUrl?: string;
  description?: string;
  isRunning?: boolean;
}

export const TriggerNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as TriggerNodeData;

  const getIcon = () => {
    switch (nodeData.triggerType) {
      case 'cron':
        return <Clock size={16} color="#D97706" />;
      case 'webhook':
        return <Webhook size={16} color="#D97706" />;
      default:
        return <Play size={16} color="#D97706" />;
    }
  };

  return (
    <div
      style={{
        width: '240px',
        background: '#FFFFFF',
        borderRadius: '14px',
        border: selected
          ? '2px solid #F59E0B'
          : nodeData.isRunning
          ? '2px solid #F59E0B'
          : '1.5px solid #FDE68A',
        boxShadow: selected
          ? '0 0 0 4px rgba(245, 158, 11, 0.15), 0 8px 24px rgba(0, 0, 0, 0.08)'
          : '0 4px 14px rgba(245, 158, 11, 0.08), 0 1px 3px rgba(0, 0, 0, 0.02)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Node Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)',
          borderBottom: '1px solid #FDE68A',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '7px',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            {getIcon()}
          </div>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            PEMICU / TRIGGER
          </span>
        </div>
        <span
          style={{
            fontSize: '10.5px',
            fontWeight: 700,
            color: '#D97706',
            background: 'rgba(217, 119, 6, 0.12)',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          {nodeData.triggerType}
        </span>
      </div>

      {/* Node Content */}
      <div style={{ padding: '12px 14px' }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '13.5px', fontWeight: 700, color: '#181B34' }}>
          {nodeData.title || 'Jadwal Pemicu'}
        </h4>
        <p style={{ margin: 0, fontSize: '11.5px', color: '#6B7280', lineHeight: 1.4 }}>
          {nodeData.schedule || nodeData.description || 'Eksekusi instan saat pemicu aktif'}
        </p>
      </div>

      {/* Output Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: '10px',
          height: '10px',
          background: '#F59E0B',
          border: '2px solid #FFFFFF',
          boxShadow: '0 0 0 2px #F59E0B',
        }}
      />
    </div>
  );
});

TriggerNode.displayName = 'TriggerNode';
