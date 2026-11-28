import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { parseJwt } from '@/lib/utils';
import { colonyApi } from '@/features/colonies/api/colonies-api';

export const isDevLoginEnabled =
  import.meta.env.VITE_ENABLE_DEV_LOGIN === 'true' ||
  import.meta.env.DEV ||
  (typeof window !== 'undefined' &&
    (window.location.hostname.startsWith('dev.') ||
      window.location.hostname.startsWith('dev-') ||
      window.location.hostname.includes('localhost') ||
      window.location.hostname.includes('127.0.0.1')));

export const MOCK_DEV_USERS = [
  {
    id: 'usr_fathur',
    email: 'fathur@anticeil.com',
    firstName: 'Fathur',
    lastName: '',
    name: 'Fathur',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&q=80',
    role: 'DEVELOPER',
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
  // Auto-open login dialog immediately on arrival if unauthenticated, while keeping it closeable with 'X'
  const [isAuthRequiredOpen, setIsAuthRequiredOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlCode = params.get('code');
    const existingToken = urlToken || localStorage.getItem('token') || localStorage.getItem('ap_token');
    const existingUser = localStorage.getItem('anticeil_current_user');
    return !existingToken && !existingUser && !urlCode;
  });

  const [authFeatureInfo, setAuthFeatureInfo] = useState<{ title?: string; desc?: string }>(() => ({
    title: t('Login ke Anticeil'),
    desc: t('Pilih akun atau pindai kode QR untuk melanjutkan ke percakapan, colony, dan aktivitas.'),
  }));

  useEffect(() => {
    const handleOpenAuth = (e?: Event) => {
      const detail = (e as CustomEvent)?.detail;
      setAuthFeatureInfo({
        title: detail?.title || t('Login ke Anticeil'),
        desc: detail?.desc || t('Masuk dengan Google OAuth atau Single Sign-On (SSO) perusahaan untuk mengakses seluruh fitur.'),
      });
      setIsAuthRequiredOpen(true);
    };
    window.addEventListener('anticeil_open_auth_dialog', handleOpenAuth);
    return () => {
      window.removeEventListener('anticeil_open_auth_dialog', handleOpenAuth);
    };
  }, [t]);

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

  // Automatically close the login dialog whenever the user becomes authenticated
  useEffect(() => {
    if (currentUser) {
      setIsAuthRequiredOpen(false);
    }
  }, [currentUser]);

  const handleLogout = () => {
    // Preserve only harmless client device preferences
    const preserved: Record<string, string> = {};
    const PRESERVED_KEYS = [
      'theme',
      'vite-ui-theme',
      'anticeil_theme',
      'locale',
      'anticeil_language',
      'i18nextLng',
      'anticeil_desktop_sidebar_collapsed',
      'anticeil_rail_mode',
      'anticeil_time_format',
      'anticeil_voice_input_device',
      'anticeil_voice_output_device',
    ];

    try {
      for (const key of PRESERVED_KEYS) {
        const val = localStorage.getItem(key);
        if (val !== null) {
          preserved[key] = val;
        }
      }
    } catch {}

    // 1. FULL CLEAR of localStorage
    try {
      localStorage.clear();
      // Restore client device preferences
      for (const [key, val] of Object.entries(preserved)) {
        localStorage.setItem(key, val);
      }
    } catch {}

    // 2. FULL CLEAR of sessionStorage
    try {
      sessionStorage.clear();
    } catch {}

    // 3. Clear auth cookies
    try {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.anticeil.com`;
      }
    } catch {}

    // 4. Clear CacheStorage
    try {
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        }).catch(() => {});
      }
    } catch {}

    // 5. In-memory state reset
    setCurrentUser(null);
    onResetAppState?.();

    // 6. Notify storage listeners
    try {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('anticeil_logout'));
    } catch {}

    toast.success(t('Berhasil keluar dari akun.'));

    // 7. Hard redirect to clean public landing URL
    setTimeout(() => {
      window.location.href = `${window.location.origin}/ai`;
    }, 150);
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

    // Trigger JIT Domain Capture Auto-Join for dev testing
    if (selected.email && selected.email.includes('@')) {
      colonyApi.checkAndAutoJoinSSO(selected.email, selected).then((joined) => {
        if (joined.length > 0) {
          toast.success(
            t('Domain Auto-Capture: Otomatis tergabung ke Colony: {{colonies}} 👑', {
              colonies: joined.map((c) => c.name).join(', '),
            })
          );
        }
      }).catch(() => {});
    }
  };

  const handleGuestLogin = () => {
    setAuthFeatureInfo({
      title: t('Login Diperlukan'),
      desc: t('Masuk dengan akun Google, Microsoft, atau Okta untuk mengakses fitur Anticeil.'),
    });
    setIsAuthRequiredOpen(true);
  };

  const handleSsoLogin = async (corporateEmail: string, displayName?: string, idpProvider?: string) => {
    const cleanEmail = (corporateEmail || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      toast.error(t('Format email perusahaan tidak valid. Contoh: user@perusahaan.com'));
      return;
    }

    const username = cleanEmail.split('@')[0];
    const domain = cleanEmail.split('@')[1];
    const defaultName = displayName || (username.charAt(0).toUpperCase() + username.slice(1));

    const ssoUser = {
      id: `usr_sso_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      email: cleanEmail,
      name: defaultName,
      firstName: defaultName,
      lastName: `(${domain})`,
      username,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(defaultName)}`,
      imageUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(defaultName)}`,
      role: 'EMPLOYEE',
      isSsoUser: true,
      corporateDomain: domain,
      ssoProvider: idpProvider || 'Corporate SSO',
    };

    const ssoToken = `sso_jwt_${ssoUser.id}`;
    localStorage.setItem('token', ssoToken);
    localStorage.setItem('ap_token', ssoToken);
    localStorage.setItem('anticeil_current_user', JSON.stringify(ssoUser));
    setCurrentUser(ssoUser);
    setIsAuthRequiredOpen(false);
    window.dispatchEvent(new Event('storage'));

    // Trigger JIT Domain Capture Auto-Join
    try {
      const joinedColonies = await colonyApi.checkAndAutoJoinSSO(cleanEmail, ssoUser);
      if (joinedColonies.length > 0) {
        const names = joinedColonies.map((c) => c.name).join(', ');
        toast.success(
          t('Login SSO Berhasil! Anda otomatis tergabung ke Colony: {{colonies}} 👑', {
            colonies: names,
          }),
          { duration: 5000 }
        );
      } else {
        toast.success(t('Masuk berhasil sebagai {{email}} via SSO Perusahaan 🏢', { email: cleanEmail }));
      }
    } catch {
      toast.success(t('Masuk berhasil sebagai {{email}} via SSO Perusahaan 🏢', { email: cleanEmail }));
    }

    return ssoUser;
  };

  const handleGoogleSignIn = async () => {
    try {
      toast.loading(t('Menghubungkan ke Google OAuth...'), { id: 'google-oauth' });
      let loginUrlStr = '';
      try {
        const res: any = await api.get('/v1/authn/federated/login?providerName=google');
        if (res && res.loginUrl) {
          loginUrlStr = res.loginUrl;
        }
      } catch (e) {
        console.warn('Backend federated login check returned error, using OAuth client fallback:', e);
      }

      // Fallback: If server is 502 or down or missing config, generate direct Google OAuth authorization URL
      if (!loginUrlStr) {
        const googleClientId =
          (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) ||
          '672254808015-pqt0dkasvp8s0tfadtbde5esuv6kalvi.apps.googleusercontent.com';
        const redirectUri = `${window.location.origin}/redirect`;
        const googleUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        googleUrl.searchParams.set('client_id', googleClientId);
        googleUrl.searchParams.set('redirect_uri', redirectUri);
        googleUrl.searchParams.set('response_type', 'code');
        googleUrl.searchParams.set('scope', 'openid email profile');
        loginUrlStr = googleUrl.toString();
      }

      toast.success(t('Membuka Google Sign-In...'), { id: 'google-oauth' });
      const state = {
        providerName: 'google',
        from: window.location.href,
        activepiecesLogin: 'true',
        login: 'true',
      };
      const finalUrl = new URL(loginUrlStr);
      finalUrl.searchParams.set('state', JSON.stringify(state));
      finalUrl.searchParams.set('prompt', 'select_account');

      window.location.href = finalUrl.toString();
      return;
    } catch (err: any) {
      console.error('Google OAuth initiation failed:', err);
      toast.error(t('Google OAuth belum aktif di server atau gagal terhubung.'), { id: 'google-oauth' });
    }
  };

  const handleMicrosoftSignIn = async () => {
    try {
      toast.loading(t('Menghubungkan ke Microsoft 365...'), { id: 'ms-oauth' });
      let loginUrlStr = '';
      try {
        const res: any = await api.get('/v1/authn/federated/login?providerName=microsoft');
        if (res && res.loginUrl) {
          loginUrlStr = res.loginUrl;
        }
      } catch (e) {
        console.warn('Backend federated login check returned error, using direct Microsoft OAuth fallback:', e);
      }

      // Fallback: If server is 502 or down or missing config, generate direct Microsoft OAuth authorization URL
      if (!loginUrlStr) {
        const msClientId =
          (import.meta.env.VITE_MICROSOFT_CLIENT_ID as string) ||
          'a2531019-87ff-46b9-84fd-129b08c5c1a2';
        const redirectUri = `${window.location.origin}/redirect`;
        const msUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
        msUrl.searchParams.set('client_id', msClientId);
        msUrl.searchParams.set('redirect_uri', redirectUri);
        msUrl.searchParams.set('response_type', 'code');
        msUrl.searchParams.set('response_mode', 'query');
        msUrl.searchParams.set('scope', 'openid email profile offline_access User.Read');
        loginUrlStr = msUrl.toString();
      }

      toast.success(t('Membuka Microsoft Sign-In...'), { id: 'ms-oauth' });
      const state = {
        providerName: 'microsoft',
        from: window.location.href,
        activepiecesLogin: 'true',
        login: 'true',
      };
      const finalUrl = new URL(loginUrlStr);
      finalUrl.searchParams.set('state', JSON.stringify(state));
      finalUrl.searchParams.set('prompt', 'select_account');
      window.location.href = finalUrl.toString();
      return;
    } catch (err: any) {
      console.error('Microsoft OAuth initiation failed:', err);
      toast.error(t('Microsoft OAuth belum aktif di server atau gagal terhubung.'), { id: 'ms-oauth' });
    }
  };

  const handleOktaSignIn = async () => {
    try {
      toast.loading(t('Menghubungkan ke Okta / Auth0...'), { id: 'okta-oauth' });
      let loginUrlStr = '';
      try {
        const res: any = await api.get('/v1/authn/federated/login?providerName=okta');
        if (res && res.loginUrl) {
          loginUrlStr = res.loginUrl;
        }
      } catch (e) {
        console.warn('Backend federated login check returned error, using direct Okta OAuth fallback:', e);
      }

      if (!loginUrlStr) {
        const oktaClientId = (import.meta.env.VITE_OKTA_CLIENT_ID as string) || '63rIvt3mhC9iym9CAGZsHQG4p9P03B5u';
        const oktaDomain = (import.meta.env.VITE_OKTA_DOMAIN as string) || 'dev-g1k4gi85svoq1dhj.us.auth0.com';
        const cleanDomain = oktaDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
        const redirectUri = `${window.location.origin}/redirect`;
        const oktaUrl = new URL(`https://${cleanDomain}/authorize`);
        oktaUrl.searchParams.set('client_id', oktaClientId);
        oktaUrl.searchParams.set('redirect_uri', redirectUri);
        oktaUrl.searchParams.set('response_type', 'code');
        oktaUrl.searchParams.set('scope', 'openid email profile');
        oktaUrl.searchParams.set('prompt', 'login');
        loginUrlStr = oktaUrl.toString();
      }

      toast.success(t('Membuka Okta Sign-In...'), { id: 'okta-oauth' });
      const state = {
        providerName: 'okta',
        from: window.location.href,
        activepiecesLogin: 'true',
        login: 'true',
      };
      const finalUrl = new URL(loginUrlStr);
      finalUrl.searchParams.set('state', JSON.stringify(state));
      window.location.href = finalUrl.toString();
      return;
    } catch (err: any) {
      console.error('Okta OAuth initiation failed:', err);
      toast.error(t('Okta OAuth belum aktif di server atau gagal terhubung.'), { id: 'okta-oauth' });
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

    const guestParam = params.get('guest');
    const guestNameParam = params.get('guest_name');
    const inviteParam = params.get('invite');
    const activityParam = params.get('activity');

    // Guest mode disabled: require real authentication via Google / Microsoft / Okta
    if (guestParam || guestNameParam) {
      setAuthFeatureInfo({
        title: t('Login Diperlukan'),
        desc: t('Mode Tamu dinonaktifkan untuk keamanan. Silakan masuk menggunakan akun Google, Microsoft, atau Okta.'),
      });
      setIsAuthRequiredOpen(true);
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('guest');
      cleanUrl.searchParams.delete('guest_name');
      window.history.replaceState({}, document.title, cleanUrl.toString());
      return;
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

    const storedToken = localStorage.getItem('token') || localStorage.getItem('ap_token');
    if (!storedToken && (inviteParam || activityParam)) {
      setAuthFeatureInfo({
        title: activityParam ? t('Gabung Aktivitas & Panggilan Anticeil') : t('Gabung Colony & Komunitas'),
        desc: t('Masuk dengan akun Google, Microsoft, atau Okta untuk langsung bergabung ke aktivitas bersama kawan.'),
      });
      setIsAuthRequiredOpen(true);
    }

    const fetchLiveUser = async (customToken?: string) => {
      const token = customToken || localStorage.getItem('token') || localStorage.getItem('ap_token');
      if (!token) {
        setCurrentUser(null);
        return;
      }
      if (token.startsWith('guest_jwt_')) {
        // Disallow persistent guest session: force real login
        localStorage.removeItem('token');
        localStorage.removeItem('ap_token');
        localStorage.removeItem('anticeil_current_user');
        setCurrentUser(null);
        setIsAuthRequiredOpen(true);
        return;
      }
      if (token.startsWith('mock_jwt_')) {
        const stored = localStorage.getItem('anticeil_current_user');
        if (stored) {
          try {
            setCurrentUser(JSON.parse(stored));
          } catch {}
        }
        return;
      }
      const payload = parseJwt(token);
      if (!payload || !payload.id) {
        return;
      }
      try {
        const [user, profile]: any = await Promise.all([
          api.get(`/v1/users/${payload.id}`).catch(() => null),
          api.get('/v1/users/me/profile').catch(() => null),
        ]);
        if (user && (user.id || user.email)) {
          const rawImg = profile?.avatarUrl || profile?.avatar || user.imageUrl || user.avatar || payload.imageUrl;
          const validImg =
            rawImg &&
            !rawImg.includes('unsplash.com') &&
            !rawImg.includes('53994a69daeb') &&
            !rawImg.includes('logo.png') &&
            !rawImg.includes('logo.svg') &&
            !rawImg.includes('brand-assets')
              ? rawImg
              : null;
          const formatted = {
            ...payload,
            ...user,
            name:
              profile?.displayName ||
              `${user.firstName || payload.firstName || ''} ${user.lastName || payload.lastName || ''}`.trim() ||
              user.username ||
              user.email,
            avatar: validImg,
            imageUrl: validImg,
          };
          setCurrentUser(formatted);
          localStorage.setItem('anticeil_current_user', JSON.stringify(formatted));

          // Check Domain Auto-Join once per session
          if (formatted.email && formatted.email.includes('@')) {
            const sessionKey = `anticeil_domain_captured_${formatted.email}`;
            if (!sessionStorage.getItem(sessionKey)) {
              sessionStorage.setItem(sessionKey, 'true');
              colonyApi.checkAndAutoJoinSSO(formatted.email, formatted).then((joined) => {
                if (joined.length > 0) {
                  toast.success(
                    t('Domain Auto-Capture: Anda tergabung ke Colony: {{colonies}} 👑', {
                      colonies: joined.map((c) => c.name).join(', '),
                    })
                  );
                }
              }).catch(() => {});
            }
          }
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
          let providerName = 'google';
          const stateParam = params.get('state');
          if (stateParam) {
            try {
              const parsed = JSON.parse(stateParam);
              if (parsed.providerName) {
                providerName = parsed.providerName;
              }
            } catch {}
          }
          const claimRes: any = await api.post('/v1/authn/federated/claim', {
            providerName,
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

            // Auto-Join Enterprise Colony via Domain Capture
            const finalEmail = formatted.email || claimRes.email;
            if (finalEmail && finalEmail.includes('@')) {
              try {
                const joined = await colonyApi.checkAndAutoJoinSSO(finalEmail, formatted);
                if (joined.length > 0) {
                  toast.success(
                    t('Domain Auto-Capture: Anda otomatis tergabung ke Colony: {{colonies}} 👑', {
                      colonies: joined.map((c) => c.name).join(', '),
                    }),
                    { duration: 5000 }
                  );
                }
              } catch {}
            }

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
    handleMicrosoftSignIn,
    handleOktaSignIn,
    handleDevMockLogin,
    handleGuestLogin,
    handleSsoLogin,
    isDevLoginEnabled,
    mockDevUsers: MOCK_DEV_USERS,
  };
}

