import { api } from '@/lib/api';

export interface FavoriteGameWidget {
  title: string;
  accountName: string;
  region: string;
  bannerUrl?: string;
  stats?: Array<{ label: string; value: string }>;
}

export interface WishlistItem {
  id: string;
  title: string;
  category?: string;
  icon?: string;
  previewUrl?: string;
}

export interface ActivityData {
  title: string;
  subtitle: string;
  timeAgo?: string;
  icon?: string;
}

export interface UserProfileWidgets {
  favoriteGame?: FavoriteGameWidget | null;
  gamesILike?: string[];
  wishlist?: WishlistItem[];
  activity?: ActivityData | null;
  showActivity?: boolean;
  showConnections?: boolean;
  dismissedSuggested?: boolean;
  nameplate?: string;
  profileFrame?: string;
  profileEffect?: string;
  profileTheme?: string;
  avatarDecoration?: string;
  displayNameStyle?: string;
}

export interface UserProfileData {
  bio: string;
  pronouns: string;
  bannerColor: string;
  bannerUrl?: string | null;
  avatarUrl?: string | null;
  avatarDecoration?: string | null;
  statusThought: string;
  phoneNumber?: string;
  theme?: string;
  nameplate?: string;
  profileEffect?: string;
  profileFrame?: string;
  displayNameStyle?: string;
  customStatus?: string;
  createdAt?: string;
  widgets?: UserProfileWidgets;
}

export interface ColonyUserProfile {
  colonyId: string;
  nickname: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  bannerColor?: string;
  bio?: string;
}

const PROFILE_STORAGE_KEY = 'anticeil_user_profile';
const COLONY_PROFILE_PREFIX = 'anticeil_colony_profile_';

const DEFAULT_PROFILE: UserProfileData = {
  bio: '',
  pronouns: '',
  bannerColor: '#5c4d44',
  statusThought: '',
  theme: 'teal',
  nameplate: 'none',
  profileEffect: 'none',
  profileFrame: 'none',
  avatarDecoration: 'none',
  displayNameStyle: 'default',
  widgets: {
    favoriteGame: null,
    gamesILike: [],
    wishlist: [],
    activity: null,
    showActivity: true,
    showConnections: true,
    dismissedSuggested: false,
    nameplate: 'none',
    profileFrame: 'none',
    profileEffect: 'none',
    profileTheme: 'teal',
    avatarDecoration: 'none',
    displayNameStyle: 'default',
  },
};

export const profileApi = {
  getProfile: async (userId?: string): Promise<UserProfileData> => {
    try {
      const endpoint = userId ? `/v1/users/${userId}/profile` : '/v1/users/me/profile';
      const data = await api.get<UserProfileData>(endpoint);
      if (data && (data.bio !== undefined || data.bannerColor || data.statusThought !== undefined)) {
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
    const current = await profileApi.getProfile();
    const updated = { ...current, ...updates };

    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    try {
      const res = await api.put<UserProfileData>('/v1/users/me/profile', updated);
      if (res && (res.bio !== undefined || res.bannerColor)) {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(res));
        return res;
      }
    } catch {}

    return updated;
  },

  getColonyProfile: async (colonyId: string): Promise<ColonyUserProfile> => {
    try {
      const res = await api.get<ColonyUserProfile>(`/v1/colony/colonies/${colonyId}/members/me/profile`);
      if (res && res.colonyId) {
        localStorage.setItem(`${COLONY_PROFILE_PREFIX}${colonyId}`, JSON.stringify(res));
        return res;
      }
    } catch {}

    try {
      const stored = localStorage.getItem(`${COLONY_PROFILE_PREFIX}${colonyId}`);
      if (stored) return JSON.parse(stored);
    } catch {}

    return {
      colonyId,
      nickname: '',
      avatarUrl: null,
      bannerUrl: null,
      bannerColor: '#5c4d44',
      bio: '',
    };
  },

  updateColonyProfile: async (
    colonyId: string,
    updates: Partial<ColonyUserProfile>,
  ): Promise<ColonyUserProfile> => {
    const current = await profileApi.getColonyProfile(colonyId);
    const updated = { ...current, ...updates, colonyId };

    try {
      localStorage.setItem(`${COLONY_PROFILE_PREFIX}${colonyId}`, JSON.stringify(updated));
    } catch {}

    try {
      await api.put(`/v1/colony/colonies/${colonyId}/members/me/profile`, updated);
    } catch {}

    return updated;
  },
};
