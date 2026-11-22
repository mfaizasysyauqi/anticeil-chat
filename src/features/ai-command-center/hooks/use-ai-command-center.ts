import { useState, useEffect, useCallback } from 'react';
import type { AiSession, AiMessage } from '../types';
import {
  getStoredSessions,
  getActiveSessionId,
  setActiveSessionId as storeActiveSessionId,
} from '../services/ai-storage';
import { aiCommandCenterApi } from '../api/ai-command-center-api';

export function useAiCommandCenter() {
  const [sessions, setSessions] = useState<AiSession[]>(() => {
    // Read cleanly from local storage without any dummy session injection
    return getStoredSessions();
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    const storedId = getActiveSessionId();
    const storedList = getStoredSessions();
    if (storedId && storedList.some((s) => s.id === storedId)) return storedId;
    return storedList[0]?.id || null;
  });

  const [isGroqSettingsOpen, setIsGroqSettingsOpen] = useState(false);

  // Load sessions from API / persistent backend on mount
  useEffect(() => {
    let isMounted = true;
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('token') || localStorage.getItem('ap_token')
        : null;

    if (!token) {
      setSessions([]);
      setActiveSessionId(null);
      return;
    }

    aiCommandCenterApi.getSessions().then((fetched) => {
      if (!isMounted) return;
      if (Array.isArray(fetched)) {
        setSessions(fetched);
        if (fetched.length > 0) {
          const currentActive = getActiveSessionId();
          if (!currentActive || !fetched.some((s) => s.id === currentActive)) {
            setActiveSessionId(fetched[0].id);
            storeActiveSessionId(fetched[0].id);
          }
        } else {
          setActiveSessionId(null);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Listen to logout & storage clearing events
  useEffect(() => {
    const handleClearState = () => {
      setSessions([]);
      setActiveSessionId(null);
    };

    window.addEventListener('anticeil_logout', handleClearState);
    return () => {
      window.removeEventListener('anticeil_logout', handleClearState);
    };
  }, []);

  // Sync activeSessionId with storage
  const handleSelectSession = useCallback((id: string | null) => {
    setActiveSessionId(id);
    if (id) {
      storeActiveSessionId(id);
    } else {
      localStorage.removeItem('anticeil_active_ai_session_id');
    }
  }, []);

  // Fullstack Create Session
  const handleCreateNewSession = useCallback(async (title?: string) => {
    const safeTitle = typeof title === 'string' && title.trim() ? title.trim() : 'Percakapan Baru';
    const newSession = await aiCommandCenterApi.createSession(safeTitle);
    setSessions((prev) => [newSession, ...prev.filter((s) => s.id !== newSession.id)]);
    setActiveSessionId(newSession.id);
    storeActiveSessionId(newSession.id);
    return newSession;
  }, []);

  // Fullstack Update Session Title (Rename)
  const handleRenameSession = useCallback(async (sessionId: string, newTitle: string) => {
    const updated = await aiCommandCenterApi.updateSessionTitle(sessionId, newTitle);
    if (updated) {
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: updated.title } : s)),
      );
    }
  }, []);

  // Fullstack Update Messages
  const handleUpdateSessionMessages = useCallback(
    async (sessionId: string, messages: AiMessage[]) => {
      await aiCommandCenterApi.updateSessionMessages(sessionId, messages);

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s;
          let newTitle = s.title;
          if ((s.title === 'Percakapan Baru' || !s.title) && messages.length > 0) {
            const firstUserMsg = messages.find((m) => m.role === 'user');
            if (firstUserMsg) {
              newTitle =
                firstUserMsg.content.slice(0, 36) +
                (firstUserMsg.content.length > 36 ? '...' : '');
            }
          }
          return {
            ...s,
            title: newTitle,
            messages,
            updatedAt: new Date().toISOString(),
          };
        }),
      );
    },
    [],
  );

  // Fullstack Clear Session Messages
  const handleClearSessionMessages = useCallback(async (sessionId: string) => {
    await aiCommandCenterApi.clearSessionMessages(sessionId);
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, messages: [] } : s)),
    );
  }, []);

  // Fullstack Delete Session
  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      await aiCommandCenterApi.deleteSession(sessionId);
      setSessions((prev) => {
        const remaining = prev.filter((s) => s.id !== sessionId);
        if (activeSessionId === sessionId) {
          const nextId = remaining[0]?.id || null;
          setActiveSessionId(nextId);
          if (nextId) {
            storeActiveSessionId(nextId);
          } else {
            localStorage.removeItem('anticeil_active_ai_session_id');
          }
        }
        return remaining;
      });
    },
    [activeSessionId],
  );

  // Fullstack Toggle Pin
  const handleTogglePinSession = useCallback(async (sessionId: string) => {
    const newPinned = await aiCommandCenterApi.togglePinSession(sessionId);
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, isPinned: newPinned } : s)),
    );
  }, []);

  return {
    sessions,
    activeSessionId,
    setActiveSessionId: handleSelectSession,
    handleCreateNewSession,
    handleRenameSession,
    handleUpdateSessionMessages,
    handleClearSessionMessages,
    handleDeleteSession,
    handleTogglePinSession,
    isGroqSettingsOpen,
    setIsGroqSettingsOpen,
  };
}
