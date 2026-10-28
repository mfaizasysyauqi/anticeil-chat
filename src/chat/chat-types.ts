export type CommunityRole =
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
  CommunityHubId,
  CommunityCustomEmoji,
  CommunityHub,
} from '@/lib/community-hubs';

export type CommunityChannelType = 'text' | 'voice' | 'forum' | 'kanban';

export type CommunityChannel = {
  id: string;
  name: string;
  description: string;
  category: 'CHANNELS' | 'DIRECT MESSAGES';
  hubId?: string;
  isDirectMessage?: boolean;
  dmUserId?: string;
  unreadCount?: number;
  type?: CommunityChannelType;
  isPrivate?: boolean;
  slowmode?: number;
  contentVisibility?: 'default' | 'spoiler' | 'nsfw';
};

export function resolveChannelType(channel?: Partial<CommunityChannel> | null): CommunityChannelType {
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

export type CommunityMessage = {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderAvatar?: string | null;
  senderRole: CommunityRole;
  content: string;
  createdAt: string;
  attachments?: CommunityAttachment[];
  reactions?: Record<string, string[]>; // emoji: [userId, ...]
  isPinned?: boolean;
  pinnedAt?: string | null;
  pinnedBy?: string | null;
  threadId?: string | null;
};

export type CommunityChannelNotificationLevel = 'default' | 'all' | 'mentions' | 'nothing';

export type CommunityChannelNotification = {
  id?: string;
  channelId: string;
  userId: string;
  level: CommunityChannelNotificationLevel;
  isMuted: boolean;
  mutedUntil?: string | null;
};

export type CommunityThread = {
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

export type CommunityMember = {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  avatar?: string | null;
  role: CommunityRole;
  roleLabel?: string;
  platformRole?: string;
  projectRole?: string | null;
  status: 'online' | 'idle' | 'offline';
  customStatus?: string;
};

export type CommunityAuditEntry = {
  id: string;
  hubId: string;
  action: string;
  actorName: string;
  targetName?: string;
  details?: Record<string, any> | string;
  createdAt: string;
};

export type CommunityInvite = {
  id: string;
  hubId: string;
  code: string;
  inviterName?: string;
  uses: number;
  maxUses?: number;
  expiresAt?: string | null;
  createdAt: string;
};

export type CommunityBan = {
  id: string;
  hubId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  reason: string;
  bannedByName?: string;
  createdAt: string;
};

export type CommunityCustomRole = {
  id: string;
  hubId: string;
  name: string;
  color: string;
  permissions: string[];
  memberCount?: number;
  position?: number;
};

export type CommunityHubStats = {
  totalMessages: number;
  totalChannels: number;
  totalMembers: number;
  totalBots: number;
  botMessages: number;
  channelActivity: Array<{ channelId: string; channelName: string; messageCount: number }>;
};

// ── Domain Aliases (Aligning Code with UI/UX: Server, Channel, Chat) ──
import type { CommunityHub } from '@/lib/community-hubs';

export type Server = CommunityHub;
export type ServerId = string;
export type ServerRole = CommunityRole;
export type Channel = CommunityChannel;
export type ChannelType = CommunityChannelType;
export type ChatMessage = CommunityMessage;
export type ChatAttachment = CommunityAttachment;
export type ChatThread = CommunityThread;
export type ServerMember = CommunityMember;
export type ServerInvite = CommunityInvite;
export type ServerBan = CommunityBan;
export type ServerCustomRole = CommunityCustomRole;
export type ServerStats = CommunityHubStats;
export type ServerAuditEntry = CommunityAuditEntry;
export type ChannelNotification = CommunityChannelNotification;
export type ChannelNotificationLevel = CommunityChannelNotificationLevel;
