'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Persona, DEFAULT_PERSONAS } from '@chatbyok/core';

interface PromptState {
  personas: Persona[];
  activePersonaId: string;
  
  // Actions
  setActivePersona: (id: string) => void;
  addCustomPersona: (persona: Omit<Persona, 'id'>) => void;
  deleteCustomPersona: (id: string) => void;
  getPersonaById: (id: string) => Persona | undefined;
}

export const usePromptStore = create<PromptState>()(
  persist(
    (set, get) => ({
      personas: DEFAULT_PERSONAS,
      activePersonaId: 'general-assistant',

      setActivePersona: (activePersonaId) => set({ activePersonaId }),

      addCustomPersona: (newPersona) =>
        set((state) => ({
          personas: [
            ...state.personas,
            {
              ...newPersona,
              id: `custom-${Date.now()}`,
            },
          ],
        })),

      deleteCustomPersona: (id) =>
        set((state) => ({
          personas: state.personas.filter((p) => p.id !== id),
          activePersonaId:
            state.activePersonaId === id ? 'general-assistant' : state.activePersonaId,
        })),

      getPersonaById: (id) => get().personas.find((p) => p.id === id),
    }),
    {
      name: 'chatbyok_prompts_storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
