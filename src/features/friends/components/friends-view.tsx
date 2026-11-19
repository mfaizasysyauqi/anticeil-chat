import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING, CHANNEL_VERTICAL_PADDING } from '@/lib/layout-constants';
import { FriendsHeader } from './friends-header';
import { FriendsList } from './friends-list';
import { AddFriendTab } from './add-friend-tab';
import { AddFriendDialog } from './add-friend-dialog';
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
  onAddFriend: (username: string, userId?: string) => Promise<void> | void;
  isAddingFriend?: boolean;
  currentUser?: any;
  members?: any[];
  onAcceptRequest: (req: FriendRequest) => void;
  onRejectRequest: (req: FriendRequest) => void;
  onCancelRequest: (req: FriendRequest) => void;
  onOpenDmSearch: () => void;
  onOpenSidebar?: () => void;
  horizontalPadding?: string;
  verticalPadding?: string;
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
  currentUser,
  members,
  onAcceptRequest,
  onRejectRequest,
  onCancelRequest,
  onOpenDmSearch,
  onOpenSidebar,
  horizontalPadding = CHANNEL_HORIZONTAL_PADDING,
  verticalPadding = CHANNEL_VERTICAL_PADDING,
}: FriendsViewProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

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
        onOpenAddFriendDialog={() => setIsAddDialogOpen(true)}
        onOpenSidebar={onOpenSidebar}
        horizontalPadding={horizontalPadding}
      />

      {/* Body Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden bg-background">
        {/* Main Friends Column */}
        <div className={cn('flex-1 min-h-0 overflow-y-auto max-lg:scrollbar-none lg:[scrollbar-width:thin]', horizontalPadding, verticalPadding)}>
          {friendsTab === 'add' ? (
            <AddFriendTab
              onAddFriend={onAddFriend}
              isAddingFriend={isAddingFriend}
              currentUser={currentUser}
              allFriends={allFriends}
              friendRequests={friendRequests}
              members={members}
            />
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
              onSwitchToAddTab={() => setIsAddDialogOpen(true)}
            />
          )}
        </div>

        {/* Right Column: Discord Desktop "Sedang Aktif" (Active Now) */}
        <ActiveNowSidebar
          onlineFriends={onlineFriends}
          onStartDM={onStartDM}
          horizontalPadding={horizontalPadding}
          verticalPadding={verticalPadding}
        />
      </div>

      {/* Add Friend Modal Dialog */}
      <AddFriendDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddFriend={onAddFriend}
        isAddingFriend={isAddingFriend}
        currentUser={currentUser}
        allFriends={allFriends}
        friendRequests={friendRequests}
        members={members}
      />
    </div>
  );
}
