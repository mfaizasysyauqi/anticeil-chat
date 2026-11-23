import { useAuthSession } from '@/features/auth';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { useTranslation } from '@/core/i18n';
import { useTheme } from '@/core/theme';
import { type MessageRequestItem } from '@/features/message-requests';
import { type KanbanCard } from '@/features/kanban';
import {
  useResizableSidebar,
  useChannelPinsNotifications,
} from '@/features/channels';
import { renderFormattedMessage, useColonySocket } from '@/features/chat';
import { processFileInput, processFilesBatch } from '@/features/chat-input';
import { useChatModalsState } from './use-chat-modals-state';
import { useChatSubsystems } from './use-chat-subsystems';
import { useActivityLauncher } from './use-activity-launcher';
import { useMessageActions } from './use-message-actions';
import { useThreadManager } from './use-thread-manager';
import { useUrlSync } from './use-url-sync';
import { useColonyData } from './use-colony-data';
import { useChatNavigation } from './use-chat-navigation';
import { useChatMembers } from './use-chat-members';
import { useChatInitLoader } from './use-chat-init-loader';
import { useChatViewModes } from './use-chat-view-modes';
import { useSocket } from '@/providers/socket-provider';
import { useVoiceCallState } from '@/features/voice';
import { clearChannelWatchCache } from '@/features/voice/components/activities/hooks/use-youtube-player';
import { toast } from 'sonner';
import { DEFAULT_COLONIES } from '../chat-defaults';
import type { ColonyAttachment, ColonyMessage } from '../chat-types';
import type { ChatPageContentProps } from '../components/chat-page-content';
import { buildChatPageProps } from './use-colony-props-builder';

const userMutations: any = {
  useUpdateUser: () => ({ mutateAsync: async () => {}, mutate: () => {} }),
  useUpdateName: (opts?: any) => ({ mutateAsync: async (d: any) => opts?.onSuccess?.(d), mutate: (d: any) => opts?.onSuccess?.(d) }),
  useUpdateUsername: (opts?: any) => ({ mutateAsync: async (d: any) => opts?.onSuccess?.(d), mutate: (d: any) => opts?.onSuccess?.(d) }),
};
const userHooks: any = { useCurrentUser: () => ({ data: null }), invalidateCurrentUser: async () => {} };
const queryClient: any = { invalidateQueries: async () => {} };

export function useColonyPageState(): ChatPageContentProps {
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
  const authSession = useAuthSession({
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
  const { currentUser, requireAuth } = authSession;

  const platform: any = { name: 'Anticeil', plan: { plan: 'plus' } };
  const isPlusOrAbove = true;
  const socket = useSocket();

  // ── 3. Voice & Call State Hook ─────────────────────────────────────
  const voiceCallState = useVoiceCallState({ socket });
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
  } = voiceCallState;

  const [replyingToMessage, setReplyingToMessage] = useState<ColonyMessage | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, ColonyMessage[]>>({});

  const [inputText, setInputText] = useState('');
  const [stagedAttachments, setStagedAttachments] = useState<ColonyAttachment[]>([]);
  const stagedAttachment = stagedAttachments[0] || null;
  const setStagedAttachment = useCallback((att: ColonyAttachment | null) => {
    if (att) setStagedAttachments([att]);
    else setStagedAttachments([]);
  }, []);
  const [showMemberList, setShowMemberList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTemplatePopoverOpen, setIsTemplatePopoverOpen] = useState(false);

  // Modals & Media Hook
  const modalsState = useChatModalsState({
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
    activeColonyId,
    activeChannelId,
    t,
  });
  const { colonyModals, channelModals, mediaModals, isGiftModalOpen, setIsGiftModalOpen, claimedGifts, setClaimedGifts } = modalsState;
  const { setIsCreateHubOpen, setColonyToEdit, setColonyToDelete, setIsInviteOpen, setIsServerSettingsOpen, setColonySettingsSection } = colonyModals;
  const { setIsCreateChannelOpen, setNewChannelCategory, setNewChannelType, handleOpenEditChannel } = channelModals;
  const { isMediaPickerOpen, setIsMediaPickerOpen, activeMediaTab, setActiveMediaTab, mediaSearchQuery, setMediaSearchQuery, selectedGifCategory, setSelectedGifCategory, serverDbEmojis, serverDbStickers, setIsQuickAddEmojiOpen, setIsQuickAddStickerOpen } = mediaModals;

  openCreateColonyRef.current = () => setIsCreateHubOpen(true);

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

  // Thread Manager Hook
  const threadManager = useThreadManager({
    activeChannel,
    currentUser,
    t,
  });

  const { sidebarWidth, isResizingSidebar, handleSidebarResizeStart, handleSidebarResizeReset } = useResizableSidebar();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── 6. WebSocket Hook ──────────────────────────────────────────────
  useColonySocket({
    socket,
    activeChannelId,
    setActiveChannelId,
    setMessagesMap,
    setChannels,
    setColonies,
    activeColonyId,
    setActiveColonyId,
    currentUser,
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
    handleJoinColony: colonyModals.handleJoinColony,
    setPinnedMessages: () => {},
    setChannelNotification: () => {},
    setChannelThreads: () => {},
    setThreadsMap: () => {},
  });

  const currentMessages = activeChannel ? messagesMap[activeChannel.id] || [] : [];
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return currentMessages;
    const q = searchQuery.toLowerCase();
    return currentMessages.filter(
      (m) =>
        (m.content && m.content.toLowerCase().includes(q)) ||
        (m.senderName && m.senderName.toLowerCase().includes(q)),
    );
  }, [currentMessages, searchQuery]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages.length]);

  // ── 8. Feature Subsystems & Members Sync Hook ─────────────────────
  const chatSubsystems = useChatSubsystems({ currentUser, members, dmChannels, t });
  const {
    calendarEvents,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    isColonyEventsModalOpen,
    setIsColonyEventsModalOpen,
    assignments,
    handleToggleComplete,
    callLogs,
    handleCreateCallLog,
    messageRequests,
    handleAcceptMessageRequestRaw,
    handleIgnoreMessageRequest,
    handleReportSpamMessageRequest,
    notifications,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
    unreadNotifCount,
    friends,
    isUserSettingsOpen, setIsUserSettingsOpen, userSettingsInitialSection, handleOpenUserSettings,
    isEditProfileOpen, setIsEditProfileOpen, handleOpenEditProfile,
    isDmSearchOpen,
    setIsDmSearchOpen,
    dmSearchQuery,
    setDmSearchQuery,
    isCreateGroupDmOpen,
    setIsCreateGroupDmOpen,
  } = chatSubsystems;

  // View Modes & UI Layout State Hook
  const {
    unreadCounts,
    setUnreadCounts,
    homeView,
    setHomeView,
    railMode,
    setRailMode,
    handleToggleRailMode,
    collapsedCategories,
    setCollapsedCategories,
    isMuted,
    setIsMuted,
    isDeafened,
    setIsDeafened,
    isMobileChannelsOpen,
    setIsMobileChannelsOpen,
    isMobileMembersOpen,
    setIsMobileMembersOpen,
    isDesktopSidebarCollapsed,
    setIsDesktopSidebarCollapsed,
    toggleDesktopSidebarCollapsed,
    isAiCommandCenterView,
    isFriendsView,
    isMessageRequestsView,
    isNotificationsView,
    isCalendarView,
    isAssignmentsView,
    isCallsView,
    isAppsView,
    isShopView,
    isQuestsView,
    isColoniesView,
  } = useChatViewModes({
    isHome,
    activeChannel,
    unreadNotifCount,
    setActiveColonyId,
    setActiveChannelId,
    t,
  });

  // ── URL & Path Sync Hook ───────────────────────────────────────────
  useUrlSync({
    activeColonyId,
    activeChannelId,
    selectedActivityAppId,
    channelsCount: channels.length,
    isActivityOpen,
    homeView,
    setHomeView,
    setActiveColonyId,
    setActiveChannelId,
  });

  // Global Home Navigation Event Listener (e.g. Shop, Friends, Colonies from dialogs/modals)
  useEffect(() => {
    const handleNavigateHome = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const targetView = customEvent.detail as any;
      if (targetView) {
        setActiveColonyId('anticeil');
        setActiveChannelId('');
        setHomeView(targetView);
      }
    };
    window.addEventListener('anticeil:navigate-home', handleNavigateHome);
    return () => window.removeEventListener('anticeil:navigate-home', handleNavigateHome);
  }, [setActiveColonyId, setActiveChannelId, setHomeView]);

  // Channel Pins & Notifications Hook
  const {
    isPinnedPopoverOpen,
    setIsPinnedPopoverOpen,
    pinnedMessages,
    setPinnedMessages,
    isNotificationDropdownOpen,
    setIsNotificationDropdownOpen,
    channelNotification,
    handleUpdateNotification,
  } = useChannelPinsNotifications({
    activeChannel,
    socket,
  });

  // Message Actions Hook
  const messageActions = useMessageActions({
    currentUser,
    activeChannel,
    activeColony,
    members,
    allFriends: friends?.allFriends || [],
    replyingToMessage,
    setReplyingToMessage,
    inputText,
    setInputText,
    stagedAttachment,
    setStagedAttachment,
    stagedAttachments,
    setStagedAttachments,
    messagesMap,
    setMessagesMap,
    setPinnedMessages,
    setIsMediaPickerOpen,
    setIsGiftModalOpen,
    setIsPinnedPopoverOpen,
    setAuthFeatureInfo: authSession.setAuthFeatureInfo,
    setIsAuthRequiredOpen: authSession.setIsAuthRequiredOpen,
    createCalendarEvent,
    t,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    processFilesBatch(
      e.target.files,
      stagedAttachments.length,
      (newAtt) => setStagedAttachments((prev) => [...prev, newAtt as ColonyAttachment]),
      () => {
        window.dispatchEvent(new CustomEvent('anticeil_too_many_uploads'));
      }
    );
    e.target.value = '';
  };

  const handleJumpToNotification = (item: any) => {
    if (!item) return;
    handleMarkNotificationRead(item.id);
    const targetColonyId = item.colonyId || 'anticeil';
    const isDirectMessage = Boolean(
      item.channelId?.startsWith('dm-') || item.channelId?.startsWith('gdm-')
    );

    setActiveColonyId(targetColonyId);
    if (item.channelId) {
      setActiveChannelId(item.channelId);
    }
    setHomeView(null as any);

    // Sync URL with React Router navigate
    if (isDirectMessage) {
      navigate(`/channels/@me/${item.channelId}`);
    } else if (targetColonyId && targetColonyId !== 'anticeil') {
      navigate(`/channels/${targetColonyId}${item.channelId ? '/' + item.channelId : ''}`);
    } else if (item.channelId) {
      navigate(`/channels/${targetColonyId}/${item.channelId}`);
    }

    // Scroll & highlight target message with polling retry until rendered
    if (item.messageId) {
      let attempts = 0;
      const tryJump = () => {
        const el = document.getElementById(`msg-${item.messageId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('bg-primary/20', 'transition-colors', 'duration-500');
          setTimeout(() => el.classList.remove('bg-primary/20'), 2500);
        } else if (attempts < 20) {
          attempts++;
          setTimeout(tryJump, 150);
        }
      };
      setTimeout(tryJump, 150);
    }
  };

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
    selectedActivityAppId,
    setSelectedActivityAppId,
    setIsTemplatePopoverOpen,
    setActiveColonyId,
    setActiveChannelId,
    setActiveCallChannelId,
    setIsCallPiP,
    setIsActivityOpen,
    setMessagesMap,
    requireAuth,
  });

  const handleDisconnectCall = useCallback(() => {
    const channelToLeave = activeCallChannelId || (activeChannel?.type === 'voice' ? activeChannel.id : null);
    if (channelToLeave && socket) {
      socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
        channelId: channelToLeave,
        action: 'ACTIVITY_STOP',
        payload: {},
      });
      socket.emit('COMMUNITY_VOICE_CALL_LEAVE', { channelId: channelToLeave });
    }
    if (channelToLeave) {
      setActiveCallCounts((prev) => {
        if (!prev[channelToLeave]) return prev;
        const next = { ...prev };
        delete next[channelToLeave];
        return next;
      });
    }
    setActiveCallChannelId(null);
    setSelectedActivityAppId(null);
    setIsActivityOpen(false);
    setIsCallPiP(false);

    if (channelToLeave) {
      clearChannelWatchCache(channelToLeave);
    }
    clearChannelWatchCache();

    // Clean up activity from URL and notify any standalone sessions
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('activity');
      window.history.replaceState(null, '', url.toString());
      window.dispatchEvent(new CustomEvent('anticeil_activity_close', { detail: { channelId: channelToLeave } }));
    }

    // Only switch to default text channel if we were actively leaving a voice channel
    if (channelToLeave) {
      const currentColonyId = activeColonyId || activeChannel?.colonyId;
      const defaultText =
        colonyChannels.find((c) => (c.type === 'text' || !c.type) && !c.isDirectMessage) ||
        channels.find((c) => (c.colonyId || 'anticeil') === currentColonyId && (c.type === 'text' || !c.type) && !c.isDirectMessage) ||
        channels.find((c) => (c.type === 'text' || !c.type) && !c.isDirectMessage);
      if (defaultText) {
        setActiveChannelId(defaultText.id);
      } else {
        setActiveChannelId('');
      }
    }
  }, [
    activeCallChannelId,
    activeChannel,
    socket,
    colonyChannels,
    channels,
    activeColonyId,
    setActiveCallCounts,
    setActiveCallChannelId,
    setSelectedActivityAppId,
    setIsActivityOpen,
    setIsCallPiP,
    setActiveChannelId,
  ]);

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

  const {
    currentUserName,
    displayMembers,
    handleStartDM,
    handleCloseDM,
    handleCreateGroupDM,
    handleAddMemberToGroupDM,
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
    requireAuth,
  });

  const handleKanbanCardsUpdate = useCallback(
    (newCards: KanbanCard[]) => {
      if (!activeChannel) return;
      try {
        localStorage.setItem(`anticeil_kanban_${activeChannel.id}`, JSON.stringify(newCards));
      } catch (err) {
        console.error('Failed to persist kanban cards:', err);
      }
    },
    [activeChannel],
  );

  const handleAcceptMessageRequest = async (item: MessageRequestItem) => {
    await handleAcceptMessageRequestRaw(item);
  };

  return buildChatPageProps({
    sidebarWidth,
    isResizingSidebar,
    handleSidebarResizeStart,
    handleSidebarResizeReset,
    isMobileChannelsOpen,
    setIsMobileChannelsOpen,
    isMobileMembersOpen,
    setIsMobileMembersOpen,
    isDesktopSidebarCollapsed,
    setIsDesktopSidebarCollapsed,
    toggleDesktopSidebarCollapsed,
    colonies,
    activeColonyId,
    unreadCounts,
    currentUser,
    channels,
    platform,
    railMode,
    friends,
    activeChannelId,
    setUnreadCounts,
    setActiveColonyId,
    setActiveChannelId,
    setAuthFeatureInfo: authSession.setAuthFeatureInfo,
    setIsAuthRequiredOpen: authSession.setIsAuthRequiredOpen,
    requireAuth,
    setIsCreateHubOpen,
    handleToggleRailMode,
    handleStartDM,
    handleCloseDM,
    handleCreateGroupDM,
    handleAddMemberToGroupDM,
    isAddFriendDialogOpen,
    setIsAddFriendDialogOpen,
    t,
    isHome,
    activeColony,
    activeCallChannelId,
    setActiveCallChannelId,
    isAiCommandCenterView,
    isFriendsView,
    homeView,
    setHomeView,
    messageRequests,
    unreadNotifCount,
    dmChannels,
    allKnownMembers,
    collapsedCategories,
    setCollapsedCategories,
    ...threadManager,
    activeCallCounts,
    calendarEvents,
    colonyModals,
    channelModals,
    mediaModals,
    isColonyEventsModalOpen,
    setIsColonyEventsModalOpen,
    isDmSearchOpen,
    setIsDmSearchOpen,
    dmSearchQuery,
    setDmSearchQuery,
    isCreateGroupDmOpen,
    setIsCreateGroupDmOpen,
    setIsInviteOpen,
    setColonySettingsSection,
    setIsServerSettingsOpen,
    setNewChannelCategory,
    setNewChannelType,
    setIsCreateChannelOpen,
    handleOpenEditChannel,
    setColonies,
    setColonyToEdit,
    setColonyToDelete,
    isCallPiP,
    setIsCallPiP,
    selectedActivityAppId,
    setSelectedActivityAppId,
    currentUserName,
    isMuted,
    setIsMuted,
    isDeafened,
    setIsDeafened,
    handleOpenUserSettings,
    handleLogout: authSession.handleLogout,
    handleGoogleSignIn: authSession.handleGoogleSignIn,
    handleMicrosoftSignIn: authSession.handleMicrosoftSignIn,
    handleOktaSignIn: authSession.handleOktaSignIn,
    members,
    isDmMode,
    activeDmUserId,
    activeDmMember,
    displayMembers,
    handleCreateCallLog,
    setShowMemberList,
    isMessageRequestsView,
    handleAcceptMessageRequest,
    handleIgnoreMessageRequest,
    handleReportSpamMessageRequest,
    isNotificationsView,
    notifications,
    handleMarkAllNotificationsRead,
    handleMarkNotificationRead,
    handleJumpToNotification,
    isCalendarView,
    colonyChannels,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    isAssignmentsView,
    assignments,
    handleToggleComplete,
    isCallsView,
    callLogs,
    isAppsView,
    isShopView,
    isQuestsView,
    handleLaunchActivity,
    isColoniesView,
    activeChannel,
    isThreadsPopoverOpen: threadManager.isThreadsPopoverOpen,
    setIsThreadsPopoverOpen: threadManager.setIsThreadsPopoverOpen,
    channelNotification,
    handleUpdateNotification,
    isPinnedPopoverOpen,
    setIsPinnedPopoverOpen,
    pinnedMessages,
    showMemberList,
    searchQuery,
    setSearchQuery,
    isPlusOrAbove,
    socket,
    isActivityOpen,
    setIsActivityOpen,
    handleDisconnectCall,
    navigate,
    handleKanbanCardsUpdate,
    replyingToMessage,
    setReplyingToMessage,
    filteredMessages,
    claimedGifts,
    setClaimedGifts,
    messagesEndRef,
    stagedAttachment,
    setStagedAttachment,
    stagedAttachments,
    setStagedAttachments,
    inputText,
    setInputText,
    handleFileChange,
    isGiftModalOpen,
    setIsGiftModalOpen,
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
    isTemplatePopoverOpen,
    setIsTemplatePopoverOpen,
    appsSearchQuery,
    setAppsSearchQuery,
    setMembers,
    isUserSettingsOpen, setIsUserSettingsOpen, userSettingsInitialSection,
    isEditProfileOpen, setIsEditProfileOpen, handleOpenEditProfile,
    updateNameMutation,
    updateUsernameMutation,
    theme,
    setTheme,
    renderFormattedMessage,
    isAuthRequiredOpen: authSession.isAuthRequiredOpen,
    authFeatureInfo: authSession.authFeatureInfo,
    handleGuestLogin: authSession.handleGuestLogin,
    handleDevMockLogin: authSession.handleDevMockLogin,
    handleSsoLogin: authSession.handleSsoLogin,
    ...messageActions,
  });
}
