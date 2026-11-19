import type { AiSession, GroqConfig } from '../types';

const STORAGE_KEY_SESSIONS = 'anticeil_ai_sessions_v1';
const STORAGE_KEY_ACTIVE_SESSION = 'anticeil_active_ai_session_id';
const STORAGE_KEY_GROQ_KEY = 'anticeil_groq_api_key';
const STORAGE_KEY_GROQ_MODEL = 'anticeil_groq_model';

export const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';

export const GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', desc: 'Paling cerdas & akurat untuk instruksi kompleks' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', desc: 'Kecepatan inferensi super cepat (< 300ms)' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (32k context)', desc: 'Konteks besar untuk riwayat panjang' },
];

export function getStoredSessions(): AiSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filter out legacy dummy sessions with no messages
    const cleaned = parsed.filter(
      (s: AiSession) =>
        s &&
        s.id &&
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
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
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
  }

  return {
    apiKey: storedKey || envKey,
    model: storedModel,
    temperature: 0.2, // Low temperature for deterministic tool calling
  };
}

export function saveStoredGroqConfig(apiKey: string, model: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_GROQ_KEY, apiKey.trim());
  localStorage.setItem(STORAGE_KEY_GROQ_MODEL, model.trim());
}

export function createNewSession(initialTitle = 'Percakapan Baru'): AiSession {
  const newSession: AiSession = {
    id: `ai_sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: initialTitle,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  };

  const sessions = getStoredSessions();
  saveStoredSessions([newSession, ...sessions]);
  setActiveSessionId(newSession.id);
  return newSession;
}
