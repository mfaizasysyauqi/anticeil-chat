import React from 'react';
import {
  Menu,
  Volume2,
  MessagesSquare,
  Columns3,
  Hash,
  Lock,
  Users,
  UserRound,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ResponsiveSearchBar } from '@/components/ui/responsive-search-bar';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ThreadsPopover, type ChannelThreadItem } from '@/features/threads';
import { ChannelNotificationDropdown, type ChannelNotificationSettings } from './channel-notification-dropdown';
import { PinnedMessagesPopover } from './pinned-messages-popover';
import type { ColonyChannel, ColonyMessage } from '@/chat/chat-types';

export interface ChannelTopHeaderBarProps {
  activeChannel: ColonyChannel | null;
  channelPaddingClass?: string;
  isHome?: boolean;
  onOpenMobileChannels: () => void;
  // Threads props
  isThreadsPopoverOpen: boolean;
  setIsThreadsPopoverOpen: (open: boolean) => void;
  channelThreads: ChannelThreadItem[];
  threadSearchQuery: string;
  setThreadSearchQuery: (query: string) => void;
  onOpenCreateThreadModal: () => void;
  onSelectThread: (thread: ChannelThreadItem) => void;
  // Notification props
  isNotificationDropdownOpen: boolean;
  setIsNotificationDropdownOpen: (open: boolean) => void;
  channelNotification: ChannelNotificationSettings;
  onUpdateNotification: (
    level?: 'default' | 'all' | 'mentions' | 'nothing',
    isMuted?: boolean,
    duration?: string | null,
  ) => void;
  // Pinned messages props
  isPinnedPopoverOpen: boolean;
  setIsPinnedPopoverOpen: (open: boolean) => void;
  pinnedMessages: ColonyMessage[];
  onJumpToMessage: (msgId: string) => void;
  onTogglePin: (msgId: string) => void;
  // Member list props
  showMemberList: boolean;
  setShowMemberList: (show: boolean) => void;
  onOpenMobileMembers: () => void;
  // Search props
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  t: (key: string) => string;
}

export function ChannelTopHeaderBar({
  activeChannel,
  channelPaddingClass = 'px-4 lg:px-6',
  isHome = false,
  onOpenMobileChannels,
  isThreadsPopoverOpen,
  setIsThreadsPopoverOpen,
  channelThreads,
  threadSearchQuery,
  setThreadSearchQuery,
  onOpenCreateThreadModal,
  onSelectThread,
  isNotificationDropdownOpen,
  setIsNotificationDropdownOpen,
  channelNotification,
  onUpdateNotification,
  isPinnedPopoverOpen,
  setIsPinnedPopoverOpen,
  pinnedMessages,
  onJumpToMessage,
  onTogglePin,
  showMemberList,
  setShowMemberList,
  onOpenMobileMembers,
  searchQuery,
  setSearchQuery,
  t,
}: ChannelTopHeaderBarProps) {
  const isDmMode = Boolean(
    isHome ||
    activeChannel?.category === 'DIRECT MESSAGES' ||
    activeChannel?.isDirectMessage ||
    activeChannel?.id?.startsWith('dm-')
  );

  return (
    <div className={`h-12 border-b border-sidebar-border ${channelPaddingClass} flex items-center justify-between shrink-0 bg-background z-10`}>
      <div className="flex items-center gap-2 min-w-0">
        {/* Burger Menu Button (Visible only on Mobile: md:hidden) */}
        <button
          type="button"
          onClick={onOpenMobileChannels}
          className="md:hidden h-8 w-8 flex items-center justify-center rounded-md text-[#949ba4] hover:text-white hover:bg-white/10 transition-colors mr-0.5 cursor-pointer shrink-0"
          title={t('Buka Menu Sidebar')}
          aria-label={t('Buka Menu Sidebar')}
        >
          <Menu className="w-5 h-5" />
        </button>

        {activeChannel?.category === 'DIRECT MESSAGES' || activeChannel?.isDirectMessage ? (
          <span className="text-muted-foreground font-bold text-base shrink-0 select-none">@</span>
        ) : activeChannel?.type === 'voice' ? (
          <Volume2 className="w-5 h-5 text-muted-foreground shrink-0" />
        ) : activeChannel?.type === 'forum' ? (
          <MessagesSquare className="w-5 h-5 text-muted-foreground shrink-0" />
        ) : activeChannel?.type === 'kanban' ? (
          <Columns3 className="w-5 h-5 text-muted-foreground shrink-0" />
        ) : (
          <Hash className="w-5 h-5 text-muted-foreground shrink-0" />
        )}
        <span className="text-sm font-semibold truncate text-foreground flex items-center gap-1.5">
          {activeChannel ? activeChannel.name : t('Belum ada channel')}
          {activeChannel?.isPrivate && (
            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> Private
            </span>
          )}
        </span>

        {activeChannel?.description && (
          <>
            <Separator orientation="vertical" className="h-4 hidden sm:block mx-1" />
            <span className="text-xs text-muted-foreground truncate hidden sm:block max-w-[400px]">
              {activeChannel.description}
            </span>
          </>
        )}
      </div>

      {/* Top Bar Actions: Exactly Discord Signature (Threads, Bell, Pin, Member List / User Profile, Search) */}
      <div className="flex items-center gap-2">
        {/* 1. Threads Popover (Server channels only) */}
        {!isDmMode && (
          <ThreadsPopover
            open={isThreadsPopoverOpen}
            onOpenChange={setIsThreadsPopoverOpen}
            channelThreads={channelThreads}
            threadSearchQuery={threadSearchQuery}
            setThreadSearchQuery={setThreadSearchQuery}
            onOpenCreateThreadModal={onOpenCreateThreadModal}
            onSelectThread={onSelectThread}
          />
        )}

        {/* 2. Notification Settings Dropdown (Server channels only) */}
        {!isDmMode && (
          <ChannelNotificationDropdown
            open={isNotificationDropdownOpen}
            onOpenChange={setIsNotificationDropdownOpen}
            channelNotification={channelNotification}
            onUpdateNotification={onUpdateNotification}
          />
        )}

        {/* 3. Pinned Messages Popover */}
        <PinnedMessagesPopover
          isOpen={isPinnedPopoverOpen}
          onOpenChange={setIsPinnedPopoverOpen}
          pinnedMessages={pinnedMessages}
          onJumpToMessage={onJumpToMessage}
          onTogglePin={onTogglePin}
        />

        {/* 4. Member List Toggle (Server) / Show User Profile Toggle (DM / Friends mode) */}
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  onOpenMobileMembers();
                } else {
                  setShowMemberList(!showMemberList);
                }
              }}
              className={cn(
                'h-8 w-8 transition-colors cursor-pointer',
                showMemberList ? 'text-foreground bg-accent' : 'text-foreground/70 hover:text-foreground hover:bg-accent/60',
              )}
              title={
                isDmMode
                  ? showMemberList
                    ? t('Sembunyikan Profil Pengguna')
                    : t('Tampilkan Profil Pengguna')
                  : showMemberList
                  ? t('Sembunyikan Daftar Anggota')
                  : t('Tampilkan Daftar Anggota')
              }
              aria-label={
                isDmMode
                  ? showMemberList
                    ? t('Sembunyikan Profil Pengguna')
                    : t('Tampilkan Profil Pengguna')
                  : showMemberList
                  ? t('Sembunyikan Daftar Anggota')
                  : t('Tampilkan Daftar Anggota')
              }
            >
              {isDmMode ? <UserRound className="w-5 h-5" /> : <Users className="w-5 h-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={6} className="font-semibold text-xs">
            {isDmMode
              ? showMemberList
                ? t('Sembunyikan Profil Pengguna')
                : t('Tampilkan Profil Pengguna')
              : showMemberList
              ? t('Sembunyikan Daftar Anggota')
              : t('Tampilkan Daftar Anggota')}
          </TooltipContent>
        </Tooltip>

        {/* 5. Search Box */}
        <ResponsiveSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={activeChannel?.name ? `Search ${activeChannel.name}` : 'Search'}
          inputWidth="w-32 sm:w-40 md:w-48 transition-all duration-200 focus-within:w-56"
        />
      </div>
    </div>
  );
}
