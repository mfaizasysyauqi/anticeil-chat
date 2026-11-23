import { api } from '@/lib/api';
import {
  ANTICEIL_APPS,
  type VoiceAppDefinition,
  YouTubeIcon,
  TradingViewIcon,
} from '@/features/voice/data/voice-activities';
import {
  Sparkles,
  Gamepad2,
  Tv,
  Palette,
  Crown,
  ScreenShare,
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  YouTubeIcon,
  youtube: YouTubeIcon,
  'watch-together': YouTubeIcon,
  TradingViewIcon,
  tradingview: TradingViewIcon,
  Crown,
  chess: Crown,
  Palette,
  whiteboard: Palette,
  ScreenShare,
  screenshare: ScreenShare,
  Sparkles,
  flow: Sparkles,
  'anticeil-flow': Sparkles,
  Gamepad2,
  Tv,
};

function resolveAppIcon(appId: string, iconName?: string): any {
  if (iconName && ICON_MAP[iconName]) return ICON_MAP[iconName];
  if (ICON_MAP[appId]) return ICON_MAP[appId];
  const foundDef = ANTICEIL_APPS.find((d) => d.id === appId);
  if (foundDef?.icon) return foundDef.icon;
  return Sparkles;
}

export const appsApi = {
  async getApps(): Promise<VoiceAppDefinition[]> {
    try {
      const res = await api.get<any[]>('/v1/community/activities/catalog');
      if (Array.isArray(res) && res.length > 0) {
        return res.map((item) => {
          const defaultApp = ANTICEIL_APPS.find((d) => d.id === item.id);
          const resolvedIcon = resolveAppIcon(item.id, item.iconName);

          return {
            ...(defaultApp || {}),
            ...item,
            id: item.id,
            title: item.title || defaultApp?.title || 'Community App',
            developer: item.developer || defaultApp?.developer || 'Pengembang Anticeil',
            category: item.category || defaultApp?.category || 'productivity',
            bannerGradient: item.bannerGradient || defaultApp?.bannerGradient || 'from-indigo-600 via-purple-700 to-zinc-950',
            bannerImage: item.bannerImage !== undefined ? item.bannerImage : defaultApp?.bannerImage,
            iconBg: item.iconBg || defaultApp?.iconBg || 'bg-primary',
            iconColor: item.iconColor || defaultApp?.iconColor || 'text-white',
            icon: resolvedIcon,
            tagline: item.tagline || defaultApp?.tagline || '',
            description: item.description || defaultApp?.description || '',
            accentColor: item.accentColor || defaultApp?.accentColor || '#6366f1',
            buttonClass: item.buttonClass || defaultApp?.buttonClass,
            serverCount: item.serverCount || defaultApp?.serverCount || 'In 48 colonies',
            supportedLanguages: item.supportedLanguages || defaultApp?.supportedLanguages || ['Bahasa Indonesia', 'English (US)'],
            screenshots: item.screenshots || defaultApp?.screenshots || [],
            overviewLong: item.overviewLong || defaultApp?.overviewLong || item.description || defaultApp?.description,
            howToPlay: item.howToPlay || defaultApp?.howToPlay || '',
          };
        });
      }
    } catch (err) {
      console.warn('[appsApi.getApps] Fallback to default catalog:', err);
    }
    return ANTICEIL_APPS;
  },

  async getAppById(appId: string): Promise<VoiceAppDefinition | null> {
    try {
      const item = await api.get<any>(`/v1/community/activities/catalog/${appId}`);
      if (item && item.id) {
        const defaultApp = ANTICEIL_APPS.find((d) => d.id === item.id);
        const resolvedIcon = resolveAppIcon(item.id, item.iconName);
        return {
          ...(defaultApp || {}),
          ...item,
          icon: resolvedIcon,
        };
      }
    } catch {}
    return ANTICEIL_APPS.find((d) => d.id === appId) || null;
  },

  async registerApp(app: Partial<VoiceAppDefinition>): Promise<{ success: boolean; app?: any }> {
    try {
      const res = await api.post('/v1/community/activities/catalog', app);
      return { success: true, app: res };
    } catch {
      return { success: false };
    }
  },

  async updateApp(appId: string, updates: Partial<VoiceAppDefinition>): Promise<{ success: boolean; app?: any }> {
    try {
      const res = await api.put(`/v1/community/activities/catalog/${appId}`, updates);
      return { success: true, app: res };
    } catch {
      return { success: false };
    }
  },

  async deleteApp(appId: string): Promise<{ success: boolean }> {
    try {
      await api.delete(`/v1/community/activities/catalog/${appId}`);
      return { success: true };
    } catch {
      return { success: false };
    }
  },
};
