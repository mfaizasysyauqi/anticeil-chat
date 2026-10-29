import React, { useState, useMemo } from 'react';
import { Search, Play, Palette, Crown, ScreenShare, Check, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DISCORD_APPS, DiscordAppDefinition } from '../data/discord-activities';

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
}: ActivityLauncherDialogProps) {
  const [appSearchQuery, setAppSearchQuery] = useState('');

  const filteredApps = useMemo(() => {
    if (!appSearchQuery.trim()) return DISCORD_APPS;
    const q = appSearchQuery.toLowerCase();
    return DISCORD_APPS.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tagline.toLowerCase().includes(q) ||
        a.developer.toLowerCase().includes(q),
    );
  }, [appSearchQuery]);

  return (
    <>
      {/* ── DISCORD-STYLE ACTIVITIES LAUNCHER MODAL (100% Match to Discord Screenshot) ── */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="w-[95vw] sm:w-[500px] max-w-[500px] p-0 bg-background border border-border text-foreground overflow-hidden shadow-2xl rounded-[16px] flex flex-col max-h-[82vh] h-[520px] focus:outline-none"
        >
          <DialogTitle className="sr-only">Activities</DialogTitle>
          <DialogDescription className="sr-only">Browse and launch activities in this voice call.</DialogDescription>

          {/* Top Search Bar */}
          <div className="p-3 pb-2 shrink-0">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={appSearchQuery}
                onChange={(e) => setAppSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full h-9 bg-muted/50 border border-border focus:border-border focus:ring-1 focus:ring-ring rounded-lg pl-9 pr-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors"
              />
            </div>
            {activeAppId !== null && (
              <div className="mt-2 px-2.5 py-1 rounded-lg bg-muted border border-border flex items-center justify-between text-xs">
                <span className="text-[11px] text-muted-foreground">
                  Aktif: <strong className="text-foreground">{currentActiveApp?.title}</strong>
                </span>
                <button
                  type="button"
                  onClick={onStopActivity}
                  className="text-[11px] text-red-500 hover:text-red-400 hover:underline cursor-pointer font-semibold"
                >
                  Hentikan Aktivitas
                </button>
              </div>
            )}
          </div>

          {/* Modal Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-3.5 pb-3.5 space-y-3.5 [scrollbar-width:thin]">
            {/* 1. Recents Row (YouTube, Whiteboard, Chess, ScreenShare) */}
            {!appSearchQuery && (
              <div>
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Recents</h3>
                <div className="flex items-center gap-2.5">
                  {/* YouTube Watch Together */}
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onLaunchApp('watch-together')}
                          className="w-11 h-11 rounded-xl bg-card hover:bg-muted border border-border flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm group shrink-0"
                          title="Watch Together"
                        >
                          <div className="w-6 h-4.5 rounded-sm bg-[#ff0000] flex items-center justify-center text-white shadow-xs">
                            <Play className="w-3 h-3 fill-white ml-0.5" />
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs font-semibold">Watch Together</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Jamspace Whiteboard */}
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onLaunchApp('whiteboard')}
                          className="w-11 h-11 rounded-xl bg-card hover:bg-muted border border-border flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm text-blue-500 shrink-0"
                          title="Jamspace Whiteboard"
                        >
                          <Palette className="w-5 h-5 stroke-[2.2]" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs font-semibold">Jamspace Whiteboard</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Anticeil Chess */}
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onLaunchApp('chess')}
                          className="w-11 h-11 rounded-xl bg-card hover:bg-muted border border-border flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm text-amber-500 shrink-0"
                          title="Anticeil Chess"
                        >
                          <Crown className="w-5 h-5 stroke-[2.2]" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs font-semibold">Anticeil Chess</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Share Screen */}
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onLaunchApp('screenshare')}
                          className="w-11 h-11 rounded-xl bg-card hover:bg-muted border border-border flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm text-purple-500 shrink-0"
                          title="Share Screen"
                        >
                          <ScreenShare className="w-5 h-5 stroke-[2.2]" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs font-semibold">Share Screen</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}

            {/* 2. Activities (2 Columns Grid matching Discord) */}
            <div>
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                {appSearchQuery ? 'Search Results' : 'Activities'}
              </h3>

              <div className="grid grid-cols-2 gap-2.5 pb-1">
                {filteredApps.map((app) => (
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
                          <app.icon className="w-8 h-8 text-white/30" />
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

                    {/* Card Bottom Meta */}
                    <div className="p-2.5 bg-card group-hover:bg-muted/70 transition-colors flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform',
                          app.iconBg,
                        )}
                      >
                        <app.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-bold text-foreground group-hover:text-foreground truncate leading-snug">
                          {app.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                          {app.tagline || app.description}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Discord Nitro / Anticeil Plus Paywall Modal ──────────────────── */}
      <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 bg-background border border-border text-foreground overflow-hidden shadow-2xl">
          <div className="relative h-32 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 flex flex-col justify-end">
            <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin-slow" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-black/40 text-white backdrop-blur-md w-fit mb-1 border border-white/20">
              <Crown className="w-3.5 h-3.5 text-amber-300" /> ANTICEIL PLUS
            </span>
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              Batas Peserta Tercapai (Free Plan)
            </h3>
          </div>

          <div className="p-5 space-y-3.5">
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Paket <strong className="text-foreground">Free</strong> mendukung panggilan video & suara 1-on-1 gratis selamanya (maksimal 2 orang). Untuk menghubungkan <strong className="text-foreground">3 orang atau lebih</strong> dalam group call bersama tim Anda, silakan tingkatkan ke paket <strong className="text-primary font-semibold">Anticeil Plus</strong>.
            </DialogDescription>

            <div className="space-y-2 rounded-xl bg-muted/40 p-3.5 border border-border text-xs">
              <div className="flex items-center gap-2 text-foreground/90">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Group Video & Voice Call hingga 25+ peserta bersamaan</span>
              </div>
              <div className="flex items-center gap-2 text-foreground/90">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>High-Definition 1080p 60FPS Screen Sharing & Activities</span>
              </div>
              <div className="flex items-center gap-2 text-foreground/90">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Anticeil Activity: YouTube Watch Together, Games, & Workflow Canvas</span>
              </div>
              <div className="flex items-center gap-2 text-foreground/90">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
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
                <Sparkles className="w-4 h-4" /> Upgrade ke Plus Sekarang
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
