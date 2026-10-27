export interface FriendMember {
  id: string;
  name: string;
  username?: string | null;
  avatar?: string | null;
  imageUrl?: string | null;
  email?: string | null;
  status?: 'online' | 'idle' | 'dnd' | 'offline' | string;
  customStatus?: string;
  [key: string]: any;
}

export interface FriendRequest {
  id: string;
  name: string;
  username?: string | null;
  avatar?: string | null;
  direction: 'incoming' | 'outgoing';
  status?: 'pending' | 'accepted' | 'rejected' | string;
  createdAt?: string;
  [key: string]: any;
}

export type FriendsTab = 'online' | 'all' | 'pending' | 'add';
