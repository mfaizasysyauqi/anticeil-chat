import React, { useState, useMemo } from 'react';
import {
  Rocket,
  Search,
  Play,
  Gamepad2,
  Tv,
  Sparkles,
  Menu,
  ExternalLink,
  Flame,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { DISCORD_APPS, type DiscordAppDefinition } from '@/features/voice/data/discord-activities';
import type { CommunityChannel } from '@/chat/chat-types';

export interface AppsViewProps {
  channels: CommunityChannel[];
  activeCallChannelId?: string | null;
  onLaunchActivity: (appId: string, fromChat?: boolean, targetChannelId?: string) => void;
  onOpenSidebar: () => void;
  horizontalPadding?: string;
}

export function AppsView({
  channels,
  activeCallChannelId,
  onLaunchActivity,
  onOpenSidebar,
  horizontalPadding = 'px-4 sm:px-6',
}: AppsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'entertainment' | 'game' | 'productivity'>('all');

  const voiceChannels = channels.filter((c) => c.type === 'voice');

  const filteredApps = useMemo(() => {
    return DISCORD_APPS.filter((app) => {
      const matchesSearch =
        app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.developer.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = activeCategory === 'all' || app.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [searchQuery, activeCategory]);

  const handleLaunch = (appId: string) => {
    // If there is an active call, launch there. Otherwise pick the first voice channel or default.
    const targetChannel = activeCallChannelId || voiceChannels[0]?.id;
    onLaunchActivity(appId, false, targetChannel);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-background overflow-hidden select-none">
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <div className={cn('h-14 border-b border-border flex items-center justify-between shrink-0 bg-card/60 backdrop-blur-md z-10', horizontalPadding)}>
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="md:hidden h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer shrink-0"
            title="Buka Menu Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="size-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center shrink-0">
            <Rocket className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground flex items-center gap-2">
              Aplikasi & Anticeil Activities
              <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400">
                Co-Watch & Games
              </span>
            </h1>
            <p className="text-[11px] text-muted-foreground truncate hidden xs:block">
              Jelajahi dan luncurkan aktivitas bersama langsung di panggilan komunitas Anda
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-40 sm:w-56">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari aktivitas..."
            className="h-8 pl-8 text-xs bg-card border-border"
          />
        </div>
      </div>

      {/* ── Subheader Category Tabs ───────────────────────────────── */}
      <div className={cn('py-2.5 border-b border-border/50 flex items-center gap-1.5 shrink-0 bg-muted/20 overflow-x-auto [scrollbar-width:none]', horizontalPadding)}>
        {[
          { id: 'all', label: 'Semua Aplikasi' },
          { id: 'entertainment', label: 'Hiburan & Co-Watch' },
          { id: 'game', label: 'Game Multiplayer' },
          { id: 'productivity', label: 'Produktivitas' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id as any)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer border',
              activeCategory === tab.id
                ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-2xs'
                : 'bg-card text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Main Scroll Area ──────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] p-4 sm:p-6 space-y-6">
        {/* Featured Hero Banner: YouTube Watch Together */}
        {!searchQuery && activeCategory === 'all' && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950 via-zinc-900 to-zinc-950 border border-red-500/20 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 max-w-xl z-10">
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

            <Button
              size="lg"
              onClick={() => handleLaunch('watch-together')}
              className="bg-red-600 hover:bg-red-500 text-white font-bold h-10 px-6 gap-2 shadow-lg shadow-red-600/30 cursor-pointer z-10"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Mulai Menonton</span>
            </Button>

            {/* Background decoration */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-red-600/10 to-transparent pointer-events-none" />
          </div>
        )}

        {/* Apps Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-border/50">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Daftar Aktivitas ({filteredApps.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApps.map((app) => {
              const AppIcon = app.icon || Gamepad2;

              return (
                <div
                  key={app.id}
                  className="rounded-xl border border-border bg-card hover:border-primary/50 transition-all flex flex-col justify-between overflow-hidden shadow-xs group"
                >
                  {/* Banner / Header */}
                  <div
                    className={cn(
                      'h-24 p-3 relative flex items-start justify-between bg-gradient-to-br',
                      app.bannerGradient || 'from-muted to-card'
                    )}
                  >
                    <div className="flex items-center gap-2 z-10">
                      <div
                        className={cn(
                          'size-9 rounded-lg flex items-center justify-center shadow-md',
                          app.iconBg || 'bg-primary',
                          app.iconColor || 'text-white'
                        )}
                      >
                        <AppIcon className="w-5 h-5" />
                      </div>
                      <div className="text-white">
                        <span className="text-[10px] font-semibold text-white/80 block uppercase tracking-wider">
                          {app.developer}
                        </span>
                        <span className="text-xs font-bold line-clamp-1">
                          {app.title}
                        </span>
                      </div>
                    </div>

                    {app.badge && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md">
                        {app.badge}
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {app.description}
                    </p>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold text-muted-foreground capitalize">
                        {app.category}
                      </span>

                      <Button
                        size="sm"
                        onClick={() => handleLaunch(app.id)}
                        className="h-7 px-3 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Luncurkan</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
