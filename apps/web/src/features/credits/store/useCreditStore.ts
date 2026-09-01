'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const MAX_DAILY_CREDITS = 50;

// Credit packages available for top-up (Never Expire & Stackable)
export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceUsd: number;
  priceIdr: number;
  bonusPercent?: number;
  popular?: boolean;
  tag?: string;
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'pack_100',
    name: 'Starter',
    credits: 100,
    priceUsd: 1,
    priceIdr: 15000,
    tag: 'Paling Hemat',
  },
  {
    id: 'pack_350',
    name: 'Plus',
    credits: 350,
    priceUsd: 3,
    priceIdr: 45000,
    bonusPercent: 16,
    tag: '+16% Bonus',
  },
  {
    id: 'pack_600',
    name: 'Pro',
    credits: 600,
    priceUsd: 5,
    priceIdr: 75000,
    bonusPercent: 20,
    popular: true,
    tag: '⭐ Paling Populer',
  },
  {
    id: 'pack_1500',
    name: 'Ultra',
    credits: 1500,
    priceUsd: 10,
    priceIdr: 150000,
    bonusPercent: 50,
    tag: '🔥 Best Value (+50%)',
  },
];

export const CREDIT_COSTS = {
  chat: 1,
  image: 5,
  audio: 5,
  video: 15,
  scrape: 1,
} as const;

export type CreditActionType = keyof typeof CREDIT_COSTS;

interface CreditState {
  credits: number;          // Daily free credits (reset each day at 00:00)
  maxDailyCredits: number;
  lastResetDate: string;    // YYYY-MM-DD

  paidCredits: number;      // Stackable top-up credits (Never expire! Stack on every purchase)

  isLimitModalOpen: boolean;
  isPricingModalOpen: boolean;
  pricingModalInitialTab: 'topup' | 'tiers';
  attemptedAction: CreditActionType | null;

  // Actions
  checkAndResetDaily: () => void;
  addPaidCredits: (amount: number) => void;
  canAfford: (actionType: CreditActionType, providerId: string) => boolean;
  deductCredits: (actionType: CreditActionType, providerId: string) => boolean;
  setLimitModalOpen: (open: boolean, actionType?: CreditActionType) => void;
  setPricingModalOpen: (open: boolean) => void;
  openPricingModal: (tab: 'topup' | 'tiers') => void;
  resetCreditsToMax: () => void;
}

function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export const useCreditStore = create<CreditState>()(
  persist(
    (set, get) => ({
      credits: MAX_DAILY_CREDITS,
      maxDailyCredits: MAX_DAILY_CREDITS,
      lastResetDate: getTodayDateString(),

      paidCredits: 0,

      isLimitModalOpen: false,
      isPricingModalOpen: false,
      pricingModalInitialTab: 'topup' as 'topup' | 'tiers',
      attemptedAction: null,

      checkAndResetDaily: () => {
        const today = getTodayDateString();
        if (get().lastResetDate !== today) {
          set({ credits: MAX_DAILY_CREDITS, lastResetDate: today });
        }
      },

      addPaidCredits: (amount: number) => {
        set((state) => ({
          paidCredits: (state.paidCredits || 0) + amount,
        }));
      },

      canAfford: (actionType, providerId) => {
        // BYOK, OmniRoute, Ollama, Custom — always free
        if (providerId !== 'anticeil' && !providerId.startsWith('anticeil-')) {
          return true;
        }
        get().checkAndResetDaily();
        const cost = CREDIT_COSTS[actionType] ?? 1;
        const total = (get().credits || 0) + (get().paidCredits || 0);
        return total >= cost;
      },

      deductCredits: (actionType, providerId) => {
        // BYOK / Local always pass through
        if (providerId !== 'anticeil' && !providerId.startsWith('anticeil-')) {
          return true;
        }

        get().checkAndResetDaily();
        const cost = CREDIT_COSTS[actionType] ?? 1;
        const { credits, paidCredits } = get();
        const total = (credits || 0) + (paidCredits || 0);

        if (total < cost) {
          set({ isLimitModalOpen: true, attemptedAction: actionType });
          return false;
        }

        // Priority: consume daily free first, then paid top-up credits
        if (credits >= cost) {
          set({ credits: Math.max(0, credits - cost) });
        } else {
          const remaining = cost - credits;
          set({
            credits: 0,
            paidCredits: Math.max(0, (paidCredits || 0) - remaining),
          });
        }
        return true;
      },

      setLimitModalOpen: (open, actionType) => {
        set({ isLimitModalOpen: open, attemptedAction: actionType ?? null });
      },

      setPricingModalOpen: (open) => {
        set({ isPricingModalOpen: open });
      },

      openPricingModal: (tab) => {
        set({ isPricingModalOpen: true, pricingModalInitialTab: tab });
      },

      resetCreditsToMax: () => {
        set({ credits: MAX_DAILY_CREDITS, lastResetDate: getTodayDateString() });
      },
    }),
    {
      name: 'anticeil_credits_storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.checkAndResetDaily();
        }
      },
    }
  )
);
