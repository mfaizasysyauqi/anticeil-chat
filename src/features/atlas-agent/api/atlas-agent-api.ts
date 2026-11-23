import { api } from '@/lib/api';
import type { AiSession, AiMessage } from '../types';
import {
  getStoredSessions,
  saveStoredSessions,
  getActiveSessionId,
  setActiveSessionId,
} from '../services/ai-storage';

export const atlasAgentApi = {
  /**
   * Read all saved chat sessions (Fullstack with offline/local fallback)
   * Guaranteed: NO dummy sessions injected. Returns [] when empty.
   */
  async getSessions(): Promise<AiSession[]> {
    try {
      const res = await api.get<AiSession[]>('/v1/atlas-agent/sessions');
      if (Array.isArray(res)) {
        saveStoredSessions(res);
        return res;
      }
    } catch {
      // Backend not yet ready or offline; use persistent local storage
    }
    return getStoredSessions();
  },

  /**
   * Create a new Atlas Agent session
   */
  async createSession(title?: string): Promise<AiSession> {
    const safeTitle =
      typeof title === 'string' && title.trim() ? title.trim() : 'Percakapan Baru';
    const newSession: AiSession = {
      id: `atlas_sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: safeTitle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };

    try {
      const res = await api.post<AiSession>('/v1/atlas-agent/sessions', newSession);
      if (res && res.id) {
        const stored = getStoredSessions();
        saveStoredSessions([res, ...stored.filter((s) => s.id !== res.id)]);
        setActiveSessionId(res.id);
        return res;
      }
    } catch {
      // Offline fallback
    }

    const stored = getStoredSessions();
    const updated = [newSession, ...stored];
    saveStoredSessions(updated);
    setActiveSessionId(newSession.id);
    return newSession;
  },

  /**
   * Update session title (Rename CRUD)
   */
  async updateSessionTitle(sessionId: string, newTitle: string): Promise<AiSession | null> {
    const cleanTitle = newTitle.trim();
    if (!cleanTitle) return null;

    try {
      await api.patch(`/v1/atlas-agent/sessions/${sessionId}`, { title: cleanTitle });
    } catch {}

    const stored = getStoredSessions();
    let updatedSession: AiSession | null = null;
    const updatedList = stored.map((s) => {
      if (s.id === sessionId) {
        updatedSession = { ...s, title: cleanTitle, updatedAt: new Date().toISOString() };
        return updatedSession;
      }
      return s;
    });

    saveStoredSessions(updatedList);
    return updatedSession;
  },

  /**
   * Update session messages
   */
  async updateSessionMessages(sessionId: string, messages: AiMessage[]): Promise<void> {
    // If first message and title is default, auto-generate title from message
    let newTitle: string | undefined;
    const stored = getStoredSessions();
    const existing = stored.find((s) => s.id === sessionId);

    if (existing && (existing.title === 'Percakapan Baru' || !existing.title) && messages.length > 0) {
      const firstUserMsg = messages.find((m) => m.role === 'user');
      if (firstUserMsg) {
        newTitle = firstUserMsg.content.slice(0, 36) + (firstUserMsg.content.length > 36 ? '...' : '');
      }
    }

    try {
      await api.put(`/v1/atlas-agent/sessions/${sessionId}/messages`, {
        messages,
        title: newTitle,
      });
    } catch {}

    const updated = stored.map((s) => {
      if (s.id === sessionId) {
        return {
          ...s,
          messages,
          title: newTitle || s.title,
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });
    saveStoredSessions(updated);
  },

  /**
   * Clear all messages in a session
   */
  async clearSessionMessages(sessionId: string): Promise<void> {
    try {
      await api.delete(`/v1/atlas-agent/sessions/${sessionId}/messages`);
    } catch {}

    const stored = getStoredSessions();
    const updated = stored.map((s) => {
      if (s.id === sessionId) {
        return { ...s, messages: [], updatedAt: new Date().toISOString() };
      }
      return s;
    });
    saveStoredSessions(updated);
  },

  /**
   * Delete an entire session
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      await api.delete(`/v1/atlas-agent/sessions/${sessionId}`);
    } catch {}

    const stored = getStoredSessions();
    const updated = stored.filter((s) => s.id !== sessionId);
    saveStoredSessions(updated);

    const activeId = getActiveSessionId();
    if (activeId === sessionId) {
      const nextActive = updated[0]?.id || null;
      setActiveSessionId(nextActive);
    }
  },

  /**
   * Toggle pin status for a session
   */
  async togglePinSession(sessionId: string): Promise<void> {
    const stored = getStoredSessions();
    const updated = stored.map((s) => {
      if (s.id === sessionId) {
        return { ...s, isPinned: !s.isPinned };
      }
      return s;
    });
    saveStoredSessions(updated);

    try {
      const target = updated.find((s) => s.id === sessionId);
      if (target) {
        await api.patch(`/v1/atlas-agent/sessions/${sessionId}`, { isPinned: target.isPinned });
      }
    } catch {}
  },
};

export const aiCommandCenterApi = atlasAgentApi;
