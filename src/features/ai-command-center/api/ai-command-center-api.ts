import { api } from '@/lib/api';
import type { AiSession, AiMessage } from '../types';
import {
  getStoredSessions,
  saveStoredSessions,
  getActiveSessionId,
  setActiveSessionId,
} from '../services/ai-storage';

export const aiCommandCenterApi = {
  /**
   * Read all saved chat sessions (Fullstack with offline/local fallback)
   * Guaranteed: NO dummy sessions injected. Returns [] when empty.
   */
  async getSessions(): Promise<AiSession[]> {
    try {
      const res = await api.get<AiSession[]>('/v1/ai-command-center/sessions');
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
   * Create a new AI Command Center session
   */
  async createSession(title = 'Percakapan Baru'): Promise<AiSession> {
    const newSession: AiSession = {
      id: `ai_sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };

    try {
      const res = await api.post<AiSession>('/v1/ai-command-center/sessions', newSession);
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
      await api.patch(`/v1/ai-command-center/sessions/${sessionId}`, { title: cleanTitle });
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
      await api.put(`/v1/ai-command-center/sessions/${sessionId}/messages`, {
        messages,
        title: newTitle,
      });
    } catch {}

    const updatedList = stored.map((s) => {
      if (s.id !== sessionId) return s;
      return {
        ...s,
        title: newTitle || s.title,
        messages,
        updatedAt: new Date().toISOString(),
      };
    });

    saveStoredSessions(updatedList);
  },

  /**
   * Toggle pinned state
   */
  async togglePinSession(sessionId: string): Promise<boolean> {
    const stored = getStoredSessions();
    const existing = stored.find((s) => s.id === sessionId);
    const newPinned = !existing?.isPinned;

    try {
      await api.patch(`/v1/ai-command-center/sessions/${sessionId}/pin`, { isPinned: newPinned });
    } catch {}

    const updatedList = stored.map((s) =>
      s.id === sessionId ? { ...s, isPinned: newPinned } : s,
    );
    saveStoredSessions(updatedList);
    return newPinned;
  },

  /**
   * Delete session permanently (Fullstack Delete CRUD)
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      await api.delete(`/v1/ai-command-center/sessions/${sessionId}`);
    } catch {}

    const stored = getStoredSessions();
    const filtered = stored.filter((s) => s.id !== sessionId);
    saveStoredSessions(filtered);

    if (getActiveSessionId() === sessionId) {
      const nextId = filtered[0]?.id || null;
      if (nextId) {
        setActiveSessionId(nextId);
      } else {
        localStorage.removeItem('anticeil_active_ai_session_id');
      }
    }

    return true;
  },

  /**
   * Clear messages within a session
   */
  async clearSessionMessages(sessionId: string): Promise<void> {
    try {
      await api.delete(`/v1/ai-command-center/sessions/${sessionId}/messages`);
    } catch {}

    const stored = getStoredSessions();
    const updatedList = stored.map((s) => (s.id === sessionId ? { ...s, messages: [] } : s));
    saveStoredSessions(updatedList);
  },
};
