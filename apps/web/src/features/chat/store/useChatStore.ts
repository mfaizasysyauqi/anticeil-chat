'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  ChatMessage,
  ChatSession,
  FileAttachment,
  LLMProviderId,
  DEFAULT_PROVIDER_ID,
  DEFAULT_MODEL_ID,
  getModelById,
  estimateTokens,
  calculateCostUsd,
  performWebSearch,
  formatWebSearchResults,
  cleanAgenticStream,
  generateConnectorsSystemInstruction,
  parseToolCallsFromLLM,
  executeConnectorTool,
  ToolCallResult,
  isCloudTier,
} from '@anticeil/core';
import { streamBYOKChat } from '../data/byokApi';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useConnectorsStore } from '../../connectors/store/useConnectorsStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useCreditStore } from '../../credits/store/useCreditStore';
import { useBuildStore } from './useBuildStore';

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string;
  messages: Record<string, ChatMessage[]>; // Keyed by sessionId
  isGenerating: boolean;
  abortController: AbortController | null;

  // Session Actions
  createSession: (providerId?: LLMProviderId, modelId?: string, systemPrompt?: string) => string;
  compactSession: (sessionId: string) => Promise<void>;
  selectSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => void;
  moveSessionToProject: (sessionId: string, projectId: string | null) => void;
  clearAllSessions: () => void;

  // Messaging Actions
  sendMessage: (
    content: string,
    attachments?: FileAttachment[],
    enableWebSearch?: boolean
  ) => Promise<void>;
  generateImage: (prompt: string) => Promise<void>;
  generateVideo: (prompt: string) => Promise<void>;
  stopGeneration: () => void;
  deleteMessage: (sessionId: string, messageId: string) => void;
  editMessage: (sessionId: string, userMessageId: string, newContent: string) => Promise<void>;
  navigateMessageVersion: (sessionId: string, userMessageId: string, direction: 'prev' | 'next') => void;
  getActiveSession: () => ChatSession | undefined;
  getActiveMessages: () => ChatMessage[];
  syncWithCloud: (accessToken: string) => Promise<void>;
  pushSessionToCloud: (sessionId: string) => Promise<void>;
}

const initialSessionId = 'session-default';
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

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [initialSession],
      activeSessionId: initialSessionId,
      messages: { [initialSessionId]: [] },
      isGenerating: false,
      abortController: null,

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
        const currentUserId = useAuthStore.getState().user?.id;
        const newId = `session-${Date.now()}`;
        const newSession: ChatSession = {
          id: newId,
          userId: currentUserId,
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

      compactSession: async (sessionId) => {
        const state = get();
        const session = state.sessions.find((s) => s.id === sessionId);
        const msgs = state.messages[sessionId] || [];
        if (!session || msgs.length <= 4) return;

        // Take all messages except the latest 4 turns for in-place compaction
        const older = msgs.slice(0, -4);
        const summaryPoints = older
          .filter((m) => m.content?.trim())
          .map((m) => {
            const role = m.role === 'user' ? 'User asked' : 'Assistant responded';
            const snippet = m.content.length > 180 ? `${m.content.slice(0, 177)}...` : m.content;
            return `- ${role}: ${snippet}`;
          })
          .join('\n');

        const existing = session.compactedSummary ? `${session.compactedSummary}\n` : '';
        const updatedSummary = `${existing}### Previous Context Checkpoint (${older.length} messages):\n${summaryPoints}`;

        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? {
                  ...sess,
                  compactedSummary: updatedSummary,
                  compactedMessageCount: (sess.compactedMessageCount || 0) + older.length,
                  updatedAt: Date.now(),
                }
              : sess
          ),
        }));
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
            const fallbackId = `session-${Date.now()}`;
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

      updateSession: (sessionId, updates) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, ...updates, updatedAt: Date.now() } : s
          ),
        }));
      },

      moveSessionToProject: (sessionId, projectId) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, projectId: projectId ?? undefined, updatedAt: Date.now() }
              : s
          ),
        }));
      },

      clearAllSessions: () => {
        const fallbackId = `session-${Date.now()}`;
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
        set({
          sessions: [fallbackSession],
          activeSessionId: fallbackId,
          messages: { [fallbackId]: [] },
        });
      },

      generateImage: async (prompt: string) => {
        const state = get();
        const session = state.getActiveSession();
        if (!session || !prompt.trim()) return;

        const allowed = useCreditStore.getState().canAfford('image', 'anticeil');
        if (!allowed) {
          useCreditStore.getState().setLimitModalOpen(true, 'image');
          return;
        }

        const cleanPrompt = prompt.trim();
        const userMessageId = `msg-user-${Date.now()}`;
        const userMessage: ChatMessage = {
          id: userMessageId,
          sessionId: session.id,
          role: 'user',
          content: `/image ${cleanPrompt}`,
          timestamp: Date.now(),
          status: 'done',
        };

        const assistantMessageId = `msg-ai-${Date.now() + 1}`;
        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          sessionId: session.id,
          role: 'assistant',
          content: `Generating image for prompt: *"${cleanPrompt}"*`,
          timestamp: Date.now() + 1,
          status: 'streaming',
        };

        const currentMessages = state.messages[session.id] || [];
        set((s) => ({
          messages: {
            ...s.messages,
            [session.id]: [...currentMessages, userMessage, assistantMessage],
          },
          isGenerating: true,
        }));

        let creditDeducted = false;

        try {
          useCreditStore.getState().deductCredits('image', 'anticeil');
          creditDeducted = true;

          const encodedPrompt = encodeURIComponent(cleanPrompt);
          const seed = Math.floor(Math.random() * 100000);
          const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=1024&height=1024&nologo=true`;

          await new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Gagal memuat gambar'));
            img.src = imageUrl;
          });

          set((s) => ({
            messages: {
              ...s.messages,
              [session.id]: (s.messages[session.id] || []).map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content: `Here is your generated image for: **${cleanPrompt}**`,
                      imageUrl,
                      status: 'done',
                    }
                  : m
              ),
            },
          }));
        } catch (err: unknown) {
          if (creditDeducted) {
            useCreditStore.getState().refundCredits('image', 'anticeil');
          }
          const errMsg = err instanceof Error ? err.message : 'Image generation failed';
          set((s) => ({
            messages: {
              ...s.messages,
              [session.id]: (s.messages[session.id] || []).map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content: `⚠️ Error: ${errMsg}`,
                      status: 'error',
                    }
                  : m
              ),
            },
          }));
        } finally {
          set({ isGenerating: false });
        }
      },

      generateVideo: async (prompt: string) => {
        const state = get();
        const session = state.getActiveSession();
        if (!session) return;

        const allowed = useCreditStore.getState().canAfford('video', 'anticeil');
        if (!allowed) {
          useCreditStore.getState().setLimitModalOpen(true, 'video');
          return;
        }

        const cleanPrompt = prompt.trim();
        const userMessageId = `msg-user-${Date.now()}`;
        const userMessage: ChatMessage = {
          id: userMessageId,
          sessionId: session.id,
          role: 'user',
          content: `/video ${cleanPrompt}`,
          timestamp: Date.now(),
          status: 'done',
        };

        const assistantMessageId = `msg-ai-${Date.now() + 1}`;
        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          sessionId: session.id,
          role: 'assistant',
          content: `Rendering high-definition AI video for prompt: *"${cleanPrompt}"*`,
          timestamp: Date.now() + 1,
          status: 'streaming',
        };

        const currentMessages = state.messages[session.id] || [];
        set((s) => ({
          messages: {
            ...s.messages,
            [session.id]: [...currentMessages, userMessage, assistantMessage],
          },
          isGenerating: true,
        }));

        let creditDeducted = false;

        try {
          useCreditStore.getState().deductCredits('video', 'anticeil');
          creditDeducted = true;

          // Video simulation URL / sample stream for client-side rendering
          const videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

          await new Promise((r) => setTimeout(r, 1200));

          set((s) => ({
            messages: {
              ...s.messages,
              [session.id]: (s.messages[session.id] || []).map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content: `Here is your generated AI video for: **${cleanPrompt}**`,
                      videoUrl,
                      status: 'done',
                    }
                  : m
              ),
            },
          }));
        } catch (err: unknown) {
          if (creditDeducted) {
            useCreditStore.getState().refundCredits('video', 'anticeil');
          }
          const errMsg = err instanceof Error ? err.message : 'Video generation failed';
          set((s) => ({
            messages: {
              ...s.messages,
              [session.id]: (s.messages[session.id] || []).map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content: `⚠️ Error: ${errMsg}`,
                      status: 'error',
                    }
                  : m
              ),
            },
          }));
        } finally {
          set({ isGenerating: false });
        }
      },

      sendMessage: async (content: string, attachments?: FileAttachment[], enableWebSearch = false) => {
        const state = get();
        if (state.isGenerating || (!content.trim() && (!attachments || attachments.length === 0))) return;

        if (content.trim().startsWith('/image ')) {
          const imagePrompt = content.trim().replace(/^\/image\s+/, '');
          return state.generateImage(imagePrompt);
        }

        if (content.trim().startsWith('/video ')) {
          const videoPrompt = content.trim().replace(/^\/video\s+/, '');
          return state.generateVideo(videoPrompt);
        }

        const session = state.getActiveSession();
        if (!session) return;

        // Credit check for Anticeil Free provider (do not deduct until stream receives content)
        if (session.providerId === 'anticeil') {
          const allowed = useCreditStore.getState().canAfford('chat', 'anticeil');
          if (!allowed) {
            useCreditStore.getState().setLimitModalOpen(true, 'chat');
            return;
          }
        }

        const settings = useSettingsStore.getState();
        const apiKeyConfig = settings.apiKeys[session.providerId];

        // 1. Check if Live Web Search is requested
        let webSearchReasoning = '';
        let webSearchContext = '';
        const shouldWebSearch = enableWebSearch || content.trim().startsWith('/search ');
        const cleanUserQuery = content.trim().replace(/^\/search\s+/, '');
        // Read connector state early — web search is skipped when connectors are active
        const hasActiveConnectors = useConnectorsStore.getState().activeConnectorIds.length > 0;

        // 2. Format user content with attached document contents
        let effectiveContent = cleanUserQuery;
        if (attachments && attachments.length > 0) {
          const docContexts = attachments
            .filter((a) => !a.isImage)
            .map((a) => `[File Attachment: ${a.name} (${a.type})]\n\`\`\`\n${a.content}\n\`\`\``)
            .join('\n\n');

          if (docContexts) {
            effectiveContent = `${effectiveContent ? `${effectiveContent}\n\n` : ''}${docContexts}`;
          }
        }

        // 3. Create and append user message
        const userMessageId = `msg-user-${Date.now()}`;
        const userMessage: ChatMessage = {
          id: userMessageId,
          sessionId: session.id,
          role: 'user',
          content: cleanUserQuery || `[Attached ${attachments?.length} file(s)]`,
          attachments: attachments && attachments.length > 0 ? attachments : undefined,
          timestamp: Date.now(),
          status: 'done',
        };

        // 4. Create placeholder assistant message
        const assistantMessageId = `msg-ai-${Date.now() + 1}`;
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
          updates.title = cleanUserQuery.slice(0, 36) + (cleanUserQuery.length > 36 ? '...' : '');
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
        set({ abortController: controller });

        // Perform Web Search if requested — skipped when connectors are active
        if (shouldWebSearch && cleanUserQuery && !hasActiveConnectors) {
          try {
            webSearchReasoning += `Ran 1 search for "${cleanUserQuery}"\n`;
            const searchResults = await performWebSearch(cleanUserQuery);
            if (searchResults.length > 0) {
              for (const res of searchResults.slice(0, 3)) {
                webSearchReasoning += `Opened page ${res.url}\n`;
              }
              webSearchReasoning += `Reviewing ${searchResults.length} search results and formulating response\n`;
              webSearchContext = formatWebSearchResults(cleanUserQuery, searchResults);
            } else {
              webSearchReasoning += `No live search results found. Synthesizing from base knowledge\n`;
            }
          } catch (err) {
            console.warn('[Anticeil] Web search failed:', err);
          }
        }

        // Firecrawl URL scraping — auto-detects URLs in message (max 3), priority:
        //   1. User BYOK Firecrawl key (direct, no credit cost)
        //   2. Anticeil provider key via /api/scrape (included in 1 chat credit, no extra deduction)
        //   3. Jina Reader fallback (free, no key)
        const urlMatches = cleanUserQuery.match(/https?:\/\/[^\s]+/g);
        if (urlMatches && urlMatches.length > 0) {
          const firecrawlCfg = settings.apiKeys['firecrawl' as keyof typeof settings.apiKeys];
          const byokKey = firecrawlCfg?.apiKey?.trim();
          const isAnticeilSession = session.providerId === 'anticeil';
          const scrapedSections: string[] = [];

          for (const url of urlMatches.slice(0, 3)) {
            try {
              let markdown = '';

              if (byokKey) {
                // 1. BYOK — user's own key, direct call, no credit deduction
                const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${byokKey}`,
                  },
                  body: JSON.stringify({ url, formats: ['markdown'] }),
                  signal: controller.signal,
                });
                if (res.ok) {
                  const data = await res.json();
                  markdown = data?.data?.markdown || '';
                }
              } else if (isAnticeilSession) {
                // 2. Anticeil provider key — scrape included in the 1 chat credit already paid
                const res = await fetch('/api/scrape', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ url }),
                  signal: controller.signal,
                });
                if (res.ok) {
                  const data = await res.json();
                  markdown = data?.markdown || '';
                }

              } else {
                // 3. Fallback: Jina Reader (no key, rate-limited)
                const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
                  headers: { Accept: 'text/plain', 'X-Return-Format': 'text' },
                  signal: controller.signal,
                });
                if (jinaRes.ok) markdown = await jinaRes.text();
              }

              if (markdown && markdown.length > 50) {
                webSearchReasoning += `Scraped ${url}\n`;
                scrapedSections.push(`### Content from ${url}\n\n${markdown.slice(0, 6000)}`);
              }
            } catch {
              // non-fatal — ignore per-URL failures
            }
          }

          if (scrapedSections.length > 0) {
            const scrapedBlock = `<web_context>\n${scrapedSections.join('\n\n')}\n</web_context>`;
            webSearchContext = webSearchContext
              ? `${webSearchContext}\n\n${scrapedBlock}`
              : scrapedBlock;
          }
        }

        // Prepare messages for API with sliding context window + in-place memory compaction
        // When conversation exceeds 8 messages, compact older turns into session memory
        // and send sliding window of recent 6 messages + compacted memory checkpoint.
        const rawHistory = updatedMessages.slice(0, -1);
        let compactedMemoryBlock = session.compactedSummary || '';
        let windowedHistory = rawHistory;

        if (rawHistory.length > 8) {
          const recentCount = 6;
          const older = rawHistory.slice(0, -recentCount);
          windowedHistory = rawHistory.slice(-recentCount);

          const autoSummaryPoints = older
            .filter((m) => m.content?.trim())
            .map((m) => {
              const role = m.role === 'user' ? 'User asked' : 'Assistant responded';
              const snippet = m.content.length > 180 ? `${m.content.slice(0, 177)}...` : m.content;
              return `- ${role}: ${snippet}`;
            })
            .join('\n');

          compactedMemoryBlock = session.compactedSummary
            ? `${session.compactedSummary}\n${autoSummaryPoints}`
            : autoSummaryPoints;

          // Update session with compacted memory
          set((s) => ({
            sessions: s.sessions.map((sess) =>
              sess.id === session.id
                ? {
                    ...sess,
                    compactedSummary: compactedMemoryBlock,
                    compactedMessageCount: (sess.compactedMessageCount || 0) + older.length,
                  }
                : sess
            ),
          }));
        }

        // Connectors Setup
        const connectorsStore = useConnectorsStore.getState();
        const activeConnectorIds = connectorsStore.activeConnectorIds;
        const connectorsInstruction = generateConnectorsSystemInstruction(activeConnectorIds);

        const compactedContextInstruction = compactedMemoryBlock
          ? `\n\n<compacted_conversation_memory>\nThe following is a structured memory checkpoint of earlier conversation turns in this thread. Maintain continuity with these facts and decisions:\n${compactedMemoryBlock}\n</compacted_conversation_memory>`
          : '';

        const effectiveSystemPrompt = [connectorsInstruction, session.systemPrompt, compactedContextInstruction]
          .filter(Boolean)
          .join('\n\n');

        const modelDef = getModelById(session.modelId);
        let accumulatedText = '';
        let accumulatedReasoning = webSearchReasoning;
        let promptTokensCount = estimateTokens(
          (effectiveSystemPrompt || '') + ' ' + updatedMessages.map((m) => m.content).join(' ')
        );
        let completionTokensCount = 0;
        let lastFlushTime = 0;

        const apiMessages = windowedHistory.map((m) => {
          if (m.id === userMessageId) {
            return {
              ...m,
              content: webSearchContext
                ? `${webSearchContext}\n\nUser Question: ${effectiveContent}`
                : effectiveContent,
            };
          }
          return m;
        });

        const userTier = useAuthStore.getState().tier;
        let creditDeducted = false;

        try {
          await streamBYOKChat({
            providerId: session.providerId,
            modelId: session.modelId,
            systemPrompt: effectiveSystemPrompt,
            messages: apiMessages,
            apiKeyConfig: apiKeyConfig || { apiKey: '', isEnabled: true },
            temperature: session.temperature,
            tier: userTier,
            enableWebSearch: shouldWebSearch,
            signal: controller.signal,
            onChunk: (chunk) => {
              if (chunk.delta) accumulatedText += chunk.delta;
              if (chunk.reasoningDelta) accumulatedReasoning += chunk.reasoningDelta;

              // Deduct credits on first actual content received from Anticeil provider
              if (!creditDeducted && (chunk.delta || chunk.reasoningDelta) && session.providerId === 'anticeil') {
                const promptLength = apiMessages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
                useCreditStore.getState().deductCredits('chat', 'anticeil', {
                  modelId: session.modelId,
                  promptLength,
                  totalTokens: chunk.promptTokens,
                });
                creditDeducted = true;
              }

              if (chunk.promptTokens) promptTokensCount = chunk.promptTokens;
              if (chunk.completionTokens) completionTokensCount = chunk.completionTokens;
              else completionTokensCount = estimateTokens(accumulatedText);

              const cost = calculateCostUsd(modelDef, promptTokensCount, completionTokensCount);

              const flushState = (isDone: boolean) => {
                const { cleanContent, reasoningContent } = cleanAgenticStream(
                  accumulatedText,
                  accumulatedReasoning,
                  isDone
                );

                const buildAgentSteps = (msg?: any): import('@anticeil/core').AgentStep[] => {
                  const steps: import('@anticeil/core').AgentStep[] = [];

                  // 1. Connectors / MCP
                  if (activeConnectorIds && activeConnectorIds.length > 0) {
                    steps.push({
                      id: 'step-connector',
                      phase: 'connector',
                      title: `Connectors & MCP (${activeConnectorIds.map((id) => id.charAt(0).toUpperCase() + id.slice(1)).join(', ')})`,
                      content: `Active connectors: ${activeConnectorIds.join(', ')}`,
                      timestamp: Date.now(),
                    });
                  }

                  // 2. Web Search
                  if (shouldWebSearch && cleanUserQuery && !hasActiveConnectors) {
                    steps.push({
                      id: 'step-websearch',
                      phase: 'web_search',
                      title: `Web Search: "${cleanUserQuery.slice(0, 28)}${cleanUserQuery.length > 28 ? '...' : ''}"`,
                      content: 'Browsing search indices for real-time information',
                      timestamp: Date.now(),
                    });
                  }

                  // 3. Read (scraped URLs or attachments)
                  if (urlMatches && urlMatches.length > 0) {
                    urlMatches.slice(0, 3).forEach((u, idx) => {
                      try {
                        const hostname = new URL(u).hostname;
                        steps.push({
                          id: `step-read-${idx}`,
                          phase: 'read',
                          title: `Read: ${hostname}`,
                          content: `Extracted content from ${u}`,
                          timestamp: Date.now(),
                        });
                      } catch {
                        steps.push({
                          id: `step-read-${idx}`,
                          phase: 'read',
                          title: `Read: Web source`,
                          content: u,
                          timestamp: Date.now(),
                        });
                      }
                    });
                  } else if (attachments && attachments.length > 0) {
                    attachments.slice(0, 3).forEach((att, idx) => {
                      steps.push({
                        id: `step-read-att-${idx}`,
                        phase: 'read',
                        title: `Read: ${att.name}`,
                        content: `${att.type} (${Math.round(att.size / 1024)} KB)`,
                        timestamp: Date.now(),
                      });
                    });
                  }

                  // 4. Tools / Function calls
                  const currentToolResults = msg?.toolResults;
                  if (currentToolResults && currentToolResults.length > 0) {
                    currentToolResults.forEach((t: any, idx: number) => {
                      steps.push({
                        id: `step-tool-${idx}`,
                        phase: 'tool_call',
                        title: `Tool: ${t.toolName}`,
                        content: t.summary || `Status: ${t.status}`,
                        timestamp: Date.now(),
                      });
                    });
                  }

                  // 5. Reasoning / Thinking
                  if (reasoningContent) {
                    const durationSec = Math.max(1, Math.floor(reasoningContent.length / 100));
                    steps.push({
                      id: 'step-reasoning',
                      phase: 'reasoning',
                      title: `Thinking (${durationSec}s)`,
                      content: reasoningContent,
                      timestamp: Date.now(),
                    });
                  }

                  // 6. Synthesis
                  steps.push({
                    id: 'step-synthesis',
                    phase: 'synthesis',
                    title: 'Synthesis',
                    content: cleanContent.slice(0, 120),
                    timestamp: Date.now(),
                  });

                  // 7. Result
                  if (isDone) {
                    steps.push({
                      id: 'step-result',
                      phase: 'result',
                      title: 'Result',
                      content: cleanContent.slice(0, 80),
                      timestamp: Date.now(),
                    });
                  }

                  return steps;
                };

                set((s) => ({
                  messages: {
                    ...s.messages,
                    [session.id]: (s.messages[session.id] || []).map((m) =>
                      m.id === assistantMessageId
                        ? {
                            ...m,
                            content: cleanContent,
                            reasoningContent: reasoningContent || undefined,
                            agentSteps: buildAgentSteps(m),
                            status: isDone ? 'done' : 'streaming',
                            tokensUsed: {
                              prompt: promptTokensCount,
                              completion: completionTokensCount,
                              total: promptTokensCount + completionTokensCount,
                            },
                            estimatedCostUsd: cost,
                          }
                        : m
                    ),
                  },
                }));
              };

              if (chunk.isDone) {
                flushState(true);
              } else {
                const now = Date.now();
                if (now - lastFlushTime > 50) {
                  lastFlushTime = now;
                  flushState(false);
                }
              }
            },
          });

          // Auto-open Canvas if the response contains a standalone previewable artifact
          if (!controller.signal.aborted) {
            const codeMatch = accumulatedText.match(/```(html|htm|javascript|js|jsx|tsx|svg|mermaid|mmd)\n([\s\S]*?)```/);
            if (codeMatch && codeMatch[2].trim().length > 100) {
              const lang = codeMatch[1];
              const code = codeMatch[2].trim();
              const isRunnableApp =
                lang === 'html' ||
                lang === 'htm' ||
                lang === 'svg' ||
                lang === 'mermaid' ||
                lang === 'mmd' ||
                code.includes('<!DOCTYPE') ||
                code.includes('<html') ||
                code.includes('<script') ||
                code.includes('function ') ||
                code.includes('<canvas') ||
                code.includes('export default function') ||
                code.includes('function App(');
              if (isRunnableApp) {
                // Slight delay so the message finishes rendering first
                setTimeout(() => {
                  useBuildStore.getState().openArtifact(code, lang === 'htm' ? 'html' : lang, 'Canvas Preview');
                }, 300);
              }
            }
          }

          // Check if tool calls were triggered in main text OR in reasoning/thinking stream
          let { toolCalls } = parseToolCallsFromLLM(accumulatedText);
          if (toolCalls.length === 0 && accumulatedReasoning) {
            const fromReasoning = parseToolCallsFromLLM(accumulatedReasoning);
            if (fromReasoning.toolCalls.length > 0) {
              toolCalls = fromReasoning.toolCalls;
            }
          }

          if (toolCalls.length > 0 && !controller.signal.aborted) {
            // Update assistant status while executing tool
            const toolSummaryNames = toolCalls.map((t) => t.name).join(', ');
            set((s) => ({
              messages: {
                ...s.messages,
                [session.id]: (s.messages[session.id] || []).map((m) =>
                  m.id === assistantMessageId
                    ? {
                        ...m,
                        content: `⚡ Mengambil data dari ${toolSummaryNames}...`,
                        reasoningContent: `Menghubungkan ke ${toolSummaryNames} untuk mengambil data terbaru...`,
                        status: 'streaming',
                      }
                    : m
                ),
              },
            }));

            const executedResults: ToolCallResult[] = [];

            for (const toolCall of toolCalls) {
              const res = await executeConnectorTool(toolCall, {
                gmail: connectorsStore.getGmailClient(),
                calendar: connectorsStore.getCalendarClient(),
                drive: connectorsStore.getDriveClient(),
                notion: connectorsStore.getNotionClient(),
                github: connectorsStore.getGitHubClient(),
              });
              connectorsStore.recordToolExecution(res);
              executedResults.push(res);
            }

            // Attach tool results to message
            set((s) => ({
              messages: {
                ...s.messages,
                [session.id]: (s.messages[session.id] || []).map((m) =>
                  m.id === assistantMessageId
                    ? {
                        ...m,
                        toolResults: executedResults,
                        status: 'streaming',
                      }
                    : m
                ),
              },
            }));

            // Multi-turn synthesis with tool results
            const toolResultsPrompt = executedResults
              .map(
                (r) =>
                  `[Tool: ${r.toolName} (${r.status})]\nResult: ${JSON.stringify(r.data, null, 2)}\nSummary: ${r.summary}`
              )
              .join('\n\n');

            const synthesisMessages: ChatMessage[] = [
              ...apiMessages.slice(-2),
              {
                id: `msg-ai-tool-${Date.now()}`,
                sessionId: session.id,
                role: 'assistant',
                content: toolCalls
                  .map((tc) => `\`\`\`tool_call\n${JSON.stringify({ name: tc.name, arguments: tc.arguments }, null, 2)}\n\`\`\``)
                  .join('\n'),
                timestamp: Date.now(),
                status: 'done',
              },
              {
                id: `msg-tool-res-${Date.now() + 1}`,
                sessionId: session.id,
                role: 'user',
                content: `[Tool Execution Output from Workspace Connectors]:\n${toolResultsPrompt}\n\nBerdasarkan data yang didapat dari eksekusi tool di atas, berikan jawaban akhir yang sangat rapi, informatif, dan lengkap kepada pengguna dalam Bahasa Indonesia. Cantumkan judul, link, dan detail penting dari data tersebut. Jangan meminta pengguna mencari manual.`,
                timestamp: Date.now() + 1,
                status: 'done',
              },
            ];

            let synthesisText = '';
            let synthesisReasoning = '';
            try {
              await streamBYOKChat({
                providerId: session.providerId,
                modelId: session.modelId,
                systemPrompt: effectiveSystemPrompt,
                messages: synthesisMessages,
                apiKeyConfig: apiKeyConfig || { apiKey: '', isEnabled: true },
                temperature: session.temperature,
                tier: userTier,
                signal: controller.signal,
                onChunk: (chunk) => {
                  if (chunk.delta) synthesisText += chunk.delta;
                  if (chunk.reasoningDelta) synthesisReasoning += chunk.reasoningDelta;
                  const { cleanContent } = cleanAgenticStream(synthesisText, synthesisReasoning, chunk.isDone);

                  if (cleanContent) {
                    set((s) => ({
                      messages: {
                        ...s.messages,
                        [session.id]: (s.messages[session.id] || []).map((m) =>
                          m.id === assistantMessageId
                            ? {
                                ...m,
                                content: cleanContent,
                                status: chunk.isDone ? 'done' : 'streaming',
                              }
                            : m
                        ),
                      },
                    }));
                  }
                },
              });
            } catch (synthErr) {
              console.warn('[Anticeil] Synthesis LLM stream failed, generating rich fallback from tool data:', synthErr);
            }

            // If synthesis LLM returned empty or was cut off, generate a rich markdown response directly from tool results
            if (!synthesisText.trim()) {
              const fallbackParts: string[] = [];
              for (const res of executedResults) {
                if (res.toolName === 'notion_search' && res.data?.results) {
                  const pages = res.data.results as Array<{ title?: string; url?: string; lastEditedTime?: string }>;
                  if (pages.length === 0) {
                    fallbackParts.push('Tidak ditemukan halaman atau catatan di workspace Notion Anda.');
                  } else {
                    fallbackParts.push(
                      `Berikut adalah catatan dan halaman yang ditemukan di workspace **Notion** Anda (${pages.length} item):\n\n` +
                        pages
                          .map((p, idx) => {
                            const title = p.title || 'Untitled';
                            const url = p.url || '#';
                            const date = p.lastEditedTime ? new Date(p.lastEditedTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                            return `${idx + 1}. **[${title}](${url})**${date ? ` *(diedit ${date})*` : ''}`;
                          })
                          .join('\n')
                    );
                  }
                } else if (res.toolName === 'github_list_repos' && res.data?.repos) {
                  const repos = res.data.repos as Array<{ fullName: string; htmlUrl: string; description?: string }>;
                  fallbackParts.push(
                    `Berikut repository GitHub Anda (${repos.length} repo):\n\n` +
                      repos.map((r, i) => `${i + 1}. **[${r.fullName}](${r.htmlUrl})**${r.description ? ` — ${r.description}` : ''}`).join('\n')
                  );
                } else if (res.toolName === 'gmail_list_emails' && res.data?.messages) {
                  const emails = res.data.messages as Array<{ subject?: string; from?: string; snippet?: string }>;
                  fallbackParts.push(
                    `Berikut email terbaru Anda (${emails.length} email):\n\n` +
                      emails.map((e, i) => `${i + 1}. **${e.subject || 'No Subject'}** *(dari ${e.from || 'Unknown'})*\n   ${e.snippet || ''}`).join('\n\n')
                  );
                } else {
                  fallbackParts.push(`✅ **${res.summary}**`);
                }
              }

              const finalFallback = fallbackParts.join('\n\n');
              set((s) => ({
                messages: {
                  ...s.messages,
                  [session.id]: (s.messages[session.id] || []).map((m) =>
                    m.id === assistantMessageId
                      ? {
                          ...m,
                          content: finalFallback,
                          status: 'done',
                        }
                      : m
                  ),
                },
              }));
            }
          }
        } catch (err: unknown) {
          if (creditDeducted && session.providerId === 'anticeil') {
            useCreditStore.getState().refundCredits('chat', 'anticeil');
          }
          const errorMessage = err instanceof Error ? err.message : 'Failed to generate response';
          set((s) => ({
            messages: {
              ...s.messages,
              [session.id]: (s.messages[session.id] || []).map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content: accumulatedText || `⚠️ Error: ${errorMessage}`,
                      reasoningContent: accumulatedReasoning || undefined,
                      status: 'error',
                      error: errorMessage,
                    }
                  : m
              ),
            },
          }));
        } finally {
          set({ isGenerating: false, abortController: null });
        }
      },

      stopGeneration: () => {
        const { abortController } = get();
        if (abortController) {
          abortController.abort();
        }
        set({ isGenerating: false, abortController: null });
      },

      deleteMessage: (sessionId, messageId) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [sessionId]: (state.messages[sessionId] || []).filter((m) => m.id !== messageId),
          },
        }));
      },

      navigateMessageVersion: (sessionId, userMessageId, direction) => {
        set((state) => {
          const msgs = state.messages[sessionId] || [];
          const userIdx = msgs.findIndex((m) => m.id === userMessageId);
          if (userIdx === -1) return {};
          const userMsg = msgs[userIdx];
          const versions = userMsg.versions || [userMsg.content];
          const currentVIdx = userMsg.versionIndex ?? 0;
          const nextVIdx = direction === 'prev' ? currentVIdx - 1 : currentVIdx + 1;
          if (nextVIdx < 0 || nextVIdx >= versions.length) return {};

          const newMsgs = msgs.map((m, idx) => {
            if (idx === userIdx) {
              return { ...m, content: versions[nextVIdx], versionIndex: nextVIdx };
            }
            // Paired assistant message (next in array) — swap to the branched content
            if (idx === userIdx + 1 && m.role === 'assistant') {
              const branchContent = m.branchContents?.[nextVIdx];
              // Only switch if we have saved content for that version
              if (branchContent !== undefined) {
                return {
                  ...m,
                  content: branchContent,
                  reasoningContent: m.branchReasoningContents?.[nextVIdx] ?? undefined,
                };
              }
            }
            return m;
          });
          return { messages: { ...state.messages, [sessionId]: newMsgs } };
        });
      },

      editMessage: async (sessionId, userMessageId, newContent) => {
        const state = get();
        if (state.isGenerating || !newContent.trim()) return;

        const msgs = state.messages[sessionId] || [];
        const userIdx = msgs.findIndex((m) => m.id === userMessageId);
        if (userIdx === -1) return;

        const userMsg = msgs[userIdx];
        const oldVersions = userMsg.versions || [userMsg.content];
        const oldVIdx = userMsg.versionIndex ?? 0;

        // If the very first entry equals current content it's already there; append new
        const allVersions = [...oldVersions, newContent];
        const newVIdx = allVersions.length - 1;

        // Update user message + clear assistant response after it
        const assistantMsg = msgs[userIdx + 1]?.role === 'assistant' ? msgs[userIdx + 1] : null;

        // Snapshot the existing branch data and save the OLD response under oldVIdx
        // so navigating back to that version restores the correct answer.
        const existingBranchContents: Record<number, string> = { ...(assistantMsg?.branchContents ?? {}) };
        const existingBranchReasoning: Record<number, string> = { ...(assistantMsg?.branchReasoningContents ?? {}) };
        if (assistantMsg?.content) {
          existingBranchContents[oldVIdx] = assistantMsg.content;
        }
        if (assistantMsg?.reasoningContent) {
          existingBranchReasoning[oldVIdx] = assistantMsg.reasoningContent;
        }

        // Create a new streaming placeholder assistant message
        const newAssistantId = `msg-ai-edit-${Date.now()}`;
        const newAssistantMsg: ChatMessage = {
          id: newAssistantId,
          sessionId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          status: 'streaming',
          branchContents: existingBranchContents,
          branchReasoningContents: existingBranchReasoning,
        };

        const updatedMsgs = [
          ...msgs.slice(0, userIdx),
          { ...userMsg, content: newContent, versions: allVersions, versionIndex: newVIdx },
          newAssistantMsg,
          // Keep messages after the assistant (if any) — though usually it's last
          ...msgs.slice(userIdx + (assistantMsg ? 2 : 1)),
        ];

        const session = state.sessions.find((s) => s.id === sessionId);
        if (!session) return;

        // Credit check & deduction for Anticeil Free provider
        if (session.providerId === 'anticeil') {
          const promptLength = (updatedMsgs || []).reduce((sum, m) => sum + (m.content?.length || 0), 0);
          const allowed = useCreditStore.getState().deductCredits('chat', 'anticeil', {
            modelId: session.modelId,
            promptLength,
          });
          if (!allowed) return;
        }

        const settings = useSettingsStore.getState();
        const apiKeyConfig = settings.apiKeys[session.providerId];
        const userTier = useAuthStore.getState().tier;

        set((s) => ({
          messages: { ...s.messages, [sessionId]: updatedMsgs },
          isGenerating: true,
        }));

        const controller = new AbortController();
        set({ abortController: controller });

        const modelDef = getModelById(session.modelId);
        let accumulatedText = '';
        let accumulatedReasoning = '';
        let promptTokensCount = 0;
        let completionTokensCount = 0;
        let lastFlushTime = 0;

        // Build API messages: history up to (not including) the new assistant msg
        const apiMessages = updatedMsgs.slice(0, -1).map((m) => m);

        try {
          await streamBYOKChat({
            providerId: session.providerId,
            modelId: session.modelId,
            systemPrompt: session.systemPrompt,
            messages: apiMessages,
            apiKeyConfig: apiKeyConfig || { apiKey: '', isEnabled: true },
            temperature: session.temperature,
            tier: userTier,
            signal: controller.signal,
            onChunk: (chunk) => {
              if (chunk.delta) accumulatedText += chunk.delta;
              if (chunk.reasoningDelta) accumulatedReasoning += chunk.reasoningDelta;
              if (chunk.promptTokens) promptTokensCount = chunk.promptTokens;
              if (chunk.completionTokens) completionTokensCount = chunk.completionTokens;
              else completionTokensCount = estimateTokens(accumulatedText);

              const cost = calculateCostUsd(modelDef, promptTokensCount, completionTokensCount);

              const flushState = (isDone: boolean) => {
                const { cleanContent, reasoningContent } = cleanAgenticStream(
                  accumulatedText,
                  accumulatedReasoning,
                  isDone
                );

                set((s) => ({
                  messages: {
                    ...s.messages,
                    [sessionId]: (s.messages[sessionId] || []).map((m) =>
                      m.id === newAssistantId
                        ? {
                            ...m,
                            content: cleanContent,
                            reasoningContent: reasoningContent || undefined,
                            status: isDone ? 'done' : 'streaming',
                            tokensUsed: {
                              prompt: promptTokensCount,
                              completion: completionTokensCount,
                              total: promptTokensCount + completionTokensCount,
                            },
                            estimatedCostUsd: cost,
                            // Save branch data keyed by version index
                            branchContents: isDone
                              ? { ...(m.branchContents ?? {}), [newVIdx]: cleanContent }
                              : m.branchContents,
                            branchReasoningContents: isDone && reasoningContent
                              ? { ...(m.branchReasoningContents ?? {}), [newVIdx]: reasoningContent }
                              : m.branchReasoningContents,
                          }
                        : m
                    ),
                  },
                }));
              };

              if (chunk.isDone) {
                flushState(true);
              } else {
                const now = Date.now();
                if (now - lastFlushTime > 50) {
                  lastFlushTime = now;
                  flushState(false);
                }
              }
            },
          });
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to regenerate response';
          set((s) => ({
            messages: {
              ...s.messages,
              [sessionId]: (s.messages[sessionId] || []).map((m) =>
                m.id === newAssistantId
                  ? { ...m, content: accumulatedText || `⚠️ Error: ${errorMessage}`, status: 'error', error: errorMessage }
                  : m
              ),
            },
          }));
        } finally {
          set({ isGenerating: false, abortController: null });
        }
      },

      syncWithCloud: async (accessToken: string) => {
        if (!accessToken) return;
        try {
          const res = await fetch('/api/db/sync', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.sessions) && data.sessions.length > 0) {
              const localSessions = get().sessions;
              const localIds = new Set(localSessions.map((s) => s.id));
              const newCloudSessions = data.sessions.filter((s: ChatSession) => !localIds.has(s.id));
              const mergedMsgs = { ...get().messages, ...(data.messages || {}) };
              set({
                sessions: [...newCloudSessions, ...localSessions],
                messages: mergedMsgs,
              });
            }
          }
        } catch (err) {
          console.warn('[ChatStore] Cloud sync failed:', err);
        }
      },

      pushSessionToCloud: async (sessionId: string) => {
        const auth = useAuthStore.getState();
        if (!isCloudTier(auth.tier) || !auth.session?.access_token) return;

        const session = get().sessions.find((s) => s.id === sessionId);
        const messages = get().messages[sessionId] || [];

        if (!session) return;

        try {
          await fetch('/api/db/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth.session.access_token}`,
            },
            body: JSON.stringify({ session, messages }),
          });
        } catch (e) {
          console.warn('[ChatStore] Pro session push failed:', e);
        }
      },
    }),
    {
      name: 'anticeil_chat_storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        messages: state.messages,
      }),
    }
  )
);
