export type CommunityHubId = 'anticeil' | 'direct-messages' | string;

export type CommunityCustomEmoji = {
  id: string;
  name: string;
  char?: string;
  url?: string;
};

export type CommunityHub = {
  id: CommunityHubId;
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

export const DEFAULT_HUBS: CommunityHub[] = [
  {
    id: 'anticeil',
    name: 'Pesan Langsung',
    iconType: 'logo',
    initials: 'DM',
    description: 'Saluran pesan langsung untuk obrolan pribadi dengan rekan tim.',
  },
];

const STORAGE_KEY_HUBS = 'anticeil_community_hubs_v3';

export function loadStoredHubs(): CommunityHub[] {
  try {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('ap_token')) : null;
    if (!token) return DEFAULT_HUBS;
    const raw = localStorage.getItem(STORAGE_KEY_HUBS);
    if (!raw) return DEFAULT_HUBS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_HUBS;
  } catch {
    return DEFAULT_HUBS;
  }
}

export function saveStoredHubs(hubs: CommunityHub[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_HUBS, JSON.stringify(hubs));
    window.dispatchEvent(new Event('anticeil_hubs_changed'));
  } catch (err) {
    console.error('Failed to save community hubs to storage', err);
  }
}

export type ServerInvitation = {
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

export const DEFAULT_SERVER_INVITATIONS: ServerInvitation[] = [
  {
    id: 'inv-dev-team',
    serverId: 'explore-gaming',
    serverName: 'Indo Gaming Lounge & Esports',
    serverDescription: 'Tempat kumpul mabar Valorant, Mobile Legends, Genshin Impact, dan nonton bareng YouTube.',
    inviterName: 'Muhammad Faiz Asy Syauqi',
    inviterUsername: 'mfaizasysyauqi',
    inviterAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    createdAt: 'Baru saja',
    membersCount: 5120,
  },
];

export function loadStoredServerInvitations(): ServerInvitation[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_SERVER_INVITES) : null;
    if (!raw) return DEFAULT_SERVER_INVITATIONS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_SERVER_INVITATIONS;
  } catch {
    return DEFAULT_SERVER_INVITATIONS;
  }
}

export function saveStoredServerInvitations(invitations: ServerInvitation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SERVER_INVITES, JSON.stringify(invitations));
    window.dispatchEvent(new Event('anticeil_server_invites_changed'));
  } catch (err) {
    console.error('Failed to save server invitations to storage', err);
  }
}
