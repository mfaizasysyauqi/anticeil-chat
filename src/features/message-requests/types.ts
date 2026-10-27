export interface MessageRequestItem {
  id: string;
  userId: string;
  name: string;
  username: string;
  avatar?: string | null;
  date: string;
  mutualServers: number;
  isSpam?: boolean;
  initialMessage?: string;
}

export type MessageRequestsTab = 'requests' | 'spam';
