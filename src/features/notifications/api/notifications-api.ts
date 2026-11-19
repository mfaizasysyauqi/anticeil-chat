import { api } from '@/lib/api';
import type { NotificationItem } from '../types';

export const notificationsApi = {
  getNotifications: async (): Promise<NotificationItem[]> => {
    try {
      const data = await api.get<NotificationItem[]>('/v1/community/notifications');
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  markAsRead: async (id: string): Promise<{ success: boolean; id: string }> => {
    return api.put(`/v1/community/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<{ success: boolean }> => {
    return api.put('/v1/community/notifications/read-all');
  },

  createNotification: async (data: Partial<NotificationItem>): Promise<{ success: boolean; id: string }> => {
    return api.post('/v1/community/notifications', data);
  },

  deleteNotification: async (id: string): Promise<{ success: boolean; id: string }> => {
    return api.delete(`/v1/community/notifications/${id}`);
  },

  clearAllNotifications: async (): Promise<{ success: boolean }> => {
    return api.delete('/v1/community/notifications');
  },
};
