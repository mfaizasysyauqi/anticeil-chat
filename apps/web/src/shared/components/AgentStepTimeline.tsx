'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileCode,
  Globe,
  Terminal,
  CheckCircle2,
  Lightbulb,
  Loader2,
  BookOpen,
  Plug,
  Wrench,
  Cpu,
  BrainCircuit,
  FileText,
  Sparkles,
  ClipboardList,
  Palette,
  Code,
  FlaskConical,
  Rocket,
  Check,
} from 'lucide-react';
import {
  Timeline,
  TimelineItem,
  TimelineDot,
  TimelineLine,
  TimelineContent,
  TimelineHeading,
} from '@/components/ui/timeline';
import { useDocsStore } from '../../features/docs/store/useDocsStore';

export interface AgentTimelineStep {
  id: string;
  type:
    | 'plan'
    | 'design'
    | 'code'
    | 'test'
    | 'deploy'
    | 'done'
    | 'thought'
    | 'thinking'
    | 'explored'
    | 'analyzed'
    | 'edited'
    | 'edit'
    | 'checked'
    | 'ran'
    | 'tool'
    | 'searching'
    | 'web_search'
    | 'read'
    | 'connector'
    | 'mcp'
    | 'synthesis'
    | 'result'
    | 'custom';
  title: string;
  durationSeconds?: number;
  fileName?: string;
  fileId?: string;
  diffCount?: number;
  command?: string;
  content?: string;
  badge?: string;
  isStreaming?: boolean;
  defaultExpanded?: boolean;
}

// Adapter: core AgentStep → AgentTimelineStep for compatibility
function adaptAgentSteps(steps?: import('@anticeil/core').AgentStep[]): AgentTimelineStep[] | undefined {
  if (!steps) return undefined;
  return steps.map((s) => {
    let type: AgentTimelineStep['type'] = 'analyzed';
    if (s.phase === 'plan') type = 'plan';
    else if (s.phase === 'design') type = 'design';
    else if (s.phase === 'code') type = 'code';
    else if (s.phase === 'test') type = 'test';
    else if (s.phase === 'deploy') type = 'deploy';
    else if (s.phase === 'done') type = 'done';
    else if (s.phase === 'reasoning' || s.phase === 'thinking') type = 'thought';
    else if (s.phase === 'web_search') type = 'web_search';
    else if (s.phase === 'read') type = 'read';
    else if (s.phase === 'edit') type = 'edited';
    else if (s.phase === 'tool' || s.phase === 'tool_call') type = 'ran';
    else if (s.phase === 'connector' || s.phase === 'mcp') type = 'connector';
    else if (s.phase === 'synthesis') type = 'analyzed';
    else if (s.phase === 'result') type = 'checked';

    return {
      id: s.id,
      type,
      title:
        s.title ||
        (s.phase === 'plan'
          ? 'Plan'
          : s.phase === 'design'
          ? 'Design'
          : s.phase === 'code'
          ? 'Code'
          : s.phase === 'test'
          ? 'Test'
          : s.phase === 'deploy'
          ? 'Deploy'
          : s.phase === 'done'
          ? 'Done'
          : s.phase === 'synthesis'
          ? 'Synthesis'
          : s.phase === 'result'
          ? 'Result'
          : s.phase),
      content: s.content,
      badge: s.badge,
    };
  });
}

export interface AgentStepTimelineProps {
  steps?: AgentTimelineStep[] | import('@anticeil/core').AgentStep[];
  reasoningContent?: string;
  actions?: Array<{ type: string; name: string }>;
  commandLog?: string;
  isStreaming?: boolean;
  docId?: string;
  onOpenFile?: (fileName: string, fileId?: string) => void;
  language?: 'id' | 'en';
}

/**
 * Parses reasoning content and agent action badges into a realistic Antigravity timeline step list.
 */
function parseReasoningAndActionsToSteps(
  reasoningContent?: string,
  actions?: Array<{ type: string; name: string }>,
  isStreaming = false
): AgentTimelineStep[] {
  const result: AgentTimelineStep[] = [];

  if (reasoningContent && reasoningContent.trim()) {
    const rawBlocks = reasoningContent
      .trim()
      .split(/\n\n+/)
      .filter((b) => b.trim().length > 0);

    const estDuration = Math.max(1, Math.floor(reasoningContent.length / 140));

    if (rawBlocks.length === 1) {
      result.push({
        id: 'thought_0',
        type: 'thought',
        title: `Thinking (${estDuration}s)`,
        durationSeconds: estDuration,
        content: rawBlocks[0],
        isStreaming,
        defaultExpanded: isStreaming,
      });
    } else {
      rawBlocks.forEach((block, idx) => {
        const stepDuration = Math.max(1, Math.floor(block.length / 140));
        const isLastBlock = idx === rawBlocks.length - 1;
        result.push({
          id: `thought_${idx}`,
          type: 'thought',
          title: `Thinking (${stepDuration}s)`,
          durationSeconds: stepDuration,
          content: block,
          isStreaming: isStreaming && isLastBlock,
          defaultExpanded: isStreaming && isLastBlock,
        });

        if (actions && actions[idx]) {
          const act = actions[idx];
          const actType =
            act.type === 'create' || act.type === 'patch' || act.type === 'update'
              ? 'edited'
              : act.type === 'checked'
              ? 'checked'
              : 'analyzed';

          result.push({
            id: `action_${idx}`,
            type: actType,
            title: actType === 'edited' ? 'Edited' : actType === 'checked' ? 'Checked' : 'Analyzed',
            fileName: act.name,
            diffCount: 1,
          });
        }
      });
    }
  }

  if (actions && actions.length > 0) {
    const processedKeys = new Set(result.map((s) => `${s.type}_${s.fileName}`));
    actions.forEach((act, idx) => {
      const actType =
        act.type === 'create' || act.type === 'patch' || act.type === 'update'
          ? 'edited'
          : act.type === 'checked'
          ? 'checked'
          : 'analyzed';

      const key = `${actType}_${act.name}`;
      if (!processedKeys.has(key)) {
        processedKeys.add(key);
        result.push({
          id: `action_extra_${idx}`,
          type: actType,
          title: actType === 'edited' ? 'Edited' : actType === 'checked' ? 'Checked' : 'Analyzed',
          fileName: act.name,
          diffCount: 1,
        });
      }
    });
  }

  if (result.length === 0) {
    if (isStreaming) {
      result.push({
        id: 'active_streaming_step',
        type: 'thought',
        title: 'Menganalisis & mempersiapkan respon...',
        isStreaming: true,
        defaultExpanded: true,
      });
    } else if (actions && actions.length > 0) {
      actions.forEach((act, idx) => {
        const actType =
          act.type === 'create' || act.type === 'patch' || act.type === 'update'
            ? 'edited'
            : act.type === 'checked'
            ? 'checked'
            : 'analyzed';
        result.push({
          id: `action_fallback_${idx}`,
          type: actType,
          title: actType === 'edited' ? 'Edited' : actType === 'checked' ? 'Checked' : 'Analyzed',
          fileName: act.name,
          diffCount: 1,
        });
      });
    }
  }

  return result;
}

/** Derive dot status from step type */
function getDotStatus(step: AgentTimelineStep): 'done' | 'current' | 'default' | 'error' {
  if (step.isStreaming) return 'current';
  return 'done';
}

/**
 * Single Thought Step with expandable reasoning
 */
function ThoughtStepItem({ step, isLast }: { step: AgentTimelineStep; isLast: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <TimelineItem status="done">
      <TimelineHeading side="right" variant="primary" className="text-xs font-medium truncate w-full">
        <button
          type="button"
          onClick={() => step.content && setIsExpanded(!isExpanded)}
          style={{
            all: 'unset',
            cursor: step.content ? 'pointer' : 'default',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: 'inherit',
          }}
        >
          {step.title}
          {step.content && (
            isExpanded ? <ChevronDown size={12} style={{ opacity: 0.6 }} /> : <ChevronRight size={12} style={{ opacity: 0.6 }} />
          )}
        </button>
      </TimelineHeading>
      <TimelineDot status={getDotStatus(step)} />
      {!isLast && <TimelineLine done />}
      <TimelineContent side="right">
        {step.content && isExpanded && (
          <div
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '11px',
              color: 'var(--text-secondary, #a3a3a3)',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              marginTop: '4px',
              marginBottom: '6px',
              maxHeight: '160px',
              overflowY: 'auto',
            }}
          >
            {step.content}
          </div>
        )}
      </TimelineContent>
    </TimelineItem>
  );
}

/**
 * Single step rendered inside the shadcn Timeline
 */
function TimelineStepItem({
  step,
  isLast,
  onClickFile,
}: {
  step: AgentTimelineStep;
  isLast: boolean;
  onClickFile?: () => void;
}) {
  const isEdit = step.type === 'edited' || step.type === 'edit';
  const isWebSearch = step.type === 'web_search' || step.type === 'searching';
  const isRead = step.type === 'read';
  const isTool = step.type === 'ran' || step.type === 'tool';
  const isConnector = step.type === 'connector' || step.type === 'mcp';
  const isThought = step.type === 'thought' || step.type === 'thinking';
  const isPlan = step.type === 'plan';
  const isDesign = step.type === 'design';
  const isCode = step.type === 'code';
  const isTest = step.type === 'test';
  const isDeploy = step.type === 'deploy';
  const isDone = step.type === 'done';

  if (isThought) {
    return <ThoughtStepItem step={step} isLast={isLast} />;
  }

  // Plan step
  if (isPlan) {
    return (
      <TimelineItem status="done">
        <TimelineHeading side="right" variant="primary" className="text-xs font-medium truncate w-full">
          {step.title}
        </TimelineHeading>
        <TimelineDot status="done" customIcon={<ClipboardList style={{ width: 10, height: 10, strokeWidth: 2.5, flexShrink: 0 }} />} />
        {!isLast && <TimelineLine done />}
        {step.content && (
          <TimelineContent side="right">
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{step.content}</span>
          </TimelineContent>
        )}
      </TimelineItem>
    );
  }

  // Design step
  if (isDesign) {
    return (
      <TimelineItem status="done">
        <TimelineHeading side="right" variant="primary" className="text-xs font-medium truncate w-full">
          {step.title}
        </TimelineHeading>
        <TimelineDot status="done" customIcon={<Palette style={{ width: 10, height: 10, strokeWidth: 2.5, flexShrink: 0 }} />} />
        {!isLast && <TimelineLine done />}
        {step.content && (
          <TimelineContent side="right">
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{step.content}</span>
          </TimelineContent>
        )}
      </TimelineItem>
    );
  }

  // Code step
  if (isCode) {
    return (
      <TimelineItem status="done">
        <TimelineHeading side="right" variant="primary" className="text-xs font-medium truncate w-full">
          {step.title}
        </TimelineHeading>
        <TimelineDot status="done" customIcon={<Code style={{ width: 10, height: 10, strokeWidth: 2.5, flexShrink: 0 }} />} />
        {!isLast && <TimelineLine done />}
        {step.content && (
          <TimelineContent side="right">
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{step.content}</span>
          </TimelineContent>
        )}
      </TimelineItem>
    );
  }

  // Test step
  if (isTest) {
    return (
      <TimelineItem status="done">
        <TimelineHeading side="right" variant="primary" className="text-xs font-medium truncate w-full">
          {step.title}
        </TimelineHeading>
        <TimelineDot status="done" customIcon={<FlaskConical style={{ width: 10, height: 10, strokeWidth: 2.5, flexShrink: 0 }} />} />
        {!isLast && <TimelineLine done />}
        {step.content && (
          <TimelineContent side="right">
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{step.content}</span>
          </TimelineContent>
        )}
      </TimelineItem>
    );
  }

  // Deploy step
  if (isDeploy) {
    return (
      <TimelineItem status="done">
        <TimelineHeading side="right" variant="primary" className="text-xs font-medium truncate w-full">
          {step.title}
        </TimelineHeading>
        <TimelineDot status="done" customIcon={<Rocket style={{ width: 10, height: 10, strokeWidth: 2.5, flexShrink: 0 }} />} />
        {!isLast && <TimelineLine done />}
        {step.content && (
          <TimelineContent side="right">
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{step.content}</span>
          </TimelineContent>
        )}
      </TimelineItem>
    );
  }

  // Done step
  if (isDone) {
    return (
      <TimelineItem status="done">
        <TimelineHeading side="right" variant="primary" className="text-xs font-medium truncate w-full">
          {step.title}
        </TimelineHeading>
        <TimelineDot status="done" customIcon={<Check style={{ width: 10, height: 10, strokeWidth: 3, flexShrink: 0 }} />} />
        {!isLast && <TimelineLine done />}
        {step.content && (
          <TimelineContent side="right">
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{step.content}</span>
          </TimelineContent>
        )}
      </TimelineItem>
    );
  }

  // Web search
  if (isWebSearch) {
    return (
      <TimelineItem status="done">
        <TimelineHeading side="right" variant="primary" className="text-xs font-medium truncate w-full">
          {step.title}
        </TimelineHeading>
        <TimelineDot status="done" customIcon={<Globe style={{ width: 10, height: 10, strokeWidth: 2.5, flexShrink: 0 }} />} />
        {!isLast && <TimelineLine done />}
        {step.content && (
          <TimelineContent side="right">
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{step.content}</span>
          </TimelineContent>
        )}
      </TimelineItem>
    );
  }

  // Read step
  if (isRead) {
    return (
      <TimelineItem status="done">
        <TimelineHeading side="right" variant="primary" className="text-xs font-medium truncate w-full">
          {step.title}
        </TimelineHeading>
        <TimelineDot status="done" customIcon={<BookOpen style={{ width: 10, height: 10, strokeWidth: 2.5, flexShrink: 0 }} />} />
        {!isLast && <TimelineLine done />}
        {step.content && (
          <TimelineContent side="right">
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{step.content}</span>
          </TimelineContent>
        )}
      </TimelineItem>
    );
  }

  // Tool execution step
  if (isTool) {
    return (
      <TimelineItem status="done">
        <TimelineHeading side="right" variant="primary" className="text-xs font-medium truncate w-full">
          {step.title}
        </TimelineHeading>
        <TimelineDot status="done" customIcon={<Terminal style={{ width: 10, height: 10, strokeWidth: 2.5, flexShrink: 0 }} />} />
        {!isLast && <TimelineLine done />}
        <TimelineContent side="right">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {step.command && (
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'monospace', fontSize: '11px' }}>
                {step.command}
              </span>
            )}
            {step.content && (
              <pre
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#090D16',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#A7F3D0',
                  overflowX: 'auto',
                  maxHeight: '100px',
                  margin: '0',
                }}
              >
                {step.content}
              </pre>
            )}
          </div>
        </TimelineContent>
      </TimelineItem>
    );
  }

  // Connector & MCP
  if (isConnector) {
    return (
      <TimelineItem status="done">
        <TimelineHeading side="right" variant="primary" className="text-xs font-medium truncate w-full">
          {step.title}
        </TimelineHeading>
        <TimelineDot status="done" customIcon={<Plug style={{ width: 10, height: 10, strokeWidth: 2.5, flexShrink: 0 }} />} />
        {!isLast && <TimelineLine done />}
        {step.content && (
          <TimelineContent side="right">
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{step.content}</span>
          </TimelineContent>
        )}
      </TimelineItem>
    );
  }

  // Edit file or general action
  return (
    <TimelineItem status="done">
      <TimelineHeading side="right" variant="primary" className="text-xs font-medium truncate w-full">
        {step.title}
      </TimelineHeading>
      <TimelineDot status={getDotStatus(step)} />
      {!isLast && <TimelineLine done />}
      <TimelineContent side="right">
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {step.fileName && (
            <span
              onClick={onClickFile}
              style={{
                color: 'var(--text-primary)',
                fontWeight: 600,
                cursor: onClickFile ? 'pointer' : 'default',
              }}
            >
              {step.fileName}
            </span>
          )}
          {isEdit && step.diffCount && (
            <span style={{ color: '#10B981', fontWeight: 700, fontSize: '10px', marginLeft: 4 }}>
              +{step.diffCount}
            </span>
          )}
        </div>
      </TimelineContent>
    </TimelineItem>
  );
}

/**
 * Reusable Antigravity Agent Step & Thought Execution Timeline Component
 *
 * Uses shadcn Timeline with full support for:
 * - Lifecycle: plan, design, code, test, deploy, done
 * - Reasoning & thinking
 * - Tools & commands
 * - Web search & scraping
 * - Connectors & MCP
 * - File editing & synthesis
 */
export function AgentStepTimeline({
  steps: customSteps,
  reasoningContent,
  actions,
  isStreaming = false,
  docId,
  onOpenFile,
  language = 'id',
}: AgentStepTimelineProps) {
  const setActiveFileId = useDocsStore((s) => s.setActiveFileId);
  const documents = useDocsStore((s) => s.documents);

  const steps: AgentTimelineStep[] = useMemo(() => {
    if (customSteps && customSteps.length > 0) {
      // Check if steps are core AgentStep (have `phase`) and adapt
      if ('phase' in (customSteps as any)[0]) {
        return adaptAgentSteps(customSteps as any) || [];
      }
      return customSteps as AgentTimelineStep[];
    }
    return parseReasoningAndActionsToSteps(reasoningContent, actions, isStreaming);
  }, [customSteps, reasoningContent, actions, isStreaming]);

  if (steps.length === 0 && !isStreaming) return null;

  const handleFileClick = (step: AgentTimelineStep) => {
    if (!step.fileName) return;
    if (onOpenFile) {
      onOpenFile(step.fileName, step.fileId);
      return;
    }
    if (docId) {
      const doc = documents.find((d) => d.id === docId);
      const subFile = doc?.files?.find(
        (f) => f.name.toLowerCase() === step.fileName!.toLowerCase() || f.id === step.fileName
      );
      if (subFile) {
        setActiveFileId(docId, subFile.id);
      } else {
        const mainSubFile = doc?.files?.find((f) => f.name.toLowerCase().startsWith('main.'));
        if (mainSubFile) setActiveFileId(docId, mainSubFile.id);
      }
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        margin: '2px 0 8px 0',
        padding: 0,
        fontSize: '12px',
        fontFamily: 'inherit',
      }}
    >
      <Timeline positions="left">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          return (
            <TimelineStepItem
              key={step.id || `step_${idx}`}
              step={step}
              isLast={isLast}
              onClickFile={() => handleFileClick(step)}
            />
          );
        })}
      </Timeline>
    </div>
  );
}
