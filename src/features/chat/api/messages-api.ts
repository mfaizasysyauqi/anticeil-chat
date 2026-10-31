import { api } from '@/lib/api';
import { loadStoredMessages, saveStoredMessages } from '@/chat/chat-defaults';
import type { ColonyMessage } from '@/chat/chat-types';
import type { DiscordGifItem } from '@/chat/anticeil-media-data';

export const messagesApi = {
  async getMessages(channelId: string): Promise<ColonyMessage[]> {
    try {
      if (channelId.startsWith('dm-')) {
        const parts = channelId.slice(3).split('-').filter(Boolean);
        const reqs = [api.get<ColonyMessage[]>(`/v1/colony/channels/${channelId}/messages`)];
        if (parts.length === 2) {
          reqs.push(
            api.get<ColonyMessage[]>(`/v1/colony/channels/dm-${parts[0]}/messages`).catch(() => []),
            api.get<ColonyMessage[]>(`/v1/colony/channels/dm-${parts[1]}/messages`).catch(() => []),
          );
        }
        const results = await Promise.all(reqs.map((p) => p.catch(() => [])));
        const allMsgs: ColonyMessage[] = [];
        const seen = new Set<string>();
        results.forEach((res) => {
          if (Array.isArray(res)) {
            res.forEach((m) => {
              if (m && m.id && !seen.has(m.id)) {
                seen.add(m.id);
                allMsgs.push(m);
              }
            });
          }
        });
        allMsgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const stored = loadStoredMessages();
        stored[channelId] = allMsgs;
        saveStoredMessages(stored);
        return allMsgs;
      }

      const res = await api.get<ColonyMessage[]>(`/v1/colony/channels/${channelId}/messages`);
      if (Array.isArray(res)) {
        const stored = loadStoredMessages();
        stored[channelId] = res;
        saveStoredMessages(stored);
        return res;
      }
    } catch {}
    const stored = loadStoredMessages();
    return stored[channelId] || [];
  },

  async sendMessage(
    channelId: string,
    payload: Partial<ColonyMessage>,
  ): Promise<ColonyMessage> {
    const fallbackMsg: ColonyMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      channelId,
      senderId: payload.senderId || 'me',
      senderName: payload.senderName || 'Anonymous',
      senderEmail: payload.senderEmail || '',
      senderAvatar: payload.senderAvatar ?? null,
      senderRole: (payload.senderRole as any) || 'member',
      content: payload.content || '',
      attachments: payload.attachments,
      reactions: {},
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await api.post<ColonyMessage>(`/v1/colony/channels/${channelId}/messages`, {
        ...payload,
        channelId,
      });
      if (res && res.id) {
        const stored = loadStoredMessages();
        stored[channelId] = [...(stored[channelId] || []).filter((m) => m.id !== res.id), res];
        saveStoredMessages(stored);
        return res;
      }
    } catch {}

    const stored = loadStoredMessages();
    stored[channelId] = [...(stored[channelId] || []), fallbackMsg];
    saveStoredMessages(stored);
    return fallbackMsg;
  },

  async deleteMessage(messageId: string): Promise<{ success: boolean; id: string }> {
    try {
      await api.delete(`/v1/colony/messages/${messageId}`);
    } catch {}
    const stored = loadStoredMessages();
    for (const chId in stored) {
      stored[chId] = stored[chId].filter((m) => m.id !== messageId);
    }
    saveStoredMessages(stored);
    return { success: true, id: messageId };
  },

  async toggleReaction(
    messageId: string,
    emoji: string,
    userId: string,
  ): Promise<{ id: string; channelId?: string; reactions: Record<string, string[]> }> {
    try {
      const res = await api.post<{ id: string; channelId?: string; reactions: Record<string, string[]> }>(
        `/v1/colony/messages/${messageId}/reactions`,
        { emoji, userId }
      );
      if (res && res.reactions) {
        return res;
      }
    } catch {}
    const stored = loadStoredMessages();
    let targetMsg: ColonyMessage | null = null;
    for (const chId in stored) {
      const msg = stored[chId].find((m) => m.id === messageId);
      if (msg) {
        targetMsg = msg;
        const currentReactions = msg.reactions || {};
        const users = currentReactions[emoji] || [];
        if (users.includes(userId)) {
          currentReactions[emoji] = users.filter((u) => u !== userId);
          if (currentReactions[emoji].length === 0) {
            delete currentReactions[emoji];
          }
        } else {
          currentReactions[emoji] = [...users, userId];
        }
        msg.reactions = currentReactions;
        break;
      }
    }
    saveStoredMessages(stored);
    return {
      id: messageId,
      channelId: targetMsg?.channelId,
      reactions: targetMsg?.reactions || {},
    };
  },

  async getPinnedMessages(channelId: string): Promise<ColonyMessage[]> {
    try {
      const res = await api.get<ColonyMessage[]>(`/v1/colony/channels/${channelId}/pins`);
      if (Array.isArray(res)) return res;
    } catch {}
    const stored = loadStoredMessages();
    const list = stored[channelId] || [];
    return list.filter((m) => m.isPinned);
  },

  async togglePinMessage(
    messageId: string,
    channelId: string,
    userName?: string,
  ): Promise<ColonyMessage> {
    try {
      const res = await api.post<ColonyMessage>(`/v1/colony/messages/${messageId}/pin`, {
        userName,
      });
      if (res && res.id) {
        const stored = loadStoredMessages();
        const list = stored[channelId] || [];
        stored[channelId] = list.map((m) => (m.id === messageId ? { ...m, ...res } : m));
        saveStoredMessages(stored);
        return res;
      }
    } catch {}

    const stored = loadStoredMessages();
    const list = stored[channelId] || [];
    let updatedMsg: ColonyMessage | null = null;
    stored[channelId] = list.map((m) => {
      if (m.id === messageId) {
        const nextPinned = !m.isPinned;
        updatedMsg = {
          ...m,
          isPinned: nextPinned,
          pinnedAt: nextPinned ? new Date().toISOString() : null,
          pinnedBy: nextPinned ? (userName || 'You') : null,
        };
        return updatedMsg;
      }
      return m;
    });
    saveStoredMessages(stored);
    return updatedMsg || ({ id: messageId } as ColonyMessage);
  },

  async claimGift(messageId: string, userName?: string): Promise<{ success: boolean }> {
    try {
      const res = await api.post<{ success: boolean }>(`/v1/colony/messages/${messageId}/claim-gift`, { userName });
      return res || { success: true };
    } catch {
      return { success: false };
    }
  },

  async searchGifs(query: string = '', limit: number = 20): Promise<DiscordGifItem[]> {
    try {
      const res = await api.get<DiscordGifItem[]>(`/v1/colony/gifs/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      if (Array.isArray(res) && res.length > 0) {
        return res;
      }
    } catch {}
    return [];
  },
};

