'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Sparkles, Brain, Cpu } from 'lucide-react';

import { useSettingsStore } from '../../../settings/store/useSettingsStore';

export interface AIAgentNodeData {
  title: string;
  provider: 'openai' | 'anthropic' | 'google' | 'deepseek' | 'groq' | 'ollama';
  model: string;
  promptSnippet?: string;
  temperature?: number;
  isRunning?: boolean;
}

export const AIAgentNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as AIAgentNodeData;
  const isDark = useSettingsStore((s) => s.theme) === 'dark';

  const getProviderColor = () => {
    switch (nodeData.provider) {
      case 'anthropic':
        return {
          bg: isDark ? 'rgba(124, 58, 237, 0.15)' : '#F5F3FF',
          border: isDark ? 'rgba(124, 58, 237, 0.35)' : '#DDD6FE',
          text: isDark ? '#C084FC' : '#6D28D9',
          badge: '#7C3AED',
        };
      case 'deepseek':
        return {
          bg: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF',
          border: isDark ? 'rgba(37, 99, 235, 0.35)' : '#BFDBFE',
          text: isDark ? '#60A5FA' : '#1D4ED8',
          badge: '#2563EB',
        };
      case 'groq':
        return {
          bg: isDark ? 'rgba(234, 88, 12, 0.15)' : '#FFF7ED',
          border: isDark ? 'rgba(234, 88, 12, 0.35)' : '#FED7AA',
          text: isDark ? '#FB923C' : '#C2410C',
          badge: '#EA580C',
        };
      default:
        return {
          bg: isDark ? 'rgba(22, 163, 74, 0.15)' : '#F0FDF4',
          border: isDark ? 'rgba(22, 163, 74, 0.35)' : '#BBF7D0',
          text: isDark ? '#4ADE80' : '#15803D',
          badge: '#16A34A',
        };
    }
  };

  const style = getProviderColor();

  return (
    <div
      style={{
        width: '260px',
        background: isDark ? '#141824' : '#FFFFFF',
        borderRadius: '14px',
        border: selected
          ? '2px solid #0073EA'
          : nodeData.isRunning
          ? '2px solid #0073EA'
          : `1.5px solid ${style.border}`,
        boxShadow: selected
          ? '0 0 0 4px rgba(0, 115, 234, 0.2), 0 8px 24px rgba(0, 0, 0, 0.3)'
          : isDark
          ? '0 4px 14px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.1)'
          : '0 4px 14px rgba(0, 115, 234, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02)',
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
          background: '#0073EA',
          border: isDark ? '2px solid #141824' : '2px solid #FFFFFF',
          boxShadow: '0 0 0 2px #0073EA',
        }}
      />

      {/* Node Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: style.bg,
          borderBottom: `1px solid ${style.border}`,
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
            <Sparkles size={16} color={style.badge} />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 800, color: style.text, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            AI AGENT / BYOK
          </span>
        </div>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: '#FFFFFF',
            background: style.badge,
            padding: '2px 6px',
            borderRadius: '4px',
            textTransform: 'uppercase',
          }}
        >
          {nodeData.provider || 'AI'}
        </span>
      </div>

      {/* Node Content */}
      <div style={{ padding: '12px 14px' }}>
        <h4 style={{ margin: '0 0 3px 0', fontSize: '13.5px', fontWeight: 700, color: isDark ? '#F1F5F9' : '#181B34' }}>
          {nodeData.title || 'LLM Synthesizer'}
        </h4>
        <div
          style={{
            display: 'inline-block',
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: 'monospace',
            color: isDark ? '#38BDF8' : '#0056B3',
            background: isDark ? 'rgba(0, 115, 234, 0.2)' : 'rgba(0, 115, 234, 0.08)',
            padding: '2px 6px',
            borderRadius: '4px',
            marginBottom: '6px',
          }}
        >
          {nodeData.model || 'claude-3-7-sonnet'}
        </div>
        <p style={{ margin: 0, fontSize: '11.5px', color: isDark ? '#94A3B8' : '#6B7280', lineHeight: 1.4, fontStyle: 'italic' }}>
          &ldquo;{nodeData.promptSnippet || 'Menganalisis data input dan menghasilkan ringkasan...'}&rdquo;
        </p>
      </div>

      {/* Output Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: '10px',
          height: '10px',
          background: '#0073EA',
          border: isDark ? '2px solid #141824' : '2px solid #FFFFFF',
          boxShadow: '0 0 0 2px #0073EA',
        }}
      />
    </div>
  );
});

AIAgentNode.displayName = 'AIAgentNode';
