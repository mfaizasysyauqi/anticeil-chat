/**
 * AI Credits Management Service for Atlas Agent
 *
 * Implements unit-economic cost control and tier-based limits:
 * - Free: 20 credits / day (auto-resets at 00:00)
 * - Pollen (nectar_basic): 100 credits / day
 * - Nectar VIP (nectar_boost): 500 credits / day
 * - Royal Enterprise (royal_enterprise): Unlimited (Fair Use)
 */

export interface PlanCreditsConfig {
  dailyCredits: number;
  name: string;
  badge: string;
}

export const PLAN_CREDITS_CONFIG: Record<string, PlanCreditsConfig> = {
  free: {
    dailyCredits: 20,
    name: 'Free Tier',
    badge: 'Free',
  },
  nectar_basic: {
    dailyCredits: 100,
    name: 'Pollen',
    badge: 'Pollen',
  },
  nectar_boost: {
    dailyCredits: 500,
    name: 'Nectar VIP',
    badge: 'Nectar',
  },
  royal_enterprise: {
    dailyCredits: Infinity,
    name: 'Royal Enterprise',
    badge: 'Royal 👑',
  },
};

const STORAGE_KEY_AI_CREDITS = 'anticeil_ai_credits_usage';

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export interface AiCreditsStatus {
  planId: string;
  planName: string;
  dailyLimit: number;
  usedToday: number;
  remainingToday: number;
  isUnlimited: boolean;
  canSend: boolean;
  percentageUsed: number;
}

export function getAiCreditsStatus(): AiCreditsStatus {
  if (typeof window === 'undefined') {
    return {
      planId: 'free',
      planName: 'Free Tier',
      dailyLimit: 20,
      usedToday: 0,
      remainingToday: 20,
      isUnlimited: false,
      canSend: true,
      percentageUsed: 0,
    };
  }

  // 1. Resolve user plan
  let planId = 'free';
  try {
    const rawSub = localStorage.getItem('anticeil_user_subscription');
    if (rawSub) {
      const parsed = JSON.parse(rawSub);
      if (parsed.status === 'active' && parsed.planId) {
        planId = parsed.planId;
      }
    }
  } catch {}

  const config = PLAN_CREDITS_CONFIG[planId] || PLAN_CREDITS_CONFIG.free;
  const isUnlimited = !isFinite(config.dailyCredits);

  // 2. Resolve today's usage
  const today = getTodayKey();
  let usedToday = 0;
  try {
    const rawUsage = localStorage.getItem(STORAGE_KEY_AI_CREDITS);
    if (rawUsage) {
      const parsedUsage = JSON.parse(rawUsage);
      if (parsedUsage.date === today && typeof parsedUsage.used === 'number') {
        usedToday = parsedUsage.used;
      }
    }
  } catch {}

  const dailyLimit = config.dailyCredits;
  const remainingToday = isUnlimited ? Infinity : Math.max(0, dailyLimit - usedToday);
  const canSend = isUnlimited || remainingToday > 0;
  const percentageUsed = isUnlimited ? 0 : Math.min(100, Math.round((usedToday / dailyLimit) * 100));

  return {
    planId,
    planName: config.name,
    dailyLimit,
    usedToday,
    remainingToday,
    isUnlimited,
    canSend,
    percentageUsed,
  };
}

export function consumeAiCredit(amount: number = 1): { success: boolean; status: AiCreditsStatus } {
  const current = getAiCreditsStatus();
  if (!current.canSend) {
    return { success: false, status: current };
  }

  if (!current.isUnlimited) {
    const today = getTodayKey();
    const newUsed = current.usedToday + amount;
    try {
      localStorage.setItem(
        STORAGE_KEY_AI_CREDITS,
        JSON.stringify({ date: today, used: newUsed })
      );
      window.dispatchEvent(new CustomEvent('anticeil_ai_credits_updated'));
    } catch {}
  }

  return { success: true, status: getAiCreditsStatus() };
}

export function openUpgradeSubscription(_plan: 'nectar_basic' | 'nectar_boost' | 'royal_enterprise' = 'nectar_boost') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('anticeil_open_user_settings', { detail: { section: 'nitro' } })
    );
  }
}
