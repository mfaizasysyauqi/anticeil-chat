import React from 'react';
import { HomeChannelsSidebar } from './home-channels-sidebar';
import { ColonyChannelsSidebar } from './colony-channels-sidebar';
import type {
  Colony,
  ColonyChannel,
  ColonyMember,
  ColonyChannelType,
} from '@/chat/chat-types';
import type { ColonySettingsSection } from '@/features/colony-settings';

export interface ChannelsSidebarProps {
  currentUser?: any;
  isHome: boolean;
  activeColony: Colony | null;
  channels: ColonyChannel[];
  activeChannelId: string;
  setActiveChannelId: (id: string) => void;
  activeCallChannelId: string | null;
  setActiveCallChannelId: (id: string | null) => void;
  isFriendsView: boolean;
  homeView?: 'friends' | 'colonies' | 'servers' | 'message-requests' | 'notifications' | 'calendar' | 'assignments' | 'calls' | 'apps';
  setHomeView?: (view: 'friends' | 'colonies' | 'servers' | 'message-requests' | 'notifications' | 'calendar' | 'assignments' | 'calls' | 'apps') => void;
  messageRequestsCount?: number | string;
  unreadNotificationsCount?: number | string;
  setFriendsTab: (tab: any) => void;
  friendRequests: any[];
  dmChannels: ColonyChannel[];
  members: ColonyMember[];
  collapsedCategories: any;
  setCollapsedCategories: any;
  threadsMap: Record<string, any[]>;
  channelThreads: any[];
  activeThread: any;
  setActiveThread: (thread: any) => void;
  activeCallCounts?: Record<string, number>;
  onItemClick?: () => void;
  onOpenDmSearch: () => void;
  onOpenInvite: () => void;
  onOpenServerSettings: (section?: ColonySettingsSection) => void;
  onOpenCreateChannel: (category: string, type?: ColonyChannelType) => void;
  onOpenCreateColony?: () => void;
  onOpenEditChannel: (channel: ColonyChannel) => void;
  onUpdateColonyIcon?: (file: File) => Promise<void> | void;
  onOpenEditColony?: () => void;
  onOpenDeleteColony?: () => void;
  setIsCallPiP: (pip: boolean) => void;
  calendarEvents?: any[];
  onOpenServerEvents?: () => void;
  userBottomDock?: React.ReactNode;
  selectedActivityAppId?: string | null;
  t: (key: string, params?: Record<string, any>) => string;
}

export function ChannelsSidebar(props: ChannelsSidebarProps) {
  const { isHome, userBottomDock } = props;

  return (
    <div className="flex flex-col h-full bg-sidebar select-none flex-1 min-w-0 overflow-hidden">
      {isHome ? (
        <HomeChannelsSidebar {...props} />
      ) : (
        <ColonyChannelsSidebar {...props} />
      )}
      {userBottomDock}
    </div>
  );
}
