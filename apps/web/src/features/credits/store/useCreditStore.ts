'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  CREDIT_COSTS,
  CreditActionType,
  isBYOKProvider,
  getActionCreditCost,
  getModelCreditWeight,
  calculateDynamicCreditCost,
  CalculateCreditOptions,
} from '@anticeil/core';

export const MAX_DAILY_CREDITS = 50;
export {
  CREDIT_COSTS,
  isBYOKProvider,
  getActionCreditCost,
  getModelCreditWeight,
  calculateDynamicCreditCost,
};
export type { CreditActionType, CalculateCreditOptions };

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
    tag: '★ Paling Populer',
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

interface CreditState {
  credits: number;          // Daily free credits (reset each day at 00:00)
  maxDailyCredits: number;
  lastResetDate: string;    // YYYY-MM-DD

  paidCredits: number;      // Stackable top-up & tier bonus credits (Never expire!)

  isLimitModalOpen: boolean;
  isPricingModalOpen: boolean;
  pricingModalInitialTab: 'topup' | 'tiers';
  attemptedAction: CreditActionType | null;
  attemptedCost?: number;

  // Actions
  checkAndResetDaily: () => void;
  addPaidCredits: (amount: number) => void;
  canAfford: (
    actionType: CreditActionType,
    providerId: string,
    options?: CalculateCreditOptions
  ) => boolean;
  deductCredits: (
    actionType: CreditActionType,
    providerId: string,
    options?: CalculateCreditOptions
  ) => boolean;
  refundCredits: (
    actionType: CreditActionType,
    providerId: string,
    options?: CalculateCreditOptions
  ) => void;
  setLimitModalOpen: (
    open: boolean,
    actionType?: CreditActionType,
    attemptedCost?: number
  ) => void;
  setPricingModalOpen: (open: boolean) => void;
  openPricingModal: (tab: 'topup' | 'tiers') => void;
  resetCreditsToMax: () => void;
  /** Fetch paid_credits from Supabase and override local value (call on login) */
  loadPaidCreditsFromSupabase: () => Promise<void>;
  /** Persist current paidCredits to Supabase (call after deduction affects paid credits) */
  syncPaidCreditsToSupabase: () => Promise<void>;
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
      attemptedCost: 1,

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

      canAfford: (actionType, providerId, options) => {
        // BYOK, OmniRoute, Ollama, Custom — always free (0 credits)
        if (isBYOKProvider(providerId)) {
          return true;
        }
        get().checkAndResetDaily();
        const cost = getActionCreditCost(actionType, options);
        const total = (get().credits || 0) + (get().paidCredits || 0);
        return total >= cost;
      },

      deductCredits: (actionType, providerId, options) => {
        // BYOK / Local always pass through (0 credits)
        if (isBYOKProvider(providerId)) {
          return true;
        }

        get().checkAndResetDaily();
        const cost = getActionCreditCost(actionType, options);
        const { credits, paidCredits } = get();
        const total = (credits || 0) + (paidCredits || 0);

        if (total < cost) {
          set({ isLimitModalOpen: true, attemptedAction: actionType, attemptedCost: cost });
          return false;
        }

        // Priority: consume daily free first, then paid/bonus credits
        if (credits >= cost) {
          set({ credits: Math.max(0, credits - cost) });
        } else {
          const remaining = cost - credits;
          set({
            credits: 0,
            paidCredits: Math.max(0, (paidCredits || 0) - remaining),
          });
          // Paid credits changed — sync to Supabase (fire-and-forget)
          get().syncPaidCreditsToSupabase();
        }
        return true;
      },

      refundCredits: (actionType, providerId, options) => {
        if (isBYOKProvider(providerId)) return;
        const cost = getActionCreditCost(actionType, options);
        set((state) => {
          const maxFree = state.maxDailyCredits || MAX_DAILY_CREDITS;
          const currentFree = state.credits || 0;
          if (currentFree < maxFree) {
            const addedToFree = Math.min(maxFree - currentFree, cost);
            const remainingPaid = cost - addedToFree;
            return {
              credits: currentFree + addedToFree,
              paidCredits: (state.paidCredits || 0) + remainingPaid,
            };
          } else {
            return {
              paidCredits: (state.paidCredits || 0) + cost,
            };
          }
        });
      },

      setLimitModalOpen: (open, actionType, attemptedCost) => {
        set({
          isLimitModalOpen: open,
          attemptedAction: actionType ?? null,
          attemptedCost: attemptedCost ?? (actionType ? getActionCreditCost(actionType) : 1),
        });
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

      loadPaidCreditsFromSupabase: async () => {
        try {
          const res = await fetch('/api/credits');
          if (!res.ok) return; // not logged in or error — keep local value
          const { paid_credits } = await res.json() as { paid_credits: number };
          if (typeof paid_credits === 'number') {
            set({ paidCredits: paid_credits });
          }
        } catch {
          // Network error — keep local value
        }
      },

      syncPaidCreditsToSupabase: async () => {
        try {
          const { paidCredits } = get();
          await fetch('/api/credits', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paid_credits: paidCredits }),
          });
        } catch {
          // Best-effort — local store is still correct
        }
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
