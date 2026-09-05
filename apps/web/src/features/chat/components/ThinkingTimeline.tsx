'use client';

import React from 'react';
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

export function ThinkingTimeline({
  reasoningContent = '',
  isStreaming = false,
  actions,
  steps,
  docId,
}: ThinkingTimelineProps) {
  if (!reasoningContent && (!actions || actions.length === 0) && (!steps || steps.length === 0) && !isStreaming) {
    return null;
  }

  return (
    <AgentStepTimeline
      reasoningContent={reasoningContent}
      isStreaming={isStreaming}
      actions={actions}
      steps={steps}
      docId={docId}
    />
  );
}
