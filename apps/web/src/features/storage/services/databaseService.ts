'use client';

import {
  AnticeilDatabaseBackup,
  ChatMessage,
  ChatSession,
  Persona,
  ProjectFolderData,
  UserTier,
} from '@anticeil/core';
import { useChatStore } from '../../chat/store/useChatStore';
import { useProjectStore } from '../../chat/store/useProjectStore';
import { usePromptStore } from '../../prompts/store/usePromptStore';
import { useConnectorsStore } from '../../connectors/store/useConnectorsStore';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useAuthStore } from '../../auth/store/useAuthStore';

function triggerBrowserDownload(filename: string, jsonContent: string) {
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export class DatabaseService {
  /**
   * Export complete local database from all client-side stores to AnticeilDatabaseBackup
   */
  static exportLocalDatabase(): AnticeilDatabaseBackup {
    const chatState = useChatStore.getState();
    const projectState = useProjectStore.getState();
    const promptState = usePromptStore.getState();
    const connectorsState = useConnectorsStore.getState();
    const workspaceState = useWorkspaceStore.getState();
    const settingsState = useSettingsStore.getState();
    const authState = useAuthStore.getState();

    const folders: ProjectFolderData[] = projectState.folders.map((f) => ({
      id: f.id,
      name: f.name,
      createdAt: f.createdAt,
      sessionIds: f.sessionIds || [],
    }));

    return {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      source: 'local',
      tier: authState.tier || 'free',
      userId: authState.user?.id,
      data: {
        sessions: chatState.sessions,
        messages: chatState.messages,
        folders,
        personas: promptState.personas,
        connectors: connectorsState.connectors,
        workspace: {
          projects: workspaceState.projects,
          imageCollections: workspaceState.imageCollections,
          workflowCategories: workspaceState.workflowCategories,
          documentCategories: workspaceState.documentCategories,
        },
        settings: {
          apiKeys: settingsState.apiKeys,
          theme: settingsState.theme,
          language: settingsState.language,
        },
      },
    };
  }

  /**
   * Triggers download of the local database backup JSON file
   */
  static downloadLocalBackup(): AnticeilDatabaseBackup {
    const backup = this.exportLocalDatabase();
    const filename = `anticeil_local_db_${new Date().toISOString().slice(0, 10)}_${Date.now()}.json`;
    triggerBrowserDownload(filename, JSON.stringify(backup, null, 2));
    return backup;
  }

  /**
   * Restores an AnticeilDatabaseBackup into local stores
   */
  static importLocalDatabase(
    backup: AnticeilDatabaseBackup,
    mode: 'merge' | 'replace' = 'merge'
  ): {
    sessionsCount: number;
    messagesCount: number;
    foldersCount: number;
    personasCount: number;
  } {
    if (!backup?.data) {
      throw new Error('Invalid backup file: data object is missing.');
    }

    const { sessions = [], messages = {}, folders = [], personas = [], connectors = {}, settings } =
      backup.data;

    // 1. Chat Sessions & Messages
    const chatStore = useChatStore.getState();
    if (mode === 'replace') {
      const activeId = sessions[0]?.id || 'session-default';
      useChatStore.setState({
        sessions: sessions.length > 0 ? sessions : chatStore.sessions,
        activeSessionId: activeId,
        messages: messages,
      });
    } else {
      // Merge: add non-duplicate sessions and combine messages
      const existingSessionIds = new Set(chatStore.sessions.map((s) => s.id));
      const newSessions = sessions.filter((s) => !existingSessionIds.has(s.id));
      const mergedMessages: Record<string, ChatMessage[]> = { ...chatStore.messages };

      for (const [sid, msgList] of Object.entries(messages)) {
        if (!mergedMessages[sid]) {
          mergedMessages[sid] = msgList;
        } else {
          const existingMsgIds = new Set(mergedMessages[sid].map((m) => m.id));
          const newMsgs = msgList.filter((m) => !existingMsgIds.has(m.id));
          mergedMessages[sid] = [...mergedMessages[sid], ...newMsgs];
        }
      }

      useChatStore.setState({
        sessions: [...newSessions, ...chatStore.sessions],
        messages: mergedMessages,
      });
    }

    // 2. Folders
    const projectStore = useProjectStore.getState();
    if (mode === 'replace') {
      useProjectStore.setState({
        folders: folders.map((f) => ({
          id: f.id,
          name: f.name,
          createdAt: f.createdAt,
          sessionIds: f.sessionIds || [],
        })),
      });
    } else {
      const existingFolderIds = new Set(projectStore.folders.map((f) => f.id));
      const newFolders = folders
        .filter((f) => !existingFolderIds.has(f.id))
        .map((f) => ({
          id: f.id,
          name: f.name,
          createdAt: f.createdAt,
          sessionIds: f.sessionIds || [],
        }));
      useProjectStore.setState({
        folders: [...projectStore.folders, ...newFolders],
      });
    }

    // Save folders to local storage for offline / free tier
    try {
      localStorage.setItem(
        'anticeil-project-store',
        JSON.stringify(useProjectStore.getState().folders)
      );
    } catch {}

    // 3. Personas / Prompts
    if (personas.length > 0) {
      const promptStore = usePromptStore.getState();
      if (mode === 'replace') {
        usePromptStore.setState({ personas });
      } else {
        const existingPersonaIds = new Set(promptStore.personas.map((p) => p.id));
        const newPersonas = personas.filter((p) => !existingPersonaIds.has(p.id));
        usePromptStore.setState({
          personas: [...promptStore.personas, ...newPersonas],
        });
      }
    }

    // 4. Connectors
    if (connectors && Object.keys(connectors).length > 0) {
      const connStore = useConnectorsStore.getState();
      useConnectorsStore.setState({
        connectors: { ...connStore.connectors, ...connectors },
      });
    }

    // 5. Settings / API keys (optional restore)
    if (settings?.apiKeys) {
      useSettingsStore.getState().importApiKeys(settings.apiKeys);
    }
    if (settings?.theme) {
      useSettingsStore.getState().setTheme(settings.theme);
    }
    if (settings?.language && (settings.language === 'en' || settings.language === 'id')) {
      useSettingsStore.getState().setLanguage(settings.language as any);
    }

    let totalMsgs = 0;
    for (const list of Object.values(messages)) {
      totalMsgs += list.length;
    }

    return {
      sessionsCount: sessions.length,
      messagesCount: totalMsgs,
      foldersCount: folders.length,
      personasCount: personas.length,
    };
  }

  /**
   * Fetches full cloud database from Supabase and triggers browser download
   */
  static async exportCloudDatabase(accessToken: string): Promise<AnticeilDatabaseBackup> {
    const res = await fetch('/api/db/export', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}: Failed to export cloud database`);
    }

    const backup: AnticeilDatabaseBackup = await res.json();
    const filename = `anticeil_cloud_db_${new Date().toISOString().slice(0, 10)}_${Date.now()}.json`;
    triggerBrowserDownload(filename, JSON.stringify(backup, null, 2));
    return backup;
  }

  /**
   * Imports a backup JSON into Supabase Cloud
   */
  static async importCloudDatabase(
    backup: AnticeilDatabaseBackup,
    accessToken: string,
    mode: 'merge' | 'replace' = 'merge'
  ): Promise<any> {
    const res = await fetch('/api/db/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ backup, mode }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}: Failed to import cloud database`);
    }

    return res.json();
  }

  /**
   * 1-Click Migration: Push Local Database to Supabase Cloud
   */
  static async migrateLocalToCloud(
    accessToken: string,
    mode: 'merge' | 'replace' = 'merge'
  ): Promise<{ success: boolean; imported: any }> {
    const localBackup = this.exportLocalDatabase();
    return this.importCloudDatabase(localBackup, accessToken, mode);
  }

  /**
   * 1-Click Migration: Pull Supabase Cloud Database to Local Storage
   */
  static async migrateCloudToLocal(
    accessToken: string,
    mode: 'merge' | 'replace' = 'merge'
  ): Promise<{
    sessionsCount: number;
    messagesCount: number;
    foldersCount: number;
    personasCount: number;
  }> {
    const res = await fetch('/api/db/export', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}: Failed to fetch cloud database`);
    }

    const cloudBackup: AnticeilDatabaseBackup = await res.json();
    return this.importLocalDatabase(cloudBackup, mode);
  }

  /**
   * Purge user records from Supabase Cloud
   */
  static async purgeCloudDatabase(accessToken: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/db/purge', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}: Failed to purge cloud database`);
    }

    return res.json();
  }

  /**
   * 1-Click Grace Period Resolution: Pull all cloud data to local, then purge cloud records
   */
  static async migrateAndPurgeCloud(
    accessToken: string,
    mode: 'merge' | 'replace' = 'merge'
  ): Promise<{
    migration: {
      sessionsCount: number;
      messagesCount: number;
      foldersCount: number;
      personasCount: number;
    };
    purgeSuccess: boolean;
  }> {
    // 1. Pull cloud data and store safely in local
    const migration = await this.migrateCloudToLocal(accessToken, mode);

    // 2. Once local import is confirmed, purge cloud copy
    let purgeSuccess = false;
    try {
      const purgeRes = await this.purgeCloudDatabase(accessToken);
      purgeSuccess = purgeRes.success;
    } catch (e) {
      console.warn('[DatabaseService] Failed to purge cloud after migration:', e);
    }

    return { migration, purgeSuccess };
  }
}

