import React from 'react';
import { Search } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
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
        className="w-[440px] max-w-[95vw] h-[520px] p-4 bg-popover border border-border text-popover-foreground shadow-2xl rounded-2xl select-none z-50 flex flex-col"
      >
        {/* Search Apps & Commands */}
        <div className="relative w-full mb-3.5">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={appsSearchQuery}
            onChange={(e) => setAppsSearchQuery(e.target.value)}
            placeholder="Search Apps & Commands"
            className="w-full bg-muted/60 border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
          {/* Recents */}
          {!appsSearchQuery && (
            <div>
              <span className="text-xs font-bold text-foreground block mb-2">
                Recents
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onLaunchActivity('watch-together');
                    onOpenChange(false);
                  }}
                  className="w-[52px] h-[52px] rounded-2xl bg-white border border-white/20 hover:border-white/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer shrink-0"
                  title="Watch Together"
                >
                  <svg className="w-8 h-6 fill-[#ff0000]" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onLaunchActivity('poker-night');
                    onOpenChange(false);
                  }}
                  className="w-[52px] h-[52px] rounded-2xl bg-white border border-white/20 hover:border-white/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer shrink-0"
                  title="Poker Night"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-base shadow-xs">
                    👆
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onLaunchActivity('virtual-fisher');
                    onOpenChange(false);
                  }}
                  className="w-[52px] h-[52px] rounded-2xl bg-white border border-white/20 hover:border-white/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer shrink-0"
                  title="Virtual Fisher"
                >
                  <div className="w-8 h-8 rounded-full bg-[#e2f1ff] border border-blue-200 flex items-center justify-center text-lg relative">
                    🎣
                    <span className="absolute -bottom-1 -right-1 text-[10px]">🐟</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onLaunchActivity('wordle');
                    onOpenChange(false);
                  }}
                  className="w-[52px] h-[52px] rounded-2xl bg-white border border-white/20 hover:border-white/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer shrink-0"
                  title="Wordle"
                >
                  <div className="w-7 h-7 grid grid-cols-3 gap-0.5 p-1 bg-black rounded-md">
                    <div className="bg-[#538d4e] rounded-[1px]" />
                    <div className="bg-[#538d4e] rounded-[1px]" />
                    <div className="bg-[#538d4e] rounded-[1px]" />
                    <div className="bg-[#b59f3b] rounded-[1px]" />
                    <div className="bg-[#3a3a3c] rounded-[1px]" />
                    <div className="bg-[#538d4e] rounded-[1px]" />
                    <div className="bg-[#538d4e] rounded-[1px]" />
                    <div className="bg-[#538d4e] rounded-[1px]" />
                    <div className="bg-[#538d4e] rounded-[1px]" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Apps in this Server */}
          {!appsSearchQuery && (
            <div>
              <span className="text-xs font-bold text-foreground block mb-2">
                Apps in this Server
              </span>
              <button
                type="button"
                onClick={() => {
                  onLaunchActivity('virtual-fisher');
                  onOpenChange(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card hover:bg-accent/40 border border-border transition-all text-left cursor-pointer group shadow-xs"
              >
                <div className="w-11 h-11 rounded-xl bg-white border border-white/20 flex items-center justify-center shrink-0 shadow-md">
                  <div className="w-8 h-8 rounded-full bg-[#e2f1ff] border border-blue-200 flex items-center justify-center text-lg relative">
                    🎣
                    <span className="absolute -bottom-1 -right-1 text-[10px]">🐟</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors block truncate">
                    VirtualFisher
                  </span>
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    Virtual Fisher is a game you can play in your server focused on catching rare fish...
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* Promoted (4 Apps with Banner) */}
          {!appsSearchQuery && (
            <div>
              <span className="text-xs font-bold text-foreground block mb-2">
                Promoted
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {EXTENDED_DISCORD_APPS.filter((a) => a.group === 'Promoted').slice(0, 4).map((app) => (
                  <button
                    key={app.id}
                    onClick={() => {
                      onLaunchActivity(app.id);
                      onOpenChange(false);
                    }}
                    className="group/card rounded-xl overflow-hidden bg-card border border-border hover:border-border/80 transition-all text-left flex flex-col hover:shadow-md cursor-pointer"
                  >
                    {/* Banner */}
                    <div className={cn("h-20 w-full relative overflow-hidden flex items-center justify-center", app.bannerGradient)}>
                      {app.id === 'wordle' ? (
                        <div className="flex flex-col items-center justify-center select-none py-1">
                          <div className="w-5 h-5 grid grid-cols-3 gap-0.5 p-0.5 bg-black rounded mb-0.5">
                            <div className="bg-[#538d4e] rounded-[0.5px]" />
                            <div className="bg-[#538d4e] rounded-[0.5px]" />
                            <div className="bg-[#538d4e] rounded-[0.5px]" />
                            <div className="bg-[#b59f3b] rounded-[0.5px]" />
                            <div className="bg-[#3a3a3c] rounded-[0.5px]" />
                            <div className="bg-[#538d4e] rounded-[0.5px]" />
                            <div className="bg-[#538d4e] rounded-[0.5px]" />
                            <div className="bg-[#538d4e] rounded-[0.5px]" />
                            <div className="bg-[#538d4e] rounded-[0.5px]" />
                          </div>
                          <span className="text-base font-black tracking-tight text-zinc-900 font-serif leading-none">Wordle</span>
                          <span className="text-[7px] text-zinc-600 font-serif font-bold mt-0.5">The New York Times Games</span>
                        </div>
                      ) : app.id === 'watch-together' ? (
                        <div className="flex items-center gap-1.5 select-none">
                          <svg className="w-8 h-6 fill-[#ff0000]" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                          <span className="text-lg font-black tracking-tighter text-zinc-900">YouTube</span>
                        </div>
                      ) : app.id === 'magic-garden' ? (
                        <div className="flex flex-col items-center justify-center text-center">
                          <span className="text-3xl filter drop-shadow">🎃</span>
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 drop-shadow">Magic Garden</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center">
                          <span className="text-3xl filter drop-shadow">🌽</span>
                          <span className="text-[10px] font-black uppercase tracking-wider text-pink-200 drop-shadow">Farm Merge Valley</span>
                        </div>
                      )}
                    </div>
                    {/* Footer */}
                    <div className="p-2.5 flex items-center gap-2">
                      <div className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-xs overflow-hidden", app.iconBg)}>
                        {app.id === 'wordle' ? (
                          <div className="w-4 h-4 grid grid-cols-3 gap-0.5 p-0.5 bg-black rounded-[2px]">
                            <div className="bg-[#538d4e]" />
                            <div className="bg-[#538d4e]" />
                            <div className="bg-[#538d4e]" />
                            <div className="bg-[#b59f3b]" />
                            <div className="bg-[#3a3a3c]" />
                            <div className="bg-[#538d4e]" />
                            <div className="bg-[#538d4e]" />
                            <div className="bg-[#538d4e]" />
                            <div className="bg-[#538d4e]" />
                          </div>
                        ) : app.id === 'watch-together' ? (
                          <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                        ) : (
                          app.icon
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-foreground block truncate">{app.title}</span>
                        <span className="text-[9px] text-muted-foreground block truncate">
                          {app.id === 'wordle' ? 'Play Wordle from New Yo...' : app.id === 'magic-garden' ? 'Garden with friends! Gro...' : app.id === 'farm-merge-valley' ? 'Farm Merge Valley' : app.developer}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Puzzle Games */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-foreground">Puzzle Games</span>
              <button
                type="button"
                onClick={() => toast.info('Menampilkan game puzzle')}
                className="text-xs text-primary hover:underline cursor-pointer"
              >
                View More
              </button>
            </div>
            <div className="space-y-1">
              {EXTENDED_DISCORD_APPS.filter((a) =>
                appsSearchQuery
                  ? a.title.toLowerCase().includes(appsSearchQuery.toLowerCase())
                  : a.group === 'Puzzle Games'
              ).map((app) => (
                <button
                  key={app.id}
                  onClick={() => {
                    onLaunchActivity(app.id);
                    onOpenChange(false);
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-accent/40 border border-transparent hover:border-border transition-all text-left cursor-pointer group"
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl shadow-md", app.iconBg)}>
                    {app.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors block truncate">
                      {app.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground line-clamp-1">
                      {app.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Card Games */}
          {!appsSearchQuery && (
            <div>
              <span className="text-xs font-bold text-foreground block mb-2">Card Games</span>
              <div className="space-y-1">
                {EXTENDED_DISCORD_APPS.filter((a) => a.group === 'Card Games').map((app) => (
                  <button
                    key={app.id}
                    onClick={() => {
                      onLaunchActivity(app.id);
                      onOpenChange(false);
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-accent/40 border border-transparent hover:border-border transition-all text-left cursor-pointer group"
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl shadow-md", app.iconBg)}>
                      {app.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors block truncate">
                        {app.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground line-clamp-1">
                        {app.description}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Productivity & Dev */}
          {!appsSearchQuery && (
            <div>
              <span className="text-xs font-bold text-foreground block mb-2">Productivity & Dev</span>
              <div className="space-y-1">
                {EXTENDED_DISCORD_APPS.filter((a) => a.group === 'Productivity & Dev').map((app) => (
                  <button
                    key={app.id}
                    onClick={() => {
                      onLaunchActivity(app.id);
                      onOpenChange(false);
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-accent/40 border border-transparent hover:border-border transition-all text-left cursor-pointer group"
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl shadow-md", app.iconBg)}>
                      {app.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors block truncate">
                        {app.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground line-clamp-1">
                        {app.description}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
