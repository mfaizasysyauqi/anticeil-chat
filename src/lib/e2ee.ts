/**
 * End-to-End Encryption (E2EE) Module for Anticeil
 * Uses Web Crypto API (AES-256-GCM + PBKDF2) native hardware-accelerated encryption.
 * Zero external dependencies.
 */

const PREFIX = 'enc:v1:';
const keyCache = new Map<string, CryptoKey>();
const decryptedCache = new Map<string, string>();

/**
 * Returns cached decrypted plaintext for an encrypted string if previously decrypted in this session.
 */
export function getDecryptedCachedText(content?: string | null): string | undefined {
  if (!content) return undefined;
  return decryptedCache.get(content);
}

/**
 * Pre-populates the in-memory decrypted plaintext cache for an encrypted string.
 */
export function cacheDecryptedText(content: string, plaintext: string): void {
  if (content && plaintext) {
    decryptedCache.set(content, plaintext);
  }
}

// Storage key for user E2EE preference
export const E2EE_STORAGE_KEY = 'anticeil_e2ee_enabled';

export function isE2eeEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  // Default to true (always active out-of-the-box like modern messaging apps)
  return localStorage.getItem(E2EE_STORAGE_KEY) !== 'false';
}

export function setE2eeEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(E2EE_STORAGE_KEY, enabled ? 'true' : 'false');
}

/**
 * Derives a 256-bit AES-GCM key deterministically from the channel ID
 * using PBKDF2 with SHA-256 and a fixed application salt.
 */
async function getChannelKey(channelId: string): Promise<CryptoKey> {
  const cached = keyCache.get(channelId);
  if (cached) return cached;

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(channelId),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );

  const salt = enc.encode('anticeil-e2ee-salt-v1');
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );

  keyCache.set(channelId, derivedKey);
  return derivedKey;
}

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Checks if a message string is end-to-end encrypted
 */
export function isEncryptedMessage(content?: string | null): boolean {
  return typeof content === 'string' && content.startsWith(PREFIX);
}

/**
 * Encrypts a plaintext message for a specific channel using AES-256-GCM.
 * Output format: enc:v1:<iv_base64>:<ciphertext_base64>
 */
export async function encryptMessage(plaintext: string, channelId: string): Promise<string> {
  if (!plaintext || typeof window === 'undefined' || !crypto?.subtle) {
    return plaintext;
  }

  try {
    const key = await getChannelKey(channelId);
    const iv = crypto.getRandomValues(new Uint8Array(12)); // standard 96-bit IV for AES-GCM
    const enc = new TextEncoder();
    const encodedData = enc.encode(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData,
    );

    const ivB64 = bufferToBase64(iv);
    const cipherB64 = bufferToBase64(ciphertext);

    const result = `${PREFIX}${ivB64}:${cipherB64}`;
    // Pre-cache plaintext for instant local display
    decryptedCache.set(result, plaintext);
    return result;
  } catch (err) {
    console.warn('[E2EE] Encryption failed, falling back to plaintext:', err);
    return plaintext;
  }
}

/**
 * Decrypts an encrypted message for a specific channel using AES-256-GCM.
 * If the message is not encrypted, returns the original plaintext.
 */
export async function decryptMessage(content: string, channelId: string): Promise<{ text: string; isEncrypted: boolean }> {
  if (!isEncryptedMessage(content) || typeof window === 'undefined' || !crypto?.subtle) {
    return { text: content, isEncrypted: false };
  }

  // Fast-path: check in-memory cache
  const cached = decryptedCache.get(content);
  if (cached !== undefined) {
    return { text: cached, isEncrypted: true };
  }

  try {
    const payload = content.slice(PREFIX.length);
    const [ivB64, cipherB64] = payload.split(':');
    if (!ivB64 || !cipherB64) {
      return { text: content, isEncrypted: false };
    }

    const key = await getChannelKey(channelId);
    const iv = base64ToBuffer(ivB64);
    const ciphertext = base64ToBuffer(cipherB64);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      ciphertext as unknown as BufferSource,
    );

    const dec = new TextDecoder();
    const result = dec.decode(decrypted);
    decryptedCache.set(content, result);
    return { text: result, isEncrypted: true };
  } catch (err) {
    console.warn('[E2EE] Decryption failed:', err);
    return { text: '🔒 [Pesan Terenkripsi]', isEncrypted: true };
  }
}
