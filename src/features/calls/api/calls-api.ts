import { api } from '@/lib/api';
import type { CallLogItem } from '../types';

export const callsApi = {
  getCallLogs: async (params?: { page?: number; limit?: number; date?: string }): Promise<CallLogItem[]> => {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.date) query.set('date', params.date);
      const url = `/v1/community/calls/logs${query.toString() ? `?${query.toString()}` : ''}`;
      const data = await api.get<CallLogItem[]>(url);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  createCallLog: async (log: Partial<CallLogItem>): Promise<{ success: boolean; id: string }> => {
    return api.post('/v1/community/calls/logs', log);
  },

  deleteCallLog: async (id: string): Promise<{ success: boolean; id: string }> => {
    return api.delete(`/v1/community/calls/logs/${id}`);
  },
};
