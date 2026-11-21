import React, { useState, useEffect, useMemo } from 'react';
import { Search, Play, Palette, Crown, ScreenShare, Check, Sparkles, X, Dices, HelpCircle, Gamepad2, Bot } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ANTICEIL_APPS, DiscordAppDefinition } from '../data/voice-activities';
import { appsApi } from '@/features/apps/api/apps-api';
import { Colony } from '@/chat/chat-types';
import { useTranslation } from '@/core/i18n';

export interface ActivityLauncherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeAppId: string | null;
  currentActiveApp?: DiscordAppDefinition | null;
  onLaunchApp: (appId: string) => void;
  onStopActivity: () => void;
  isUpgradeModalOpen: boolean;
  setIsUpgradeModalOpen: (open: boolean) => void;
  onNavigateToBilling?: () => void;
  activeColony?: Colony | null;
}

export function ActivityLauncherDialog({
  open,
  onOpenChange,
  activeAppId,
  currentActiveApp,
  onLaunchApp,
  onStopActivity,
  isUpgradeModalOpen,
  setIsUpgradeModalOpen,
  onNavigateToBilling,
  activeColony,
}: ActivityLauncherDialogProps) {
  const { t } = useTranslation();
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'game' | 'entertainment' | 'productivity' | 'colony'>('all');
  const [appList, setAppList] = useState<DiscordAppDefinition[]>(ANTICEIL_APPS);

  // Sync with appsApi so newly registered or dynamic community apps update automatically
  useEffect(() => {
    let isMounted = true;
    appsApi.getApps().then((fetched) => {
      if (isMounted && Array.isArray(fetched) && fetched.length > 0) {
        setAppList(fetched);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const installedColonyApps = useMemo(() => {
    return activeColony?.installedApps || [];
  }, [activeColony?.installedApps]);

  const filteredApps = useMemo(() => {
    let list = appList;
    if (selectedCategory !== 'all' && selectedCategory !== 'colony') {
      list = list.filter((a) => a.category === selectedCategory);
    }
    if (!appSearchQuery.trim()) return list;
    const q = appSearchQuery.toLowerCase();
    return list.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tagline.toLowerCase().includes(q) ||
        a.developer.toLowerCase().includes(q),
    );
  }, [appList, appSearchQuery, selectedCategory]);

  const filteredColonyApps = useMemo(() => {
    if (!installedColonyApps.length) return [];
    if (!appSearchQuery.trim()) return installedColonyApps;
    const q = appSearchQuery.toLowerCase();
    return installedColonyApps.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
    );
  }, [installedColonyApps, appSearchQuery]);

  return (
    <>
      {/* ── DISCORD-STYLE ACTIVITIES LAUNCHER MODAL (100% Match to Discord Screenshot) ── */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          size="md"
          showCloseButton={false}
          className="p-0 bg-background border border-border text-foreground overflow-hidden shadow-2xl rounded-2xl flex flex-col max-h-[82vh] h-[520px] focus:outline-none"
        >
          <DialogTitle className="sr-only">{t('Aktivitas')}</DialogTitle>
          <DialogDescription className="sr-only">{t('Jelajahi dan jalankan aktivitas dalam panggilan suara ini.')}</DialogDescription>

          {/* Top Search Bar & Close button */}
          <div className="px-3.5 sm:px-4 pt-3.5 pb-2 shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={appSearchQuery}
                  onChange={(e) => setAppSearchQuery(e.target.value)}
                  placeholder={t('Cari aktivitas, game, atau bot...')}
                  className="w-full h-9 bg-muted/50 border border-border focus:border-border focus:ring-1 focus:ring-ring rounded-lg pl-9 pr-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors"
                />
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title={t('Tutup')}
                aria-label={t('Tutup')}
              >
                <X className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer shrink-0',
                  selectedCategory === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {t('Semua')}
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('game')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer shrink-0',
                  selectedCategory === 'game'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                🎮 {t('Game')}
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('entertainment')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer shrink-0',
                  selectedCategory === 'entertainment'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                🍿 {t('Hiburan')}
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('productivity')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer shrink-0',
                  selectedCategory === 'productivity'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                🎨 {t('Produktivitas')}
              </button>
              {installedColonyApps.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('colony')}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer shrink-0',
                    selectedCategory === 'colony'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  🤖 Colony Apps ({installedColonyApps.length})
                </button>
              )}
            </div>

            {activeAppId !== null && (
              <div className="mt-2.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-between text-xs">
                <span className="text-[11px] text-primary font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  {t('Aktif')}: <strong className="text-foreground">{currentActiveApp?.title || activeAppId}</strong>
                </span>
                <button
                  type="button"
                  onClick={onStopActivity}
                  className="text-[11px] text-red-500 hover:text-red-400 hover:underline cursor-pointer font-semibold"
                >
                  {t('Hentikan Aktivitas')}
                </button>
              </div>
            )}
          </div>

          {/* Modal Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-3.5 sm:px-4 pb-3.5 space-y-3.5 max-md:scrollbar-none custom-scrollbar">
            {/* 1. Recents Row */}
            {!appSearchQuery && selectedCategory === 'all' && (
              <div>
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{t('Terbaru')}</h3>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {appList.map((app) => {
                    const IconComp = app.icon || Gamepad2;
                    return (
                      <TooltipProvider key={app.id} delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => onLaunchApp(app.id)}
                              className="w-11 h-11 rounded-xl bg-card hover:bg-muted border border-border flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm group shrink-0"
                              title={app.title}
                            >
                              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shadow-xs", app.iconBg || "bg-primary/20")}>
                                <IconComp className={cn("w-4 h-4", app.iconColor || "text-primary")} />
                              </div>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs font-semibold">{app.title}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Installed Colony Apps & Bots Section (If Any) */}
            {(selectedCategory === 'all' || selectedCategory === 'colony') && filteredColonyApps.length > 0 && (
              <div>
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Colony Installed Apps & Bots</span>
                  <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20">
                    {filteredColonyApps.length} Terpasang
                  </Badge>
                </h3>

                <div className="grid grid-cols-2 gap-2.5 pb-1">
                  {filteredColonyApps.map((bot) => (
                    <div
                      key={bot.id}
                      onClick={() => onLaunchApp(bot.id)}
                      className={cn(
                        'rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer group flex flex-col shadow-xs',
                        activeAppId === bot.id
                          ? 'border-primary ring-2 ring-primary/40 bg-card'
                          : 'border-border/60 bg-card hover:border-border hover:bg-muted/60',
                      )}
                    >
                      <div className="p-3 flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                          <Bot className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-foreground truncate">
                              {bot.name}
                            </span>
                            <Badge className="text-[8px] h-3.5 px-1 bg-primary/20 text-primary border-0 font-bold uppercase">
                              BOT
                            </Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground truncate mt-0.5">
                            Mulai sesi di voice channel
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Activities (2 Columns Grid matching Discord) */}
            <div>
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                {appSearchQuery ? t('Hasil Pencarian') : t('Aktivitas')}
              </h3>

              <div className="grid grid-cols-2 gap-2.5 pb-1">
                {filteredApps.map((app) => {
                  const IconComp = app.icon || Gamepad2;
                  return (
                  <div
                    key={app.id}
                    onClick={() => onLaunchApp(app.id)}
                    className={cn(
                      'rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer group flex flex-col shadow-xs',
                      activeAppId === app.id
                        ? 'border-primary ring-2 ring-primary/40 bg-card'
                        : 'border-border/60 bg-card hover:border-border hover:bg-muted/60',
                    )}
                  >
                    {/* Graphical Top Banner with PROMOTED pill */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                      {app.bannerImage ? (
                        <img
                          src={app.bannerImage}
                          alt={app.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className={cn(
                            'w-full h-full p-2.5 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br',
                            app.bannerGradient,
                          )}
                        >
                          <IconComp className="w-8 h-8 text-white/30" />
                        </div>
                      )}

                      {/* Ambient Gradient Overlay for text contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

                      {/* Promoted Pill Badge on Top-Right */}
                      {app.isPromoted && (
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-[3px] text-[8px] font-black tracking-wider text-black bg-white uppercase shadow-xs select-none">
                          PROMOTED
                        </span>
                      )}

                      {/* Center Banner Title Overlay */}
                      <div className="absolute bottom-1.5 left-2 right-2 z-10 pointer-events-none">
                        <span className="text-xs sm:text-sm font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-wide truncate block">
                          {app.bannerTitle || app.title}
                        </span>
                      </div>
                    </div>

                    {/* Card Bottom Meta: Logo on Right */}
                    <div className="p-2.5 bg-card group-hover:bg-muted/70 transition-colors flex items-center justify-between gap-2.5 min-w-0">
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-bold text-foreground group-hover:text-foreground truncate leading-snug">
                          {app.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                          {app.tagline || app.description}
                        </span>
                      </div>
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform',
                          app.iconBg,
                        )}
                      >
                        <IconComp className={cn("w-4 h-4", app.iconColor || "text-white")} />
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Anticeil Nectar Paywall Modal ──────────────────── */}
      <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
        <DialogContent size="md" className="p-0 bg-background border border-border text-foreground overflow-hidden shadow-2xl">
          <div className="relative h-32 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 flex flex-col justify-end">
            <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin-slow" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-black/40 text-white backdrop-blur-md w-fit mb-1 border border-white/20">
              <Crown className="w-3.5 h-3.5 text-amber-300" /> ANTICEIL NECTAR
            </span>
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              Batas Peserta Tercapai (Free Plan)
            </h3>
          </div>

          <div className="p-5 space-y-3.5">
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Paket <strong className="text-foreground">Free</strong> mendukung panggilan video & suara 1-on-1 gratis selamanya (maksimal 2 orang). Untuk menghubungkan <strong className="text-foreground">3 orang atau lebih</strong> dalam group call bersama tim Anda, silakan tingkatkan ke paket <strong className="text-primary font-semibold">Anticeil Nectar</strong>.
            </DialogDescription>

            <div className="space-y-2 rounded-xl bg-muted/40 p-3.5 border border-border text-xs">
              <div className="flex items-center gap-2 text-foreground/90">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Group Video & Voice Call hingga 25+ peserta bersamaan</span>
              </div>
              <div className="flex items-center gap-2 text-foreground/90">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>{t('High-Definition 1080p 60FPS Screen Sharing & Activities')}</span>
              </div>
              <div className="flex items-center gap-2 text-foreground/90">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>{t('Anticeil Activity: YouTube Watch Together, Games, & Workflow Canvas')}</span>
              </div>
              <div className="flex items-center gap-2 text-foreground/90">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Tanpa batas durasi panggilan (*unlimited minutes*)</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsUpgradeModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Nanti Saja
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setIsUpgradeModalOpen(false);
                  if (onNavigateToBilling) {
                    onNavigateToBilling();
                  } else {
                    window.location.href = '/platform/billing';
                  }
                }}
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white font-bold gap-1.5 shadow-md shadow-purple-500/20"
              >
                <Sparkles className="w-4 h-4" /> Upgrade ke Nectar Sekarang
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
