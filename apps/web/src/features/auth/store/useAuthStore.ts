'use client';

import { create } from 'zustand';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { UserTier, isCloudTier } from '@anticeil/core';
import { createClient } from '../../../shared/utils/supabase/client';

export type AuthModalMode = 'login' | 'register' | 'verify_phone';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  tier: UserTier;
  isAuthModalOpen: boolean;
  authModalMode: AuthModalMode;
  needsPhoneVerification: boolean;

  // Actions
  initializeAuth: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithOAuth: (provider?: 'google') => Promise<{ error: AuthError | null }>;
  saveVerifiedPhone: (phone: string, telegramUserId?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
  setTier: (tier: UserTier) => Promise<void>;
  fetchUserTier: (accessToken?: string) => Promise<UserTier>;
  openAuthModal: (mode?: AuthModalMode) => void;
  setAuthModalOpen: (open: boolean) => void;
}

function getStoredTier(): UserTier {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('anticeil_user_tier');
      if (stored === 'pro' || stored === 'starter' || stored === 'enterprise' || stored === 'free') {
        return stored as UserTier;
      }
    } catch {}
  }
  return 'free';
}

function getStoredUser(): User | null {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('anticeil_cached_user');
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return null;
}

function getStoredSession(): Session | null {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('anticeil_cached_session');
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return null;
}

function saveCachedAuth(user: User | null, session: Session | null) {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem('anticeil_cached_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('anticeil_cached_user');
    }
    if (session) {
      localStorage.setItem('anticeil_cached_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('anticeil_cached_session');
    }
  } catch {}
}

function isUserPhoneVerified(user: User | null): boolean {
  if (!user) return true;
  return Boolean(user.user_metadata?.phone_verified || user.phone);
}

function isConnectorCallbackUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const search = window.location.search;
  return (
    search.includes('connector_connected') ||
    search.includes('connector_token') ||
    search.includes('connector_error')
  );
}

let authInitPromise: Promise<void> | null = null;
let isAuthListenerAttached = false;

const initialUser = getStoredUser();
const initialSession = getStoredSession();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialUser,
  session: initialSession,
  isLoading: initialUser ? false : true,
  error: null,
  tier: getStoredTier(),
  isAuthModalOpen: false,
  authModalMode: 'login',
  needsPhoneVerification: false,

  openAuthModal: (mode = 'login') =>
    set({
      isAuthModalOpen: true,
      authModalMode: mode,
    }),
  setAuthModalOpen: (open) => {
    set({ isAuthModalOpen: open });
  },

  fetchUserTier: async (token) => {
    try {
      const accessToken = token || get().session?.access_token;
      if (!accessToken) {
        const stored = getStoredTier();
        set({ tier: stored });
        return stored;
      }

      const res = await fetch('/api/user/tier', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const validTiers: UserTier[] = ['free', 'starter', 'pro', 'enterprise'];
        const tier: UserTier = validTiers.includes(data.tier) ? data.tier : 'free';
        set({ tier });
        if (typeof window !== 'undefined') {
          localStorage.setItem('anticeil_user_tier', tier);
        }
        return tier;
      }
    } catch {}
    return get().tier;
  },

  setTier: async (tier: UserTier) => {
    set({ tier });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('anticeil_user_tier', tier);
      } catch {}
    }

    const session = get().session;
    if (session?.access_token) {
      try {
        await fetch('/api/user/tier', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ tier }),
        });
      } catch (e) {
        console.warn('[AuthStore] Failed to update tier in Supabase:', e);
      }

      // If user upgraded to a cloud tier (starter, pro, enterprise), sync data
      if (isCloudTier(tier)) {
        import('../../storage/store/useStorageStore').then(({ useStorageStore }) => {
          useStorageStore.getState().syncFromSupabase(session.access_token, true);
        });
        import('@/features/chat/store/useProjectStore').then(({ useProjectStore }) => {
          useProjectStore.getState().fetchFolders(session.access_token);
        });
      }
    }
  },

  saveVerifiedPhone: async (phone: string, telegramUserId?: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.updateUser({
        data: {
          phone_verified: true,
          phone: phone,
          telegram_user_id: telegramUserId,
        },
      });

      if (error) {
        console.warn('Failed to update phone verification in Supabase:', error);
        return false;
      }

      if (data.user) {
        saveCachedAuth(data.user, get().session);
        set({
          user: data.user,
          needsPhoneVerification: false,
          isAuthModalOpen: false,
        });
      }
      return true;
    } catch (err) {
      console.warn('saveVerifiedPhone error:', err);
      return false;
    }
  },

  initializeAuth: async () => {
    if (authInitPromise) {
      return authInitPromise;
    }

    authInitPromise = (async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const user = session?.user || null;
        const isConnectorCB = isConnectorCallbackUrl();
        const needsVerification = user && !isConnectorCB ? !isUserPhoneVerified(user) : false;

        if (session && user) {
          saveCachedAuth(user, session);
          set({
            session,
            user,
            isLoading: false,
            needsPhoneVerification: needsVerification,
            isAuthModalOpen: false,
            authModalMode: 'login',
          });

          get().fetchUserTier(session.access_token);
          import('../../storage/store/useStorageStore').then(({ useStorageStore }) => {
            useStorageStore.getState().syncFromSupabase(session.access_token);
          });
          import('@/features/chat/store/useProjectStore').then(({ useProjectStore }) => {
            useProjectStore.getState().fetchFolders(session.access_token);
          });
        } else {
          // If no active session returned by Supabase, check if we had cached credentials or verify
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user) {
            const resolvedUser = userData.user;
            saveCachedAuth(resolvedUser, get().session);
            set({
              user: resolvedUser,
              isLoading: false,
              needsPhoneVerification: !isUserPhoneVerified(resolvedUser),
            });
          } else {
            // Truly unauthenticated (Guest mode)
            saveCachedAuth(null, null);
            set({
              session: null,
              user: null,
              isLoading: false,
              needsPhoneVerification: false,
            });
            import('@/features/chat/store/useProjectStore').then(({ useProjectStore }) => {
              useProjectStore.getState().loadLocalFolders();
            });
          }
        }

        // Attach live auth change listener only once
        if (!isAuthListenerAttached) {
          isAuthListenerAttached = true;
          supabase.auth.onAuthStateChange((_event, newSession) => {
            const newUser = newSession?.user || null;
            const isConnectorCB = isConnectorCallbackUrl();
            const newNeedsVerification = newUser && !isConnectorCB ? !isUserPhoneVerified(newUser) : false;

            if (_event === 'SIGNED_OUT') {
              saveCachedAuth(null, null);
              set({
                session: null,
                user: null,
                isLoading: false,
                needsPhoneVerification: false,
              });
              import('@/features/chat/store/useProjectStore').then(({ useProjectStore }) => {
                useProjectStore.getState().loadLocalFolders();
              });
              import('../../storage/store/useStorageStore').then(({ useStorageStore }) => {
                useStorageStore.getState().resetStorage();
              });
              return;
            }

            if (newSession && newUser) {
              saveCachedAuth(newUser, newSession);
              set({
                session: newSession,
                user: newUser,
                isLoading: false,
                needsPhoneVerification: newNeedsVerification,
                isAuthModalOpen: isConnectorCB ? false : get().isAuthModalOpen,
                authModalMode: get().authModalMode,
              });

              get().fetchUserTier(newSession.access_token);
              import('../../storage/store/useStorageStore').then(({ useStorageStore }) => {
                useStorageStore.getState().syncFromSupabase(newSession.access_token);
              });
              import('@/features/chat/store/useProjectStore').then(({ useProjectStore }) => {
                useProjectStore.getState().fetchFolders(newSession.access_token);
              });
            }
          });
        }
      } catch (err: unknown) {
        console.error('Auth initialization error:', err);
        set({ isLoading: false });
      } finally {
        authInitPromise = null;
      }
    })();

    return authInitPromise;
  },

  signInWithPassword: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { error };
      }

      const needsVerification = data.user ? !isUserPhoneVerified(data.user) : false;

      if (data.user && data.session) {
        saveCachedAuth(data.user, data.session);
      }

      set({
        session: data.session,
        user: data.user,
        isLoading: false,
        error: null,
        needsPhoneVerification: needsVerification,
        isAuthModalOpen: needsVerification,
        authModalMode: needsVerification ? 'verify_phone' : 'login',
      });

      if (data.session?.access_token) {
        get().fetchUserTier(data.session.access_token);
        import('../../storage/store/useStorageStore').then(({ useStorageStore }) => {
          useStorageStore.getState().syncFromSupabase(data.session.access_token);
        });
        import('@/features/chat/store/useProjectStore').then(({ useProjectStore }) => {
          useProjectStore.getState().fetchFolders(data.session.access_token);
        });
      }

      return { error: null };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Login failed';
      set({ error: errMsg, isLoading: false });
      return { error: { message: errMsg, name: 'AuthError', status: 500 } as AuthError };
    }
  },

  signUpWithPassword: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
          data: { tier: get().tier || 'free' },
        },
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { error };
      }

      if (data.session) {
        const needsVerification = data.user ? !isUserPhoneVerified(data.user) : false;

        if (data.user) {
          saveCachedAuth(data.user, data.session);
        }

        set({
          session: data.session,
          user: data.user,
          isLoading: false,
          error: null,
          needsPhoneVerification: needsVerification,
          isAuthModalOpen: needsVerification,
          authModalMode: needsVerification ? 'verify_phone' : 'login',
        });

        const token = data.session.access_token;
        if (token) {
          get().fetchUserTier(token);
          import('@/features/chat/store/useProjectStore').then(({ useProjectStore }) => {
            useProjectStore.getState().fetchFolders(token);
          });
        }
      } else {
        set({
          session: null,
          user: null,
          isLoading: false,
          error: null,
        });
      }

      return { error: null };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Registration failed';
      set({ error: errMsg, isLoading: false });
      return { error: { message: errMsg, name: 'AuthError', status: 500 } as AuthError };
    }
  },

  signInWithOAuth: async (provider = 'google') => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { error };
      }

      return { error: null };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Google sign-in failed';
      set({ error: errMsg, isLoading: false });
      return { error: { message: errMsg, name: 'AuthError', status: 500 } as AuthError };
    }
  },

  signOut: async () => {
    try {
      saveCachedAuth(null, null);
      const supabase = createClient();
      await supabase.auth.signOut();
      set({
        user: null,
        session: null,
        error: null,
        needsPhoneVerification: false,
        isAuthModalOpen: false,
      });
      import('@/features/chat/store/useProjectStore').then(({ useProjectStore }) => {
        useProjectStore.getState().loadLocalFolders();
      });
      import('../../storage/store/useStorageStore').then(({ useStorageStore }) => {
        useStorageStore.getState().resetStorage();
      });
    } catch (err: unknown) {
      console.error('Sign out error:', err);
    }
  },

  clearError: () => set({ error: null }),
}));
