import React, { useState } from 'react';
import {
  Share2,
  Maximize2,
  X,
  Check,
  Sparkles,
  Menu,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { LAYOUT_PAGE_SPACING } from '@/lib/layout-constants';

export function YouTubeBadgeIcon({ className = 'w-5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
        fill="#FF0000"
      />
      <polygon fill="#FFFFFF" points="9.545,15.568 15.818,12 9.545,8.432" />
    </svg>
  );
}

export interface ActivityAppBarProps {
  app: {
    id: string;
    title: string;
    icon?: any;
    iconBg?: string;
  };
  onClose: () => void;
  onToggleTheaterMode?: () => void;
  onCopyLink?: () => void;
  isChatOpen?: boolean;
  onToggleChat?: () => void;
  onOpenMobileChannels?: () => void;
  horizontalPadding?: string;
  className?: string;
}

export function ActivityAppBar({
  app,
  onClose,
  onToggleTheaterMode,
  onCopyLink,
  isChatOpen,
  onToggleChat,
  onOpenMobileChannels,
  horizontalPadding = LAYOUT_PAGE_SPACING.HORIZONTAL,
  className,
}: ActivityAppBarProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (onCopyLink) {
      onCopyLink();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    const url = new URL(window.location.href);
    if (!url.searchParams.get('activity')) {
      url.searchParams.set('activity', app.id);
    }
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    toast.success(`Tautan aktivitas ${app.title} berhasil disalin!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const AppIcon = app.icon || Sparkles;
  const appTitle =
    app.id === 'anticeil-flow' ||
    app.id === 'anticeil-platform' ||
    app.id === 'platform' ||
    app.id === 'flow' ||
    app.title === 'Anticeil Platform'
      ? 'Anticeil Flow'
      : app.title;

  return (
    <div
      className={cn(
        'h-12 border-b border-sidebar-border flex items-center justify-between shrink-0 bg-background/95 backdrop-blur-md z-20 gap-2 select-none',
        horizontalPadding,
        className
      )}
    >
      {/* Left: Mobile Drawer Trigger + App Icon & Title */}
      <div className="flex items-center gap-2 min-w-0">
        {onOpenMobileChannels && (
          <button
            type="button"
            onClick={onOpenMobileChannels}
            className="md:hidden h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mr-0.5 cursor-pointer shrink-0"
            title="Buka Menu Sidebar"
            aria-label="Buka Menu Sidebar"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
        )}

        {app.id === 'watch-together' || app.id === 'youtube' ? (
          <YouTubeBadgeIcon className="w-5 h-3.5 shrink-0" />
        ) : (
          <div
            className={cn(
              'w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0 shadow-xs',
              app.iconBg || 'bg-primary'
            )}
          >
            <AppIcon className="w-3.5 h-3.5" />
          </div>
        )}
        <span className="text-sm font-bold text-foreground truncate max-w-[180px] sm:max-w-[280px]">
          {appTitle}
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <TooltipProvider delayDuration={150}>
          {onToggleChat && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onToggleChat}
                  className={cn(
                    'h-8 w-8 p-0 rounded-lg cursor-pointer transition-colors',
                    isChatOpen
                      ? 'bg-primary/15 text-primary hover:bg-primary/25'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-label={isChatOpen ? 'Sembunyikan Obrolan' : 'Buka Obrolan'}
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs font-semibold">
                {isChatOpen ? 'Sembunyikan Obrolan' : 'Buka Obrolan'}
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                aria-label="Salin Tautan Aktivitas"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs font-semibold">
              Salin Tautan Aktivitas
            </TooltipContent>
          </Tooltip>

          {onToggleTheaterMode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onToggleTheaterMode}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                  aria-label="Mode Sinematik (Layar Penuh)"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs font-semibold">
                Mode Sinematik (Layar Penuh)
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer ml-0.5"
                aria-label="Tutup Aktivitas"
              >
                <X className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs font-semibold">
              Tutup Aktivitas
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
