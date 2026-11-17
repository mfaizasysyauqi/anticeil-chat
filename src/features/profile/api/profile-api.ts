import { api } from '@/lib/api';

export interface FavoriteGameWidget {
  title: string;
  accountName: string;
  region: string;
  stats?: Array<{ label: string; value: string }>;
}

export interface WishlistItem {
  id: string;
  title: string;
  category?: string;
  icon?: string;
}

export interface ActivityData {
  title: string;
  subtitle: string;
  timeAgo?: string;
}

export interface UserProfileWidgets {
  favoriteGame?: FavoriteGameWidget | null;
  gamesILike?: string[];
  wishlist?: WishlistItem[];
  activity?: ActivityData;
  showActivity?: boolean;
  showConnections?: boolean;
  dismissedSuggested?: boolean;
  nameplate?: string;
  profileFrame?: string;
  profileEffect?: string;
  profileTheme?: string;
}

export interface UserProfileData {
  bio: string;
  pronouns: string;
  bannerColor: string;
  bannerUrl?: string | null;
  avatarUrl?: string | null;
  statusThought: string;
  theme?: string;
  nameplate?: string;
  profileEffect?: string;
  profileFrame?: string;
  customStatus?: string;
  createdAt?: string;
  widgets?: UserProfileWidgets;
}

const PROFILE_STORAGE_KEY = 'anticeil_user_profile';

const DEFAULT_PROFILE: UserProfileData = {
  bio: 'Your life in one sentence',
  pronouns: '',
  bannerColor: '#5c4d44',
  statusThought: 'Shower thought?',
  theme: 'teal',
  nameplate: 'none',
  profileEffect: 'none',
  profileFrame: 'none',
  widgets: {
    favoriteGame: {
      title: 'Neverness to Everness',
      accountName: 'DartX',
      region: 'SEA',
      stats: [
        { label: 'Hunter Lv.', value: '58' },
        { label: 'Appraiser Since', value: '2026-04-29' },
        { label: 'Characters', value: '23' },
        { label: 'Vehicles', value: '10' },
        { label: 'Achievements', value: '275' },
        { label: 'City Tycoon Lv.', value: '45' },
      ],
    },
    gamesILike: ['Minecraft', 'Valorant'],
    wishlist: [
      { id: 'w1', title: 'Nectar VIP Subscription', category: 'Perks', icon: '🍯' },
      { id: 'w2', title: 'Neverness to Everness Pass', category: 'Game', icon: '🎮' },
    ],
    activity: {
      title: 'Neverness to Everness',
      subtitle: 'Exploring SEA Server',
      timeAgo: '2 jam yang lalu',
    },
    showActivity: true,
    showConnections: true,
    dismissedSuggested: false,
    nameplate: 'none',
    profileFrame: 'none',
    profileEffect: 'none',
    profileTheme: 'teal',
  },
};

export const profileApi = {
  getProfile: async (userId?: string): Promise<UserProfileData> => {
    try {
      const endpoint = userId ? `/v1/users/${userId}/profile` : '/v1/users/me/profile';
      const data = await api.get<UserProfileData>(endpoint);
      if (data && (data.bio || data.bannerColor || data.statusThought)) {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    } catch {}

    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
      }
    } catch {}

    return DEFAULT_PROFILE;
  },

  updateProfile: async (updates: Partial<UserProfileData>): Promise<UserProfileData> => {
    let current = await profileApi.getProfile();
    const updated = { ...current, ...updates };

    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    try {
      const res = await api.put<UserProfileData>('/v1/users/me/profile', updated);
      if (res && (res.bio || res.bannerColor)) {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(res));
        return res;
      }
    } catch {}

    return updated;
  },
};
