import { api } from '@/lib/api';

export interface ColonyWebhook {
  id: string;
  colonyId: string;
  channelId: string;
  channelName?: string;
  name: string;
  avatarUrl?: string | null;
  token: string;
  url: string;
  createdAt: string;
}

export const webhooksApi = {
  getColonyWebhooks: async (colonyId: string): Promise<ColonyWebhook[]> => {
    try {
      const res = await api.get<ColonyWebhook[]>(`/v1/colonies/${colonyId}/webhooks`);
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  createColonyWebhook: async (
    colonyId: string,
    payload: { name: string; channelId: string; avatarUrl?: string },
  ): Promise<ColonyWebhook | null> => {
    try {
      return await api.post<ColonyWebhook>(`/v1/colonies/${colonyId}/webhooks`, payload);
    } catch {
      return null;
    }
  },

  updateColonyWebhook: async (
    colonyId: string,
    webhookId: string,
    payload: Partial<ColonyWebhook>,
  ): Promise<ColonyWebhook | null> => {
    try {
      return await api.put<ColonyWebhook>(`/v1/colonies/${colonyId}/webhooks/${webhookId}`, payload);
    } catch {
      return null;
    }
  },

  deleteColonyWebhook: async (colonyId: string, webhookId: string): Promise<boolean> => {
    try {
      await api.delete(`/v1/colonies/${colonyId}/webhooks/${webhookId}`);
      return true;
    } catch {
      return false;
    }
  },

  sendTestWebhook: async (
    webhookUrl: string,
    payload: { content: string; username?: string; avatar_url?: string },
  ): Promise<boolean> => {
    try {
      // If it's a relative URL, prepend origin or api prefix
      const targetUrl = webhookUrl.startsWith('http')
        ? webhookUrl
        : `${typeof window !== 'undefined' ? window.location.origin : ''}${webhookUrl}`;

      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};
