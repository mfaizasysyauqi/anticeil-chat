import React from 'react';
import {
  HelpCircle,
  Hash,
  Users,
  Sparkles,
  Store,
  Compass,
  Calendar,
  CheckSquare,
  PhoneCall,
  Bell,
  Mail,
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
 *  - Left: Subtle Anticeil branding / draggable region
 *  - Center: Current active context (Server name or Home page name)
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

  // Determine current context title and subtle icon
  let title = 'Anticeil';
  let IconNode: React.ReactNode = null;

  if (activeColony && !isHome) {
    title = activeColony.name || 'Server';
    IconNode = (
      <span className="size-3.5 rounded bg-primary/20 text-primary font-bold text-[9px] flex items-center justify-center shrink-0">
        {title.charAt(0).toUpperCase()}
      </span>
    );
  } else if (isAiCommandCenterView || homeView === 'ai') {
    title = 'Atlas Agent';
    IconNode = (
      <img src="/atlas.png" alt="Atlas" className="size-3.5 object-contain shrink-0" />
    );
  } else if (isFriendsView || homeView === 'friends') {
    title = t('Teman');
    IconNode = <Users className="size-3.5 text-muted-foreground shrink-0" />;
  } else if (homeView === 'apps') {
    title = t('Aplikasi & Aktivitas');
    IconNode = <Compass className="size-3.5 text-muted-foreground shrink-0" />;
  } else if (homeView === 'shop') {
    title = t('Shop Anticeil');
    IconNode = <Store className="size-3.5 text-muted-foreground shrink-0" />;
  } else if (homeView === 'quests') {
    title = t('Misi & Hadiah');
    IconNode = <Sparkles className="size-3.5 text-muted-foreground shrink-0" />;
  } else if (homeView === 'calendar') {
    title = t('Kalender');
    IconNode = <Calendar className="size-3.5 text-muted-foreground shrink-0" />;
  } else if (homeView === 'assignments') {
    title = t('Tugas Saya');
    IconNode = <CheckSquare className="size-3.5 text-muted-foreground shrink-0" />;
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
    IconNode = <Hash className="size-3.5 text-muted-foreground shrink-0" />;
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
        'h-7 min-h-[28px] max-h-[28px] w-full shrink-0 bg-background border-b border-border flex items-center justify-between select-none z-30 transition-colors',
        LAYOUT_PAGE_SPACING.HORIZONTAL,
        className
      )}
    >
      {/* Left: Window draggable spacing / subtle branding */}
      <div className="flex items-center gap-1.5 w-24 sm:w-48 shrink-0">
        <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground/60 hidden sm:inline">
          Anticeil
        </span>
      </div>

      {/* Center: Dynamic Active Page / Server Title (Matching Discord) */}
      <div className="flex-1 flex items-center justify-center min-w-0 px-2">
        <div className="flex items-center gap-1.5 max-w-full truncate py-0.5 px-2 rounded hover:bg-muted/30 transition-colors">
          {IconNode}
          <span className="text-[11px] font-semibold text-foreground/80 hover:text-foreground tracking-tight truncate">
            {title}
          </span>
        </div>
      </div>

      {/* Right: Global Actions (Inbox Popover & Help / Docs) */}
      <div className="flex items-center justify-end gap-1 w-24 sm:w-48 shrink-0">
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
      </div>
    </header>
  );
}

export default AppTopTitleBar;
