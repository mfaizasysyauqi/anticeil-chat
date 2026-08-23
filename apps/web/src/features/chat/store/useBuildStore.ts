'use client';

import { create } from 'zustand';

export interface Artifact {
  id: string;
  title: string;
  language: string;
  code: string;
}

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';
export type ViewMode = 'preview' | 'code' | 'browser';

interface BuildState {
  isOpen: boolean;
  activeArtifact: Artifact | null;
  viewMode: ViewMode;
  viewport: ViewportMode;
  isFullscreen: boolean;
  reloadKey: number;

  // Actions
  openArtifact: (code: string, language?: string, title?: string) => void;
  openBrowserAgent: () => void;
  close: () => void;
  toggle: () => void;
  setViewMode: (mode: ViewMode) => void;
  setViewport: (vp: ViewportMode) => void;
  toggleFullscreen: () => void;
  triggerReload: () => void;
  updateCode: (code: string) => void;
}

export const useBuildStore = create<BuildState>((set, get) => ({
  isOpen: false,
  activeArtifact: null,
  viewMode: 'preview',
  viewport: 'desktop',
  isFullscreen: false,
  reloadKey: 0,

  openBrowserAgent: () => {
    set({
      isOpen: true,
      viewMode: 'browser',
    });
  },

  openArtifact: (code, language = 'html', title = 'Interactive App') => {
    set({
      isOpen: true,
      activeArtifact: {
        id: `artifact_${Date.now()}`,
        title,
        language: language.toLowerCase(),
        code,
      },
      viewMode: 'preview',
      reloadKey: get().reloadKey + 1,
    });
  },

  close: () => set({ isOpen: false }),

  toggle: () => set((state) => ({ isOpen: !state.isOpen })),

  setViewMode: (viewMode) => set({ viewMode }),

  setViewport: (viewport) => set({ viewport }),

  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),

  triggerReload: () => set((state) => ({ reloadKey: state.reloadKey + 1 })),

  updateCode: (code) =>
    set((state) => {
      if (!state.activeArtifact) return state;
      return {
        activeArtifact: {
          ...state.activeArtifact,
          code,
        },
      };
    }),
}));
