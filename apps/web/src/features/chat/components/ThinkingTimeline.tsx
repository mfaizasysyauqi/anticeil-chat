'use client';

import React, { useState, useEffect } from 'react';
import { AgentStepTimeline, AgentTimelineStep } from '../../../shared/components/AgentStepTimeline';

export interface ThinkingTimelineProps {
  reasoningContent?: string;
  isStreaming?: boolean;
  timestamp?: number;
  modelName?: string;
  actions?: Array<{ type: string; name: string }>;
  steps?: AgentTimelineStep[];
  docId?: string;
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function ThinkingTimeline({
  reasoningContent = '',
  isStreaming = false,
  actions,
  steps,
  docId,
  modelName,
  timestamp,
}: ThinkingTimelineProps) {
  if (!reasoningContent && (!actions || actions.length === 0) && (!steps || steps.length === 0) && !isStreaming) {
    return null;
  }

  const headerLabel = [modelName, timestamp ? formatTimestamp(timestamp) : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {headerLabel && (
        <div
          style={{
            fontSize: '10px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            padding: '2px 4px 4px',
            opacity: 0.7,
          }}
        >
          {headerLabel}
        </div>
      )}
      <AgentStepTimeline
        reasoningContent={reasoningContent}
        isStreaming={isStreaming}
        actions={actions}
        steps={steps}
        docId={docId}
      />
    </div>
  );
}
