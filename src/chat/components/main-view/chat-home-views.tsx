import React from 'react';
import { MessageSquare } from 'lucide-react';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import { MessageRequestsView, type MessageRequestItem } from '@/features/message-requests';
import { NotificationsView, type NotificationItem } from '@/features/notifications';
import { CalendarView, type CalendarEvent } from '@/features/calendar';
import { AssignmentsView, type AssignmentItem } from '@/features/assignments';
import { CallsView, type CallLogItem } from '@/features/calls';
import { AppsView } from '@/features/apps';
import { ColoniesView } from '@/features/colonies';
import { ShopView } from '@/features/shop';
import { QuestsView } from '@/features/quests';
import type { ColonyChannel, Colony, ColonyMember } from '../../chat-types';

export interface ChatHomeViewsProps {
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
  activeCallChannelId: string | null;
  handleLaunchActivity: (appId: string, autoJoin?: boolean, channelId?: string, colonyId?: string) => void;
  handleStartDM: (member: ColonyMember) => void;
  isShopView?: boolean;
  isQuestsView?: boolean;
  setHomeView?: (view: any) => void;
  isColoniesView: boolean;
  requireAuth: (action: () => void, title?: string, desc?: string) => void;
  setIsCreateHubOpen: (open: boolean) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export const ChatHomeViews: React.FC<ChatHomeViewsProps> = ({
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
  activeCallChannelId,
  handleLaunchActivity,
  handleStartDM,
  isColoniesView,
  requireAuth,
  setIsCreateHubOpen,
  t,
}) => {
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
        onUpdateEvent={updateCalendarEvent}
        onDeleteEvent={deleteCalendarEvent}
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

  if (isShopView) {
    return (
      <ShopView
        currentUser={members.find((m) => m.id === 'me')}
        onOpenSidebar={() => setIsMobileChannelsOpen(true)}
        horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
        onNavigateSection={(sec) => setHomeView?.(sec as any)}
      />
    );
  }

  if (isQuestsView) {
    return (
      <QuestsView
        onOpenSidebar={() => setIsMobileChannelsOpen(true)}
        horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
        onNavigateShop={() => setHomeView?.('shop')}
        onLaunchActivity={(appId) => handleLaunchActivity(appId)}
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
