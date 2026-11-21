import React from 'react';
import { NavigateFunction } from 'react-router-dom';
import { MessageSquare, X, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import { ChannelTopHeaderBar, ForumChannelView } from '@/features/channels';
import { KanbanChannelView, type KanbanCard } from '@/features/kanban';
import { CallStage, StageView } from '@/features/voice';
import { clearChannelWatchCache } from '@/features/voice/components/activities/hooks/use-youtube-player';
import { MessagesFeed } from '@/features/chat';
import { ChatInputBar } from '@/features/chat-input';
import { colonyApi } from '@/features/colonies/api/colonies-api';
import {
  ColonyChannel,
  Colony,
  ColonyMember,
  ColonyMessage,
  ColonyCustomRole,
  CommunityAttachment,
} from '../../chat-types';

export interface ChatChannelViewProps {
  activeChannel: ColonyChannel | null;
  isHome: boolean;
  isCallPiP: boolean;
  setIsMobileChannelsOpen: (open: boolean) => void;
  onOpenSidebar?: () => void;
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
  onOpenEditChannel?: (channel: ColonyChannel) => void;

  activeColony: Colony | null;
  currentUser: any;
  isPlusOrAbove: boolean;
  socket: any;
  activeCallChannelId: string | null;
  setActiveCallChannelId: (id: string | null) => void;
  setActiveChannelId: (id: string) => void;
  colonyChannels: ColonyChannel[];
  friends: { allFriends: any[]; [key: string]: any };
  handleCreateCallLog?: (log: any) => void;
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
  handleLaunchActivity: (appId: string, autoJoin?: boolean, channelId?: string, colonyId?: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  stagedAttachment: CommunityAttachment | null;
  setStagedAttachment: (att: CommunityAttachment | null) => void;
  stagedAttachments?: CommunityAttachment[];
  setStagedAttachments?: React.Dispatch<React.SetStateAction<CommunityAttachment[]>>;
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
  handleCreatePoll: (question: string, options: any[], allowMultiple?: boolean, durationHours?: number) => void;
  handleSendVoiceNote?: (blob: Blob, durationSeconds: number) => void;
  messageRequests?: any[];
  handleAcceptMessageRequest?: (item: any) => void;
  handleIgnoreMessageRequest?: (item: any) => void;
  t: (key: string) => string;
}

export function ChatChannelView({
  activeChannel,
  isHome,
  isCallPiP,
  setIsMobileChannelsOpen,
  onOpenSidebar,
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
  activeCallChannelId,
  setActiveCallChannelId,
  setActiveChannelId,
  colonyChannels,
  friends,
  handleCreateCallLog,
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
  handleLaunchActivity,
  messagesEndRef,
  stagedAttachment,
  setStagedAttachment,
  stagedAttachments = [],
  setStagedAttachments,
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
  handleSendVoiceNote,
  messageRequests = [],
  handleAcceptMessageRequest,
  handleIgnoreMessageRequest,
  onOpenEditChannel,
  t,
}: ChatChannelViewProps) {
  const callStartTimeRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    if ((activeCallChannelId === activeChannel?.id || activeChannel?.type === 'voice') && !callStartTimeRef.current) {
      callStartTimeRef.current = Date.now();
    } else if (!activeCallChannelId && activeChannel?.type !== 'voice') {
      callStartTimeRef.current = null;
    }
  }, [activeCallChannelId, activeChannel]);

  const [isActivityChatSplitOpen, setIsActivityChatSplitOpen] = React.useState(false);
  const [activitySplitHeight, setActivitySplitHeight] = React.useState(70);
  const splitContainerRef = React.useRef<HTMLDivElement>(null);

  // Keep chat split hidden by default so activities/video grid are never cut off
  const [colonyRoles, setColonyRoles] = React.useState<ColonyCustomRole[]>([]);
  React.useEffect(() => {
    if (activeColony?.id) {
      colonyApi.getRoles(activeColony.id).then((r) => {
        if (Array.isArray(r)) setColonyRoles(r);
      }).catch(() => {});
    }
  }, [activeColony?.id]);

  React.useEffect(() => {
    if (!isActivityOpen && !selectedActivityAppId && activeCallChannelId !== activeChannel?.id) {
      setIsActivityChatSplitOpen(false);
    }
  }, [activeChannel?.id, activeCallChannelId, isActivityOpen, selectedActivityAppId]);

  // Bind activeCallChannelId to activeChannel if an activity is opened without an explicit channel ID, or if channel is voice
  React.useEffect(() => {
    if (activeChannel?.type === 'voice' && !isCallPiP && activeCallChannelId !== activeChannel.id) {
      setActiveCallChannelId(activeChannel.id);
    } else if (selectedActivityAppId && isActivityOpen && !activeCallChannelId && activeChannel?.id) {
      setActiveCallChannelId(activeChannel.id);
    }
  }, [activeChannel?.id, activeChannel?.type, isCallPiP, selectedActivityAppId, isActivityOpen, activeCallChannelId, setActiveCallChannelId]);

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

  const isDm = Boolean(
    isHome ||
    activeChannel?.category === 'DIRECT MESSAGES' ||
    activeChannel?.isDirectMessage ||
    activeChannel?.id?.startsWith('dm-')
  );

  const pendingDmRequest = React.useMemo(() => {
    if (!isDm || !activeChannel || !messageRequests || messageRequests.length === 0) return null;
    const dmUserId = activeChannel.dmUserId || (activeChannel.id.startsWith('dm-') ? activeChannel.id.replace('dm-', '') : null);
    if (!dmUserId) return null;
    return messageRequests.find((r: any) => r.userId === dmUserId || r.id === dmUserId || (r.username && activeChannel.name && r.username.toLowerCase() === activeChannel.name.toLowerCase()));
  }, [isDm, activeChannel, messageRequests]);

  const renderChatFeedAndInput = (isSplit = false) => (
    <>
      <MessagesFeed
        activeChannel={activeChannel}
        channelPaddingClass={isSplit ? 'px-3 sm:px-4' : CHANNEL_HORIZONTAL_PADDING}
        filteredMessages={filteredMessages}
        currentUser={currentUser}
        claimedGifts={claimedGifts}
        setClaimedGifts={setClaimedGifts}
        onOpenCreateChannel={() => setIsCreateChannelOpen(true)}
        onOpenEditChannel={onOpenEditChannel}
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

      {/* Non-Contact Message Request Banner */}
      {pendingDmRequest && (
        <div className={cn('shrink-0 py-1.5', isSplit ? 'px-3 sm:px-4' : CHANNEL_HORIZONTAL_PADDING)}>
          <div className="p-3 rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <ShieldAlert className="w-5 h-5 text-primary shrink-0" />
              <div className="min-w-0">
                <span className="font-bold text-foreground">Permintaan Pesan dari {pendingDmRequest.name}: </span>
                <span className="text-muted-foreground truncate">
                  Pengguna ini bukan kontak Anda. Terima pesan untuk memulai percakapan.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleIgnoreMessageRequest?.(pendingDmRequest)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              >
                {t('Abaikan')}
              </button>
              <button
                type="button"
                onClick={() => handleAcceptMessageRequest?.(pendingDmRequest)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors cursor-pointer shadow-2xs"
              >
                {t('Terima DM')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ChatInputBar
        activeChannel={activeChannel}
        activeColony={activeColony}
        members={displayMembers}
        roles={colonyRoles}
        currentUser={currentUser}
        channelPaddingClass={isSplit ? 'px-3 sm:px-4' : CHANNEL_HORIZONTAL_PADDING}
        stagedAttachment={stagedAttachment}
        setStagedAttachment={setStagedAttachment}
        stagedAttachments={stagedAttachments}
        setStagedAttachments={setStagedAttachments}
        inputText={inputText}
        setInputText={setInputText}
        replyingTo={replyingToMessage}
        onCancelReply={() => setReplyingToMessage?.(null)}
        onSendMessage={handleSendMessage}
        onSendVoiceNote={handleSendVoiceNote}
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

  const isCallOrActivityActive = Boolean(
    activeChannel &&
      (activeCallChannelId === activeChannel.id ||
        activeChannel.type === 'voice' ||
        (!activeCallChannelId && isActivityOpen && selectedActivityAppId)) &&
      (isActivityOpen || activeChannel.type === 'voice') &&
      !isCallPiP
  );

  return (
    <div className="flex flex-1 flex-col h-full min-h-0 min-w-0 bg-background overflow-hidden">
      {!isCallOrActivityActive && activeChannel?.type !== 'stage' && (
        <ChannelTopHeaderBar
          activeChannel={activeChannel}
          channelPaddingClass={CHANNEL_HORIZONTAL_PADDING}
          isHome={isHome}
          onOpenMobileChannels={onOpenSidebar || (() => setIsMobileChannelsOpen(true))}
          onOpenEditChannel={onOpenEditChannel}
          onStartVoiceCall={() => {
            if (activeChannel) setActiveCallChannelId(activeChannel.id);
          }}
          onStartVideoCall={() => {
            if (activeChannel) setActiveCallChannelId(activeChannel.id);
          }}
          isCallActive={Boolean(activeChannel && activeCallChannelId === activeChannel.id)}
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

      {activeChannel?.type === 'stage' ? (
        <div className="flex-1 min-h-0 flex w-full h-full relative overflow-hidden">
          <div className="flex-1 flex flex-col h-full min-h-0 min-w-0">
            <StageView
              channel={activeChannel}
              activeColony={activeColony}
              currentUser={currentUser}
              socket={socket}
              isPlusOrAbove={isPlusOrAbove}
              onDisconnect={() => {
                setActiveCallChannelId(null);
              }}
              onToggleChat={() => setIsActivityChatSplitOpen((prev) => !prev)}
              isChatOpen={isActivityChatSplitOpen}
            />
          </div>
          {isActivityChatSplitOpen && (
            <div className="w-80 border-l border-white/10 flex flex-col bg-background h-full min-h-0 z-20 shadow-2xl animate-in slide-in-from-right-4 duration-200">
              <div className="h-12 border-b border-border/40 px-3 flex items-center justify-between shrink-0 font-bold text-xs text-foreground">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-primary" />
                  <span>{t('Chat Stage')}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsActivityChatSplitOpen(false)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 min-h-0 flex flex-col">
                {renderChatFeedAndInput(true)}
              </div>
            </div>
          )}
        </div>
      ) : isCallOrActivityActive ? (
        <div ref={splitContainerRef} className="flex-1 min-h-0 overflow-hidden flex flex-col w-full h-full relative">
          <div
            style={{
              height: isActivityChatSplitOpen ? `${activitySplitHeight}%` : '100%',
            }}
            className="w-full min-h-[50%] overflow-hidden flex flex-col"
          >
            <CallStage
              key={`${activeChannel?.id}-${selectedActivityAppId || 'stage'}`}
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
                const channelToLeave = activeCallChannelId || activeChannel?.id;
                if (channelToLeave && socket) {
                  socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
                    channelId: channelToLeave,
                    action: 'ACTIVITY_STOP',
                    payload: {},
                  });
                  socket.emit('COMMUNITY_VOICE_CALL_LEAVE', { channelId: channelToLeave });
                }
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
                if (channelToLeave) {
                  clearChannelWatchCache(channelToLeave);
                }
                clearChannelWatchCache();
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('activity');
                  window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
                  window.dispatchEvent(
                    new CustomEvent('anticeil_activity_close', {
                      detail: { channelId: channelToLeave },
                    }),
                  );
                }
                setActiveCallChannelId(null);
                setSelectedActivityAppId(null);
                setIsActivityOpen(false);
                const defaultTextChannel = colonyChannels.find(
                  (c) => (c.type === 'text' || !c.type) && !c.isDirectMessage,
                );
                if (
                  defaultTextChannel &&
                  (activeChannel?.type === 'voice' || !selectedActivityAppId)
                ) {
                  setActiveChannelId(defaultTextChannel.id);
                }
              }}
              onNavigateToBilling={() => navigate('/platform/billing')}
              onOpenMobileChannels={() => setIsMobileChannelsOpen(true)}
            />
          </div>

          {isActivityChatSplitOpen && (
            <>
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

              <div
                style={{ height: `${100 - activitySplitHeight}%` }}
                className="w-full min-h-[30%] max-h-[50%] overflow-hidden flex flex-col bg-background border-t border-border/70 shadow-lg shrink-0"
              >
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-card/60 backdrop-blur-xs shrink-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1 mr-2 overflow-hidden">
                    <MessageSquare className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span
                      className="text-xs font-semibold text-foreground truncate min-w-0 block"
                      title={activeChannel?.name ? `Obrolan #${activeChannel.name}` : 'Obrolan'}
                    >
                      Obrolan #{activeChannel?.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline shrink-0">
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
          onOpenSidebar={onOpenSidebar || (() => setIsMobileChannelsOpen(true))}
          horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
          onCardsUpdate={handleKanbanCardsUpdate}
        />
      ) : (
        renderChatFeedAndInput(false)
      )}
    </div>
  );
}
