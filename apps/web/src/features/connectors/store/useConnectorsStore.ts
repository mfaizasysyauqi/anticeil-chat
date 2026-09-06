'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ConnectorConfig,
  ConnectorId,
  ToolCallResult,
  GmailConnectorClient,
  CalendarConnectorClient,
  GoogleDriveConnectorClient,
  NotionConnectorClient,
  GitHubConnectorClient,
} from '@anticeil/core';

export interface ConnectorsState {
  connectors: Record<ConnectorId, ConnectorConfig>;
  activeConnectorIds: ConnectorId[];
  toolExecutionHistory: ToolCallResult[];
  lastOAuthError: string | null;

  // Actions
  toggleActiveConnector: (id: ConnectorId) => void;
  enableAllConnectors: (enabled: boolean) => void;
  updateConnector: (id: ConnectorId, updates: Partial<ConnectorConfig>) => void;
  setAccessToken: (
    id: ConnectorId,
    token: string,
    accountEmail?: string,
    accountName?: string,
    refreshToken?: string
  ) => void;
  disconnectConnector: (id: ConnectorId) => void;
  disconnectAllGoogle: () => void;
  setLastOAuthError: (error: string | null) => void;
  recordToolExecution: (result: ToolCallResult) => void;
  clearToolHistory: () => void;

  // Handle OAuth callback params from URL (called once on /chat mount)
  handleOAuthCallback: (searchParams: URLSearchParams) => void;

  // Clients
  getGmailClient: () => GmailConnectorClient;
  getCalendarClient: () => CalendarConnectorClient;
  getDriveClient: () => GoogleDriveConnectorClient;
  getNotionClient: () => NotionConnectorClient;
  getGitHubClient: () => GitHubConnectorClient;
}

const DEFAULT_CONNECTORS: Record<ConnectorId, ConnectorConfig> = {
  anticeil_image: {
    id: 'anticeil_image',
    name: 'Anticeil Image',
    description: 'Generate high-quality AI images, illustrations, and doc graphics directly from chat or documents.',
    icon: '🖼️',
    status: 'connected',
    isEnabled: true,
    isSandboxMode: false,
    selectedModelId: 'imagen-3.0-generate-002',
    scopes: ['image:generate', 'image:edit'],
  },
  anticeil_video: {
    id: 'anticeil_video',
    name: 'Anticeil Video',
    description: 'Generate AI video clips, motion animations, and video sequences.',
    icon: '🎬',
    status: 'connected',
    isEnabled: true,
    isSandboxMode: false,
    selectedModelId: 'luma-dream-machine',
    scopes: ['video:generate', 'video:render'],
  },
  anticeil_audio: {
    id: 'anticeil_audio',
    name: 'Anticeil Audio',
    description: 'Generate AI voice speech, narration, background music, and sound effects.',
    icon: '🎵',
    status: 'connected',
    isEnabled: true,
    isSandboxMode: false,
    selectedModelId: 'eleven_multilingual_v2',
    scopes: ['audio:speech', 'audio:music', 'audio:sfx'],
  },
  gmail: {
    id: 'gmail',
    name: 'Gmail',
    description: 'Search, read threads, draft, send, reply, and manage emails.',
    icon: '📧',
    status: 'disconnected',
    isEnabled: false,
    isSandboxMode: false,
    scopes: ['https://mail.google.com/'],
  },
  calendar: {
    id: 'calendar',
    name: 'Google Calendar',
    description: 'Schedule, search, update, reschedule, and delete meetings and events.',
    icon: '📅',
    status: 'disconnected',
    isEnabled: false,
    isSandboxMode: false,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  },
  google_drive: {
    id: 'google_drive',
    name: 'Google Drive',
    description: 'Create, search, read, update, and manage documents, sheets, and files.',
    icon: '📁',
    status: 'disconnected',
    isEnabled: false,
    isSandboxMode: false,
    scopes: ['https://www.googleapis.com/auth/drive'],
  },
  notion: {
    id: 'notion',
    name: 'Notion',
    description: 'Search, read pages, create documents, and query databases in your Notion workspace.',
    icon: '📝',
    status: 'disconnected',
    isEnabled: false,
    isSandboxMode: false,
    scopes: ['notion:all'],
  },
  github: {
    id: 'github',
    name: 'GitHub',
    description: 'List repositories, search issues, create pull requests, and manage codebase tasks.',
    icon: '🐙',
    status: 'disconnected',
    isEnabled: false,
    isSandboxMode: false,
    scopes: ['repo', 'read:user', 'user:email'],
  },
  custom_webhook: {
    id: 'custom_webhook',
    name: 'Custom Webhook',
    description: 'Trigger custom REST API actions and automated pipelines.',
    icon: '⚡',
    status: 'disconnected',
    isEnabled: false,
    isSandboxMode: false,
    scopes: ['custom:execute'],
  },
  smithery: {
    id: 'smithery',
    name: 'Smithery MCP Registry',
    description: 'Access thousands of MCP tool servers from the Smithery registry using your own API key.',
    icon: '🔌',
    status: 'disconnected',
    isEnabled: false,
    isSandboxMode: false,
    scopes: ['mcp:read', 'mcp:execute'],
  },
};

export const useConnectorsStore = create<ConnectorsState>()(
  persist(
    (set, get) => ({
      connectors: DEFAULT_CONNECTORS,
      activeConnectorIds: [],
      toolExecutionHistory: [],
      lastOAuthError: null,

      toggleActiveConnector: (id) => {
        set((state) => {
          const exists = state.activeConnectorIds.includes(id);
          const next = exists
            ? state.activeConnectorIds.filter((item) => item !== id)
            : [...state.activeConnectorIds, id];
          return { activeConnectorIds: next };
        });
      },

      enableAllConnectors: (enabled) => {
        set({
          activeConnectorIds: enabled
            ? (['gmail', 'calendar', 'google_drive'] as ConnectorId[])
            : [],
        });
      },

      updateConnector: (id, updates) => {
        set((state) => ({
          connectors: {
            ...state.connectors,
            [id]: { ...state.connectors[id], ...updates, lastSyncedAt: Date.now() },
          },
        }));
      },

      setAccessToken: (id, token, accountEmail, accountName, refreshToken) => {
        set((state) => ({
          connectors: {
            ...state.connectors,
            [id]: {
              ...state.connectors[id],
              accessToken: token,
              refreshToken: refreshToken ?? state.connectors[id].refreshToken,
              status: token ? 'connected' : 'disconnected',
              isEnabled: !!token,
              isSandboxMode: false,
              account: accountEmail
                ? {
                    email: accountEmail,
                    name: accountName ?? accountEmail.split('@')[0],
                  }
                : token
                ? state.connectors[id].account ?? { name: id.toUpperCase(), email: 'Connected' }
                : undefined,
              lastSyncedAt: Date.now(),
            },
          },
          // Do NOT auto-pin connector into activeConnectorIds on connect.
          // Only remove if disconnected.
          activeConnectorIds: token
            ? state.activeConnectorIds
            : state.activeConnectorIds.filter((item) => item !== id),
        }));
      },

      disconnectConnector: (id) => {
        set((state) => ({
          connectors: {
            ...state.connectors,
            [id]: {
              ...state.connectors[id],
              accessToken: undefined,
              refreshToken: undefined,
              status: 'disconnected',
              isEnabled: false,
              isSandboxMode: false,
              account: undefined,
            },
          },
          activeConnectorIds: state.activeConnectorIds.filter((item) => item !== id),
        }));
      },

      disconnectAllGoogle: () => {
        set((state) => {
          const googleIds: ConnectorId[] = ['gmail', 'calendar', 'google_drive'];
          const updatedConnectors = { ...state.connectors };
          googleIds.forEach((gid) => {
            if (updatedConnectors[gid]) {
              updatedConnectors[gid] = {
                ...updatedConnectors[gid],
                accessToken: undefined,
                refreshToken: undefined,
                status: 'disconnected',
                isEnabled: false,
                isSandboxMode: false,
                account: undefined,
              };
            }
          });
          return {
            connectors: updatedConnectors,
            activeConnectorIds: state.activeConnectorIds.filter((item) => !googleIds.includes(item)),
          };
        });
      },

      setLastOAuthError: (error) => {
        set({ lastOAuthError: error });
      },

      /**
       * Called once from the /chat page on mount to pick up OAuth callback
       * query params and persist the token into the store.
       *
       * Expected params (set by /api/connectors/oauth/callback/[provider]):
       *   connector_connected  — 'google' | 'github' | 'notion'
       *   connector_token      — the OAuth access token
       *   connector_email      — account email (optional)
       *   connector_name       — account display name (optional)
       */
      handleOAuthCallback: (searchParams) => {
        const connected = searchParams.get('connector_connected');
        const token = searchParams.get('connector_token');
        const refreshToken = searchParams.get('connector_refresh_token') ?? undefined;
        const errorProvider = searchParams.get('connector_error');
        const reason = searchParams.get('reason');

        // Surface OAuth errors in the store so the UI can show them
        if (errorProvider) {
          let msg = `Gagal menghubungkan ${errorProvider}: ${reason ?? 'error tidak diketahui'}`;
          if (errorProvider === 'notion' && (reason === 'missing_client_id' || reason === 'missing_env')) {
            msg = 'Notion OAuth Client ID belum diatur di .env. Anda dapat menghubungkan Notion langsung menggunakan Integration Secret Token di bawah ini.';
          } else if (reason === 'no_provider_token') {
            msg = `Supabase tidak mengembalikan provider access token untuk ${errorProvider}. Coba hubungkan ulang.`;
          }
          set({ lastOAuthError: msg });
          return;
        }

        if (!connected || !token) return;

        // Clear any previous error on successful connect
        set({ lastOAuthError: null });

        const email = searchParams.get('connector_email') ?? undefined;
        const name = searchParams.get('connector_name') ?? undefined;

        const { setAccessToken } = get();

        if (connected === 'google') {
          // A single Google OAuth token covers Gmail + Calendar + Drive
          setAccessToken('gmail', token, email, name, refreshToken);
          setAccessToken('calendar', token, email, name, refreshToken);
          setAccessToken('google_drive', token, email, name, refreshToken);
        } else if (connected === 'github') {
          setAccessToken('github', token, email, name, refreshToken);
        } else if (connected === 'notion') {
          setAccessToken('notion', token, email, name, refreshToken);
        }
      },

      recordToolExecution: (result) => {
        set((state) => ({
          toolExecutionHistory: [result, ...state.toolExecutionHistory].slice(0, 50),
        }));
      },

      clearToolHistory: () => {
        set({ toolExecutionHistory: [] });
      },

      // ── Client factories ─────────────────────────────────────────────────

      getGmailClient: () => {
        const cfg = get().connectors.gmail;
        return new GmailConnectorClient({ accessToken: cfg.accessToken });
      },

      getCalendarClient: () => {
        const cfg = get().connectors.calendar;
        return new CalendarConnectorClient({ accessToken: cfg.accessToken });
      },

      getDriveClient: () => {
        const cfg = get().connectors.google_drive;
        return new GoogleDriveConnectorClient({ accessToken: cfg.accessToken });
      },

      getNotionClient: () => {
        const cfg = get().connectors.notion;
        return new NotionConnectorClient({ accessToken: cfg.accessToken });
      },

      getGitHubClient: () => {
        const cfg = get().connectors.github;
        return new GitHubConnectorClient({ accessToken: cfg.accessToken });
      },
    }),
    {
      name: 'anticeil_connectors_store',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Clean up any active connectors that are no longer authenticated
        if (state.activeConnectorIds && state.activeConnectorIds.length > 0) {
          state.activeConnectorIds = state.activeConnectorIds.filter(
            (id) => !!state.connectors[id]?.accessToken
          );
        }
      },
    }
  )
);
