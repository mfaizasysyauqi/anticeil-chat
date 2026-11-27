/**
 * External service endpoints and API base URLs
 * Centralized configuration to prevent hardcoded URL scattered across components.
 */
export const ENDPOINTS = {
  GROQ_API_BASE: 'https://api.groq.com/openai/v1',
  GROQ_CHAT_COMPLETIONS: 'https://api.groq.com/openai/v1/chat/completions',
  GROQ_MODELS: 'https://api.groq.com/openai/v1/models',
  DICEBEAR_AVATAR_BASE: 'https://api.dicebear.com/7.x',
} as const;
