import React from 'react';
import { Sparkles, Menu, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import { useTranslation } from '@/core/i18n';

export interface AiCommandCenterHeaderProps {
  onOpenSidebar?: () => void;
  horizontalPadding?: string;
  activeSessionTitle?: string;
  modelName?: string;
  onOpenGroqSettings?: () => void;
  onClearSessionMessages?: () => void;
  onCreateNewSession?: () => void;
  hasMessages?: boolean;
}

/**
 * Clean AI Command Center App Bar Header
 * Minimal, symmetric, and distraction-free.
 */
export function AiCommandCenterHeader({
  onOpenSidebar,
  horizontalPadding = CHANNEL_HORIZONTAL_PADDING,
  onClearSessionMessages,
  hasMessages = false,
}: AiCommandCenterHeaderProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        'sticky top-0 z-20 h-12 border-b border-sidebar-border flex items-center justify-between shrink-0 bg-background gap-2 overflow-hidden',
        horizontalPadding
      )}
    >
      {/* Left: Mobile Sidebar Trigger + Title & Icon */}
      <div className="flex items-center gap-2 shrink-0">
        {onOpenSidebar && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onOpenSidebar}
            className="md:hidden sidebar-toggle-btn h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer shrink-0"
            title={t('Buka Menu Sidebar')}
            aria-label={t('Buka Menu Sidebar')}
          >
            <Menu className="w-5 h-5" />
          </Button>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <Sparkles className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm font-bold text-foreground">{t('AI Command Center')}</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Clear Conversation Button */}
        {hasMessages && onClearSessionMessages && (
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onClearSessionMessages}
                className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-accent/50 cursor-pointer"
                title={t('Bersihkan Percakapan Sesi Ini')}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="font-semibold text-xs">
              {t('Bersihkan Percakapan')}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
