import { api } from '@/lib/api';
import { billingApi } from './billing-api';

export interface UserSubscription {
  planId: 'free' | 'nectar_basic' | 'nectar_boost' | 'royal_enterprise';
  planName: string;
  status: 'active' | 'canceled' | 'past_due' | 'none';
  renewsAt?: string;
  boostSlots: number;
  perks: string[];
}

const SUBSCRIPTION_STORAGE_KEY = 'anticeil_user_subscription';

const DEFAULT_SUBSCRIPTION: UserSubscription = {
  planId: 'free',
  planName: 'Anticeil Free Tier',
  status: 'none',
  boostSlots: 0,
  perks: ['Akses chat standar', 'Upload file hingga 25MB', 'Voice chat 64kbps'],
};

export interface MidtransTokenResponse {
  snapToken: string;
  redirectUrl?: string;
  orderId: string;
  clientKey: string;
}

export interface MidtransVerifyResponse {
  success: boolean;
  status: string;
  plan?: string;
  message?: string;
}

export const loadMidtransSnap = (clientKey: string, isProduction = false): Promise<void> => {
  return new Promise((resolve) => {
    if ((window as any).snap) {
      resolve();
      return;
    }
    const src = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.setAttribute('data-client-key', clientKey);
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
};

export const subscriptionsApi = {
  createMidtransToken: async (
    planId: 'nectar_basic' | 'nectar_boost' | 'royal_enterprise'
  ): Promise<MidtransTokenResponse> => {
    return api.post<MidtransTokenResponse>('/v1/billing/midtrans-token', {
      plan: planId,
      cycle: 'month',
    });
  },

  createBoostToken: async (
    count: number,
    colonyId?: string
  ): Promise<MidtransTokenResponse> => {
    return api.post<MidtransTokenResponse>('/v1/billing/midtrans-token', {
      type: 'colony_boost',
      count,
      colonyId,
    });
  },

  purchaseBoostSlots: async (
    count: number,
    colonyId?: string
  ): Promise<{ success: boolean; boostSlots: number }> => {
    const currentSub = await subscriptionsApi.getSubscription();
    const updatedSub: UserSubscription = {
      ...currentSub,
      boostSlots: (currentSub.boostSlots || 0) + count,
    };
    try {
      await api.post('/v1/billing/boosts', { count, colonyId });
    } catch {}

    localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(updatedSub));

    const unitPrice = count >= 5 ? 30000 : count >= 3 ? 33000 : 35000;
    const totalAmount = unitPrice * count;

    await billingApi.createTransaction({
      description: `Pembelian ${count}x Colony Boost Slot`,
      amount: totalAmount,
      currency: 'IDR',
      status: 'settlement',
      paymentMethod: 'Midtrans QRIS / GoPay',
    }).catch(() => {});

    return { success: true, boostSlots: updatedSub.boostSlots };
  },

  verifyMidtransPayment: async (orderId: string): Promise<MidtransVerifyResponse> => {
    return api.post<MidtransVerifyResponse>('/v1/billing/midtrans-verify', {
      orderId,
    });
  },

  getSubscription: async (): Promise<UserSubscription> => {
    try {
      const data = await api.get<UserSubscription>('/v1/billing/subscriptions');
      if (data && data.planId) {
        localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    } catch {}

    try {
      const stored = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}

    return DEFAULT_SUBSCRIPTION;
  },

  subscribe: async (planId: 'nectar_basic' | 'nectar_boost' | 'royal_enterprise'): Promise<UserSubscription> => {
    const renewDate = new Date();
    renewDate.setMonth(renewDate.getMonth() + 1);

    const isRoyal = planId === 'royal_enterprise';
    const isNectar = planId === 'nectar_boost';

    const newSub: UserSubscription = {
      planId,
      planName: isRoyal ? 'Royal Enterprise Tier' : isNectar ? 'Nectar Tier' : 'Pollen Tier',
      status: 'active',
      renewsAt: renewDate.toISOString(),
      boostSlots: isRoyal ? 10 : isNectar ? 2 : 0,
      perks: isRoyal
        ? [
            'SSO SAML / Google Workspace & OIDC Login',
            'Corporate Domain Capture (JIT Auto-Provisioning)',
            'Unlimited Cloud Storage & File Upload',
            '10x Colony Boosts gratis tiap bulan',
            'Dedicated Enterprise SLA & Audit Log 365 Hari',
          ]
        : [
            'Custom Emojis di semua colony',
            'Upload file hingga 500MB',
            'Streaming HD 1080p 60fps',
            isNectar ? '2x Colony Boost gratis tiap bulan' : 'Akses lencana Pollen eksklusif',
          ],
    };

    try {
      await api.post('/v1/billing/subscriptions', newSub);
    } catch {}

    billingApi.createTransaction({
      description: isRoyal
        ? 'Langganan Royal Enterprise Tier (Bulanan)'
        : isNectar
        ? 'Langganan Nectar Tier (Bulanan)'
        : 'Langganan Pollen Tier (Bulanan)',
      amount: isRoyal ? 499000 : isNectar ? 149000 : 49000,
      currency: 'IDR',
      status: 'settlement',
      paymentMethod: 'Midtrans QRIS / GoPay',
    }).catch(() => {});

    localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(newSub));
    return newSub;
  },

  cancelSubscription: async (): Promise<UserSubscription> => {
    try {
      await api.post('/v1/billing/subscriptions/cancel', {});
    } catch {}

    const canceledSub: UserSubscription = {
      ...DEFAULT_SUBSCRIPTION,
      status: 'none',
    };
    localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(canceledSub));
    return canceledSub;
  },
};
