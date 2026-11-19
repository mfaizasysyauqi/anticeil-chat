import { useState, useEffect, useCallback } from 'react';
import type { AiSession, AiMessage } from '../types';
import {
  getStoredSessions,
  saveStoredSessions,
  getActiveSessionId,
  setActiveSessionId as storeActiveSessionId,
  createNewSession as createSessionInStorage,
} from '../services/ai-storage';

export function useAiCommandCenter() {
  const [sessions, setSessions] = useState<AiSession[]>(() => {
    const stored = getStoredSessions();
    if (stored.length > 0) return stored;
    // Create initial default session if none exists
    const initial = createSessionInStorage('Pusat Perintah Utama');
    return [initial];
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    const storedId = getActiveSessionId();
    if (storedId) return storedId;
    return sessions[0]?.id || null;
  });

  const [isGroqSettingsOpen, setIsGroqSettingsOpen] = useState(false);

  // Sync activeSessionId with storage
  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
    storeActiveSessionId(id);
  }, []);

  const handleCreateNewSession = useCallback((title = 'Percakapan Baru') => {
    const newSession = createSessionInStorage(title);
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    return newSession;
  }, []);

  const handleUpdateSessionMessages = useCallback((sessionId: string, messages: AiMessage[]) => {
    setSessions((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== sessionId) return s;
        // Auto update title based on first user message if title is default
        let newTitle = s.title;
        if ((s.title === 'Percakapan Baru' || s.title === 'Pusat Perintah Utama') && messages.length > 0) {
          const firstUserMsg = messages.find((m) => m.role === 'user');
          if (firstUserMsg) {
            newTitle = firstUserMsg.content.slice(0, 32) + (firstUserMsg.content.length > 32 ? '...' : '');
          }
        }
        return {
          ...s,
          title: newTitle,
          messages,
          updatedAt: new Date().toISOString(),
        };
      });
      saveStoredSessions(updated);
      return updated;
    });
  }, []);

  const handleClearSessionMessages = useCallback((sessionId: string) => {
    setSessions((prev) => {
      const updated = prev.map((s) => (s.id === sessionId ? { ...s, messages: [] } : s));
      saveStoredSessions(updated);
      return updated;
    });
  }, []);

  const handleDeleteSession = useCallback((sessionId: string) => {
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== sessionId);
      saveStoredSessions(remaining);
      if (activeSessionId === sessionId) {
        const nextId = remaining[0]?.id || null;
        setActiveSessionId(nextId);
        if (nextId) storeActiveSessionId(nextId);
      }
      return remaining;
    });
  }, [activeSessionId]);

  const handleTogglePinSession = useCallback((sessionId: string) => {
    setSessions((prev) => {
      const updated = prev.map((s) =>
        s.id === sessionId ? { ...s, isPinned: !s.isPinned } : s,
      );
      saveStoredSessions(updated);
      return updated;
    });
  }, []);

  return {
    sessions,
    activeSessionId,
    setActiveSessionId: handleSelectSession,
    handleCreateNewSession,
    handleUpdateSessionMessages,
    handleClearSessionMessages,
    handleDeleteSession,
    handleTogglePinSession,
    isGroqSettingsOpen,
    setIsGroqSettingsOpen,
  };
}
