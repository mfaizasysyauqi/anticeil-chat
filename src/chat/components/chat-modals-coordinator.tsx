import React from 'react';
import { ColonyEventsModal } from '@/features/events';
import { AddFriendDialog } from '@/features/friends';
import { ChatDialogsPortal } from '@/features/chat';
import { colonyApi } from '../chat-api';
import { saveStoredColonies } from '../chat-defaults';
import type { Colony, ColonyChannel } from '../chat-types';

export interface ChatModalsCoordinatorProps {
  isColonyEventsModalOpen: boolean;
  setIsColonyEventsModalOpen: (open: boolean) => void;
  activeColony: Colony | null;
  channels: ColonyChannel[];
  calendarEvents: any[];
  createCalendarEvent: (e: any) => Promise<any> | any;
  currentUser: any;
  setActiveCallChannelId: (id: string | null) => void;
  setActiveChannelId: (id: string) => void;

  colonyModals: any;
  channelModals: any;
  mediaModals: any;
  activeChannel: ColonyChannel | null;
  members: any[];
  setMembers: React.Dispatch<React.SetStateAction<any[]>>;
  colonyChannels: ColonyChannel[];
  setColonies: React.Dispatch<React.SetStateAction<Colony[]>>;

  isDmSearchOpen: boolean;
  setIsDmSearchOpen: (open: boolean) => void;
  dmSearchQuery: string;
  setDmSearchQuery: (q: string) => void;
  dmChannels: any[];
  setActiveColonyId: (id: string) => void;
  handleStartDM: (member: any) => void;

  isGiftModalOpen: boolean;
  setIsGiftModalOpen: (open: boolean) => void;
  handleSendGift: (gift: any) => void;

  isUserSettingsOpen: boolean;
  setIsUserSettingsOpen: (open: boolean) => void;
  userSettingsInitialSection: string;
  isEditProfileOpen: boolean;
  setIsEditProfileOpen: (open: boolean) => void;
  handleOpenEditProfile?: () => void;
  currentUserName: string;
  updateNameMutation: any;
  updateUsernameMutation: any;
  theme: any;
  setTheme: any;
  handleGoogleSignIn: () => void;
  handleLogout: () => void;

  isCreateThreadModalOpen: boolean;
  setIsCreateThreadModalOpen: (open: boolean) => void;
  handleCreateThread: any;
  isThreadDrawerOpen: boolean;
  setIsThreadDrawerOpen: (open: boolean) => void;
  activeThread: any;
  threadMessages: any[];
  handleSendThreadMessage: any;
  renderFormattedMessage: any;

  activeCallChannelId: string | null;
  isCallPiP: boolean;
  setIsCallPiP: (pip: boolean) => void;
  isPlusOrAbove: boolean;
  socket: any;
  selectedActivityAppId: string | null;
  setSelectedActivityAppId: (id: string | null) => void;
  setIsActivityOpen: any;
  navigate: any;

  isAuthRequiredOpen: boolean;
  setIsAuthRequiredOpen: any;
  authFeatureInfo: any;
  handleDevMockLogin: any;

  isAddFriendDialogOpen: boolean;
  setIsAddFriendDialogOpen: (open: boolean) => void;
  friends: any;
  onNavigateToApps?: () => void;

  t: (key: string, params?: Record<string, any>) => string;
}

export const ChatModalsCoordinator: React.FC<ChatModalsCoordinatorProps> = ({
  isColonyEventsModalOpen,
  setIsColonyEventsModalOpen,
  activeColony,
  channels,
  calendarEvents,
  createCalendarEvent,
  currentUser,
  setActiveCallChannelId,
  setActiveChannelId,

  colonyModals,
  channelModals,
  mediaModals,
  activeChannel,
  members,
  setMembers,
  colonyChannels,
  setColonies,

  isDmSearchOpen,
  setIsDmSearchOpen,
  dmSearchQuery,
  setDmSearchQuery,
  dmChannels,
  setActiveColonyId,
  handleStartDM,

  isGiftModalOpen,
  setIsGiftModalOpen,
  handleSendGift,

  isUserSettingsOpen,
  setIsUserSettingsOpen,
  userSettingsInitialSection,
  isEditProfileOpen,
  setIsEditProfileOpen,
  handleOpenEditProfile,
  currentUserName,
  updateNameMutation,
  updateUsernameMutation,
  theme,
  setTheme,
  handleGoogleSignIn,
  handleLogout,

  isCreateThreadModalOpen,
  setIsCreateThreadModalOpen,
  handleCreateThread,
  isThreadDrawerOpen,
  setIsThreadDrawerOpen,
  activeThread,
  threadMessages,
  handleSendThreadMessage,
  renderFormattedMessage,

  activeCallChannelId,
  isCallPiP,
  setIsCallPiP,
  isPlusOrAbove,
  socket,
  selectedActivityAppId,
  setSelectedActivityAppId,
  setIsActivityOpen,
  navigate,

  isAuthRequiredOpen,
  setIsAuthRequiredOpen,
  authFeatureInfo,
  handleDevMockLogin,

  isAddFriendDialogOpen,
  setIsAddFriendDialogOpen,
  friends,
  onNavigateToApps,

  t,
}) => {
  return (
    <>
      <ColonyEventsModal
        isOpen={isColonyEventsModalOpen}
        onClose={() => setIsColonyEventsModalOpen(false)}
        activeColony={activeColony}
        channels={channels}
        events={calendarEvents}
        onCreateEvent={createCalendarEvent}
        currentUser={currentUser}
        onJoinChannel={(chId) => {
          setActiveCallChannelId(chId);
          setActiveChannelId(chId);
        }}
      />

      <ChatDialogsPortal
        colonyModals={colonyModals}
        channelModals={channelModals}
        mediaModals={mediaModals}
        activeColony={activeColony}
        activeChannel={activeChannel}
        currentUser={currentUser}
        members={members}
        setMembers={setMembers}
        channels={channels}
        colonyChannels={colonyChannels}
        onUpdateColony={async (colonyId, updates) => {
          if (!activeColony) return;
          const updated = { ...activeColony, ...updates };
          setColonies((prev) => {
            const next = prev.map((h) => (h.id === colonyId ? updated : h));
            saveStoredColonies(next);
            return next;
          });
          try {
            await colonyApi.updateColony(colonyId, updates);
          } catch {}
        }}
        isDmSearchOpen={isDmSearchOpen}
        setIsDmSearchOpen={setIsDmSearchOpen}
        dmSearchQuery={dmSearchQuery}
        setDmSearchQuery={setDmSearchQuery}
        dmChannels={dmChannels}
        setActiveColonyId={setActiveColonyId}
        setActiveChannelId={setActiveChannelId}
        handleStartDM={handleStartDM}
        isGiftModalOpen={isGiftModalOpen}
        setIsGiftModalOpen={setIsGiftModalOpen}
        handleSendGift={handleSendGift}
        isUserSettingsOpen={isUserSettingsOpen}
        setIsUserSettingsOpen={setIsUserSettingsOpen}
        userSettingsInitialSection={userSettingsInitialSection}
        isEditProfileOpen={isEditProfileOpen}
        setIsEditProfileOpen={setIsEditProfileOpen}
        handleOpenEditProfile={handleOpenEditProfile}
        currentUserName={currentUserName}
        updateNameMutation={updateNameMutation}
        updateUsernameMutation={updateUsernameMutation}
        theme={theme}
        setTheme={setTheme}
        handleGoogleSignIn={handleGoogleSignIn}
        handleLogout={handleLogout}
        isCreateThreadModalOpen={isCreateThreadModalOpen}
        setIsCreateThreadModalOpen={setIsCreateThreadModalOpen}
        handleCreateThread={handleCreateThread}
        isThreadDrawerOpen={isThreadDrawerOpen}
        setIsThreadDrawerOpen={setIsThreadDrawerOpen}
        activeThread={activeThread}
        threadMessages={threadMessages}
        handleSendThreadMessage={handleSendThreadMessage}
        renderFormattedMessage={renderFormattedMessage}
        activeCallChannelId={activeCallChannelId}
        setActiveCallChannelId={setActiveCallChannelId}
        isCallPiP={isCallPiP}
        setIsCallPiP={setIsCallPiP}
        isPlusOrAbove={isPlusOrAbove}
        socket={socket}
        selectedActivityAppId={selectedActivityAppId}
        setSelectedActivityAppId={setSelectedActivityAppId}
        setIsActivityOpen={setIsActivityOpen}
        navigate={navigate}
        isAuthRequiredOpen={isAuthRequiredOpen}
        setIsAuthRequiredOpen={setIsAuthRequiredOpen}
        authFeatureInfo={authFeatureInfo}
        onDevMockLogin={handleDevMockLogin}
        onNavigateToApps={onNavigateToApps}
        t={t}
      />

      <AddFriendDialog
        open={isAddFriendDialogOpen}
        onOpenChange={setIsAddFriendDialogOpen}
        onAddFriend={friends.onAddFriend}
        isAddingFriend={friends.isAddingFriend}
        currentUser={currentUser}
        allFriends={friends.allFriends}
        friendRequests={friends.friendRequests}
        members={members}
      />
    </>
  );
};
