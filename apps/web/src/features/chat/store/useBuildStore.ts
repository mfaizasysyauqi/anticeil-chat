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
  artifacts: Artifact[];
  currentIndex: number;
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
  goToPreviousArtifact: () => void;
  goToNextArtifact: () => void;
  goToArtifactIndex: (index: number) => void;
  resetToHub: () => void;
}

export const useBuildStore = create<BuildState>((set, get) => ({
  isOpen: false,
  artifacts: [],
  currentIndex: -1,
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
    const state = get();
    const cleanLang = language.toLowerCase();
    
    // Check if identical artifact already in list
    const existingIndex = state.artifacts.findIndex(
      (a) => a.title === title && (a.language === cleanLang || a.code === code)
    );

    let newArtifacts = [...state.artifacts];
    let targetIndex = 0;

    if (existingIndex >= 0) {
      newArtifacts[existingIndex] = {
        ...newArtifacts[existingIndex],
        code,
        language: cleanLang,
        title,
      };
      targetIndex = existingIndex;
    } else {
      const newArtifact: Artifact = {
        id: `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        title,
        language: cleanLang,
        code,
      };
      newArtifacts.push(newArtifact);
      targetIndex = newArtifacts.length - 1;
    }

    set({
      isOpen: true,
      artifacts: newArtifacts,
      currentIndex: targetIndex,
      activeArtifact: newArtifacts[targetIndex],
      viewMode: 'preview',
      reloadKey: state.reloadKey + 1,
    });
  },

  goToPreviousArtifact: () => {
    const { artifacts, currentIndex, reloadKey } = get();
    if (currentIndex > 0) {
      const newIdx = currentIndex - 1;
      set({
        currentIndex: newIdx,
        activeArtifact: artifacts[newIdx],
        viewMode: 'preview',
        reloadKey: reloadKey + 1,
      });
    }
  },

  goToNextArtifact: () => {
    const { artifacts, currentIndex, reloadKey } = get();
    if (currentIndex < artifacts.length - 1) {
      const newIdx = currentIndex + 1;
      set({
        currentIndex: newIdx,
        activeArtifact: artifacts[newIdx],
        viewMode: 'preview',
        reloadKey: reloadKey + 1,
      });
    }
  },

  goToArtifactIndex: (index: number) => {
    const { artifacts, reloadKey } = get();
    if (index >= 0 && index < artifacts.length) {
      set({
        currentIndex: index,
        activeArtifact: artifacts[index],
        viewMode: 'preview',
        reloadKey: reloadKey + 1,
      });
    }
  },

  resetToHub: () => {
    set({
      activeArtifact: null,
      currentIndex: -1,
      viewMode: 'preview',
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
      const updated = {
        ...state.activeArtifact,
        code,
      };
      const newArtifacts = state.artifacts.map((a) =>
        a.id === updated.id ? updated : a
      );
      return {
        activeArtifact: updated,
        artifacts: newArtifacts,
      };
    }),
}));
