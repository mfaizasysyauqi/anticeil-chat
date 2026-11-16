import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { parseJwt } from '@/lib/utils';

export const isDevLoginEnabled =
  import.meta.env.VITE_ENABLE_DEV_LOGIN === 'true' ||
  import.meta.env.DEV ||
  (typeof window !== 'undefined' &&
    (window.location.hostname.startsWith('dev.') ||
      window.location.hostname.includes('localhost') ||
      window.location.hostname.includes('127.0.0.1')));

export const MOCK_DEV_USERS = [
  {
    id: 'usr_dev_agent_1',
    email: 'agent-1@anticeil.dev',
    firstName: 'AI Agent',
    lastName: 'Alpha',
    name: 'AI Agent Alpha 🤖',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=agent1',
    imageUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=agent1',
    role: 'TESTER',
  },
  {
    id: 'usr_dev_agent_2',
    email: 'agent-2@anticeil.dev',
    firstName: 'AI Agent',
    lastName: 'Beta',
    name: 'AI Agent Beta ⚡',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=agent2',
    imageUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=agent2',
    role: 'TESTER',
  },
  {
    id: 'usr_dev_admin',
    email: 'admin@anticeil.dev',
    firstName: 'Dev',
    lastName: 'Admin',
    name: 'Dev Admin 🛡️',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
    imageUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
    role: 'ADMIN',
  },
];

interface UseAuthSessionOptions {
  t: (text: string, params?: Record<string, any>) => string;
  onResetAppState?: () => void;
}

export function useAuthSession({ t, onResetAppState }: UseAuthSessionOptions) {
  const [isAuthRequiredOpen, setIsAuthRequiredOpen] = useState(false);
  const [authFeatureInfo, setAuthFeatureInfo] = useState<{ title?: string; desc?: string }>({});

  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const urlToken = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') : null;
      if (urlToken) {
        localStorage.setItem('token', urlToken);
        localStorage.setItem('ap_token', urlToken);
      }
      const token = urlToken || localStorage.getItem('token') || localStorage.getItem('ap_token');
      if (!token) return null;
      const stored = localStorage.getItem('anticeil_current_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.id || parsed.email)) {
          return parsed;
        }
      }
      const jwt = parseJwt(token);
      if (jwt && (jwt.id || jwt.email)) {
        return {
          ...jwt,
          name: `${jwt.firstName || ''} ${jwt.lastName || ''}`.trim() || jwt.username || jwt.email,
          avatar: jwt.imageUrl || null,
          imageUrl: jwt.imageUrl || null,
        };
      }
    } catch {}
    return null;
  });

  const requireAuth = (action: () => void, title?: string, desc?: string) => {
    if (!currentUser) {
      setAuthFeatureInfo({ title, desc });
      setIsAuthRequiredOpen(true);
      return;
    }
    action();
  };

  const handleLogout = () => {
    // Clear all user session, colony, channels, and hubs caches from localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('anticeil_colony_') ||
          key.startsWith('anticeil_community_') ||
          key.startsWith('anticeil_current_') ||
          key.startsWith('anticeil_threads_') ||
          key.startsWith('anticeil_notif_') ||
          key === 'token' ||
          key === 'ap_token' ||
          key === 'projectId' ||
          key === 'current_project' ||
          key === 'current_platform')
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    sessionStorage.clear();
    setCurrentUser(null);
    onResetAppState?.();
    window.dispatchEvent(new Event('storage'));
    toast.success(t('Berhasil keluar dari akun.'));
    setTimeout(() => {
      window.location.href = window.location.origin + window.location.pathname;
    }, 200);
  };

  const handleDevMockLogin = (userIndex = 0) => {
    if (!isDevLoginEnabled) return;
    const selected = MOCK_DEV_USERS[userIndex] || MOCK_DEV_USERS[0];
    const mockToken = `dev_jwt_${selected.id}_${Date.now()}`;
    localStorage.setItem('token', mockToken);
    localStorage.setItem('ap_token', mockToken);
    localStorage.setItem('anticeil_current_user', JSON.stringify(selected));
    setCurrentUser(selected);
    setIsAuthRequiredOpen(false);
    window.dispatchEvent(new Event('storage'));
    toast.success(`[DEV MODE] Masuk sebagai ${selected.name}`);
  };

  const handleGoogleSignIn = async () => {
    try {
      toast.loading(t('Menghubungkan ke Google OAuth...'), { id: 'google-oauth' });
      const res: any = await api.get('/v1/authn/federated/login?providerName=google');
      if (res && res.loginUrl) {
        toast.success(t('Membuka Google Sign-In...'), { id: 'google-oauth' });
        const state = {
          providerName: 'google',
          from: window.location.href,
          activepiecesLogin: 'true',
          login: 'true',
        };
        const loginUrl = new URL(res.loginUrl);
        loginUrl.searchParams.set('state', JSON.stringify(state));
        loginUrl.searchParams.set('prompt', 'select_account');

        window.location.href = loginUrl.toString();
        return;
      }
      throw new Error('No loginUrl returned');
    } catch (err: any) {
      console.error('Google OAuth initiation failed:', err);
      toast.error(t('Google OAuth belum aktif di server atau gagal terhubung.'), { id: 'google-oauth' });
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Auto login query param support for automated testing: ?dev_login=1 or ?dev_login=agent_1
    if (isDevLoginEnabled) {
      const devParam = params.get('dev_login');
      if (devParam) {
        let idx = 0;
        if (devParam === '2' || devParam === 'agent_2' || devParam === 'beta') idx = 1;
        if (devParam === 'admin' || devParam === '3') idx = 2;
        handleDevMockLogin(idx);
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('dev_login');
        window.history.replaceState({}, document.title, cleanUrl.toString());
        return;
      }
    }

    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl);
      localStorage.setItem('ap_token', tokenFromUrl);
      window.dispatchEvent(new Event('storage'));
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('token');
      window.history.replaceState({}, document.title, cleanUrl.toString());
      toast.success(t('Berhasil masuk!'));
    }

    const fetchLiveUser = async (customToken?: string) => {
      const token = customToken || localStorage.getItem('token') || localStorage.getItem('ap_token');
      if (!token) {
        setCurrentUser(null);
        return;
      }
      const payload = parseJwt(token);
      if (!payload || !payload.id) {
        return;
      }
      try {
        const user = await api.get(`/v1/users/${payload.id}`);
        if (user && (user.id || user.email)) {
          const rawImg = user.imageUrl || user.avatar || payload.imageUrl;
          const validImg =
            rawImg && !rawImg.includes('unsplash.com') && !rawImg.includes('53994a69daeb')
              ? rawImg
              : null;
          const formatted = {
            ...payload,
            ...user,
            name:
              `${user.firstName || payload.firstName || ''} ${user.lastName || payload.lastName || ''}`.trim() ||
              user.username ||
              user.email,
            avatar: validImg,
            imageUrl: validImg,
          };
          setCurrentUser(formatted);
          localStorage.setItem('anticeil_current_user', JSON.stringify(formatted));
        }
      } catch (err) {
        // Fallback to token payload
      }
    };

    const codeFromUrl = params.get('code');
    if (codeFromUrl) {
      const claimCode = async () => {
        try {
          toast.loading(t('Memverifikasi autentikasi...'), { id: 'oauth-claim' });
          const claimRes: any = await api.post('/v1/authn/federated/claim', {
            providerName: 'google',
            code: codeFromUrl,
          });
          if (claimRes && claimRes.token) {
            localStorage.setItem('token', claimRes.token);
            localStorage.setItem('ap_token', claimRes.token);
            if (claimRes.projectId) {
              localStorage.setItem('projectId', claimRes.projectId);
            }
            window.dispatchEvent(new Event('storage'));

            const jwt = parseJwt(claimRes.token) || {};
            const rawImg = claimRes.imageUrl || claimRes.avatar || jwt.imageUrl;
            const validImg =
              rawImg && !rawImg.includes('unsplash.com') && !rawImg.includes('53994a69daeb')
                ? rawImg
                : null;
            const formatted = {
              ...jwt,
              ...claimRes,
              name:
                `${claimRes.firstName || jwt.firstName || ''} ${claimRes.lastName || jwt.lastName || ''}`.trim() ||
                claimRes.username ||
                claimRes.email,
              avatar: validImg,
              imageUrl: validImg,
            };
            setCurrentUser(formatted);
            localStorage.setItem('anticeil_current_user', JSON.stringify(formatted));

            // Immediately fetch live user profile & avatar with new token
            await fetchLiveUser(claimRes.token);

            toast.success(t('Berhasil masuk!'), { id: 'oauth-claim' });

            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete('code');
            cleanUrl.searchParams.delete('state');
            window.history.replaceState({}, document.title, cleanUrl.toString());
          }
        } catch (err) {
          console.error('Failed to claim auth code:', err);
          toast.error(t('Gagal memverifikasi sesi login.'), { id: 'oauth-claim' });
        }
      };
      claimCode();
    } else {
      fetchLiveUser();
    }
  }, []);

  return {
    currentUser,
    setCurrentUser,
    isAuthRequiredOpen,
    setIsAuthRequiredOpen,
    authFeatureInfo,
    setAuthFeatureInfo,
    requireAuth,
    handleLogout,
    handleGoogleSignIn,
    handleDevMockLogin,
    isDevLoginEnabled,
    mockDevUsers: MOCK_DEV_USERS,
  };
}

