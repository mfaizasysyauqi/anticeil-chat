export type LLMProviderId =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'deepseek'
  | 'groq'
  | 'ollama'
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
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string; // extracted text content or base64 data
  isImage?: boolean;
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
  // Edit-branch versioning: stores all past versions of this user message
  versions?: string[];
  versionIndex?: number;
  // For assistant messages: maps versionIndex -> content (parallel branches)
  branchContents?: Record<number, string>;
  branchReasoningContents?: Record<number, string>;
}

export interface ChatSession {
  id: string;
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
