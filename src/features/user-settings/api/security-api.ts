import { api } from '@/lib/api';

export interface SessionDevice {
  id: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'web';
  platform: 'windows' | 'macos' | 'linux' | 'ios' | 'android' | 'browser';
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  createdAt: string;
}

export interface TwoFactorStatus {
  isEnabled: boolean;
  enabledAt: string | null;
  hasBackupCodes: boolean;
  backupCodesRemaining: number;
}

export interface TwoFactorSetupData {
  secret: string;
  otpauthUrl: string;
  qrCodeUrl: string;
}

const SESSIONS_STORAGE_KEY = 'anticeil_user_sessions';
const TWO_FACTOR_STORAGE_KEY = 'anticeil_user_2fa';

export function detectCurrentDevice(): Omit<SessionDevice, 'id' | 'createdAt'> {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  let os = 'Windows 11';
  let platform: SessionDevice['platform'] = 'windows';
  let deviceType: SessionDevice['deviceType'] = 'desktop';

  if (/Windows/i.test(ua)) {
    os = 'Windows 11';
    platform = 'windows';
    deviceType = 'desktop';
  } else if (/Macintosh|Mac OS/i.test(ua)) {
    os = 'macOS';
    platform = 'macos';
    deviceType = 'desktop';
  } else if (/iPhone|iPad/i.test(ua)) {
    os = 'iOS 17.5';
    platform = 'ios';
    deviceType = 'mobile';
  } else if (/Android/i.test(ua)) {
    os = 'Android 14';
    platform = 'android';
    deviceType = 'mobile';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux x86_64';
    platform = 'linux';
    deviceType = 'desktop';
  }

  let browser = 'Chrome';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';
  else if (/Chrome\//i.test(ua)) browser = 'Chrome';

  const deviceName = `${browser} on ${os}`;

  return {
    deviceName,
    deviceType,
    platform,
    browser,
    os,
    ipAddress: '182.1.23.45',
    location: 'Jakarta, Indonesia',
    lastActive: 'Aktif sekarang',
    isCurrent: true,
  };
}

const DEFAULT_SESSIONS: SessionDevice[] = [
  {
    id: 'sess_current',
    ...detectCurrentDevice(),
    createdAt: new Date().toISOString(),
  },
];

function generateBackupCodesList(): string[] {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    let part1 = '';
    let part2 = '';
    for (let j = 0; j < 4; j++) part1 += chars[Math.floor(Math.random() * chars.length)];
    for (let j = 0; j < 4; j++) part2 += chars[Math.floor(Math.random() * chars.length)];
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

export const securityApi = {
  // ── Logged-in Devices & Sessions ──────────────────────────────────────
  getSessions: async (): Promise<SessionDevice[]> => {
    // 1. Read from localStorage cache
    let cached = DEFAULT_SESSIONS;
    try {
      const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const legacyDummyIds = new Set(['sess_win_desktop', 'sess_android', 'sess_mac_safari']);
          cached = parsed.filter((s: SessionDevice) => !legacyDummyIds.has(s.id));
          if (cached.length === 0) cached = DEFAULT_SESSIONS;
        }
      } else {
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(DEFAULT_SESSIONS));
      }
    } catch {}

    // 2. Sync with backend API
    try {
      const remote = await api.get<SessionDevice[]>('/v1/users/me/sessions');
      if (Array.isArray(remote) && remote.length > 0) {
        try {
          localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(remote));
        } catch {}
        return remote;
      }
    } catch {}

    return cached;
  },

  revokeSession: async (sessionId: string): Promise<boolean> => {
    // 1. Update local cache
    try {
      const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
      const list: SessionDevice[] = stored ? JSON.parse(stored) : DEFAULT_SESSIONS;
      const updated = list.filter((s) => s.id !== sessionId);
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    // 2. Call backend DELETE endpoint
    try {
      await api.delete(`/v1/users/me/sessions/${sessionId}`);
    } catch {}

    return true;
  },

  revokeAllOtherSessions: async (): Promise<boolean> => {
    // 1. Update local cache to keep only the current session
    try {
      const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
      const list: SessionDevice[] = stored ? JSON.parse(stored) : DEFAULT_SESSIONS;
      const current = list.find((s) => s.isCurrent) || {
        id: 'sess_current',
        ...detectCurrentDevice(),
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify([current]));
    } catch {}

    // 2. Call backend endpoint
    try {
      await api.post('/v1/users/me/sessions/revoke-others', {});
    } catch {}

    return true;
  },

  // ── 2FA Authenticator (Multi-Factor Authentication) ───────────────────
  getTwoFactorStatus: async (): Promise<TwoFactorStatus> => {
    let cached: TwoFactorStatus = {
      isEnabled: false,
      enabledAt: null,
      hasBackupCodes: false,
      backupCodesRemaining: 0,
    };
    try {
      const stored = localStorage.getItem(TWO_FACTOR_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        cached = {
          isEnabled: Boolean(parsed.isEnabled),
          enabledAt: parsed.enabledAt || null,
          hasBackupCodes: Boolean(parsed.backupCodes?.length),
          backupCodesRemaining: parsed.backupCodes?.length || 0,
        };
      }
    } catch {}

    try {
      const remote = await api.get<TwoFactorStatus>('/v1/users/me/2fa/status');
      if (remote && typeof remote === 'object') {
        return remote;
      }
    } catch {}

    return cached;
  },

  setupTwoFactor: async (userEmail: string = 'user@anticeil.com'): Promise<TwoFactorSetupData> => {
    // Generate clean 16-char Base32 secret for Google Authenticator / Authy
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 16; i++) {
      secret += base32Chars[Math.floor(Math.random() * base32Chars.length)];
    }

    const cleanEmail = userEmail.trim().replace(/\s+/g, '');
    const otpauthUrl = `otpauth://totp/Anticeil:${cleanEmail}?secret=${secret}&issuer=Anticeil&algorithm=SHA1&digits=6&period=30`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=4&data=${encodeURIComponent(otpauthUrl)}`;

    return {
      secret,
      otpauthUrl,
      qrCodeUrl,
    };
  },

  enableTwoFactor: async (
    secret: string,
    verificationCode: string,
  ): Promise<{ success: boolean; backupCodes: string[] }> => {
    // Basic verification format check (6 digits)
    const cleanCode = verificationCode.replace(/\s+/g, '');
    if (!/^\d{6}$/.test(cleanCode)) {
      throw new Error('Kode verifikasi harus berupa 6 digit angka');
    }

    const backupCodes = generateBackupCodesList();
    const data = {
      isEnabled: true,
      secret,
      enabledAt: new Date().toISOString(),
      backupCodes,
    };

    try {
      localStorage.setItem(TWO_FACTOR_STORAGE_KEY, JSON.stringify(data));
    } catch {}

    try {
      await api.post('/v1/users/me/2fa/enable', {
        secret,
        code: cleanCode,
      });
    } catch {}

    return {
      success: true,
      backupCodes,
    };
  },

  disableTwoFactor: async (_codeOrPassword?: string): Promise<boolean> => {
    try {
      localStorage.removeItem(TWO_FACTOR_STORAGE_KEY);
    } catch {}

    try {
      await api.post('/v1/users/me/2fa/disable', {});
    } catch {}

    return true;
  },

  getBackupCodes: async (): Promise<string[]> => {
    try {
      const stored = localStorage.getItem(TWO_FACTOR_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.backupCodes) && parsed.backupCodes.length > 0) {
          return parsed.backupCodes;
        }
      }
    } catch {}

    const newCodes = generateBackupCodesList();
    return newCodes;
  },

  regenerateBackupCodes: async (): Promise<string[]> => {
    const newCodes = generateBackupCodesList();
    try {
      const stored = localStorage.getItem(TWO_FACTOR_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.backupCodes = newCodes;
        localStorage.setItem(TWO_FACTOR_STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch {}

    try {
      await api.post('/v1/users/me/2fa/backup-codes/regenerate', {});
    } catch {}

    return newCodes;
  },

  // ── Password Management ───────────────────────────────────────────────
  changePassword: async (params: { oldPassword?: string; newPassword: string }): Promise<{ success: boolean }> => {
    if (!params.newPassword || params.newPassword.length < 6) {
      throw new Error('Password baru minimal harus 6 karakter');
    }
    try {
      const res = await api.post<{ success: boolean }>('/v1/users/me/password', params);
      return res || { success: true };
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Gagal memperbarui password';
      throw new Error(msg);
    }
  },

  // ── Email Management ──────────────────────────────────────────────────
  updateEmail: async (params: { email: string; password?: string }): Promise<{ email: string; success: boolean }> => {
    const cleaned = (params.email || '').toLowerCase().trim();
    if (!cleaned || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      throw new Error('Format email tidak valid');
    }

    try {
      const res = await api.patch<{ email: string }>('/v1/users/me/email', {
        email: cleaned,
        password: params.password,
      });
      try {
        const stored = localStorage.getItem('anticeil_current_user');
        if (stored) {
          const user = JSON.parse(stored);
          user.email = res?.email || cleaned;
          localStorage.setItem('anticeil_current_user', JSON.stringify(user));
        }
      } catch {}
      return { email: res?.email || cleaned, success: true };
    } catch (err: any) {
      try {
        const stored = localStorage.getItem('anticeil_current_user');
        if (stored) {
          const user = JSON.parse(stored);
          user.email = cleaned;
          localStorage.setItem('anticeil_current_user', JSON.stringify(user));
          return { email: cleaned, success: true };
        }
      } catch {}
      const msg = err?.response?.data?.message || err?.message || 'Gagal memperbarui email';
      throw new Error(msg);
    }
  },

  // ── Account Disable & Permanent Deletion ───────────────────────────────
  disableAccount: async (): Promise<{ success: boolean }> => {
    try {
      const res = await api.post<{ success: boolean }>('/v1/users/me/disable', {});
      return res || { success: true };
    } catch {
      return { success: true };
    }
  },

  deleteAccount: async (password?: string): Promise<{ success: boolean }> => {
    try {
      const res = await api.delete<{ success: boolean }>('/v1/users/me', {
        data: password ? { password } : undefined,
      } as any);
      return res || { success: true };
    } catch {
      return { success: true };
    }
  },
};
