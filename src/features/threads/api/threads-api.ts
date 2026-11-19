import { api } from '@/lib/api';
import type { ColonyThread, ColonyMessage } from '@/chat/chat-types';

export const threadsApi = {
  async getThreads(channelId: string, search?: string): Promise<ColonyThread[]> {
    try {
      const res = await api.get<ColonyThread[]>(`/v1/colony/channels/${channelId}/threads`, {
        params: search ? { search } : undefined,
      });
      if (Array.isArray(res)) {
        localStorage.setItem(`anticeil_threads_${channelId}`, JSON.stringify(res));
        return res;
      }
    } catch {}

    const saved = localStorage.getItem(`anticeil_threads_${channelId}`);
    if (saved) {
      try {
        const list: ColonyThread[] = JSON.parse(saved);
        if (search) {
          return list.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
        }
        return list;
      } catch {}
    }
    return [];
  },

  async createThread(
    channelId: string,
    payload: {
      name: string;
      creatorName?: string;
      creatorAvatar?: string | null;
      initialMessage?: string;
    },
  ): Promise<ColonyThread> {
    const fallbackThread: ColonyThread = {
      id: `thread_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      channelId,
      name: payload.name.trim(),
      creatorId: 'me',
      creatorName: payload.creatorName || 'You',
      creatorAvatar: payload.creatorAvatar ?? null,
      messageCount: payload.initialMessage ? 1 : 0,
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await api.post<ColonyThread>(`/v1/colony/channels/${channelId}/threads`, payload);
      if (res && res.id) {
        const current = await this.getThreads(channelId);
        localStorage.setItem(`anticeil_threads_${channelId}`, JSON.stringify([res, ...current]));
        return res;
      }
    } catch {}

    const current = await this.getThreads(channelId);
    localStorage.setItem(`anticeil_threads_${channelId}`, JSON.stringify([fallbackThread, ...current]));
    return fallbackThread;
  },

  async getThreadMessages(threadId: string): Promise<ColonyMessage[]> {
    try {
      const res = await api.get<ColonyMessage[]>(`/v1/colony/threads/${threadId}/messages`);
      if (Array.isArray(res)) return res;
    } catch {}

    const saved = localStorage.getItem(`anticeil_thread_msgs_${threadId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [];
  },

  async sendThreadMessage(
    threadId: string,
    payloadOrChannelId: string | Partial<ColonyMessage>,
    maybePayload?: Partial<ColonyMessage>,
  ): Promise<ColonyMessage> {
    const payload = typeof payloadOrChannelId === 'string' ? (maybePayload || {}) : payloadOrChannelId;
    const channelId = typeof payloadOrChannelId === 'string' ? payloadOrChannelId : (payload.channelId || '');
    const fallbackMsg: ColonyMessage = {
      id: `msg_th_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      channelId,
      threadId,
      senderId: payload.senderId || 'me',
      senderName: payload.senderName || 'You',
      senderEmail: payload.senderEmail || '',
      senderAvatar: payload.senderAvatar ?? null,
      senderRole: (payload.senderRole as any) || 'member',
      content: payload.content || '',
      attachments: payload.attachments,
      reactions: {},
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await api.post<ColonyMessage>(`/v1/colony/threads/${threadId}/messages`, {
        channelId,
        content: payload.content,
        senderName: payload.senderName,
        senderAvatar: payload.senderAvatar,
        senderRole: payload.senderRole,
        attachments: payload.attachments,
      });
      if (res && res.id) {
        const current = await this.getThreadMessages(threadId);
        localStorage.setItem(`anticeil_thread_msgs_${threadId}`, JSON.stringify([...current, res]));
        return res;
      }
    } catch {}

    const current = await this.getThreadMessages(threadId);
    localStorage.setItem(`anticeil_thread_msgs_${threadId}`, JSON.stringify([...current, fallbackMsg]));
    return fallbackMsg;
  },

  async updateThread(
    channelId: string,
    threadId: string,
    payload: { name?: string },
  ): Promise<{ success: boolean; id: string }> {
    try {
      await api.put(`/v1/colony/channels/${channelId}/threads/${threadId}`, payload);
    } catch {}

    const saved = localStorage.getItem(`anticeil_threads_${channelId}`);
    if (saved) {
      try {
        const list: ColonyThread[] = JSON.parse(saved);
        const updated = list.map((t) => (t.id === threadId ? { ...t, ...payload } : t));
        localStorage.setItem(`anticeil_threads_${channelId}`, JSON.stringify(updated));
      } catch {}
    }
    return { success: true, id: threadId };
  },

  async deleteThread(channelId: string, threadId: string): Promise<{ success: boolean; id: string }> {
    try {
      await api.delete(`/v1/colony/channels/${channelId}/threads/${threadId}`);
    } catch {}

    const saved = localStorage.getItem(`anticeil_threads_${channelId}`);
    if (saved) {
      try {
        const list: ColonyThread[] = JSON.parse(saved);
        const updated = list.filter((t) => t.id !== threadId);
        localStorage.setItem(`anticeil_threads_${channelId}`, JSON.stringify(updated));
      } catch {}
    }
    return { success: true, id: threadId };
  },
};

