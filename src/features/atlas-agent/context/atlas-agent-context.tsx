import React, { createContext, useContext } from 'react';
import { useAtlasAgent } from '../hooks/use-atlas-agent';
import type { AiSession, AiMessage } from '../types';

export interface AtlasAgentContextValue {
  sessions: AiSession[];
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  handleCreateNewSession: (title?: string) => Promise<AiSession>;
  handleRenameSession: (sessionId: string, newTitle: string) => Promise<void>;
  handleUpdateSessionMessages: (sessionId: string, messages: AiMessage[]) => Promise<void>;
  handleClearSessionMessages: (sessionId: string) => Promise<void>;
  handleDeleteSession: (sessionId: string) => Promise<void>;
  handleTogglePinSession: (sessionId: string) => Promise<void>;
  isGroqSettingsOpen: boolean;
  setIsGroqSettingsOpen: (open: boolean) => void;
}

const AtlasAgentContext = createContext<AtlasAgentContextValue | null>(null);

export function AtlasAgentProvider({ children }: { children: React.ReactNode }) {
  const value = useAtlasAgent();
  return (
    <AtlasAgentContext.Provider value={value}>
      {children}
    </AtlasAgentContext.Provider>
  );
}

export function useOptionalAtlasAgentContext(): AtlasAgentContextValue | null {
  return useContext(AtlasAgentContext);
}

export function useAtlasAgentContext(): AtlasAgentContextValue {
  const ctx = useContext(AtlasAgentContext);
  if (!ctx) {
    throw new Error('useAtlasAgentContext must be used within AtlasAgentProvider');
  }
  return ctx;
}

// Backward compatibility aliases
export const AiCommandCenterProvider = AtlasAgentProvider;
export const useAiCommandCenterContext = useAtlasAgentContext;
export type { AtlasAgentContextValue as AiCommandCenterContextValue };
