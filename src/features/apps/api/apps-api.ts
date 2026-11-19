import { api } from '@/lib/api';
import { ANTICEIL_APPS, type VoiceAppDefinition } from '@/features/voice/data/voice-activities';

export const appsApi = {
  async getApps(): Promise<VoiceAppDefinition[]> {
    try {
      const res = await api.get<any[]>('/v1/community/apps');
      if (Array.isArray(res)) {
        return ANTICEIL_APPS;
      }
    } catch {}
    return ANTICEIL_APPS;
  },

  async registerApp(app: Partial<VoiceAppDefinition>): Promise<{ success: boolean; app?: any }> {
    try {
      const res = await api.post('/v1/community/apps', app);
      return { success: true, app: res };
    } catch {
      return { success: false };
    }
  },

  async updateApp(appId: string, updates: Partial<VoiceAppDefinition>): Promise<{ success: boolean }> {
    try {
      await api.put(`/v1/community/apps/${appId}`, updates);
      return { success: true };
    } catch {
      return { success: false };
    }
  },

  async deleteApp(appId: string): Promise<{ success: boolean }> {
    try {
      await api.delete(`/v1/community/apps/${appId}`);
      return { success: true };
    } catch {
      return { success: false };
    }
  },
};
