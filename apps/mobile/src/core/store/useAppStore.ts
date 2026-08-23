import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandAsyncStorage } from '../storage/storageAdapter';
import { Language } from '@chatbyok/core';

export type ActiveTab = 'chat' | 'prompts' | 'settings';

interface AppState {
  activeTab: ActiveTab;
  theme: 'dark' | 'light';
  language: Language;
  isDrawerOpen: boolean;

  setActiveTab: (tab: ActiveTab) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setLanguage: (lang: Language) => void;
  setDrawerOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTab: 'chat',
      theme: 'dark',
      language: 'en',
      isDrawerOpen: false,

      setActiveTab: (activeTab) => set({ activeTab }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setDrawerOpen: (isDrawerOpen) => set({ isDrawerOpen }),
    }),
    {
      name: 'chatbyok_mobile_app_store',
      storage: createJSONStorage(() => zustandAsyncStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
      }),
    }
  )
);
