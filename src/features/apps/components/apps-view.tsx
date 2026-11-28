import React, { useState, useMemo, useEffect } from 'react';
import {
  Rocket,
  Play,
  Gamepad2,
  Tv,
  Sparkles,
  Menu,
  Flame,
  Radio,
  Clock,
  X,
  Plus,
  Lock,
  Globe,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Code2,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { ResponsiveSearchBar } from '@/components/ui/responsive-search-bar';
import { TopBarTabButton } from '@/components/ui/top-bar-tab-button';
import { EmptyState } from '@/components/ui/empty';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  CHANNEL_HORIZONTAL_PADDING,
  CHANNEL_VERTICAL_PADDING,
  LAYOUT_PAGE_SPACING,
  TEXT_STYLES,
  BUTTON_STYLES,
  DIALOG_STYLES,
  SURFACE_STYLES,
  PageSectionHeader,
} from '@/lib/layout-constants';
import { cn } from '@/lib/utils';
import { ANTICEIL_APPS, type VoiceAppDefinition } from '@/features/voice/data/voice-activities';
import { clearChannelWatchCache } from '@/features/voice/components/activities/hooks/use-youtube-player';
import { appsApi } from '../api/apps-api';
import type { ColonyChannel, Colony, ColonyMember } from '@/chat/chat-types';
import { ActivityDestinationDialog } from './activity-destination-dialog';
import { StandaloneAppStage } from './standalone-app-stage';
import { AppDetailView } from './app-detail-view';
import { SidebarNavToggle } from '@/components/ui/sidebar-nav-toggle';
import { InboxPopover } from '@/features/inbox';
import { useTranslation } from '@/core/i18n';

export interface AppsViewProps {
  channels: ColonyChannel[];
  colonies?: Colony[];
  members?: ColonyMember[];
  currentUser?: any;
  socket?: any;
  activeCallChannelId?: string | null;
  onLaunchActivity: (appId: string, fromChat?: boolean, targetChannelId?: string, targetColonyId?: string) => void;
  onOpenSidebar: () => void;
  horizontalPadding?: string;
  verticalPadding?: string;
  onStartDM?: (member: ColonyMember) => void;
  setActiveColonyId?: (colonyId: string) => void;
  setActiveChannelId?: (chId: string) => void;
  selectedActivityAppId?: string | null;
  setSelectedActivityAppId?: (id: string | null) => void;
  isActivityOpen?: boolean;
  setIsActivityOpen?: (open: boolean) => void;
  requireAuth?: (action: () => void, title?: string, desc?: string) => void;
}

interface ActivitySectionConfig {
  id: 'productivity' | 'game' | 'entertainment';
  title: string;
  description: string;
  icon: React.ElementType;
}

const ACTIVITY_SECTIONS: ActivitySectionConfig[] = [
  {
    id: 'productivity',
    title: 'Utilitas & Produktivitas',
    description: 'Papan tulis kolaboratif, berbagi layar, dan alat pendukung kerja tim.',
    icon: Sparkles,
  },
  {
    id: 'game',
    title: 'Game & Rekreasi',
    description: 'Mainkan berbagai mini-game multiplayer interaktif bersama di channel suara.',
    icon: Gamepad2,
  },
  {
    id: 'entertainment',
    title: 'Hiburan & Co-Watch',
    description: 'Nonton bareng video streaming dan nikmati konten hiburan secara sinkron.',
    icon: Tv,
  },
];

const CATEGORY_TABS = [
  { id: 'all', label: 'Semua' },
  { id: 'productivity', label: 'Utilitas' },
  { id: 'game', label: 'Game' },
  { id: 'entertainment', label: 'Hiburan' },
  { id: 'my-apps', label: 'Aplikasi Saya' },
] as const;

const MY_APPS_STORAGE_KEY = 'anticeil_my_custom_apps';

const RECENT_APPS_STORAGE_KEY = 'anticeil_recent_apps';
const MAX_RECENT_APPS = 10;
const DEFAULT_RECENT_IDS = ['watch-together', 'tradingview', 'chess', 'whiteboard', 'screenshare'];

function ActivityCard({
  app,
  onOpenDetail,
}: {
  app: VoiceAppDefinition;
  onOpenDetail: (app: VoiceAppDefinition) => void;
}) {
  const { t } = useTranslation();
  const AppIcon = app.icon || Gamepad2;

  const categoryLabel =
    app.category === 'productivity'
      ? t('Utilitas')
      : app.category === 'game'
      ? t('Game')
      : t('Hiburan');

  return (
    <div
      key={app.id}
      onClick={() => onOpenDetail(app)}
      className="rounded-2xl border border-border/70 bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-200 flex flex-col overflow-hidden shadow-xs group cursor-pointer"
    >
      {/* Banner / Cover Artwork (Aspect 16:9 TikTok Style) */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-900 shrink-0">
        {app.bannerImage ? (
          <img
            src={app.bannerImage}
            alt={app.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            className={cn(
              'w-full h-full flex items-center justify-center bg-gradient-to-br transition-all group-hover:scale-105',
              app.bannerGradient || 'from-zinc-800 to-zinc-950'
            )}
          >
            <AppIcon className="w-10 h-10 text-white/30" />
          </div>
        )}

        {/* Ambient Gradient Overlay for depth & TikTok text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 via-45% to-transparent pointer-events-none z-10" />

        {/* App Title Over Banner (Bottom-Left, TikTok style) */}
        <div className="absolute inset-x-0 bottom-0 z-20 px-2.5 sm:px-4 pb-2 sm:pb-2.5 flex items-end justify-between gap-2 pointer-events-none">
          <div className="min-w-0 flex-1 pr-10 sm:pr-14 drop-shadow-md">
            <h4 className="text-xs sm:text-base font-black text-white group-hover:text-primary transition-colors truncate tracking-tight drop-shadow-sm">
              {app.title}
            </h4>
          </div>
        </div>
      </div>

      {/* Overlapping App Icon on the Right (TikTok Style) */}
      <div className="relative z-20 -mt-5 sm:-mt-7 mr-2.5 sm:mr-4 ml-auto flex items-center justify-end pointer-events-none">
        <div
          className={cn(
            'size-9 sm:size-12 rounded-lg sm:rounded-2xl flex items-center justify-center shadow-xl shrink-0 border-2 sm:border-[3px] border-card group-hover:scale-105 transition-transform p-1.5 sm:p-2',
            app.iconBg || 'bg-primary',
            app.iconColor || 'text-white'
          )}
        >
          <AppIcon className="w-full h-full object-contain" />
        </div>
      </div>

      {/* Body Content below banner (Category & Description) */}
      <div className="px-2.5 sm:px-4 -mt-3 sm:-mt-4 pt-0 pb-3 sm:pb-4 flex-1 flex flex-col justify-start">
        <span className="text-[10px] sm:text-xs text-muted-foreground/80 font-medium capitalize">
          {categoryLabel}
        </span>

        <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-0.5 sm:mt-1">
          {app.description}
        </p>
      </div>
    </div>
  );
}

export function AppsView({
  channels,
  colonies = [],
  members = [],
  currentUser,
  socket,
  activeCallChannelId,
  onLaunchActivity,
  onOpenSidebar,
  horizontalPadding = CHANNEL_HORIZONTAL_PADDING,
  verticalPadding = CHANNEL_VERTICAL_PADDING,
  onStartDM,
  setActiveColonyId,
  setActiveChannelId,
  selectedActivityAppId,
  setSelectedActivityAppId,
  isActivityOpen,
  setIsActivityOpen,
  requireAuth,
}: AppsViewProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'entertainment' | 'game' | 'productivity' | 'my-apps'>('all');
  const [appList, setAppList] = useState<VoiceAppDefinition[]>(ANTICEIL_APPS);

  // My Custom Apps State (Persisted in localStorage & developer-ready)
  const [myApps, setMyApps] = useState<VoiceAppDefinition[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(MY_APPS_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  const saveMyApps = (apps: VoiceAppDefinition[]) => {
    setMyApps(apps);
    try {
      localStorage.setItem(MY_APPS_STORAGE_KEY, JSON.stringify(apps));
    } catch {}
  };

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    category: 'productivity' as 'productivity' | 'game' | 'entertainment',
    launchUrl: '',
    visibility: 'private' as 'private' | 'public',
  });

  const handleCreateApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim()) {
      toast.error(t('Nama aplikasi harus diisi'));
      return;
    }

    const newAppId = `custom-app-${Date.now()}`;
    const newApp: any = {
      id: newAppId,
      title: createForm.title.trim(),
      developer: currentUser?.name || currentUser?.username || 'Anda',
      category: createForm.category,
      bannerGradient: 'from-blue-600 via-indigo-800 to-zinc-950',
      iconBg: 'bg-primary/10 border border-primary/20',
      iconColor: 'text-primary',
      icon: createForm.category === 'game' ? Gamepad2 : createForm.category === 'entertainment' ? Tv : Sparkles,
      tagline: createForm.description.trim() || 'Aplikasi kustom buatan Anda',
      description: createForm.description.trim() || 'Aplikasi kustom buatan Anda',
      accentColor: '#026fe4',
      badge: createForm.visibility === 'public' ? 'KOMUNITAS' : 'PRIVATE',
      serverCount: 'In 1 colony',
      supportedLanguages: ['Bahasa Indonesia', 'English (US)'],
      screenshots: [],
      overviewLong: createForm.description.trim(),
      visibility: createForm.visibility,
      isVerified: false,
      isCustom: true,
      launchUrl: createForm.launchUrl.trim() || undefined,
    };

    const updated = [newApp, ...myApps];
    saveMyApps(updated);
    setIsCreateModalOpen(false);
    setCreateForm({
      title: '',
      description: '',
      category: 'productivity',
      launchUrl: '',
      visibility: 'private',
    });
    toast.success(t('Aplikasi berhasil dibuat!'));
  };

  const handleToggleVisibility = (appId: string) => {
    const updated = myApps.map((a: any) => {
      if (a.id === appId) {
        const nextVis = a.visibility === 'public' ? 'private' : 'public';
        return {
          ...a,
          visibility: nextVis,
          badge: nextVis === 'public' ? (a.isVerified ? 'VERIFIED' : 'KOMUNITAS') : 'PRIVATE',
        };
      }
      return a;
    });
    saveMyApps(updated);
    toast.info(t('Visibilitas aplikasi berhasil diperbarui'));
  };

  const handleDeleteCustomApp = (appId: string) => {
    const updated = myApps.filter((a) => a.id !== appId);
    saveMyApps(updated);
    toast.success(t('Aplikasi berhasil dihapus'));
  };

  // Standalone App State: When opened directly from the main AppsView
  const [standaloneApp, setStandaloneApp] = useState<VoiceAppDefinition | null>(() => {
    if (typeof window !== 'undefined') {
      const param = new URLSearchParams(window.location.search).get('activity');
      if (param) {
        return ANTICEIL_APPS.find((a) => a.id === param) || null;
      }
    }
    return null;
  });

  // Realtime two-way synchronization with global activity state
  useEffect(() => {
    if (!selectedActivityAppId || isActivityOpen === false) {
      setStandaloneApp(null);
    } else if (selectedActivityAppId && isActivityOpen && !activeCallChannelId) {
      const app =
        appList.find((a) => a.id === selectedActivityAppId) ||
        ANTICEIL_APPS.find((a) => a.id === selectedActivityAppId) ||
        null;
      if (app) {
        setStandaloneApp(app);
      }
    }
  }, [selectedActivityAppId, isActivityOpen, activeCallChannelId, appList]);

  // Realtime global activity close event listener
  useEffect(() => {
    const handleClose = () => {
      setStandaloneApp(null);
    };
    const handleLaunch = (e: any) => {
      const targetId = e?.detail?.appId;
      if (targetId) {
        const app =
          appList.find((a) => a.id === targetId) ||
          ANTICEIL_APPS.find((a) => a.id === targetId) ||
          null;
        if (app) setStandaloneApp(app);
      }
    };
    window.addEventListener('anticeil_activity_close', handleClose);
    window.addEventListener('anticeil_launch_standalone', handleLaunch);
    return () => {
      window.removeEventListener('anticeil_activity_close', handleClose);
      window.removeEventListener('anticeil_launch_standalone', handleLaunch);
    };
  }, [appList]);

  // Discord-style App Detail View State: Clean catalog -> detail page -> launch
  const [selectedDetailApp, setSelectedDetailApp] = useState<VoiceAppDefinition | null>(() => {
    if (typeof window !== 'undefined') {
      const appParam = new URLSearchParams(window.location.search).get('app');
      if (appParam) {
        return ANTICEIL_APPS.find((a) => a.id === appParam) || null;
      }
    }
    return null;
  });

  // Recent Apps Tracking (Ordered from most recently opened to oldest, max 10)
  const [recentAppIds, setRecentAppIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(RECENT_APPS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const sanitized = parsed.map((id) =>
              id === 'anticeil-platform' || id === 'platform' || id === 'flow' ? 'anticeil-flow' : id
            );
            const deduped = Array.from(new Set(sanitized)).slice(0, MAX_RECENT_APPS);
            try {
              localStorage.setItem(RECENT_APPS_STORAGE_KEY, JSON.stringify(deduped));
            } catch {}
            return deduped;
          }
        }
      } catch {}
    }
    return DEFAULT_RECENT_IDS.slice(0, MAX_RECENT_APPS);
  });

  const trackRecentApp = (rawAppId: string) => {
    const appId =
      rawAppId === 'anticeil-platform' || rawAppId === 'platform' || rawAppId === 'flow'
        ? 'anticeil-flow'
        : rawAppId;
    setRecentAppIds((prev) => {
      const updated = [appId, ...prev.filter((id) => id !== appId && id !== 'anticeil-platform' && id !== 'platform' && id !== 'flow')].slice(0, MAX_RECENT_APPS);
      try {
        localStorage.setItem(RECENT_APPS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleRemoveRecentApp = (e: React.MouseEvent, appId: string) => {
    e.stopPropagation();
    setRecentAppIds((prev) => {
      const updated = prev.filter((id) => id !== appId);
      try {
        localStorage.setItem(RECENT_APPS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const recentApps = useMemo(() => {
    const list: VoiceAppDefinition[] = [];
    for (const rawId of recentAppIds.slice(0, MAX_RECENT_APPS)) {
      const id =
        rawId === 'anticeil-platform' || rawId === 'platform' || rawId === 'flow'
          ? 'anticeil-flow'
          : rawId;
      const found = appList.find((a) => a.id === id);
      if (found && !list.some((item) => item.id === found.id)) {
        list.push(found);
      }
    }
    return list.slice(0, MAX_RECENT_APPS);
  }, [recentAppIds, appList]);

  const handleOpenDetail = (app: VoiceAppDefinition) => {
    trackRecentApp(app.id);
    setSelectedDetailApp(app);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('app', app.id);
      window.history.replaceState(null, '', url.toString());
    }
  };

  const handleBackFromDetail = () => {
    setSelectedDetailApp(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('app');
      window.history.replaceState(null, '', url.toString());
    }
  };

  useEffect(() => {
    let isMounted = true;
    appsApi.getApps().then((apps) => {
      if (isMounted && Array.isArray(apps) && apps.length > 0) {
        setAppList(apps);
        setSelectedDetailApp((prev) => {
          if (!prev) return null;
          return apps.find((a) => a.id === prev.id) || prev;
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const [selectedAppForLaunch, setSelectedAppForLaunch] = useState<VoiceAppDefinition | null>(null);
  const [isLaunchDialogOpen, setIsLaunchDialogOpen] = useState(false);

  const featuredApp = useMemo(() => {
    return appList.find((a) => a.id === 'watch-together') || appList[0] || ANTICEIL_APPS[0];
  }, [appList]);

  const allCombinedApps = useMemo(() => {
    const customPublicOrOwned = myApps.map((a: any) => ({
      ...a,
      isCustom: true,
    }));
    const existingIds = new Set(appList.map((a) => a.id));
    const newCustom = customPublicOrOwned.filter((a) => !existingIds.has(a.id));
    return [...appList, ...newCustom];
  }, [appList, myApps]);

  const filteredApps = useMemo(() => {
    if (activeCategory === 'my-apps') {
      return myApps.filter((app) => {
        if (!searchQuery.trim()) return true;
        return (
          app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    return allCombinedApps.filter((app: any) => {
      const isMyCustom = myApps.some((m) => m.id === app.id);
      const isPublic = app.visibility === 'public' || (!app.visibility && !isMyCustom);

      // Search mode: searches across all public apps & user's own apps
      if (searchQuery.trim()) {
        const matchesSearch =
          app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.developer?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat = activeCategory === 'all' || app.category === activeCategory;
        return matchesSearch && matchesCat && (isPublic || isMyCustom);
      }

      // Default browse mode (no search query):
      // STRICT CURATION: Only show Official Anticeil apps OR Verified community apps!
      // Unverified community apps do not appear in the main explore tab without a search query.
      const isOfficial = !app.isCustom || app.developer?.toLowerCase().includes('anticeil');
      const isVerified = Boolean(app.isVerified || app.isPromoted);

      if (!isOfficial && !isVerified) {
        return false;
      }

      const matchesCat = activeCategory === 'all' || app.category === activeCategory;
      return matchesCat;
    });
  }, [allCombinedApps, myApps, searchQuery, activeCategory]);

  const handleLaunchStandalone = (appOrId: VoiceAppDefinition | string) => {
    if (!currentUser && requireAuth) {
      requireAuth(
        () => handleLaunchStandalone(appOrId),
        t('Buka Aktivitas'),
        t('Masuk ke Anticeil untuk menggunakan aktivitas dan aplikasi ini.'),
      );
      return;
    }
    const app = typeof appOrId === 'string'
      ? appList.find((a) => a.id === appOrId) || ANTICEIL_APPS.find((a) => a.id === appOrId) || null
      : appOrId;
    if (app) {
      trackRecentApp(app.id);
      if (activeCallChannelId && socket) {
        socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
          channelId: activeCallChannelId,
          action: 'ACTIVITY_STOP',
          payload: {},
        });
      }
      setStandaloneApp(app);
      setSelectedActivityAppId?.(app.id);
      setIsActivityOpen?.(true);
      const url = new URL(window.location.href);
      url.searchParams.set('activity', app.id);
      window.history.replaceState(null, '', url.toString());
    }
  };

  const handleOpenSendToChannel = (app: VoiceAppDefinition) => {
    if (!currentUser && requireAuth) {
      requireAuth(
        () => handleOpenSendToChannel(app),
        t('Kirim ke Saluran'),
        t('Masuk ke Anticeil untuk meluncurkan aktivitas ke saluran.'),
      );
      return;
    }
    setSelectedAppForLaunch(app);
    setIsLaunchDialogOpen(true);
  };

  const handleConfirmLaunch = (options: {
    targetType: 'dm' | 'server';
    colonyId?: string;
    channelId: string;
    targetName: string;
    appId: string;
    member?: ColonyMember;
  }) => {
    // Auto-close standalone session when sending/launching into channel
    trackRecentApp(options.appId);
    setStandaloneApp(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('activity');
    window.history.replaceState(null, '', url.toString());

    if (options.targetType === 'server') {
      if (options.colonyId && setActiveColonyId) {
        setActiveColonyId(options.colonyId);
      }
      if (options.channelId && setActiveChannelId) {
        setActiveChannelId(options.channelId);
      }
      onLaunchActivity(options.appId, false, options.channelId, options.colonyId);
    } else {
      if (options.member && onStartDM) {
        onStartDM(options.member);
      } else {
        if (setActiveColonyId) setActiveColonyId('anticeil');
        if (options.channelId && setActiveChannelId) {
          setActiveChannelId(options.channelId);
        }
      }
      onLaunchActivity(options.appId, false, options.channelId, 'anticeil');
    }
  };

  const visibleSections = useMemo(() => {
    return ACTIVITY_SECTIONS.filter((section) => {
      if (activeCategory !== 'all' && activeCategory !== section.id) {
        return false;
      }
      return true;
    });
  }, [activeCategory]);

  // If user launched an activity standalone from this main AppsView page:
  if (standaloneApp) {
    return (
      <>
        <StandaloneAppStage
          app={standaloneApp}
          onClose={() => {
            const standaloneId = `standalone-${standaloneApp.id}`;
            clearChannelWatchCache(standaloneId);
            clearChannelWatchCache();
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('anticeil_activity_close', { detail: { channelId: standaloneId } }));
            }
            setStandaloneApp(null);
            setSelectedActivityAppId?.(null);
            setIsActivityOpen?.(false);
            const url = new URL(window.location.href);
            url.searchParams.delete('activity');
            window.history.replaceState(null, '', url.toString());
          }}
          onOpenSendToChannel={() => handleOpenSendToChannel(standaloneApp)}
          currentUser={currentUser}
          socket={socket}
          onOpenSidebar={onOpenSidebar}
          horizontalPadding={horizontalPadding}
        />

        {/* Modal Dialog: Kirim ke Channel / DM dari dalam sesi Standalone */}
        <ActivityDestinationDialog
          open={isLaunchDialogOpen}
          onOpenChange={setIsLaunchDialogOpen}
          app={selectedAppForLaunch}
          colonies={colonies}
          channels={channels}
          members={members}
          onConfirmLaunch={handleConfirmLaunch}
          onLaunchStandalone={handleLaunchStandalone}
        />
      </>
    );
  }

  // If user selected an activity to view its full Discord-style App Detail page:
  if (selectedDetailApp) {
    return (
      <>
        <AppDetailView
          app={selectedDetailApp}
          allApps={appList}
          currentUser={currentUser}
          onBack={handleBackFromDetail}
          onLaunchStandalone={handleLaunchStandalone}
          onOpenSendToChannel={handleOpenSendToChannel}
          onSelectOtherApp={handleOpenDetail}
          onAppUpdated={(updated) => {
            setAppList((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
            setSelectedDetailApp(updated);
          }}
          horizontalPadding={horizontalPadding}
          verticalPadding={verticalPadding}
        />

        {/* Modal Dialog: Kirim ke Channel / DM dari dalam detail view */}
        <ActivityDestinationDialog
          open={isLaunchDialogOpen}
          onOpenChange={setIsLaunchDialogOpen}
          app={selectedAppForLaunch}
          colonies={colonies}
          channels={channels}
          members={members}
          onConfirmLaunch={handleConfirmLaunch}
          onLaunchStandalone={handleLaunchStandalone}
        />
      </>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-background overflow-hidden select-none">
      {/* ── Single App Bar (h-12) ─────────────────────────── */}
      <div className={cn('sticky top-0 z-20 h-12 border-b border-sidebar-border flex items-center justify-between shrink-0 bg-background gap-2 overflow-hidden', horizontalPadding)}>
        <SidebarNavToggle onClick={onOpenSidebar} />

        {/* Category Tabs: 100% DRY TopBarTabButton */}
        <div className="flex-1 min-w-0 flex items-center gap-1 shrink-0 overflow-x-auto scrollbar-none touch-pan-x">
          {CATEGORY_TABS.map((tab) => (
            <TopBarTabButton
              key={tab.id}
              active={activeCategory === tab.id}
              onClick={() => setActiveCategory(tab.id)}
            >
              {t(tab.label)}
            </TopBarTabButton>
          ))}
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2 shrink-0">
          <ResponsiveSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('Cari aktivitas...')}
            inputWidth="w-32 sm:w-44 md:w-48"
          />
        </div>
      </div>

      {/* ── Main Scroll Area ──────────────────────────────────────── */}
      <ScrollArea className="flex-1 min-h-0">
        <div className={cn(LAYOUT_PAGE_SPACING.BODY_HORIZONTAL, LAYOUT_PAGE_SPACING.SECTION_SPACING, verticalPadding)}>
        {/* Featured Hero Banner: Discord style with landscape artwork backdrop */}
        {!searchQuery && activeCategory === 'all' && (
          <div
            onClick={() => handleOpenDetail(featuredApp)}
            className="relative overflow-hidden rounded-2xl border border-border/80 shadow-2xl cursor-pointer group bg-zinc-950 min-h-[180px] sm:min-h-[220px] flex flex-col justify-end p-5 sm:p-7 transition-all hover:border-primary/50"
          >
            {/* Background Artwork Image */}
            {featuredApp.bannerImage && (
              <img
                src={featuredApp.bannerImage}
                alt={featuredApp.title}
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
            )}
            {/* Dark Gradient Overlay for high readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/25" />

            {/* Content on top */}
            <div className="relative z-10 flex items-center justify-between gap-4 w-full">
              {/* Left: Info */}
              <div className="space-y-2 max-w-2xl min-w-0 flex-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground shadow-sm">
                  <Flame className="w-3 h-3 fill-current" /> UNGGULAN
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md group-hover:text-primary transition-colors">
                  {featuredApp.title}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-200/90 leading-relaxed font-medium line-clamp-2 drop-shadow-xs max-w-xl">
                  {featuredApp.description}
                </p>
              </div>

              {/* Right: YouTube / App Logo */}
              <div className="shrink-0 flex items-center justify-center pl-2">
                {featuredApp.id === 'watch-together' || featuredApp.id === 'youtube' ? (
                  <div className="size-14 sm:size-18 md:size-20 rounded-2xl sm:rounded-3xl bg-white flex items-center justify-center shadow-2xl shadow-black/60 group-hover:scale-105 group-hover:rotate-2 transition-all duration-300 border border-white/20">
                    <svg
                      className="w-8 h-6 sm:w-11 sm:h-8 md:w-12 md:h-9 text-[#FF0000] fill-current drop-shadow-xs"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </div>
                ) : (
                  <div
                    className={cn(
                      'size-14 sm:size-18 md:size-20 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl shadow-black/60 group-hover:scale-105 group-hover:rotate-2 transition-all duration-300 border border-white/20',
                      featuredApp.iconBg || 'bg-primary',
                      featuredApp.iconColor || 'text-white'
                    )}
                  >
                    <featuredApp.icon className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Aplikasi yang Digunakan Sebelumnya (Recent Apps Strip matching Image 1) ── */}
        {!searchQuery && activeCategory === 'all' && recentApps.length > 0 && (
          <div className="space-y-3 pt-1">
            <PageSectionHeader
              icon={Clock}
              title={t('Aplikasi yang Digunakan Sebelumnya')}
              count={recentApps.length}
              description={t('Diurutkan dari yang paling baru dibuka')}
            />

            {/* Horizontal Row of Squircle Icon Buttons (100% Match to User Screenshot) */}
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1 touch-pan-x">
              {recentApps.map((app) => {
                const AppIcon = app.icon || Gamepad2;
                return (
                  <TooltipProvider key={app.id} delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          onClick={() => handleOpenDetail(app)}
                          className="group relative flex flex-col items-center cursor-pointer shrink-0"
                        >
                          {/* Squircle Button matching Discord Style */}
                          <div
                            className={cn(
                              'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-card border border-border/80 flex items-center justify-center transition-all duration-200 group-hover:scale-105 active:scale-95 group-hover:border-primary/50 group-hover:shadow-lg shadow-xs relative overflow-hidden',
                            )}
                          >
                            {/* Inner Colored Squircle Icon Container */}
                            <div
                              className={cn(
                                'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105',
                                app.iconBg || 'bg-primary',
                                app.iconColor || 'text-white'
                              )}
                            >
                              <AppIcon className="w-5 h-5 sm:w-5 sm:h-5" />
                            </div>

                            {/* Remove from Recents / Quick Uninstall Action */}
                            <button
                              type="button"
                              onClick={(e) => handleRemoveRecentApp(e, app.id)}
                              className="group/btn absolute top-1 right-1 size-4.5 rounded-full bg-background/90 hover:bg-red-600 border border-border/80 hover:border-red-600 items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20 flex shadow-sm cursor-pointer"
                              title={t('Hapus dari riwayat')}
                              aria-label={t('Hapus dari riwayat')}
                            >
                              <X className="w-2.5 h-2.5 stroke-[2.8] text-foreground/80 group-hover/btn:text-white group-hover/btn:stroke-white transition-colors" />
                            </button>
                          </div>

                          {/* App Title Label */}
                          <span className="text-[11px] font-semibold text-foreground/90 group-hover:text-primary transition-colors truncate max-w-[70px] sm:max-w-[76px] text-center mt-1.5 drop-shadow-2xs">
                            {app.title}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs font-semibold p-2">
                        <p className="font-bold text-foreground">{app.title}</p>
                        <p className="text-[10px] text-muted-foreground font-normal max-w-[200px]">{app.tagline || app.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tab: Aplikasi Saya (Developer Portal) vs Explore ── */}
        {activeCategory === 'my-apps' ? (
          <div className="space-y-6">
            {/* Header Card with Developer Info & Create Button */}
            <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card/80 backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">
                    {t('Aplikasi Saya (Developer Portal)')}
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('Kelola bot, webhook, dan mini-app buatan Anda. Aplikasi Private hanya aktif untuk pengujian Anda, sedangkan Public dapat dicari di direktori komunitas.')}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    <Lock className="w-3 h-3" /> Private: Pengujian Mandiri
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                    <Globe className="w-3 h-3" /> Public: Tersedia via Pencarian
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" /> Verifikasi Gratis (0% Fee)
                  </span>
                </div>
              </div>

              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shrink-0 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>{t('Buat Aplikasi Baru')}</span>
              </Button>
            </div>

            {/* List or Empty State */}
            {filteredApps.length === 0 ? (
              <EmptyState
                icon={<Code2 className="w-8 h-8 stroke-[1.8] text-primary/80" />}
                title={searchQuery ? t('Tidak Ada Aplikasi Cocok') : t('Belum Ada Aplikasi Kustom')}
                description={
                  searchQuery
                    ? `Tidak ada aplikasi yang cocok dengan "${searchQuery}".`
                    : t('Bangun aplikasi interaktif, bot, atau integrasi webhook Anda menggunakan @anticeil/sdk dan jalankan langsung di Anticeil.')
                }
                action={
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('Buat Aplikasi Pertama')}</span>
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredApps.map((app: any) => {
                  const AppIcon = app.icon || Sparkles;
                  const isPublic = app.visibility === 'public';
                  const isVerified = Boolean(app.isVerified);

                  return (
                    <div
                      key={app.id}
                      className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 flex flex-col justify-between hover:border-primary/50 transition-all shadow-xs space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                              <AppIcon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-foreground truncate">{app.title}</h3>
                              <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                                {app.category}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] font-semibold gap-1',
                                isPublic
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              )}
                            >
                              {isPublic ? <Globe className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                              <span>{isPublic ? 'Public' : 'Private'}</span>
                            </Badge>
                            {isVerified ? (
                              <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px] bg-zinc-800 text-zinc-400 border-zinc-700">
                                Menunggu Kurasi
                              </Badge>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {app.description}
                        </p>

                        {app.launchUrl && (
                          <div className="text-[11px] font-mono text-muted-foreground/80 bg-muted/40 px-2 py-1 rounded truncate flex items-center gap-1.5">
                            <ExternalLink className="w-3 h-3 shrink-0 text-primary" />
                            <span className="truncate">{app.launchUrl}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => handleLaunchStandalone(app)}
                            className="h-8 px-3 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>{t('Uji Coba')}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenSendToChannel(app)}
                            className="h-8 px-3 text-xs font-medium cursor-pointer"
                          >
                            <span>{t('Kirim')}</span>
                          </Button>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleVisibility(app.id)}
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                            title={isPublic ? 'Ubah ke Private' : 'Ubah ke Public'}
                          >
                            {isPublic ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteCustomApp(app.id)}
                            className="h-8 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                            title={t('Hapus')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Normal Explore Sections */
          filteredApps.length === 0 ? (
            <EmptyState
              icon={<Rocket className="w-8 h-8 stroke-[1.8] text-primary/80" />}
              title="Tidak Ada Aktivitas Ditemukan"
              description={
                searchQuery
                  ? `Tidak ada aktivitas yang cocok dengan "${searchQuery}". Coba kata kunci lain.`
                  : 'Belum ada aktivitas yang tersedia di kategori ini.'
              }
              action={
                searchQuery ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSearchQuery('')}
                    className="h-8 px-4 text-xs font-semibold cursor-pointer"
                  >
                    {t('Reset Pencarian')}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            visibleSections.map((section) => {
              const SectionIcon = section.icon;
              const sectionApps = filteredApps.filter((app) => app.category === section.id);

              if (sectionApps.length === 0) return null;

              return (
                <div key={section.id} className="space-y-3">
                  {/* Standardized Section Header */}
                  <PageSectionHeader
                    icon={SectionIcon}
                    title={t(section.title)}
                    count={sectionApps.length}
                    description={t(section.description)}
                  />

                  {/* Grid: 4 columns in desktop (xl:grid-cols-4), 2 in tablet and mobile (grid-cols-2) */}
                  <div className={SURFACE_STYLES.CARD_GRID}>
                    {sectionApps.map((app) => (
                      <ActivityCard
                        key={app.id}
                        app={app}
                        onOpenDetail={handleOpenDetail}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )
        )}
        </div>
      </ScrollArea>

      {/* ── Modal Dialog: Buat Aplikasi Baru ────────────────────────── */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md bg-card border-border p-6 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Code2 className="w-5 h-5 text-primary" />
              <span>{t('Daftarkan Aplikasi Baru')}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t('Aplikasi yang Anda buat akan tersedia di Anticeil untuk diuji coba langsung atau dibagikan ke komunitas.')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateApp} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">{t('Nama Aplikasi')}</label>
              <Input
                value={createForm.title}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Contoh: Kuis Komunitas, Bot Musik..."
                required
                className="bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">{t('Deskripsi Singkat')}</label>
              <Input
                value={createForm.description}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Apa fungsi atau tujuan aplikasi ini?"
                className="bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">{t('Kategori')}</label>
                <select
                  value={createForm.category}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, category: e.target.value as any }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="productivity">{t('Utilitas')}</option>
                  <option value="game">{t('Game')}</option>
                  <option value="entertainment">{t('Hiburan')}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">{t('Visibilitas Awal')}</label>
                <select
                  value={createForm.visibility}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, visibility: e.target.value as any }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="private">{t('Private (Hanya Anda)')}</option>
                  <option value="public">{t('Public (Bisa Dicari)')}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t('URL Web App / Embed (Opsional)')}
              </label>
              <Input
                value={createForm.launchUrl}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, launchUrl: e.target.value }))}
                placeholder="https://aplikasi-anda.vercel.app"
                type="url"
                className="bg-background font-mono text-xs"
              />
              <span className="text-[10px] text-muted-foreground block">
                {t('Dapat berupa URL web app yang akan dijalankan langsung di layar panggung Anticeil.')}
              </span>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
                className="cursor-pointer"
              >
                {t('Batal')}
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer"
              >
                {t('Simpan & Daftarkan')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal Dialog: Pilih Tujuan Luncurkan (DM vs Server) ─────── */}
      <ActivityDestinationDialog
        open={isLaunchDialogOpen}
        onOpenChange={setIsLaunchDialogOpen}
        app={selectedAppForLaunch}
        colonies={colonies}
        channels={channels}
        members={members}
        onConfirmLaunch={handleConfirmLaunch}
        onLaunchStandalone={handleLaunchStandalone}
      />
    </div>
  );
}
