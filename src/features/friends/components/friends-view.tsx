import React from 'react';
import { FriendsHeader } from './friends-header';
import { FriendsList } from './friends-list';
import { AddFriendTab } from './add-friend-tab';
import { PendingRequestsTab } from './pending-requests-tab';
import { ActiveNowSidebar } from './active-now-sidebar';
import type { FriendMember, FriendRequest, FriendsTab } from '../types';

interface FriendsViewProps {
  friendsTab: FriendsTab;
  onTabChange: (tab: FriendsTab) => void;
  onlineFriends: FriendMember[];
  allFriends: FriendMember[];
  filteredFriends: FriendMember[];
  friendRequests: FriendRequest[];
  friendsSearchQuery: string;
  onSearchChange: (query: string) => void;
  onStartDM: (member: FriendMember) => void;
  onAddFriend: (username: string) => Promise<void> | void;
  isAddingFriend?: boolean;
  onAcceptRequest: (req: FriendRequest) => void;
  onRejectRequest: (req: FriendRequest) => void;
  onCancelRequest: (req: FriendRequest) => void;
  onOpenDmSearch: () => void;
  onOpenSidebar?: () => void;
  horizontalPadding?: string;
}

export function FriendsView({
  friendsTab,
  onTabChange,
  onlineFriends,
  allFriends,
  filteredFriends,
  friendRequests,
  friendsSearchQuery,
  onSearchChange,
  onStartDM,
  onAddFriend,
  isAddingFriend = false,
  onAcceptRequest,
  onRejectRequest,
  onCancelRequest,
  onOpenDmSearch,
  onOpenSidebar,
  horizontalPadding = 'px-4',
}: FriendsViewProps) {
  return (
    <div className="flex flex-col flex-1 h-full min-h-0 min-w-0 bg-background overflow-hidden">
      {/* Top Header: Discord Friends Bar */}
      <FriendsHeader
        friendsTab={friendsTab}
        onTabChange={onTabChange}
        onlineCount={onlineFriends.length}
        allCount={allFriends.length}
        pendingCount={friendRequests.length}
        onOpenDmSearch={onOpenDmSearch}
        onOpenSidebar={onOpenSidebar}
        horizontalPadding={horizontalPadding}
      />

      {/* Body Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden bg-background">
        {/* Main Friends Column */}
        <div className={`flex-1 min-h-0 overflow-y-auto ${horizontalPadding} py-5 [scrollbar-width:thin]`}>
          {friendsTab === 'add' ? (
            <AddFriendTab onAddFriend={onAddFriend} isAddingFriend={isAddingFriend} />
          ) : friendsTab === 'pending' ? (
            <PendingRequestsTab
              friendRequests={friendRequests}
              onAcceptRequest={onAcceptRequest}
              onRejectRequest={onRejectRequest}
              onCancelRequest={onCancelRequest}
            />
          ) : (
            <FriendsList
              friendsTab={friendsTab}
              friendsSearchQuery={friendsSearchQuery}
              onSearchChange={onSearchChange}
              filteredFriends={filteredFriends}
              onStartDM={onStartDM}
              onSwitchToAddTab={() => onTabChange('add')}
            />
          )}
        </div>

        {/* Right Column: Discord Desktop "Sedang Aktif" (Active Now) */}
        <ActiveNowSidebar
          onlineFriends={onlineFriends}
          onStartDM={onStartDM}
          horizontalPadding={horizontalPadding}
        />
      </div>
    </div>
  );
}
