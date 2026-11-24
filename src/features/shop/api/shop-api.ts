import { api } from '@/lib/api';

export interface ShopItem {
  id: string;
  name: string;
  collection: string;
  category: 'avatar_decoration' | 'profile_effect' | 'nameplate' | 'bundle' | 'theme' | 'profile_banner' | 'animated_avatar' | string;
  description: string;
  priceIdr: number;
  priceDew: number;
  allowDew?: boolean;
  priceOrbs?: number;
  discountPercent?: number;
  bannerUrl?: string;
  previewIcon?: string;
  gifUrl?: string;
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
  dew: number;
  orbs?: number;
  currencyCode: string;
}

export const FALLBACK_SHOP_ITEMS: ShopItem[] = [];

export const shopApi = {
  async getItems(category?: string, query?: string): Promise<ShopItem[]> {
    try {
      const params: Record<string, string> = {};
      if (category && category !== 'all') params.category = category;
      if (query) params.q = query;
      const res = await api.get<any>('/v1/community/shop/items', { params });
      if (Array.isArray(res)) return res;
    } catch {}
    return [];
  },

  async getFeatured(): Promise<ShopFeaturedResponse | null> {
    try {
      const res = await api.get<any>('/v1/community/shop/featured');
      if (res && res.heroCollection && Array.isArray(res.featuredItems)) {
        return res;
      }
    } catch {
      return null;
    }
    return null;
  },

  async getBalance(): Promise<ShopBalance> {
    try {
      const res = await api.get<any>('/v1/community/shop/balance');
      if (res && (typeof res.dew === 'number' || typeof res.orbs === 'number')) {
        const dew = typeof res.dew === 'number' ? res.dew : res.orbs;
        return {
          dew,
          orbs: dew,
          currencyCode: res.currencyCode || 'IDR',
        };
      }
    } catch {}
    return { dew: 0, orbs: 0, currencyCode: 'IDR' };
  },

  async topupDew(amount: number = 500): Promise<{ success: boolean; message: string; balance?: ShopBalance }> {
    try {
      return await api.post('/v1/community/shop/topup', { amount });
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal menambahkan Dew' };
    }
  },

  topupOrbs(amount: number = 500) {
    return this.topupDew(amount);
  },

  async purchaseItem(itemId: string, currency: 'dew' | 'idr' | 'orbs' = 'dew'): Promise<{ success: boolean; message: string; item?: ShopItem; newBalance?: ShopBalance }> {
    try {
      return await api.post('/v1/community/shop/purchase', { itemId, currency });
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal membeli item' };
    }
  },

  async getInventory(): Promise<ShopItem[]> {
    try {
      const res = await api.get<any>('/v1/community/shop/inventory');
      if (Array.isArray(res)) return res;
    } catch {}
    return [];
  },

  async getWishlist(): Promise<ShopItem[]> {
    try {
      const res = await api.get<any>('/v1/community/shop/wishlist');
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

  async createItem(item: Partial<ShopItem>): Promise<{ success: boolean; message: string; item?: ShopItem }> {
    try {
      return await api.post('/v1/community/shop/items', item);
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal menambahkan item ke database' };
    }
  },

  async updateItem(itemId: string, item: Partial<ShopItem>): Promise<{ success: boolean; message: string; item?: ShopItem }> {
    try {
      return await api.put(`/v1/community/shop/items/${itemId}`, item);
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal memperbarui item' };
    }
  },

  async deleteItem(itemId: string): Promise<{ success: boolean; message: string }> {
    try {
      return await api.delete(`/v1/community/shop/items/${itemId}`);
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal menghapus item' };
    }
  },
};
