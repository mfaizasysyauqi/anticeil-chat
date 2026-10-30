import { CommunityChannel, CommunityHub, CommunityMember, CommunityMessage } from './chat-types';
export { DEFAULT_HUBS, loadStoredHubs, saveStoredHubs } from '@/lib/community-hubs';

export const DEFAULT_CHANNELS: CommunityChannel[] = [];
export const DEFAULT_MEMBERS: CommunityMember[] = [];
export const INITIAL_MESSAGES: Record<string, CommunityMessage[]> = {};

// Domain aliases
export const INITIAL_CHAT_MESSAGES = INITIAL_MESSAGES;

const STORAGE_KEY_MESSAGES = 'anticeil_community_messages_v3';
const STORAGE_KEY_CHANNELS = 'anticeil_community_channels_v3';

export function loadStoredMessages(): Record<string, CommunityMessage[]> {
  try {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('ap_token')) : null;
    if (!token) return {};
    const raw = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveStoredMessages(messages: Record<string, CommunityMessage[]>): void {
  try {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
  } catch (err) {
    console.error('Failed to save community messages to storage', err);
  }
}

export const loadStoredChatMessages = loadStoredMessages;
export const saveStoredChatMessages = saveStoredMessages;

export function loadStoredChannels(): CommunityChannel[] {
  try {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('ap_token')) : null;
    if (!token) return [];
    const raw = localStorage.getItem(STORAGE_KEY_CHANNELS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredChannels(channels: CommunityChannel[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(channels));
  } catch (err) {
    console.error('Failed to save community channels', err);
  }
}

// ── Direct Messages Storage ──
const STORAGE_KEY_DM_CHANNELS = 'anticeil_community_dm_channels_v3';

export function loadStoredDmChannels(): CommunityChannel[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY_DM_CHANNELS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Strict filter: ONLY real DM channels (ID starts with 'dm-', category 'DIRECT MESSAGES', text type only, not a server channel)
    const validDms = parsed.filter(
      (c: any) =>
        typeof c?.id === 'string' &&
        c.id.startsWith('dm-') &&
        c.category === 'DIRECT MESSAGES' &&
        (!c.hubId || c.hubId === 'anticeil') &&
        c.type !== 'voice' &&
        c.type !== 'forum' &&
        c.type !== 'kanban',
    );
    if (validDms.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY_DM_CHANNELS, JSON.stringify(validDms));
    }
    return validDms;
  } catch {
    return [];
  }
}

export function saveStoredDmChannels(channels: CommunityChannel[]): void {
  try {
    if (typeof window === 'undefined') return;
    const dmsOnly = channels.filter(
      (c) =>
        typeof c?.id === 'string' &&
        c.id.startsWith('dm-') &&
        c.category === 'DIRECT MESSAGES' &&
        (!c.hubId || c.hubId === 'anticeil') &&
        c.type !== 'voice' &&
        c.type !== 'forum' &&
        c.type !== 'kanban',
    );
    localStorage.setItem(STORAGE_KEY_DM_CHANNELS, JSON.stringify(dmsOnly));
  } catch (err) {
    console.error('Failed to save DM channels to storage', err);
  }
}

// ── Extended Storage (Invites, Bans, Roles, Audit Log) ──
const STORAGE_KEY_INVITES = 'anticeil_community_invites_v3';
const STORAGE_KEY_BANS = 'anticeil_community_bans_v3';
const STORAGE_KEY_ROLES = 'anticeil_community_roles_v3';
const STORAGE_KEY_AUDIT = 'anticeil_community_audit_v3';

export function loadStoredInvites(hubId: string): any[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_INVITES}_${hubId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredInvites(hubId: string, invites: any[]): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_INVITES}_${hubId}`, JSON.stringify(invites));
  } catch (err) {
    console.error('Failed to save invites', err);
  }
}

export function loadStoredBans(hubId: string): any[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_BANS}_${hubId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredBans(hubId: string, bans: any[]): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_BANS}_${hubId}`, JSON.stringify(bans));
  } catch (err) {
    console.error('Failed to save bans', err);
  }
}

export function loadStoredRoles(hubId: string): any[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_ROLES}_${hubId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredRoles(hubId: string, roles: any[]): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_ROLES}_${hubId}`, JSON.stringify(roles));
  } catch (err) {
    console.error('Failed to save roles', err);
  }
}

export function loadStoredAuditLog(hubId: string): any[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_AUDIT}_${hubId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredAuditLog(hubId: string, logs: any[]): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_AUDIT}_${hubId}`, JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to save audit logs', err);
  }
}

/**
 * Computes a symmetrical, deterministic canonical channel ID for direct messages between two users.
 * Ensures User A -> User B and User B -> User A always use the EXACT same channel ID.
 */
export function getDmChannelId(userId1?: string | null, userId2?: string | null): string {
  if (!userId1 && !userId2) return 'dm-chat';
  if (!userId1) return `dm-${userId2}`;
  if (!userId2) return `dm-${userId1}`;
  const sorted = [String(userId1), String(userId2)].sort();
  return `dm-${sorted[0]}-${sorted[1]}`;
}

export function isDmChannelId(channelId?: string | null): boolean {
  return Boolean(channelId && channelId.startsWith('dm-'));
}

export function parseDmUserIds(channelId?: string | null): string[] {
  if (!channelId || !channelId.startsWith('dm-')) return [];
  return channelId.slice(3).split('-').filter(Boolean);
}

