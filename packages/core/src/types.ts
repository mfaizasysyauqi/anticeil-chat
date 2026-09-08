export type LLMProviderId =
  | 'anticeil'
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'deepseek'
  | 'groq'
  | 'openrouter'
  | 'together'
  | 'fireworks'
  | 'mistral'
  | 'xai'
  | 'perplexity'
  | 'cohere'
  | 'ollama'
  | 'elevenlabs'
  | 'azure'
  | 'deepgram'
  | 'assemblyai'
  | 'fishaudio'
  | 'suno'
  | 'udio'
  | 'stability'
  | 'fal'
  | 'recraft'
  | 'luma'
  | 'kling'
  | 'runway'
  | 'pika'
  | 'tavily'
  | 'firecrawl'
  | 'brave'
  | 'omniroute'
  | 'custom';

export type Role = 'user' | 'assistant' | 'system';

export interface ModelCapabilities {
  text: boolean;
  vision: boolean;
  reasoning: boolean;
  imageGen: boolean;
  docAnalysis: boolean;
  fastLpu?: boolean;
  audio?: boolean;
  tts?: boolean;
  webSearch?: boolean;
  video?: boolean;
}

export interface LLMModel {
  id: string;
  name: string;
  providerId: LLMProviderId;
  contextWindow: number;
  description: string;
  inputCostPer1M: number;  // in USD
  outputCostPer1M: number; // in USD
  supportsStreaming: boolean;
  supportsVision?: boolean;
  supportsReasoning?: boolean;
  isPopular?: boolean;
  capabilities?: Partial<ModelCapabilities>;
}

export interface ProviderDefinition {
  id: LLMProviderId;
  name: string;
  icon: string;
  defaultBaseUrl: string;
  docUrl: string;
  models: LLMModel[];
  requiresApiKey: boolean;
  category?: 'chat' | 'audio' | 'image' | 'video' | 'search' | 'custom';
  description?: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string; // extracted text content or base64 data
  isImage?: boolean;
}

export interface AgentStep {
  id: string;
  phase:
    | 'plan'
    | 'design'
    | 'code'
    | 'test'
    | 'deploy'
    | 'done'
    | 'reasoning'
    | 'thinking'
    | 'tool_call'
    | 'tool'
    | 'web_search'
    | 'read'
    | 'edit'
    | 'mcp'
    | 'connector'
    | 'synthesis'
    | 'result';
  title: string;
  content?: string;
  timestamp: number;
  badge?: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: Role;
  content: string;
  reasoningContent?: string;
  timestamp: number;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  estimatedCostUsd?: number;
  status: 'idle' | 'streaming' | 'done' | 'error';
  error?: string;
  attachments?: FileAttachment[];
  imageUrl?: string; // Generated image URL for text-to-image output
  videoUrl?: string; // Generated video URL for text-to-video output
  toolResults?: import('./domain/connectors/types').ToolCallResult[];
  agentSteps?: AgentStep[];
  // Edit-branch versioning: stores all past versions of this user message
  versions?: string[];
  versionIndex?: number;
  // For assistant messages: maps versionIndex -> content (parallel branches)
  branchContents?: Record<number, string>;
  branchReasoningContents?: Record<number, string>;
}

export interface ChatSession {
  id: string;
  userId?: string;
  title: string;
  providerId: LLMProviderId;
  modelId: string;
  systemPrompt: string;
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  temperature: number;
  maxTokens?: number;
  personaId?: string;
  projectId?: string;
}

export interface ProviderApiKeyConfig {
  apiKey: string;
  baseUrl?: string;
  isEnabled: boolean;
  organizationId?: string;
}

export type ApiKeysState = Record<LLMProviderId, ProviderApiKeyConfig>;

export interface Persona {
  id: string;
  name: string;
  icon: string;
  description: string;
  systemPrompt: string;
  defaultTemperature: number;
  suggestedStarters: string[];
  category: 'general' | 'programming' | 'writing' | 'productivity' | 'creative';
}

export interface ChatStreamChunk {
  delta: string;
  reasoningDelta?: string;
  isDone: boolean;
  promptTokens?: number;
  completionTokens?: number;
}

export type UserTier = 'free' | 'starter' | 'pro' | 'enterprise';

export interface ProjectFolderData {
  id: string;
  name: string;
  createdAt: number;
  sessionIds: string[];
}

export interface AnticeilDatabaseBackup {
  version: string;
  exportedAt: string;
  source: 'local' | 'cloud';
  tier?: UserTier;
  userId?: string;
  data: {
    sessions: ChatSession[];
    messages: Record<string, ChatMessage[]>;
    folders: ProjectFolderData[];
    personas?: Persona[];
    connectors?: Record<string, any>;
    workspace?: {
      projects?: any[];
      imageCollections?: any[];
      workflowCategories?: any[];
      documentCategories?: any[];
    };
    settings?: {
      apiKeys?: Partial<ApiKeysState>;
      theme?: 'system' | 'dark' | 'light';
      language?: string;
    };
  };
}

