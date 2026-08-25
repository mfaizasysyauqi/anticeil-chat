'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PdfDocumentItem {
  id: string;
  name: string;
  toolType: string;
  url: string;
  r2Key?: string;
  size: number;
  categoryId: string | null;
  isPinned: boolean;
  createdAt: string;
  createdAtLabel: string;
}

export interface PdfFolderItem {
  id: string;
  name: string;
  createdAt: string;
}

interface PdfStoreState {
  documents: PdfDocumentItem[];
  folders: PdfFolderItem[];
  isLoading: boolean;

  // Document actions
  addDocument: (doc: Omit<PdfDocumentItem, 'isPinned' | 'categoryId' | 'createdAtLabel'> & { categoryId?: string | null }) => void;
  removeDocument: (id: string) => void;
  togglePinDocument: (id: string) => void;
  moveToFolder: (id: string, folderId: string | null) => void;

  // Folder actions
  createFolder: (name: string) => string;
  renameFolder: (id: string, newName: string) => void;
  deleteFolder: (id: string) => void;

  // Hydrate from API
  hydrateFromApi: (token: string) => Promise<void>;
}

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin}m lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}j lalu`;
  const diffDays = Math.floor(diffHour / 24);
  return `${diffDays}h lalu`;
}

export const usePdfStore = create<PdfStoreState>()(
  persist(
    (set, get) => ({
      documents: [],
      folders: [
        { id: 'pdf_cat_general', name: 'Semua Dokumen', createdAt: new Date().toISOString() },
        { id: 'pdf_cat_contracts', name: 'Kontrak & Invoice', createdAt: new Date().toISOString() },
      ],
      isLoading: false,

      addDocument: (doc) => {
        const now = new Date().toISOString();
        const newItem: PdfDocumentItem = {
          ...doc,
          categoryId: doc.categoryId || null,
          isPinned: false,
          createdAt: doc.createdAt || now,
          createdAtLabel: formatRelativeTime(doc.createdAt || now),
        };

        set((s) => ({
          documents: [newItem, ...s.documents.filter((d) => d.id !== doc.id)],
        }));
      },

      removeDocument: (id) => {
        set((s) => ({
          documents: s.documents.filter((d) => d.id !== id),
        }));
      },

      togglePinDocument: (id) => {
        const { documents } = get();
        const doc = documents.find((d) => d.id === id);
        if (!doc) return;

        if (!doc.isPinned && documents.filter((d) => d.isPinned).length >= 3) {
          alert('Maksimal 3 dokumen dapat disematkan / Max 3 documents can be pinned');
          return;
        }

        set((s) => ({
          documents: s.documents.map((d) => (d.id === id ? { ...d, isPinned: !d.isPinned } : d)),
        }));
      },

      moveToFolder: (id, folderId) => {
        set((s) => ({
          documents: s.documents.map((d) => (d.id === id ? { ...d, categoryId: folderId } : d)),
        }));
      },

      createFolder: (name) => {
        const id = `pdf_folder_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const newFolder: PdfFolderItem = {
          id,
          name: name.trim() || 'Folder Baru',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          folders: [...s.folders, newFolder],
        }));
        return id;
      },

      renameFolder: (id, newName) => {
        set((s) => ({
          folders: s.folders.map((f) => (f.id === id ? { ...f, name: newName.trim() } : f)),
        }));
      },

      deleteFolder: (id) => {
        set((s) => ({
          folders: s.folders.filter((f) => f.id !== id),
          documents: s.documents.map((d) => (d.categoryId === id ? { ...d, categoryId: null } : d)),
        }));
      },

      hydrateFromApi: async (token) => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/pdf/history', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) return;
          const data = await res.json();
          if (!Array.isArray(data.documents)) return;

          const serverDocs: PdfDocumentItem[] = data.documents.map((d: any) => ({
            id: d.id,
            name: d.name,
            toolType: d.toolType || 'pdf',
            url: d.url,
            r2Key: d.r2Key,
            size: d.size || 0,
            categoryId: d.categoryId || null,
            isPinned: Boolean(d.isPinned),
            createdAt: d.createdAt,
            createdAtLabel: formatRelativeTime(d.createdAt),
          }));

          set((s) => {
            const localIds = new Set(s.documents.map((d) => d.id));
            const newFromServer = serverDocs.filter((d) => !localIds.has(d.id));
            return {
              documents: [...s.documents, ...newFromServer],
              isLoading: false,
            };
          });
        } catch {
          set({ isLoading: false });
        }
      },
    }),
    { name: 'anticeil-pdf-store-v1' }
  )
);
