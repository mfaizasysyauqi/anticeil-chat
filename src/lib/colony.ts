export type ColonyId = 'anticeil' | 'direct-messages' | string;

export type ColonyCustomEmoji = {
  id: string;
  name: string;
  char?: string;
  url?: string;
};

export type ColonySticker = {
  id: string;
  name: string;
  url: string;
  description?: string;
  relatedEmoji?: string;
};

export type ColonySound = {
  id: string;
  name: string;
  emoji?: string;
  url?: string;
  volume?: number;
  soundType?: string;
};

export type ColonyApp = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  banner?: string;
  badge?: string;
  verified?: boolean;
  slashCommands?: string[];
  permissions?: string[];
  allowedChannels?: string[];
  enabled?: boolean;
  author?: string;
  settings?: Record<string, unknown>;
  installedAt?: string;
};

export type ColonySafetySettings = {
  raidProtection?: {
    captchaOnJoin?: boolean;
    raidAlerts?: boolean;
    autoPauseInvites?: boolean;
  };
  dmSpamProtection?: {
    filterExplicitMedia?: boolean;
    blockKnownSpam?: boolean;
    rateLimitNewMembers?: boolean;
    warnUnverifiedLinks?: boolean;
    filterInvites?: boolean;
  };
  autoMod?: {
    blockFlaggedWords?: boolean;
    blockSevereProfanity?: boolean;
    blockSpamRepeated?: boolean;
    blockEveryoneMentions?: boolean;
    customBlocklist?: string[];
  };
  permissions?: {
    restrictEveryoneMention?: boolean;
    disableUploadsUnverified?: boolean;
    require2faModeration?: boolean;
  };
};

export type ColonyAccessSettings = {
  joinMethod?: 'invite_only' | 'apply' | 'discoverable';
  ageRestricted?: boolean;
  rulesEnabled?: boolean;
  rules?: string[];
  screeningQuestions?: Array<{ id: string; question: string; required?: boolean }>;
  requireVerification?: boolean;
};

export type ColonyApplication = {
  id: string;
  hubId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  answers: Record<string, string>;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

export type ColonyCommunitySettings = {
  enabled?: boolean;
  rulesChannelId?: string;
  communityUpdatesChannelId?: string;
  safetyNotificationsChannelId?: string;
  primaryLanguage?: string;
  description?: string;
};

export type ColonyOnboardingOption = {
  id: string;
  label: string;
  description?: string;
  roleId?: string;
  channelId?: string;
};

export type ColonyOnboardingQuestion = {
  id: string;
  title: string;
  description?: string;
  options: ColonyOnboardingOption[];
};

export type ColonyOnboarding = {
  enabled?: boolean;
  welcomeMessage?: string;
  defaultChannelIds?: string[];
  tasks?: Array<{ id: string; title: string; channelId: string; completed?: boolean }>;
  questions?: ColonyOnboardingQuestion[];
  rules?: string[];
  requireRulesAgreement?: boolean;
};

export type ColonyTemplateSettings = {
  name?: string;
  description?: string;
  code?: string;
  lastSyncedAt?: string;
};

export interface ColonyInsights {
  hubId: string;
  timeRangeDays: number;
  overview: {
    totalMembers: number;
    communicators: number;
    communicatorsTrend: string;
    memberRetention: string;
    memberRetentionTrend: string;
    welcomeCompletion: string;
    welcomeCompletionTrend: string;
    announcementViews: number;
    announcementViewsTrend: string;
    engagementScore: number;
  };
  dailyActivity: Array<{
    date: string;
    messages: number;
    activeMembers: number;
    voiceMinutes: number;
  }>;
  hourlyDistribution: Array<{
    hour: number;
    hourLabel: string;
    count: number;
  }>;
  channelBreakdown: Array<{
    channelId: string;
    channelName: string;
    channelType: string;
    messageCount: number;
    percent: number;
  }>;
  peakHoursSummary: string;
}

export type Colony = {
  id: ColonyId;
  name: string;
  iconType?: 'logo' | 'spark' | 'bot' | 'templates' | 'code' | 'dm' | 'initials';
  initials: string;
  description?: string;
  unreadCount?: number;
  inviteCode?: string;
  membersCount?: number;
  onlineCount?: number;
  verified?: boolean;
  color?: string;
  iconUrl?: string;
  role?: 'owner' | 'admin' | 'moderator' | 'member';
  ownerId?: string;
  isPublic?: boolean;
  visibility?: 'public' | 'private';
  tags?: string[];
  category?: string;
  emojis?: ColonyCustomEmoji[];
  boostsCount?: number;
  boostTier?: number;
  serverTag?: {
    name: string;
    badge: string;
    color: string;
    badgeId?: string;
  };
  engagementSettings?: {
    sendWelcomeMessage?: boolean;
    replyWelcomeSticker?: boolean;
    sendBoostMessage?: boolean;
    sendSetupTips?: boolean;
    systemChannelId?: string;
    activityFeedEnabled?: boolean;
    defaultNotifications?: 'all' | 'mentions';
    afkChannelId?: string | null;
    afkTimeout?: number;
    widgetEnabled?: boolean;
  };
  showBoostProgressBar?: boolean;
  serverBannerUrl?: string;
  inviteBackgroundUrl?: string;
  customInviteVanity?: string;
  stickers?: ColonySticker[];
  sounds?: ColonySound[];
  accessSettings?: ColonyAccessSettings;
  installedApps?: ColonyApp[];
  safetySettings?: ColonySafetySettings;
  communitySettings?: ColonyCommunitySettings;
  onboarding?: ColonyOnboarding;
  templateSettings?: ColonyTemplateSettings;
  tier?: 'free' | 'nectar' | 'royal';
  ssoEnabled?: boolean;
  ssoProvider?: 'google_workspace' | 'microsoft_azure' | 'okta' | 'generic_oidc';
  allowedEmailDomains?: string[];
  defaultChannelId?: string;
  domainVerificationToken?: string;
  domainVerified?: boolean;
  ssoEnforced?: boolean;
};

export const DEFAULT_COLONIES: Colony[] = [
  {
    id: 'anticeil',
    name: 'Pesan Langsung',
    iconType: 'logo',
    initials: 'DM',
    description: 'Saluran pesan langsung untuk obrolan pribadi dengan rekan tim.',
  },
];

const STORAGE_KEY_COLONIES = 'anticeil_colony_colonies_v3';

export function cleanLegacyStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('ap_token');
    if (!token) {
      localStorage.removeItem('anticeil_colony_dm_channels_v3');
      localStorage.removeItem('anticeil_colony_channels_v3');
    }
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('anticeil_community_') ||
          key.startsWith('anticeil_hub_') ||
          key === 'anticeil_hubs')
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

const DUMMY_COLONY_IDS = new Set(['hub_agl', 'hub_tech', 'hub_lofi', 'hub_edu', 'hub_hangout']);

export function loadStoredColonies(): Colony[] {
  try {
    cleanLegacyStorage();
    const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('ap_token')) : null;
    if (!token) return DEFAULT_COLONIES;
    const raw = localStorage.getItem(STORAGE_KEY_COLONIES);
    if (!raw) return DEFAULT_COLONIES;
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) && parsed.length > 0
      ? parsed.filter((c) => !DUMMY_COLONY_IDS.has(c.id))
      : DEFAULT_COLONIES;
    return list.map((c) => {
      const sanitized = c.id === 'anticeil' ? { ...c, iconType: 'logo', iconUrl: undefined } : c;
      return {
        ...sanitized,
        membersCount: typeof sanitized.membersCount === 'number' && sanitized.membersCount > 0 ? sanitized.membersCount : 1,
        onlineCount: typeof sanitized.onlineCount === 'number' && sanitized.onlineCount > 0 ? sanitized.onlineCount : 1,
      };
    });
  } catch {
    return DEFAULT_COLONIES;
  }
}

export function saveStoredColonies(colonies: Colony[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_COLONIES, JSON.stringify(colonies));
    window.dispatchEvent(new Event('anticeil_colonies_changed'));
    window.dispatchEvent(new Event('anticeil_hubs_changed'));
  } catch (err) {
    console.error('Failed to save community hubs to storage', err);
  }
}

export type ColonyInvitation = {
  id: string;
  colonyId?: string;
  colonyName?: string;
  colonyDescription?: string;
  colonyIconUrl?: string;
  inviterId?: string;
  inviterName?: string;
  inviterUsername?: string;
  inviterAvatar?: string;
  membersCount?: number;
  createdAt?: string;
  serverId?: string;
  serverName?: string;
  serverDescription?: string;
  serverIconUrl?: string;
};

export type ServerInvitation = ColonyInvitation;
export type LegacyServerInvitation = {
  id: string;
  serverId: string;
  serverName: string;
  serverDescription?: string;
  serverIconUrl?: string;
  inviterName: string;
  inviterUsername?: string;
  inviterAvatar?: string;
  createdAt?: string;
  membersCount?: number;
};

const STORAGE_KEY_SERVER_INVITES = 'anticeil_server_invitations_v1';

export const DEFAULT_SERVER_INVITATIONS: ServerInvitation[] = [];

export const loadStoredServerInvitations = loadStoredColonyInvitations;
export const saveStoredServerInvitations = saveStoredColonyInvitations;
export function loadStoredColonyInvitations(): ServerInvitation[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_SERVER_INVITES) : null;
    if (!raw) return DEFAULT_SERVER_INVITATIONS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Purge legacy dummy invitations (e.g. inv-dev-team)
      return parsed.filter((inv) => inv && inv.id && inv.id !== 'inv-dev-team' && inv.serverId !== 'explore-gaming');
    }
    return DEFAULT_SERVER_INVITATIONS;
  } catch {
    return DEFAULT_SERVER_INVITATIONS;
  }
}

export function saveStoredColonyInvitations(invitations: ServerInvitation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SERVER_INVITES, JSON.stringify(invitations));
    window.dispatchEvent(new Event('anticeil_server_invites_changed'));
  } catch (err) {
    console.error('Failed to save server invitations to storage', err);
  }
}

