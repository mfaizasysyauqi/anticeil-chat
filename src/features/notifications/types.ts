export interface NotificationItem {
  id: string;
  actorId: string;
  actorName: string;
  actorUsername?: string;
  actorAvatar?: string | null;
  type: 'mention' | 'reply' | 'activity' | 'reaction' | 'message';
  title: string;
  summary: string;
  channelId: string;
  channelName: string;
  colonyId?: string;
  hubName?: string;
  createdAt: string;
  isRead: boolean;
  messageId?: string;
  targetUserId?: string;
  targetUserIds?: string[];
}

export type NotificationsTab = 'all' | 'mentions' | 'unread';
