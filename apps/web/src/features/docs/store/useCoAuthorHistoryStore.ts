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
  originalContent?: string; // Track original for edit/undo
  isEdited?: boolean;
  agentSteps?: import('@anticeil/core').AgentStep[];
  versions?: string[];
  versionIndex?: number;
  versionTimestamps?: number[];
  branchMessages?: Record<number, CoAuthorMessage[]>;
  branchContents?: Record<number, string>;
  branchReasoningContents?: Record<number, string>;
  branchTimestamps?: Record<number, number>;
}

export interface CoAuthorSession {
  docId: string;
  docTitle: string;
  messages: CoAuthorMessage[];
  createdAt: number;
  updatedAt: number;
}

interface UndoEntry {
  deletedBy: string; // messageId yang menghapus
  messages: CoAuthorMessage[];
  editedMessage?: {
    id: string;
    originalContent: string;
    wasEdited: boolean;
  };
}

interface CoAuthorHistoryState {
  // docId → session
  sessions: Record<string, CoAuthorSession>;

  // Undo stack: key = `${docId}-${messageId}`, value = array of deleted message batches
  undoStack: Record<string, UndoEntry[]>;

  // CRUD
  getSession: (docId: string) => CoAuthorSession | null;
  saveMessage: (docId: string, docTitle: string, msg: CoAuthorMessage) => void;
  updateLastMessage: (docId: string, partial: Partial<CoAuthorMessage>) => void;
  removeMessages: (docId: string, messageIds: string[]) => void;
  clearSession: (docId: string) => void;

  // Edit & Delete (new)
  editMessage: (docId: string, messageId: string, newContent: string) => string[]; // returns deleted message IDs
  deleteAfter: (docId: string, messageId: string) => void; // delete prompt + all assistant responses after
  undoDelete: (docId: string, messageId: string) => boolean; // restore deleted messages, returns true if success
  getUndoEntry: (docId: string, messageId: string) => UndoEntry[] | null;

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
      undoStack: {},

      getSession: (docId) => get().sessions[docId] ?? null,

      // ── Edit & Delete Methods ───────────────────────────────────────────────

      editMessage: (docId, messageId, newContent) => {
        const session = get().sessions[docId];
        if (!session) return [];

        const msgIndex = session.messages.findIndex((m) => m.id === messageId);
        if (msgIndex === -1) return [];

        const msg = session.messages[msgIndex];
        // Save original content if not already saved
        const originalContent = msg.originalContent ?? msg.content;

        // Find all messages after this one (including assistant responses)
        const messagesToDelete = session.messages.slice(msgIndex + 1);
        const deletedIds = messagesToDelete.map((m) => m.id);

        // Save to undo stack (including the edited message's original content)
        const undoKey = `${docId}-${messageId}`;
        set((s) => ({
          undoStack: {
            ...s.undoStack,
            [undoKey]: [
              ...(s.undoStack[undoKey] || []),
              {
                deletedBy: messageId,
                messages: messagesToDelete,
                editedMessage: {
                  id: messageId,
                  originalContent,
                  wasEdited: !!msg.isEdited,
                },
              },
            ],
          },
        }));

        // Update the message content and mark as edited
        set((s) => {
          const updatedMsgs = [...s.sessions[docId].messages];
          updatedMsgs[msgIndex] = {
            ...updatedMsgs[msgIndex],
            content: newContent,
            originalContent,
            isEdited: true,
          };
          // Remove messages after this one
          const filtered = updatedMsgs.slice(0, msgIndex + 1);
          return {
            sessions: {
              ...s.sessions,
              [docId]: {
                ...s.sessions[docId],
                messages: filtered,
                updatedAt: Date.now(),
              },
            },
          };
        });

        return deletedIds;
      },

      deleteAfter: (docId, messageId) => {
        const session = get().sessions[docId];
        if (!session) return;

        const msgIndex = session.messages.findIndex((m) => m.id === messageId);
        if (msgIndex === -1) return;

        // Collect messages to delete (all after this message)
        const messagesToDelete = session.messages.slice(msgIndex + 1);
        if (messagesToDelete.length === 0) return;

        // Save to undo stack
        const undoKey = `${docId}-${messageId}`;
        set((s) => ({
          undoStack: {
            ...s.undoStack,
            [undoKey]: [
              ...(s.undoStack[undoKey] || []),
              { deletedBy: messageId, messages: messagesToDelete },
            ],
          },
        }));

        // Remove messages after this one
        set((s) => {
          const existing = s.sessions[docId];
          if (!existing) return s;
          const filtered = existing.messages.slice(0, msgIndex + 1);
          return {
            sessions: {
              ...s.sessions,
              [docId]: {
                ...existing,
                messages: filtered,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      undoDelete: (docId, messageId) => {
        const undoKey = `${docId}-${messageId}`;
        const undoEntries = get().undoStack[undoKey];
        if (!undoEntries || undoEntries.length === 0) return false;

        const lastEntry = undoEntries[undoEntries.length - 1];
        const messagesToRestore = lastEntry.messages;
        const editedInfo = lastEntry.editedMessage;

        // Remove from undo stack
        set((s) => {
          const newEntries = [...(s.undoStack[undoKey] || [])];
          newEntries.pop();

          const newStack = {
            ...s.undoStack,
            [undoKey]: newEntries,
          };
          // Clean up empty entries
          if (newEntries.length === 0) {
            delete newStack[undoKey];
          }

          return { undoStack: newStack };
        });

        // Restore messages to session (and revert edited message if needed)
        set((s) => {
          const session = s.sessions[docId];
          if (!session) return s;

          const msgIndex = session.messages.findIndex((m) => m.id === messageId);
          if (msgIndex === -1) return s;

          let workingMsgs = [...session.messages];

          // Revert the edited message back to its original content
          if (editedInfo && editedInfo.id === messageId) {
            workingMsgs[msgIndex] = {
              ...workingMsgs[msgIndex],
              content: editedInfo.originalContent,
              originalContent: editedInfo.wasEdited ? editedInfo.originalContent : undefined,
              isEdited: editedInfo.wasEdited,
            };
          }

          // Insert restored messages after the current message
          const before = workingMsgs.slice(0, msgIndex + 1);
          const after = workingMsgs.slice(msgIndex + 1);
          const restored = [...before, ...messagesToRestore, ...after];

          return {
            sessions: {
              ...s.sessions,
              [docId]: {
                ...session,
                messages: restored,
                updatedAt: Date.now(),
              },
            },
          };
        });

        return true;
      },

      getUndoEntry: (docId, messageId) => {
        const undoKey = `${docId}-${messageId}`;
        return get().undoStack[undoKey] || null;
      },

      saveMessage: (docId, docTitle, msg) => {
        set((s) => {
          const existing = s.sessions[docId];
          const prev = existing?.messages ?? [];
          // Upsert message if same ID already exists
          const existingIdx = prev.findIndex((m) => m.id === msg.id);
          let updated: CoAuthorMessage[];
          if (existingIdx !== -1) {
            updated = [...prev];
            updated[existingIdx] = { ...updated[existingIdx], ...msg };
          } else {
            updated = [...prev, msg];
          }
          // Cap local storage at MAX_LOCAL_MSGS
          const trimmed = updated.length > MAX_LOCAL_MSGS ? updated.slice(-MAX_LOCAL_MSGS) : updated;
          return {
            sessions: {
              ...s.sessions,
              [docId]: {
                docId,
                docTitle,
                messages: trimmed,
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

      removeMessages: (docId, messageIds) => {
        set((s) => {
          const existing = s.sessions[docId];
          if (!existing) return s;
          const idSet = new Set(messageIds);
          const updated = existing.messages.filter((m) => !idSet.has(m.id));
          return {
            sessions: {
              ...s.sessions,
              [docId]: {
                ...existing,
                messages: updated,
                updatedAt: Date.now(),
              },
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
