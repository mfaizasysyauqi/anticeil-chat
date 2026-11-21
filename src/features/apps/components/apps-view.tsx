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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ResponsiveSearchBar } from '@/components/ui/responsive-search-bar';
import { TopBarTabButton } from '@/components/ui/top-bar-tab-button';
import { EmptyState } from '@/components/ui/empty';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CHANNEL_HORIZONTAL_PADDING,
  CHANNEL_VERTICAL_PADDING,
  LAYOUT_PAGE_SPACING,
  TEXT_STYLES,
  BUTTON_STYLES,
  DIALOG_STYLES,
  SURFACE_STYLES,
} from '@/lib/layout-constants';
import { cn } from '@/lib/utils';
import { ANTICEIL_APPS, type VoiceAppDefinition } from '@/features/voice/data/voice-activities';
import { appsApi } from '../api/apps-api';
import type { ColonyChannel, Colony, ColonyMember } from '@/chat/chat-types';
import { ActivityDestinationDialog } from './activity-destination-dialog';
import { StandaloneAppStage } from './standalone-app-stage';
import { AppDetailView } from './app-detail-view';
import { SidebarNavToggle } from '@/components/ui/sidebar-nav-toggle';

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
] as const;

function ActivityCard({
  app,
  onOpenDetail,
}: {
  app: VoiceAppDefinition;
  onOpenDetail: (app: VoiceAppDefinition) => void;
}) {
  const AppIcon = app.icon || Gamepad2;

  const categoryLabel =
    app.category === 'productivity'
      ? 'Utilitas'
      : app.category === 'game'
      ? 'Game'
      : 'Hiburan';

  return (
    <div
      key={app.id}
      onClick={() => onOpenDetail(app)}
      className="rounded-2xl border border-border/70 bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-200 flex flex-col overflow-hidden shadow-xs group cursor-pointer"
    >
      {/* Banner / Cover Artwork (Aspect 16:9 like Discord) */}
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

        {/* Ambient Gradient Overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

        {app.badge && (
          <span className="absolute top-2.5 right-2.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/10 shadow-xs">
            {app.badge}
          </span>
        )}
      </div>

      {/* Overlapping App Icon (Positioned at seam between banner and body, exact Discord pattern) */}
      <div className="relative z-10 -mt-6 sm:-mt-7 ml-3.5 sm:ml-4 flex items-center justify-between pr-3.5 pointer-events-none">
        <div
          className={cn(
            'size-12 sm:size-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0 border-[3px] border-card group-hover:scale-105 transition-transform',
            app.iconBg || 'bg-primary',
            app.iconColor || 'text-white'
          )}
        >
          <AppIcon className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
      </div>

      {/* Body Content (Title, Category, Description) */}
      <div className="px-3.5 sm:px-4 pt-1.5 pb-4 flex-1 flex flex-col justify-start">
        <h4 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors truncate tracking-tight">
          {app.title}
        </h4>

        <span className="text-[11px] sm:text-xs text-muted-foreground/80 font-medium capitalize mt-0.5">
          {categoryLabel}
        </span>

        <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-1.5">
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
}: AppsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'entertainment' | 'game' | 'productivity'>('all');
  const [appList, setAppList] = useState<VoiceAppDefinition[]>(ANTICEIL_APPS);

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

  const handleOpenDetail = (app: VoiceAppDefinition) => {
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

  const filteredApps = useMemo(() => {
    return appList.filter((app) => {
      const matchesSearch =
        app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.developer.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = activeCategory === 'all' || app.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [appList, searchQuery, activeCategory]);

  const handleLaunchStandalone = (appOrId: VoiceAppDefinition | string) => {
    const app = typeof appOrId === 'string'
      ? appList.find((a) => a.id === appOrId) || ANTICEIL_APPS.find((a) => a.id === appOrId) || null
      : appOrId;
    if (app) {
      if (activeCallChannelId && socket) {
        socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
          channelId: activeCallChannelId,
          action: 'ACTIVITY_STOP',
          payload: {},
        });
      }
      setStandaloneApp(app);
      const url = new URL(window.location.href);
      url.searchParams.set('activity', app.id);
      window.history.replaceState(null, '', url.toString());
    }
  };

  const handleOpenSendToChannel = (app: VoiceAppDefinition) => {
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
            setStandaloneApp(null);
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
          onBack={handleBackFromDetail}
          onLaunchStandalone={handleLaunchStandalone}
          onOpenSendToChannel={handleOpenSendToChannel}
          onSelectOtherApp={handleOpenDetail}
          horizontalPadding={horizontalPadding}
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
        <div className="flex items-center gap-2 shrink-0">
          <SidebarNavToggle onClick={onOpenSidebar} />

          {/* Title & Icon: Hidden on mobile (<sm), shown on tablet & desktop */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Rocket className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">Aplikasi & Aktivitas</span>
          </div>

          <Separator orientation="vertical" className="hidden sm:block h-4 mx-1 shrink-0" />
        </div>

        {/* Category Tabs: 100% DRY TopBarTabButton */}
        <div className="flex-1 min-w-0 flex items-center gap-1 shrink-0 overflow-x-auto scrollbar-none px-1 touch-pan-x">
          {CATEGORY_TABS.map((tab) => (
            <TopBarTabButton
              key={tab.id}
              active={activeCategory === tab.id}
              onClick={() => setActiveCategory(tab.id)}
            >
              {tab.label}
            </TopBarTabButton>
          ))}
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2 shrink-0">
          <ResponsiveSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Cari aktivitas..."
            inputWidth="w-32 sm:w-44 md:w-48"
          />
        </div>
      </div>

      {/* ── Main Scroll Area ──────────────────────────────────────── */}
      <ScrollArea className="flex-1 min-h-0">
        <div className={cn(LAYOUT_PAGE_SPACING.BODY_HORIZONTAL, 'space-y-8', verticalPadding)}>
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
            <div className="relative z-10 space-y-2 max-w-2xl">
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
          </div>
        )}

        {/* Content by Sections */}
        {filteredApps.length === 0 ? (
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
                  Reset Pencarian
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
              <div key={section.id} className="space-y-3.5">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1.5 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <SectionIcon className="w-4 h-4 text-primary shrink-0" />
                    <h3 className={TEXT_STYLES.SECTION_TITLE}>
                      {section.title}
                    </h3>
                    <span className={TEXT_STYLES.COUNTER_LABEL}>
                      ({sectionApps.length})
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {section.description}
                  </p>
                </div>

                {/* Grid: 4 columns in desktop (lg:grid-cols-4), 3 in tablet (md:grid-cols-3), 2 in mobile (grid-cols-2) */}
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
        )}
        </div>
      </ScrollArea>

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
