import { api } from '@/lib/api';
import type { MessageRequestItem } from '../types';

const STORAGE_KEY = 'anticeil_message_requests';

function loadStoredRequests(): MessageRequestItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveStoredRequests(items: MessageRequestItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export const messageRequestsApi = {
  getMessageRequests: async (): Promise<MessageRequestItem[]> => {
    try {
      const data = await api.get<MessageRequestItem[]>('/v1/community/message-requests');
      if (Array.isArray(data)) {
        saveStoredRequests(data);
        return data;
      }
    } catch {}

    return loadStoredRequests();
  },

  createMessageRequest: async (payload: {
    receiverId: string;
    initialMessage?: string;
    isSpam?: boolean;
    mutualServers?: number;
  }): Promise<{ success: boolean; id: string }> => {
    try {
      const res = await api.post<{ success: boolean; id: string }>('/v1/community/message-requests', payload);
      return res;
    } catch {
      return { success: false, id: '' };
    }
  },

  acceptMessageRequest: async (id: string): Promise<{ success: boolean; id: string }> => {
    try {
      await api.post(`/v1/community/message-requests/${id}/accept`);
    } catch {}

    const current = loadStoredRequests();
    const updated = current.filter((r) => r.id !== id);
    saveStoredRequests(updated);
    return { success: true, id };
  },

  ignoreMessageRequest: async (id: string): Promise<{ success: boolean; id: string }> => {
    try {
      await api.post(`/v1/community/message-requests/${id}/ignore`);
    } catch {}

    const current = loadStoredRequests();
    const updated = current.filter((r) => r.id !== id);
    saveStoredRequests(updated);
    return { success: true, id };
  },

  spamMessageRequest: async (id: string): Promise<{ success: boolean; id: string }> => {
    try {
      await api.post(`/v1/community/message-requests/${id}/spam`);
    } catch {}

    const current = loadStoredRequests();
    const updated = current.map((r) => (r.id === id ? { ...r, isSpam: true } : r));
    saveStoredRequests(updated);
    return { success: true, id };
  },
};
