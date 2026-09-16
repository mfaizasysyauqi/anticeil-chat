import { AgentStep } from '../types';

export type AgenticMode = 'act' | 'plan' | 'chat';

/**
 * Returns system prompt instructions tailored for the selected agentic mode (Plan, Act, Chat)
 * inspired by the Anticeil Code autonomous agent loop.
 */
export function getAgenticModeInstruction(mode: AgenticMode, format: string = 'latex'): string {
  if (mode === 'plan') {
    return `
AGENTIC EXECUTION MODE: [PLAN MODE] (Architect & Editorial Reviewer)
In this mode, you are an expert Document Architect & Editorial Planner.
- DO NOT apply destructive edits or raw file creation tags (<create_file>, <update_file>, <patch_file>) immediately.
- INSTEAD: Analyze the document workspace, outline the required changes, list sections/modules to modify, identify potential formatting or consistency risks, and formulate a step-by-step Execution Plan.
- Wrap your plan in a structured <plan>...</plan> block with:
  1. 🎯 Objective Summary
  2. 📑 Target Files & Sections Outline
  3. 🛠️ Action Items (Step-by-step roadmap)
  4. ⚠️ Verification & Quality Checklist
- Conclude by asking the user for confirmation to switch to ACT mode and execute the plan automatically.
`;
  }

  if (mode === 'chat') {
    return `
AGENTIC EXECUTION MODE: [CHAT MODE] (Consultant & Advisor)
In this mode, you are a conversational writing consultant, proofreader, and brainstorming partner.
- Answer user questions, provide critique, explain syntax, and discuss document ideas clearly.
- Do NOT output file modification tags unless the user explicitly requests direct document modification.
`;
  }

  // Default: ACT MODE (Executive Autonomous Mode)
  return `
AGENTIC EXECUTION MODE: [ACT MODE] (Executive Autonomous Co-Author)
In this mode, you have FULL AUTONOMOUS EXECUTION authority over the document workspace.
- Break down the task into logical ReAct steps.
- Execute direct file actions using standard tags:
  * <create_file name="path/filename.ext">content</create_file>
  * <patch_file name="path/filename.ext"><find>exact target</find><replace>replacement</replace></patch_file>
  * <update_file name="path/filename.ext">full content</update_file>
  * <delete_file name="path/filename.ext" />
  * <rename_file from="old.ext" to="new.ext" />
- Always maintain clean, valid syntax for the target format (${format}).
`;
}

/**
 * Parses agentic ReAct steps and plan blocks from the LLM response.
 */
export function parseAgenticStepsFromResponse(
  fullText: string,
  reasoning?: string,
  isStreaming: boolean = false
): {
  planContent?: string;
  steps: AgentStep[];
} {
  const steps: AgentStep[] = [];
  const now = Date.now();

  // 1. Thinking / Reasoning Step
  if (reasoning && reasoning.trim()) {
    steps.push({
      id: 'step-reasoning',
      phase: 'thinking',
      title: 'Reasoning & Architecture',
      content: reasoning.trim().slice(0, 300),
      timestamp: now,
      status: isStreaming ? 'running' : 'done',
    });
  }

  // 2. Extract <plan>...</plan> if present
  let planContent: string | undefined;
  const planMatch = /<plan>([\s\S]*?)<\/plan>/i.exec(fullText);
  if (planMatch) {
    planContent = planMatch[1].trim();
    steps.push({
      id: 'step-plan',
      phase: 'plan',
      title: 'Architectural Plan',
      content: planContent.slice(0, 200),
      timestamp: now,
      status: 'done',
      badge: 'Plan',
    });
  }

  // 3. Extract File Actions / Tool Steps
  const actionRegex = /<(create_file|update_file|patch_file|delete_file|rename_file)\s+(?:name=["']([^"']+)["']|from=["']([^"']+)["']\s+to=["']([^"']+)["'])/gi;
  let match;
  let actionIdx = 0;
  while ((match = actionRegex.exec(fullText)) !== null) {
    const tag = match[1];
    const fileName = match[2] || `${match[3]} -> ${match[4]}`;
    const phase: AgentStep['phase'] =
      tag === 'create_file'
        ? 'create'
        : tag === 'delete_file'
        ? 'delete'
        : tag === 'patch_file'
        ? 'patch'
        : 'edit';

    steps.push({
      id: `step-action-${actionIdx++}`,
      phase,
      title: `${tag.replace('_file', '').toUpperCase()}: ${fileName}`,
      content: `Target: ${fileName}`,
      timestamp: now,
      status: isStreaming ? 'running' : 'done',
      badge: tag.replace('_file', ''),
    });
  }

  // 4. Synthesis Step
  if (fullText && fullText.trim()) {
    steps.push({
      id: 'step-synthesis',
      phase: 'synthesis',
      title: isStreaming ? 'Executing & Synthesizing…' : 'Completed',
      content: fullText.trim().slice(0, 120),
      timestamp: now,
      status: isStreaming ? 'running' : 'done',
    });
  }

  return { planContent, steps };
}
