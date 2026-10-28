import { api } from '@/lib/api';
import type { FriendMember, FriendRequest } from '../types';

export const friendsApi = {
  getFriends: async (): Promise<FriendMember[]> => {
    try {
      const data = await api.get<FriendMember[]>('/v1/community/friends');
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  getFriendRequests: async (): Promise<FriendRequest[]> => {
    try {
      const data = await api.get<any[]>('/v1/community/friends/requests');
      if (!Array.isArray(data)) return [];
      return data.map((r) => ({
        id: r.id,
        name: r.senderName || r.name || 'User',
        username: r.senderUsername || r.username || null,
        avatar: r.senderAvatar || r.avatar || null,
        direction: (r.direction || 'incoming') as 'incoming' | 'outgoing',
        status: r.status || 'pending',
        createdAt: r.createdAt,
      }));
    } catch {
      return [];
    }
  },

  sendFriendRequest: async (targetUsername: string, targetUserId?: string): Promise<{ success: boolean; message?: string }> => {
    return api.post('/v1/community/friends/request', { targetUsername, targetUserId });
  },

  acceptFriendRequest: async (requestId: string): Promise<{ success: boolean; friendId?: string }> => {
    return api.post(`/v1/community/friends/request/${requestId}/accept`);
  },

  ignoreFriendRequest: async (requestId: string): Promise<{ success: boolean }> => {
    return api.post(`/v1/community/friends/request/${requestId}/ignore`);
  },

  deleteFriend: async (friendId: string): Promise<{ success: boolean }> => {
    return api.delete(`/v1/community/friends/${friendId}`);
  },
};
