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
  hubId?: string;
  hubName?: string;
  createdAt: string;
  isRead: boolean;
}

export type NotificationsTab = 'all' | 'mentions' | 'unread';
