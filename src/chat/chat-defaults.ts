import { ColonyChannel, Colony, ColonyMember, ColonyMessage } from './chat-types';
export { DEFAULT_COLONIES, loadStoredColonies, saveStoredColonies } from '@/lib/colony';

export const DEFAULT_CHANNELS: ColonyChannel[] = [
  // ── Colony: Cyberpunk DAO ──
  {
    id: 'ch_cp_general',
    colonyId: 'colony_cyberpunk',
    name: 'general',
    type: 'text',
    category: 'CHANNELS',
    categoryId: 'cat_text_colony_cyberpunk',
    categoryName: 'SALURAN TEKS',
    description: 'Kanal diskusi resmi & pengujian real-time Anticeil',
    topic: 'Kanal diskusi resmi & pengujian real-time Anticeil',
  },
  {
    id: 'ch_cp_announcement',
    colonyId: 'colony_cyberpunk',
    name: 'pengumuman-resmi',
    type: 'announcement',
    isAnnouncement: true,
    category: 'CHANNELS',
    categoryId: 'cat_announcements_colony_cyberpunk',
    categoryName: 'PENGUMUMAN RESMI',
    description: 'Pengumuman resmi dan info penting Cyberpunk DAO',
    topic: 'Pengumuman resmi dan pembaruan ekosistem Anticeil',
  },
  {
    id: 'ch_cp_rules',
    colonyId: 'colony_cyberpunk',
    name: 'aturan-komunitas',
    type: 'text',
    category: 'CHANNELS',
    categoryId: 'cat_announcements_colony_cyberpunk',
    categoryName: 'PENGUMUMAN RESMI',
    description: 'Pedoman, etika, dan tata tertib komunitas',
    topic: 'Pedoman & etika komunitas Cyberpunk DAO',
  },
  {
    id: 'ch_cp_dev',
    colonyId: 'colony_cyberpunk',
    name: 'dev-chat',
    type: 'text',
    category: 'CHANNELS',
    categoryId: 'cat_text_colony_cyberpunk',
    categoryName: 'SALURAN TEKS',
    description: 'Diskusi arsitektur microservices, WebRTC, dan SDK',
    topic: 'Diskusi engineering, coding, dan arsitektur',
  },
  {
    id: 'ch_cp_showcase',
    colonyId: 'colony_cyberpunk',
    name: 'showcase-karya',
    type: 'text',
    category: 'CHANNELS',
    categoryId: 'cat_text_colony_cyberpunk',
    categoryName: 'SALURAN TEKS',
    description: 'Pameran karya web, mini-app, dan desain',
    topic: 'Pamerkan kreasi dan karya terbaik Anda',
  },
  {
    id: 'ch_cp_voice_lounge',
    colonyId: 'colony_cyberpunk',
    name: 'Lounge Umum',
    type: 'voice',
    category: 'CHANNELS',
    categoryId: 'cat_voice_colony_cyberpunk',
    categoryName: 'RUANG SUARA & VIDEO',
    description: 'Ruang obrolan santai WebRTC mesh audio',
    topic: 'Ruang suara santai dengan WebRTC mesh audio jernih',
    userLimit: 25,
  },
  {
    id: 'ch_cp_voice_gaming',
    colonyId: 'colony_cyberpunk',
    name: 'Gaming Squad 1',
    type: 'voice',
    category: 'CHANNELS',
    categoryId: 'cat_voice_colony_cyberpunk',
    categoryName: 'RUANG SUARA & VIDEO',
    description: 'Saluran suara untuk mabar dan live stream game',
    topic: 'Mabar & gaming voice lounge',
    userLimit: 8,
  },
  {
    id: 'ch_cp_act_watch',
    colonyId: 'colony_cyberpunk',
    name: 'Nobar YouTube Sync',
    type: 'voice',
    category: 'CHANNELS',
    categoryId: 'cat_activities_colony_cyberpunk',
    categoryName: 'AKTIVITAS & MINI-APPS',
    description: 'Aktivitas nobar video tersinkronisasi bersama kawan',
    topic: 'Nonton bareng YouTube 24/7 tersinkronisasi',
  },
  {
    id: 'ch_cp_act_chess',
    colonyId: 'colony_cyberpunk',
    name: 'Anticeil Catur Arena',
    type: 'voice',
    category: 'CHANNELS',
    categoryId: 'cat_activities_colony_cyberpunk',
    categoryName: 'AKTIVITAS & MINI-APPS',
    description: 'Bermain catur real-time atau uji kecerdasan lawan Bot AI',
    topic: 'Anticeil Multiplayer Chess Arena',
  },
  {
    id: 'ch_cp_act_ai',
    colonyId: 'colony_cyberpunk',
    name: 'Atlas AI Copilot',
    type: 'text',
    category: 'CHANNELS',
    categoryId: 'cat_activities_colony_cyberpunk',
    categoryName: 'AKTIVITAS & MINI-APPS',
    description: 'Asisten AI otomatis untuk bantuan kode dan otomatisasi',
    topic: 'Atlas AI Agent terintegrasi',
  },
  {
    id: 'ch_cp_forum_feedback',
    colonyId: 'colony_cyberpunk',
    name: 'Saran Fitur 2026',
    type: 'forum',
    category: 'CHANNELS',
    categoryId: 'cat_forum_colony_cyberpunk',
    categoryName: 'FORUM & DISKUSI',
    description: 'Forum ide dan request fitur Anticeil',
    topic: 'Forum diskusi dan voting fitur baru Anticeil',
  },
];
export const DEFAULT_MEMBERS: ColonyMember[] = [];
export const INITIAL_MESSAGES: Record<string, ColonyMessage[]> = {
  ch_cp_general: [
    {
      id: 'msg_cp_1',
      channelId: 'ch_cp_general',
      senderId: 'usr_faiz',
      senderName: 'Muhammad Faiz',
      senderEmail: 'faiz@anticeil.com',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80',
      senderRole: 'admin',
      content: 'Just merged the WebRTC mesh audio update! Sound quality is crystal clear with under 40ms latency 🚀',
      createdAt: '14:32',
      reactions: {
        '👍': ['usr_faiz', 'usr_sarah', 'usr_alex', 'usr_4', 'usr_5', 'usr_6', 'usr_7', 'usr_8', 'usr_9', 'usr_10', 'usr_11', 'usr_12'],
        '🚀': ['usr_faiz', 'usr_sarah', 'usr_alex', 'usr_4', 'usr_5', 'usr_6', 'usr_7', 'usr_8'],
      },
    },
    {
      id: 'msg_cp_2',
      channelId: 'ch_cp_general',
      senderId: 'usr_sarah',
      senderName: 'Sarah Jenkins',
      senderEmail: 'sarah@anticeil.com',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80',
      senderRole: 'moderator',
      content: "Awesome! Let's spin up Watch Together in the call room to test synchronized video playback.",
      createdAt: '14:33',
    },
    {
      id: 'msg_cp_3',
      channelId: 'ch_cp_general',
      senderId: 'usr_watch_bot',
      senderName: 'Watch Together',
      senderEmail: 'watch@anticeil.app',
      senderAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=youtube',
      senderRole: 'member',
      content: '',
      createdAt: '14:34',
      attachments: [
        {
          type: 'activity',
          url: '',
          name: 'Watch Together',
          activityData: {
            appId: 'watch-together',
            name: 'Watch Together',
            developer: 'Anticeil Activity',
            description: 'Playing: Synthwave Radio 24/7 (3 viewers)',
            icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=youtube',
          },
        },
      ],
    },
    {
      id: 'msg_cp_4',
      channelId: 'ch_cp_general',
      senderId: 'usr_alex',
      senderName: 'Alex Chen',
      senderEmail: 'alex@anticeil.com',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80',
      senderRole: 'member',
      content: "Here is the quick Node SDK snippet to trigger real-time colony webhooks:\n\n```typescript\nimport { Anticeil } from '@anticeil/sdk';\n\nconst client = new Anticeil({ apiKey: 'atc_live_...' });\nawait client.channels.send({ channelId: 'general', content: 'Ping!' });\n```",
      createdAt: '14:35',
    },
  ],
};

// Domain aliases
export const INITIAL_CHAT_MESSAGES = INITIAL_MESSAGES;

const STORAGE_KEY_MESSAGES = 'anticeil_colony_messages_v3';
const STORAGE_KEY_CHANNELS = 'anticeil_colony_channels_v3';

export function loadStoredMessages(): Record<string, ColonyMessage[]> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_MESSAGES) : null;
    const stored = raw ? JSON.parse(raw) : {};
    return { ...INITIAL_MESSAGES, ...stored };
  } catch {
    return { ...INITIAL_MESSAGES };
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
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_CHANNELS) : null;
    const parsed = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(parsed) && parsed.length > 0 ? parsed : [];
    const seen = new Set<string>();
    const merged: ColonyChannel[] = [];
    for (const c of [...list, ...DEFAULT_CHANNELS]) {
      if (!c || !c.id || seen.has(c.id)) continue;
      seen.add(c.id);
      merged.push((c.type === 'text' || !c.type) && c.name === 'General' ? { ...c, name: 'general' } : c);
    }
    return merged;
  } catch {
    return DEFAULT_CHANNELS;
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
const STORAGE_KEY_CLOSED_DM_IDS = 'anticeil_closed_dm_ids_v1';

export function getClosedDmIds(): Set<string> {
  try {
    if (typeof window === 'undefined') return new Set();
    const raw = localStorage.getItem(STORAGE_KEY_CLOSED_DM_IDS);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function setClosedDmId(dmId: string, closed: boolean): void {
  try {
    if (typeof window === 'undefined' || !dmId) return;
    const set = getClosedDmIds();
    if (closed) {
      set.add(dmId);
    } else {
      set.delete(dmId);
    }
    localStorage.setItem(STORAGE_KEY_CLOSED_DM_IDS, JSON.stringify(Array.from(set)));
  } catch {}
}

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
        id === 'dm-u1' ||
        dmUserId === 'u1' ||
        (!dmUserId && (name === 'direct message' || name === 'pengguna')) ||
        c?.category !== 'DIRECT MESSAGES' ||
        (c?.colonyId && c.colonyId !== 'anticeil') ||
        c?.type === 'voice' ||
        c?.type === 'forum' ||
        c?.type === 'kanban' ||
        name === 'general voice' ||
        name === 'general' ||
        name === 'forum-diskusi' ||
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
      if (c.description && typeof c.description === 'string') {
        c.description = c.description.replace(/\s*\((?:Member|member)\)/gi, '').trim();
      }
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
        id === 'dm-u1' ||
        dmUserId === 'u1' ||
        (!dmUserId && (name === 'direct message' || name === 'pengguna')) ||
        c?.category !== 'DIRECT MESSAGES' ||
        (c?.colonyId && c.colonyId !== 'anticeil') ||
        c?.type === 'voice' ||
        c?.type === 'forum' ||
        c?.type === 'kanban' ||
        name === 'general voice' ||
        name === 'general' ||
        name === 'forum-diskusi' ||
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
      if (c.description && typeof c.description === 'string') {
        c.description = c.description.replace(/\s*\((?:Member|member)\)/gi, '').trim();
      }
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

