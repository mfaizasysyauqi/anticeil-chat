import React from 'react';
import { HomeChannelsSidebar } from './home-channels-sidebar';
import { ColonyChannelsSidebar } from './colony-channels-sidebar';
import { AiCommandCenterSidebar } from '@/features/ai-command-center';
import type {
  Colony,
  ColonyChannel,
  ColonyMember,
  ColonyChannelType,
} from '@/chat/chat-types';
import type { ColonySettingsSection } from '@/features/colony-settings';
import type { ColonyCategory } from '../api/categories-api';

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
  homeView?: 'ai' | 'friends' | 'colonies' | 'servers' | 'message-requests' | 'notifications' | 'calendar' | 'assignments' | 'calls' | 'apps' | 'shop' | 'quests';
  setHomeView?: (view: 'ai' | 'friends' | 'colonies' | 'servers' | 'message-requests' | 'notifications' | 'calendar' | 'assignments' | 'calls' | 'apps' | 'shop' | 'quests') => void;
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
  onCloseDM?: (id: string) => void;
  onOpenDmSearch: () => void;
  onOpenCreateGroupDm?: () => void;
  onOpenInvite: () => void;
  onOpenServerSettings: (section?: ColonySettingsSection) => void;
  onOpenCreateChannel: (category: string, type?: ColonyChannelType, categoryId?: string) => void;
  onOpenCreateCategory?: () => void;
  onDeleteCategory?: (categoryId: string) => void;
  onUpdateCategory?: (categoryId: string, name: string) => void;
  categories?: ColonyCategory[];
  onOpenCreateColony?: () => void;
  onOpenEditChannel: (channel: ColonyChannel) => void;
  onUpdateColonyIcon?: (file: File) => Promise<void> | void;
  onMoveChannelCategory?: (channelId: string, categoryId?: string, categoryName?: string) => Promise<void> | void;
  onOpenEditColony?: () => void;
  onOpenDeleteColony?: () => void;
  setIsCallPiP: (pip: boolean) => void;
  calendarEvents?: any[];
  onOpenServerEvents?: () => void;
  userBottomDock?: React.ReactNode;
  selectedActivityAppId?: string | null;
  onToggleCollapseSidebar?: () => void;
  requireAuth?: (action: () => void, title?: string, desc?: string) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export function ChannelsSidebar(props: ChannelsSidebarProps) {
  const { isHome, userBottomDock, homeView, activeChannelId, currentUser, requireAuth } = props;
  const isAiActive = isHome && (homeView === 'ai' || !homeView) && !activeChannelId;

  return (
    <div className="flex flex-col h-full bg-sidebar select-none flex-1 min-w-0 overflow-hidden">
      {isAiActive ? (
        <AiCommandCenterSidebar
          onToggleCollapseSidebar={props.onToggleCollapseSidebar}
          currentUser={currentUser}
          requireAuth={requireAuth}
        />
      ) : isHome ? (
        <HomeChannelsSidebar {...props} />
      ) : (
        <ColonyChannelsSidebar {...props} />
      )}
      {userBottomDock}
    </div>
  );
}
