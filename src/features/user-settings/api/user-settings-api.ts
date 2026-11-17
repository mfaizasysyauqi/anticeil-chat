import { api } from '@/lib/api';

export interface PrivacySettings {
  safeDirectMessaging: 'safe' | 'friends' | 'none';
  allowDmsFromServerMembers: boolean;
  allowFriendRequestsFrom: {
    everyone: boolean;
    friendsOfFriends: boolean;
    serverMembers: boolean;
  };
  useDataForImprovement: boolean;
  useDataForPersonalization: boolean;
}

export interface NotificationSettings {
  enableDesktopNotifications: boolean;
  enableTaskbarFlashing: boolean;
  soundNewMessage: boolean;
  soundCurrentChannel: boolean;
  soundIncomingRing: boolean;
  disableAllSounds: boolean;
  enableUnreadBadges: boolean;
  emailCommunication: boolean;
  emailSocial: boolean;
  notifyReactions: 'all' | 'my-messages' | 'never';
}

export interface AppearanceSettings {
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
  chatFontScale: 'small' | 'normal' | 'large';
  messageDisplay: 'cozy' | 'compact';
}

export interface VoiceVideoSettings {
  inputVolume: number;
  outputVolume: number;
  noiseSuppression: boolean;
  echoCancellation: boolean;
}

export interface UserSettings {
  privacy: PrivacySettings;
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
  voiceVideo: VoiceVideoSettings;
  language: string;
  developer: {
    developerMode: boolean;
  };
}

const SETTINGS_STORAGE_KEY = 'anticeil_user_settings';

export const DEFAULT_USER_SETTINGS: UserSettings = {
  privacy: {
    safeDirectMessaging: 'safe',
    allowDmsFromServerMembers: true,
    allowFriendRequestsFrom: {
      everyone: true,
      friendsOfFriends: true,
      serverMembers: true,
    },
    useDataForImprovement: true,
    useDataForPersonalization: true,
  },
  notifications: {
    enableDesktopNotifications: true,
    enableTaskbarFlashing: true,
    soundNewMessage: true,
    soundCurrentChannel: false,
    soundIncomingRing: true,
    disableAllSounds: false,
    enableUnreadBadges: true,
    emailCommunication: true,
    emailSocial: true,
    notifyReactions: 'all',
  },
  appearance: {
    theme: 'dark',
    accentColor: 'teal',
    chatFontScale: 'normal',
    messageDisplay: 'cozy',
  },
  voiceVideo: {
    inputVolume: 100,
    outputVolume: 100,
    noiseSuppression: true,
    echoCancellation: true,
  },
  language: 'id',
  developer: {
    developerMode: false,
  },
};

export const userSettingsApi = {
  getSettings: async (): Promise<UserSettings> => {
    // 1. Try local storage cache for instant rendering
    let cached = DEFAULT_USER_SETTINGS;
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        cached = { ...DEFAULT_USER_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {}

    // 2. Fetch fresh from backend
    try {
      const remote = await api.get<UserSettings>('/v1/users/me/settings');
      if (remote && typeof remote === 'object') {
        const merged = {
          ...DEFAULT_USER_SETTINGS,
          ...remote,
          privacy: { ...DEFAULT_USER_SETTINGS.privacy, ...(remote.privacy || {}) },
          notifications: { ...DEFAULT_USER_SETTINGS.notifications, ...(remote.notifications || {}) },
          appearance: { ...DEFAULT_USER_SETTINGS.appearance, ...(remote.appearance || {}) },
          voiceVideo: { ...DEFAULT_USER_SETTINGS.voiceVideo, ...(remote.voiceVideo || {}) },
        };
        try {
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
        } catch {}
        return merged;
      }
    } catch {}

    return cached;
  },

  updateSettings: async (updates: Partial<UserSettings>): Promise<UserSettings> => {
    // Update local cache immediately
    let current = DEFAULT_USER_SETTINGS;
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        current = { ...DEFAULT_USER_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {}

    const updated: UserSettings = {
      ...current,
      ...updates,
      privacy: { ...current.privacy, ...(updates.privacy || {}) },
      notifications: { ...current.notifications, ...(updates.notifications || {}) },
      appearance: { ...current.appearance, ...(updates.appearance || {}) },
      voiceVideo: { ...current.voiceVideo, ...(updates.voiceVideo || {}) },
    };

    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    // Persist to backend
    try {
      const res = await api.put<UserSettings>('/v1/users/me/settings', updates);
      if (res) {
        const finalMerged = {
          ...updated,
          ...res,
          privacy: { ...updated.privacy, ...(res.privacy || {}) },
          notifications: { ...updated.notifications, ...(res.notifications || {}) },
        };
        try {
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(finalMerged));
        } catch {}
        return finalMerged;
      }
    } catch {}

    return updated;
  },
};
