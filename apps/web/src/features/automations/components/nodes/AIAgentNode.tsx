'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Sparkles, Brain, Cpu } from 'lucide-react';

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

  const getProviderColor = () => {
    switch (nodeData.provider) {
      case 'anthropic':
        return { bg: '#F5F3FF', border: '#DDD6FE', text: '#6D28D9', badge: '#7C3AED' };
      case 'deepseek':
        return { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8', badge: '#2563EB' };
      case 'groq':
        return { bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C', badge: '#EA580C' };
      default:
        return { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D', badge: '#16A34A' };
    }
  };

  const style = getProviderColor();

  return (
    <div
      style={{
        width: '260px',
        background: '#FFFFFF',
        borderRadius: '14px',
        border: selected
          ? '2px solid #0073EA'
          : nodeData.isRunning
          ? '2px solid #0073EA'
          : `1.5px solid ${style.border}`,
        boxShadow: selected
          ? '0 0 0 4px rgba(0, 115, 234, 0.15), 0 8px 24px rgba(0, 0, 0, 0.08)'
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
          border: '2px solid #FFFFFF',
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
              background: '#FFFFFF',
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
        <h4 style={{ margin: '0 0 3px 0', fontSize: '13.5px', fontWeight: 700, color: '#181B34' }}>
          {nodeData.title || 'LLM Synthesizer'}
        </h4>
        <div
          style={{
            display: 'inline-block',
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: 'monospace',
            color: '#0056B3',
            background: 'rgba(0, 115, 234, 0.08)',
            padding: '2px 6px',
            borderRadius: '4px',
            marginBottom: '6px',
          }}
        >
          {nodeData.model || 'claude-3-7-sonnet'}
        </div>
        <p style={{ margin: 0, fontSize: '11.5px', color: '#6B7280', lineHeight: 1.4, fontStyle: 'italic' }}>
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
          border: '2px solid #FFFFFF',
          boxShadow: '0 0 0 2px #0073EA',
        }}
      />
    </div>
  );
});

AIAgentNode.displayName = 'AIAgentNode';
