import React from 'react';
import { Users, MessageSquare, Sun, Moon, Globe, Menu } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { useTheme } from '@/core/theme';
import type { FriendsTab } from '../types';

interface FriendsHeaderProps {
  friendsTab: FriendsTab;
  onTabChange: (tab: FriendsTab) => void;
  onlineCount: number;
  allCount: number;
  pendingCount: number;
  onOpenDmSearch: () => void;
  onOpenSidebar?: () => void;
  horizontalPadding?: string;
}

export function FriendsHeader({
  friendsTab,
  onTabChange,
  onlineCount,
  allCount,
  pendingCount,
  onOpenDmSearch,
  onOpenSidebar,
  horizontalPadding = 'px-4',
}: FriendsHeaderProps) {
  const { t, locale, setLocale } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      className={`h-12 border-b border-sidebar-border ${horizontalPadding} flex items-center justify-between shrink-0 bg-background z-10`}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 overflow-x-auto [scrollbar-width:none]">
        {/* Burger Menu Button (Visible on Mobile & Tablet: lg:hidden) */}
        {onOpenSidebar && (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="lg:hidden h-8 w-8 flex items-center justify-center rounded-md text-[#949ba4] hover:text-white hover:bg-white/10 transition-colors mr-0.5 cursor-pointer shrink-0"
            title={t('Buka Menu Sidebar')}
            aria-label={t('Buka Menu Sidebar')}
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <Users className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm font-bold text-foreground">{t('Teman')}</span>
        </div>

        <Separator orientation="vertical" className="h-4 mx-1 shrink-0" />

        {/* Tabs: Online, Semua, Tertunda, Tambah Teman */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onTabChange('online')}
            className={cn(
              'px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5',
              friendsTab === 'online'
                ? 'bg-[#2b2d31]/80 text-white shadow-2xs'
                : 'text-muted-foreground hover:bg-[#1e1f22] hover:text-foreground'
            )}
          >
            <span>{t('Online')}</span>
            {onlineCount > 0 && (
              <span className="text-[10px] text-muted-foreground/70">({onlineCount})</span>
            )}
          </button>

          <button
            onClick={() => onTabChange('all')}
            className={cn(
              'px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5',
              friendsTab === 'all'
                ? 'bg-[#2b2d31]/80 text-white shadow-2xs'
                : 'text-muted-foreground hover:bg-[#1e1f22] hover:text-foreground'
            )}
          >
            <span>{t('Semua')}</span>
            {allCount > 0 && (
              <span className="text-[10px] text-muted-foreground/70">({allCount})</span>
            )}
          </button>

          <button
            onClick={() => onTabChange('pending')}
            className={cn(
              'px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5',
              friendsTab === 'pending'
                ? 'bg-[#2b2d31]/80 text-white shadow-2xs'
                : 'text-muted-foreground hover:bg-[#1e1f22] hover:text-foreground'
            )}
          >
            <span>{t('Tertunda')}</span>
            {pendingCount > 0 && (
              <span className="size-4 rounded-full bg-[#da373c] text-white text-[9px] font-bold flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('add')}
            className={cn(
              'px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer ml-1',
              friendsTab === 'add'
                ? 'bg-[#5865f2] text-white shadow-2xs'
                : 'bg-[#5865f2] hover:bg-[#4752c4] text-white'
            )}
          >
            {t('Tambah Teman')}
          </button>
        </div>
      </div>

      {/* Right Top Header Actions */}
      <div className="flex items-center gap-1.5">
        {/* Language switch */}
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <button
              onClick={() => setLocale(locale === 'id' ? 'en' : 'id')}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-[#1e1f22] transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="uppercase text-[10px]">{locale}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={6} className="font-semibold text-xs">
            {locale === 'id' ? 'Ganti ke English' : 'Switch to Bahasa Indonesia'}
          </TooltipContent>
        </Tooltip>

        {/* Theme toggle */}
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-[#1e1f22] transition-colors cursor-pointer"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={6} className="font-semibold text-xs">
            {theme === 'midnight'
              ? 'Mode: Discord Midnight'
              : theme === 'dark'
              ? 'Mode: Discord Dark'
              : 'Mode: Light'}
          </TooltipContent>
        </Tooltip>

        {/* Start new DM */}
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <button
              onClick={onOpenDmSearch}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-[#1e1f22] transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={6} className="font-semibold text-xs">
            {t('Mulai DM Baru')}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
