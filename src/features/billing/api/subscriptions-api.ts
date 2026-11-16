import { api } from '@/lib/api';

export interface UserSubscription {
  planId: 'free' | 'nectar_basic' | 'nectar_boost';
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

export const subscriptionsApi = {
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

  subscribe: async (planId: 'nectar_basic' | 'nectar_boost'): Promise<UserSubscription> => {
    const renewDate = new Date();
    renewDate.setMonth(renewDate.getMonth() + 1);

    const newSub: UserSubscription = {
      planId,
      planName: planId === 'nectar_boost' ? 'Nectar Tier' : 'Pollen Tier',
      status: 'active',
      renewsAt: renewDate.toISOString(),
      boostSlots: planId === 'nectar_boost' ? 2 : 0,
      perks: [
        'Custom Emojis di semua colony',
        'Upload file hingga 500MB',
        'Streaming HD 1080p 60fps',
        planId === 'nectar_boost' ? '2x Colony Boost gratis tiap bulan' : 'Akses lencana Pollen eksklusif',
      ],
    };

    try {
      await api.post('/v1/billing/subscriptions', newSub);
    } catch {}

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
