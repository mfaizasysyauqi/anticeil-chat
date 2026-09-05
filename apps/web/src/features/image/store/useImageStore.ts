'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useWorkspaceStore } from '../../storage/store/useWorkspaceStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MediaType = 'image' | 'video' | 'audio';

export interface ImageMediaItem {
  id: string;
  type: MediaType;
  prompt: string;
  url: string;
  // image-specific
  style?: string;
  ratio?: string;
  model?: string;
  // video-specific
  duration?: string;
  // audio-specific
  title?: string;
  voice?: string;
  speed?: number;
  category?: 'speech' | 'music' | 'sfx';
  durationSec?: number;
  // common
  isPinned: boolean;
  collectionId: string | null; // imageCollection id from useWorkspaceStore
  createdAt: string; // ISO string
  createdAtLabel: string; // human label
}

interface ImageState {
  items: ImageMediaItem[];
  isLoading: boolean;

  // CRUD
  addItem: (item: Omit<ImageMediaItem, 'isPinned' | 'collectionId'>) => void;
  removeItem: (id: string) => void;

  // Pin
  togglePin: (id: string) => void;

  // Folder
  moveToCollection: (id: string, collectionId: string | null) => void;

  // Hydrate from Supabase history
  hydrateFromApi: (token: string) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useImageStore = create<ImageState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      addItem: (item) => {
        set((s) => ({
          items: [
            { ...item, isPinned: false, collectionId: null },
            ...s.items.filter((i) => i.id !== item.id),
          ],
        }));
      },

      removeItem: (id) => {
        set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
      },

      togglePin: (id) => {
        // Max 3 pinned items per media type (image, video, audio)
        const { items } = get();
        const item = items.find((i) => i.id === id);
        if (!item) return;

        const mediaType = item.type || 'image';
        const pinnedInType = items.filter((i) => (i.type || 'image') === mediaType && i.isPinned).length;

        if (!item.isPinned && pinnedInType >= 3) {
          const typeLabel = mediaType === 'video' ? 'video' : mediaType === 'audio' ? 'audio' : 'gambar';
          alert(`Maksimal 3 ${typeLabel} yang dapat disematkan / Maximum of 3 pinned ${typeLabel}s allowed.`);
          return;
        }

        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, isPinned: !i.isPinned } : i)),
        }));
      },

      moveToCollection: (id, collectionId) => {
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, collectionId } : i)),
        }));
      },

      hydrateFromApi: async (token) => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/imagine/history', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) return;
          const data = await res.json();

          const toItem = (raw: any, type: MediaType): ImageMediaItem => ({
            id: raw.id,
            type,
            prompt: raw.prompt || '',
            url: raw.url || '',
            style: raw.style,
            ratio: raw.ratio,
            model: raw.model,
            duration: raw.duration,
            title: raw.title,
            voice: raw.voice,
            category: raw.category,
            durationSec: raw.durationSec,
            isPinned: false,
            collectionId: null,
            createdAt: raw.createdAt || new Date().toISOString(),
            createdAtLabel: raw.createdAt || 'Just now',
          });

          const incoming: ImageMediaItem[] = [
            ...(data.images || []).map((i: any) => toItem(i, 'image')),
            ...(data.videos || []).map((i: any) => toItem(i, 'video')),
            ...(data.audios || []).map((i: any) => toItem(i, 'audio')),
          ];

          // Merge: keep local pinned/collectionId, fill in new items from server
          set((s) => {
            const existingIds = new Set(s.items.map((i) => i.id));
            const newItems = incoming.filter((i) => !existingIds.has(i.id));
            return { items: [...newItems, ...s.items] };
          });
        } catch {
          // Silently fail — local data still works
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'anticeil-imagine-store',
      version: 1,
    }
  )
);
