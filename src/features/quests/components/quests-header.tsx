import React from 'react';
import { Compass, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TopBarTabButton } from '@/components/ui/top-bar-tab-button';
import { ResponsiveSearchBar } from '@/components/ui/responsive-search-bar';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';

export interface QuestsHeaderProps {
  onOpenSidebar?: () => void;
  horizontalPadding?: string;
  activeTab: 'all' | 'claimed';
  onTabChange: (tab: 'all' | 'claimed') => void;
  claimedCount?: number;
  dewBalance?: number;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

/**
 * Reusable, DRY Quests App Bar Header
 * 100% consistent with FriendsHeader, AppsView, and ShopView.
 */
export function QuestsHeader({
  onOpenSidebar,
  horizontalPadding = CHANNEL_HORIZONTAL_PADDING,
  activeTab,
  onTabChange,
  claimedCount = 0,
  dewBalance = 0,
  searchQuery,
  onSearchChange,
}: QuestsHeaderProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        'sticky top-0 z-20 h-12 border-b border-sidebar-border flex items-center justify-between shrink-0 bg-background gap-2 overflow-hidden',
        horizontalPadding
      )}
    >
      {/* Left: Mobile Drawer Trigger + Title & Icon */}
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

        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <Compass className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm font-bold text-foreground">{t('Quests')}</span>
        </div>

        <Separator orientation="vertical" className="hidden sm:block h-4 mx-1 shrink-0" />
      </div>

      {/* Center: Tabs with Reusable TopBarTabButton */}
      <div className="flex-1 min-w-0 flex items-center gap-1 shrink-0 overflow-x-auto scrollbar-none px-1 touch-pan-x">
        <TopBarTabButton
          active={activeTab === 'all'}
          onClick={() => onTabChange('all')}
        >
          {t('All Quests')}
        </TopBarTabButton>

        <TopBarTabButton
          active={activeTab === 'claimed'}
          onClick={() => onTabChange('claimed')}
        >
          <span>{t('Claimed Quests')}</span>
          {claimedCount > 0 && (
            <span className="size-4 rounded-full bg-primary/20 text-primary border border-primary/40 text-[9px] font-black flex items-center justify-center">
              {claimedCount}
            </span>
          )}
        </TopBarTabButton>
      </div>

      {/* Right: Search Bar & F2P Dew Balance Chip (No Shop Button) */}
      <div className="flex items-center gap-2 shrink-0">
        {onSearchChange !== undefined && (
          <ResponsiveSearchBar
            value={searchQuery || ''}
            onChange={onSearchChange}
            placeholder={t('Cari quest...')}
            inputWidth="w-28 sm:w-36 md:w-44"
          />
        )}

        <div
          className="h-7 px-2.5 rounded-[4px] bg-muted/40 border border-border/60 flex items-center gap-1.5 text-xs font-bold text-cyan-400 select-none shrink-0"
          title={t('Dew adalah mata uang F2P eksklusif yang hanya bisa didapatkan dari Quest!')}
        >
          <span className="text-xs">💧</span>
          <span>{dewBalance.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
