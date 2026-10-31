export type ColonyId = 'anticeil' | 'direct-messages' | string;

export type CommunityCustomEmoji = {
  id: string;
  name: string;
  char?: string;
  url?: string;
};

export type Colony = {
  id: ColonyId;
  name: string;
  iconType?: 'logo' | 'spark' | 'bot' | 'templates' | 'code' | 'dm' | 'initials';
  initials: string;
  description?: string;
  unreadCount?: number;
  inviteCode?: string;
  membersCount?: number;
  color?: string;
  iconUrl?: string;
  role?: 'owner' | 'admin' | 'moderator' | 'member';
  tags?: string[];
  emojis?: CommunityCustomEmoji[];
  boostsCount?: number;
  boostTier?: number;
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

const STORAGE_KEY_COLONIES = 'anticeil_community_hubs_v3';

export function loadStoredColonies(): Colony[] {
  try {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('ap_token')) : null;
    if (!token) return DEFAULT_COLONIES;
    const raw = localStorage.getItem(STORAGE_KEY_COLONIES);
    if (!raw) return DEFAULT_COLONIES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_COLONIES;
  } catch {
    return DEFAULT_COLONIES;
  }
}

export function saveStoredColonies(colonies: Colony[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_COLONIES, JSON.stringify(colonies));
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

