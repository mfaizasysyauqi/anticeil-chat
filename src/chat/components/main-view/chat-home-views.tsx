import React from 'react';
import { MessageSquare } from 'lucide-react';
import { CHANNEL_HORIZONTAL_PADDING, CHANNEL_VERTICAL_PADDING, LAYOUT_PAGE_SPACING } from '@/lib/layout-constants';
import { MessageRequestsView, type MessageRequestItem } from '@/features/message-requests';
import { NotificationsView, type NotificationItem } from '@/features/notifications';
import { CalendarView, type CalendarEvent } from '@/features/calendar';
import { AssignmentsView, type AssignmentItem } from '@/features/assignments';
import { CallsView, type CallLogItem } from '@/features/calls';
import { AppsView } from '@/features/apps';
import { ColoniesView } from '@/features/colonies';
import { ShopView } from '@/features/shop';
import { QuestsView } from '@/features/quests';
import { AiCommandCenterView } from '@/features/ai-command-center';
import { messagesApi } from '@/features/chat/api/messages-api';
import type { ColonyChannel, Colony, ColonyMember } from '../../chat-types';

export interface ChatHomeViewsProps {
  isAiCommandCenterView?: boolean;
  isFriendsView: boolean;
  renderFriendsMainPage: () => React.ReactNode;
  isMessageRequestsView: boolean;
  messageRequests: MessageRequestItem[];
  handleAcceptMessageRequest: (item: MessageRequestItem) => void;
  handleIgnoreMessageRequest: (item: MessageRequestItem) => void | Promise<void>;
  handleReportSpamMessageRequest: (item: MessageRequestItem) => void | Promise<void>;
  setIsMobileChannelsOpen: (open: boolean) => void;
  onOpenSidebar?: () => void;
  isNotificationsView: boolean;
  notifications: NotificationItem[];
  handleMarkAllNotificationsRead: () => void;
  handleMarkNotificationRead: (id: string) => void;
  handleJumpToNotification: (n: NotificationItem) => void;
  isCalendarView: boolean;
  calendarEvents: CalendarEvent[];
  colonies: Colony[];
  channels: ColonyChannel[];
  setActiveColonyId: (id: string) => void;
  setActiveChannelId: (id: string) => void;
  setActiveCallChannelId: (id: string | null) => void;
  createCalendarEvent: (event: Partial<CalendarEvent>) => void;
  updateCalendarEvent?: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteCalendarEvent?: (id: string) => void;
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
  currentUser?: any;
  socket?: any;
  activeCallChannelId: string | null;
  handleLaunchActivity: (appId: string, autoJoin?: boolean, channelId?: string, colonyId?: string) => void;
  handleStartDM: (member: ColonyMember) => void;
  isShopView?: boolean;
  isQuestsView?: boolean;
  setHomeView?: (view: any) => void;
  isColoniesView: boolean;
  requireAuth: (action: () => void, title?: string, desc?: string) => void;
  setIsCreateHubOpen: (open: boolean) => void;
  selectedActivityAppId?: string | null;
  setSelectedActivityAppId?: (id: string | null) => void;
  isActivityOpen?: boolean;
  setIsActivityOpen?: (open: boolean) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export const ChatHomeViews: React.FC<ChatHomeViewsProps> = ({
  isAiCommandCenterView,
  isFriendsView,
  renderFriendsMainPage,
  isMessageRequestsView,
  messageRequests,
  handleAcceptMessageRequest,
  handleIgnoreMessageRequest,
  handleReportSpamMessageRequest,
  setIsMobileChannelsOpen,
  onOpenSidebar,
  isNotificationsView,
  notifications,
  handleMarkAllNotificationsRead,
  handleMarkNotificationRead,
  handleJumpToNotification,
  isCalendarView,
  calendarEvents,
  colonies,
  channels,
  setActiveColonyId,
  setActiveChannelId,
  setActiveCallChannelId,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  isAssignmentsView,
  assignments,
  handleToggleComplete,
  isCallsView,
  callLogs,
  friends,
  handleCreateCallLog,
  handleStartDirectMessage,
  isAppsView,
  isShopView,
  isQuestsView,
  setHomeView,
  members,
  currentUser,
  socket,
  activeCallChannelId,
  handleLaunchActivity,
  handleStartDM,
  isColoniesView,
  requireAuth,
  setIsCreateHubOpen,
  selectedActivityAppId,
  setSelectedActivityAppId,
  isActivityOpen,
  setIsActivityOpen,
  t,
}) => {
  const handleOpenNav = onOpenSidebar || (() => setIsMobileChannelsOpen(true));

  const handleLaunchStandalone = (rawAppId: string) => {
    if (!currentUser && requireAuth) {
      requireAuth(
        () => handleLaunchStandalone(rawAppId),
        t('Buka Aktivitas'),
        t('Masuk ke Anticeil untuk menggunakan aktivitas dan aplikasi ini.'),
      );
      return;
    }

    const appId =
      rawAppId === 'jamspace-whiteboard'
        ? 'whiteboard'
        : rawAppId === 'anticeil-chess'
          ? 'chess'
          : rawAppId === 'share-screen'
            ? 'screenshare'
            : rawAppId === 'charting'
              ? 'tradingview'
              : rawAppId === 'platform' || rawAppId === 'anticeil-platform' || rawAppId === 'flow'
                ? 'anticeil-flow'
                : rawAppId === 'youtube'
                  ? 'watch-together'
                  : rawAppId;

    if (activeCallChannelId && socket) {
      socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
        channelId: activeCallChannelId,
        action: 'ACTIVITY_STOP',
        payload: {},
      });
    }
    setActiveCallChannelId?.(null);

    // Clear active channel to guarantee isAppsView evaluates to true (!activeChannel)
    setActiveColonyId('anticeil');
    setActiveChannelId('');
    setHomeView?.('apps');

    setSelectedActivityAppId?.(appId);
    setIsActivityOpen?.(true);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('activity', appId);
      window.history.replaceState(null, '', url.toString());
      window.dispatchEvent(
        new CustomEvent('anticeil_launch_standalone', { detail: { appId } }),
      );
    }
  };

  if (isAiCommandCenterView) {
    return (
      <AiCommandCenterView
        horizontalPadding={LAYOUT_PAGE_SPACING.HORIZONTAL}
        colonies={colonies}
        channels={channels}
        members={members}
        friends={friends}
        currentUser={currentUser}
        requireAuth={requireAuth}
        onOpenSidebar={handleOpenNav}
        onLaunchStandalone={handleLaunchStandalone}
        onLaunchActivity={handleLaunchStandalone}
        onOpenApps={() => {
          setActiveChannelId('');
          setHomeView?.('apps');
        }}
        onSendMessageToChannel={async (channelId, content) => {
          return messagesApi.sendMessage(channelId, {
            content,
            senderId: currentUser?.id || 'me',
            senderName: currentUser?.name || currentUser?.username || 'Me',
            senderAvatar: currentUser?.imageUrl || null,
          });
        }}
        onSendDirectMessage={async (recipient, content) => {
          const target = members.find(
            (m) =>
              m.name?.toLowerCase().includes(recipient.toLowerCase()) ||
              m.username?.toLowerCase().includes(recipient.toLowerCase()),
          ) || { id: `dm_${recipient}`, name: recipient };
          handleStartDM(target as any);
          const dmId = currentUser?.id ? `dm-${currentUser.id}-${target.id}` : `dm-${target.id}`;
          return messagesApi.sendMessage(dmId, {
            content,
            senderId: currentUser?.id || 'me',
            senderName: currentUser?.name || currentUser?.username || 'Me',
            senderAvatar: currentUser?.imageUrl || null,
          });
        }}
        onNavigateToChannel={(colonyId, channelId) => {
          setActiveColonyId(colonyId);
          setActiveChannelId(channelId);
        }}
        onNavigateToDM={(memberId) => {
          const target = members.find((m) => m.id === memberId);
          if (target) handleStartDM(target);
        }}
      />
    );
  }

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
        onOpenSidebar={handleOpenNav}
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
        onOpenSidebar={handleOpenNav}
        horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
        currentUserId={currentUser?.id}
      />
    );
  }

  if (isCalendarView) {
    return (
      <CalendarView
        events={calendarEvents}
        colonies={colonies}
        channels={channels}
        currentUser={currentUser}
        requireAuth={requireAuth}
        onJoinChannel={(channelId) => {
          const targetChannel = channels.find((c) => c.id === channelId);
          if (targetChannel?.colonyId) {
            setActiveColonyId(targetChannel.colonyId);
          }
          setActiveChannelId(channelId);
          setActiveCallChannelId(channelId);
        }}
        onOpenSidebar={handleOpenNav}
        onCreateEvent={(event) => {
          if (!currentUser && requireAuth) {
            requireAuth(
              () => createCalendarEvent(event),
              t('Buat Agenda'),
              t('Masuk ke Anticeil untuk membuat acara dan agenda kalender.'),
            );
            return;
          }
          createCalendarEvent(event);
        }}
        onUpdateEvent={(id, event) => {
          if (!currentUser && requireAuth) {
            requireAuth(
              () => updateCalendarEvent?.(id, event),
              t('Ubah Agenda'),
              t('Masuk ke Anticeil untuk mengubah acara kalender.'),
            );
            return;
          }
          updateCalendarEvent?.(id, event);
        }}
        onDeleteEvent={(id) => {
          if (!currentUser && requireAuth) {
            requireAuth(
              () => deleteCalendarEvent?.(id),
              t('Hapus Agenda'),
              t('Masuk ke Anticeil untuk mengelola acara kalender.'),
            );
            return;
          }
          deleteCalendarEvent?.(id);
        }}
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
        onToggleComplete={(id) => {
          if (!currentUser && requireAuth) {
            requireAuth(
              () => handleToggleComplete(id),
              t('Tugas Saya'),
              t('Masuk ke Anticeil untuk mengelola dan menyelesaikan tugas.'),
            );
            return;
          }
          handleToggleComplete(id);
        }}
        onOpenSidebar={handleOpenNav}
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
          if (!currentUser && requireAuth) {
            requireAuth(
              () => {
                handleCreateCallLog({
                  peerId: friend.id,
                  peerName: friend.name,
                  peerAvatar: friend.avatar || null,
                  isDm: true,
                  type: 'outgoing',
                  isVideo: false,
                });
                handleStartDirectMessage(friend);
              },
              t('Mulai Panggilan'),
              t('Masuk ke Anticeil untuk memulai panggilan suara atau video.'),
            );
            return;
          }
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
        onOpenSidebar={handleOpenNav}
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
        currentUser={currentUser}
        requireAuth={requireAuth}
        socket={socket}
        activeCallChannelId={activeCallChannelId}
        onLaunchActivity={handleLaunchActivity}
        onOpenSidebar={handleOpenNav}
        horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
        onStartDM={handleStartDM}
        setActiveColonyId={setActiveColonyId}
        setActiveChannelId={setActiveChannelId}
        selectedActivityAppId={selectedActivityAppId}
        setSelectedActivityAppId={setSelectedActivityAppId}
        isActivityOpen={isActivityOpen}
        setIsActivityOpen={setIsActivityOpen}
      />
    );
  }

  if (isShopView) {
    return (
      <ShopView
        currentUser={currentUser}
        requireAuth={requireAuth}
        onOpenSidebar={handleOpenNav}
        horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
        verticalPadding={CHANNEL_VERTICAL_PADDING}
        onNavigateSection={(sec) => setHomeView?.(sec as any)}
      />
    );
  }

  if (isQuestsView) {
    return (
      <QuestsView
        currentUser={currentUser}
        requireAuth={requireAuth}
        onOpenSidebar={handleOpenNav}
        horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
        verticalPadding={CHANNEL_VERTICAL_PADDING}
        onNavigateShop={() => setHomeView?.('shop')}
        onLaunchActivity={(appId) => handleLaunchActivity(appId)}
      />
    );
  }

  if (isColoniesView) {
    return (
      <ColoniesView
        servers={colonies}
        currentUser={currentUser}
        requireAuth={requireAuth}
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
        onOpenSidebar={handleOpenNav}
        horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center select-none bg-background">
      <div className="w-16 h-16 rounded-3xl bg-muted/40 flex items-center justify-center mb-4">
        <MessageSquare className="w-8 h-8 opacity-40 text-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">
        {t('Tidak ada obrolan yang dipilih')}
      </h3>
      <p className="text-xs max-w-sm text-muted-foreground">
        {t('Pilih saluran atau teman dari panel sebelah kiri untuk mulai mengobrol.')}
      </p>
    </div>
  );
};
