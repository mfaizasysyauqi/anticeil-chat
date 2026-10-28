import { api } from '@/lib/api';
import type { CallLogItem } from '../types';

export const callsApi = {
  getCallLogs: async (): Promise<CallLogItem[]> => {
    try {
      const data = await api.get<CallLogItem[]>('/v1/community/calls/logs');
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
