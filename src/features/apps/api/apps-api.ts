import { api } from '@/lib/api';
import { ANTICEIL_APPS, type VoiceAppDefinition } from '@/features/voice/data/voice-activities';
import { Sparkles } from 'lucide-react';

export const appsApi = {
  async getApps(): Promise<VoiceAppDefinition[]> {
    try {
      const res = await api.get<any[]>('/v1/community/apps');
      if (Array.isArray(res) && res.length > 0) {
        const customApps: VoiceAppDefinition[] = res
          .filter(
            (a) =>
              a &&
              !ANTICEIL_APPS.some((def) => def.id === a.id) &&
              a.id !== 'anticeil-platform' &&
              a.id !== 'platform' &&
              a.id !== 'flow' &&
              a.id !== 'anticeil-flow'
          )
          .map((a) => ({
            id: a.id,
            title: a.title || a.name || 'Community App',
            developer: a.developer || a.author || 'Komunitas Anticeil',
            category: a.category || 'productivity',
            bannerGradient: a.bannerGradient || 'from-indigo-600 via-purple-700 to-zinc-950',
            bannerImage: a.bannerImage || a.imageUrl,
            iconBg: a.iconBg || 'bg-primary/20',
            iconColor: a.iconColor || 'text-primary',
            icon: Sparkles,
            tagline: a.tagline || a.aboutInfo || 'Aplikasi komunitas',
            description: a.description || a.aboutInfo || 'Aplikasi kolaborasi komunitas Anticeil.',
            accentColor: a.accentColor || '#6366f1',
          }));
        return [...ANTICEIL_APPS, ...customApps];
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
