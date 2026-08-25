'use client';

import { create } from 'zustand';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { createClient } from '../../../shared/utils/supabase/client';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  initializeAuth: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  error: null,

  initializeAuth: async () => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      set({
        session,
        user: session?.user || null,
        isLoading: false,
      });

      // Sync real storage usage from Supabase on initial load
      if (session?.access_token) {
        import('../../storage/store/useStorageStore').then(({ useStorageStore }) => {
          useStorageStore.getState().syncFromSupabase(session.access_token);
        });
        import('@/features/chat/store/useProjectStore').then(({ useProjectStore }) => {
          useProjectStore.getState().fetchFolders(session.access_token);
        });
      }

      // Subscribe to live auth state changes
      supabase.auth.onAuthStateChange((_event, newSession) => {
        set({
          session: newSession,
          user: newSession?.user || null,
          isLoading: false,
        });

        // Re-sync storage whenever user logs in
        if (_event === 'SIGNED_IN' && newSession?.access_token) {
          import('../../storage/store/useStorageStore').then(({ useStorageStore }) => {
            useStorageStore.getState().syncFromSupabase(newSession.access_token);
          });
          import('@/features/chat/store/useProjectStore').then(({ useProjectStore }) => {
            useProjectStore.getState().fetchFolders(newSession.access_token);
          });
        }

        // Clear project folders on sign-out
        if (_event === 'SIGNED_OUT') {
          import('@/features/chat/store/useProjectStore').then(({ useProjectStore }) => {
            useProjectStore.getState().reset();
          });
        }
      });
    } catch (err: unknown) {
      console.error('Auth initialization error:', err);
      set({ isLoading: false });
    }
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

      set({
        session: data.session,
        user: data.user,
        isLoading: false,
        error: null,
      });

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
        },
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { error };
      }

      if (data.session) {
        set({
          session: data.session,
          user: data.user,
          isLoading: false,
          error: null,
        });
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

  signOut: async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      set({ user: null, session: null, error: null });
    } catch (err: unknown) {
      console.error('Sign out error:', err);
    }
  },

  clearError: () => set({ error: null }),
}));
