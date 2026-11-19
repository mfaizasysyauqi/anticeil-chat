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

export const FALLBACK_SHOP_ITEMS: ShopItem[] = [
  {
    id: 'shop_zzz_miyabi_bundle',
    name: '3pc Hoshimi Miyabi Bundle',
    collection: 'Zenless Zone Zero',
    category: 'bundle',
    description: 'Bundel eksklusif Section 6: Dekorasi Avatar Katana Frost, Efek Profil Blazing Void, dan Nameplate Miyabi.',
    priceIdr: 160000,
    priceOrbs: 1200,
    discountPercent: 32,
    previewIcon: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    badge: 'Diskon 32%',
    featured: true,
  },
  {
    id: 'shop_zzz_ellen_joe_bundle',
    name: '3pc Ellen Joe Bundle',
    collection: 'Zenless Zone Zero',
    category: 'bundle',
    description: 'Bundel Victoria Housekeeping: Ekor Hiu Pemburu, Dekorasi Avatar Maid Shark, dan Efek Profil Deep Ocean.',
    priceIdr: 160000,
    priceOrbs: 1200,
    discountPercent: 32,
    previewIcon: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    badge: 'Diskon 32%',
    featured: true,
  },
  {
    id: 'shop_zzz_burnice',
    name: 'Burnice White',
    collection: 'Zenless Zone Zero',
    category: 'avatar_decoration',
    description: 'Dekorasi kacamata nitro dan api Sons of Calydon untuk avatar Anda.',
    priceIdr: 78000,
    priceOrbs: 600,
    previewIcon: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=200&auto=format&fit=crop&q=80',
    badge: 'Populer',
    featured: true,
  },
  {
    id: 'shop_zzz_eous',
    name: 'Eous (Bangboo Hat)',
    collection: 'Zenless Zone Zero',
    category: 'avatar_decoration',
    description: 'Topi telinga kelinci oranye ikonik Bangboo Eous nomor 01.',
    priceIdr: 78000,
    priceOrbs: 600,
    previewIcon: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop&q=80',
    badge: 'Hot Item',
    featured: true,
  },
  {
    id: 'shop_cyber_void_skull',
    name: 'Cyber Void Skull',
    collection: 'Cyberpunk 2026',
    category: 'avatar_decoration',
    description: 'Holographic cybernetic skull with pulsing glitch neon visors.',
    priceIdr: 78000,
    priceOrbs: 600,
    previewIcon: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&auto=format&fit=crop&q=80',
    badge: 'Best Seller',
    featured: true,
  },
  {
    id: 'shop_sakura_blossom_ring',
    name: 'Sakura Blossom Ring',
    collection: 'Spring Bloom',
    category: 'avatar_decoration',
    description: 'Gentle falling cherry blossom petals revolving smoothly around avatar.',
    priceIdr: 78000,
    priceOrbs: 600,
    previewIcon: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=200&auto=format&fit=crop&q=80',
    featured: false,
  },
  {
    id: 'shop_aurora_neon_glow',
    name: 'Aurora Neon Glow',
    collection: 'Cosmic Wonders',
    category: 'profile_effect',
    description: 'Shimmering polar emerald and violet auroral lights cascading behind profile card.',
    priceIdr: 98000,
    priceOrbs: 750,
    previewIcon: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop&q=80',
    badge: 'Popular',
    featured: true,
  },
  {
    id: 'shop_fireflies_aura',
    name: 'Fireflies Aura',
    collection: 'Cosmic Wonders',
    category: 'profile_effect',
    description: 'Golden glowing firefly particles rising organically around your profile bio.',
    priceIdr: 98000,
    priceOrbs: 750,
    previewIcon: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80',
    featured: false,
  },
  {
    id: 'shop_pixel_hive_crown',
    name: 'Pixel Hive Crown',
    collection: 'Retro Arcade',
    category: 'nameplate',
    description: '8-bit golden cyber royal crown displayed next to username.',
    priceIdr: 58000,
    priceOrbs: 450,
    previewIcon: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&auto=format&fit=crop&q=80',
    featured: false,
  },
];

export const shopApi = {
  async getItems(category?: string, query?: string): Promise<ShopItem[]> {
    try {
      const params: Record<string, string> = {};
      if (category && category !== 'all') params.category = category;
      if (query) params.q = query;
      const res = await api.get<any>('/v1/community/shop/items', { params });
      if (Array.isArray(res) && res.length > 0) return res;
    } catch {}
    return FALLBACK_SHOP_ITEMS;
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
      if (res && typeof res.orbs === 'number') {
        return {
          orbs: res.orbs,
          nectar: typeof res.nectar === 'number' ? res.nectar : 250,
          currencyCode: res.currencyCode || 'IDR',
        };
      }
    } catch {}
    return { orbs: 1500, nectar: 250, currencyCode: 'IDR' };
  },

  async topupOrbs(amount: number = 500): Promise<{ success: boolean; message: string; balance?: ShopBalance }> {
    try {
      return await api.post('/v1/community/shop/topup', { amount });
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal menambahkan Orbs' };
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
};
