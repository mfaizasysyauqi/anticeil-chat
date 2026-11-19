import React from 'react';
import { Search, Play, Palette, Crown, ScreenShare } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { EXTENDED_DISCORD_APPS } from '@/chat/anticeil-media-data';

export interface ChatAppsPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appsSearchQuery: string;
  setAppsSearchQuery: (query: string) => void;
  onLaunchActivity: (activityId: string) => void;
}

export function ChatAppsPopover({
  open,
  onOpenChange,
  appsSearchQuery,
  setAppsSearchQuery,
  onLaunchActivity,
}: ChatAppsPopoverProps) {
  const filteredApps = EXTENDED_DISCORD_APPS.filter((app) => {
    if (!appsSearchQuery.trim()) return true;
    const q = appsSearchQuery.toLowerCase();
    return (
      app.title.toLowerCase().includes(q) ||
      app.description.toLowerCase().includes(q) ||
      app.developer.toLowerCase().includes(q)
    );
  });

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-6 h-6 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
          title="Apps & Activities (Aplikasi Komunitas)"
        >
          {/* Discord 4-shapes Activity icon */}
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M7 3a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm10 0a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm-10 10a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm10 0a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={14}
        className="w-[440px] max-w-[95vw] h-[480px] p-4 bg-background border border-border text-foreground shadow-2xl rounded-2xl select-none z-50 flex flex-col"
      >
        {/* Search Apps & Commands */}
        <div className="relative w-full mb-3.5 shrink-0">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={appsSearchQuery}
            onChange={(e) => setAppsSearchQuery(e.target.value)}
            placeholder="Cari Aplikasi & Aktivitas..."
            className="w-full bg-muted/60 border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {/* Quick Launcher Icons */}
          {!appsSearchQuery && (
            <div>
              <span className="text-xs font-bold text-foreground block mb-2">
                Aktivitas Resmi Anticeil
              </span>
              <div className="flex items-center gap-2.5">
                {/* Watch Together */}
                <button
                  type="button"
                  onClick={() => {
                    onLaunchActivity('watch-together');
                    onOpenChange(false);
                  }}
                  className="w-12 h-12 rounded-xl bg-card border border-border hover:border-red-500/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer shrink-0 group"
                  title="Watch Together"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-xs">
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </div>
                </button>

                {/* Whiteboard */}
                <button
                  type="button"
                  onClick={() => {
                    onLaunchActivity('whiteboard');
                    onOpenChange(false);
                  }}
                  className="w-12 h-12 rounded-xl bg-card border border-border hover:border-primary/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer shrink-0 group"
                  title="Jamspace Whiteboard"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-xs">
                    <Palette className="w-4 h-4" />
                  </div>
                </button>

                {/* Chess */}
                <button
                  type="button"
                  onClick={() => {
                    onLaunchActivity('chess');
                    onOpenChange(false);
                  }}
                  className="w-12 h-12 rounded-xl bg-card border border-border hover:border-amber-500/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer shrink-0 group"
                  title="Anticeil Chess"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white shadow-xs">
                    <Crown className="w-4 h-4" />
                  </div>
                </button>

                {/* Screen Share */}
                <button
                  type="button"
                  onClick={() => {
                    onLaunchActivity('screenshare');
                    onOpenChange(false);
                  }}
                  className="w-12 h-12 rounded-xl bg-card border border-border hover:border-purple-500/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer shrink-0 group"
                  title="Share Screen"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-xs">
                    <ScreenShare className="w-4 h-4" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* List of 4 Functional Apps */}
          <div>
            <span className="text-xs font-bold text-foreground block mb-2">
              {appsSearchQuery ? 'Hasil Pencarian' : 'Daftar Aktivitas Realtime'}
            </span>
            <div className="space-y-2">
              {filteredApps.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => {
                    onLaunchActivity(app.id);
                    onOpenChange(false);
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-card hover:bg-accent/40 border border-border hover:border-border/80 transition-all text-left cursor-pointer group shadow-2xs"
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl shadow-xs text-white", app.iconBg)}>
                    {app.id === 'watch-together' && <Play className="w-5 h-5 fill-white" />}
                    {app.id === 'whiteboard' && <Palette className="w-5 h-5" />}
                    {app.id === 'chess' && <Crown className="w-5 h-5" />}
                    {app.id === 'screenshare' && <ScreenShare className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors block truncate">
                        {app.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                        {app.developer}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      {app.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
