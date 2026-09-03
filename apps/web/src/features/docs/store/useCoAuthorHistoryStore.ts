/**
 * useCoAuthorHistoryStore
 *
 * Persists AI Co-Author chat history:
 * - FREE tier  → localStorage (Zustand persist, max 100 msgs per doc)
 * - STARTER+   → localStorage + background sync to Supabase
 *
 * Each "session" is keyed by docId so every document has its own history.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CoAuthorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoningContent?: string;
  actions?: Array<{ type: string; name: string }>;
  snapshotId?: string;
  reverted?: boolean;
  timestamp: number;
}

export interface CoAuthorSession {
  docId: string;
  docTitle: string;
  messages: CoAuthorMessage[];
  createdAt: number;
  updatedAt: number;
}

interface CoAuthorHistoryState {
  // docId → session
  sessions: Record<string, CoAuthorSession>;

  // CRUD
  getSession: (docId: string) => CoAuthorSession | null;
  saveMessage: (docId: string, docTitle: string, msg: CoAuthorMessage) => void;
  updateLastMessage: (docId: string, partial: Partial<CoAuthorMessage>) => void;
  clearSession: (docId: string) => void;

  // Cloud sync (starter+)
  syncToCloud: (docId: string, accessToken: string) => Promise<void>;
  loadFromCloud: (docId: string, accessToken: string) => Promise<void>;
}

const MAX_LOCAL_MSGS = 100; // per doc — keeps localStorage lean

// ── Store ─────────────────────────────────────────────────────────────────────

export const useCoAuthorHistoryStore = create<CoAuthorHistoryState>()(
  persist(
    (set, get) => ({
      sessions: {},

      getSession: (docId) => get().sessions[docId] ?? null,

      saveMessage: (docId, docTitle, msg) => {
        set((s) => {
          const existing = s.sessions[docId];
          const prev = existing?.messages ?? [];
          // Cap local storage at MAX_LOCAL_MSGS — drop oldest
          const trimmed = prev.length >= MAX_LOCAL_MSGS ? prev.slice(-MAX_LOCAL_MSGS + 1) : prev;
          return {
            sessions: {
              ...s.sessions,
              [docId]: {
                docId,
                docTitle,
                messages: [...trimmed, msg],
                createdAt: existing?.createdAt ?? Date.now(),
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      updateLastMessage: (docId, partial) => {
        set((s) => {
          const session = s.sessions[docId];
          if (!session) return s;
          const msgs = [...session.messages];
          const last = msgs[msgs.length - 1];
          if (!last) return s;
          msgs[msgs.length - 1] = { ...last, ...partial };
          return {
            sessions: {
              ...s.sessions,
              [docId]: { ...session, messages: msgs, updatedAt: Date.now() },
            },
          };
        });
      },

      clearSession: (docId) => {
        set((s) => {
          const { [docId]: _dropped, ...rest } = s.sessions;
          return { sessions: rest };
        });
      },

      // ── Cloud sync ────────────────────────────────────────────────────────

      syncToCloud: async (docId, accessToken) => {
        const session = get().sessions[docId];
        if (!session) return;
        try {
          await fetch('/api/docs/coauthor-history', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ session }),
          });
        } catch (e) {
          console.warn('[CoAuthorHistory] Cloud sync failed:', e);
        }
      },

      loadFromCloud: async (docId, accessToken) => {
        try {
          const res = await fetch(`/api/docs/coauthor-history?docId=${encodeURIComponent(docId)}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!res.ok) return;
          const data: CoAuthorSession = await res.json();
          if (!data?.messages) return;
          set((s) => ({
            sessions: {
              ...s.sessions,
              [docId]: data,
            },
          }));
        } catch (e) {
          console.warn('[CoAuthorHistory] Cloud load failed:', e);
        }
      },
    }),
    {
      name: 'anticeil_coauthor_history',
      storage: createJSONStorage(() => localStorage),
      // Only persist sessions, not functions
      partialize: (s) => ({ sessions: s.sessions }),
    }
  )
);
