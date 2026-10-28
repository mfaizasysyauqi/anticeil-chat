import { api } from '@/lib/api';
import type { MessageRequestItem } from '../types';

export const messageRequestsApi = {
  getMessageRequests: async (): Promise<MessageRequestItem[]> => {
    try {
      const data = await api.get<MessageRequestItem[]>('/v1/community/message-requests');
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  acceptMessageRequest: async (id: string): Promise<{ success: boolean; id: string }> => {
    return api.post(`/v1/community/message-requests/${id}/accept`);
  },

  ignoreMessageRequest: async (id: string): Promise<{ success: boolean; id: string }> => {
    return api.post(`/v1/community/message-requests/${id}/ignore`);
  },

  spamMessageRequest: async (id: string): Promise<{ success: boolean; id: string }> => {
    return api.post(`/v1/community/message-requests/${id}/spam`);
  },
};
