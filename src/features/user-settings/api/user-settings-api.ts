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

export interface PermissionsSettings {
  contentFilterTab: 'mature' | 'graphic';
  contentFilterSettings: {
    mature: { friends: string; others: string; server: string };
    graphic: { friends: string; others: string; server: string };
  };
  allowAgeRestrictedCommands: boolean;
  allowAgeRestrictedIos: boolean;
  spamFilterOption: 'all' | 'non-friends' | 'none';
  enableMessageRequests: boolean;
  showPersonalizedFriendRequests: boolean;
  allowGameDmsAndInvites: boolean;
  gameDmsVisibility: 'all' | 'game-players' | 'none';
  allowDmsFromServerMembers: boolean;
  allowFriendRequestsFrom: {
    everyone: boolean;
    friendsOfFriends: boolean;
    serverMembers: boolean;
  };
}

export interface AccessibilitySettings {
  showUserAvatars: boolean;
  chatFontSize: number;
  alwaysUnderlineLinks: boolean;
  displayNameStyles: boolean;
  uiDensity: 'compact' | 'default' | 'spacious';
  chatMessageDisplay: 'default' | 'compact';
  spaceMessageGroups: number;
  zoomLevel: number;
  saturationLevel: number;
  applySaturationCustomColors: boolean;
  enableHighContrast: boolean;
  syncContrastSettings: boolean;
  roleColorsDisplay: 'names' | 'dot' | 'none';
  officialMessagesStyle: 'default' | 'contrast' | 'plain';
  showOnOffIndicators: boolean;
  enableReducedMotion: boolean;
  syncReducedMotionComputer: boolean;
  notificationDuration: number;
  playGifsFocused: boolean;
  playAnimatedEmoji: boolean;
  stickerAnimationMode: 'always' | 'interaction' | 'never';
}

export interface SystemSettings {
  autoStartApp: boolean;
  startMinimized: boolean;
  minimizeToTray: boolean;
  enableHardwareAcceleration: boolean;
  customKeybinds: Array<{
    id: string;
    action: string;
    keybind: string;
    enabled: boolean;
  }>;
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
  sameAsDeviceTheme?: boolean;
  selectedDefaultTheme?: string;
  selectedColorTheme?: string;
  syncThemeDevices?: boolean;
  applyThemeToProfiles?: boolean;
  selectedAppIcon?: string;
  showMediaFromLinks?: boolean;
  showMediaUploaded?: boolean;
  showEmbedsPreviews?: boolean;
  showEmojiReactions?: boolean;
  spoilerDisplay?: 'click' | 'mod' | 'always';
  openThreadsSplitView?: boolean;
  showUserAvatars?: boolean;
  showFavoritesServer?: boolean;
  previewMarkdownAsType?: boolean;
  convertEmoticonsToEmoji?: boolean;
  showStickersAutocomplete?: boolean;
  showGamesAutocomplete?: boolean;
  showSendMessageButton?: boolean;
  dmSearchScope?: 'single' | 'all';
  streamerModeEnabled?: boolean;
  autoStreamerModeObs?: boolean;
  streamerHidePersonalInfo?: boolean;
  streamerHideInviteLinks?: boolean;
  streamerDisableSounds?: boolean;
  streamerDisableNotifications?: boolean;
  streamerHideWindowCapture?: boolean;
}

export interface VoiceVideoSettings {
  inputVolume: number;
  outputVolume: number;
  noiseSuppression: boolean;
  echoCancellation: boolean;
}

export interface UserSettings {
  privacy: PrivacySettings;
  permissions: PermissionsSettings;
  accessibility: AccessibilitySettings;
  system: SystemSettings;
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
  voiceVideo: VoiceVideoSettings;
  language: string;
  developer: {
    developerMode: boolean;
    applicationTestMode?: boolean;
    applicationTestId?: string;
  };
}

export const DEFAULT_PERMISSIONS_SETTINGS: PermissionsSettings = {
  contentFilterTab: 'mature',
  contentFilterSettings: {
    mature: {
      friends: 'show',
      others: 'block',
      server: 'show',
    },
    graphic: {
      friends: 'show',
      others: 'block',
      server: 'show',
    },
  },
  allowAgeRestrictedCommands: false,
  allowAgeRestrictedIos: false,
  spamFilterOption: 'non-friends',
  enableMessageRequests: true,
  showPersonalizedFriendRequests: true,
  allowGameDmsAndInvites: true,
  gameDmsVisibility: 'all',
  allowDmsFromServerMembers: true,
  allowFriendRequestsFrom: {
    everyone: true,
    friendsOfFriends: true,
    serverMembers: true,
  },
};

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  showUserAvatars: true,
  chatFontSize: 16,
  alwaysUnderlineLinks: false,
  displayNameStyles: true,
  uiDensity: 'default',
  chatMessageDisplay: 'default',
  spaceMessageGroups: 16,
  zoomLevel: 100,
  saturationLevel: 100,
  applySaturationCustomColors: false,
  enableHighContrast: false,
  syncContrastSettings: true,
  roleColorsDisplay: 'names',
  officialMessagesStyle: 'default',
  showOnOffIndicators: false,
  enableReducedMotion: false,
  syncReducedMotionComputer: true,
  notificationDuration: 3,
  playGifsFocused: true,
  playAnimatedEmoji: true,
  stickerAnimationMode: 'always',
};

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  autoStartApp: false,
  startMinimized: false,
  minimizeToTray: true,
  enableHardwareAcceleration: true,
  customKeybinds: [
    {
      id: 'kb-1',
      action: 'Activate Overlay Chat',
      keybind: 'No Keybind Set',
      enabled: true,
    },
  ],
};

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
  permissions: DEFAULT_PERMISSIONS_SETTINGS,
  accessibility: DEFAULT_ACCESSIBILITY_SETTINGS,
  system: DEFAULT_SYSTEM_SETTINGS,
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
    sameAsDeviceTheme: false,
    selectedDefaultTheme: 'navy',
    selectedColorTheme: 'custom',
    syncThemeDevices: true,
    applyThemeToProfiles: false,
    selectedAppIcon: 'default',
    showMediaFromLinks: true,
    showMediaUploaded: true,
    showEmbedsPreviews: true,
    showEmojiReactions: true,
    spoilerDisplay: 'click',
    openThreadsSplitView: true,
    showUserAvatars: true,
    showFavoritesServer: false,
    previewMarkdownAsType: true,
    convertEmoticonsToEmoji: true,
    showStickersAutocomplete: false,
    showGamesAutocomplete: true,
    showSendMessageButton: false,
    dmSearchScope: 'single',
    streamerModeEnabled: false,
    autoStreamerModeObs: true,
    streamerHidePersonalInfo: true,
    streamerHideInviteLinks: true,
    streamerDisableSounds: true,
    streamerDisableNotifications: true,
    streamerHideWindowCapture: false,
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
    applicationTestMode: false,
    applicationTestId: '',
  },
};

export const userSettingsApi = {
  getSettings: async (): Promise<UserSettings> => {
    // 1. Try local storage cache for instant rendering
    let cached = DEFAULT_USER_SETTINGS;
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        cached = {
          ...DEFAULT_USER_SETTINGS,
          ...parsed,
          privacy: { ...DEFAULT_USER_SETTINGS.privacy, ...(parsed.privacy || {}) },
          permissions: { ...DEFAULT_USER_SETTINGS.permissions, ...(parsed.permissions || {}) },
          accessibility: { ...DEFAULT_USER_SETTINGS.accessibility, ...(parsed.accessibility || {}) },
          system: { ...DEFAULT_USER_SETTINGS.system, ...(parsed.system || {}) },
          notifications: { ...DEFAULT_USER_SETTINGS.notifications, ...(parsed.notifications || {}) },
          appearance: { ...DEFAULT_USER_SETTINGS.appearance, ...(parsed.appearance || {}) },
          voiceVideo: { ...DEFAULT_USER_SETTINGS.voiceVideo, ...(parsed.voiceVideo || {}) },
          developer: { ...DEFAULT_USER_SETTINGS.developer, ...(parsed.developer || {}) },
        };
        if (cached.appearance?.selectedAppIcon === 'blurple') {
          cached.appearance.selectedAppIcon = 'default';
        }
      }
    } catch {}

    // 2. Fetch fresh from backend
    try {
      const remote = await api.get<UserSettings>('/v1/users/me/settings');
      if (remote && typeof remote === 'object') {
        const merged: UserSettings = {
          ...DEFAULT_USER_SETTINGS,
          ...cached,
          ...remote,
          privacy: { ...DEFAULT_USER_SETTINGS.privacy, ...cached.privacy, ...(remote.privacy || {}) },
          permissions: { ...DEFAULT_USER_SETTINGS.permissions, ...cached.permissions, ...(remote.permissions || {}) },
          accessibility: { ...DEFAULT_USER_SETTINGS.accessibility, ...cached.accessibility, ...(remote.accessibility || {}) },
          system: { ...DEFAULT_USER_SETTINGS.system, ...cached.system, ...(remote.system || {}) },
          notifications: { ...DEFAULT_USER_SETTINGS.notifications, ...cached.notifications, ...(remote.notifications || {}) },
          appearance: { ...DEFAULT_USER_SETTINGS.appearance, ...cached.appearance, ...(remote.appearance || {}) },
          voiceVideo: { ...DEFAULT_USER_SETTINGS.voiceVideo, ...cached.voiceVideo, ...(remote.voiceVideo || {}) },
          developer: { ...DEFAULT_USER_SETTINGS.developer, ...cached.developer, ...(remote.developer || {}) },
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
        const parsed = JSON.parse(stored);
        current = {
          ...DEFAULT_USER_SETTINGS,
          ...parsed,
          privacy: { ...DEFAULT_USER_SETTINGS.privacy, ...(parsed.privacy || {}) },
          permissions: { ...DEFAULT_USER_SETTINGS.permissions, ...(parsed.permissions || {}) },
          accessibility: { ...DEFAULT_USER_SETTINGS.accessibility, ...(parsed.accessibility || {}) },
          system: { ...DEFAULT_USER_SETTINGS.system, ...(parsed.system || {}) },
          notifications: { ...DEFAULT_USER_SETTINGS.notifications, ...(parsed.notifications || {}) },
          appearance: { ...DEFAULT_USER_SETTINGS.appearance, ...(parsed.appearance || {}) },
          voiceVideo: { ...DEFAULT_USER_SETTINGS.voiceVideo, ...(parsed.voiceVideo || {}) },
          developer: { ...DEFAULT_USER_SETTINGS.developer, ...(parsed.developer || {}) },
        };
        if (current.appearance?.selectedAppIcon === 'blurple') {
          current.appearance.selectedAppIcon = 'default';
        }
      }
    } catch {}

    const updated: UserSettings = {
      ...current,
      ...updates,
      privacy: { ...current.privacy, ...(updates.privacy || {}) },
      permissions: { ...current.permissions, ...(updates.permissions || {}) },
      accessibility: { ...current.accessibility, ...(updates.accessibility || {}) },
      system: { ...current.system, ...(updates.system || {}) },
      notifications: { ...current.notifications, ...(updates.notifications || {}) },
      appearance: { ...current.appearance, ...(updates.appearance || {}) },
      voiceVideo: { ...current.voiceVideo, ...(updates.voiceVideo || {}) },
      developer: { ...current.developer, ...(updates.developer || {}) },
    };

    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    // Persist to backend
    try {
      const res = await api.put<UserSettings>('/v1/users/me/settings', updates);
      if (res && typeof res === 'object') {
        const finalMerged: UserSettings = {
          ...updated,
          ...res,
          privacy: { ...updated.privacy, ...(res.privacy || {}) },
          permissions: { ...updated.permissions, ...(res.permissions || {}) },
          accessibility: { ...updated.accessibility, ...(res.accessibility || {}) },
          system: { ...updated.system, ...(res.system || {}) },
          notifications: { ...updated.notifications, ...(res.notifications || {}) },
          appearance: { ...updated.appearance, ...(res.appearance || {}) },
          voiceVideo: { ...updated.voiceVideo, ...(res.voiceVideo || {}) },
          developer: { ...updated.developer, ...(res.developer || {}) },
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
