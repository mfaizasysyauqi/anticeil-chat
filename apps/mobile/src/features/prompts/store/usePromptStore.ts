import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandAsyncStorage } from '../../../core/storage/storageAdapter';
import { Persona, DEFAULT_PERSONAS } from '@chatbyok/core';

interface PromptState {
  personas: Persona[];
  activePersonaId: string;

  setActivePersona: (id: string) => void;
  addCustomPersona: (persona: Omit<Persona, 'id'>) => void;
  deleteCustomPersona: (id: string) => void;
}

export const usePromptStore = create<PromptState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: 'chatbyok_mobile_prompts_storage',
      storage: createJSONStorage(() => zustandAsyncStorage),
    }
  )
);
