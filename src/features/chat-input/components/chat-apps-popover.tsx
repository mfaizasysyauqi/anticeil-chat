import React, { useState, useEffect, useMemo } from 'react';
import { Search, Gamepad2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ANTICEIL_APPS, type VoiceAppDefinition } from '@/features/voice/data/voice-activities';
import { appsApi } from '@/features/apps/api/apps-api';

export interface ChatAppsPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appsSearchQuery: string;
  setAppsSearchQuery: (query: string) => void;
  onLaunchActivity: (activityId: string) => void;
  apps?: VoiceAppDefinition[];
}

export function ChatAppsPopover({
  open,
  onOpenChange,
  appsSearchQuery,
  setAppsSearchQuery,
  onLaunchActivity,
  apps: initialApps,
}: ChatAppsPopoverProps) {
  const [appList, setAppList] = useState<VoiceAppDefinition[]>(initialApps || ANTICEIL_APPS);

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

  const filteredApps = useMemo(() => {
    if (!appsSearchQuery.trim()) return appList;
    const q = appsSearchQuery.toLowerCase();
    return appList.filter(
      (app) =>
        app.title.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q) ||
        app.developer.toLowerCase().includes(q)
    );
  }, [appList, appsSearchQuery]);

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
              <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
                {appList.map((app) => {
                  const AppIcon = app.icon || Gamepad2;
                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => {
                        onLaunchActivity(app.id);
                        onOpenChange(false);
                      }}
                      className="w-12 h-12 rounded-xl bg-card border border-border hover:border-primary/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer shrink-0 group"
                      title={app.title}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center shadow-xs',
                          app.iconBg || 'bg-primary',
                          app.iconColor || 'text-white'
                        )}
                      >
                        <AppIcon className="w-4 h-4" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* List of Functional Apps */}
          <div>
            <span className="text-xs font-bold text-foreground block mb-2">
              {appsSearchQuery ? 'Hasil Pencarian' : 'Daftar Aktivitas Realtime'}
            </span>
            <div className="space-y-2">
              {filteredApps.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  Tidak ada aktivitas yang cocok dengan &quot;{appsSearchQuery}&quot;
                </div>
              ) : (
                filteredApps.map((app) => {
                  const AppIcon = app.icon || Gamepad2;
                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => {
                        onLaunchActivity(app.id);
                        onOpenChange(false);
                      }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-card hover:bg-accent/40 border border-border hover:border-border/80 transition-all text-left cursor-pointer group shadow-2xs"
                    >
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs',
                          app.iconBg || 'bg-primary',
                          app.iconColor || 'text-white'
                        )}
                      >
                        <AppIcon className="w-5 h-5" />
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
                  );
                })
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
