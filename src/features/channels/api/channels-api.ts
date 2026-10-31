import { api } from '@/lib/api';
import { loadStoredChannels, saveStoredChannels } from '@/chat/chat-defaults';
import {
  ColonyChannel,
  ColonyChannelType,
  ColonyChannelNotification,
  resolveChannelType,
} from '@/chat/chat-types';

export const channelsApi = {
  async getChannels(colonyId?: string): Promise<ColonyChannel[]> {
    try {
      const res = await api.get<ColonyChannel[]>('/v1/colony/channels', {
        params: colonyId ? { colonyId } : undefined,
      });
      if (Array.isArray(res)) {
        const normalized = res.map((c) => ({
          ...c,
          name: (c.type === 'text' || !c.type) && c.name === 'General' ? 'general' : c.name,
          type: resolveChannelType(c),
        }));
        const stored = loadStoredChannels();
        if (colonyId) {
          const others = stored.filter((c) => (c.colonyId || 'anticeil') !== colonyId);
          saveStoredChannels([...others, ...normalized]);
        } else {
          const existingDms = stored.filter((c) => c.category === 'DIRECT MESSAGES' || c.isDirectMessage);
          saveStoredChannels([...existingDms, ...normalized]);
        }
        return normalized;
      }
    } catch {}
    const stored = loadStoredChannels().map((c) => ({
      ...c,
      name: (c.type === 'text' || !c.type) && c.name === 'General' ? 'general' : c.name,
      type: resolveChannelType(c),
    }));
    return colonyId ? stored.filter((c) => (c.colonyId || 'anticeil') === colonyId) : stored;
  },

  async createChannel(payload: {
    name: string;
    description: string;
    category: 'CHANNELS' | 'DIRECT MESSAGES';
    colonyId?: string;
    type?: ColonyChannelType;
    isPrivate?: boolean;
  }): Promise<ColonyChannel> {
    try {
      const res = await api.post<ColonyChannel>('/v1/colony/channels', payload);
      if (res && res.id) {
        const stored = loadStoredChannels();
        const updated = [...stored.filter((c) => c.id !== res.id), res];
        saveStoredChannels(updated);
        return res;
      }
    } catch {}
    const newChannel: ColonyChannel = {
      id: `ch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: payload.name,
      description: payload.description,
      category: payload.category,
      colonyId: payload.colonyId || 'anticeil',
      type: payload.type || 'text',
      isPrivate: payload.isPrivate || false,
    };
    const stored = loadStoredChannels();
    const updated = [...stored.filter((c) => c.id !== newChannel.id), newChannel];
    saveStoredChannels(updated);
    return newChannel;
  },

  async updateChannel(
    id: string,
    payload: Partial<ColonyChannel>,
  ): Promise<ColonyChannel> {
    try {
      const res = await api.put<ColonyChannel>(`/v1/colony/channels/${id}`, payload);
      if (res && res.id) {
        const stored = loadStoredChannels();
        saveStoredChannels(stored.map((c) => (c.id === id ? res : c)));
        return res;
      }
    } catch {}
    const stored = loadStoredChannels();
    let target = stored.find((c) => c.id === id);
    if (target) {
      target = { ...target, ...payload };
      saveStoredChannels(stored.map((c) => (c.id === id ? target! : c)));
      return target;
    }
    const fallback: ColonyChannel = {
      id,
      name: payload.name || 'Channel',
      description: payload.description || '',
      category: 'CHANNELS',
      colonyId: 'anticeil',
    };
    saveStoredChannels([...stored, fallback]);
    return fallback;
  },

  async deleteChannel(id: string): Promise<{ success: boolean; id: string }> {
    try {
      await api.delete(`/v1/colony/channels/${id}`);
    } catch {}
    const stored = loadStoredChannels();
    saveStoredChannels(stored.filter((c) => c.id !== id));
    return { success: true, id };
  },

  async markChannelRead(channelId: string, userId: string): Promise<void> {
    try {
      await api.post(`/v1/colony/channels/${channelId}/read`, { userId });
    } catch {}
  },

  async getChannelNotification(channelId: string): Promise<ColonyChannelNotification> {
    try {
      const res = await api.get<ColonyChannelNotification>(`/v1/colony/channels/${channelId}/notifications`);
      if (res && res.channelId) return res;
    } catch {}
    const saved = localStorage.getItem(`anticeil_notif_${channelId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      channelId,
      userId: 'me',
      level: 'default',
      isMuted: false,
      mutedUntil: null,
    };
  },

  async updateChannelNotification(
    channelId: string,
    payload: Partial<ColonyChannelNotification>,
  ): Promise<ColonyChannelNotification> {
    try {
      const res = await api.put<ColonyChannelNotification>(`/v1/colony/channels/${channelId}/notifications`, payload);
      if (res && res.channelId) {
        localStorage.setItem(`anticeil_notif_${channelId}`, JSON.stringify(res));
        return res;
      }
    } catch {}

    const current = await this.getChannelNotification(channelId);
    const updated: ColonyChannelNotification = {
      ...current,
      ...payload,
    };
    localStorage.setItem(`anticeil_notif_${channelId}`, JSON.stringify(updated));
    return updated;
  },
};

