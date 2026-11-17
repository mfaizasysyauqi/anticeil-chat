import { api } from '@/lib/api';
import type { ColonyMember } from '@/chat/chat-types';

export const membersApi = {
  async getMembers(projectId?: string, colonyId?: string): Promise<ColonyMember[]> {
    try {
      // 1. Try community members endpoint (always available for workspace/community users)
      const commRes = await api.get<any>('/v1/colony/members');
      const commList = Array.isArray(commRes) ? commRes : commRes?.data || commRes?.members;
      if (Array.isArray(commList) && commList.length > 0) {
        return commList.map((u: any) => {
          const firstName = u.firstName || '';
          const lastName = u.lastName || '';
          const fullName =
            u.name ||
            `${firstName} ${lastName}`.trim() ||
            u.email?.split('@')[0] ||
            'Pengguna Anticeil';
          return {
            id: u.id,
            name: fullName,
            email: u.email || '',
            avatar: u.avatar || u.imageUrl || null,
            username:
              u.username ||
              u.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') ||
              null,
            role:
              (u.platformRole === 'OWNER' ||
              u.platformRole === 'ADMIN' ||
              u.role === 'platform_admin'
                ? 'admin'
                : 'member') as any,
            isBooster: Boolean(u.isBooster),
            subscriptionPlan: u.subscriptionPlan || 'free',
            status: (u.status || 'online') as any,
          };
        });
      }
    } catch {
      // Fallback to /v1/users
    }

    try {
      const res = await api.get<any>('/v1/users', {
        params: { limit: 100 },
      });
      const usersList = Array.isArray(res) ? res : res?.data;
      if (Array.isArray(usersList) && usersList.length > 0) {
        return usersList.map((u: any) => {
          const firstName = u.firstName || '';
          const lastName = u.lastName || '';
          const fullName = `${firstName} ${lastName}`.trim() || u.email?.split('@')[0] || 'Pengguna Anticeil';
          return {
            id: u.id,
            name: fullName,
            email: u.email || '',
            avatar: u.imageUrl || u.avatar || null,
            username: u.username || u.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') || null,
            role: (u.platformRole === 'OWNER' || u.platformRole === 'ADMIN' ? 'admin' : 'member') as any,
            status: 'online' as const,
          };
        });
      }
    } catch {
      // Graceful fallback if unauthenticated or forbidden
    }
    return [];
  },
};

