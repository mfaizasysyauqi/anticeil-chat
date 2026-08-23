'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { GitBranch, Filter } from 'lucide-react';

import { useSettingsStore } from '../../../settings/store/useSettingsStore';

export interface LogicNodeData {
  title: string;
  condition?: string;
  isRunning?: boolean;
}

export const LogicNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as LogicNodeData;
  const isDark = useSettingsStore((s) => s.theme) === 'dark';

  return (
    <div
      style={{
        width: '230px',
        background: isDark ? '#141824' : '#FFFFFF',
        borderRadius: '14px',
        border: selected
          ? '2px solid #6366F1'
          : nodeData.isRunning
          ? '2px solid #6366F1'
          : isDark
          ? '1.5px solid rgba(99, 102, 241, 0.35)'
          : '1.5px solid #C7D2FE',
        boxShadow: selected
          ? '0 0 0 4px rgba(99, 102, 241, 0.2), 0 8px 24px rgba(0, 0, 0, 0.3)'
          : isDark
          ? '0 4px 14px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.1)'
          : '0 4px 14px rgba(99, 102, 241, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02)',
        overflow: 'visible',
        position: 'relative',
        transition: 'all 0.2s ease',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Input Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: '11px',
          height: '11px',
          background: '#6366F1',
          border: isDark ? '2px solid #141824' : '2px solid #FFFFFF',
          boxShadow: '0 0 0 2px #6366F1',
          zIndex: 10,
        }}
      />

      {/* Node Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
          borderBottom: isDark ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid #C7D2FE',
          borderRadius: '13px 13px 0 0',
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
            <GitBranch size={16} color="#6366F1" />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 800, color: isDark ? '#A5B4FC' : '#4338CA', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            LOGIKA / IF
          </span>
        </div>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: isDark ? '#A5B4FC' : '#6366F1',
            background: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.12)',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          Branch
        </span>
      </div>

      {/* Node Content */}
      <div style={{ padding: '12px 14px' }}>
        <h4 style={{ margin: '0 0 3px 0', fontSize: '13.5px', fontWeight: 700, color: isDark ? '#F1F5F9' : '#181B34' }}>
          {nodeData.title || 'Evaluasi Kondisi'}
        </h4>
        <div
          style={{
            fontSize: '11px',
            fontFamily: 'monospace',
            background: isDark ? '#0B0F19' : '#F8FAFC',
            padding: '4px 8px',
            borderRadius: '6px',
            color: isDark ? '#A5B4FC' : '#334155',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
          }}
        >
          {nodeData.condition || 'output.isVIP === true'}
        </div>
      </div>

      {/* Branch Rows Container */}
      <div
        style={{
          borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '0 0 13px 13px',
        }}
      >
        {/* TRUE Branch Row */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            background: isDark ? 'rgba(22, 163, 74, 0.1)' : '#F0FDF4',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#16A34A',
              }}
            />
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: isDark ? '#4ADE80' : '#15803D' }}>
              Benar (True)
            </span>
          </div>
          <span style={{ fontSize: '10.5px', color: isDark ? '#86EFAC' : '#16A34A', fontWeight: 600, paddingRight: '8px' }}>
            Output →
          </span>

          <Handle
            type="source"
            id="true"
            position={Position.Right}
            style={{
              top: '50%',
              transform: 'translateY(-50%)',
              width: '11px',
              height: '11px',
              background: '#16A34A',
              border: isDark ? '2px solid #141824' : '2px solid #FFFFFF',
              boxShadow: '0 0 0 2px #16A34A',
              right: '-6px',
              zIndex: 10,
            }}
          />
        </div>

        {/* FALSE Branch Row */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            background: isDark ? 'rgba(220, 38, 38, 0.1)' : '#FEF2F2',
            borderRadius: '0 0 13px 13px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#DC2626',
              }}
            />
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: isDark ? '#F87171' : '#B91C1C' }}>
              Salah (False)
            </span>
          </div>
          <span style={{ fontSize: '10.5px', color: isDark ? '#FCA5A5' : '#DC2626', fontWeight: 600, paddingRight: '8px' }}>
            Output →
          </span>

          <Handle
            type="source"
            id="false"
            position={Position.Right}
            style={{
              top: '50%',
              transform: 'translateY(-50%)',
              width: '11px',
              height: '11px',
              background: '#DC2626',
              border: isDark ? '2px solid #141824' : '2px solid #FFFFFF',
              boxShadow: '0 0 0 2px #DC2626',
              right: '-6px',
              zIndex: 10,
            }}
          />
        </div>
      </div>
    </div>
  );
});

LogicNode.displayName = 'LogicNode';
