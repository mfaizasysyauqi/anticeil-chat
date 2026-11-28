import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Hash,
  Users,
  Sparkles,
  Store,
  Compass,
  Calendar,
  Backpack,
  PhoneCall,
  Bell,
  Mail,
  Rocket,
  Volume2,
  Columns3,
  Minus,
  Square,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { InboxPopover } from '@/features/inbox';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { LAYOUT_PAGE_SPACING } from '@/lib/layout-constants';
import type { Colony, ColonyChannel } from '@/chat/chat-types';

export interface AppTopTitleBarProps {
  activeColony?: Colony | null;
  activeChannel?: ColonyChannel | null;
  homeView?: string;
  isHome?: boolean;
  isFriendsView?: boolean;
  isAiCommandCenterView?: boolean;
  onOpenDocs?: () => void;
  className?: string;
}

/**
 * Discord-style Top Global Title Bar
 * Sits at the very top of the window across the entire width.
 * Displays:
 *  - Left: Subtle Anticeil branding / draggable region (visible on all screens including mobile)
 *  - Center: Current active context (100% consistent text & icon matching the sidebar)
 *  - Right: Global Inbox Popover and Help / Docs trigger
 */
export function AppTopTitleBar({
  activeColony,
  activeChannel,
  homeView,
  isHome,
  isFriendsView,
  isAiCommandCenterView,
  onOpenDocs,
  className,
}: AppTopTitleBarProps) {
  const { t } = useTranslation();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // 1. Remove any legacy or duplicate window control DOM elements injected outside React
    const cleanupDuplicateControls = () => {
      const duplicate = document.getElementById('anticeil-titlebar-controls');
      if (duplicate) {
        duplicate.remove();
      }
    };
    cleanupDuplicateControls();
    const cleanupInterval = setInterval(cleanupDuplicateControls, 400);

    const checkDesktop = () => {
      cleanupDuplicateControls();
      const hasTauri = Boolean(
        (window as any).__TAURI_INTERNALS__ ||
        (window as any).__TAURI__ ||
        (window as any).__anticeil_window_action ||
        navigator.userAgent.includes('Tauri')
      );
      if (hasTauri) {
        setIsDesktop(true);
      }
    };
    checkDesktop();
    const timer = setTimeout(checkDesktop, 300);
    return () => {
      clearInterval(cleanupInterval);
      clearTimeout(timer);
    };
  }, []);

  const handleWinAction = async (action: 'minimize' | 'toggle_maximize' | 'close') => {
    if (typeof (window as any).__anticeil_window_action === 'function') {
      try {
        await (window as any).__anticeil_window_action(action);
        return;
      } catch (_) {}
    }
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      if (action === 'minimize') return await win.minimize();
      if (action === 'toggle_maximize') return await win.toggleMaximize();
      if (action === 'close') return await win.close();
    } catch (_) {}
    try {
      const invoke = (window as any).__TAURI_INTERNALS__?.invoke || (window as any).__TAURI__?.core?.invoke;
      if (invoke) {
        if (action === 'minimize') return await invoke('plugin:window|minimize', { label: 'main' });
        if (action === 'toggle_maximize') return await invoke('plugin:window|toggle_maximize', { label: 'main' });
        if (action === 'close') return await invoke('plugin:window|close', { label: 'main' });
      }
    } catch (_) {}
    try {
      const invoke = (window as any).__TAURI_INTERNALS__?.invoke || (window as any).__TAURI__?.core?.invoke;
      if (invoke) {
        if (action === 'minimize') return await invoke('minimize_window');
        if (action === 'toggle_maximize') return await invoke('toggle_maximize_window');
        if (action === 'close') return await invoke('close_window');
      }
    } catch (_) {}
  };

  // Determine current context title and icon (100% synchronized with sidebar navigation)
  let title = 'Anticeil';
  let IconNode: React.ReactNode = null;

  if (activeColony && !isHome) {
    if (activeChannel) {
      title = activeChannel.name;
      if (activeChannel.type === 'voice') {
        IconNode = <Volume2 className="size-3.5 text-muted-foreground shrink-0" />;
      } else if (activeChannel.type === 'kanban') {
        IconNode = <Columns3 className="size-3.5 text-muted-foreground shrink-0" />;
      } else {
        IconNode = <Hash className="size-3.5 text-muted-foreground shrink-0" />;
      }
    } else {
      title = activeColony.name || t('Server');
      IconNode = (
        <span className="size-3.5 rounded bg-primary/20 text-primary font-bold text-[9px] flex items-center justify-center shrink-0">
          {title.charAt(0).toUpperCase()}
        </span>
      );
    }
  } else if (isAiCommandCenterView || homeView === 'ai') {
    title = 'Atlas Agent';
    IconNode = (
      <img src="/atlas-head.png" alt="Atlas" className="size-3.5 object-contain shrink-0" />
    );
  } else if (isFriendsView || homeView === 'friends') {
    title = t('Teman');
    IconNode = <Users className="size-3.5 text-muted-foreground shrink-0" />;
  } else if (homeView === 'apps') {
    title = t('Aplikasi');
    IconNode = <Rocket className="size-3.5 text-muted-foreground shrink-0" />;
  } else if (homeView === 'colonies' || homeView === 'servers') {
    title = t('Colony');
    IconNode = <Compass className="size-3.5 text-muted-foreground shrink-0" />;
  } else if (homeView === 'shop') {
    title = t('Shop');
    IconNode = <Store className="size-3.5 text-muted-foreground shrink-0" />;
  } else if (homeView === 'quests') {
    title = t('Quests');
    IconNode = <Compass className="size-3.5 text-muted-foreground shrink-0" />;
  } else if (homeView === 'calendar') {
    title = t('Kalender');
    IconNode = <Calendar className="size-3.5 text-muted-foreground shrink-0" />;
  } else if (homeView === 'assignments') {
    title = t('Tugas Saya');
    IconNode = <Backpack className="size-3.5 text-muted-foreground shrink-0" />;
  } else if (homeView === 'calls') {
    title = t('Panggilan');
    IconNode = <PhoneCall className="size-3.5 text-muted-foreground shrink-0" />;
  } else if (homeView === 'message-requests') {
    title = t('Permintaan Pesan');
    IconNode = <Mail className="size-3.5 text-muted-foreground shrink-0" />;
  } else if (homeView === 'notifications') {
    title = t('Notifikasi');
    IconNode = <Bell className="size-3.5 text-muted-foreground shrink-0" />;
  } else if (activeChannel) {
    title = activeChannel.name;
    if (activeChannel.isGroupDm || activeChannel.id?.startsWith('gdm-')) {
      IconNode = <Users className="size-3.5 text-muted-foreground shrink-0" />;
    } else if (
      activeChannel.isDirectMessage ||
      activeChannel.id?.startsWith('dm-') ||
      activeChannel.category === 'DIRECT MESSAGES'
    ) {
      IconNode = <span className="text-muted-foreground font-bold text-xs shrink-0 select-none">@</span>;
    } else if (activeChannel.type === 'voice') {
      IconNode = <Volume2 className="size-3.5 text-muted-foreground shrink-0" />;
    } else if (activeChannel.type === 'kanban') {
      IconNode = <Columns3 className="size-3.5 text-muted-foreground shrink-0" />;
    } else {
      IconNode = <Hash className="size-3.5 text-muted-foreground shrink-0" />;
    }
  }

  const handleDocsClick = () => {
    if (onOpenDocs) {
      onOpenDocs();
    } else {
      window.open('https://anticeil.com/docs', '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <header
      role="banner"
      aria-label={t('Top Window Bar')}
      className={cn(
        'h-7 min-h-[28px] max-h-[28px] w-full shrink-0 bg-background border-b border-sidebar-border border-t-0 border-x-0 flex items-center justify-between select-none z-30 transition-colors',
        LAYOUT_PAGE_SPACING.HORIZONTAL,
        className
      )}
    >
      {/* Left: Window draggable spacing / subtle branding (always visible including on mobile) */}
      <div className="flex items-center gap-1.5 w-16 sm:w-48 shrink-0">
        <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground/60 select-none">
          Anticeil
        </span>
      </div>

      {/* Center: Dynamic Active Page / Server Title (Matching Discord & 100% consistent with Sidebar) */}
      <div className="flex-1 flex items-center justify-center min-w-0 px-1 sm:px-2">
        <div className="flex items-center gap-1.5 max-w-full truncate py-0.5 px-1.5 sm:px-2 rounded hover:bg-muted/30 transition-colors">
          {IconNode}
          <span className="text-[11px] font-semibold text-foreground/80 hover:text-foreground tracking-tight truncate">
            {title}
          </span>
        </div>
      </div>

      {/* Right: Global Actions (Inbox Popover, Help / Docs, and Desktop Window Controls) */}
      <div className="flex items-center justify-end gap-1 min-w-16 sm:min-w-48 shrink-0">
        {/* Global Inbox Popover */}
        <InboxPopover
          triggerClassName="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded"
        />

        {/* Global Help & Docs Trigger */}
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDocsClick}
              className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded cursor-pointer"
              aria-label={t('Bantuan & Dokumentasi (Docs)')}
            >
              <HelpCircle className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={6} className="font-semibold text-xs">
            {t('Bantuan & Dokumentasi (Docs)')}
          </TooltipContent>
        </Tooltip>

        {/* Desktop Frameless Window Controls (Minimize, Maximize, Close) */}
        {isDesktop && (
          <div
            className="anticeil-desktop-window-controls flex items-center h-full ml-1.5 pl-1.5 border-l border-border/40 shrink-0 no-drag select-none"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleWinAction('minimize');
              }}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label="Minimize"
              title="Minimize"
              className="h-7 w-7 inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors select-none cursor-pointer"
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
              <Minus className="size-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleWinAction('toggle_maximize');
              }}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label="Maximize"
              title="Maximize"
              className="h-7 w-7 inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors select-none cursor-pointer"
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
              <Square className="size-2.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleWinAction('close');
              }}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label="Close"
              title="Close"
              className="h-7 w-7 inline-flex items-center justify-center text-muted-foreground hover:text-white hover:bg-destructive transition-colors select-none cursor-pointer"
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
              <X className="size-3" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default AppTopTitleBar;
