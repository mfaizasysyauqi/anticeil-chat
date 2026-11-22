import React from 'react';
import { ColonyRail } from '@/features/colonies';
import { ChannelsSidebar, GroupDmMembersSidebar } from '@/features/channels';
import { UserBottomDock, DmUserProfileSidebar } from '@/features/profile';
import { FriendsView } from '@/features/friends';
import { ColonyMembersSidebar } from '@/features/members';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import { toast } from 'sonner';
import { colonyApi } from '../chat-api';
import { saveStoredColonies } from '../chat-defaults';
import type { Colony, ColonyChannel } from '../chat-types';

export interface ColonyRailWrapperProps {
  colonies: Colony[];
  activeColonyId: string;
  unreadCounts: Record<string, number | string>;
  currentUser: any;
  channels: ColonyChannel[];
  dmChannels?: ColonyChannel[];
  members?: any[];
  platformName?: string;
  railMode: 'servers' | 'friends';
  friends: any[];
  activeChannelId: string;
  homeView?: any;
  setUnreadCounts: React.Dispatch<React.SetStateAction<Record<string, number | string>>>;
  setActiveColonyId: (id: string) => void;
  setActiveChannelId: (id: string) => void;
  setHomeView?: (view: any) => void;
  navigate?: (path: string) => void;
  onNavigateToApps?: () => void;
  setAuthFeatureInfo: (info: { title: string; desc: string }) => void;
  setIsAuthRequiredOpen: (open: boolean) => void;
  requireAuth: (action: () => void, title?: string, desc?: string) => void;
  setIsCreateHubOpen: (open: boolean) => void;
  onToggleRailMode: () => void;
  handleStartDM: (member: any) => void;
  setIsAddFriendDialogOpen: (open: boolean) => void;
  isSidebarCollapsed?: boolean;
  onToggleCollapseSidebar?: () => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export const ColonyRailWrapper: React.FC<ColonyRailWrapperProps> = ({
  colonies,
  activeColonyId,
  unreadCounts,
  currentUser,
  channels,
  dmChannels,
  members,
  platformName,
  railMode,
  friends,
  activeChannelId,
  setUnreadCounts,
  setActiveColonyId,
  setActiveChannelId,
  setHomeView,
  navigate,
  onNavigateToApps,
  setAuthFeatureInfo,
  setIsAuthRequiredOpen,
  requireAuth,
  setIsCreateHubOpen,
  onToggleRailMode,
  handleStartDM,
  setIsAddFriendDialogOpen,
  homeView,
  isSidebarCollapsed,
  onToggleCollapseSidebar,
  t,
}) => {
  return (
    <ColonyRail
      currentUser={currentUser}
      servers={colonies}
      activeServerId={activeColonyId}
      unreadCounts={unreadCounts}
      homeView={homeView}
      isSidebarCollapsed={isSidebarCollapsed}
      onToggleCollapseSidebar={onToggleCollapseSidebar}
      isAiActive={activeColonyId === 'anticeil' && (homeView === 'ai' || !homeView) && !activeChannelId}
      onSelectAiCenter={() => {
        setActiveColonyId('anticeil');
        setActiveChannelId('');
        setHomeView?.('ai');
        navigate?.('/ai');
      }}
      onSelectServer={(id) => {
        if (id === 'ai-center') {
          setActiveColonyId('anticeil');
          setActiveChannelId('');
          setHomeView?.('ai');
          navigate?.('/ai');
          return;
        }
        if (id !== 'anticeil') {
          setUnreadCounts((prev) => ({ ...prev, [id]: 0 }));
        }
        if (id !== 'anticeil' && !currentUser) {
          setAuthFeatureInfo({
            title: t('Akses Colony'),
            desc: t('Masuk ke Anticeil untuk mengakses saluran dan mengobrol di colony ini.'),
          });
          setIsAuthRequiredOpen(true);
          return;
        }
        if (id === 'anticeil') {
          setActiveColonyId('anticeil');
          setActiveChannelId('');
          if (onNavigateToApps) {
            onNavigateToApps();
          } else {
            setHomeView?.('apps');
            navigate?.('/applications');
          }
          return;
        }
        setActiveColonyId(id);
        const firstCh = channels.find(
          (c) => (c.colonyId || 'anticeil') === id && (c.type === 'text' || !c.type) && !c.isDirectMessage,
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
      platformName={platformName}
      railMode={railMode}
      onToggleRailMode={onToggleRailMode}
      friends={friends}
      dmChannels={dmChannels || channels.filter((c) => c.isDirectMessage || c.id.startsWith('dm-'))}
      members={members}
      activeChannelId={activeChannelId}
      onSelectFriend={(f) => {
        setUnreadCounts((prev) => ({
          ...prev,
          [f.id]: 0,
          [`dm-${f.id}`]: 0,
          ...(f.dmChannelId ? { [f.dmChannelId]: 0 } : {}),
        }));
        if (f.dmChannelId) {
          setActiveColonyId('anticeil');
          setActiveChannelId(f.dmChannelId);
          setHomeView?.(undefined);
        } else {
          handleStartDM(f);
        }
      }}
      onOpenAddFriend={() =>
        requireAuth(
          () => setIsAddFriendDialogOpen(true),
          t('Tambah Teman Baru'),
          t('Masuk ke Anticeil untuk menambahkan teman baru.'),
        )
      }
    />
  );
};

export interface ChannelsSidebarWrapperProps {
  currentUser: any;
  isHome: boolean;
  activeColony: Colony | null;
  channels: ColonyChannel[];
  activeChannelId: string;
  setActiveChannelId: (id: string) => void;
  activeCallChannelId: string | null;
  setActiveCallChannelId: (id: string | null) => void;
  isFriendsView: boolean;
  homeView: any;
  setHomeView: any;
  messageRequests: any[];
  unreadCounts: Record<string, number | string>;
  unreadNotifCount: number;
  friends: any;
  dmChannels: any[];
  allKnownMembers: any[];
  collapsedCategories: any;
  setCollapsedCategories: any;
  threadsMap: any;
  channelThreads: any[];
  activeThread: any;
  setActiveThread: (th: any) => void;
  activeCallCounts: Record<string, number>;
  calendarEvents: any[];
  channelModals: any;
  setIsColonyEventsModalOpen: (open: boolean) => void;
  requireAuth: (action: () => void, title?: string, desc?: string) => void;
  setIsDmSearchOpen: (open: boolean) => void;
  setDmSearchQuery: (q: string) => void;
  setIsCreateGroupDmOpen?: (open: boolean) => void;
  setIsInviteOpen: (open: boolean) => void;
  setColonySettingsSection: (section: any) => void;
  setIsServerSettingsOpen: (open: boolean) => void;
  setNewChannelCategory: (cat: any) => void;
  setNewChannelType: (type: any) => void;
  setIsCreateChannelOpen: (open: boolean) => void;
  setIsCreateHubOpen: (open: boolean) => void;
  handleOpenEditChannel: (ch: any) => void;
  setColonies: React.Dispatch<React.SetStateAction<Colony[]>>;
  setColonyToEdit: (c: any) => void;
  setColonyToDelete: (c: any) => void;
  setIsCallPiP: (pip: boolean) => void;
  selectedActivityAppId: string | null;
  onItemClick?: () => void;
  onCloseDM?: (id: string) => void;
  onToggleCollapseSidebar?: () => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export const ChannelsSidebarWrapper: React.FC<ChannelsSidebarWrapperProps> = ({
  currentUser,
  isHome,
  activeColony,
  channels,
  activeChannelId,
  setActiveChannelId,
  activeCallChannelId,
  setActiveCallChannelId,
  isFriendsView,
  homeView,
  setHomeView,
  messageRequests,
  unreadCounts,
  unreadNotifCount,
  friends,
  dmChannels,
  allKnownMembers,
  collapsedCategories,
  setCollapsedCategories,
  threadsMap,
  channelThreads,
  activeThread,
  setActiveThread,
  activeCallCounts,
  calendarEvents,
  channelModals,
  setIsColonyEventsModalOpen,
  requireAuth,
  setIsDmSearchOpen,
  setDmSearchQuery,
  setIsCreateGroupDmOpen,
  setIsInviteOpen,
  setColonySettingsSection,
  setIsServerSettingsOpen,
  setNewChannelCategory,
  setNewChannelType,
  setIsCreateChannelOpen,
  setIsCreateHubOpen,
  handleOpenEditChannel,
  setColonies,
  setColonyToEdit,
  setColonyToDelete,
  setIsCallPiP,
  selectedActivityAppId,
  onItemClick,
  onCloseDM,
  onToggleCollapseSidebar,
  t,
}) => {
  return (
    <ChannelsSidebar
      currentUser={currentUser}
      requireAuth={requireAuth}
      isHome={isHome}
      activeColony={activeColony}
      channels={channels}
      onToggleCollapseSidebar={onToggleCollapseSidebar}
      activeChannelId={activeChannelId}
      setActiveChannelId={setActiveChannelId}
      activeCallChannelId={activeCallChannelId}
      setActiveCallChannelId={setActiveCallChannelId}
      isFriendsView={isFriendsView}
      homeView={homeView}
      setHomeView={setHomeView}
      messageRequestsCount={messageRequests.filter((r) => !r.isSpam).length}
      unreadNotificationsCount={unreadCounts?.['anticeil'] ?? unreadNotifCount}
      setFriendsTab={friends.setFriendsTab}
      friendRequests={friends.friendRequests}
      dmChannels={dmChannels}
      members={allKnownMembers}
      collapsedCategories={collapsedCategories}
      setCollapsedCategories={setCollapsedCategories}
      threadsMap={threadsMap}
      channelThreads={channelThreads}
      activeThread={activeThread}
      setActiveThread={setActiveThread}
      activeCallCounts={activeCallCounts}
      calendarEvents={calendarEvents}
      onOpenServerEvents={() => setIsColonyEventsModalOpen(true)}
      categories={channelModals.categories}
      onOpenCreateCategory={() => channelModals.setIsCreateCategoryOpen(true)}
      onDeleteCategory={channelModals.handleDeleteCategory}
      onUpdateCategory={channelModals.handleUpdateCategory}
      onMoveChannelCategory={channelModals.handleMoveChannelCategory}
      onItemClick={onItemClick}
      onCloseDM={onCloseDM}
      onOpenCreateGroupDm={() =>
        requireAuth(
          () => setIsCreateGroupDmOpen?.(true),
          t('Buat Group DM'),
          t('Masuk ke Anticeil untuk membuat obrolan grup.'),
        )
      }
      onOpenDmSearch={() =>
        requireAuth(
          () => {
            setIsDmSearchOpen(true);
            setDmSearchQuery('');
          },
          t('Cari Percakapan'),
          t('Masuk ke Anticeil untuk memulai obrolan langsung.'),
        )
      }
      onOpenInvite={() =>
        requireAuth(
          () => setIsInviteOpen(true),
          t('Undang Teman'),
          t('Masuk untuk membagikan tautan undangan colony.'),
        )
      }
      onOpenServerSettings={(section) => {
        requireAuth(() => {
          if (section) setColonySettingsSection(section);
          setIsServerSettingsOpen(true);
        });
      }}
      onOpenCreateChannel={(category, type = 'text', categoryId) => {
        requireAuth(
          () => {
            setNewChannelCategory(category as any);
            setNewChannelType(type);
            channelModals.setTargetCategoryId(categoryId || '');
            setIsCreateChannelOpen(true);
          },
          t('Buat Saluran'),
          t('Masuk ke Anticeil untuk membuat saluran obrolan atau panggilan suara.'),
        );
      }}
      onOpenCreateColony={() =>
        requireAuth(
          () => setIsCreateHubOpen(true),
          t('Buat Colony'),
          t('Masuk ke Anticeil untuk membuat colony komunitas.'),
        )
      }
      onOpenEditChannel={(ch) => handleOpenEditChannel(ch)}
      onUpdateColonyIcon={async (file) => {
        if (!activeColony) return;
        if (file.size > 5 * 1024 * 1024) {
          toast.error(t('Ukuran file maksimal 5 MB.'));
          return;
        }
        const reader = new FileReader();
        reader.onload = async (event) => {
          const res = event.target?.result as string;
          if (res) {
            const updated: Colony = { ...activeColony, iconUrl: res };
            setColonies((prev) => {
              const next = prev.map((h) => (h.id === activeColony.id ? updated : h));
              saveStoredColonies(next);
              return next;
            });
            try {
              await colonyApi.updateColony(activeColony.id, { iconUrl: res });
            } catch {}
            toast.success(t('Foto colony berhasil diperbarui! 🖼️'));
          }
        };
        reader.readAsDataURL(file);
      }}
      onOpenEditColony={() => setColonyToEdit(activeColony)}
      onOpenDeleteColony={() => setColonyToDelete(activeColony)}
      setIsCallPiP={setIsCallPiP}
      selectedActivityAppId={selectedActivityAppId}
      userBottomDock={null}
      t={t}
    />
  );
};

export interface UserBottomDockWrapperProps {
  currentUser: any;
  currentUserName: string;
  isMuted: boolean;
  setIsMuted: (val: boolean) => void;
  isDeafened: boolean;
  setIsDeafened: (val: boolean) => void;
  handleOpenUserSettings: (section?: string) => void;
  handleOpenEditProfile?: () => void;
  handleLogout: () => void;
  handleGoogleSignIn: () => void;
  onOpenLoginDialog?: () => void;
  channels: ColonyChannel[];
  activeCallChannelId: string | null;
  activeColony: Colony | null;
  setActiveChannelId: (id: string) => void;
  setIsCallPiP: (pip: boolean) => void;
  setActiveCallChannelId: (id: string | null) => void;
  setIsActivityOpen: (open: boolean) => void;
  onDisconnectCall?: () => void;
  selectedActivityAppId?: string | null;
  isActivityOpen?: boolean;
  isCallPiP?: boolean;
  activeChannel?: ColonyChannel | null;
  colonies?: Colony[];
  setActiveColonyId?: (id: string) => void;
  setHomeView?: (view: any) => void;
}

export const UserBottomDockWrapper: React.FC<UserBottomDockWrapperProps> = ({
  currentUser,
  currentUserName,
  isMuted,
  setIsMuted,
  isDeafened,
  setIsDeafened,
  handleOpenUserSettings,
  handleOpenEditProfile,
  handleLogout,
  handleGoogleSignIn,
  onOpenLoginDialog,
  channels,
  activeCallChannelId,
  activeColony,
  setActiveChannelId,
  setIsCallPiP,
  setActiveCallChannelId,
  setIsActivityOpen,
  onDisconnectCall,
  selectedActivityAppId,
  isActivityOpen,
  isCallPiP,
  activeChannel,
  colonies = [],
  setActiveColonyId,
  setHomeView,
}) => {
  const activeCallChannel =
    (activeCallChannelId ? channels.find((c) => c.id === activeCallChannelId) : null) ||
    activeChannel;
  return (
    <UserBottomDock
      currentUser={currentUser}
      currentUserName={currentUserName}
      isMuted={isMuted}
      setIsMuted={setIsMuted}
      isDeafened={isDeafened}
      setIsDeafened={setIsDeafened}
      onOpenSettings={handleOpenUserSettings}
      onOpenEditProfile={handleOpenEditProfile}
      onLogout={handleLogout}
      onGoogleSignIn={handleGoogleSignIn}
      onOpenLoginDialog={onOpenLoginDialog}
      activeCallChannelId={activeCallChannelId}
      activeCallChannelName={activeCallChannel?.name}
      activeColonyName={activeColony?.name}
      isActivityChannel={Boolean(selectedActivityAppId) || (!!activeCallChannelId && activeCallChannel?.type !== 'voice')}
      selectedActivityAppId={selectedActivityAppId}
      isActivityOpen={isActivityOpen}
      isCallPiP={isCallPiP}
      colonies={colonies}
      onReturnToCall={() => {
        const destId = activeCallChannelId || activeChannel?.id;
        if (destId) {
          // 1. Resolve matching colony for channel
          const matchingChannel = channels.find((c) => c.id === destId);
          const targetColonyId = destId.startsWith('dm-') ? 'anticeil' : matchingChannel?.colonyId;
          if (targetColonyId && setActiveColonyId) {
            setActiveColonyId(targetColonyId);
          }
          // 2. Clear any full-page view (Shop, Quests, Calendar, Friends, etc.)
          setHomeView?.(null);
          // 3. Switch to active destination channel
          setActiveChannelId(destId);
        } else if (selectedActivityAppId) {
          setActiveColonyId?.('anticeil');
          setActiveChannelId('');
          setHomeView?.('apps');
        }
        setIsCallPiP(false);
        setIsActivityOpen(true);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('anticeil_close_mobile_channels'));
        }
      }}
      onDisconnectCall={() => {
        if (onDisconnectCall) {
          onDisconnectCall();
        } else {
          setActiveCallChannelId(null);
          setIsActivityOpen(false);
          setIsCallPiP(false);
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('activity');
            window.history.replaceState(null, '', url.toString());
            window.dispatchEvent(new CustomEvent('anticeil_activity_close'));
          }
        }
      }}
    />
  );
};

export interface FriendsMainPageWrapperProps {
  friends: any;
  currentUser: any;
  members: any[];
  requireAuth: (action: () => void, title?: string, desc?: string) => void;
  handleStartDM: (m: any) => void;
  setIsDmSearchOpen: (open: boolean) => void;
  setDmSearchQuery: (q: string) => void;
  setIsMobileChannelsOpen: (open: boolean) => void;
  setAuthFeatureInfo: (info: { title: string; desc: string }) => void;
  setIsAuthRequiredOpen: (open: boolean) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export const FriendsMainPageWrapper: React.FC<FriendsMainPageWrapperProps> = ({
  friends,
  currentUser,
  members,
  requireAuth,
  handleStartDM,
  setIsDmSearchOpen,
  setDmSearchQuery,
  setIsMobileChannelsOpen,
  setAuthFeatureInfo,
  setIsAuthRequiredOpen,
  t,
}) => {
  return (
    <FriendsView
      {...friends}
      currentUser={currentUser}
      requireAuth={requireAuth}
      members={members}
      onTabChange={(tab) => {
        if (tab === 'add' && !currentUser) {
          setAuthFeatureInfo({
            title: t('Tambah Teman'),
            desc: t('Masuk ke Anticeil untuk mencari dan menambahkan teman baru.'),
          });
          setIsAuthRequiredOpen(true);
          return;
        }
        friends.onTabChange(tab);
      }}
      onStartDM={handleStartDM}
      onOpenDmSearch={() =>
        requireAuth(
          () => {
            setIsDmSearchOpen(true);
            setDmSearchQuery('');
          },
          t('Cari Percakapan'),
          t('Masuk ke Anticeil untuk memulai obrolan langsung.'),
        )
      }
      onOpenSidebar={() => setIsMobileChannelsOpen(true)}
      horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
    />
  );
};

export interface MembersSidebarContentWrapperProps {
  isDmMode: boolean;
  activeDmUserId?: string | null;
  activeDmMember?: any;
  currentUser: any;
  colonies: Colony[];
  friends: any[];
  channels: ColonyChannel[];
  activeChannel: ColonyChannel | null;
  displayMembers: any[];
  handleCreateCallLog: (log: any) => void;
  setActiveColonyId: (id: string) => void;
  setIsMobileMembersOpen: (open: boolean) => void;
  setShowMemberList: (show: boolean) => void;
  setIsInviteOpen: (open: boolean) => void;
  handleStartDM: (m: any) => void;
  onAddMemberToGroup?: (memberId: string) => void;
  onLeaveGroup?: (channelId: string) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export const MembersSidebarContentWrapper: React.FC<MembersSidebarContentWrapperProps> = ({
  isDmMode,
  activeDmUserId,
  activeDmMember,
  currentUser,
  colonies,
  friends,
  activeChannel,
  displayMembers,
  handleCreateCallLog,
  setActiveColonyId,
  setIsMobileMembersOpen,
  setShowMemberList,
  setIsInviteOpen,
  handleStartDM,
  onAddMemberToGroup,
  onLeaveGroup,
  t,
}) => {
  if (activeChannel?.isGroupDm) {
    return (
      <GroupDmMembersSidebar
        channel={activeChannel}
        members={friends}
        currentUser={currentUser}
        onAddMember={(memberId) => onAddMemberToGroup?.(memberId)}
        onLeaveGroup={(channelId) => onLeaveGroup?.(channelId)}
        onStartDM={handleStartDM}
        onClose={() => {
          setShowMemberList(false);
          setIsMobileMembersOpen(false);
        }}
        t={t}
      />
    );
  }

  if (isDmMode && activeDmUserId) {
    return (
      <DmUserProfileSidebar
        userId={activeDmUserId}
        member={activeDmMember}
        currentUser={currentUser}
        colonies={colonies}
        friends={friends}
        onStartCall={(callType) => {
          if (activeDmUserId) {
            handleCreateCallLog({
              peerId: activeDmUserId,
              peerName: activeDmMember?.name || activeChannel?.name || 'Direct Message',
              peerAvatar: activeDmMember?.avatar || null,
              type: 'outgoing',
              isVideo: callType === 'video',
              channelId: activeChannel?.id,
              duration: 'Ongoing',
            });
          }
        }}
        onSelectColony={(colonyId) => {
          setActiveColonyId(colonyId);
          setIsMobileMembersOpen(false);
        }}
        onClose={() => {
          setShowMemberList(false);
          setIsMobileMembersOpen(false);
        }}
        t={t}
      />
    );
  }

  return (
    <ColonyMembersSidebar
      displayMembers={displayMembers}
      onInviteClick={() => setIsInviteOpen(true)}
      onStartDM={handleStartDM}
      t={t}
    />
  );
};
