import React from 'react';
import { ChatHomeViews, ChatHomeViewsProps } from './main-view/chat-home-views';
import { ChatChannelView, ChatChannelViewProps } from './main-view/chat-channel-view';

export type ChatMainViewProps = ChatHomeViewsProps & ChatChannelViewProps;

export function ChatMainView(props: ChatMainViewProps) {
  const isHomeView =
    props.isFriendsView ||
    props.isMessageRequestsView ||
    props.isNotificationsView ||
    props.isCalendarView ||
    props.isAssignmentsView ||
    props.isCallsView ||
    props.isAppsView ||
    props.isColoniesView;

  if (isHomeView) {
    return <ChatHomeViews {...props} />;
  }

  return <ChatChannelView {...props} />;
}
