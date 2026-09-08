'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Sparkles,
  FileCode,
  Globe,
  Terminal,
  CheckCircle2,
  Search,
  Eye,
  Brain,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useDocsStore } from '../../features/docs/store/useDocsStore';

export interface AgentTimelineStep {
  id: string;
  type: 'thought' | 'explored' | 'analyzed' | 'edited' | 'checked' | 'ran' | 'searching' | 'custom';
  title: string;
  durationSeconds?: number;
  fileName?: string;
  fileId?: string;
  diffCount?: number;
  command?: string;
  content?: string;
  isStreaming?: boolean;
  defaultExpanded?: boolean;
}

export interface AgentStepTimelineProps {
  steps?: AgentTimelineStep[];
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

  // Parse reasoning text into distinct thought blocks (split by double newlines or headers)
  if (reasoningContent && reasoningContent.trim()) {
    const rawBlocks = reasoningContent
      .trim()
      .split(/\n\n+/)
      .filter((b) => b.trim().length > 0);

    let estDuration = Math.max(1, Math.floor(reasoningContent.length / 140));

    if (rawBlocks.length === 1) {
      result.push({
        id: 'thought_0',
        type: 'thought',
        title: `Thought for ${estDuration}s`,
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
          title: `Thought for ${stepDuration}s`,
          durationSeconds: stepDuration,
          content: block,
          isStreaming: isStreaming && isLastBlock,
          defaultExpanded: isStreaming && isLastBlock,
        });

        // Interleave action steps if available
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
            title: actType === 'edited' ? `Edited` : actType === 'checked' ? `Checked` : `Analyzed`,
            fileName: act.name,
            diffCount: 1,
          });
        }
      });
    }
  }

  // Add remaining actions if any were not interleaved
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
          title: actType === 'edited' ? `Edited` : actType === 'checked' ? `Checked` : `Analyzed`,
          fileName: act.name,
          diffCount: 1,
        });
      }
    });
  }

  // If no thoughts were parsed, provide active streaming step or fallback action steps
  if (result.length === 0) {
    if (isStreaming) {
      result.push({
        id: 'active_streaming_step',
        type: 'thought',
        title: 'Menganalisis dokumen & mempersiapkan perubahan...',
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

/**
 * Single Step Component with independent collapse/expand state
 */
function TimelineStepItem({
  step,
  docId,
  onOpenFile,
}: {
  step: AgentTimelineStep;
  docId?: string;
  onOpenFile?: (fileName: string, fileId?: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState<boolean>(
    step.defaultExpanded ?? false
  );

  const setActiveFileId = useDocsStore((s) => s.setActiveFileId);
  const documents = useDocsStore((s) => s.documents);

  const handleFileClick = () => {
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

  // 1. Thought step with markdown content
  if (step.type === 'thought') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'transparent',
            border: 'none',
            padding: '2px 0',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            fontFamily: 'inherit',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left',
            userSelect: 'none',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          <span style={{ color: 'var(--text-muted)' }}>{step.title}</span>
          {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          {step.isStreaming && (
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: '#3B82F6',
                boxShadow: '0 0 6px #3B82F6',
                animation: 'pulse 1.2s infinite',
                display: 'inline-block',
              }}
            />
          )}
        </button>

        {isExpanded && step.content && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              fontSize: '12.5px',
              lineHeight: 1.5,
              color: 'var(--text-secondary)',
              marginTop: '2px',
              marginBottom: '4px',
              maxWidth: '100%',
              overflowX: 'auto',
            }}
          >
            <MarkdownRenderer content={step.content} />
          </div>
        )}
      </div>
    );
  }

  // 2. Analyzed / Edited / Explored / Checked step chips
  if (step.type === 'analyzed' || step.type === 'edited' || step.type === 'explored' || step.type === 'checked') {
    const isEdit = step.type === 'edited';
    const isChecked = step.type === 'checked';
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', margin: '2px 0' }}>
        <button
          type="button"
          onClick={handleFileClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 8px 3px 6px',
            borderRadius: '6px',
            backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
            border: isChecked ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            fontFamily: 'inherit',
            cursor: step.fileName ? 'pointer' : 'default',
            transition: 'all 0.15s ease',
            userSelect: 'none',
          }}
          onMouseEnter={(e) => {
            if (step.fileName) {
              e.currentTarget.style.backgroundColor = isChecked ? 'rgba(16, 185, 129, 0.14)' : 'rgba(255, 255, 255, 0.07)';
              e.currentTarget.style.borderColor = isChecked ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.16)';
            }
          }}
          onMouseLeave={(e) => {
            if (step.fileName) {
              e.currentTarget.style.backgroundColor = isChecked ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.borderColor = isChecked ? '1px solid rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.08)';
            }
          }}
        >
          <span style={{ color: isChecked ? '#10B981' : 'var(--text-muted)', fontWeight: isChecked ? 600 : 400 }}>
            {step.title || (isChecked ? 'Checked' : isEdit ? 'Edited' : 'Analyzed')}
          </span>
          {isChecked ? (
            <CheckCircle2 size={13} style={{ color: '#10B981' }} />
          ) : (
            <FileCode size={13} style={{ color: '#3B82F6' }} />
          )}
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            {step.fileName || 'file'}
          </span>
          {isEdit && step.diffCount && (
            <span style={{ color: '#10B981', fontWeight: 600, fontSize: '11px' }}>
              +{step.diffCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  // 3. Ran Command step
  if (step.type === 'ran') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'transparent',
            border: 'none',
            padding: '2px 0',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            fontFamily: 'inherit',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left',
            userSelect: 'none',
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>Ran</span>
          <Terminal size={12} style={{ color: 'var(--text-muted)' }} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'monospace' }}>
            {step.command || step.title}
          </span>
          {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>

        {isExpanded && step.content && (
          <pre
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: '#090D16',
              border: '1px solid var(--border-subtle)',
              fontSize: '11px',
              fontFamily: 'monospace',
              color: '#A7F3D0',
              overflowX: 'auto',
              maxHeight: '120px',
              margin: '2px 0 4px 0',
            }}
          >
            {step.content}
          </pre>
        )}
      </div>
    );
  }

  // 4. Searching / Checked step
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
      {step.type === 'searching' ? <Globe size={12} color="#3B82F6" /> : <CheckCircle2 size={12} color="#10B981" />}
      <span>{step.title}</span>
    </div>
  );
}

/**
 * Reusable Antigravity Agent Step & Thought Execution Timeline Component
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
  const [isGroupExpanded, setIsGroupExpanded] = useState<boolean>(isStreaming);

  useEffect(() => {
    if (!isStreaming) {
      setIsGroupExpanded(false);
    }
  }, [isStreaming]);

  // Compute final step list (either explicitly passed customSteps or parsed from reasoning/actions)
  const steps: AgentTimelineStep[] = useMemo(() => {
    if (customSteps && customSteps.length > 0) return customSteps;
    return parseReasoningAndActionsToSteps(reasoningContent, actions, isStreaming);
  }, [customSteps, reasoningContent, actions, isStreaming]);

  // Total duration estimation (must be computed unconditionally before any early return)
  const totalSeconds = useMemo(() => {
    return steps.reduce((acc, curr) => acc + (curr.durationSeconds || 1), 0);
  }, [steps]);

  if (steps.length === 0 && !isStreaming) return null;

  const durationLabel = totalSeconds >= 60 ? `${Math.floor(totalSeconds / 60)}m` : `${totalSeconds}s`;
  const summaryTitle = isStreaming
    ? (language === 'id' ? 'Sedang bekerja...' : 'Working...')
    : (language === 'id' ? `Worked for ${durationLabel}` : `Worked for ${durationLabel}`);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        width: '100%',
        margin: '4px 0 8px 0',
        fontSize: '12px',
        fontFamily: 'inherit',
      }}
    >
      {/* Outer Group Accordion Header (Worked for 1m v) */}
      <button
        type="button"
        onClick={() => setIsGroupExpanded(!isGroupExpanded)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'transparent',
          border: 'none',
          padding: '2px 0',
          color: 'var(--text-secondary)',
          fontSize: '12.5px',
          fontWeight: 600,
          cursor: 'pointer',
          textAlign: 'left',
          userSelect: 'none',
          width: 'fit-content',
        }}
      >
        <span>{summaryTitle}</span>
        {isGroupExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* Nested Step List */}
      {isGroupExpanded && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            paddingLeft: '12px',
            borderLeft: '2px solid var(--border-subtle)',
            marginLeft: '2px',
            paddingBottom: isGroupExpanded ? '4px' : '0px',
          }}
        >
          {steps.map((step) => (
            <TimelineStepItem
              key={step.id}
              step={step}
              docId={docId}
              onOpenFile={onOpenFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}
