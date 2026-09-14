import { UserTier } from '../types';

/**
 * Request-Based AI Credit Base Costs
 * Standardized across all Anticeil features for the built-in free/default provider.
 * BYOK / personal keys / Ollama / Enterprise BYOD cost 0 credits.
 */
export const CREDIT_COSTS = {
  chat: 1,
  docs: 1,
  scrape: 1,
  audio: 2,
  image: 5,
  video: 15,
} as const;

export type CreditActionType = keyof typeof CREDIT_COSTS;

/**
 * Model Tier Multiplier (Smart Weighting):
 * - Fast & Economy (Gemini Flash, DeepSeek-V3, Llama 3.3, Qwen 27B): 1x
 * - Deep Reasoning & Heavy Coder (DeepSeek-R1, Gemini Pro, Qwen 72B, Haiku, 4o-mini): 3x
 * - Flagship Premium (Claude 3.7 / 3.5 Sonnet, GPT-4o, o3-mini): 8x
 */
export function getModelCreditWeight(modelId?: string): number {
  if (!modelId) return 1;
  const id = modelId.toLowerCase();

  // Tier 3: Flagship Premium (8x weight)
  if (
    id.includes('claude-3-7') ||
    id.includes('claude-3.7') ||
    id.includes('claude-3-5-sonnet') ||
    id.includes('claude-3.5-sonnet') ||
    id.includes('claude-3-opus') ||
    id.includes('gpt-4o') && !id.includes('mini') ||
    id.includes('gpt-4-turbo') ||
    id.includes('o1') ||
    id.includes('o3-mini')
  ) {
    return 8;
  }

  // Tier 2: Deep Reasoning & Heavy Coder (3x weight)
  if (
    id.includes('deepseek-r1') ||
    id.includes('deepseek-reasoner') ||
    id.includes('gemini-1.5-pro') ||
    id.includes('gemini-2.5-pro') ||
    id.includes('gemini-pro') ||
    id.includes('claude-3-5-haiku') ||
    id.includes('claude-3-haiku') ||
    id.includes('gpt-4o-mini') ||
    id.includes('coder') ||
    id.includes('72b')
  ) {
    return 3;
  }

  // Tier 1: Fast & Economy (Default 1x weight)
  return 1;
}

export const BASE_CONTEXT_TOKEN_CAP = 4000; // 4k tokens included in standard request (~16,000 chars)

export interface CalculateCreditOptions {
  modelId?: string;
  promptLength?: number; // Raw character count of prompt + context
  totalTokens?: number;  // Explicit token count if available
  docsAction?: 'create' | 'edit' | 'fix'; // 'create' (full document 3 credits) vs 'edit' / 'fix' (1 credit)
}

/**
 * Calculates dynamic credit deduction:
 * [Base Cost * Model Weight] + [Extra Context Surcharge: +1 credit per 4,000 extra tokens]
 */
export function calculateDynamicCreditCost(
  action: CreditActionType,
  options?: CalculateCreditOptions
): number {
  let baseCost: number = (CREDIT_COSTS[action] as number) ?? 1;

  // Action-based tiering for Docs Studio:
  // - Full Document Generation (new project / multi-file blueprint) = 3 credits
  // - Follow-up Co-Author Chat / Section Revision / Diagnostic Error Fix = 1 credit
  if (action === 'docs') {
    if (options?.docsAction === 'edit' || options?.docsAction === 'fix') {
      baseCost = 1;
    } else if (options?.docsAction === 'create') {
      baseCost = 3;
    } else {
      baseCost = 3; // Default for initial docs generation
    }
  }

  // Non-text multimodal generation actions have fixed predefined action credits
  if (action === 'audio' || action === 'image' || action === 'video' || action === 'scrape') {
    return baseCost;
  }

  const modelWeight = getModelCreditWeight(options?.modelId);
  const weightedBaseCost = baseCost * modelWeight;

  // Context soft-cap: calculate extra tokens beyond 4,000
  let estimatedTokens = 0;
  if (typeof options?.totalTokens === 'number' && options.totalTokens > 0) {
    estimatedTokens = options.totalTokens;
  } else if (typeof options?.promptLength === 'number' && options.promptLength > 0) {
    // 1 token ≈ 4 characters
    estimatedTokens = Math.ceil(options.promptLength / 4);
  }

  const extraTokens = Math.max(0, estimatedTokens - BASE_CONTEXT_TOKEN_CAP);
  const surcharge = Math.floor(extraTokens / BASE_CONTEXT_TOKEN_CAP);

  return Math.max(1, weightedBaseCost + surcharge);
}

export interface TierAiLimitConfig {
  dailyCredits: number;
  monthlyCredits: number;
  maxInputChars: number;
  maxOutputTokens: number;
  maxHistoryMessages: number;
}

export const TIER_AI_LIMITS: Record<UserTier, TierAiLimitConfig> = {
  free: {
    dailyCredits: 50,
    monthlyCredits: 0,
    maxInputChars: 12000,       // ~3,000 tokens input
    maxOutputTokens: 8192,      // Full comprehensive document generation budget
    maxHistoryMessages: 15,
  },
  starter: {
    dailyCredits: 50,
    monthlyCredits: 100,
    maxInputChars: 24000,       // ~6,000 tokens input
    maxOutputTokens: 8192,
    maxHistoryMessages: 30,
  },
  pro: {
    dailyCredits: 50,
    monthlyCredits: 600,
    maxInputChars: 48000,       // ~12,000 tokens input
    maxOutputTokens: 8192,
    maxHistoryMessages: 50,
  },
  enterprise: {
    dailyCredits: 50,
    monthlyCredits: 999999,
    maxInputChars: 128000,      // ~32,000 tokens input
    maxOutputTokens: 16384,
    maxHistoryMessages: 100,
  },
};

export const TIER_FILE_UPLOAD_LIMITS: Record<UserTier, number> = {
  free: 10 * 1024 * 1024,        // 10 MB per file
  starter: 50 * 1024 * 1024,     // 50 MB per file
  pro: 250 * 1024 * 1024,        // 250 MB per file
  enterprise: 1024 * 1024 * 1024, // 1 GB per file
};

export function getTierAiLimits(tier: UserTier = 'free'): TierAiLimitConfig {
  return TIER_AI_LIMITS[tier] || TIER_AI_LIMITS.free;
}

export function getTierMaxFileLimit(tier: UserTier = 'free'): number {
  return TIER_FILE_UPLOAD_LIMITS[tier] || TIER_FILE_UPLOAD_LIMITS.free;
}

export function isBYOKProvider(providerId?: string): boolean {
  if (!providerId) return false;
  return providerId !== 'anticeil' && !providerId.startsWith('anticeil-');
}

export function getActionCreditCost(
  action: CreditActionType,
  options?: CalculateCreditOptions
): number {
  return calculateDynamicCreditCost(action, options);
}
