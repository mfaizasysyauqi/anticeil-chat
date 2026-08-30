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
  loadLocalFolders: () => void;
  fetchFolders: (accessToken: string) => Promise<void>;
  reset: () => void;

  // CRUD
  createFolder: (name: string, accessToken?: string | null) => Promise<ProjectFolder | null>;
  renameFolder: (id: string, name: string, accessToken?: string | null) => Promise<void>;
  deleteFolder: (id: string, accessToken?: string | null) => Promise<void>;

  // Session assignment
  assignSession: (folderId: string, sessionId: string, accessToken?: string | null) => Promise<void>;
  removeSession: (folderId: string, sessionId: string, accessToken?: string | null) => Promise<void>;
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

function saveLocal(folders: ProjectFolder[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('anticeil-project-store', JSON.stringify(folders));
    } catch {}
  }
}

function readLocal(): ProjectFolder[] {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem('anticeil-project-store');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
  }
  return [];
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useProjectStore = create<ProjectState>((set, get) => ({
  folders: readLocal(),
  isLoading: false,
  error: null,

  loadLocalFolders: () => {
    const local = readLocal();
    set({ folders: local, isLoading: false });
  },

  reset: () => {
    const local = readLocal();
    set({ folders: local, isLoading: false, error: null });
  },

  fetchFolders: async (accessToken) => {
    if (!accessToken) {
      get().loadLocalFolders();
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/projects', {
        headers: authHeaders(accessToken),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { folders } = await res.json();
      const mapped = (folders ?? []).map(fromRow);
      set({ folders: mapped, isLoading: false });
      saveLocal(mapped);
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
      // Fallback to local
      get().loadLocalFolders();
    }
  },

  createFolder: async (name, accessToken) => {
    const folderId = `folder_${Date.now()}`;
    const newFolder: ProjectFolder = { id: folderId, name, createdAt: Date.now(), sessionIds: [] };
    const updated = [...get().folders, newFolder];
    set({ folders: updated });
    saveLocal(updated);

    if (!accessToken) {
      return newFolder;
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: authHeaders(accessToken),
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const { folder } = await res.json();
        const real = fromRow(folder);
        const next = get().folders.map((f) => (f.id === folderId ? real : f));
        set({ folders: next });
        saveLocal(next);
        return real;
      }
    } catch (err: unknown) {
      console.warn('[ProjectStore] Cloud create folder failed, kept locally:', err);
    }

    return newFolder;
  },

  renameFolder: async (id, name, accessToken) => {
    const prev = get().folders;
    const updated = prev.map((f) => (f.id === id ? { ...f, name } : f));
    set({ folders: updated });
    saveLocal(updated);

    if (!accessToken) return;

    try {
      await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: authHeaders(accessToken),
        body: JSON.stringify({ name }),
      });
    } catch (err: unknown) {
      console.warn('[ProjectStore] Cloud rename folder failed:', err);
    }
  },

  deleteFolder: async (id, accessToken) => {
    const prev = get().folders;
    const updated = prev.filter((f) => f.id !== id);
    set({ folders: updated });
    saveLocal(updated);

    if (!accessToken) return;

    try {
      await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: authHeaders(accessToken),
      });
    } catch (err: unknown) {
      console.warn('[ProjectStore] Cloud delete folder failed:', err);
    }
  },

  assignSession: async (folderId, sessionId, accessToken) => {
    const prev = get().folders;
    const folder = prev.find((f) => f.id === folderId);
    if (!folder || folder.sessionIds.includes(sessionId)) return;

    const newIds = [...folder.sessionIds, sessionId];
    const updated = prev.map((f) => (f.id === folderId ? { ...f, sessionIds: newIds } : f));
    set({ folders: updated });
    saveLocal(updated);

    if (!accessToken) return;

    try {
      await fetch(`/api/projects/${folderId}`, {
        method: 'PATCH',
        headers: authHeaders(accessToken),
        body: JSON.stringify({ session_ids: newIds }),
      });
    } catch (err: unknown) {
      console.warn('[ProjectStore] Cloud assignSession failed:', err);
    }
  },

  removeSession: async (folderId, sessionId, accessToken) => {
    const prev = get().folders;
    const folder = prev.find((f) => f.id === folderId);
    if (!folder) return;

    const newIds = folder.sessionIds.filter((id) => id !== sessionId);
    const updated = prev.map((f) => (f.id === folderId ? { ...f, sessionIds: newIds } : f));
    set({ folders: updated });
    saveLocal(updated);

    if (!accessToken) return;

    try {
      await fetch(`/api/projects/${folderId}`, {
        method: 'PATCH',
        headers: authHeaders(accessToken),
        body: JSON.stringify({ session_ids: newIds }),
      });
    } catch (err: unknown) {
      console.warn('[ProjectStore] Cloud removeSession failed:', err);
    }
  },
}));
