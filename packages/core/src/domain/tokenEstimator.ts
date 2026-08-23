import { LLMModel } from '../types';

/**
 * Fast approximate token counter (~4 characters per token for English, ~2 chars per token for code/multilingual)
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Approximation heuristics:
  const words = text.trim().split(/\s+/).length;
  const chars = text.length;
  // Blend between word count and character count
  return Math.max(1, Math.ceil((words * 1.33 + chars / 4) / 2));
}

/**
 * Calculates estimated cost for a given prompt and completion based on model pricing
 */
export function calculateCostUsd(
  model: LLMModel | undefined,
  promptTokens: number,
  completionTokens: number
): number {
  if (!model) return 0;
  const inputCost = (promptTokens / 1_000_000) * model.inputCostPer1M;
  const outputCost = (completionTokens / 1_000_000) * model.outputCostPer1M;
  return Number((inputCost + outputCost).toFixed(6));
}

export function formatCostUsd(cost: number): string {
  if (cost === 0) return '$0.00';
  if (cost < 0.0001) return `< $0.0001`;
  return `$${cost.toFixed(4)}`;
}
