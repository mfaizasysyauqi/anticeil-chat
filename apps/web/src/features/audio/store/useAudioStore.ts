'use client';

import { create } from 'zustand';

export type AudioTab = 'music' | 'tts' | 'stt';

interface AudioState {
  activeTab: AudioTab;
  setActiveTab: (tab: AudioTab) => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  activeTab: 'music',
  setActiveTab: (activeTab) => set({ activeTab }),
}));
