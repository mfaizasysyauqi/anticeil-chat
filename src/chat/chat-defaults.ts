import { ColonyChannel, Colony, ColonyMember, ColonyMessage } from './chat-types';
export { DEFAULT_COLONIES, loadStoredColonies, saveStoredColonies } from '@/lib/colony';

export const DEFAULT_CHANNELS: ColonyChannel[] = [];
export const DEFAULT_MEMBERS: ColonyMember[] = [];
export const INITIAL_MESSAGES: Record<string, ColonyMessage[]> = {};

// Domain aliases
export const INITIAL_CHAT_MESSAGES = INITIAL_MESSAGES;

const STORAGE_KEY_MESSAGES = 'anticeil_colony_messages_v3';
const STORAGE_KEY_CHANNELS = 'anticeil_colony_channels_v3';

export function loadStoredMessages(): Record<string, ColonyMessage[]> {
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

export function saveStoredMessages(messages: Record<string, ColonyMessage[]>): void {
  try {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
  } catch (err) {
    console.error('Failed to save community messages to storage', err);
  }
}

export const loadStoredChatMessages = loadStoredMessages;
export const saveStoredChatMessages = saveStoredMessages;

export function loadStoredChannels(): ColonyChannel[] {
  try {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('ap_token')) : null;
    if (!token) return [];
    const raw = localStorage.getItem(STORAGE_KEY_CHANNELS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    return parsed
      .filter((c) => {
        if (!c || !c.id || seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      })
      .map((c) => ((c.type === 'text' || !c.type) && c.name === 'General' ? { ...c, name: 'general' } : c));
  } catch {
    return [];
  }
}

export function saveStoredChannels(channels: ColonyChannel[]): void {
  try {
    const seen = new Set<string>();
    const unique = channels.filter((c) => {
      if (!c || !c.id || seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
    localStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(unique));
  } catch (err) {
    console.error('Failed to save community channels', err);
  }
}

// ── Direct Messages Storage ──
const STORAGE_KEY_DM_CHANNELS = 'anticeil_colony_dm_channels_v3';

export function loadStoredDmChannels(): ColonyChannel[] {
  try {
    if (typeof window === 'undefined') return [];
    const token = localStorage.getItem('token') || localStorage.getItem('ap_token');
    if (!token) return [];
    const raw = localStorage.getItem(STORAGE_KEY_DM_CHANNELS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const seenKeys = new Set<string>();
    const validDms: ColonyChannel[] = [];

    for (const c of parsed) {
      const name = (c?.name || '').toLowerCase().trim();
      const id = String(c?.id || '');
      const dmUserId = String(c?.dmUserId || '');
      if (
        !id.startsWith('dm-') ||
        id === 'dm-anticeil' ||
        id === 'dm-u1' ||
        dmUserId === 'u1' ||
        dmUserId === 'anticeil' ||
        name === 'anticeil official' ||
        name === 'anticeil' ||
        name === 'direct message' ||
        c?.category !== 'DIRECT MESSAGES' ||
        (c?.colonyId && c.colonyId !== 'anticeil') ||
        c?.type === 'voice' ||
        c?.type === 'forum' ||
        c?.type === 'kanban' ||
        name === 'general voice' ||
        name === 'general' ||
        name === 'forum-diskusi' ||
        name === 'pengguna' ||
        name === 'pengguna anticeil'
      ) {
        continue;
      }

      // Deduplicate strictly by name or user id to prevent duplicate DM items
      const dedupKey = dmUserId ? `user-${dmUserId}` : `name-${name}`;
      if (seenKeys.has(dedupKey) || seenKeys.has(`name-${name}`) || (dmUserId && seenKeys.has(`user-${dmUserId}`))) {
        continue;
      }
      seenKeys.add(dedupKey);
      seenKeys.add(`name-${name}`);
      if (dmUserId) seenKeys.add(`user-${dmUserId}`);
      validDms.push(c);
    }

    localStorage.setItem(STORAGE_KEY_DM_CHANNELS, JSON.stringify(validDms));
    return validDms;
  } catch {
    return [];
  }
}

export function saveStoredDmChannels(channels: ColonyChannel[]): void {
  try {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token') || localStorage.getItem('ap_token');
    if (!token) {
      localStorage.removeItem(STORAGE_KEY_DM_CHANNELS);
      return;
    }
    const seenKeys = new Set<string>();
    const dmsOnly: ColonyChannel[] = [];
    for (const c of channels) {
      const name = (c?.name || '').toLowerCase().trim();
      const id = String(c?.id || '');
      const dmUserId = String(c?.dmUserId || '');
      if (
        !id.startsWith('dm-') ||
        id === 'dm-anticeil' ||
        id === 'dm-u1' ||
        dmUserId === 'u1' ||
        dmUserId === 'anticeil' ||
        name === 'anticeil official' ||
        name === 'anticeil' ||
        name === 'direct message' ||
        c?.category !== 'DIRECT MESSAGES' ||
        (c?.colonyId && c.colonyId !== 'anticeil') ||
        c?.type === 'voice' ||
        c?.type === 'forum' ||
        c?.type === 'kanban' ||
        name === 'general voice' ||
        name === 'general' ||
        name === 'forum-diskusi' ||
        name === 'pengguna' ||
        name === 'pengguna anticeil'
      ) {
        continue;
      }
      const dedupKey = dmUserId ? `user-${dmUserId}` : `name-${name}`;
      if (seenKeys.has(dedupKey) || seenKeys.has(`name-${name}`) || (dmUserId && seenKeys.has(`user-${dmUserId}`))) {
        continue;
      }
      seenKeys.add(dedupKey);
      seenKeys.add(`name-${name}`);
      if (dmUserId) seenKeys.add(`user-${dmUserId}`);
      dmsOnly.push(c);
    }
    localStorage.setItem(STORAGE_KEY_DM_CHANNELS, JSON.stringify(dmsOnly));
  } catch (err) {
    console.error('Failed to save DM channels to storage', err);
  }
}

// ── Extended Storage (Invites, Bans, Roles, Audit Log) ──
const STORAGE_KEY_INVITES = 'anticeil_colony_invites_v3';
const STORAGE_KEY_BANS = 'anticeil_colony_bans_v3';
const STORAGE_KEY_ROLES = 'anticeil_colony_roles_v3';
const STORAGE_KEY_AUDIT = 'anticeil_colony_audit_v3';

export function loadStoredInvites(colonyId: string): any[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_INVITES}_${colonyId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredInvites(colonyId: string, invites: any[]): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_INVITES}_${colonyId}`, JSON.stringify(invites));
  } catch (err) {
    console.error('Failed to save invites', err);
  }
}

export function loadStoredBans(colonyId: string): any[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_BANS}_${colonyId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredBans(colonyId: string, bans: any[]): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_BANS}_${colonyId}`, JSON.stringify(bans));
  } catch (err) {
    console.error('Failed to save bans', err);
  }
}

export function loadStoredRoles(colonyId: string): any[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_ROLES}_${colonyId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredRoles(colonyId: string, roles: any[]): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_ROLES}_${colonyId}`, JSON.stringify(roles));
  } catch (err) {
    console.error('Failed to save roles', err);
  }
}

export function loadStoredAuditLog(colonyId: string): any[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_AUDIT}_${colonyId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredAuditLog(colonyId: string, logs: any[]): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_AUDIT}_${colonyId}`, JSON.stringify(logs));
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

