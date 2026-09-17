'use client';

import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimelineStep {
  id: string;
  title: string;
  status: 'done' | 'current' | 'pending' | 'error';
  description?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export interface TimelineProps {
  steps: TimelineStep[];
  compact?: boolean;
  direction?: 'vertical' | 'horizontal';
  showLine?: boolean;
  className?: string;
}

export function Timeline({
  steps,
  compact = false,
  direction = 'vertical',
  showLine = true,
  className,
}: TimelineProps) {
  if (direction === 'horizontal') {
    return (
      <div className={cn('flex items-center gap-3 w-full overflow-x-auto py-2', className)}>
        {steps.map((step, idx) => {
          const isDone = step.status === 'done';
          const isCurrent = step.status === 'current';
          const isError = step.status === 'error';

          return (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all',
                    isDone && 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
                    isCurrent && 'bg-blue-500/20 text-blue-400 border border-blue-500/40 animate-pulse',
                    isError && 'bg-rose-500/20 text-rose-400 border border-rose-500/40',
                    !isDone && !isCurrent && !isError && 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                  )}
                >
                  {isDone ? <Check size={12} /> : isCurrent ? <Loader2 size={12} className="animate-spin" /> : idx + 1}
                </div>
                <span className={cn('text-xs font-medium', isCurrent ? 'text-zinc-100' : 'text-zinc-400')}>
                  {step.title}
                </span>
              </div>
              {showLine && idx < steps.length - 1 && (
                <div className="flex-1 min-w-[24px] h-[1px] bg-zinc-800" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2 w-full', className)}>
      {steps.map((step, idx) => {
        const isDone = step.status === 'done';
        const isCurrent = step.status === 'current';
        const isError = step.status === 'error';

        return (
          <div key={step.id} className="relative flex items-start gap-3">
            {/* Step Icon */}
            <div className="relative z-10 flex items-center justify-center mt-0.5">
              <div
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold',
                  isDone && 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
                  isCurrent && 'bg-blue-500/20 text-blue-400 border border-blue-500/40 animate-pulse',
                  isError && 'bg-rose-500/20 text-rose-400 border border-rose-500/40',
                  !isDone && !isCurrent && !isError && 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                )}
              >
                {step.icon ? (
                  step.icon
                ) : isDone ? (
                  <Check size={10} />
                ) : isCurrent ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : isError ? (
                  <AlertCircle size={10} />
                ) : (
                  idx + 1
                )}
              </div>
            </div>

            {/* Connecting line */}
            {showLine && idx < steps.length - 1 && (
              <div className="absolute left-[9px] top-[20px] bottom-[-8px] w-[1px] bg-zinc-800/80" />
            )}

            {/* Step Body */}
            <div className={cn('flex-1 pb-1', compact ? 'text-xs' : 'text-sm')}>
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'font-medium text-xs',
                    isCurrent ? 'text-blue-400 font-semibold' : isDone ? 'text-zinc-300' : 'text-zinc-500'
                  )}
                >
                  {step.title}
                </span>
              </div>
              {step.description && (
                <p className="text-[11px] text-zinc-500 mt-0.5">{step.description}</p>
              )}
              {step.children && <div className="mt-2">{step.children}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export interface TimelineGroupProps {
  label: string;
  steps: TimelineStep[];
  isStreaming?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

export function TimelineGroup({
  label,
  steps,
  isStreaming = false,
  defaultExpanded = true,
  className,
}: TimelineGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={cn('rounded-lg border border-zinc-800 bg-zinc-950/40 p-3', className)}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown size={14} className="text-zinc-400" /> : <ChevronRight size={14} className="text-zinc-400" />}
          <span className="text-xs font-semibold text-zinc-300">{label}</span>
          {isStreaming && <Loader2 size={11} className="text-blue-400 animate-spin" />}
        </div>
        <span className="text-[10px] text-zinc-500 font-medium">{steps.length} steps</span>
      </button>

      {expanded && (
        <div className="mt-3 pl-1">
          <Timeline steps={steps} compact />
        </div>
      )}
    </div>
  );
}
