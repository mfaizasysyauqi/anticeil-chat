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
    id: 'shop_anticeil_cyber_bundle',
    name: 'Anticeil Cybernetic Core Bundle (3pc)',
    collection: 'Anticeil Cyber Core',
    category: 'bundle',
    description: 'Paket bundel lengkap: Dekorasi Avatar Cyber Void, Efek Profil Hologram Matrix, dan Nameplate Hex Shield.',
    priceIdr: 140000,
    priceOrbs: 1000,
    discountPercent: 30,
    previewIcon: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    badge: 'Bundel Populer',
    itemTypes: ['avatar_decoration', 'profile_effect', 'nameplate'],
    featured: true,
  },
  {
    id: 'shop_anticeil_cyber_void',
    name: 'Cyber Void Frame',
    collection: 'Anticeil Cyber Core',
    category: 'avatar_decoration',
    description: 'Bingkai avatar futuristik dengan aksen neon cybernetic dan partikel hologram berkilau.',
    priceIdr: 65000,
    priceOrbs: 500,
    previewIcon: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&auto=format&fit=crop&q=80',
    badge: 'Baru',
    featured: true,
  },
  {
    id: 'shop_anticeil_hex_badge',
    name: 'Hex Matrix Nameplate',
    collection: 'Anticeil Cyber Core',
    category: 'nameplate',
    description: 'Pelat nama sarang lebah futuristik dengan aksen biru sian khas Anticeil.',
    priceIdr: 45000,
    priceOrbs: 350,
    previewIcon: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&auto=format&fit=crop&q=80',
    badge: 'Official',
    featured: false,
  },
  {
    id: 'shop_anticeil_cosmic_bundle',
    name: 'Starlight Cosmic Odyssey Bundle (3pc)',
    collection: 'Starlight Cosmic',
    category: 'bundle',
    description: 'Aura galaksi kosmik, cincin avatar nebula bersinar, dan lencana konstelasi eksklusif Anticeil.',
    priceIdr: 150000,
    priceOrbs: 1100,
    discountPercent: 25,
    previewIcon: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80',
    badge: 'Unggulan',
    itemTypes: ['avatar_decoration', 'profile_effect', 'nameplate'],
    featured: true,
  },
  {
    id: 'shop_anticeil_aurora_glow',
    name: 'Aurora Borealis Spectrum',
    collection: 'Aurora Spectrum',
    category: 'profile_effect',
    description: 'Pendaran cahaya polar aurora hijau zamrud dan violet elegan pada latar kartu profil.',
    priceIdr: 85000,
    priceOrbs: 650,
    previewIcon: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop&q=80',
    badge: 'Populer',
    featured: true,
  },
  {
    id: 'shop_anticeil_starlight_crown',
    name: 'Starlight Celestial Crown',
    collection: 'Starlight Cosmic',
    category: 'nameplate',
    description: 'Lencana mahkota bintang berkilau halus di samping nama pengguna Anda.',
    priceIdr: 45000,
    priceOrbs: 350,
    previewIcon: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80',
    badge: 'Hot',
    featured: true,
  },
  {
    id: 'shop_anticeil_obsidian_frame',
    name: 'Obsidian Geometric Border',
    collection: 'Obsidian Minimalist',
    category: 'avatar_decoration',
    description: 'Garis tepi geometris monokrom tajam dan minimalis untuk tampilan avatar elegan.',
    priceIdr: 55000,
    priceOrbs: 420,
    previewIcon: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&auto=format&fit=crop&q=80',
    badge: 'Minimalis',
    featured: true,
  },
  {
    id: 'shop_anticeil_sakura_ring',
    name: 'Zen Sakura Petals',
    collection: 'Nature & Zen',
    category: 'avatar_decoration',
    description: 'Kelopak bunga sakura lembut berputar melingkar di sekeliling avatar profil.',
    priceIdr: 65000,
    priceOrbs: 500,
    previewIcon: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=200&auto=format&fit=crop&q=80',
    badge: 'Favorit',
    featured: false,
  },
  {
    id: 'shop_anticeil_fireflies_aura',
    name: 'Golden Fireflies Field',
    collection: 'Nature & Zen',
    category: 'profile_effect',
    description: 'Partikel kunang-kunang keemasan melayang lembut di kartu profil Anda.',
    priceIdr: 85000,
    priceOrbs: 650,
    previewIcon: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80',
    badge: 'Estetik',
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

  async createItem(item: Partial<ShopItem>): Promise<{ success: boolean; message: string; item?: ShopItem }> {
    try {
      return await api.post('/v1/community/shop/items', item);
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal menambahkan item ke database' };
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
