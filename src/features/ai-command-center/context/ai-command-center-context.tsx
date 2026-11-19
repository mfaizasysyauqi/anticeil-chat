import React, { createContext, useContext } from 'react';
import { useAiCommandCenter } from '../hooks/use-ai-command-center';
import type { AiSession, AiMessage } from '../types';

interface AiCommandCenterContextValue {
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

const AiCommandCenterContext = createContext<AiCommandCenterContextValue | null>(null);

export function AiCommandCenterProvider({ children }: { children: React.ReactNode }) {
  const value = useAiCommandCenter();
  return (
    <AiCommandCenterContext.Provider value={value}>
      {children}
    </AiCommandCenterContext.Provider>
  );
}

export function useAiCommandCenterContext(): AiCommandCenterContextValue {
  const ctx = useContext(AiCommandCenterContext);
  if (!ctx) {
    throw new Error('useAiCommandCenterContext must be used within AiCommandCenterProvider');
  }
  return ctx;
}
