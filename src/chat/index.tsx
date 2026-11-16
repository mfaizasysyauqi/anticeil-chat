import { useAuthSession } from '@/features/auth';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { useTranslation } from '@/core/i18n';
import { useTheme } from '@/core/theme';
import { useResponsive } from '@/core';
import {
  ColonyRail,
  useColonyModals,
} from '@/features/colonies';
import { UserBottomDock, DmUserProfileSidebar } from '@/features/profile';
import { FriendsView, AddFriendDialog, useFriendsManager } from '@/features/friends';
import { type MessageRequestItem, useMessageRequests } from '@/features/message-requests';
import { type NotificationItem, useNotifications } from '@/features/notifications';
import { useCalendarEvents } from '@/features/calendar';
import { ColonyEventsModal } from '@/features/events';
import { useAssignments } from '@/features/assignments';
import { useCallLogs } from '@/features/calls';
import { type KanbanCard } from '@/features/kanban';
import {
  ChannelsSidebar,
  useResizableSidebar,
  useChannelModals,
  useChannelPinsNotifications,
} from '@/features/channels';
import { ColonyMembersSidebar } from '@/features/members';
import {
  processFileInput,
} from '@/features/chat-input';
import { renderFormattedMessage, useColonySocket, ChatDialogsPortal } from '@/features/chat';
import { useMediaModals } from '@/features/media';
import { ChatDesktopSidebar } from './components/chat-desktop-sidebar';
import { ChatMobileDrawers } from './components/chat-mobile-drawers';
import { ChatMainView } from './components/chat-main-view';
import { useActivityLauncher } from './hooks/use-activity-launcher';
import { useMessageActions } from './hooks/use-message-actions';
import { useThreadManager } from './hooks/use-thread-manager';
import { useUrlSync } from './hooks/use-url-sync';
import { useColonyData } from './hooks/use-colony-data';
import { useChatNavigation } from './hooks/use-chat-navigation';
import { useChatMembers } from './hooks/use-chat-members';
import { useChatInitLoader, authenticationSession } from './hooks/use-chat-init-loader';

const LockedFeatureGuard: any = ({ children }: any) => <>{children}</>;
const userMutations: any = {
  useUpdateUser: () => ({ mutateAsync: async () => {}, mutate: () => {} }),
  useUpdateName: (opts?: any) => ({
    mutateAsync: async (data: any) => opts?.onSuccess?.(data),
    mutate: (data: any) => opts?.onSuccess?.(data),
  }),
  useUpdateUsername: (opts?: any) => ({
    mutateAsync: async (data: any) => opts?.onSuccess?.(data),
    mutate: (data: any) => opts?.onSuccess?.(data),
  }),
};
const userHooks: any = {
  useCurrentUser: () => ({ data: null }),
  invalidateCurrentUser: async (_client?: any) => {},
};
const queryClient: any = {
  invalidateQueries: async () => {},
};

import { useSocket } from '@/providers/socket-provider';
import { useVoiceCallState } from '@/features/voice';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import { colonyApi } from './chat-api';
import { DEFAULT_COLONIES, saveStoredColonies } from './chat-defaults';
import type {
  ColonyAttachment,
  Colony,
  ColonyMessage,
} from './chat-types';

export function ColonyPage() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [isAddFriendDialogOpen, setIsAddFriendDialogOpen] = useState(false);
  const openCreateColonyRef = useRef<() => void>(() => {});

  // ── 1. Colony & Channel Data Hook ──────────────────────────────────
  const {
    colonies,
    setColonies,
    activeColonyId,
    setActiveColonyId,
    channels,
    setChannels,
    activeChannelId,
    setActiveChannelId,
    members,
    setMembers,
    activeColony,
  } = useColonyData({
    onOpenCreateColony: () => openCreateColonyRef.current?.(),
    onOpenAddFriend: () => setIsAddFriendDialogOpen(true),
  });

  // ── 2. Auth & Session Hook ─────────────────────────────────────────
  const {
    currentUser,
    isAuthRequiredOpen,
    setIsAuthRequiredOpen,
    authFeatureInfo,
    setAuthFeatureInfo,
    requireAuth,
    handleLogout,
    handleGoogleSignIn,
    handleDevMockLogin,
  } = useAuthSession({
    t,
    onResetAppState: () => {
      setColonies(DEFAULT_COLONIES);
      setChannels([]);
      setMembers([]);
      setMessagesMap({});
      setActiveColonyId('anticeil');
      setActiveChannelId('');
    },
  });

  const platform: any = { name: 'Anticeil', plan: { plan: 'plus' } };
  const isPlusOrAbove = true;
  const socket = useSocket();

  // ── 3. Voice & Call State Hook ─────────────────────────────────────
  const {
    activeCallChannelId,
    setActiveCallChannelId,
    isCallPiP,
    setIsCallPiP,
    isActivityOpen,
    setIsActivityOpen,
    activeCallCounts,
    setActiveCallCounts,
    selectedActivityAppId,
    setSelectedActivityAppId,
    appsSearchQuery,
    setAppsSearchQuery,
  } = useVoiceCallState({ socket });

  const [replyingToMessage, setReplyingToMessage] = useState<ColonyMessage | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, ColonyMessage[]>>({});

  const [unreadCounts, setUnreadCounts] = useState<Record<string, number | string>>(() => ({
    anticeil: 3,
    hub_general: 47,
    hub_gaming: 167,
    hub_dev: 353,
    hub_anime: 651,
    hub_crypto: 87,
    hub_music: 743,
    hub_study: 512,
  }));

  const [homeView, setHomeView] = useState<
    'friends' | 'colonies' | 'servers' | 'message-requests' | 'notifications' | 'calendar' | 'assignments' | 'calls' | 'apps'
  >('friends');

  // Feature-First Subsystem Hooks
  const {
    events: calendarEvents,
    handleCreateEvent: createCalendarEvent,
  } = useCalendarEvents();
  const [isColonyEventsModalOpen, setIsColonyEventsModalOpen] = useState(false);

  const { assignments, setAssignments, handleToggleComplete } = useAssignments();
  const { calls: callLogs, handleCreateCallLog } = useCallLogs();
  const {
    requests: messageRequests,
    handleAccept: handleAcceptMessageRequestRaw,
    handleIgnore: handleIgnoreMessageRequest,
    handleSpam: handleReportSpamMessageRequest,
  } = useMessageRequests();

  const {
    notifications,
    handleMarkAsRead: handleMarkNotificationRead,
    handleMarkAllAsRead: handleMarkAllNotificationsRead,
  } = useNotifications();

  const unreadNotifCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  useEffect(() => {
    setUnreadCounts((prev) => {
      if (prev.anticeil === unreadNotifCount) return prev;
      return { ...prev, anticeil: unreadNotifCount };
    });
  }, [unreadNotifCount]);

  // ── 4. URL Sync Hook ───────────────────────────────────────────────
  useUrlSync({
    activeColonyId,
    activeChannelId,
    selectedActivityAppId,
    channelsCount: channels.length,
    isActivityOpen,
  });

  const [inputText, setInputText] = useState('');
  const [stagedAttachment, setStagedAttachment] = useState<ColonyAttachment | null>(null);
  const [showMemberList, setShowMemberList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTemplatePopoverOpen, setIsTemplatePopoverOpen] = useState(false);

  // Colony Modals Hook
  const colonyModals = useColonyModals({
    colonies,
    setColonies,
    channels,
    setChannels,
    activeColony,
    setActiveColonyId,
    setActiveChannelId,
    setActiveCallChannelId,
    setIsCallPiP,
    setSelectedActivityAppId,
    setIsActivityOpen,
    setMembers,
    t,
  });
  const {
    setIsCreateHubOpen,
    setColonyToEdit,
    setColonyToDelete,
    setIsInviteOpen,
    setIsServerSettingsOpen,
    setColonySettingsSection,
    handleJoinColony,
  } = colonyModals;

  openCreateColonyRef.current = () => setIsCreateHubOpen(true);

  // Channel Modals Hook
  const channelModals = useChannelModals({
    activeColonyId,
    channels,
    setChannels,
    activeChannelId,
    setActiveChannelId,
    t,
  });
  const {
    setIsCreateChannelOpen,
    setNewChannelCategory,
    setNewChannelType,
    handleOpenEditChannel,
  } = channelModals;

  // Media Modals Hook
  const mediaModals = useMediaModals({ activeColony });
  const {
    isMediaPickerOpen,
    setIsMediaPickerOpen,
    activeMediaTab,
    setActiveMediaTab,
    mediaSearchQuery,
    setMediaSearchQuery,
    selectedGifCategory,
    setSelectedGifCategory,
    serverDbEmojis,
    serverDbStickers,
    setIsQuickAddEmojiOpen,
    setIsQuickAddStickerOpen,
  } = mediaModals;

  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [claimedGifts, setClaimedGifts] = useState<Record<string, boolean>>({});

  // ── 5. Navigation Resolution Hook ──────────────────────────────────
  const {
    colonyChannels,
    dmChannels,
    isHome,
    activeChannel,
  } = useChatNavigation({
    channels,
    activeColonyId,
    activeChannelId,
    currentUser,
    members,
    activeCallChannelId,
    setActiveCallChannelId,
    setIsCallPiP,
  });

  // Channel Pins & Notifications Hook
  const {
    isPinnedPopoverOpen,
    setIsPinnedPopoverOpen,
    pinnedMessages,
    setPinnedMessages,
    isNotificationDropdownOpen,
    setIsNotificationDropdownOpen,
    channelNotification,
    setChannelNotification,
    handleUpdateNotification,
  } = useChannelPinsNotifications({ activeChannel });

  // Thread Manager Hook
  const {
    isThreadsPopoverOpen,
    setIsThreadsPopoverOpen,
    channelThreads,
    setChannelThreads,
    threadSearchQuery,
    setThreadSearchQuery,
    isCreateThreadModalOpen,
    setIsCreateThreadModalOpen,
    newThreadName,
    setNewThreadName,
    newThreadInitialMsg,
    setNewThreadInitialMsg,
    activeThread,
    setActiveThread,
    threadMessages,
    threadInputText,
    setThreadInputText,
    isThreadDrawerOpen,
    setIsThreadDrawerOpen,
    forumSearchQuery,
    setForumSearchQuery,
    forumSort,
    setForumSort,
    isForumComposerOpen,
    setIsForumComposerOpen,
    forumNewTitle,
    setForumNewTitle,
    forumNewMessage,
    setForumNewMessage,
    isSubmittingForumPost,
    threadsMap,
    setThreadsMap,
    handleCreateThread,
    handleSendThreadMessage,
    handleCreateForumPost,
  } = useThreadManager({
    activeChannel,
    activeChannelId,
    currentUser,
    t,
  });

  const [collapsedCategories, setCollapsedCategories] = useState<{
    text: boolean;
    voice: boolean;
    forum: boolean;
  }>({
    text: false,
    voice: false,
    forum: false,
  });

  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  const {
    sidebarWidth,
    isResizingSidebar,
    handleSidebarResizeStart,
    handleSidebarResizeReset,
  } = useResizableSidebar();

  const [isMobileChannelsOpen, setIsMobileChannelsOpen] = useState(false);
  const [isMobileMembersOpen, setIsMobileMembersOpen] = useState(false);

  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [userSettingsInitialSection, setUserSettingsInitialSection] = useState<string>('account');
  const handleOpenUserSettings = (section: string = 'account') => {
    setUserSettingsInitialSection(section);
    setIsUserSettingsOpen(true);
  };

  const [isDmSearchOpen, setIsDmSearchOpen] = useState(false);
  const [dmSearchQuery, setDmSearchQuery] = useState('');

  useEffect(() => {
    const handleToggleMobileChannels = () => {
      setIsMobileChannelsOpen((prev) => !prev);
    };
    window.addEventListener('anticeil_toggle_mobile_channels', handleToggleMobileChannels);
    return () => {
      window.removeEventListener('anticeil_toggle_mobile_channels', handleToggleMobileChannels);
    };
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── 6. WebSocket Hook ──────────────────────────────────────────────
  useColonySocket({
    socket,
    activeChannelId,
    setMessagesMap,
    setChannels,
    setActiveChannelId,
    setActiveCallCounts,
  });

  // ── 7. Initial Data Loader Hook ────────────────────────────────────
  useChatInitLoader({
    currentUser,
    activeColonyId,
    activeChannelId,
    colonyChannels,
    members,
    activeCallCounts,
    setChannels,
    setMembers,
    setColonies,
    setActiveColonyId,
    setActiveChannelId,
    setActiveCallChannelId,
    setIsCallPiP,
    setSelectedActivityAppId,
    setIsActivityOpen,
    setMessagesMap,
    setPinnedMessages,
    setChannelNotification,
    setChannelThreads,
    setThreadsMap,
    handleJoinColony,
  });

  // View Mode Helpers
  const isFriendsView = isHome && !activeChannel && homeView === 'friends';
  const isMessageRequestsView = isHome && !activeChannel && homeView === 'message-requests';
  const isNotificationsView = isHome && !activeChannel && homeView === 'notifications';
  const isCalendarView = isHome && !activeChannel && homeView === 'calendar';
  const isAssignmentsView = isHome && !activeChannel && homeView === 'assignments';
  const isCallsView = isHome && !activeChannel && homeView === 'calls';
  const isAppsView = isHome && !activeChannel && homeView === 'apps';
  const isColoniesView = isHome && !activeChannel && (homeView === 'colonies' || homeView === 'servers');

  const currentMessages = activeChannel ? messagesMap[activeChannel.id] || [] : [];
  const filteredMessages = searchQuery.trim()
    ? currentMessages.filter(
        (m) =>
          m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.senderName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : currentMessages;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!activeChannelId) return;
    setReplyingToMessage(null);
    const unreadCount = activeChannel?.unreadCount || 0;
    if (unreadCount > 0) {
      requestAnimationFrame(() => {
        const divider = document.getElementById('discord-unread-divider');
        if (divider) {
          divider.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          scrollToBottom();
        }
      });
    } else {
      scrollToBottom();
    }
  }, [activeChannelId]);

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages.length]);

  // Message Actions Hook
  const {
    handleSendMessage,
    handleScheduleMessage,
    handleCreatePoll,
    handleSendSticker,
    handleSendGif,
    handleSendGift,
    handleSelectEmoji,
    handleDeleteMessage,
    handleToggleReaction,
    handleTogglePin,
    handleJumpToMessage,
  } = useMessageActions({
    currentUser,
    activeChannel,
    activeColony,
    members,
    replyingToMessage,
    setReplyingToMessage,
    inputText,
    setInputText,
    stagedAttachment,
    setStagedAttachment,
    messagesMap,
    setMessagesMap,
    setPinnedMessages,
    setIsMediaPickerOpen,
    setIsGiftModalOpen,
    setIsPinnedPopoverOpen,
    setAuthFeatureInfo,
    setIsAuthRequiredOpen,
    createCalendarEvent,
    t,
  });

  // Activity Launcher Hook
  const { handleLaunchActivity } = useActivityLauncher({
    channels,
    setChannels,
    dmChannels,
    activeChannel,
    activeCallChannelId,
    activeColonyId,
    activeColony,
    currentUser,
    members,
    socket,
    t,
    setSelectedActivityAppId,
    setIsTemplatePopoverOpen,
    setActiveColonyId,
    setActiveChannelId,
    setActiveCallChannelId,
    setIsCallPiP,
    setIsActivityOpen,
    setMessagesMap,
  });

  const updateNameMutation = userMutations.useUpdateName({
    onSuccess: (data: any) => {
      userHooks.invalidateCurrentUser(queryClient);
      const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email;
      toast.success(t(`Nama tampilan berhasil diperbarui menjadi ${fullName}! 🎉`));
      setMembers((prev) =>
        prev.map((m) =>
          m.id === currentUser?.id || m.email === currentUser?.email
            ? { ...m, name: fullName }
            : m,
        ),
      );
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || t('Gagal mengubah nama tampilan.');
      toast.error(msg);
    },
  });

  const updateUsernameMutation = userMutations.useUpdateUsername({
    onSuccess: (data: any) => {
      userHooks.invalidateCurrentUser(queryClient);
      toast.success(t(`Username berhasil diperbarui menjadi @${data.username}! 🎉`));
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || t('Gagal mengubah username.');
      toast.error(msg);
    },
  });

  // ── 8. Members & DM Sync Hook ──────────────────────────────────────
  const friends = useFriendsManager({
    displayMembers: members,
    currentUser,
    members,
    dmChannels,
    t,
  });

  const {
    currentUserName,
    displayMembers,
    handleStartDM,
    allKnownMembers,
    isDmMode,
    activeDmUserId,
    activeDmMember,
  } = useChatMembers({
    members,
    currentUser,
    activeColony,
    activeChannel,
    isHome,
    friendsList: friends.allFriends,
    setChannels,
    setActiveColonyId,
    setActiveChannelId,
    setHomeView,
    setIsMobileChannelsOpen,
    setIsMobileMembersOpen,
  });

  const handleKanbanCardsUpdate = useCallback((cards: KanbanCard[]) => {
    if (!activeChannel?.id) return;
    setAssignments((prev) => {
      const otherCards = prev.filter((c) => c.channelId !== activeChannel.id);
      return [...cards, ...otherCards];
    });
  }, [activeChannel?.id, setAssignments]);

  const handleAcceptMessageRequest = (item: MessageRequestItem) => {
    handleAcceptMessageRequestRaw(item);
    handleStartDM({
      id: item.userId,
      name: item.name,
      username: item.username,
      avatar: item.avatar,
    } as any);
  };

  const handleJumpToNotification = (item: NotificationItem) => {
    handleMarkNotificationRead(item.id);
    if (item.colonyId && item.colonyId !== activeColonyId) {
      setActiveColonyId(item.colonyId);
    }
    setActiveChannelId(item.channelId);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFileInput(e, setStagedAttachment);
  };

  const [railMode, setRailMode] = useState<'servers' | 'friends'>(() => {
    try {
      return (localStorage.getItem('anticeil_rail_mode') as any) || 'servers';
    } catch {
      return 'servers';
    }
  });

  const handleToggleRailMode = () => {
    setRailMode((prev) => {
      const next = prev === 'servers' ? 'friends' : 'servers';
      try {
        localStorage.setItem('anticeil_rail_mode', next);
      } catch {}
      if (next === 'friends') {
        setActiveColonyId('anticeil');
        setActiveChannelId('');
        setHomeView('friends');
      } else {
        setActiveColonyId('anticeil');
        setActiveChannelId('');
        setHomeView('colonies');
      }
      toast.info(next === 'friends' ? t('Beralih ke Mode Teman') : t('Beralih ke Mode Colony'));
      return next;
    });
  };

  // Component: Server Rail
  const renderDiscordHubRail = () => (
    <ColonyRail
      servers={colonies}
      activeServerId={activeColonyId}
      unreadCounts={unreadCounts}
      onSelectServer={(id) => {
        if (id !== 'anticeil') {
          setUnreadCounts((prev) => ({ ...prev, [id]: 0 }));
        }
        if (id !== 'anticeil' && !currentUser) {
          setAuthFeatureInfo({
            title: t('Akses Colony'),
            desc: t('Masuk ke Anticeil untuk mengakses saluran dan mengobrol di colony ini.'),
          });
          setIsAuthRequiredOpen(true);
          return;
        }
        setActiveColonyId(id);
        if (id === 'anticeil') {
          setActiveChannelId('');
        } else {
          const firstCh = channels.find(
            (c) => (c.colonyId || 'anticeil') === id && c.category === 'CHANNELS',
          );
          setActiveChannelId(firstCh?.id || '');
        }
      }}
      onOpenCreateServer={() =>
        requireAuth(
          () => setIsCreateHubOpen(true),
          t('Buat Colony Komunitas'),
          t('Masuk ke Anticeil untuk membuat colony komunitas Anda sendiri.'),
        )
      }
      platformName={platform?.name}
      railMode={railMode}
      onToggleRailMode={handleToggleRailMode}
      friends={friends.allFriends}
      activeChannelId={activeChannelId}
      onSelectFriend={(f) => {
        setUnreadCounts((prev) => ({ ...prev, [f.id]: 0, [`dm-${f.id}`]: 0 }));
        handleStartDM(f);
      }}
      onOpenAddFriend={() =>
        requireAuth(
          () => setIsAddFriendDialogOpen(true),
          t('Tambah Teman Baru'),
          t('Masuk ke Anticeil untuk menambahkan teman baru.'),
        )
      }
    />
  );

  // Component: Channels Sidebar Content
  const renderChannelsSidebarContent = (onItemClick?: () => void) => (
    <ChannelsSidebar
      currentUser={currentUser}
      isHome={isHome}
      activeColony={activeColony}
      channels={channels}
      activeChannelId={activeChannelId}
      setActiveChannelId={setActiveChannelId}
      activeCallChannelId={activeCallChannelId}
      setActiveCallChannelId={setActiveCallChannelId}
      isFriendsView={isFriendsView}
      homeView={homeView}
      setHomeView={setHomeView}
      messageRequestsCount={messageRequests.filter((r) => !r.isSpam).length}
      unreadNotificationsCount={unreadCounts?.['anticeil'] ?? unreadNotifCount}
      setFriendsTab={friends.setFriendsTab}
      friendRequests={friends.friendRequests}
      dmChannels={dmChannels}
      members={allKnownMembers}
      collapsedCategories={collapsedCategories}
      setCollapsedCategories={setCollapsedCategories}
      threadsMap={threadsMap}
      channelThreads={channelThreads}
      activeThread={activeThread}
      setActiveThread={setActiveThread}
      activeCallCounts={activeCallCounts}
      calendarEvents={calendarEvents}
      onOpenServerEvents={() => setIsColonyEventsModalOpen(true)}
      categories={channelModals.categories}
      onOpenCreateCategory={() => channelModals.setIsCreateCategoryOpen(true)}
      onDeleteCategory={channelModals.handleDeleteCategory}
      onUpdateCategory={channelModals.handleUpdateCategory}
      onMoveChannelCategory={channelModals.handleMoveChannelCategory}
      onItemClick={onItemClick}
      onOpenDmSearch={() =>
        requireAuth(
          () => {
            setIsDmSearchOpen(true);
            setDmSearchQuery('');
          },
          t('Cari Percakapan'),
          t('Masuk ke Anticeil untuk memulai obrolan langsung.'),
        )
      }
      onOpenInvite={() =>
        requireAuth(
          () => setIsInviteOpen(true),
          t('Undang Teman'),
          t('Masuk untuk membagikan tautan undangan colony.'),
        )
      }
      onOpenServerSettings={(section) => {
        requireAuth(() => {
          if (section) setColonySettingsSection(section);
          setIsServerSettingsOpen(true);
        });
      }}
      onOpenCreateChannel={(category, type = 'text', categoryId) => {
        requireAuth(
          () => {
            setNewChannelCategory(category as any);
            setNewChannelType(type);
            channelModals.setTargetCategoryId(categoryId || '');
            setIsCreateChannelOpen(true);
          },
          t('Buat Saluran'),
          t('Masuk ke Anticeil untuk membuat saluran obrolan atau panggilan suara.'),
        );
      }}
      onOpenCreateColony={() =>
        requireAuth(
          () => setIsCreateHubOpen(true),
          t('Buat Colony'),
          t('Masuk ke Anticeil untuk membuat colony komunitas.'),
        )
      }
      onOpenEditChannel={(ch) => handleOpenEditChannel(ch)}
      onUpdateColonyIcon={async (file) => {
        if (!activeColony) return;
        if (file.size > 5 * 1024 * 1024) {
          toast.error(t('Ukuran file maksimal 5 MB.'));
          return;
        }
        const reader = new FileReader();
        reader.onload = async (event) => {
          const res = event.target?.result as string;
          if (res) {
            const updated: Colony = { ...activeColony, iconUrl: res };
            setColonies((prev) => {
              const next = prev.map((h) => (h.id === activeColony.id ? updated : h));
              saveStoredColonies(next);
              return next;
            });
            try {
              await colonyApi.updateColony(activeColony.id, { iconUrl: res });
            } catch {}
            toast.success(t('Foto colony berhasil diperbarui! 🖼️'));
          }
        };
        reader.readAsDataURL(file);
      }}
      onOpenEditColony={() => setColonyToEdit(activeColony)}
      onOpenDeleteColony={() => setColonyToDelete(activeColony)}
      setIsCallPiP={setIsCallPiP}
      selectedActivityAppId={selectedActivityAppId}
      userBottomDock={null}
      t={t}
    />
  );

  // Component: User Footer Profile Dock
  const renderUserBottomDock = () => {
    const activeCallChannel = channels.find((c) => c.id === activeCallChannelId);
    return (
      <UserBottomDock
        currentUser={currentUser}
        currentUserName={currentUserName}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        isDeafened={isDeafened}
        setIsDeafened={setIsDeafened}
        onOpenSettings={handleOpenUserSettings}
        onLogout={handleLogout}
        onGoogleSignIn={handleGoogleSignIn}
        activeCallChannelId={activeCallChannelId}
        activeCallChannelName={activeCallChannel?.name}
        activeColonyName={activeColony?.name}
        isActivityChannel={!!activeCallChannelId && activeCallChannel?.type !== 'voice'}
        onReturnToCall={() => {
          setActiveChannelId(activeCallChannelId!);
          setIsCallPiP(false);
        }}
        onDisconnectCall={() => {
          setActiveCallChannelId(null);
          setIsActivityOpen(false);
        }}
      />
    );
  };

  // Component: Friends Main Page
  const renderFriendsMainPage = () => (
    <FriendsView
      {...friends}
      currentUser={currentUser}
      members={members}
      onTabChange={(tab) => {
        if (tab === 'add' && !currentUser) {
          setAuthFeatureInfo({
            title: t('Tambah Teman'),
            desc: t('Masuk ke Anticeil untuk mencari dan menambahkan teman baru.'),
          });
          setIsAuthRequiredOpen(true);
          return;
        }
        friends.onTabChange(tab);
      }}
      onStartDM={handleStartDM}
      onOpenDmSearch={() =>
        requireAuth(
          () => {
            setIsDmSearchOpen(true);
            setDmSearchQuery('');
          },
          t('Cari Percakapan'),
          t('Masuk ke Anticeil untuk memulai obrolan langsung.'),
        )
      }
      onOpenSidebar={() => setIsMobileChannelsOpen(true)}
      horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
    />
  );

  // Component: Members / DM User Profile Sidebar Content
  const renderMembersSidebarContent = () => {
    if (isDmMode && activeDmUserId) {
      return (
        <DmUserProfileSidebar
          userId={activeDmUserId}
          member={activeDmMember}
          currentUser={currentUser}
          colonies={colonies}
          friends={friends.allFriends}
          onStartCall={(callType) => {
            if (activeDmUserId) {
              handleCreateCallLog({
                peerId: activeDmUserId,
                peerName: activeDmMember?.name || activeChannel?.name || 'Direct Message',
                peerAvatar: activeDmMember?.avatar || null,
                type: 'outgoing',
                isVideo: callType === 'video',
                channelId: activeChannel?.id,
                duration: 'Ongoing',
              });
            }
          }}
          onSelectColony={(colonyId) => {
            setActiveColonyId(colonyId);
            setIsMobileMembersOpen(false);
          }}
          onClose={() => {
            setShowMemberList(false);
            setIsMobileMembersOpen(false);
          }}
          t={t}
        />
      );
    }

    return (
      <ColonyMembersSidebar
        displayMembers={displayMembers}
        onInviteClick={() => setIsInviteOpen(true)}
        onStartDM={handleStartDM}
        t={t}
      />
    );
  };

  return (
    <LockedFeatureGuard
      locked={false}
      lockTier="Plus"
      lockTitle={t('Unlock Chat & Collaboration')}
      lockDescription={t(
        'Berkomunikasi secara real-time, berbagi template otomatisasi instan, dan kolaborasi terpadu dengan rekan tim kerja Anda. Buka fitur ini dengan upgrade ke paket Plus (hingga 5 pengguna) atau Team.',
      )}
    >
      <TooltipProvider delayDuration={200}>
        <div className="flex h-full w-full overflow-hidden bg-background">
          {/* DESKTOP & TABLET COMBINED LEFT COLUMN */}
          <ChatDesktopSidebar
            sidebarWidth={sidebarWidth}
            isResizingSidebar={isResizingSidebar}
            onResizeStart={handleSidebarResizeStart}
            onResizeReset={handleSidebarResizeReset}
            renderDiscordHubRail={renderDiscordHubRail}
            renderChannelsSidebarContent={renderChannelsSidebarContent}
            renderUserBottomDock={renderUserBottomDock}
            t={t}
          />

          {/* MOBILE & TABLET DRAWERS */}
          <ChatMobileDrawers
            isMobileChannelsOpen={isMobileChannelsOpen}
            setIsMobileChannelsOpen={setIsMobileChannelsOpen}
            isMobileMembersOpen={isMobileMembersOpen}
            setIsMobileMembersOpen={setIsMobileMembersOpen}
            renderDiscordHubRail={renderDiscordHubRail}
            renderChannelsSidebarContent={renderChannelsSidebarContent}
            renderMembersSidebarContent={renderMembersSidebarContent}
            renderUserBottomDock={renderUserBottomDock}
            t={t}
          />

          {/* MAIN CONTENT AREA */}
          <ChatMainView
            isFriendsView={isFriendsView}
            renderFriendsMainPage={renderFriendsMainPage}
            isMessageRequestsView={isMessageRequestsView}
            messageRequests={messageRequests}
            handleAcceptMessageRequest={handleAcceptMessageRequest}
            handleIgnoreMessageRequest={handleIgnoreMessageRequest}
            handleReportSpamMessageRequest={handleReportSpamMessageRequest}
            setIsMobileChannelsOpen={setIsMobileChannelsOpen}
            isNotificationsView={isNotificationsView}
            notifications={notifications}
            handleMarkAllNotificationsRead={handleMarkAllNotificationsRead}
            handleMarkNotificationRead={handleMarkNotificationRead}
            handleJumpToNotification={handleJumpToNotification}
            isCalendarView={isCalendarView}
            calendarEvents={calendarEvents}
            colonies={colonies}
            channels={channels}
            colonyChannels={colonyChannels}
            setActiveColonyId={setActiveColonyId}
            setActiveChannelId={setActiveChannelId}
            setActiveCallChannelId={setActiveCallChannelId}
            createCalendarEvent={createCalendarEvent}
            isAssignmentsView={isAssignmentsView}
            assignments={assignments}
            handleToggleComplete={handleToggleComplete}
            isCallsView={isCallsView}
            callLogs={callLogs}
            friends={friends}
            handleCreateCallLog={handleCreateCallLog}
            handleStartDirectMessage={handleStartDM}
            isAppsView={isAppsView}
            members={members}
            activeCallChannelId={activeCallChannelId}
            handleLaunchActivity={handleLaunchActivity}
            handleStartDM={handleStartDM}
            isColoniesView={isColoniesView}
            requireAuth={requireAuth}
            setIsCreateHubOpen={setIsCreateHubOpen}
            activeChannel={activeChannel}
            isHome={isHome}
            isCallPiP={isCallPiP}
            isThreadsPopoverOpen={isThreadsPopoverOpen}
            setIsThreadsPopoverOpen={setIsThreadsPopoverOpen}
            channelThreads={channelThreads}
            threadSearchQuery={threadSearchQuery}
            setThreadSearchQuery={setThreadSearchQuery}
            setIsCreateThreadModalOpen={setIsCreateThreadModalOpen}
            setActiveThread={setActiveThread}
            setIsThreadDrawerOpen={setIsThreadDrawerOpen}
            isNotificationDropdownOpen={isNotificationDropdownOpen}
            setIsNotificationDropdownOpen={setIsNotificationDropdownOpen}
            channelNotification={channelNotification}
            handleUpdateNotification={handleUpdateNotification}
            isPinnedPopoverOpen={isPinnedPopoverOpen}
            setIsPinnedPopoverOpen={setIsPinnedPopoverOpen}
            pinnedMessages={pinnedMessages}
            handleJumpToMessage={handleJumpToMessage}
            handleTogglePin={handleTogglePin}
            showMemberList={showMemberList}
            setShowMemberList={setShowMemberList}
            setIsMobileMembersOpen={setIsMobileMembersOpen}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeColony={activeColony}
            currentUser={currentUser}
            isPlusOrAbove={isPlusOrAbove}
            socket={socket}
            isActivityOpen={isActivityOpen}
            selectedActivityAppId={selectedActivityAppId}
            setSelectedActivityAppId={setSelectedActivityAppId}
            setIsActivityOpen={setIsActivityOpen}
            setIsCallPiP={setIsCallPiP}
            navigate={navigate}
            activeThread={activeThread}
            threadsMap={threadsMap}
            threadMessages={threadMessages}
            forumSearchQuery={forumSearchQuery}
            setForumSearchQuery={setForumSearchQuery}
            forumSort={forumSort}
            setForumSort={setForumSort}
            isForumComposerOpen={isForumComposerOpen}
            setIsForumComposerOpen={setIsForumComposerOpen}
            forumNewTitle={forumNewTitle}
            setForumNewTitle={setForumNewTitle}
            forumNewMessage={forumNewMessage}
            setForumNewMessage={setForumNewMessage}
            isSubmittingForumPost={isSubmittingForumPost}
            handleCreateForumPost={handleCreateForumPost}
            threadInputText={threadInputText}
            setThreadInputText={setThreadInputText}
            handleSendThreadMessage={handleSendThreadMessage}
            displayMembers={displayMembers}
            handleKanbanCardsUpdate={handleKanbanCardsUpdate}
            replyingToMessage={replyingToMessage}
            setReplyingToMessage={setReplyingToMessage}
            filteredMessages={filteredMessages}
            claimedGifts={claimedGifts}
            setClaimedGifts={setClaimedGifts}
            setIsCreateChannelOpen={setIsCreateChannelOpen}
            handleToggleReaction={handleToggleReaction}
            setNewThreadName={setNewThreadName}
            setNewThreadInitialMsg={setNewThreadInitialMsg}
            handleDeleteMessage={handleDeleteMessage}
            messagesEndRef={messagesEndRef}
            stagedAttachment={stagedAttachment}
            setStagedAttachment={setStagedAttachment}
            inputText={inputText}
            setInputText={setInputText}
            handleSendMessage={handleSendMessage}
            handleFileChange={handleFileChange}
            setIsGiftModalOpen={setIsGiftModalOpen}
            isMediaPickerOpen={isMediaPickerOpen}
            setIsMediaPickerOpen={setIsMediaPickerOpen}
            activeMediaTab={activeMediaTab}
            setActiveMediaTab={setActiveMediaTab}
            mediaSearchQuery={mediaSearchQuery}
            setMediaSearchQuery={setMediaSearchQuery}
            selectedGifCategory={selectedGifCategory}
            setSelectedGifCategory={setSelectedGifCategory}
            serverDbEmojis={serverDbEmojis}
            serverDbStickers={serverDbStickers}
            handleSelectEmoji={handleSelectEmoji}
            handleSendSticker={handleSendSticker}
            handleSendGif={handleSendGif}
            setIsQuickAddEmojiOpen={setIsQuickAddEmojiOpen}
            setIsQuickAddStickerOpen={setIsQuickAddStickerOpen}
            isTemplatePopoverOpen={isTemplatePopoverOpen}
            setIsTemplatePopoverOpen={setIsTemplatePopoverOpen}
            appsSearchQuery={appsSearchQuery}
            setAppsSearchQuery={setAppsSearchQuery}
            handleScheduleMessage={handleScheduleMessage}
            handleCreatePoll={handleCreatePoll}
            t={t}
          />

          {/* DESKTOP MEMBERS / USER PROFILE SIDEBAR */}
          {showMemberList &&
            !isFriendsView &&
            activeChannel?.type !== 'voice' &&
            activeCallChannelId !== activeChannel?.id && (
              <div
                className={cn(
                  'hidden lg:flex shrink-0',
                  isDmMode && activeDmUserId ? 'w-80' : 'w-60',
                )}
              >
                {renderMembersSidebarContent()}
              </div>
            )}

          {/* Community Dialogs & Modals Portal */}
          <ColonyEventsModal
            isOpen={isColonyEventsModalOpen}
            onClose={() => setIsColonyEventsModalOpen(false)}
            activeColony={activeColony}
            channels={channels}
            events={calendarEvents}
            onCreateEvent={createCalendarEvent}
            currentUser={currentUser}
            onJoinChannel={(chId) => {
              setActiveCallChannelId(chId);
              setActiveChannelId(chId);
            }}
          />
          <ChatDialogsPortal
            colonyModals={colonyModals}
            channelModals={channelModals}
            mediaModals={mediaModals}
            activeColony={activeColony}
            activeChannel={activeChannel}
            currentUser={currentUser}
            members={members}
            setMembers={setMembers}
            channels={channels}
            colonyChannels={colonyChannels}
            onUpdateColony={async (colonyId, updates) => {
              if (!activeColony) return;
              const updated = { ...activeColony, ...updates };
              setColonies((prev) => {
                const next = prev.map((h) =>
                  h.id === colonyId ? updated : h,
                );
                saveStoredColonies(next);
                return next;
              });
              try {
                await colonyApi.updateColony(colonyId, updates);
              } catch {}
            }}
            isDmSearchOpen={isDmSearchOpen}
            setIsDmSearchOpen={setIsDmSearchOpen}
            dmSearchQuery={dmSearchQuery}
            setDmSearchQuery={setDmSearchQuery}
            dmChannels={dmChannels}
            setActiveColonyId={setActiveColonyId}
            setActiveChannelId={setActiveChannelId}
            handleStartDM={handleStartDM}
            isGiftModalOpen={isGiftModalOpen}
            setIsGiftModalOpen={setIsGiftModalOpen}
            handleSendGift={handleSendGift}
            isUserSettingsOpen={isUserSettingsOpen}
            setIsUserSettingsOpen={setIsUserSettingsOpen}
            userSettingsInitialSection={userSettingsInitialSection}
            currentUserName={currentUserName}
            updateNameMutation={updateNameMutation}
            updateUsernameMutation={updateUsernameMutation}
            theme={theme}
            setTheme={setTheme}
            handleGoogleSignIn={handleGoogleSignIn}
            handleLogout={handleLogout}
            isCreateThreadModalOpen={isCreateThreadModalOpen}
            setIsCreateThreadModalOpen={setIsCreateThreadModalOpen}
            handleCreateThread={handleCreateThread}
            isThreadDrawerOpen={isThreadDrawerOpen}
            setIsThreadDrawerOpen={setIsThreadDrawerOpen}
            activeThread={activeThread}
            threadMessages={threadMessages}
            handleSendThreadMessage={handleSendThreadMessage}
            renderFormattedMessage={renderFormattedMessage}
            activeCallChannelId={activeCallChannelId}
            setActiveCallChannelId={setActiveCallChannelId}
            isCallPiP={isCallPiP}
            setIsCallPiP={setIsCallPiP}
            isPlusOrAbove={isPlusOrAbove}
            socket={socket}
            selectedActivityAppId={selectedActivityAppId}
            setSelectedActivityAppId={setSelectedActivityAppId}
            setIsActivityOpen={setIsActivityOpen}
            navigate={navigate}
            isAuthRequiredOpen={isAuthRequiredOpen}
            setIsAuthRequiredOpen={setIsAuthRequiredOpen}
            authFeatureInfo={authFeatureInfo}
            onDevMockLogin={handleDevMockLogin}
            t={t}
          />

          {/* Add Friend Dialog Modal */}
          <AddFriendDialog
            open={isAddFriendDialogOpen}
            onOpenChange={setIsAddFriendDialogOpen}
            onAddFriend={friends.onAddFriend}
            isAddingFriend={friends.isAddingFriend}
            currentUser={currentUser}
            allFriends={friends.allFriends}
            friendRequests={friends.friendRequests}
            members={members}
          />
        </div>
      </TooltipProvider>
    </LockedFeatureGuard>
  );
}

export { ColonyPage as MessagesPage };
export { ColonyPage as CommunityPage };
export default ColonyPage;
