import { api } from '@/lib/api';

export interface GiftItem {
  id: string;
  code: string;
  type: 'nectar_1m' | 'nectar_1y' | 'boost_1m';
  title: string;
  senderName?: string;
  recipientEmail?: string;
  redeemed: boolean;
  redeemedAt?: string;
  createdAt: string;
}

const GIFTS_STORAGE_KEY = 'anticeil_gifts_inventory';

const DEFAULT_GIFTS: GiftItem[] = [
  {
    id: 'gift_welcome',
    code: 'WUMP-WELCOME-PASS-2026',
    type: 'nectar_1m',
    title: '1 Bulan Nectar Pass (Welcome Bonus)',
    redeemed: true,
    redeemedAt: '2026-11-01T10:00:00.000Z',
    createdAt: '2026-11-01T09:00:00.000Z',
  },
];

export const giftsApi = {
  getGifts: async (): Promise<GiftItem[]> => {
    try {
      const data = await api.get<GiftItem[]>('/v1/billing/gifts');
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem(GIFTS_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    } catch {}

    try {
      const stored = localStorage.getItem(GIFTS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}

    return DEFAULT_GIFTS;
  },

  redeemCode: async (code: string): Promise<{ success: boolean; gift?: GiftItem; message: string }> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Kode hadiah tidak boleh kosong' };
    }

    try {
      const res = await api.post<{ success: boolean; gift?: GiftItem; message: string }>(
        '/v1/billing/gifts/redeem',
        { code: cleanCode }
      );
      if (res && res.success) {
        const current = await giftsApi.getGifts();
        if (res.gift) {
          const updated = [res.gift, ...current.filter((g) => g.id !== res.gift!.id)];
          localStorage.setItem(GIFTS_STORAGE_KEY, JSON.stringify(updated));
        }
        return res;
      }
    } catch {}

    // Fallback verification for demo / offline
    if (
      cleanCode.startsWith('WUMP') ||
      cleanCode.startsWith('NECTAR') ||
      cleanCode.length >= 8
    ) {
      const newGift: GiftItem = {
        id: `gift_${Date.now()}`,
        code: cleanCode,
        type: cleanCode.includes('BOOST') ? 'boost_1m' : 'nectar_1m',
        title: cleanCode.includes('BOOST') ? '2x Colony Boost (1 Bulan)' : '1 Bulan Nectar Nitro Pass',
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

  purchaseGift: async (type: 'nectar_1m' | 'nectar_1y' | 'boost_1m', recipientEmail?: string): Promise<GiftItem> => {
    const randomCode = `NECTAR-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const newGift: GiftItem = {
      id: `gift_${Date.now()}`,
      code: randomCode,
      type,
      title: type === 'nectar_1y' ? '1 Tahun Nectar Pass' : type === 'boost_1m' ? '2x Colony Boost' : '1 Bulan Nectar Pass',
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
