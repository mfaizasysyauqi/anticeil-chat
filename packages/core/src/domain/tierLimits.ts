import { UserTier } from '../types';

/**
 * Request-Based AI Credit Costs
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
    maxInputChars: 6000,       // ~1,500 tokens input
    maxOutputTokens: 2048,     // Realistic output budget
    maxHistoryMessages: 10,
  },
  starter: {
    dailyCredits: 50,
    monthlyCredits: 100,
    maxInputChars: 12000,      // ~3,000 tokens input
    maxOutputTokens: 3072,
    maxHistoryMessages: 20,
  },
  pro: {
    dailyCredits: 50,
    monthlyCredits: 600,
    maxInputChars: 24000,      // ~6,000 tokens input
    maxOutputTokens: 4096,
    maxHistoryMessages: 40,
  },
  enterprise: {
    dailyCredits: 50,
    monthlyCredits: 999999,
    maxInputChars: 64000,      // ~16,000 tokens input
    maxOutputTokens: 8192,
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

export function getActionCreditCost(action: CreditActionType): number {
  return CREDIT_COSTS[action] ?? 1;
}
