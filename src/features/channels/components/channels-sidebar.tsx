import React from 'react';
import { HomeChannelsSidebar } from './home-channels-sidebar';
import { ServerChannelsSidebar } from './server-channels-sidebar';
import type {
  CommunityHub,
  CommunityChannel,
  CommunityMember,
  CommunityChannelType,
} from '@/chat/chat-types';
import type { ServerSettingsSection } from '@/features/server-settings';

export interface ChannelsSidebarProps {
  isHome: boolean;
  activeHub: CommunityHub | null;
  channels: CommunityChannel[];
  activeChannelId: string;
  setActiveChannelId: (id: string) => void;
  activeCallChannelId: string | null;
  setActiveCallChannelId: (id: string | null) => void;
  isFriendsView: boolean;
  homeView?: 'friends' | 'servers' | 'message-requests' | 'notifications' | 'calendar' | 'assignments' | 'calls' | 'apps';
  setHomeView?: (view: 'friends' | 'servers' | 'message-requests' | 'notifications' | 'calendar' | 'assignments' | 'calls' | 'apps') => void;
  messageRequestsCount?: number | string;
  unreadNotificationsCount?: number | string;
  setFriendsTab: (tab: any) => void;
  friendRequests: any[];
  dmChannels: CommunityChannel[];
  members: CommunityMember[];
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
  onOpenServerSettings: (section?: ServerSettingsSection) => void;
  onOpenCreateChannel: (category: string, type?: CommunityChannelType) => void;
  onOpenCreateHub?: () => void;
  onOpenEditChannel: (channel: CommunityChannel) => void;
  onUpdateHubIcon?: (file: File) => Promise<void> | void;
  onOpenEditHub?: () => void;
  onOpenDeleteHub?: () => void;
  setIsCallPiP: (pip: boolean) => void;
  userBottomDock?: React.ReactNode;
  t: (key: string, params?: Record<string, any>) => string;
}

export function ChannelsSidebar(props: ChannelsSidebarProps) {
  const { isHome, userBottomDock } = props;

  return (
    <div className="flex flex-col h-full bg-sidebar select-none flex-1 min-w-0 overflow-hidden">
      {isHome ? (
        <HomeChannelsSidebar {...props} />
      ) : (
        <ServerChannelsSidebar {...props} />
      )}
      {userBottomDock}
    </div>
  );
}
