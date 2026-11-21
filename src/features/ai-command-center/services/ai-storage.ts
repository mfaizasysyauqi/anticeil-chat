import type { AiSession, GroqConfig } from '../types';

const STORAGE_KEY_SESSIONS = 'anticeil_ai_sessions_v1';
const STORAGE_KEY_ACTIVE_SESSION = 'anticeil_active_ai_session_id';
const STORAGE_KEY_GROQ_KEY = 'anticeil_groq_api_key';
const STORAGE_KEY_GROQ_MODEL = 'anticeil_groq_model';

export const DEFAULT_GROQ_API_KEY = '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';
export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';

export const GROQ_MODELS = [
  { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B (Groq)', desc: 'Paling cerdas, akurat, dan mendukung pemanggilan fungsi kompleks' },
  { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B (Groq)', desc: 'Kecepatan inferensi super cepat (< 200ms)' },
  { id: 'qwen/qwen3.8-27b', name: 'Qwen 3.8 27B', desc: 'Model multilingual tangguh untuk instruksi percakapan' },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (BYOK)', desc: 'Gunakan kunci Groq pribadi Anda yang memiliki akses Llama' },
];

export function getStoredSessions(): AiSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filter out legacy dummy sessions with no messages and ensure sanitized schema
    const cleaned = parsed
      .filter((s: any) => s && s.id)
      .map((s: any): AiSession => ({
        id: String(s.id),
        title: typeof s.title === 'string' && s.title.trim() ? s.title.trim() : 'Percakapan Baru',
        createdAt: typeof s.createdAt === 'string' ? s.createdAt : new Date().toISOString(),
        updatedAt: typeof s.updatedAt === 'string' ? s.updatedAt : new Date().toISOString(),
        messages: Array.isArray(s.messages) ? s.messages : [],
        isPinned: Boolean(s.isPinned),
      }))
      .filter(
        (s: AiSession) =>
          !(s.title === 'Pusat Perintah Utama' && (!s.messages || s.messages.length === 0)),
      );
    return cleaned;
  } catch (err) {
    console.warn('Failed to parse AI sessions from localStorage', err);
    return [];
  }
}

export function saveStoredSessions(sessions: AiSession[]): void {
  if (typeof window === 'undefined') return;
  try {
    const safeSessions = (sessions || [])
      .filter((s: any) => s && s.id)
      .map((s: any) => ({
        id: String(s.id),
        title: typeof s.title === 'string' && s.title.trim() ? s.title.trim() : 'Percakapan Baru',
        createdAt: typeof s.createdAt === 'string' ? s.createdAt : new Date().toISOString(),
        updatedAt: typeof s.updatedAt === 'string' ? s.updatedAt : new Date().toISOString(),
        messages: Array.isArray(s.messages) ? s.messages : [],
        isPinned: Boolean(s.isPinned),
      }));
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(safeSessions));
  } catch (err) {
    console.warn('Failed to save AI sessions to localStorage', err);
  }
}

export function getActiveSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY_ACTIVE_SESSION);
}

export function setActiveSessionId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_ACTIVE_SESSION, id);
}

export function getStoredGroqConfig(): GroqConfig {
  const envKey = (import.meta as any).env?.VITE_GROQ_API_KEY || '';
  let storedKey = '';
  let storedModel = DEFAULT_GROQ_MODEL;

  if (typeof window !== 'undefined') {
    storedKey = localStorage.getItem(STORAGE_KEY_GROQ_KEY) || '';
    storedModel = localStorage.getItem(STORAGE_KEY_GROQ_MODEL) || DEFAULT_GROQ_MODEL;

    // Auto-migrate legacy/inaccessible model name if using default system key
    if (!storedKey && storedModel === 'llama-3.3-70b-versatile') {
      storedModel = DEFAULT_GROQ_MODEL;
      localStorage.setItem(STORAGE_KEY_GROQ_MODEL, DEFAULT_GROQ_MODEL);
    }
  }

  return {
    apiKey: storedKey || envKey || DEFAULT_GROQ_API_KEY,
    model: storedModel,
    temperature: 0.2, // Low temperature for deterministic tool calling
  };
}

export function saveStoredGroqConfig(apiKey: string, model: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_GROQ_KEY, apiKey.trim());
  localStorage.setItem(STORAGE_KEY_GROQ_MODEL, model.trim());
}

export function createNewSession(initialTitle?: string): AiSession {
  const safeTitle =
    typeof initialTitle === 'string' && initialTitle.trim() ? initialTitle.trim() : 'Percakapan Baru';
  const newSession: AiSession = {
    id: `ai_sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: safeTitle,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  };

  const sessions = getStoredSessions();
  saveStoredSessions([newSession, ...sessions]);
  setActiveSessionId(newSession.id);
  return newSession;
}
