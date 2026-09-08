"use client";

import * as React from "react";
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  Loader2,
  Lightbulb,
  BrainCircuit,
  Wrench,
  FileSearch,
} from "lucide-react";

export type AgentPhase = "reasoning" | "tool_call" | "synthesis" | "result";
export type AgentStepStatus = "pending" | "active" | "complete";

export interface AgentTimelineStep {
  id: string;
  phase: AgentPhase;
  title: string;
  description?: string;
  status?: AgentStepStatus;
  timestamp?: number;
  content?: string;
  badge?: string;
}

export interface AgentTimelineProps {
  steps: AgentTimelineStep[];
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  language?: "id" | "en";
  className?: string;
}

const phaseConfig: Record<AgentPhase, { label: string; icon: React.ReactNode; bg: string; border: string; text: string; line: string }> = {
  reasoning: {
    label: "Reasoning",
    icon: <BrainCircuit size={12} />,
    bg: "rgba(162,93,220,0.12)",
    border: "rgba(162,93,220,0.25)",
    text: "var(--accent-reasoning)",
    line: "rgba(162,93,220,0.3)",
  },
  tool_call: {
    label: "Tool Call",
    icon: <Wrench size={12} />,
    bg: "rgba(0,115,234,0.12)",
    border: "rgba(0,115,234,0.25)",
    text: "var(--brand-primary)",
    line: "rgba(0,115,234,0.3)",
  },
  synthesis: {
    label: "Synthesis",
    icon: <FileSearch size={12} />,
    bg: "rgba(253,171,61,0.12)",
    border: "rgba(253,171,61,0.25)",
    text: "var(--accent-warning)",
    line: "rgba(253,171,61,0.3)",
  },
  result: {
    label: "Result",
    icon: <CheckCircle2 size={12} />,
    bg: "rgba(0,200,117,0.12)",
    border: "rgba(0,200,117,0.25)",
    text: "var(--accent-success)",
    line: "rgba(0,200,117,0.3)",
  },
};

export function AgentTimeline({
  steps,
  isOpen: controlledOpen,
  defaultOpen = true,
  onOpenChange,
  title = "Agent Timeline",
  language = "en",
  className = "",
}: AgentTimelineProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolled;

  const toggle = () => {
    const next = !open;
    if (controlledOpen === undefined) setUncontrolled(next);
    onOpenChange?.(next);
  };

  return (
    <div className={className} style={{ width: "100%", animation: "fadeIn 0.2s ease-out" }}>
      <button
        onClick={toggle}
        type="button"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          padding: "6px 4px",
          background: "transparent",
          border: "none",
          borderRadius: "var(--radius-sm)",
          color: "var(--text-secondary)",
          fontSize: "10.5px",
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          cursor: "pointer",
          userSelect: "none",
        }}
        aria-label={language === "id" ? "Toggle timeline" : "Toggle timeline"}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Lightbulb size={13} color="var(--text-muted)" />
          {title}
          <span
            style={{
              fontSize: "9px",
              padding: "1px 4px",
              borderRadius: "9999px",
              background: "var(--bg-subtle)",
              color: "var(--text-muted)",
              fontWeight: 500,
            }}
          >
            {steps.length}
          </span>
        </span>
        <ChevronDown
          size={12}
          color="var(--text-muted)"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
        />
      </button>

      <div
        style={{
          overflow: "hidden",
          maxHeight: open ? "800px" : "0px",
          transition: "max-height 0.3s ease",
          borderLeft: "2px solid var(--border-subtle)",
          paddingLeft: "12px",
          marginLeft: "2px",
          paddingBottom: open ? "4px" : "0px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "6px" }}>
          {steps.map((step, i) => {
            const cfg = phaseConfig[step.phase] || phaseConfig.result;
            const last = i === steps.length - 1;
            return (
              <div key={step.id} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                {/* Timeline line + icon */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "24px" }}>
                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                      color: cfg.text,
                      flexShrink: 0,
                    }}
                  >
                    {step.status === "active" ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : cfg.icon}
                  </div>
                  {!last && (
                    <div
                      style={{
                        width: "2px",
                        flex: 1,
                        minHeight: "16px",
                        background: cfg.line,
                        marginTop: "2px",
                        borderRadius: "1px",
                      }}
                    />
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0, paddingBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {step.title || cfg.label}
                    </span>
                    {step.badge && (
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 700,
                          padding: "1px 4px",
                          borderRadius: "var(--radius-full)",
                          background: "rgba(0,115,234,0.08)",
                          color: "var(--brand-primary)",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {step.badge}
                      </span>
                    )}
                    {step.status === "complete" && (
                      <CheckCircle2 size={10} color="var(--accent-success)" />
                    )}
                  </div>
                  <div style={{ fontSize: "10.5px", color: "var(--text-secondary)", lineHeight: 1.35, wordBreak: "break-word", marginTop: "2px" }}>
                    {step.description || step.content || "—"}
                  </div>
                  {step.timestamp && (
                    <div style={{ fontSize: "9.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {new Date(step.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* Convenience wrapper matching AIChatBubble prop interface */
export function AgentTimelineInline({ agentSteps, isStreaming }: { agentSteps?: AgentTimelineStep[]; isStreaming?: boolean }) {
  if (!agentSteps || agentSteps.length === 0) return null;
  return <AgentTimeline steps={agentSteps} defaultOpen={!!isStreaming} />;
}
