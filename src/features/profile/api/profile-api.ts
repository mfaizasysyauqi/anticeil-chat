import { api } from '@/lib/api';

export interface UserProfileData {
  bio: string;
  pronouns: string;
  bannerColor: string;
  bannerUrl?: string | null;
  avatarUrl?: string | null;
  statusThought: string;
  theme?: string;
  customStatus?: string;
  widgets?: {
    favoriteGame?: string;
    gamesILike?: string[];
    showActivity?: boolean;
    showConnections?: boolean;
  };
}

const PROFILE_STORAGE_KEY = 'anticeil_user_profile';

const DEFAULT_PROFILE: UserProfileData = {
  bio: 'Your life in one sentence',
  pronouns: '',
  bannerColor: '#5c4d44',
  statusThought: 'Shower thought?',
  widgets: {
    favoriteGame: 'Neverness to Everness',
    gamesILike: ['Minecraft', 'Valorant'],
    showActivity: true,
    showConnections: true,
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
