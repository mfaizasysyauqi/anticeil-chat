'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  Search,
  Laptop,
  Lightbulb,
  Cpu,
  FileText,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { getTranslation } from '@anticeil/core';

interface ThinkingStep {
  id: string;
  iconType: 'globe' | 'search' | 'laptop' | 'lightbulb' | 'cpu' | 'file' | 'check';
  title: string;
  detail?: string;
  status: 'done' | 'active';
}

interface ThinkingTimelineProps {
  reasoningContent?: string;
  isStreaming?: boolean;
  timestamp?: number;
  modelName?: string;
}

export function ThinkingTimeline({
  reasoningContent = '',
  isStreaming = false,
}: ThinkingTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);

  // Live timer when streaming
  useEffect(() => {
    if (!isStreaming) return;
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(1, Math.floor((Date.now() - start) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [isStreaming]);

  // Parse raw reasoning content or stream into structured steps (memoized)
  const steps: ThinkingStep[] = useMemo(
    () => parseReasoningToSteps(reasoningContent, isStreaming),
    [reasoningContent, isStreaming]
  );

  if (!reasoningContent && !isStreaming) return null;

  return (
    <div
      style={{
        margin: '6px 0 10px 0',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        boxShadow: 'var(--inner-glow)',
      }}
    >
      {/* Header Accordion Toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          fontSize: '12px',
          fontWeight: 600,
          textAlign: 'left',
          transition: 'background 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isStreaming ? 'var(--accent-warning)' : 'var(--accent-reasoning)',
              boxShadow: isStreaming ? '0 0 8px var(--accent-warning)' : 'none',
              animation: isStreaming ? 'pulseDot 1.2s infinite' : 'none',
            }}
          />
          <span style={{ color: 'var(--text-primary)' }}>
            {isStreaming ? t.chat.thinking : t.chat.reasoning}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            ({steps.length} {steps.length === 1 ? 'step' : 'steps'}
            {elapsedSeconds > 0 ? ` • ${elapsedSeconds}s` : ''})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
          <span style={{ fontSize: '11px' }}>{isExpanded ? t.chat.hideThought : t.chat.showThought}</span>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>

      {/* Timeline Steps Body */}
      {isExpanded && (
        <div
          style={{
            padding: '10px 14px 14px 14px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ position: 'relative', paddingLeft: '18px' }}>
            {/* Vertical Connector Rail */}
            <div
              style={{
                position: 'absolute',
                left: '7px',
                top: '10px',
                bottom: '12px',
                width: '1px',
                background: 'dashed',
                borderLeft: '1px dashed var(--border-strong)',
              }}
            />

            {/* Render Each Step in Timeline */}
            {steps.map((step, idx) => {
              const isLast = idx === steps.length - 1;
              const isStepActive = isStreaming && isLast;

              return (
                <div
                  key={step.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    marginBottom: isLast ? 0 : '10px',
                    position: 'relative',
                  }}
                >
                  {/* Step Node Icon */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '-18px',
                      top: '2px',
                      width: '15px',
                      height: '15px',
                      borderRadius: '50%',
                      background: 'var(--bg-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2,
                    }}
                  >
                    {renderStepIcon(step.iconType, isStepActive)}
                  </div>

                  {/* Step Text Details with Rendered Inline Formatting */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '12px',
                        color: isStepActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        lineHeight: 1.45,
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: isStepActive ? 600 : 500,
                      }}
                    >
                      {renderStepInlineText(step.title)}
                    </div>

                    {step.detail && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          marginTop: '3px',
                          fontFamily: 'Inter, sans-serif',
                          lineHeight: 1.45,
                        }}
                      >
                        {renderStepInlineText(step.detail)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Active Working Timer Node if streaming */}
            {isStreaming && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '10px',
                  fontSize: '11px',
                  color: 'var(--accent-warning)',
                  fontWeight: 600,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: '-18px',
                    top: '2px',
                    width: '15px',
                    height: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-warning)',
                      animation: 'pulseDot 1s infinite',
                    }}
                  />
                </div>
                <span>Working for {elapsedSeconds}s...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function renderStepIcon(type: ThinkingStep['iconType'], isActive: boolean) {
  const size = 12;
  const color = isActive ? 'var(--accent-warning)' : 'var(--text-secondary)';

  switch (type) {
    case 'globe':
      return <Globe size={size} color={color} />;
    case 'search':
      return <Search size={size} color={color} />;
    case 'laptop':
      return <Laptop size={size} color={color} />;
    case 'cpu':
      return <Cpu size={size} color={color} />;
    case 'file':
      return <FileText size={size} color={color} />;
    case 'check':
      return <CheckCircle2 size={size} color="var(--accent-success)" />;
    case 'lightbulb':
    default:
      return <Lightbulb size={size} color={color} />;
  }
}

/**
 * Render inline formatting for step text: renders **bold** as real strong tags,
 * `code` as inline monospace tags, and handles line breaks cleanly.
 */
function renderStepInlineText(rawText: string): React.ReactNode[] {
  const lines = rawText.split('\n');

  return lines.map((line, lineIdx) => {
    const parts = line.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

    return (
      <React.Fragment key={lineIdx}>
        {parts.map((part, partIdx) => {
          if (!part) return null;

          if (part.startsWith('**') && part.endsWith('**') && part.length > 3) {
            return (
              <strong key={partIdx} style={{ fontWeight: 650, color: 'var(--text-primary)' }}>
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
            return (
              <code
                key={partIdx}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '3px',
                  padding: '1px 4px',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono, monospace',
                  color: 'var(--brand-primary)',
                }}
              >
                {part.slice(1, -1)}
              </code>
            );
          }
          if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
            return <em key={partIdx}>{part.slice(1, -1)}</em>;
          }

          return <span key={partIdx}>{part}</span>;
        })}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

/**
 * Intelligent parser that converts reasoning text / thought stream into structured timeline steps.
 * Automatically cleans boilerplate web scraper text, duplicates, and noise.
 */
function parseReasoningToSteps(rawContent: string, isStreaming: boolean): ThinkingStep[] {
  if (!rawContent || rawContent.trim().length === 0) {
    if (isStreaming) {
      return [
        {
          id: 'step-init',
          iconType: 'cpu',
          title: 'Analyzing context & reasoning',
          status: 'active',
        },
      ];
    }
    return [];
  }

  // 1. Clean raw XML tags and web scrapings noise
  const cleanReasoning = rawContent
    .replace(/<\/?(?:think|tool|output|call|function_call|tool_call)[^>]*>/gi, '')
    .replace(/%3Cpath[\s\S]*?%3E/gi, '')
    .replace(/<path[\s\S]*?>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/Your browser doesn't support HTML5 audio/gi, '')
    .replace(/Score:\s*0\.\d+/gi, '')
    .trim();

  // 2. Split by bullet points, headers, or double newlines
  const rawSegments = cleanReasoning
    .split(/\n\s*\n|\n(?=[0-9]+\.|\*|-|Step\s+[0-9]+:|Searched web|Retrieved info|Ran tool:)/g)
    .map((s) => s.trim())
    .filter((s) => {
      if (!s || s.length < 5) return false;
      const lower = s.toLowerCase();
      // Filter out junk lines
      if (
        lower.includes('browser doesn\'t support') ||
        lower.includes('gradientunits') ||
        lower.includes('stop-opacity') ||
        lower.startsWith('score:') ||
        lower.startsWith('url: http')
      ) {
        return false;
      }
      return true;
    });

  if (rawSegments.length === 0) {
    return [
      {
        id: 'step-0',
        iconType: 'lightbulb',
        title: cleanReasoning.slice(0, 120),
        status: isStreaming ? 'active' : 'done',
      },
    ];
  }

  // 3. Deduplicate identical or near-identical steps
  const uniqueSegments: string[] = [];
  for (const seg of rawSegments) {
    const firstLine = seg.split('\n')[0].replace(/^[0-9]+[.)]\s*|^[-*]\s*|^#+\s*/, '').trim();
    if (!uniqueSegments.some((existing) => existing.toLowerCase().includes(firstLine.toLowerCase()) || firstLine.toLowerCase().includes(existing.toLowerCase()))) {
      uniqueSegments.push(seg);
    }
  }

  // Limit to at most 8 focused steps
  const finalSegments = uniqueSegments.slice(0, 8);

  return finalSegments.map((seg, index) => {
    const isLast = index === finalSegments.length - 1;
    const lower = seg.toLowerCase();

    let iconType: ThinkingStep['iconType'] = 'lightbulb';
    if (lower.includes('searched web') || lower.includes('search(') || lower.includes('query')) {
      iconType = 'search';
    } else if (lower.includes('ran tool:') || lower.includes('python') || lower.includes('script')) {
      iconType = 'laptop';
    } else if (lower.includes('retrieved info') || lower.includes('opened page') || lower.includes('http') || lower.includes('.com') || lower.includes('whois')) {
      iconType = 'globe';
    } else if (lower.includes('document') || lower.includes('file') || lower.includes('pdf') || lower.includes('sheet')) {
      iconType = 'file';
    } else if (lower.includes('calculat') || lower.includes('comput') || lower.includes('process') || lower.includes('token')) {
      iconType = 'cpu';
    } else if (!isStreaming && isLast) {
      iconType = 'check';
    }

    const lines = seg.split('\n');
    const firstLine = lines[0].replace(/^[0-9]+[.)]\s*|^[-*]\s*|^#+\s*/, '');
    const title = firstLine.slice(0, 120);
    const detail = lines.length > 1 ? lines.slice(1).join('\n').trim().slice(0, 200) : undefined;

    return {
      id: `step-${index}`,
      iconType,
      title: title || seg.slice(0, 80),
      detail,
      status: isStreaming && isLast ? 'active' : 'done',
    };
  });
}
