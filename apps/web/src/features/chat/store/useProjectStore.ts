'use client';

import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProjectFolder {
  id: string;
  name: string;
  createdAt: number; // epoch ms
  sessionIds: string[];
}

interface ProjectState {
  folders: ProjectFolder[];
  isLoading: boolean;
  error: string | null;

  // Lifecycle
  fetchFolders: (accessToken: string) => Promise<void>;
  reset: () => void;

  // CRUD
  createFolder: (name: string, accessToken: string) => Promise<ProjectFolder | null>;
  renameFolder: (id: string, name: string, accessToken: string) => Promise<void>;
  deleteFolder: (id: string, accessToken: string) => Promise<void>;

  // Session assignment
  assignSession: (folderId: string, sessionId: string, accessToken: string) => Promise<void>;
  removeSession: (folderId: string, sessionId: string, accessToken: string) => Promise<void>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fromRow(row: {
  id: string;
  name: string;
  created_at: string;
  session_ids: string[] | null;
}): ProjectFolder {
  return {
    id: row.id,
    name: row.name,
    createdAt: new Date(row.created_at).getTime(),
    sessionIds: row.session_ids ?? [],
  };
}

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useProjectStore = create<ProjectState>((set, get) => ({
  folders: [],
  isLoading: false,
  error: null,

  reset: () => set({ folders: [], isLoading: false, error: null }),

  fetchFolders: async (accessToken) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/projects', {
        headers: authHeaders(accessToken),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { folders } = await res.json();
      set({ folders: (folders ?? []).map(fromRow), isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createFolder: async (name, accessToken) => {
    // Optimistic: add a temp entry immediately
    const tempId = `temp_${Date.now()}`;
    const tempFolder: ProjectFolder = { id: tempId, name, createdAt: Date.now(), sessionIds: [] };
    set((s) => ({ folders: [...s.folders, tempFolder] }));

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: authHeaders(accessToken),
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { folder } = await res.json();
      const real = fromRow(folder);
      // Replace temp with real
      set((s) => ({
        folders: s.folders.map((f) => (f.id === tempId ? real : f)),
      }));
      return real;
    } catch (err: unknown) {
      // Roll back temp
      set((s) => ({ folders: s.folders.filter((f) => f.id !== tempId), error: (err as Error).message }));
      return null;
    }
  },

  renameFolder: async (id, name, accessToken) => {
    const prev = get().folders;
    // Optimistic update
    set((s) => ({
      folders: s.folders.map((f) => (f.id === id ? { ...f, name } : f)),
    }));

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: authHeaders(accessToken),
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err: unknown) {
      set({ folders: prev, error: (err as Error).message });
    }
  },

  deleteFolder: async (id, accessToken) => {
    const prev = get().folders;
    // Optimistic removal
    set((s) => ({ folders: s.folders.filter((f) => f.id !== id) }));

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: authHeaders(accessToken),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err: unknown) {
      set({ folders: prev, error: (err as Error).message });
    }
  },

  assignSession: async (folderId, sessionId, accessToken) => {
    const prev = get().folders;
    const folder = prev.find((f) => f.id === folderId);
    if (!folder || folder.sessionIds.includes(sessionId)) return;

    const newIds = [...folder.sessionIds, sessionId];
    // Optimistic
    set((s) => ({
      folders: s.folders.map((f) => (f.id === folderId ? { ...f, sessionIds: newIds } : f)),
    }));

    try {
      const res = await fetch(`/api/projects/${folderId}`, {
        method: 'PATCH',
        headers: authHeaders(accessToken),
        body: JSON.stringify({ session_ids: newIds }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err: unknown) {
      set({ folders: prev, error: (err as Error).message });
    }
  },

  removeSession: async (folderId, sessionId, accessToken) => {
    const prev = get().folders;
    const folder = prev.find((f) => f.id === folderId);
    if (!folder) return;

    const newIds = folder.sessionIds.filter((id) => id !== sessionId);
    // Optimistic
    set((s) => ({
      folders: s.folders.map((f) => (f.id === folderId ? { ...f, sessionIds: newIds } : f)),
    }));

    try {
      const res = await fetch(`/api/projects/${folderId}`, {
        method: 'PATCH',
        headers: authHeaders(accessToken),
        body: JSON.stringify({ session_ids: newIds }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err: unknown) {
      set({ folders: prev, error: (err as Error).message });
    }
  },
}));
