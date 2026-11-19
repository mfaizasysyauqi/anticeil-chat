import { api } from '@/lib/api';

export interface ShopItem {
  id: string;
  name: string;
  collection: string;
  category: 'avatar_decoration' | 'profile_effect' | 'nameplate' | 'bundle' | 'theme';
  description: string;
  priceIdr: number;
  priceOrbs: number;
  discountPercent?: number;
  bannerUrl?: string;
  previewIcon?: string;
  badge?: string;
  itemTypes?: string[];
  featured?: boolean;
  purchasedAt?: string;
  transactionId?: string;
}

export interface ShopCollection {
  id: string;
  name: string;
  tagline: string;
  subtitle: string;
  bannerUrl: string;
  actionLabel: string;
  items: ShopItem[];
}

export interface ShopFeaturedResponse {
  heroCollection: ShopCollection;
  collections: ShopCollection[];
  featuredItems: ShopItem[];
}

export interface ShopBalance {
  orbs: number;
  nectar: number;
  currencyCode: string;
}

export const shopApi = {
  async getItems(category?: string, query?: string): Promise<ShopItem[]> {
    try {
      const params: Record<string, string> = {};
      if (category && category !== 'all') params.category = category;
      if (query) params.q = query;
      const res = await api.get<ShopItem[]>('/v1/community/shop/items', { params });
      if (Array.isArray(res)) return res;
    } catch {}
    return [];
  },

  async getFeatured(): Promise<ShopFeaturedResponse | null> {
    try {
      return await api.get<ShopFeaturedResponse>('/v1/community/shop/featured');
    } catch {
      return null;
    }
  },

  async getBalance(): Promise<ShopBalance> {
    try {
      return await api.get<ShopBalance>('/v1/community/shop/balance');
    } catch {
      return { orbs: 1500, nectar: 250, currencyCode: 'IDR' };
    }
  },

  async purchaseItem(itemId: string, currency: 'orbs' | 'idr' = 'orbs'): Promise<{ success: boolean; message: string; item?: ShopItem; newBalance?: ShopBalance }> {
    try {
      return await api.post('/v1/community/shop/purchase', { itemId, currency });
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal membeli item' };
    }
  },

  async getInventory(): Promise<ShopItem[]> {
    try {
      const res = await api.get<ShopItem[]>('/v1/community/shop/inventory');
      if (Array.isArray(res)) return res;
    } catch {}
    return [];
  },

  async getWishlist(): Promise<ShopItem[]> {
    try {
      const res = await api.get<ShopItem[]>('/v1/community/shop/wishlist');
      if (Array.isArray(res)) return res;
    } catch {}
    return [];
  },

  async toggleWishlist(itemId: string): Promise<{ success: boolean; isWishlisted: boolean; wishlist?: ShopItem[] }> {
    try {
      return await api.post(`/v1/community/shop/wishlist/${itemId}`);
    } catch {
      return { success: false, isWishlisted: false };
    }
  },

  async equipItem(itemId: string, slot: string): Promise<{ success: boolean; profile?: any }> {
    try {
      return await api.post('/v1/community/shop/equip', { itemId, slot });
    } catch {
      return { success: false };
    }
  },
};
