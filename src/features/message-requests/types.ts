export interface MessageRequestItem {
  id: string;
  userId: string;
  name: string;
  username: string;
  avatar?: string | null;
  date: string;
  mutualServers: number;
  isSpam?: boolean;
  isContact?: boolean;
  initialMessage?: string;
}

export type MessageRequestsTab = 'requests' | 'non_contacts' | 'spam';
