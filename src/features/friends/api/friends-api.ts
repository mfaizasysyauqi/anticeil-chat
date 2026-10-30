import { api } from '@/lib/api';
import type { FriendMember, FriendRequest } from '../types';

export const friendsApi = {
  getFriends: async (): Promise<FriendMember[]> => {
    try {
      const data = await api.get<any[]>('/v1/community/friends');
      if (!Array.isArray(data)) return [];
      return data.map((f: any) => ({
        id: f.id,
        name:
          f.name ||
          f.displayName ||
          `${f.firstName || ''} ${f.lastName || ''}`.trim() ||
          f.email?.split('@')[0] ||
          'Pengguna Anticeil',
        username: f.username || f.email?.split('@')[0] || null,
        avatar: f.imageUrl || f.profileImageUrl || f.avatar || f.picture || null,
        email: f.email || '',
        status: f.status || 'online',
      }));
    } catch {
      return [];
    }
  },

  getFriendRequests: async (): Promise<FriendRequest[]> => {
    try {
      const data = await api.get<any[]>('/v1/community/friends/requests');
      if (!Array.isArray(data)) return [];
      return data.map((r) => {
        // Backend may return nested sender/receiver objects or flat fields
        const sender = r.sender || r.requester || r.from || {};
        const receiver = r.receiver || r.recipient || r.to || {};

        // Resolve name: try flat fields first, then nested sender, then nested receiver (for outgoing)
        const name =
          r.name ||
          r.senderName ||
          r.displayName ||
          sender.name ||
          sender.displayName ||
          [sender.firstName, sender.lastName].filter(Boolean).join(' ').trim() ||
          receiver.name ||
          receiver.displayName ||
          [receiver.firstName, receiver.lastName].filter(Boolean).join(' ').trim() ||
          r.email?.split('@')[0] ||
          sender.email?.split('@')[0] ||
          'Pengguna Anticeil';

        const username =
          r.username ||
          r.senderUsername ||
          sender.username ||
          receiver.username ||
          null;

        const avatar =
          r.avatar ||
          r.senderAvatar ||
          r.imageUrl ||
          sender.imageUrl ||
          sender.avatar ||
          receiver.imageUrl ||
          receiver.avatar ||
          null;

        return {
          id: r.id,
          name,
          username,
          avatar,
          direction: (r.direction || 'incoming') as 'incoming' | 'outgoing',
          status: r.status || 'pending',
          createdAt: r.createdAt,
        };
      });
    } catch {
      return [];
    }
  },

  searchUsers: async (query: string): Promise<FriendMember[]> => {
    const clean = query.trim().replace(/^@/, '').toLowerCase();
    if (!clean) return [];
    try {
      let list: any[] = [];
      try {
        const commMembers = await api.get<any[]>('/v1/community/members');
        if (Array.isArray(commMembers) && commMembers.length > 0) {
          list = commMembers;
        }
      } catch {}

      if (list.length === 0) {
        const res = await api.get<any>('/v1/users', { params: { limit: 100 } });
        list = Array.isArray(res) ? res : res?.data || [];
      }

      if (Array.isArray(list)) {
        return list
          .map((u: any) => {
            const firstName = u.firstName || '';
            const lastName = u.lastName || '';
            const fullName =
              `${firstName} ${lastName}`.trim() ||
              u.name ||
              u.displayName ||
              u.email?.split('@')[0] ||
              'Pengguna Anticeil';
            const username =
              u.username ||
              u.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') ||
              null;
            return {
              id: u.id,
              name: fullName,
              username,
              avatar: u.imageUrl || u.profileImageUrl || u.avatar || u.picture || null,
              email: u.email || '',
              status: 'online' as const,
            };
          })
          .filter(
            (u: FriendMember) =>
              (u.username && u.username.toLowerCase().includes(clean)) ||
              u.name.toLowerCase().includes(clean) ||
              (u.email && u.email.toLowerCase().includes(clean)),
          );
      }
    } catch {
      return [];
    }
    return [];
  },

  sendFriendRequest: async (
    targetUsername: string,
    targetUserId?: string,
    senderMeta?: { senderName?: string; senderUsername?: string; senderAvatar?: string | null }
  ): Promise<{ success: boolean; message?: string }> => {
    return api.post('/v1/community/friends/request', { targetUsername, targetUserId, ...senderMeta });
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
