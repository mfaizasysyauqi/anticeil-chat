export const MAX_MESSAGE_CHARS_DEFAULT = 2000;
export const MAX_MESSAGE_CHARS_NECTAR = 4000;
export const MAX_MESSAGE_CHARS = MAX_MESSAGE_CHARS_DEFAULT;

export function getMaxMessageChars(planId?: string): number {
  return planId === 'nectar_boost' ? MAX_MESSAGE_CHARS_NECTAR : MAX_MESSAGE_CHARS_DEFAULT;
}

export function getCurrentMaxMessageChars(): number {
  try {
    const raw = localStorage.getItem('anticeil_user_subscription');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.status === 'active' && parsed.planId === 'nectar_boost') {
        return MAX_MESSAGE_CHARS_NECTAR;
      }
    }
  } catch {}
  return MAX_MESSAGE_CHARS_DEFAULT;
}

// Rate limit settings:
// - Maximum 5 messages in 5 seconds window (anti-spam)
// - Minimum 300ms cooldown between consecutive messages
const MESSAGE_RATE_LIMIT_WINDOW_MS = 5000;
const MESSAGE_RATE_LIMIT_MAX = 5;
const MIN_COOLDOWN_MS = 300;

const messageTimestamps: number[] = [];
let lastMessageTime = 0;

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Checks if the user is currently allowed to send a text message.
 */
export function checkTextRateLimit(): RateLimitResult {
  const now = Date.now();

  // Rapid double-send guard
  if (now - lastMessageTime < MIN_COOLDOWN_MS) {
    return {
      allowed: false,
      reason: 'Harap tunggu sesaat sebelum mengirim pesan berikutnya.',
    };
  }

  // Sliding window check: remove timestamps older than window
  while (messageTimestamps.length > 0 && now - messageTimestamps[0] > MESSAGE_RATE_LIMIT_WINDOW_MS) {
    messageTimestamps.shift();
  }

  if (messageTimestamps.length >= MESSAGE_RATE_LIMIT_MAX) {
    const oldest = messageTimestamps[0];
    const waitSeconds = Math.max(1, Math.ceil((MESSAGE_RATE_LIMIT_WINDOW_MS - (now - oldest)) / 1000));
    return {
      allowed: false,
      reason: `Terlalu cepat mengirim pesan! Tunggu ${waitSeconds} detik (maksimal 5 pesan per 5 detik).`,
    };
  }

  return { allowed: true };
}

/**
 * Records a sent message timestamp to track rate limits.
 */
export function recordTextMessage(): void {
  const now = Date.now();
  lastMessageTime = now;
  messageTimestamps.push(now);
}

/**
 * Validates message length against max character limits.
 */
export function validateTextMessage(text: string): { valid: boolean; error?: string } {
  if (text.length > MAX_MESSAGE_CHARS) {
    return {
      valid: false,
      error: `Pesan terlalu panjang (${text.length.toLocaleString('id-ID')} karakter). Maksimal ${MAX_MESSAGE_CHARS.toLocaleString('id-ID')} karakter.`,
    };
  }
  return { valid: true };
}
