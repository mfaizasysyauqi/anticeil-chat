export type ColonyRole =
  | 'owner'
  | 'admin'
  | 'moderator'
  | 'member'
  | 'bot'
  | 'platform_admin'
  | 'platform_operator'
  | 'project_admin'
  | 'project_editor'
  | 'project_viewer'
  | 'creator'
  | 'pro';

export type {
  ColonyId,
  CommunityCustomEmoji,
  Colony,
} from '@/lib/colony';

export type ColonyChannelType = 'text' | 'voice' | 'forum' | 'kanban';

export type ColonyChannel = {
  id: string;
  name: string;
  description: string;
  category: 'CHANNELS' | 'DIRECT MESSAGES';
  colonyId?: string;
  isDirectMessage?: boolean;
  dmUserId?: string;
  unreadCount?: number;
  type?: ColonyChannelType;
  isPrivate?: boolean;
  slowmode?: number;
  contentVisibility?: 'default' | 'spoiler' | 'nsfw';
};

export function resolveChannelType(channel?: Partial<ColonyChannel> | null): ColonyChannelType {
  if (!channel) return 'text';
  const rawType = (channel.type || '').toLowerCase();
  if (rawType === 'voice' || rawType === 'forum' || rawType === 'kanban') {
    return rawType;
  }
  const identifier = ((channel.name || '') + ' ' + (channel.id || '')).toLowerCase();
  if (identifier.includes('voice') || identifier.includes('suara')) {
    return 'voice';
  }
  if (identifier.includes('forum') || identifier.includes('diskusi') || identifier.includes('thread')) {
    return 'forum';
  }
  if (identifier.includes('kanban') || identifier.includes('board') || identifier.includes('tugas')) {
    return 'kanban';
  }
  return 'text';
}

export type CommunityAttachment = {
  type: 'image' | 'video' | 'audio' | 'file' | 'template' | 'sticker' | 'gif' | 'gift' | 'activity';
  url: string;
  name: string;
  size?: string;
  templateData?: {
    name: string;
    description: string;
    pieceCount: number;
    price?: string;
    flowJson?: string;
  };
  giftData?: {
    tier: 'nitro' | 'nitro_basic';
    price: string;
    claimed?: boolean;
  };
  activityData?: {
    appId: string;
    name: string;
    developer?: string;
    description?: string;
    icon?: string;
    iconBg?: string;
    bannerGradient?: string;
    startedBy?: string;
    startedById?: string;
    startedByAvatar?: string | null;
    channelId?: string;
    channelName?: string;
  };
};

export type ColonyMessageReply = {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  senderAvatar?: string | null;
};

export type ColonyMessage = {
  replyTo?: ColonyMessageReply | null;
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderAvatar?: string | null;
  senderRole: ColonyRole;
  content: string;
  createdAt: string;
  attachments?: CommunityAttachment[];
  reactions?: Record<string, string[]>; // emoji: [userId, ...]
  isPinned?: boolean;
  pinnedAt?: string | null;
  pinnedBy?: string | null;
  threadId?: string | null;
};

export type ColonyChannelNotificationLevel = 'default' | 'all' | 'mentions' | 'nothing';

export type ColonyChannelNotification = {
  id?: string;
  channelId: string;
  userId: string;
  level: ColonyChannelNotificationLevel;
  isMuted: boolean;
  mutedUntil?: string | null;
};

export type ColonyThread = {
  id: string;
  channelId: string;
  name: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string | null;
  messageCount: number;
  lastMessageAt: string;
  createdAt?: string;
  created?: string;
  updated?: string;
  updatedAt?: string;
};

export type ColonyMember = {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  avatar?: string | null;
  role: ColonyRole;
  roleLabel?: string;
  platformRole?: string;
  projectRole?: string | null;
  status: 'online' | 'idle' | 'offline';
  customStatus?: string;
  bio?: string;
  activity?: string;
  joinedAt?: string;
};

export type CommunityAuditEntry = {
  id: string;
  colonyId: string;
  action: string;
  actorName: string;
  targetName?: string;
  details?: Record<string, any> | string;
  createdAt: string;
};

export type CommunityInvite = {
  id: string;
  colonyId: string;
  code: string;
  inviterName?: string;
  uses: number;
  maxUses?: number;
  expiresAt?: string | null;
  createdAt: string;
};

export type ColonyBan = {
  id: string;
  colonyId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  reason: string;
  bannedByName?: string;
  createdAt: string;
};

export type CommunityCustomRole = {
  id: string;
  colonyId: string;
  name: string;
  color: string;
  permissions: string[];
  memberCount?: number;
  position?: number;
};

export type ColonyStats = {
  totalMessages: number;
  totalChannels: number;
  totalMembers: number;
  totalBots: number;
  botMessages: number;
  channelActivity: Array<{ channelId: string; channelName: string; messageCount: number }>;
};

import type { Colony } from '@/lib/colony';

// ── Domain Aliases ────────────────────────────────────────────────────


export type Server = Colony;
export type ServerId = string;
export type ServerRole = ColonyRole;
export type Channel = ColonyChannel;
export type ChannelType = ColonyChannelType;
export type ChatMessage = ColonyMessage;
export type ChatAttachment = CommunityAttachment;
export type ChatThread = ColonyThread;
export type ServerMember = ColonyMember;
export type ServerInvite = CommunityInvite;
export type ServerBan = ColonyBan;
export type ServerCustomRole = CommunityCustomRole;
export type ServerStats = ColonyStats;
export type ServerAuditEntry = CommunityAuditEntry;
export type ChannelNotification = ColonyChannelNotification;
export type ChannelNotificationLevel = ColonyChannelNotificationLevel;
