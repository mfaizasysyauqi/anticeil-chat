import React from 'react';
import { toast } from 'sonner';
import type { Colony, ColonyChannel, ColonyMember } from '@/chat/chat-types';
import { colonyApi } from '@/chat/chat-api';
import { SendGiftDialog } from '@/features/gifts';
import { QuickAddEmojiDialog, QuickAddStickerDialog, type useMediaModals } from '@/features/media';
import {
  CreateOrJoinColonyDialog,
  EditColonyDialog,
  DeleteColonyDialog,
  ColonyInviteDialog,
  type useColonyModals,
} from '@/features/colonies';
import { ColonySettingsDialog } from '@/features/colony-settings';
import { WebhookDialog } from '@/features/webhooks';
import {
  CreateChannelDialog,
  EditChannelDialog,
  DeleteChannelDialog,
  DmSearchDialog,
  CreateGroupDmDialog,
  ChannelSettingsDialog,
  CreateCategoryDialog,
  type useChannelModals,
} from '@/features/channels';

import { CreateThreadModal, ThreadDrawer } from '@/features/threads';
import { CallStage, UserSettingsModal } from '@/features/voice';
import { AuthRequiredDialog } from '@/features/auth';
import { EditProfileDialog } from '@/features/profile';
import { CommunityWelcomeDialog } from '@/features/onboarding/components/community-welcome-dialog';

export interface ChatDialogsPortalProps {
  colonies?: Colony[];
  colonyModals: ReturnType<typeof useColonyModals>;
  channelModals: ReturnType<typeof useChannelModals>;
  mediaModals: ReturnType<typeof useMediaModals>;
  activeColony: Colony | null;
  activeChannel: ColonyChannel | null;
  currentUser: any;
  members: ColonyMember[];
  setMembers: React.Dispatch<React.SetStateAction<ColonyMember[]>>;
  channels: ColonyChannel[];
  colonyChannels: ColonyChannel[];
  onUpdateColony: (colonyId: string, updates: Partial<Colony>) => Promise<void>;

  // Dm search & direct messaging
  isDmSearchOpen: boolean;
  setIsDmSearchOpen: (open: boolean) => void;
  dmSearchQuery: string;
  setDmSearchQuery: (q: string) => void;
  dmChannels: ColonyChannel[];
  isCreateGroupDmOpen?: boolean;
  setIsCreateGroupDmOpen?: (open: boolean) => void;
  handleCreateGroupDM?: (name: string, memberIds: string[]) => void;
  setActiveColonyId: (id: string) => void;
  setActiveChannelId: (id: string) => void;
  handleStartDM: (member: ColonyMember) => void;

  // Gift
  isGiftModalOpen: boolean;
  setIsGiftModalOpen: (open: boolean) => void;
  handleSendGift: (gift: any) => void;

  // User Settings
  isUserSettingsOpen: boolean;
  setIsUserSettingsOpen: (open: boolean) => void;
  userSettingsInitialSection?: string;
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

  // Threads
  isCreateThreadModalOpen: boolean;
  setIsCreateThreadModalOpen: (open: boolean) => void;
  handleCreateThread: (name: string, initialMessage?: string) => Promise<void>;
  isThreadDrawerOpen: boolean;
  setIsThreadDrawerOpen: (open: boolean) => void;
  activeThread: any;
  threadMessages: any[];
  handleSendThreadMessage: (content: string) => Promise<void>;
  renderFormattedMessage: (text: string) => React.ReactNode;

  // PiP Call stage
  activeCallChannelId: string | null;
  setActiveCallChannelId: (id: string | null) => void;
  isCallPiP: boolean;
  setIsCallPiP: (pip: boolean) => void;
  isPlusOrAbove: boolean;
  socket: any;
  selectedActivityAppId: string | null;
  setSelectedActivityAppId?: (id: string | null) => void;
  setIsActivityOpen: React.Dispatch<React.SetStateAction<boolean>>;
  navigate: (path: string) => void;

  // Auth required
  isAuthRequiredOpen: boolean;
  setIsAuthRequiredOpen: (open: boolean) => void;
  authFeatureInfo: { title?: string; desc?: string };
  onGuestLogin?: (nickname: string) => void;
  onDevMockLogin?: (userIndex: number) => void;
  onNavigateToApps?: () => void;

  t: (key: string, params?: Record<string, any>) => string;
}

export type CommunityDialogsPortalProps = ChatDialogsPortalProps;

export function ChatDialogsPortal({
  colonies = [],
  colonyModals,
  channelModals,
  mediaModals,
  activeColony,
  activeChannel,
  currentUser,
  members,
  setMembers,
  channels,
  colonyChannels,
  onUpdateColony,
  isDmSearchOpen,
  setIsDmSearchOpen,
  dmSearchQuery,
  setDmSearchQuery,
  dmChannels,
  isCreateGroupDmOpen = false,
  setIsCreateGroupDmOpen,
  handleCreateGroupDM,
  setActiveColonyId,
  setActiveChannelId,
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
  setActiveCallChannelId,
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
  onGuestLogin,
  onDevMockLogin,
  onNavigateToApps,
  t,
}: CommunityDialogsPortalProps) {
  const [isOnboardingWelcomeOpen, setIsOnboardingWelcomeOpen] = React.useState(false);

  React.useEffect(() => {
    if (
      activeColony &&
      activeColony.id !== 'anticeil' &&
      activeColony.onboarding?.enabled
    ) {
      try {
        const hasCompleted = localStorage.getItem(`anticeil_onboarded_${activeColony.id}`);
        if (!hasCompleted && activeColony.role !== 'owner') {
          setIsOnboardingWelcomeOpen(true);
        }
      } catch {}
    }
  }, [activeColony?.id, activeColony?.onboarding?.enabled, activeColony?.role]);
  return (
    <>
      {/* Send Gift Dialog */}
      <SendGiftDialog
        open={isGiftModalOpen}
        onOpenChange={setIsGiftModalOpen}
        onSendGift={handleSendGift}
      />

      {/* Quick Add Server Emoji Dialog */}
      <QuickAddEmojiDialog
        open={mediaModals.isQuickAddEmojiOpen}
        onOpenChange={mediaModals.setIsQuickAddEmojiOpen}
        activeColony={activeColony}
        quickEmojiName={mediaModals.quickEmojiName}
        setQuickEmojiName={mediaModals.setQuickEmojiName}
        quickEmojiCode={mediaModals.quickEmojiCode}
        setQuickEmojiCode={mediaModals.setQuickEmojiCode}
        quickEmojiUrl={mediaModals.quickEmojiUrl}
        setQuickEmojiUrl={mediaModals.setQuickEmojiUrl}
        isSubmittingServerMedia={mediaModals.isSubmittingServerMedia}
        onQuickAddEmoji={mediaModals.handleQuickAddEmoji}
      />

      {/* Quick Add Server Sticker Dialog */}
      <QuickAddStickerDialog
        open={mediaModals.isQuickAddStickerOpen}
        onOpenChange={mediaModals.setIsQuickAddStickerOpen}
        activeColony={activeColony}
        quickStickerName={mediaModals.quickStickerName}
        setQuickStickerName={mediaModals.setQuickStickerName}
        quickStickerUrl={mediaModals.quickStickerUrl}
        setQuickStickerUrl={mediaModals.setQuickStickerUrl}
        isSubmittingServerMedia={mediaModals.isSubmittingServerMedia}
        onQuickAddSticker={mediaModals.handleQuickAddSticker}
      />

      {/* Create or Join Server Dialog */}
      <CreateOrJoinColonyDialog
        open={colonyModals.isCreateHubOpen}
        onOpenChange={colonyModals.setIsCreateHubOpen}
        newServerName={colonyModals.newHubName}
        setNewServerName={colonyModals.setNewHubName}
        newServerDesc={colonyModals.newHubDesc}
        setNewServerDesc={colonyModals.setNewHubDesc}
        newServerIconUrl={colonyModals.newHubIconUrl}
        setNewServerIconUrl={colonyModals.setNewHubIconUrl}
        joinInviteCode={colonyModals.joinInviteCode}
        setJoinInviteCode={colonyModals.setJoinInviteCode}
        isJoiningServer={colonyModals.isJoiningColony}
        onCreateServerSubmit={colonyModals.handleCreateHubSubmit}
        onJoinServer={colonyModals.handleJoinColony}
        t={t}
      />

      {/* Server Settings Dialog */}
      <ColonySettingsDialog
        isOpen={colonyModals.isServerSettingsOpen}
        initialSection={colonyModals.serverSettingsSection}
        onClose={() => colonyModals.setIsServerSettingsOpen(false)}
        activeColony={activeColony}
        currentUser={currentUser}
        members={members}
        channels={channels}
        onUpdateColony={onUpdateColony}
        onDeleteHub={(hub) => colonyModals.setColonyToDelete(hub)}
        onOpenWebhooks={() => channelModals.setIsWebhookDialogOpen(true)}
        onUpdateMembers={setMembers}
        onNavigateToApps={onNavigateToApps}
      />

      {/* Edit Server Dialog */}
      <EditColonyDialog
        serverToEdit={colonyModals.colonyToEdit}
        onClose={() => colonyModals.setColonyToEdit(null)}
        editServerName={colonyModals.editHubName}
        setEditServerName={colonyModals.setEditHubName}
        editServerDesc={colonyModals.editHubDesc}
        setEditServerDesc={colonyModals.setEditHubDesc}
        onEditServerSubmit={colonyModals.handleEditHubSubmit}
        t={t}
      />

      {/* Delete Server Dialog */}
      <DeleteColonyDialog
        serverToDelete={colonyModals.colonyToDelete}
        onClose={() => colonyModals.setColonyToDelete(null)}
        onDeleteConfirm={colonyModals.handleDeleteHubConfirm}
        t={t}
      />

      {/* Webhook Integration Dialog */}
      <WebhookDialog
        isOpen={channelModals.isWebhookDialogOpen}
        onClose={() => channelModals.setIsWebhookDialogOpen(false)}
        activeChannel={activeChannel}
        colonyChannels={colonyChannels}
        activeColony={activeColony}
        onSelectChannel={(chId) => setActiveChannelId(chId)}
        onCreateChannel={() => channelModals.setIsCreateChannelOpen(true)}
      />

      {/* Create Channel Dialog */}
      <CreateChannelDialog
        open={channelModals.isCreateChannelOpen}
        onOpenChange={channelModals.setIsCreateChannelOpen}
        activeColony={activeColony}
        newChannelCategory={channelModals.newChannelCategory}
        newChannelType={channelModals.newChannelType}
        setNewChannelType={channelModals.setNewChannelType}
        newChannelName={channelModals.newChannelName}
        setNewChannelName={channelModals.setNewChannelName}
        newChannelIsPrivate={channelModals.newChannelIsPrivate}
        setNewChannelIsPrivate={channelModals.setNewChannelIsPrivate}
        onCreateChannelSubmit={channelModals.handleCreateChannelSubmit}
        categories={channelModals.categories}
        targetCategoryId={channelModals.targetCategoryId}
        setTargetCategoryId={channelModals.setTargetCategoryId}
        t={t}
      />

      {/* Create Category Dialog */}
      <CreateCategoryDialog
        open={channelModals.isCreateCategoryOpen}
        onOpenChange={channelModals.setIsCreateCategoryOpen}
        categoryName={channelModals.newCategoryName}
        setCategoryName={channelModals.setNewCategoryName}
        onSubmit={channelModals.handleCreateCategorySubmit}
        t={t}
      />

      {/* Edit Channel Dialog */}
      <EditChannelDialog
        channelToEdit={channelModals.channelToEdit}
        onClose={() => channelModals.setChannelToEdit(null)}
        editChannelType={channelModals.editChannelType}
        setEditChannelType={channelModals.setEditChannelType}
        editChannelName={channelModals.editChannelName}
        setEditChannelName={channelModals.setEditChannelName}
        editChannelDesc={channelModals.editChannelDesc}
        setEditChannelDesc={channelModals.setEditChannelDesc}
        onEditChannelSubmit={channelModals.handleEditChannelSubmit}
        t={t}
      />

      {/* Delete Channel Dialog */}
      <DeleteChannelDialog
        channelToDelete={channelModals.channelToDelete}
        onClose={() => channelModals.setChannelToDelete(null)}
        onDeleteConfirm={channelModals.handleDeleteChannelConfirm}
        t={t}
      />

      {/* DM Search Dialog */}
      <DmSearchDialog
        open={isDmSearchOpen}
        onOpenChange={setIsDmSearchOpen}
        dmSearchQuery={dmSearchQuery}
        setDmSearchQuery={setDmSearchQuery}
        dmChannels={dmChannels}
        members={members}
        currentUser={currentUser}
        onSelectDmChannel={(channelId) => {
          setActiveColonyId('anticeil');
          setActiveChannelId(channelId);
        }}
        onStartDM={handleStartDM}
        onOpenCreateGroupDm={setIsCreateGroupDmOpen ? () => setIsCreateGroupDmOpen(true) : undefined}
        t={t}
      />

      {/* Create Group DM Dialog */}
      {setIsCreateGroupDmOpen && handleCreateGroupDM && (
        <CreateGroupDmDialog
          open={isCreateGroupDmOpen}
          onOpenChange={setIsCreateGroupDmOpen}
          friends={members}
          currentUser={currentUser}
          onCreateGroupDm={handleCreateGroupDM}
          t={t}
        />
      )}

      {/* Server Invite Dialog */}
      <ColonyInviteDialog
        open={colonyModals.isInviteOpen}
        onOpenChange={colonyModals.setIsInviteOpen}
        activeServer={activeColony}
        onInviteUsername={colonyModals.handleInviteByUsername}
        members={members}
        t={t}
      />

      {/* Unified User Settings Modal (Discord-style) */}
      <UserSettingsModal
        open={isUserSettingsOpen}
        onOpenChange={setIsUserSettingsOpen}
        colonies={colonies}
        currentUser={currentUser}
        currentUserName={currentUserName}
        onSaveDisplayName={async (name) => {
          try {
            await updateNameMutation.mutateAsync({ firstName: name, lastName: '' });
            toast.success(t('Nama tampilan berhasil disimpan! 🎉'));
          } catch {
            toast.error(t('Gagal menyimpan nama tampilan.'));
          }
        }}
        isSavingDisplayName={updateNameMutation.isPending}
        onSaveUsername={async (username) => {
          try {
            await updateUsernameMutation.mutateAsync({ username });
            toast.success(t('Username berhasil diperbarui! 🎉'));
          } catch (err: any) {
            toast.error(err?.response?.data?.message || t('Gagal menyimpan username.'));
          }
        }}
        isSavingUsername={updateUsernameMutation.isPending}
        theme={theme}
        setTheme={setTheme}
        onGoogleSignIn={handleGoogleSignIn}
        onLogout={handleLogout}
        initialSection={userSettingsInitialSection}
        onOpenEditProfile={() => {
          setIsEditProfileOpen(true);
        }}
      />

      {/* Standalone Discord-style Edit Profile Customization Modal */}
      <EditProfileDialog
        open={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
        currentUser={currentUser}
        currentUserName={currentUserName}
        colonies={colonies}
        onOpenUserSettings={() => {
          setIsEditProfileOpen(false);
          setIsUserSettingsOpen(true);
        }}
      />

      {/* Create Thread Modal */}
      <CreateThreadModal
        isOpen={isCreateThreadModalOpen}
        onClose={() => setIsCreateThreadModalOpen(false)}
        channelName={activeChannel?.name}
        onCreateThread={handleCreateThread}
      />

      {/* Thread Drawer */}
      <ThreadDrawer
        isOpen={isThreadDrawerOpen}
        onClose={() => setIsThreadDrawerOpen(false)}
        activeThread={activeThread}
        threadMessages={threadMessages}
        onSendMessage={handleSendThreadMessage}
        renderFormattedMessage={renderFormattedMessage}
      />

      {/* Channel Settings Dialog */}
      <ChannelSettingsDialog
        categories={channelModals.categories}
        channel={channelModals.channelForSettings}
        members={members}
        isOpen={!!channelModals.channelForSettings}
        onClose={() => channelModals.setChannelForSettings(null)}
        onUpdateChannel={channelModals.handleUpdateChannelSettings}
        onDeleteChannel={(ch) => {
          channelModals.setChannelForSettings(null);
          channelModals.handleOpenDeleteChannel(ch, { stopPropagation: () => {} } as any);
        }}
        onOpenWebhooks={(chId) => {
          setActiveChannelId(chId);
          channelModals.setIsWebhookDialogOpen(true);
        }}
      />

      {/* Floating PiP Call Stage */}
      {activeCallChannelId && isCallPiP && (() => {
        const pipChannel = channels.find((c) => c.id === activeCallChannelId);
        if (!pipChannel) return null;
        return (
          <CallStage
            channel={pipChannel}
            activeColony={activeColony}
            currentUser={currentUser}
            isPlusOrAbove={isPlusOrAbove}
            socket={socket}
            isCallActive={true}
            isPiP={true}
            initialAppId={selectedActivityAppId}
            onToggleActivity={(open) => setIsActivityOpen((prev) => (typeof open === 'boolean' ? open : !prev))}
            onActivityChange={(appId) => setSelectedActivityAppId?.(appId)}
            onTogglePiP={() => {
              setActiveChannelId(activeCallChannelId);
              setIsCallPiP(false);
            }}
            onEndCall={() => {
              setActiveCallChannelId(null);
              setIsActivityOpen(false);
            }}
            onNavigateToBilling={() => navigate('/platform/billing')}
          />
        );
      })()}

      {/* Global Auth Required Prompt Dialog */}
      <AuthRequiredDialog
        isOpen={isAuthRequiredOpen}
        onClose={() => setIsAuthRequiredOpen(false)}
        onGoogleSignIn={handleGoogleSignIn}
        onGuestLogin={onGuestLogin}
        onDevMockLogin={onDevMockLogin}
        featureTitle={authFeatureInfo.title}
        featureDescription={authFeatureInfo.desc}
      />

      {/* Community Server Onboarding & Welcome Screen */}
      {activeColony && (
        <CommunityWelcomeDialog
          isOpen={isOnboardingWelcomeOpen}
          onClose={() => setIsOnboardingWelcomeOpen(false)}
          activeColony={activeColony}
          channels={channels}
        />
      )}
    </>
  );
}

export const CommunityDialogsPortal = ChatDialogsPortal;
