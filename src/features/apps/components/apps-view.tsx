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
  onLaunchStandalone,
  onOpenSendToChannel,
}: {
  app: VoiceAppDefinition;
  onLaunchStandalone: (app: VoiceAppDefinition) => void;
  onOpenSendToChannel: (app: VoiceAppDefinition) => void;
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
      className="rounded-xl border border-border bg-card hover:border-primary/50 transition-all flex flex-col justify-between overflow-hidden shadow-xs group"
    >
      {/* Banner / Header */}
      <div
        className={cn(
          'h-20 sm:h-24 p-2.5 sm:p-3 relative flex items-start justify-between bg-gradient-to-br',
          app.bannerGradient || 'from-muted to-card'
        )}
      >
        <div className="flex items-center gap-2 sm:gap-2.5 z-10 min-w-0">
          <div
            className={cn(
              'size-8 sm:size-9 rounded-lg flex items-center justify-center shadow-md shrink-0',
              app.iconBg || 'bg-primary',
              app.iconColor || 'text-white'
            )}
          >
            <AppIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-white min-w-0">
            <span className="text-[9px] sm:text-[10px] font-semibold text-white/80 block uppercase tracking-wider truncate">
              {app.developer}
            </span>
            <span className="text-xs font-bold line-clamp-1">
              {app.title}
            </span>
          </div>
        </div>

        {app.badge && (
          <span className="text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md shrink-0">
            {app.badge}
          </span>
        )}
      </div>

      {/* Body Content */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between gap-3">
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {app.description}
        </p>

        <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold text-muted-foreground capitalize truncate">
            {categoryLabel}
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenSendToChannel(app)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground border-border hover:bg-muted cursor-pointer"
              title="Kirim atau buka di saluran / DM"
            >
              <Radio className="w-3 h-3 text-primary" />
            </Button>

            <Button
              size="sm"
              variant="custom"
              onClick={() => onLaunchStandalone(app)}
              className={cn(
                'h-7 px-2.5 sm:px-3 text-xs font-semibold gap-1 sm:gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0',
                app.buttonClass || 'bg-primary hover:bg-primary/80 active:bg-primary/70 text-primary-foreground'
              )}
              title="Buka langsung secara Standalone"
            >
              <Play className="w-3 h-3 fill-current shrink-0" />
              <span>Luncurkan</span>
            </Button>
          </div>
        </div>
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

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-background overflow-hidden select-none">
      {/* ── Single App Bar (h-12) ─────────────────────────── */}
      <div className={cn('h-12 border-b border-sidebar-border flex items-center justify-between shrink-0 bg-background z-10 gap-2', horizontalPadding)}>
        <div className="flex items-center gap-2 shrink-0">
          {onOpenSidebar && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onOpenSidebar}
              className="md:hidden sidebar-toggle-btn h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer shrink-0"
              title="Buka Menu Sidebar"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}

          {/* Title & Icon: Hidden on mobile (<sm), shown on tablet & desktop */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Rocket className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">Aplikasi & Aktivitas</span>
          </div>

          <Separator orientation="vertical" className="hidden sm:block h-4 mx-1 shrink-0" />
        </div>

        {/* Category Tabs: 100% DRY TopBarTabButton */}
        <div className="flex-1 min-w-0 flex items-center gap-1 shrink-0 overflow-x-auto scrollbar-none px-1">
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
        {/* Featured Hero Banner: YouTube Watch Together */}
        {!searchQuery && activeCategory === 'all' && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950 via-zinc-900 to-zinc-950 border border-red-500/20 p-5 sm:p-6 lg:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 lg:gap-6 shadow-xl">
            <div className="space-y-2 flex-1 min-w-0 max-w-xl z-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                <Flame className="w-3 h-3" /> UNGGULAN
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                YouTube Watch Together
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Tonton video YouTube bersama teman secara real-time dengan sinkronisasi kontrol pause, play, dan loncat timestamp tanpa jeda.
              </p>
            </div>

            <div className="flex items-center gap-2.5 z-10 flex-wrap shrink-0">
              <Button
                size="lg"
                variant="custom"
                onClick={() => handleLaunchStandalone(featuredApp)}
                className={cn(
                  'font-bold h-10 px-4 sm:px-5 gap-2 cursor-pointer transition-colors shadow-lg text-xs sm:text-sm shrink-0',
                  featuredApp?.buttonClass || 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white'
                )}
                title="Tonton video secara mandiri"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Mulai Menonton</span>
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => handleOpenSendToChannel(featuredApp)}
                className="font-semibold h-10 px-3.5 gap-2 cursor-pointer bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-md backdrop-blur-sm text-xs sm:text-sm shrink-0"
                title="Buka atau kirim undangan ke saluran / DM"
              >
                <Radio className="w-4 h-4 text-red-400" />
                <span>Buka di Saluran</span>
              </Button>
            </div>

            {/* Background decoration */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-red-600/10 to-transparent pointer-events-none" />
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
                      onLaunchStandalone={handleLaunchStandalone}
                      onOpenSendToChannel={handleOpenSendToChannel}
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
