import { api } from '@/lib/api';

export interface ShopItem {
  id: string;
  name: string;
  collection: string;
  category: 'avatar_decoration' | 'profile_effect' | 'nameplate' | 'bundle' | 'theme';
  description: string;
  priceIdr: number;
  priceDew: number;
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

export const FALLBACK_SHOP_ITEMS: ShopItem[] = [
  // 1. Anticeil Cyber Core (Animated Frames, Overlays & Namecards)
  {
    id: 'shop_cyber_void_frame',
    name: 'Cyber Void Frame (Animated)',
    collection: 'Anticeil Cyber Core',
    category: 'avatar_decoration',
    description: 'Bingkai avatar animasi GIF dengan cincin sirkuit neon cybernetic berputar dan denyut hologram biru sian.',
    priceIdr: 65000,
    priceDew: 500,
    priceOrbs: 500,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHp1eHN3YWRjM2I3bm8zdXFpdjB6Ym05OG5hbjN4MnExMmt6dWg3MyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/xT0xeJpnrWC4XWblEk/giphy.gif',
    previewIcon: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHp1eHN3YWRjM2I3bm8zdXFpdjB6Ym05OG5hbjN4MnExMmt6dWg3MyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/xT0xeJpnrWC4XWblEk/giphy.gif',
    badge: 'Animasi Baru',
    featured: true,
  },
  {
    id: 'shop_hex_matrix_nameplate',
    name: 'Hex Matrix Namecard (Animated)',
    collection: 'Anticeil Cyber Core',
    category: 'nameplate',
    description: 'Namecard strip animasi GIF dengan aliran gelombang kode sarang lebah futuristik di samping nama profil.',
    priceIdr: 45000,
    priceDew: 350,
    priceOrbs: 350,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ29va3Q1OXdtcXV5Ymg2cTdpYTV1eHBjcjdpZGk4N3Uzb3lsZ3NqaiZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/26tn33aiTi1jkl6H6/giphy.gif',
    previewIcon: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ29va3Q1OXdtcXV5Ymg2cTdpYTV1eHBjcjdpZGk4N3Uzb3lsZ3NqaiZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/26tn33aiTi1jkl6H6/giphy.gif',
    badge: 'Official',
    featured: false,
  },
  {
    id: 'shop_cyber_stream_overlay',
    name: 'Cyber Stream Overlay (Animated)',
    collection: 'Anticeil Cyber Core',
    category: 'profile_effect',
    description: 'Overlay efek kartu profil animasi GIF dengan hujan kode biner digital dan partikel glitch hologram berkilau.',
    priceIdr: 85000,
    priceDew: 650,
    priceOrbs: 650,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ29va3Q1OXdtcXV5Ymg2cTdpYTV1eHBjcjdpZGk4N3Uzb3lsZ3NqaiZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/26tn33aiTi1jkl6H6/giphy.gif',
    previewIcon: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ29va3Q1OXdtcXV5Ymg2cTdpYTV1eHBjcjdpZGk4N3Uzb3lsZ3NqaiZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/26tn33aiTi1jkl6H6/giphy.gif',
    badge: 'Hot Effect',
    featured: true,
  },
  {
    id: 'shop_anticeil_cyber_bundle',
    name: 'Anticeil Cybernetic Core Bundle (3pc Animated)',
    collection: 'Anticeil Cyber Core',
    category: 'bundle',
    description: 'Paket bundel lengkap: Bingkai Cyber Void, Overlay Matrix Stream, dan Hex Matrix Namecard.',
    priceIdr: 140000,
    priceDew: 1000,
    priceOrbs: 1000,
    discountPercent: 30,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHp1eHN3YWRjM2I3bm8zdXFpdjB6Ym05OG5hbjN4MnExMmt6dWg3MyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/xT0xeJpnrWC4XWblEk/giphy.gif',
    previewIcon: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHp1eHN3YWRjM2I3bm8zdXFpdjB6Ym05OG5hbjN4MnExMmt6dWg3MyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/xT0xeJpnrWC4XWblEk/giphy.gif',
    badge: 'Bundel Populer',
    itemTypes: ['avatar_decoration', 'profile_effect', 'nameplate'],
    featured: true,
  },

  // 2. Starlight Cosmic Collection (Animated Celestial)
  {
    id: 'shop_celestial_halo',
    name: 'Celestial Starlight Halo (Animated)',
    collection: 'Starlight Cosmic',
    category: 'avatar_decoration',
    description: 'Bingkai avatar animasi GIF lingkaran bintang emas berkilau dan partikel debu kosmik berotasi halus.',
    priceIdr: 65000,
    priceDew: 500,
    priceOrbs: 500,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYnJqNDd4OWI0dHFtdHhzM2VpdGlnZmdkMmp4cGhyanE4NHo1MHN6YiZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/3o7TKSjRrfIPjeiVyM/giphy.gif',
    previewIcon: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYnJqNDd4OWI0dHFtdHhzM2VpdGlnZmdkMmp4cGhyanE4NHo1MHN6YiZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/3o7TKSjRrfIPjeiVyM/giphy.gif',
    badge: 'Kosmik',
    featured: true,
  },
  {
    id: 'shop_starlight_namecard',
    name: 'Starlight Shimmer Namecard (Animated)',
    collection: 'Starlight Cosmic',
    category: 'nameplate',
    description: 'Namecard strip animasi GIF dengan pancaran pendar kilau konstelasi bintang dan pita nebula emas.',
    priceIdr: 45000,
    priceDew: 350,
    priceOrbs: 350,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYnJqNDd4OWI0dHFtdHhzM2VpdGlnZmdkMmp4cGhyanE4NHo1MHN6YiZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/3o7TKSjRrfIPjeiVyM/giphy.gif',
    previewIcon: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYnJqNDd4OWI0dHFtdHhzM2VpdGlnZmdkMmp4cGhyanE4NHo1MHN6YiZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/3o7TKSjRrfIPjeiVyM/giphy.gif',
    badge: 'Hot',
    featured: false,
  },
  {
    id: 'shop_aurora_glow_overlay',
    name: 'Aurora Borealis Spectrum Overlay (Animated)',
    collection: 'Starlight Cosmic',
    category: 'profile_effect',
    description: 'Overlay animasi GIF tirai cahaya polar aurora hijau zamrud dan violet menari anggun di atas kartu profil.',
    priceIdr: 85000,
    priceDew: 650,
    priceOrbs: 650,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExazl5MGI5OTU3a2Z2OXV6ZG42NTRhMW1rNmhrNWw3MWk2M29wb2psciZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/3o7bu3XilJ5BOiSGic/giphy.gif',
    previewIcon: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExazl5MGI5OTU3a2Z2OXV6ZG42NTRhMW1rNmhrNWw3MWk2M29wb2psciZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/3o7bu3XilJ5BOiSGic/giphy.gif',
    badge: 'Unggulan',
    featured: true,
  },
  {
    id: 'shop_anticeil_cosmic_bundle',
    name: 'Starlight Cosmic Odyssey Bundle (3pc Animated)',
    collection: 'Starlight Cosmic',
    category: 'bundle',
    description: 'Paket bundel kosmik lengkap: Bingkai Celestial Halo, Overlay Aurora Borealis, dan Starlight Namecard.',
    priceIdr: 150000,
    priceDew: 1100,
    priceOrbs: 1100,
    discountPercent: 25,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYnJqNDd4OWI0dHFtdHhzM2VpdGlnZmdkMmp4cGhyanE4NHo1MHN6YiZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/3o7TKSjRrfIPjeiVyM/giphy.gif',
    previewIcon: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYnJqNDd4OWI0dHFtdHhzM2VpdGlnZmdkMmp4cGhyanE4NHo1MHN6YiZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/3o7TKSjRrfIPjeiVyM/giphy.gif',
    badge: 'Unggulan',
    itemTypes: ['avatar_decoration', 'profile_effect', 'nameplate'],
    featured: true,
  },

  // 3. Nature & Zen Collection
  {
    id: 'shop_zen_sakura_frame',
    name: 'Zen Sakura Petals Frame (Animated)',
    collection: 'Nature & Zen',
    category: 'avatar_decoration',
    description: 'Bingkai avatar animasi GIF kelopak bunga sakura merah muda berputar melingkar lembut di sekeliling avatar.',
    priceIdr: 65000,
    priceDew: 500,
    priceOrbs: 500,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3N2c2J3YnpsdzJjcXl0OTk5OHZ4NW9wbjl6MWs1bnlsOXpmdG9zOSZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/l0MYt5jPR6QX5pnqM/giphy.gif',
    previewIcon: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3N2c2J3YnpsdzJjcXl0OTk5OHZ4NW9wbjl6MWs1bnlsOXpmdG9zOSZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/l0MYt5jPR6QX5pnqM/giphy.gif',
    badge: 'Favorit',
    featured: false,
  },
  {
    id: 'shop_fireflies_overlay',
    name: 'Golden Fireflies Field Overlay (Animated)',
    collection: 'Nature & Zen',
    category: 'profile_effect',
    description: 'Overlay animasi GIF kawanan kunang-kunang keemasan melayang lembut di malam hari menutupi kartu profil.',
    priceIdr: 85000,
    priceDew: 650,
    priceOrbs: 650,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExczU3bDN6OXpxeHN3bzI4eWprOWp6cTFscXFkZTBwbzE0bmk4d3JkOSZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/26BRzozg4TCBXv6QU/giphy.gif',
    previewIcon: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExczU3bDN6OXpxeHN3bzI4eWprOWp6cTFscXFkZTBwbzE0bmk4d3JkOSZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/26BRzozg4TCBXv6QU/giphy.gif',
    badge: 'Estetik',
    featured: false,
  },

  // 4. Inferno & Void Collection
  {
    id: 'shop_inferno_flame_frame',
    name: 'Inferno Flame Ring (Animated)',
    collection: 'Inferno & Void',
    category: 'avatar_decoration',
    description: 'Bingkai avatar animasi GIF kobaran api membara melingkari foto profil dengan percikan bara menyala.',
    priceIdr: 65000,
    priceDew: 500,
    priceOrbs: 500,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjA3YWRmYTVjOGMzMjdhZjhhMmM3ZjcyOGRhZjU2MzExMWJmZWI2MSZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/3o7TKtnuHOHHUjR38Y/giphy.gif',
    previewIcon: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjA3YWRmYTVjOGMzMjdhZjhhMmM3ZjcyOGRhZjU2MzExMWJmZWI2MSZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/3o7TKtnuHOHHUjR38Y/giphy.gif',
    badge: 'Intens',
    featured: true,
  },
  {
    id: 'shop_crimson_scratch_namecard',
    name: 'Crimson Scratch Glitch Namecard (Animated)',
    collection: 'Inferno & Void',
    category: 'nameplate',
    description: 'Namecard strip animasi GIF garis cakar merah darah dan denyut glitch crimson intens.',
    priceIdr: 45000,
    priceDew: 350,
    priceOrbs: 350,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaGgyaW05bWJqOWt0aXFzZG12dXB2ZHE5YWRqdGF1MnlqNHU1Mms4ZiZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/3oKIPnAiaMCws8nOsE/giphy.gif',
    previewIcon: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaGgyaW05bWJqOWt0aXFzZG12dXB2ZHE5YWRqdGF1MnlqNHU1Mms4ZiZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/3oKIPnAiaMCws8nOsE/giphy.gif',
    badge: 'Dark',
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
      if (res && (typeof res.dew === 'number' || typeof res.orbs === 'number')) {
        const dew = typeof res.dew === 'number' ? res.dew : res.orbs;
        return {
          dew,
          orbs: dew,
          currencyCode: res.currencyCode || 'IDR',
        };
      }
    } catch {}
    return { dew: 1500, orbs: 1500, currencyCode: 'IDR' };
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

  async deleteItem(itemId: string): Promise<{ success: boolean; message: string }> {
    try {
      return await api.delete(`/v1/community/shop/items/${itemId}`);
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal menghapus item' };
    }
  },
};
