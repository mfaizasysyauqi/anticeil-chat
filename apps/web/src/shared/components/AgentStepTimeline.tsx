'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Globe,
  Terminal,
  BookOpen,
  Plug,
  ClipboardList,
  Palette,
  Code,
  FlaskConical,
  Rocket,
  Check,
  FileCode,
  FilePlus,
  Trash2,
  Search,
  Database,
  ExternalLink,
  Loader2,
  AlertCircle,
  Sparkles,
  type LucideIcon,
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

// ─── Types ───────────────────────────────────────────────────────────────────

export type AgentStepType =
  | 'plan' | 'design' | 'code' | 'test' | 'deploy' | 'done'
  | 'thought' | 'thinking' | 'explored' | 'analyzed'
  | 'create_file' | 'edit_file' | 'delete_file' | 'read_file' | 'edited' | 'edit' | 'checked' | 'crud'
  | 'ran' | 'tool' | 'terminal' | 'command'
  | 'searching' | 'web_search' | 'search'
  | 'read'
  | 'connector' | 'mcp'
  | 'database' | 'db_query' | 'db_mutation'
  | 'synthesis' | 'result' | 'custom';

export type StepStatus = 'pending' | 'running' | 'done' | 'error';

export interface SearchSource {
  title: string;
  url: string;
  domain?: string;
  snippet?: string;
}

export interface AgentTimelineStep {
  id: string;
  type: AgentStepType;
  title: string;
  status?: StepStatus;
  durationSeconds?: number;
  // CRUD / File
  fileName?: string;
  fileId?: string;
  filePath?: string;
  actionType?: 'create' | 'modify' | 'delete' | 'read';
  diffAdded?: number;
  diffRemoved?: number;
  diffCount?: number;
  diffPreview?: string;
  // Terminal / Command
  command?: string;
  // MCP / Tool calls
  serverName?: string;
  toolName?: string;
  toolInput?: Record<string, unknown> | string;
  toolOutput?: Record<string, unknown> | string;
  // Web search
  searchQuery?: string;
  sources?: SearchSource[];
  // CoT / Content
  content?: string;
  badge?: string;
  isStreaming?: boolean;
  defaultExpanded?: boolean;
  error?: string;
}

// ─── Step Icon Map ────────────────────────────────────────────────────────────

const STEP_ICON: Partial<Record<AgentStepType, LucideIcon>> = {
  plan: ClipboardList,
  design: Palette,
  code: Code,
  test: FlaskConical,
  deploy: Rocket,
  done: Check,
  web_search: Globe,
  searching: Globe,
  search: Search,
  read: BookOpen,
  read_file: BookOpen,
  create_file: FilePlus,
  delete_file: Trash2,
  edit_file: FileCode,
  edited: FileCode,
  edit: FileCode,
  crud: FileCode,
  checked: Check,
  ran: Terminal,
  tool: Terminal,
  terminal: Terminal,
  command: Terminal,
  connector: Plug,
  mcp: Plug,
  database: Database,
  db_query: Database,
  db_mutation: Database,
  synthesis: Sparkles,
  analyzed: Sparkles,
  explored: Search,
};

const ICON_STYLE: React.CSSProperties = { width: 10, height: 10, strokeWidth: 2.5, flexShrink: 0 };
const DONE_ICON_STYLE: React.CSSProperties = { ...ICON_STYLE, strokeWidth: 3 };

// ─── Adapter: core AgentStep → AgentTimelineStep ──────────────────────────────

const PHASE_TO_TYPE: Record<string, AgentStepType> = {
  plan: 'plan', design: 'design', code: 'code', test: 'test',
  deploy: 'deploy', done: 'done',
  reasoning: 'thought', thinking: 'thought',
  web_search: 'web_search', search: 'web_search', read: 'read',
  create: 'create_file', edit: 'edit_file', delete: 'delete_file', patch: 'edit_file',
  tool: 'ran', tool_call: 'ran', terminal: 'ran', act: 'ran',
  connector: 'connector', mcp: 'mcp',
  database: 'database',
  lint: 'checked', verify: 'checked',
  synthesis: 'analyzed', result: 'checked',
};

const PHASE_TITLES: Partial<Record<string, string>> = {
  plan: 'Plan', design: 'Design', code: 'Code', test: 'Test',
  deploy: 'Deploy', done: 'Done', synthesis: 'Synthesis', result: 'Result',
  lint: 'Linting & Verification', verify: 'Verification',
};

function adaptAgentSteps(steps: import('@anticeil/core').AgentStep[]): AgentTimelineStep[] {
  return steps.map((s) => ({
    id: s.id,
    type: PHASE_TO_TYPE[s.phase] ?? 'analyzed',
    title: s.title || PHASE_TITLES[s.phase] || s.phase,
    content: s.content,
    badge: s.badge,
    status: s.status as StepStatus | undefined,
  }));
}

export interface AgentStepTimelineProps {
  steps?: AgentTimelineStep[] | import('@anticeil/core').AgentStep[];
  reasoningContent?: string;
  actions?: Array<{ type: string; name: string; added?: number; removed?: number; preview?: string }>;
  commandLog?: string;
  isStreaming?: boolean;
  docId?: string;
  onOpenFile?: (fileName: string, fileId?: string) => void;
  language?: 'id' | 'en';
}

// ─── Action Type Helpers ──────────────────────────────────────────────────────

type EditActionType = 'create_file' | 'edit_file' | 'delete_file' | 'checked' | 'analyzed';

function getActionType(rawType: string): EditActionType {
  if (rawType === 'create' || rawType === 'new') return 'create_file';
  if (rawType === 'delete' || rawType === 'remove') return 'delete_file';
  if (rawType === 'patch' || rawType === 'update' || rawType === 'edit') return 'edit_file';
  if (rawType === 'checked') return 'checked';
  return 'analyzed';
}

const ACTION_TITLES: Record<EditActionType, string> = {
  create_file: 'Created',
  edit_file: 'Edited',
  delete_file: 'Deleted',
  checked: 'Checked',
  analyzed: 'Analyzed',
};

/**
 * Parses reasoning content and agent action badges into a realistic timeline step list.
 */
function parseReasoningAndActionsToSteps(
  reasoningContent?: string,
  actions?: Array<{ type: string; name: string; added?: number; removed?: number; preview?: string }>,
  isStreaming = false,
): AgentTimelineStep[] {
  const result: AgentTimelineStep[] = [];

  if (reasoningContent?.trim()) {
    const rawBlocks = reasoningContent.trim().split(/\n\n+/).filter((b) => b.trim().length > 0);
    const estDuration = Math.max(1, Math.floor(reasoningContent.length / 140));

    if (rawBlocks.length === 1) {
      result.push({
        id: 'thought_0',
        type: 'thought',
        title: `Thinking (${estDuration}s)`,
        durationSeconds: estDuration,
        content: rawBlocks[0],
        status: isStreaming ? 'running' : 'done',
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
          status: isStreaming && isLastBlock ? 'running' : 'done',
          isStreaming: isStreaming && isLastBlock,
          defaultExpanded: isStreaming && isLastBlock,
        });

        const act = actions?.[idx];
        if (act) {
          const actType = getActionType(act.type);
          result.push({
            id: `action_${idx}`,
            type: actType,
            title: ACTION_TITLES[actType],
            fileName: act.name,
            actionType: actType === 'create_file' ? 'create' : actType === 'delete_file' ? 'delete' : 'modify',
            diffAdded: act.added ?? 1,
            diffRemoved: act.removed ?? 0,
            diffPreview: act.preview,
            status: 'done',
          });
        }
      });
    }
  }

  if (actions?.length) {
    const processedKeys = new Set(result.map((s) => `${s.type}_${s.fileName}`));
    actions.forEach((act, idx) => {
      const actType = getActionType(act.type);
      const key = `${actType}_${act.name}`;
      if (!processedKeys.has(key)) {
        processedKeys.add(key);
        result.push({
          id: `action_extra_${idx}`,
          type: actType,
          title: ACTION_TITLES[actType],
          fileName: act.name,
          actionType: actType === 'create_file' ? 'create' : actType === 'delete_file' ? 'delete' : 'modify',
          diffAdded: act.added ?? 1,
          diffRemoved: act.removed ?? 0,
          diffPreview: act.preview,
          status: 'done',
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
        status: 'running',
        isStreaming: true,
        defaultExpanded: true,
      });
    } else if (actions?.length) {
      actions.forEach((act, idx) => {
        const actType = getActionType(act.type);
        result.push({
          id: `action_fallback_${idx}`,
          type: actType,
          title: ACTION_TITLES[actType],
          fileName: act.name,
          actionType: actType === 'create_file' ? 'create' : actType === 'delete_file' ? 'delete' : 'modify',
          diffAdded: act.added ?? 1,
          diffRemoved: act.removed ?? 0,
          status: 'done',
        });
      });
    }
  }

  return result;
}

/** Derive dot status from step type and state */
function getDotStatus(step: AgentTimelineStep): 'done' | 'current' | 'default' | 'error' {
  if (step.status === 'error') return 'error';
  if (step.status === 'running' || step.isStreaming) return 'current';
  if (step.status === 'pending') return 'default';
  return 'done';
}

/** Compute rich semantic categorical color and border for each agent step dot */
export function getSemanticStepDotStyle(step: AgentTimelineStep): React.CSSProperties {
  if (step.status === 'error') {
    return {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      border: '1.5px solid rgba(239, 68, 68, 0.6)',
      color: '#F87171',
    };
  }

  if (step.status === 'running' || step.isStreaming) {
    return {
      backgroundColor: 'rgba(99, 102, 241, 0.25)',
      border: '1.5px solid var(--brand-primary, #6366F1)',
      color: 'var(--brand-primary, #818CF8)',
      boxShadow: '0 0 8px rgba(99, 102, 241, 0.4)',
    };
  }

  // 1. Thinking / Reasoning / CoT -> Purple / Violet
  if (step.type === 'thought' || step.type === 'thinking') {
    return {
      backgroundColor: 'rgba(168, 85, 247, 0.15)',
      border: '1.5px solid rgba(168, 85, 247, 0.55)',
      color: '#C084FC',
    };
  }

  // 2. Web search / Citations -> Cyan / Sky Blue
  if (['web_search', 'searching', 'search'].includes(step.type)) {
    return {
      backgroundColor: 'rgba(6, 182, 212, 0.15)',
      border: '1.5px solid rgba(6, 182, 212, 0.55)',
      color: '#22D3EE',
    };
  }

  // 3. File CRUD:
  if (step.type === 'create_file' || step.actionType === 'create') {
    return {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      border: '1.5px solid rgba(16, 185, 129, 0.55)',
      color: '#34D399',
    };
  }
  if (step.type === 'delete_file' || step.actionType === 'delete') {
    return {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      border: '1.5px solid rgba(239, 68, 68, 0.55)',
      color: '#F87171',
    };
  }
  if (step.type === 'edit_file' || step.type === 'edited' || step.type === 'edit' || step.actionType === 'modify' || step.type === 'crud') {
    return {
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
      border: '1.5px solid rgba(59, 130, 246, 0.55)',
      color: '#60A5FA',
    };
  }
  if (step.type === 'read_file' || step.type === 'read' || step.actionType === 'read') {
    return {
      backgroundColor: 'rgba(148, 163, 184, 0.15)',
      border: '1.5px solid rgba(148, 163, 184, 0.45)',
      color: '#94A3B8',
    };
  }

  // 4. Tools / MCP / Terminal -> Amber / Orange
  if (['tool', 'mcp', 'connector', 'ran', 'terminal', 'command'].includes(step.type)) {
    return {
      backgroundColor: 'rgba(249, 115, 22, 0.15)',
      border: '1.5px solid rgba(249, 115, 22, 0.55)',
      color: '#FB923C',
    };
  }

  // 5. Database -> Emerald / Cyan
  if (['database', 'db_query', 'db_mutation'].includes(step.type)) {
    return {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      border: '1.5px solid rgba(16, 185, 129, 0.55)',
      color: '#34D399',
    };
  }

  // 6. Synthesis / Result / Done -> Emerald Green
  if (step.type === 'result' || step.type === 'done' || step.type === 'checked') {
    return {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      border: '1.5px solid rgba(16, 185, 129, 0.55)',
      color: '#34D399',
    };
  }
  if (step.type === 'synthesis' || step.type === 'analyzed' || step.type === 'explored') {
    return {
      backgroundColor: 'rgba(99, 102, 241, 0.15)',
      border: '1.5px solid rgba(99, 102, 241, 0.55)',
      color: '#818CF8',
    };
  }

  // Default fallback
  return {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1.5px solid rgba(255, 255, 255, 0.2)',
    color: 'var(--text-secondary, #D1D5DB)',
  };
}

// ─── Specialized Item Renderers ──────────────────────────────────────────────

/**
 * Single Thought Step with expandable reasoning
 */
function ThoughtStepItem({ step, isLast }: { step: AgentTimelineStep; isLast: boolean }) {
  const [isExpanded, setIsExpanded] = useState(step.defaultExpanded ?? false);
  const isRunning = step.status === 'running' || step.isStreaming;

  return (
    <TimelineItem status={step.status === 'error' ? 'default' : 'done'}>
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
      <TimelineDot
        status="custom"
        style={getSemanticStepDotStyle(step)}
        customIcon={
          isRunning ? (
            <Loader2 size={9} style={{ animation: 'spin 1s linear infinite' }} />
          ) : step.status === 'error' ? (
            <AlertCircle size={9} style={{ color: '#ef4444' }} />
          ) : (
            <Sparkles style={{ width: 8.5, height: 8.5, strokeWidth: 2.5, flexShrink: 0 }} />
          )
        }
      />
      {!isLast && <TimelineLine done={step.status !== 'pending'} />}
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
 * MCP Tool Call Step with Server name, Tool name, and expandable arguments/output
 */
function MCPStepItem({ step, isLast }: { step: AgentTimelineStep; isLast: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const server = step.serverName || 'mcp';
  const tool = step.toolName || step.title;

  return (
    <TimelineItem status={step.status === 'error' ? 'default' : 'done'}>
      <TimelineHeading side="right" variant="primary" className="text-xs font-medium truncate w-full">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '1px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 600,
              backgroundColor: 'rgba(249, 115, 22, 0.15)',
              color: '#FB923C',
              border: '1px solid rgba(249, 115, 22, 0.35)',
            }}
          >
            {server}
          </span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tool}</span>
          {(step.toolInput || step.toolOutput || step.content) && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                all: 'unset',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                color: 'var(--text-muted, #8e8e8e)',
                marginLeft: 'auto',
              }}
            >
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          )}
        </div>
      </TimelineHeading>
      <TimelineDot
        status="custom"
        style={getSemanticStepDotStyle(step)}
        customIcon={<Plug style={ICON_STYLE} />}
      />
      {!isLast && <TimelineLine done={step.status !== 'pending'} />}
      <TimelineContent side="right">
        {isExpanded && (
          <div
            style={{
              marginTop: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '11px',
            }}
          >
            {step.toolInput && (
              <div
                style={{
                  padding: '6px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontFamily: 'monospace',
                  color: '#93C5FD',
                  overflowX: 'auto',
                }}
              >
                <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>
                  Input Arguments:
                </div>
                {typeof step.toolInput === 'object' ? JSON.stringify(step.toolInput, null, 2) : String(step.toolInput)}
              </div>
            )}
            {step.toolOutput && (
              <div
                style={{
                  padding: '6px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontFamily: 'monospace',
                  color: '#A7F3D0',
                  overflowX: 'auto',
                  maxHeight: '120px',
                }}
              >
                <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>
                  Response:
                </div>
                {typeof step.toolOutput === 'object' ? JSON.stringify(step.toolOutput, null, 2) : String(step.toolOutput)}
              </div>
            )}
          </div>
        )}
      </TimelineContent>
    </TimelineItem>
  );
}

/**
 * Web Search Step with Query and Clickable Citations / Sources
 */
function WebSearchStepItem({ step, isLast }: { step: AgentTimelineStep; isLast: boolean }) {
  return (
    <TimelineItem status={step.status === 'error' ? 'default' : 'done'}>
      <TimelineHeading side="right" variant="primary" className="text-xs font-medium truncate w-full">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{step.title}</span>
          {step.searchQuery && (
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                color: 'var(--text-primary)',
                opacity: 0.9,
              }}
            >
              "{step.searchQuery}"
            </span>
          )}
        </div>
      </TimelineHeading>
      <TimelineDot
        status="custom"
        style={getSemanticStepDotStyle(step)}
        customIcon={<Globe style={ICON_STYLE} />}
      />
      {!isLast && <TimelineLine done={step.status !== 'pending'} />}
      <TimelineContent side="right">
        {step.sources && step.sources.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
              marginTop: '4px',
            }}
          >
            {step.sources.map((src, i) => (
              <a
                key={src.url || i}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-secondary, #a3a3a3)',
                  textDecoration: 'none',
                  fontSize: '10.5px',
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = 'var(--text-primary, #ffffff)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = 'var(--text-secondary, #a3a3a3)';
                }}
              >
                <Globe size={10} style={{ opacity: 0.7 }} />
                <span>{src.domain || src.title || new URL(src.url).hostname}</span>
                <ExternalLink size={9} style={{ opacity: 0.5 }} />
              </a>
            ))}
          </div>
        )}
      </TimelineContent>
    </TimelineItem>
  );
}

/**
 * CRUD / File Operation Step with Diff Indicators and Inline Diff Preview
 */
function FileCrudStepItem({
  step,
  isLast,
  onClickFile,
}: {
  step: AgentTimelineStep;
  isLast: boolean;
  onClickFile?: () => void;
}) {
  const [showDiff, setShowDiff] = useState(false);
  const actionType = step.actionType ?? (step.type === 'create_file' ? 'create' : step.type === 'delete_file' ? 'delete' : 'modify');

  const actionTagStyle: Record<string, { label: string; bg: string; color: string; border: string }> = {
    create: { label: 'NEW', bg: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: 'rgba(16, 185, 129, 0.3)' },
    modify: { label: 'EDIT', bg: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', border: 'rgba(59, 130, 246, 0.3)' },
    delete: { label: 'DEL', bg: 'rgba(239, 68, 68, 0.15)', color: '#F87171', border: 'rgba(239, 68, 68, 0.3)' },
    read:   { label: 'READ', bg: 'rgba(156, 163, 175, 0.15)', color: '#9CA3AF', border: 'rgba(156, 163, 175, 0.3)' },
  };

  const tag = actionTagStyle[actionType] || actionTagStyle.modify;
  const added = step.diffAdded ?? step.diffCount ?? 0;
  const removed = step.diffRemoved ?? 0;

  return (
    <TimelineItem status={step.status === 'error' ? 'default' : 'done'}>
      <TimelineHeading side="right" variant="primary" className="text-xs font-medium truncate w-full">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
          <span
            style={{
              padding: '1px 5px',
              borderRadius: '3px',
              fontSize: '9.5px',
              fontWeight: 700,
              backgroundColor: tag.bg,
              color: tag.color,
              border: `1px solid ${tag.border}`,
            }}
          >
            {tag.label}
          </span>
          {step.fileName && (
            <span
              onClick={onClickFile}
              style={{
                color: 'var(--text-primary)',
                fontWeight: 600,
                cursor: onClickFile ? 'pointer' : 'default',
                textDecoration: onClickFile ? 'underline dotted' : 'none',
                textUnderlineOffset: '3px',
              }}
            >
              {step.fileName}
            </span>
          )}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: 4 }}>
            {added > 0 && (
              <span style={{ color: '#10B981', fontWeight: 700, fontSize: '10px' }}>
                +{added}
              </span>
            )}
            {removed > 0 && (
              <span style={{ color: '#EF4444', fontWeight: 700, fontSize: '10px' }}>
                -{removed}
              </span>
            )}
          </div>
          {step.diffPreview && (
            <button
              type="button"
              onClick={() => setShowDiff(!showDiff)}
              style={{
                all: 'unset',
                cursor: 'pointer',
                fontSize: '10px',
                color: 'var(--text-muted)',
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              {showDiff ? 'Hide Diff' : 'Diff'}
              {showDiff ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            </button>
          )}
        </div>
      </TimelineHeading>
      <TimelineDot
        status="custom"
        style={getSemanticStepDotStyle(step)}
        customIcon={
          actionType === 'create' ? (
            <FilePlus style={ICON_STYLE} />
          ) : actionType === 'delete' ? (
            <Trash2 style={ICON_STYLE} />
          ) : (
            <FileCode style={ICON_STYLE} />
          )
        }
      />
      {!isLast && <TimelineLine done={step.status !== 'pending'} />}
      <TimelineContent side="right">
        {step.diffPreview && showDiff && (
          <pre
            style={{
              padding: '6px 8px',
              borderRadius: '4px',
              backgroundColor: '#090D16',
              border: '1px solid var(--border-subtle)',
              fontSize: '10.5px',
              fontFamily: 'monospace',
              lineHeight: 1.45,
              overflowX: 'auto',
              maxHeight: '140px',
              margin: '4px 0 0 0',
              color: '#D1D5DB',
            }}
          >
            {step.diffPreview.split('\n').map((line, idx) => {
              const isAdd = line.startsWith('+');
              const isDel = line.startsWith('-');
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: isAdd ? 'rgba(16, 185, 129, 0.12)' : isDel ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
                    color: isAdd ? '#34D399' : isDel ? '#F87171' : 'inherit',
                  }}
                >
                  {line}
                </div>
              );
            })}
          </pre>
        )}
      </TimelineContent>
    </TimelineItem>
  );
}

/**
 * Single step dispatcher
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
  const isThought = step.type === 'thought' || step.type === 'thinking';
  if (isThought) return <ThoughtStepItem step={step} isLast={isLast} />;

  const isMCP = step.type === 'mcp' || step.type === 'connector';
  if (isMCP) return <MCPStepItem step={step} isLast={isLast} />;

  const isWebSearch = step.type === 'web_search' || step.type === 'searching' || step.type === 'search';
  if (isWebSearch) return <WebSearchStepItem step={step} isLast={isLast} />;

  const isFileOp =
    step.type === 'create_file' ||
    step.type === 'edit_file' ||
    step.type === 'delete_file' ||
    step.type === 'edited' ||
    step.type === 'edit' ||
    step.type === 'crud' ||
    Boolean(step.fileName && (step.diffAdded != null || step.diffCount != null || step.diffPreview));
  if (isFileOp) return <FileCrudStepItem step={step} isLast={isLast} onClickFile={onClickFile} />;

  const isTool = step.type === 'ran' || step.type === 'tool' || step.type === 'terminal' || step.type === 'command';
  const Icon = STEP_ICON[step.type];
  const iconEl = Icon ? <Icon style={step.type === 'done' ? DONE_ICON_STYLE : ICON_STYLE} /> : undefined;

  return (
    <TimelineItem status={step.status === 'error' ? 'default' : 'done'}>
      <TimelineHeading side="right" variant="primary" className="text-xs font-medium truncate w-full">
        {step.title}
      </TimelineHeading>
      <TimelineDot status="custom" style={getSemanticStepDotStyle(step)} customIcon={iconEl} />
      {!isLast && <TimelineLine done={step.status !== 'pending'} />}
      <TimelineContent side="right">
        {isTool ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {step.command && (
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'monospace', fontSize: '11px' }}>
                $ {step.command}
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
        ) : (
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {step.content && <span style={{ fontSize: '11px' }}>{step.content}</span>}
          </div>
        )}
      </TimelineContent>
    </TimelineItem>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Reusable Antigravity Agent Step & Thought Execution Timeline Component.
 *
 * Implements the Hybrid 1-Line Collapsible + Nested Tree Architecture:
 * - 1-Line Compact Summary Pill (default when finished, avoids cluttering the chat)
 * - Auto-expands during streaming for real-time visibility
 * - Clickable to expand/collapse the full nested step-by-step breakdown & diff previews
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
    if (customSteps?.length) {
      if ('phase' in (customSteps as any)[0]) {
        return adaptAgentSteps(customSteps as any);
      }
      return customSteps as AgentTimelineStep[];
    }
    return parseReasoningAndActionsToSteps(reasoningContent, actions, isStreaming);
  }, [customSteps, reasoningContent, actions, isStreaming]);

  // Expand by default if streaming, otherwise start collapsed for a clean 1-line view
  const [isExpanded, setIsExpanded] = useState(isStreaming);

  React.useEffect(() => {
    if (isStreaming) {
      setIsExpanded(true);
    }
  }, [isStreaming]);

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

  // Compute 1-line summary highlights
  const summaryText = useMemo(() => {
    if (isStreaming) {
      const runningStep = steps.find((s) => s.status === 'running') || steps[steps.length - 1];
      if (runningStep) {
        return language === 'id'
          ? `Sedang menjalankan: ${runningStep.title}`
          : `Executing: ${runningStep.title}`;
      }
      return language === 'id' ? 'Sedang memproses langkah agen...' : 'Processing agent steps...';
    }

    const fileOpsCount = steps.filter((s) =>
      ['create_file', 'edit_file', 'delete_file', 'edited', 'edit', 'crud'].includes(s.type) || Boolean(s.fileName)
    ).length;
    const toolOpsCount = steps.filter((s) => ['tool', 'mcp', 'connector', 'ran', 'terminal'].includes(s.type)).length;
    const searchOpsCount = steps.filter((s) => ['web_search', 'searching', 'search'].includes(s.type)).length;
    const hasThought = steps.some((s) => ['thought', 'thinking'].includes(s.type));

    const parts: string[] = [];
    if (hasThought) parts.push('Thinking');
    if (fileOpsCount > 0) parts.push(language === 'id' ? `${fileOpsCount} file` : `${fileOpsCount} files`);
    if (searchOpsCount > 0) parts.push(language === 'id' ? `${searchOpsCount} web search` : `${searchOpsCount} searches`);
    if (toolOpsCount > 0) parts.push(language === 'id' ? `${toolOpsCount} tool` : `${toolOpsCount} tools`);

    const detailsStr = parts.length > 0 ? ` (${parts.join(', ')})` : '';
    return language === 'id'
      ? `${steps.length} langkah agen selesai${detailsStr}`
      : `${steps.length} agent steps completed${detailsStr}`;
  }, [steps, isStreaming, language]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        margin: '4px 0 8px 0',
        padding: 0,
        fontSize: '12px',
        fontFamily: 'inherit',
      }}
    >
      {/* 1-Line Hybrid Summary Pill Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: isExpanded ? '8px' : '0' }}>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '2px 0',
            background: 'transparent',
            border: 'none',
            color: isStreaming ? 'var(--brand-primary, #818CF8)' : 'var(--text-secondary, #9CA3AF)',
            fontSize: '11.5px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'color 0.15s ease',
            userSelect: 'none',
            maxWidth: '100%',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary, #FFFFFF)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = isStreaming
              ? 'var(--brand-primary, #818CF8)'
              : 'var(--text-secondary, #9CA3AF)';
          }}
        >
          {isStreaming ? (
            <Loader2 size={12} className="animate-spin" style={{ color: 'var(--brand-primary, #818CF8)', flexShrink: 0 }} />
          ) : (
            <Sparkles size={12} style={{ color: 'var(--brand-primary, #818CF8)', flexShrink: 0 }} />
          )}

          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '380px',
            }}
          >
            {summaryText}
          </span>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              fontSize: '10.5px',
              color: 'var(--text-muted, #6B7280)',
              marginLeft: '4px',
            }}
          >
            {isExpanded
              ? language === 'id'
                ? 'Tutup'
                : 'Hide'
              : language === 'id'
              ? 'Detail'
              : 'Details'}
            {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </span>
        </button>
      </div>

      {/* Nested Step-by-Step Tree (renders when expanded) */}
      {isExpanded && (
        <div
          style={{
            paddingLeft: '2px',
            paddingTop: '6px',
            animation: 'fadeIn 0.15s ease-out',
            width: '100%',
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
      )}
    </div>
  );
}
