import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandAsyncStorage } from '../../../core/storage/storageAdapter';
import {
  ChatMessage,
  ChatSession,
  LLMProviderId,
  DEFAULT_PROVIDER_ID,
  DEFAULT_MODEL_ID,
  getModelById,
  estimateTokens,
  calculateCostUsd,
  parseSSELine,
  getProviderById,
} from '@anticeil/core';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string;
  messages: Record<string, ChatMessage[]>;
  isGenerating: boolean;

  getActiveSession: () => ChatSession | undefined;
  getActiveMessages: () => ChatMessage[];
  createSession: (providerId?: LLMProviderId, modelId?: string, systemPrompt?: string) => string;
  selectSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  stopGeneration: () => void;
}

const initialSessionId = 'mobile-session-default';
const initialSession: ChatSession = {
  id: initialSessionId,
  title: 'New Conversation',
  providerId: DEFAULT_PROVIDER_ID,
  modelId: DEFAULT_MODEL_ID,
  systemPrompt: '',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  temperature: 0.7,
};

let activeAbortController: AbortController | null = null;

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [initialSession],
      activeSessionId: initialSessionId,
      messages: { [initialSessionId]: [] },
      isGenerating: false,

      getActiveSession: () => {
        const { sessions, activeSessionId } = get();
        return sessions.find((s) => s.id === activeSessionId) || sessions[0];
      },

      getActiveMessages: () => {
        const { messages, activeSessionId } = get();
        return messages[activeSessionId] || [];
      },

      createSession: (providerId, modelId, systemPrompt) => {
        const settings = useSettingsStore.getState();
        const newId = `mobile-session-${Date.now()}`;
        const newSession: ChatSession = {
          id: newId,
          title: 'New Conversation',
          providerId: providerId || settings.activeProviderId || DEFAULT_PROVIDER_ID,
          modelId: modelId || settings.activeModelId || DEFAULT_MODEL_ID,
          systemPrompt: systemPrompt || '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          temperature: 0.7,
        };

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: newId,
          messages: { ...state.messages, [newId]: [] },
        }));

        return newId;
      },

      selectSession: (sessionId) => {
        set({ activeSessionId: sessionId });
      },

      deleteSession: (sessionId) => {
        set((state) => {
          const newSessions = state.sessions.filter((s) => s.id !== sessionId);
          const nextActiveId =
            state.activeSessionId === sessionId
              ? newSessions[0]?.id || ''
              : state.activeSessionId;

          const newMessages = { ...state.messages };
          delete newMessages[sessionId];

          if (newSessions.length === 0) {
            const fallbackId = `mobile-session-${Date.now()}`;
            const fallbackSession: ChatSession = {
              id: fallbackId,
              title: 'New Conversation',
              providerId: DEFAULT_PROVIDER_ID,
              modelId: DEFAULT_MODEL_ID,
              systemPrompt: '',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              temperature: 0.7,
            };
            return {
              sessions: [fallbackSession],
              activeSessionId: fallbackId,
              messages: { [fallbackId]: [] },
            };
          }

          return {
            sessions: newSessions,
            activeSessionId: nextActiveId,
            messages: newMessages,
          };
        });
      },

      sendMessage: async (content: string) => {
        const state = get();
        if (state.isGenerating || !content.trim()) return;

        const session = state.getActiveSession();
        if (!session) return;

        const settings = useSettingsStore.getState();
        const apiKeyConfig = settings.apiKeys[session.providerId];
        const providerDef = getProviderById(session.providerId);
        const baseUrl = apiKeyConfig?.baseUrl || providerDef?.defaultBaseUrl || '';
        const apiKey = apiKeyConfig?.apiKey || '';

        const userMessageId = `mobile-msg-user-${Date.now()}`;
        const userMessage: ChatMessage = {
          id: userMessageId,
          sessionId: session.id,
          role: 'user',
          content: content.trim(),
          timestamp: Date.now(),
          status: 'done',
        };

        const assistantMessageId = `mobile-msg-ai-${Date.now() + 1}`;
        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          sessionId: session.id,
          role: 'assistant',
          content: '',
          timestamp: Date.now() + 1,
          status: 'streaming',
        };

        const currentMessages = state.messages[session.id] || [];
        const updatedMessages = [...currentMessages, userMessage, assistantMessage];

        const updates: Partial<ChatSession> = { updatedAt: Date.now() };
        if (session.title === 'New Conversation') {
          updates.title = content.trim().slice(0, 30);
        }

        set((s) => ({
          messages: {
            ...s.messages,
            [session.id]: updatedMessages,
          },
          sessions: s.sessions.map((sess) =>
            sess.id === session.id ? { ...sess, ...updates } : sess
          ),
          isGenerating: true,
        }));

        const controller = new AbortController();
        activeAbortController = controller;

        const modelDef = getModelById(session.modelId);
        let accumulatedText = '';
        let accumulatedReasoning = '';

        try {
          // Format messages for request
          const apiMessages = updatedMessages.slice(0, -1).map((m) => ({
            role: m.role,
            content: m.content,
          }));

          const payload = {
            model: session.modelId,
            messages: session.systemPrompt
              ? [{ role: 'system', content: session.systemPrompt }, ...apiMessages]
              : apiMessages,
            temperature: session.temperature,
            stream: false, // Mobile simple fallback for instant reliability
          };

          const endpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          if (!response.ok) {
            const errData = await response.text();
            throw new Error(`HTTP ${response.status}: ${errData}`);
          }

          const data = await response.json();
          accumulatedText = data.choices?.[0]?.message?.content || 'No response generated';
          accumulatedReasoning = data.choices?.[0]?.message?.reasoning_content || '';

          const promptTokens = data.usage?.prompt_tokens || estimateTokens(content);
          const completionTokens = data.usage?.completion_tokens || estimateTokens(accumulatedText);
          const cost = calculateCostUsd(modelDef, promptTokens, completionTokens);

          set((s) => ({
            messages: {
              ...s.messages,
              [session.id]: (s.messages[session.id] || []).map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content: accumulatedText,
                      reasoningContent: accumulatedReasoning || undefined,
                      status: 'done',
                      tokensUsed: {
                        prompt: promptTokens,
                        completion: completionTokens,
                        total: promptTokens + completionTokens,
                      },
                      estimatedCostUsd: cost,
                    }
                  : m
              ),
            },
          }));
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to generate response';
          set((s) => ({
            messages: {
              ...s.messages,
              [session.id]: (s.messages[session.id] || []).map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content: `⚠️ Error: ${errorMessage}`,
                      status: 'error',
                      error: errorMessage,
                    }
                  : m
              ),
            },
          }));
        } finally {
          activeAbortController = null;
          set({ isGenerating: false });
        }
      },

      stopGeneration: () => {
        if (activeAbortController) {
          activeAbortController.abort();
          activeAbortController = null;
        }
        set({ isGenerating: false });
      },
    }),
    {
      name: 'anticeil_mobile_chat_storage',
      storage: createJSONStorage(() => zustandAsyncStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        messages: state.messages,
      }),
    }
  )
);
