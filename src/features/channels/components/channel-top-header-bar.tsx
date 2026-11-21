import React from 'react';
import {
  Menu,
  Volume2,
  MessagesSquare,
  Columns3,
  Hash,
  Megaphone,
  Podcast,
  Lock,
  Users,
  UserRound,
  Search,
  Phone,
  Video,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarNavToggle } from '@/components/ui/sidebar-nav-toggle';
import { ResponsiveSearchBar } from '@/components/ui/responsive-search-bar';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
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
  // Call props
  onStartVoiceCall?: () => void;
  onStartVideoCall?: () => void;
  isCallActive?: boolean;
  onOpenEditChannel?: (channel: ColonyChannel) => void;
  // Search props
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  t: (key: string) => string;
}

export function ChannelTopHeaderBar({
  activeChannel,
  channelPaddingClass = CHANNEL_HORIZONTAL_PADDING,
  isHome = false,
  onOpenMobileChannels,
  onStartVoiceCall,
  onStartVideoCall,
  isCallActive = false,
  onOpenEditChannel,
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
    activeChannel?.isGroupDm ||
    activeChannel?.id?.startsWith('dm-') ||
    activeChannel?.id?.startsWith('gdm-')
  );

  return (
    <div className={`sticky top-0 z-20 h-12 border-b border-sidebar-border ${channelPaddingClass} flex items-center justify-between shrink-0 bg-background overflow-hidden`}>
      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2 overflow-hidden">
        {/* Responsive Sidebar Nav Toggle (Burger on Mobile/Tablet, PanelLeftOpen on Desktop when collapsed) */}
        <SidebarNavToggle onClick={onOpenMobileChannels} />

        {activeChannel?.isGroupDm ? (
          <Users className="w-5 h-5 text-muted-foreground shrink-0" />
        ) : activeChannel?.category === 'DIRECT MESSAGES' || activeChannel?.isDirectMessage ? (
          <span className="text-muted-foreground font-bold text-base shrink-0 select-none">@</span>
        ) : activeChannel?.type === 'voice' ? (
          <Volume2 className="w-5 h-5 text-muted-foreground shrink-0" />
        ) : activeChannel?.type === 'forum' ? (
          <MessagesSquare className="w-5 h-5 text-muted-foreground shrink-0" />
        ) : activeChannel?.type === 'kanban' ? (
          <Columns3 className="w-5 h-5 text-muted-foreground shrink-0" />
        ) : activeChannel?.type === 'announcement' || activeChannel?.isAnnouncement ? (
          <Megaphone className="w-5 h-5 text-muted-foreground shrink-0" />
        ) : activeChannel?.type === 'stage' ? (
          <Podcast className="w-5 h-5 text-muted-foreground shrink-0" />
        ) : (
          <Hash className="w-5 h-5 text-muted-foreground shrink-0" />
        )}
        <div
          onClick={() => {
            if (!isDmMode && activeChannel && onOpenEditChannel) {
              onOpenEditChannel(activeChannel);
            }
          }}
          className={cn(
            'flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden',
            !isDmMode && onOpenEditChannel && 'cursor-pointer hover:opacity-85 transition-opacity',
          )}
          title={!isDmMode && onOpenEditChannel ? t('Klik untuk membuka Pengaturan Channel') : undefined}
        >
          <span
            className="text-sm font-semibold text-foreground truncate min-w-0 block"
            title={activeChannel ? activeChannel.name : t('Belum ada channel')}
          >
            {activeChannel ? activeChannel.name : t('Belum ada channel')}
          </span>
          {activeChannel?.isGroupDm && activeChannel?.dmUserIds && activeChannel.dmUserIds.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold shrink-0 whitespace-nowrap">
              {activeChannel.dmUserIds.length} {t('Anggota')}
            </span>
          )}
          {activeChannel?.isPrivate && (
            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold flex items-center gap-1 shrink-0 whitespace-nowrap">
              <Lock className="w-2.5 h-2.5" /> Private
            </span>
          )}
        </div>
      </div>

      {/* Top Bar Actions: Exactly Discord Signature (Calls, E2EE, Threads, Bell, Pin, Member List / User Profile, Search) */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Channel Settings Button (Server channels) */}
        {!isDmMode && activeChannel && onOpenEditChannel && (
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenEditChannel(activeChannel)}
                className="h-8 w-8 text-foreground/70 hover:text-foreground hover:bg-accent/60 transition-colors cursor-pointer"
                title={t('Pengaturan Channel')}
                aria-label={t('Pengaturan Channel')}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="font-semibold text-xs">
              {t('Pengaturan Channel')}
            </TooltipContent>
          </Tooltip>
        )}
        {/* DM Voice Call Button */}
        {isDmMode && onStartVoiceCall && (
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onStartVoiceCall}
                className={cn(
                  'h-8 w-8 transition-colors cursor-pointer',
                  isCallActive ? 'text-emerald-500 bg-emerald-500/15' : 'text-foreground/70 hover:text-foreground hover:bg-accent/60'
                )}
                aria-label={t('Mulai Panggilan Suara')}
              >
                <Phone className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="font-semibold text-xs">
              {t('Mulai Panggilan Suara')}
            </TooltipContent>
          </Tooltip>
        )}

        {/* DM Video Call Button */}
        {isDmMode && onStartVideoCall && (
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onStartVideoCall}
                className={cn(
                  'h-8 w-8 transition-colors cursor-pointer',
                  isCallActive ? 'text-emerald-500 bg-emerald-500/15' : 'text-foreground/70 hover:text-foreground hover:bg-accent/60'
                )}
                aria-label={t('Mulai Panggilan Video')}
              >
                <Video className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="font-semibold text-xs">
              {t('Mulai Panggilan Video')}
            </TooltipContent>
          </Tooltip>
        )}

        {/* 1. Threads Popover (Server channels only) */}
        {!isDmMode && (
          <div className="hidden sm:inline-flex">
            <ThreadsPopover
              open={isThreadsPopoverOpen}
              onOpenChange={setIsThreadsPopoverOpen}
              channelThreads={channelThreads}
              threadSearchQuery={threadSearchQuery}
              setThreadSearchQuery={setThreadSearchQuery}
              onOpenCreateThreadModal={onOpenCreateThreadModal}
              onSelectThread={onSelectThread}
            />
          </div>
        )}

        {/* 2. Notification Settings Dropdown (Server channels only) */}
        {!isDmMode && (
          <div className="hidden sm:inline-flex">
            <ChannelNotificationDropdown
              open={isNotificationDropdownOpen}
              onOpenChange={setIsNotificationDropdownOpen}
              channelNotification={channelNotification}
              onUpdateNotification={onUpdateNotification}
            />
          </div>
        )}

        {/* 3. Pinned Messages Popover */}
        <div className="hidden sm:inline-flex">
          <PinnedMessagesPopover
            isOpen={isPinnedPopoverOpen}
            onOpenChange={setIsPinnedPopoverOpen}
            pinnedMessages={pinnedMessages}
            onJumpToMessage={onJumpToMessage}
            onTogglePin={onTogglePin}
          />
        </div>

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
                activeChannel?.isGroupDm
                  ? showMemberList
                    ? t('Sembunyikan Anggota Grup')
                    : t('Tampilkan Anggota Grup')
                  : isDmMode
                  ? showMemberList
                    ? t('Sembunyikan Profil Pengguna')
                    : t('Tampilkan Profil Pengguna')
                  : showMemberList
                  ? t('Sembunyikan Daftar Anggota')
                  : t('Tampilkan Daftar Anggota')
              }
              aria-label={
                activeChannel?.isGroupDm
                  ? showMemberList
                    ? t('Sembunyikan Anggota Grup')
                    : t('Tampilkan Anggota Grup')
                  : isDmMode
                  ? showMemberList
                    ? t('Sembunyikan Profil Pengguna')
                    : t('Tampilkan Profil Pengguna')
                  : showMemberList
                  ? t('Sembunyikan Daftar Anggota')
                  : t('Tampilkan Daftar Anggota')
              }
            >
              {isDmMode && !activeChannel?.isGroupDm ? (
                <UserRound className="w-5 h-5" />
              ) : (
                <Users className="w-5 h-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={6} className="font-semibold text-xs">
            {activeChannel?.isGroupDm
              ? showMemberList
                ? t('Sembunyikan Anggota Grup')
                : t('Tampilkan Anggota Grup')
              : isDmMode
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
