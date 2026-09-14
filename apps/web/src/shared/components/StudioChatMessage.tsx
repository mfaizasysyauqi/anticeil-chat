'use client';

import React from 'react';
import { AIChatBubble, type AIChatBubbleProps } from './AIChatBubble';
import type { AgentTimelineStep } from './AgentStepTimeline';

export interface StudioChatMessageProps {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  reasoningContent?: string;
  actions?: Array<{ type: string; name: string }>;
  steps?: AgentTimelineStep[];
  docId?: string;
  onOpenFile?: (fileName: string, fileId?: string) => void;
  onOpenVersionHistory?: () => void;
  isStreaming?: boolean;
  assistantName?: string;
  assistantIcon?: React.ReactNode;
  assistantColor?: string;
  extraContent?: React.ReactNode;
  language?: 'id' | 'en';
  onCopy?: () => void;
  onEdit?: () => void;
  onUndo?: () => void;
  isReverted?: boolean;
  timestamp?: number;
  isSticky?: boolean;
}

/**
 * StudioChatMessage - Reusable adapter wrapping AIChatBubble for Docs Studio, Media Studio, and Chat Studio.
 * Ensures 100% DRYness and consistent visual aesthetics across all chat surfaces.
 */
export function StudioChatMessage({
  role,
  content,
  reasoningContent,
  actions,
  steps,
  docId,
  onOpenFile,
  onOpenVersionHistory,
  isStreaming = false,
  assistantName = 'AI Co-Author',
  assistantIcon,
  assistantColor = 'var(--brand-primary)',
  extraContent,
  language = 'id',
  onCopy,
  onEdit,
  onUndo,
  isReverted = false,
  timestamp,
  isSticky = false,
}: StudioChatMessageProps) {
  return (
    <AIChatBubble
      role={role}
      content={content}
      reasoningContent={reasoningContent}
      actions={actions}
      agentSteps={steps}
      docId={docId}
      onOpenFile={onOpenFile}
      onOpenVersionHistory={onOpenVersionHistory}
      isStreaming={isStreaming}
      assistantName={assistantName}
      assistantIcon={assistantIcon}
      assistantColor={assistantColor}
      extraContent={extraContent}
      language={language}
      onCopy={onCopy}
      onEdit={onEdit}
      onUndo={onUndo}
      isReverted={isReverted}
      timestamp={timestamp}
      isSticky={isSticky}
      variant="coauthor"
    />
  );
}
