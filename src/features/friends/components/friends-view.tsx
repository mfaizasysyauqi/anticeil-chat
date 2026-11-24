import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING, CHANNEL_VERTICAL_PADDING, LAYOUT_PAGE_SPACING } from '@/lib/layout-constants';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  requireAuth?: (action: () => void, title?: string, desc?: string) => void;
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
  requireAuth,
}: FriendsViewProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const safeOnlineFriends = !currentUser ? [] : onlineFriends;
  const safeAllFriends = !currentUser ? [] : allFriends;
  const safeFilteredFriends = !currentUser ? [] : filteredFriends;
  const safeFriendRequests = !currentUser ? [] : friendRequests;

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 min-w-0 bg-background overflow-hidden">
      {/* Top Header: Discord Friends Bar */}
      <FriendsHeader
        friendsTab={friendsTab}
        onTabChange={onTabChange}
        onlineCount={safeOnlineFriends.length}
        allCount={safeAllFriends.length}
        pendingCount={safeFriendRequests.length}
        onOpenDmSearch={onOpenDmSearch}
        onOpenAddFriendDialog={() => {
          if (!currentUser && requireAuth) {
            requireAuth(
              () => setIsAddDialogOpen(true),
              'Tambah Teman',
              'Masuk ke Anticeil untuk mencari dan menambahkan teman baru.',
            );
            return;
          }
          setIsAddDialogOpen(true);
        }}
        onOpenSidebar={onOpenSidebar}
        horizontalPadding={horizontalPadding}
      />

      {/* Body Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden bg-background">
        {/* Main Friends Column */}
        <ScrollArea className="flex-1 min-h-0">
          <div className={cn(LAYOUT_PAGE_SPACING.BODY_HORIZONTAL, verticalPadding)}>
            {friendsTab === 'add' ? (
              <AddFriendTab
                onAddFriend={onAddFriend}
                isAddingFriend={isAddingFriend}
                currentUser={currentUser}
                allFriends={safeAllFriends}
                friendRequests={safeFriendRequests}
                members={members}
              />
            ) : friendsTab === 'pending' ? (
              <PendingRequestsTab
                friendRequests={safeFriendRequests}
                onAcceptRequest={onAcceptRequest}
                onRejectRequest={onRejectRequest}
                onCancelRequest={onCancelRequest}
              />
            ) : (
              <FriendsList
                friendsTab={friendsTab}
                friendsSearchQuery={friendsSearchQuery}
                onSearchChange={onSearchChange}
                filteredFriends={safeFilteredFriends}
                onStartDM={onStartDM}
                onSwitchToAddTab={() => {
                  if (!currentUser && requireAuth) {
                    requireAuth(
                      () => setIsAddDialogOpen(true),
                      'Tambah Teman',
                      'Masuk ke Anticeil untuk mencari dan menambahkan teman baru.',
                    );
                    return;
                  }
                  setIsAddDialogOpen(true);
                }}
              />
            )}
          </div>
        </ScrollArea>

        {/* Right Column: Discord Desktop "Sedang Aktif" (Active Now) */}
        {safeOnlineFriends.length > 0 && (
          <ActiveNowSidebar
            onlineFriends={safeOnlineFriends}
            onStartDM={onStartDM}
            horizontalPadding={horizontalPadding}
            verticalPadding={verticalPadding}
          />
        )}
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
