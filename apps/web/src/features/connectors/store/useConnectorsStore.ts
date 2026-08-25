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
  setAccessToken: (id: ConnectorId, token: string, accountEmail?: string, accountName?: string) => void;
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
    description: 'Search files, read Google Docs & Sheets, create notes, and update files.',
    icon: '📁',
    status: 'disconnected',
    isEnabled: false,
    isSandboxMode: false,
    scopes: ['https://www.googleapis.com/auth/drive'],
  },
  notion: {
    id: 'notion',
    name: 'Notion Workspace',
    description: 'Search pages, query databases, and create rich markdown notes.',
    icon: '📝',
    status: 'disconnected',
    isEnabled: false,
    isSandboxMode: false,
    scopes: ['notion:read_content', 'notion:insert_content'],
  },
  github: {
    id: 'github',
    name: 'GitHub Repositories',
    description: 'Search issues, read pull requests, inspect commits, and manage repos.',
    icon: '🐙',
    status: 'disconnected',
    isEnabled: false,
    isSandboxMode: false,
    scopes: ['repo', 'read:user'],
  },
  custom_webhook: {
    id: 'custom_webhook',
    name: 'Custom API / MCP',
    description: 'Connect any proprietary REST endpoint or MCP server.',
    icon: '⚡',
    status: 'disconnected',
    isEnabled: false,
    isSandboxMode: false,
    scopes: ['custom:execute'],
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

      setAccessToken: (id, token, accountEmail, accountName) => {
        set((state) => ({
          connectors: {
            ...state.connectors,
            [id]: {
              ...state.connectors[id],
              accessToken: token,
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
          // Auto-enable in active chat if connected
          activeConnectorIds: token
            ? Array.from(new Set([...state.activeConnectorIds, id]))
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

      setLastOAuthError: (error) => set({ lastOAuthError: error }),

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
          setAccessToken('gmail', token, email, name);
          setAccessToken('calendar', token, email, name);
          setAccessToken('google_drive', token, email, name);
        } else if (connected === 'github') {
          setAccessToken('github', token, email, name);
        } else if (connected === 'notion') {
          setAccessToken('notion', token, email, name);
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
    }
  )
);
