import { api } from '@/lib/api';
import type { MessageRequestItem } from '../types';

const STORAGE_KEY = 'anticeil_message_requests';

const DEFAULT_REQUESTS: MessageRequestItem[] = [
  {
    id: 'req_cyber_knight',
    userId: 'usr_knight',
    name: 'Cyber Knight',
    username: 'cyber_knight',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=knight',
    date: 'Hari ini pukul 14.30',
    mutualServers: 2,
    isSpam: false,
    initialMessage: 'Halo bro! Mau tanya soal custom bot Anticeil di colony?',
  },
  {
    id: 'req_spam_bot',
    userId: 'usr_spambot',
    name: 'Free Nitro Generator 2026',
    username: 'nitro_bot_free',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=free_gift',
    date: 'Kemarin',
    mutualServers: 0,
    isSpam: true,
    initialMessage: 'Klaim hadiah gratis Nectar Nitro kamu sekarang juga di link berikut!',
  },
];

function loadStoredRequests(): MessageRequestItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_REQUESTS;
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
      if (Array.isArray(data) && data.length > 0) {
        saveStoredRequests(data);
        return data;
      }
    } catch {}

    return loadStoredRequests();
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
