'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { GitBranch, Filter } from 'lucide-react';

export interface LogicNodeData {
  title: string;
  condition?: string;
  isRunning?: boolean;
}

export const LogicNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as LogicNodeData;

  return (
    <div
      style={{
        width: '230px',
        background: '#FFFFFF',
        borderRadius: '14px',
        border: selected
          ? '2px solid #6366F1'
          : nodeData.isRunning
          ? '2px solid #6366F1'
          : '1.5px solid #C7D2FE',
        boxShadow: selected
          ? '0 0 0 4px rgba(99, 102, 241, 0.15), 0 8px 24px rgba(0, 0, 0, 0.08)'
          : '0 4px 14px rgba(99, 102, 241, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02)',
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
          background: '#6366F1',
          border: '2px solid #FFFFFF',
          boxShadow: '0 0 0 2px #6366F1',
        }}
      />

      {/* Node Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: '#EEF2FF',
          borderBottom: '1px solid #C7D2FE',
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
            <GitBranch size={16} color="#6366F1" />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#4338CA', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            LOGIKA / IF
          </span>
        </div>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: '#6366F1',
            background: 'rgba(99, 102, 241, 0.12)',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          Branch
        </span>
      </div>

      {/* Node Content */}
      <div style={{ padding: '12px 14px' }}>
        <h4 style={{ margin: '0 0 3px 0', fontSize: '13.5px', fontWeight: 700, color: '#181B34' }}>
          {nodeData.title || 'Evaluasi Kondisi'}
        </h4>
        <div
          style={{
            fontSize: '11px',
            fontFamily: 'monospace',
            background: '#F8FAFC',
            padding: '4px 8px',
            borderRadius: '6px',
            color: '#334155',
            border: '1px solid #E2E8F0',
          }}
        >
          {nodeData.condition || 'output.isVIP === true'}
        </div>
      </div>

      {/* Output Handles (Right) - Top: True (Green), Bottom: False (Red) */}
      <div
        style={{
          position: 'relative',
          padding: '4px 14px 10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10.5px',
          fontWeight: 700,
        }}
      >
        <span style={{ color: '#16A34A' }}>Benar / True →</span>
        <span style={{ color: '#DC2626' }}>Salah / False →</span>

        {/* Handle for TRUE */}
        <Handle
          type="source"
          id="true"
          position={Position.Right}
          style={{
            top: '30%',
            width: '10px',
            height: '10px',
            background: '#16A34A',
            border: '2px solid #FFFFFF',
            boxShadow: '0 0 0 2px #16A34A',
          }}
        />

        {/* Handle for FALSE */}
        <Handle
          type="source"
          id="false"
          position={Position.Right}
          style={{
            top: '70%',
            width: '10px',
            height: '10px',
            background: '#DC2626',
            border: '2px solid #FFFFFF',
            boxShadow: '0 0 0 2px #DC2626',
          }}
        />
      </div>
    </div>
  );
});

LogicNode.displayName = 'LogicNode';
