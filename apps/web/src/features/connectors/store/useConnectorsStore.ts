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
} from '@chatbyok/core';

export interface ConnectorsState {
  connectors: Record<ConnectorId, ConnectorConfig>;
  activeConnectorIds: ConnectorId[]; // Enabled for the current chat session
  toolExecutionHistory: ToolCallResult[];

  // Actions
  toggleActiveConnector: (id: ConnectorId) => void;
  enableAllConnectors: (enabled: boolean) => void;
  updateConnector: (id: ConnectorId, updates: Partial<ConnectorConfig>) => void;
  setAccessToken: (id: ConnectorId, token: string, accountEmail?: string) => void;
  toggleSandboxMode: (id: ConnectorId, isSandbox: boolean) => void;
  disconnectConnector: (id: ConnectorId) => void;
  recordToolExecution: (result: ToolCallResult) => void;
  clearToolHistory: () => void;

  // Clients
  getGmailClient: () => GmailConnectorClient;
  getCalendarClient: () => CalendarConnectorClient;
  getDriveClient: () => GoogleDriveConnectorClient;
}

const DEFAULT_CONNECTORS: Record<ConnectorId, ConnectorConfig> = {
  gmail: {
    id: 'gmail',
    name: 'Gmail',
    description: 'Search, read threads, draft, send, reply, and manage emails.',
    icon: '📧',
    status: 'connected', // Sandbox mode active by default for instant zero-config testing
    isEnabled: true,
    isSandboxMode: true,
    scopes: ['https://mail.google.com/'],
    account: {
      email: 'demo.user@chatbyok.ai',
      name: 'Workspace Account',
    },
    lastSyncedAt: Date.now(),
  },
  calendar: {
    id: 'calendar',
    name: 'Google Calendar',
    description: 'Schedule, search, update, reschedule, and delete meetings and events.',
    icon: '📅',
    status: 'connected',
    isEnabled: true,
    isSandboxMode: true,
    scopes: ['https://www.googleapis.com/auth/calendar'],
    account: {
      email: 'demo.user@chatbyok.ai',
      name: 'Workspace Account',
    },
    lastSyncedAt: Date.now(),
  },
  google_drive: {
    id: 'google_drive',
    name: 'Google Drive',
    description: 'Search files, read Google Docs & Sheets, create notes, and update files.',
    icon: '📁',
    status: 'connected',
    isEnabled: true,
    isSandboxMode: true,
    scopes: ['https://www.googleapis.com/auth/drive'],
    account: {
      email: 'demo.user@chatbyok.ai',
      name: 'Workspace Account',
    },
    lastSyncedAt: Date.now(),
  },
  notion: {
    id: 'notion',
    name: 'Notion Workspace',
    description: 'Search pages, query databases, and create rich markdown notes.',
    icon: '📝',
    status: 'disconnected',
    isEnabled: false,
    isSandboxMode: true,
    scopes: ['notion:read_content', 'notion:insert_content'],
  },
  github: {
    id: 'github',
    name: 'GitHub Repositories',
    description: 'Search issues, read pull requests, inspect commits, and manage repos.',
    icon: '🐙',
    status: 'disconnected',
    isEnabled: false,
    isSandboxMode: true,
    scopes: ['repo', 'read:user'],
  },
  custom_webhook: {
    id: 'custom_webhook',
    name: 'Custom API / MCP',
    description: 'Connect any proprietary REST endpoint or MCP server.',
    icon: '⚡',
    status: 'disconnected',
    isEnabled: false,
    isSandboxMode: true,
    scopes: ['custom:execute'],
  },
};

export const useConnectorsStore = create<ConnectorsState>()(
  persist(
    (set, get) => ({
      connectors: DEFAULT_CONNECTORS,
      activeConnectorIds: ['gmail', 'calendar', 'google_drive'],
      toolExecutionHistory: [],

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
          activeConnectorIds: enabled ? (['gmail', 'calendar', 'google_drive'] as ConnectorId[]) : [],
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

      setAccessToken: (id, token, accountEmail) => {
        set((state) => ({
          connectors: {
            ...state.connectors,
            [id]: {
              ...state.connectors[id],
              accessToken: token,
              status: token ? 'connected' : 'disconnected',
              isSandboxMode: false,
              account: accountEmail
                ? { email: accountEmail, name: accountEmail.split('@')[0] }
                : state.connectors[id].account,
              lastSyncedAt: Date.now(),
            },
          },
        }));
      },

      toggleSandboxMode: (id, isSandbox) => {
        set((state) => ({
          connectors: {
            ...state.connectors,
            [id]: {
              ...state.connectors[id],
              isSandboxMode: isSandbox,
              status: isSandbox || state.connectors[id].accessToken ? 'connected' : 'disconnected',
              account: isSandbox
                ? { email: 'demo.sandbox@chatbyok.ai', name: 'Sandbox Demo User' }
                : state.connectors[id].account,
            },
          },
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
              isSandboxMode: false,
            },
          },
          activeConnectorIds: state.activeConnectorIds.filter((item) => item !== id),
        }));
      },

      recordToolExecution: (result) => {
        set((state) => ({
          toolExecutionHistory: [result, ...state.toolExecutionHistory].slice(0, 50),
        }));
      },

      clearToolHistory: () => {
        set({ toolExecutionHistory: [] });
      },

      getGmailClient: () => {
        const cfg = get().connectors.gmail;
        return new GmailConnectorClient({
          accessToken: cfg.accessToken,
          isSandboxMode: cfg.isSandboxMode || !cfg.accessToken,
        });
      },

      getCalendarClient: () => {
        const cfg = get().connectors.calendar;
        return new CalendarConnectorClient({
          accessToken: cfg.accessToken,
          isSandboxMode: cfg.isSandboxMode || !cfg.accessToken,
        });
      },

      getDriveClient: () => {
        const cfg = get().connectors.google_drive;
        return new GoogleDriveConnectorClient({
          accessToken: cfg.accessToken,
          isSandboxMode: cfg.isSandboxMode || !cfg.accessToken,
        });
      },
    }),
    {
      name: 'chatbyok_connectors_store',
    }
  )
);
