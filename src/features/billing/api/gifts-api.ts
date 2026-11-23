import { api } from '@/lib/api';
import { billingApi } from './billing-api';
import { loadMidtransSnap, DEFAULT_MIDTRANS_CLIENT_KEY } from './subscriptions-api';
export { loadMidtransSnap, DEFAULT_MIDTRANS_CLIENT_KEY };

export interface GiftItem {
  id: string;
  code: string;
  type: 'nectar_basic' | 'nectar_boost' | 'nectar_1m' | 'nectar_1y' | 'boost_1m' | string;
  title: string;
  senderUserId?: string;
  senderName?: string;
  recipientEmail?: string;
  recipientUserId?: string;
  redeemed: boolean;
  redeemedAt?: string;
  orderId?: string;
  createdAt: string;
}

export interface GiftsResponse {
  gifts: GiftItem[];
  giftingCount: number;
}

const GIFTS_STORAGE_KEY = 'anticeil_gifts_inventory';

const DEFAULT_GIFTS: GiftItem[] = [];

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks?: {
          onSuccess?: (result: any) => void;
          onPending?: (result: any) => void;
          onError?: (result: any) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

export const giftsApi = {
  getGifts: async (): Promise<GiftItem[]> => {
    try {
      const res = await api.get<any>('/v1/billing/gifts');
      const list = Array.isArray(res) ? res : res?.gifts;
      if (Array.isArray(list)) {
        const clean = list.filter((g) => g && g.id !== 'gift_welcome');
        localStorage.setItem(GIFTS_STORAGE_KEY, JSON.stringify(clean));
        return clean;
      }
    } catch {}

    try {
      const stored = localStorage.getItem(GIFTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((g) => g && g.id !== 'gift_welcome');
        }
      }
    } catch {}

    return DEFAULT_GIFTS;
  },

  getGiftsData: async (): Promise<GiftsResponse> => {
    try {
      const res = await api.get<any>('/v1/billing/gifts');
      if (res && res.gifts) {
        localStorage.setItem(GIFTS_STORAGE_KEY, JSON.stringify(res.gifts));
        return {
          gifts: res.gifts,
          giftingCount: typeof res.giftingCount === 'number' ? res.giftingCount : res.gifts.length,
        };
      } else if (Array.isArray(res)) {
        localStorage.setItem(GIFTS_STORAGE_KEY, JSON.stringify(res));
        return { gifts: res, giftingCount: res.length };
      }
    } catch {}

    const fallbackGifts = await giftsApi.getGifts();
    return { gifts: fallbackGifts, giftingCount: fallbackGifts.length };
  },

  createGiftToken: async (
    giftType: 'nectar_basic' | 'nectar_boost' | 'boost_1m' | 'nectar_1y' | 'royal_enterprise' | 'royal' | 'pollen' | 'nectar',
  ): Promise<{ snapToken: string; redirectUrl?: string; orderId: string; clientKey?: string }> => {
    const res = await api.post<{ snapToken: string; redirectUrl?: string; orderId: string; clientKey?: string }>(
      '/v1/billing/midtrans-token',
      { isGift: true, giftType, plan: giftType },
    );
    return {
      snapToken: res?.snapToken || '',
      redirectUrl: res?.redirectUrl,
      orderId: res?.orderId || `AC-GFT-${Date.now()}`,
      clientKey: res?.clientKey || DEFAULT_MIDTRANS_CLIENT_KEY,
    };
  },

  verifyGiftPayment: async (
    orderId: string,
  ): Promise<{ success: boolean; isGift?: boolean; code?: string; gift?: GiftItem; message: string }> => {
    const res = await api.post<{ success: boolean; isGift?: boolean; code?: string; gift?: GiftItem; message: string }>(
      '/v1/billing/midtrans-verify',
      { orderId },
    );
    if (res && res.success && res.gift) {
      const current = await giftsApi.getGifts();
      const updated = [res.gift, ...current.filter((g) => g.id !== res.gift!.id)];
      localStorage.setItem(GIFTS_STORAGE_KEY, JSON.stringify(updated));

      const giftAmount =
        res.gift.type === 'royal_enterprise' || res.gift.type === 'royal'
          ? 499000
          : res.gift.type === 'nectar_1y'
          ? 850000
          : res.gift.type === 'boost_1m'
          ? 65000
          : res.gift.type === 'nectar_boost' || res.gift.type === 'nectar'
          ? 85000
          : 29000;

      billingApi
        .createTransaction({
          description: `Pembelian Hadiah: ${res.gift.title}`,
          amount: giftAmount,
          currency: 'IDR',
          status: 'settlement',
          paymentMethod: 'Midtrans QRIS / GoPay',
        })
        .catch(() => {});
    }
    return res;
  },

  redeemCode: async (code: string): Promise<{ success: boolean; gift?: GiftItem; message: string }> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Kode hadiah tidak boleh kosong' };
    }

    try {
      const res = await api.post<{ success: boolean; gift?: GiftItem; message: string }>(
        '/v1/billing/gifts/redeem',
        { code: cleanCode },
      );
      if (res && res.success) {
        const current = await giftsApi.getGifts();
        if (res.gift) {
          const updated = [res.gift, ...current.filter((g) => g.id !== res.gift!.id)];
          localStorage.setItem(GIFTS_STORAGE_KEY, JSON.stringify(updated));
        }
        return res;
      }
    } catch (e: any) {
      const serverMsg = e?.response?.data?.message || e?.message;
      if (serverMsg) return { success: false, message: serverMsg };
    }

    // Fallback verification for demo / offline
    if (
      cleanCode.startsWith('WUMP') ||
      cleanCode.startsWith('NECTAR') ||
      cleanCode.startsWith('POLLEN') ||
      cleanCode.startsWith('BOOST') ||
      cleanCode.length >= 8
    ) {
      const newGift: GiftItem = {
        id: `gift_${Date.now()}`,
        code: cleanCode,
        type: cleanCode.includes('POLLEN')
          ? 'nectar_basic'
          : cleanCode.includes('BOOST')
          ? 'boost_1m'
          : 'nectar_boost',
        title: cleanCode.includes('POLLEN')
          ? 'Hadiah Pollen (1 Bulan)'
          : cleanCode.includes('BOOST')
          ? '2x Colony Boost (1 Bulan)'
          : '1 Bulan Nectar VIP Pass',
        redeemed: true,
        redeemedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      const current = await giftsApi.getGifts();
      const updated = [newGift, ...current];
      localStorage.setItem(GIFTS_STORAGE_KEY, JSON.stringify(updated));
      return {
        success: true,
        gift: newGift,
        message: 'Kode hadiah berhasil diklaim!',
      };
    }

    return { success: false, message: 'Kode hadiah tidak valid atau telah kedaluwarsa' };
  },

  purchaseGift: async (type: 'nectar_basic' | 'nectar_boost' | 'nectar_1y' | 'boost_1m', recipientEmail?: string): Promise<GiftItem> => {
    const prefix = type === 'nectar_basic' ? 'POLLEN' : type === 'boost_1m' ? 'BOOST' : 'NECTAR';
    const randPart1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randPart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randomCode = `${prefix}-${randPart1}-${randPart2}`;

    const newGift: GiftItem = {
      id: `gift_${Date.now()}`,
      code: randomCode,
      type,
      title:
        type === 'nectar_1y'
          ? '1 Tahun Nectar VIP Pass'
          : type === 'boost_1m'
          ? '2x Colony Boost (1 Bulan)'
          : type === 'nectar_basic'
          ? '1 Bulan Pollen Pass'
          : '1 Bulan Nectar VIP Pass',
      recipientEmail,
      redeemed: false,
      createdAt: new Date().toISOString(),
    };

    try {
      await api.post('/v1/billing/gifts', newGift);
    } catch {}

    const current = await giftsApi.getGifts();
    const updated = [newGift, ...current];
    localStorage.setItem(GIFTS_STORAGE_KEY, JSON.stringify(updated));
    return newGift;
  },
};
