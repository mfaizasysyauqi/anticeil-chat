import React from 'react';
import { Sparkles, Menu, Settings2, Trash2, Plus, Cpu } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { TopBarTabButton } from '@/components/ui/top-bar-tab-button';
import { TopBarActionButton } from '@/components/ui/top-bar-action-button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import { useTranslation } from '@/core/i18n';

export interface AiCommandCenterHeaderProps {
  onOpenSidebar?: () => void;
  horizontalPadding?: string;
  activeSessionTitle?: string;
  modelName: string;
  onOpenGroqSettings: () => void;
  onClearSessionMessages?: () => void;
  onCreateNewSession?: () => void;
  hasMessages?: boolean;
}

/**
 * Reusable, DRY AI Command Center App Bar Header
 * 100% consistent with FriendsHeader, QuestsHeader, AppsView, and ShopView.
 */
export function AiCommandCenterHeader({
  onOpenSidebar,
  horizontalPadding = CHANNEL_HORIZONTAL_PADDING,
  activeSessionTitle,
  modelName,
  onOpenGroqSettings,
  onClearSessionMessages,
  onCreateNewSession,
  hasMessages = false,
}: AiCommandCenterHeaderProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        'h-12 border-b border-sidebar-border flex items-center justify-between shrink-0 bg-background z-10 gap-2',
        horizontalPadding
      )}
    >
      {/* Left: Mobile Sidebar Trigger + Title & Icon (100% DRY like Friends & Quests) */}
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

        {/* Title & Icon: Hidden on mobile (<sm), shown on tablet & desktop */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <Sparkles className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm font-bold text-foreground">{t('AI Command Center')}</span>
        </div>

        <Separator orientation="vertical" className="hidden sm:block h-4 mx-1 shrink-0" />
      </div>

      {/* Center: Tabs with Reusable TopBarTabButton (100% DRY like Friends & Quests) */}
      <div className="flex-1 min-w-0 flex items-center gap-1 shrink-0 overflow-x-auto [scrollbar-width:none] px-1">
        <TopBarTabButton active={true}>
          <span>{t('Pusat Komando')}</span>
        </TopBarTabButton>

        {activeSessionTitle && (
          <TopBarTabButton
            active={false}
            className="max-w-[140px] sm:max-w-[200px]"
            title={activeSessionTitle}
          >
            <span className="truncate">{activeSessionTitle}</span>
          </TopBarTabButton>
        )}

        {/* Quick Model Badge Pill */}
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <TopBarTabButton
              active={false}
              onClick={onOpenGroqSettings}
              className="font-mono text-[11px] text-muted-foreground hover:text-foreground"
            >
              <Cpu className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="max-w-[110px] sm:max-w-[140px] truncate">{modelName}</span>
            </TopBarTabButton>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={6} className="font-semibold text-xs">
            {t('Klik untuk ganti model atau konfigurasi API Key Groq')}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Right: Actions & Primary Button placed at FAR RIGHT (100% DRY like Friends & Quests) */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Settings Button */}
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onOpenGroqSettings}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer"
              title={t('Pengaturan Mesin AI (Groq)')}
            >
              <Settings2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={6} className="font-semibold text-xs">
            {t('Pengaturan Mesin AI')}
          </TooltipContent>
        </Tooltip>

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

        {/* Primary Action Button: Sesi Baru placed at FAR RIGHT (Matches Tambah Teman 1:1) */}
        {onCreateNewSession && (
          <TopBarActionButton
            onClick={() => onCreateNewSession()}
            icon={<Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
            label={t('Sesi Baru')}
            shortLabel={t('Baru')}
            iconOnlyTablet={true}
            title={t('Mulai Sesi Percakapan Baru')}
          />
        )}
      </div>
    </div>
  );
}
