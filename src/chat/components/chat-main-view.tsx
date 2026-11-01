import React from 'react';
import { NavigateFunction } from 'react-router-dom';
import { MessageSquare, X } from 'lucide-react';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import { MessageRequestsView, type MessageRequestItem } from '@/features/message-requests';
import { NotificationsView, type NotificationItem } from '@/features/notifications';
import { CalendarView, type CalendarEvent } from '@/features/calendar';
import { AssignmentsView, type AssignmentItem } from '@/features/assignments';
import { CallsView, type CallLogItem } from '@/features/calls';
import { AppsView } from '@/features/apps';
import { ColoniesView } from '@/features/colonies';
import { ChannelTopHeaderBar, ForumChannelView } from '@/features/channels';
import { KanbanChannelView, type KanbanCard } from '@/features/kanban';
import { CallStage } from '@/features/voice';
import { MessagesFeed } from '@/features/chat';
import { ChatInputBar } from '@/features/chat-input';
import {
  ColonyChannel,
  Colony,
  ColonyMember,
  ColonyMessage,
  CommunityAttachment,
} from '../chat-types';

export interface ChatMainViewProps {
  isFriendsView: boolean;
  renderFriendsMainPage: () => React.ReactNode;
  isMessageRequestsView: boolean;
  messageRequests: MessageRequestItem[];
  handleAcceptMessageRequest: (item: MessageRequestItem) => void;
  handleIgnoreMessageRequest: (item: MessageRequestItem) => void | Promise<void>;
  handleReportSpamMessageRequest: (item: MessageRequestItem) => void | Promise<void>;
  setIsMobileChannelsOpen: (open: boolean) => void;
  isNotificationsView: boolean;
  notifications: NotificationItem[];
  handleMarkAllNotificationsRead: () => void;
  handleMarkNotificationRead: (id: string) => void;
  handleJumpToNotification: (n: NotificationItem) => void;
  isCalendarView: boolean;
  calendarEvents: CalendarEvent[];
  colonies: Colony[];
  channels: ColonyChannel[];
  colonyChannels: ColonyChannel[];
  setActiveColonyId: (id: string) => void;
  setActiveChannelId: (id: string) => void;
  setActiveCallChannelId: (id: string | null) => void;
  createCalendarEvent: (event: Partial<CalendarEvent>) => void;
  isAssignmentsView: boolean;
  assignments: AssignmentItem[];
  handleToggleComplete: (id: string) => void;
  isCallsView: boolean;
  callLogs: CallLogItem[];
  friends: {
    allFriends: any[];
    [key: string]: any;
  };
  handleCreateCallLog: (log: any) => void;
  handleStartDirectMessage: (friend: any) => void;
  isAppsView: boolean;
  members: ColonyMember[];
  activeCallChannelId: string | null;
  handleLaunchActivity: (appId: string, autoJoin?: boolean, channelId?: string) => void;
  handleStartDM: (member: ColonyMember) => void;
  isColoniesView: boolean;
  requireAuth: (action: () => void, title?: string, desc?: string) => void;
  setIsCreateHubOpen: (open: boolean) => void;
  // Channel view props
  activeChannel: ColonyChannel | null;
  isHome: boolean;
  isCallPiP: boolean;
  isThreadsPopoverOpen: boolean;
  setIsThreadsPopoverOpen: (open: boolean) => void;
  channelThreads: any[];
  threadSearchQuery: string;
  setThreadSearchQuery: (query: string) => void;
  setIsCreateThreadModalOpen: (open: boolean) => void;
  setActiveThread: (th: any) => void;
  setIsThreadDrawerOpen: (open: boolean) => void;
  isNotificationDropdownOpen: boolean;
  setIsNotificationDropdownOpen: (open: boolean) => void;
  channelNotification: any;
  handleUpdateNotification: (level?: any, isMuted?: boolean, muteDuration?: string | null) => void;
  isPinnedPopoverOpen: boolean;
  setIsPinnedPopoverOpen: (open: boolean) => void;
  pinnedMessages: ColonyMessage[];
  handleJumpToMessage: (id: string) => void;
  handleTogglePin: (id: string) => void;
  showMemberList: boolean;
  setShowMemberList: React.Dispatch<React.SetStateAction<boolean>>;
  setIsMobileMembersOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  // Call stage props
  activeColony: Colony | null;
  currentUser: any;
  isPlusOrAbove: boolean;
  socket: any;
  isActivityOpen?: boolean;
  selectedActivityAppId: string | null;
  setSelectedActivityAppId: (appId: string | null) => void;
  setIsActivityOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCallPiP: (pip: boolean) => void;
  navigate: NavigateFunction;
  // Forum props
  activeThread: any;
  threadsMap: Record<string, any[]>;
  threadMessages: any[];
  forumSearchQuery: string;
  setForumSearchQuery: (query: string) => void;
  forumSort: 'active' | 'newest';
  setForumSort: React.Dispatch<React.SetStateAction<'active' | 'newest'>> | ((sort: 'active' | 'newest') => void);
  isForumComposerOpen: boolean;
  setIsForumComposerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  forumNewTitle: string;
  setForumNewTitle: (title: string) => void;
  forumNewMessage: string;
  setForumNewMessage: (msg: string) => void;
  isSubmittingForumPost: boolean;
  handleCreateForumPost: (e: React.FormEvent) => void;
  threadInputText: string;
  setThreadInputText: (text: string) => void;
  handleSendThreadMessage: (e: React.FormEvent) => void;
  // Kanban props
  displayMembers: ColonyMember[];
  handleKanbanCardsUpdate: (cards: KanbanCard[]) => void;
  // Feed & Input props
  replyingToMessage?: ColonyMessage | null;
  setReplyingToMessage?: React.Dispatch<React.SetStateAction<ColonyMessage | null>>;
  filteredMessages: ColonyMessage[];
  claimedGifts: Record<string, boolean>;
  setClaimedGifts: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setIsCreateChannelOpen: (open: boolean) => void;
  handleToggleReaction: (messageId: string, emoji: string) => void;
  setNewThreadName: (name: string) => void;
  setNewThreadInitialMsg: (msg: string) => void;
  handleDeleteMessage: (messageId: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  stagedAttachment: CommunityAttachment | null;
  setStagedAttachment: (att: CommunityAttachment | null) => void;
  inputText: string;
  setInputText: (text: string) => void;
  handleSendMessage: (customContent?: string) => void | Promise<void>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setIsGiftModalOpen: (open: boolean) => void;
  isMediaPickerOpen: boolean;
  setIsMediaPickerOpen: (open: boolean) => void;
  activeMediaTab: 'gifs' | 'stickers' | 'emojis';
  setActiveMediaTab: (tab: 'gifs' | 'stickers' | 'emojis') => void;
  mediaSearchQuery: string;
  setMediaSearchQuery: (q: string) => void;
  selectedGifCategory: string | null;
  setSelectedGifCategory: (cat: string | null) => void;
  serverDbEmojis: any[];
  serverDbStickers: any[];
  handleSelectEmoji: (emoji: any) => void;
  handleSendSticker: (sticker: any) => void;
  handleSendGif: (gif: any) => void;
  setIsQuickAddEmojiOpen: (open: boolean) => void;
  setIsQuickAddStickerOpen: (open: boolean) => void;
  isTemplatePopoverOpen: boolean;
  setIsTemplatePopoverOpen: (open: boolean) => void;
  appsSearchQuery: string;
  setAppsSearchQuery: (q: string) => void;
  handleScheduleMessage: (scheduledDate: Date, customText?: string) => void | Promise<void>;
  handleCreatePoll: (question: string, options: string[]) => void;
  t: (key: string) => string;
}

export function ChatMainView({
  isFriendsView,
  renderFriendsMainPage,
  isMessageRequestsView,
  messageRequests,
  handleAcceptMessageRequest,
  handleIgnoreMessageRequest,
  handleReportSpamMessageRequest,
  setIsMobileChannelsOpen,
  isNotificationsView,
  notifications,
  handleMarkAllNotificationsRead,
  handleMarkNotificationRead,
  handleJumpToNotification,
  isCalendarView,
  calendarEvents,
  colonies,
  channels,
  colonyChannels,
  setActiveColonyId,
  setActiveChannelId,
  setActiveCallChannelId,
  createCalendarEvent,
  isAssignmentsView,
  assignments,
  handleToggleComplete,
  isCallsView,
  callLogs,
  friends,
  handleCreateCallLog,
  handleStartDirectMessage,
  isAppsView,
  members,
  activeCallChannelId,
  handleLaunchActivity,
  handleStartDM,
  isColoniesView,
  requireAuth,
  setIsCreateHubOpen,
  activeChannel,
  isHome,
  isCallPiP,
  isThreadsPopoverOpen,
  setIsThreadsPopoverOpen,
  channelThreads,
  threadSearchQuery,
  setThreadSearchQuery,
  setIsCreateThreadModalOpen,
  setActiveThread,
  setIsThreadDrawerOpen,
  isNotificationDropdownOpen,
  setIsNotificationDropdownOpen,
  channelNotification,
  handleUpdateNotification,
  isPinnedPopoverOpen,
  setIsPinnedPopoverOpen,
  pinnedMessages,
  handleJumpToMessage,
  handleTogglePin,
  showMemberList,
  setShowMemberList,
  setIsMobileMembersOpen,
  searchQuery,
  setSearchQuery,
  activeColony,
  currentUser,
  isPlusOrAbove,
  socket,
  isActivityOpen,
  selectedActivityAppId,
  setSelectedActivityAppId,
  setIsActivityOpen,
  setIsCallPiP,
  navigate,
  activeThread,
  threadsMap,
  threadMessages,
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
  handleCreateForumPost,
  threadInputText,
  setThreadInputText,
  handleSendThreadMessage,
  displayMembers,
  handleKanbanCardsUpdate,
  replyingToMessage,
  setReplyingToMessage,
  filteredMessages,
  claimedGifts,
  setClaimedGifts,
  setIsCreateChannelOpen,
  handleToggleReaction,
  setNewThreadName,
  setNewThreadInitialMsg,
  handleDeleteMessage,
  messagesEndRef,
  stagedAttachment,
  setStagedAttachment,
  inputText,
  setInputText,
  handleSendMessage,
  handleFileChange,
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
  handleSelectEmoji,
  handleSendSticker,
  handleSendGif,
  setIsQuickAddEmojiOpen,
  setIsQuickAddStickerOpen,
  isTemplatePopoverOpen,
  setIsTemplatePopoverOpen,
  appsSearchQuery,
  setAppsSearchQuery,
  handleScheduleMessage,
  handleCreatePoll,
  t,
}: ChatMainViewProps) {
  const callStartTimeRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    if ((activeCallChannelId === activeChannel?.id || activeChannel?.type === 'voice') && !callStartTimeRef.current) {
      callStartTimeRef.current = Date.now();
    } else if (!activeCallChannelId && activeChannel?.type !== 'voice') {
      callStartTimeRef.current = null;
    }
  }, [activeCallChannelId, activeChannel]);

  const [isActivityChatSplitOpen, setIsActivityChatSplitOpen] = React.useState(false);
  const [activitySplitHeight, setActivitySplitHeight] = React.useState(70); // 70% activity, 30% chat
  const splitContainerRef = React.useRef<HTMLDivElement>(null);

  // Auto-enable split chat view when an activity is active in a text channel (Discord-style)
  React.useEffect(() => {
    if (activeChannel?.type !== 'voice') {
      if (activeCallChannelId === activeChannel?.id || isActivityOpen || selectedActivityAppId) {
        setIsActivityChatSplitOpen(true);
      } else {
        setIsActivityChatSplitOpen(false);
      }
    } else {
      setIsActivityChatSplitOpen(false);
    }
  }, [activeChannel?.id, activeChannel?.type, activeCallChannelId, isActivityOpen, selectedActivityAppId]);

  const handleSplitPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const handleEl = e.currentTarget;
    handleEl.setPointerCapture(e.pointerId);

    const onPointerMove = (moveEv: PointerEvent) => {
      if (!splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      if (rect.height <= 0) return;
      const relativeY = moveEv.clientY - rect.top;
      const pct = (relativeY / rect.height) * 100;
      // Clamp: activity max 70% (min 30% chat), activity min 50% (50/50 split)
      const clamped = Math.min(70, Math.max(50, Math.round(pct)));
      setActivitySplitHeight(clamped);
    };

    const onPointerUp = (upEv: PointerEvent) => {
      try {
        handleEl.releasePointerCapture(upEv.pointerId);
      } catch {
        // ignore if already released
      }
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  if (isFriendsView) {
    return <>{renderFriendsMainPage()}</>;
  }

  if (isMessageRequestsView) {
    return (
      <MessageRequestsView
        requests={messageRequests}
        onAccept={handleAcceptMessageRequest}
        onIgnore={handleIgnoreMessageRequest}
        onReportSpam={handleReportSpamMessageRequest}
        onOpenSidebar={() => setIsMobileChannelsOpen(true)}
        horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
      />
    );
  }

  if (isNotificationsView) {
    return (
      <NotificationsView
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onMarkAsRead={handleMarkNotificationRead}
        onJumpToMessage={handleJumpToNotification}
        onOpenSidebar={() => setIsMobileChannelsOpen(true)}
        horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
      />
    );
  }

  if (isCalendarView) {
    return (
      <CalendarView
        events={calendarEvents}
        colonies={colonies}
        channels={channels}
        onJoinChannel={(channelId) => {
          const targetChannel = channels.find((c) => c.id === channelId);
          if (targetChannel?.colonyId) {
            setActiveColonyId(targetChannel.colonyId);
          }
          setActiveChannelId(channelId);
          setActiveCallChannelId(channelId);
        }}
        onOpenSidebar={() => setIsMobileChannelsOpen(true)}
        onCreateEvent={createCalendarEvent}
        horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
      />
    );
  }

  if (isAssignmentsView) {
    return (
      <AssignmentsView
        assignments={assignments}
        colonies={colonies}
        onOpenBoard={(colonyId, channelId) => {
          setActiveColonyId(colonyId);
          setActiveChannelId(channelId);
        }}
        onToggleComplete={handleToggleComplete}
        onOpenSidebar={() => setIsMobileChannelsOpen(true)}
        horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
      />
    );
  }

  if (isCallsView) {
    return (
      <CallsView
        calls={callLogs}
        friends={friends.allFriends}
        colonies={colonies}
        onStartCall={(friend) => {
          handleCreateCallLog({
            peerId: friend.id,
            peerName: friend.name,
            peerAvatar: friend.avatar || null,
            isDm: true,
            type: 'outgoing',
            isVideo: false,
          });
          handleStartDirectMessage(friend);
        }}
        onOpenSidebar={() => setIsMobileChannelsOpen(true)}
        horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
      />
    );
  }

  if (isAppsView) {
    return (
      <AppsView
        channels={channels}
        colonies={colonies}
        members={members}
        activeCallChannelId={activeCallChannelId}
        onLaunchActivity={handleLaunchActivity}
        onOpenSidebar={() => setIsMobileChannelsOpen(true)}
        horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
        onStartDM={handleStartDM}
        setActiveColonyId={setActiveColonyId}
        setActiveChannelId={setActiveChannelId}
      />
    );
  }

  if (isColoniesView) {
    return (
      <ColoniesView
        servers={colonies}
        onSelectServer={(colonyId) => {
          setActiveColonyId(colonyId);
          const firstCh = channels.find(
            (c) => (c.colonyId || 'anticeil') === colonyId && c.category === 'CHANNELS',
          );
          setActiveChannelId(firstCh?.id || '');
        }}
        onOpenCreateServer={() =>
          requireAuth(
            () => setIsCreateHubOpen(true),
            t('Buat Colony Komunitas'),
            t('Masuk ke Anticeil untuk membuat colony komunitas Anda sendiri.'),
          )
        }
        onOpenSidebar={() => setIsMobileChannelsOpen(true)}
        horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
      />
    );
  }

  const renderChatFeedAndInput = (isSplit = false) => (
    <>
      {/* Messages Feed */}
      <MessagesFeed
        activeChannel={activeChannel}
        channelPaddingClass={isSplit ? 'px-3 sm:px-4' : CHANNEL_HORIZONTAL_PADDING}
        filteredMessages={filteredMessages}
        currentUser={currentUser}
        claimedGifts={claimedGifts}
        setClaimedGifts={setClaimedGifts}
        onOpenCreateChannel={() => setIsCreateChannelOpen(true)}
        onToggleReaction={handleToggleReaction}
        onTogglePin={handleTogglePin}
        onReply={(msg) => setReplyingToMessage?.(msg)}
        onStartThread={(initialName, initialContent) => {
          setNewThreadName(initialName);
          setNewThreadInitialMsg(initialContent);
          setIsCreateThreadModalOpen(true);
        }}
        onDeleteMessage={handleDeleteMessage}
        onJoinActivity={(appId, channelId) => handleLaunchActivity(appId, true, channelId)}
        onJumpToMessage={handleJumpToMessage}
        activeActivityAppId={selectedActivityAppId}
        activeCallChannelId={activeCallChannelId}
        messagesEndRef={messagesEndRef}
        t={t}
      />

      {/* Chat Input Bar */}
      <ChatInputBar
        activeChannel={activeChannel}
        activeColony={activeColony}
        channelPaddingClass={isSplit ? 'px-3 sm:px-4' : CHANNEL_HORIZONTAL_PADDING}
        stagedAttachment={stagedAttachment}
        setStagedAttachment={setStagedAttachment}
        inputText={inputText}
        setInputText={setInputText}
        replyingTo={replyingToMessage}
        onCancelReply={() => setReplyingToMessage?.(null)}
        onSendMessage={handleSendMessage}
        onFileSelect={handleFileChange}
        onOpenGiftModal={() => setIsGiftModalOpen(true)}
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
        onSelectEmoji={handleSelectEmoji}
        onSendSticker={handleSendSticker}
        onSendGif={handleSendGif}
        onOpenQuickAddEmoji={() => setIsQuickAddEmojiOpen(true)}
        onOpenQuickAddSticker={() => setIsQuickAddStickerOpen(true)}
        isTemplatePopoverOpen={isTemplatePopoverOpen}
        setIsTemplatePopoverOpen={setIsTemplatePopoverOpen}
        appsSearchQuery={appsSearchQuery}
        setAppsSearchQuery={setAppsSearchQuery}
        onLaunchActivity={handleLaunchActivity}
        onOpenCreateThreadModal={() => setIsCreateThreadModalOpen(true)}
        onScheduleMessage={handleScheduleMessage}
        onSubmitPoll={handleCreatePoll}
        t={t}
      />
    </>
  );

  return (
    <div className="flex flex-1 flex-col h-full min-h-0 min-w-0 bg-background overflow-hidden">
      {/* Channel Top Header Bar: Always visible in text channels (even during embedded activities) */}
      {!(activeChannel?.type === 'voice' && !isCallPiP) && (
        <ChannelTopHeaderBar
          activeChannel={activeChannel}
          channelPaddingClass={CHANNEL_HORIZONTAL_PADDING}
          isHome={isHome}
          onOpenMobileChannels={() => setIsMobileChannelsOpen(true)}
          isThreadsPopoverOpen={isThreadsPopoverOpen}
          setIsThreadsPopoverOpen={setIsThreadsPopoverOpen}
          channelThreads={channelThreads}
          threadSearchQuery={threadSearchQuery}
          setThreadSearchQuery={setThreadSearchQuery}
          onOpenCreateThreadModal={() => setIsCreateThreadModalOpen(true)}
          onSelectThread={(th) => {
            setActiveThread(th as any);
            setIsThreadDrawerOpen(true);
          }}
          isNotificationDropdownOpen={isNotificationDropdownOpen}
          setIsNotificationDropdownOpen={setIsNotificationDropdownOpen}
          channelNotification={channelNotification}
          onUpdateNotification={handleUpdateNotification}
          isPinnedPopoverOpen={isPinnedPopoverOpen}
          setIsPinnedPopoverOpen={setIsPinnedPopoverOpen}
          pinnedMessages={pinnedMessages}
          onJumpToMessage={handleJumpToMessage}
        onTogglePin={handleTogglePin}

          showMemberList={showMemberList}
          setShowMemberList={setShowMemberList}
          onOpenMobileMembers={() => setIsMobileMembersOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          t={t}
        />
      )}

      {/* Call Stage, Forum, Kanban, or Chat Feed */}
      {(activeCallChannelId === activeChannel?.id || activeChannel?.type === 'voice') && !isCallPiP ? (
        <div ref={splitContainerRef} className="flex-1 min-h-0 overflow-hidden flex flex-col w-full h-full relative">
          <div
            style={{
              height: isActivityChatSplitOpen ? `${activitySplitHeight}%` : '100%',
            }}
            className="w-full min-h-[50%] overflow-hidden flex flex-col"
          >
            <CallStage
              channel={activeChannel!}
              activeColony={activeColony}
              currentUser={currentUser}
              isPlusOrAbove={isPlusOrAbove}
              socket={socket}
              isCallActive={true}
              isPiP={false}
              initialAppId={selectedActivityAppId}
              isChatOpen={isActivityChatSplitOpen}
              onToggleChat={() => setIsActivityChatSplitOpen((prev) => !prev)}
              onToggleActivity={(open) =>
                setIsActivityOpen((prev) => (typeof open === 'boolean' ? open : !prev))
              }
              onActivityChange={(appId) => setSelectedActivityAppId(appId)}
              onTogglePiP={() => setIsCallPiP(true)}
              onEndCall={() => {
                setIsActivityChatSplitOpen(false);
                if (activeChannel) {
                  const elapsedSec = callStartTimeRef.current
                    ? Math.max(1, Math.floor((Date.now() - callStartTimeRef.current) / 1000))
                    : 12;
                  const mins = Math.floor(elapsedSec / 60);
                  const secs = elapsedSec % 60;
                  const durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
                  const isDmChannel = Boolean(activeChannel.dmUserId);
                  const dmFriend = isDmChannel ? friends.allFriends?.find((f: any) => f.id === activeChannel.dmUserId) : null;
                  handleCreateCallLog?.({
                    peerId: activeChannel.dmUserId || activeChannel.id,
                    peerName: isDmChannel ? (dmFriend?.name || activeChannel.name) : activeChannel.name,
                    peerAvatar: isDmChannel ? (dmFriend?.avatar || dmFriend?.imageUrl || null) : (activeColony?.iconUrl || null),
                    colonyId: isDmChannel ? undefined : activeColony?.id,
                    hubName: isDmChannel ? undefined : activeColony?.name,
                    hubIcon: isDmChannel ? undefined : (activeColony?.iconUrl || null),
                    isDm: isDmChannel,
                    type: 'outgoing',
                    isVideo: activeChannel.type === 'voice' || Boolean(selectedActivityAppId),
                    duration: durationStr,
                  });
                }
                callStartTimeRef.current = null;
                setActiveCallChannelId(null);
                setSelectedActivityAppId(null);
                setIsActivityOpen(false);
                const defaultTextChannel = colonyChannels.find((c) => c.type === 'text' || !c.type);
                if (defaultTextChannel && activeChannel?.type === 'voice') {
                  setActiveChannelId(defaultTextChannel.id);
                }
              }}
              onNavigateToBilling={() => navigate('/platform/billing')}
              onOpenMobileChannels={() => setIsMobileChannelsOpen(true)}
            />
          </div>

          {isActivityChatSplitOpen && (
            <>
              {/* Resizable Divider Handle (Discord style) */}
              <div
                role="separator"
                aria-orientation="horizontal"
                aria-label="Resize chat split"
                onPointerDown={handleSplitPointerDown}
                className="group relative h-2.5 w-full bg-border/40 hover:bg-primary/20 active:bg-primary/30 cursor-row-resize shrink-0 transition-colors flex items-center justify-center select-none z-20"
                title="Tarik untuk mengubah ukuran obrolan"
              >
                <div className="w-10 h-1 rounded-full bg-muted-foreground/40 group-hover:bg-primary group-hover:scale-x-125 transition-all shadow-xs" />
              </div>

              {/* Chat Split Pane */}
              <div
                style={{ height: `${100 - activitySplitHeight}%` }}
                className="w-full min-h-[30%] max-h-[50%] overflow-hidden flex flex-col bg-background border-t border-border/70 shadow-lg shrink-0"
              >
                {/* Compact Discord-style Chat Header */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-card/60 backdrop-blur-xs shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-xs font-semibold text-foreground truncate">
                      Obrolan #{activeChannel?.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline">
                      (Tarik pembatas untuk ubah ukuran • min 50% • max 70%)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsActivityChatSplitOpen(false)}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                      title="Tutup Obrolan"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  {renderChatFeedAndInput(true)}
                </div>
              </div>
            </>
          )}
        </div>
      ) : activeChannel?.type === 'forum' ? (
        <ForumChannelView
          activeChannel={activeChannel}
          activeThread={activeThread}
          setActiveThread={setActiveThread}
          channelThreadsList={threadsMap[activeChannel?.id || ''] || channelThreads || []}
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
          onCreateForumPost={handleCreateForumPost}
          threadInputText={threadInputText}
          setThreadInputText={setThreadInputText}
          onSendThreadMessage={handleSendThreadMessage}
          channelPaddingClass={CHANNEL_HORIZONTAL_PADDING}
          t={t}
        />
      ) : activeChannel?.type === 'kanban' ? (
        <KanbanChannelView
          activeChannel={activeChannel}
          activeColony={activeColony}
          displayMembers={displayMembers}
          currentUser={currentUser}
          onOpenSidebar={() => setIsMobileChannelsOpen(true)}
          horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
          onCardsUpdate={handleKanbanCardsUpdate}
        />
      ) : (
        renderChatFeedAndInput(false)
      )}
    </div>
  );
}
