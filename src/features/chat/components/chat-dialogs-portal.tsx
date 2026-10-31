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
  ChannelSettingsDialog,
  type useChannelModals,
} from '@/features/channels';

import { CreateThreadModal, ThreadDrawer } from '@/features/threads';
import { CallStage, UserSettingsModal } from '@/features/voice';
import { AuthRequiredDialog } from '@/features/auth';

export interface ChatDialogsPortalProps {
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
  onUpdateHub: (colonyId: string, updates: Partial<Colony>) => Promise<void>;

  // Dm search & direct messaging
  isDmSearchOpen: boolean;
  setIsDmSearchOpen: (open: boolean) => void;
  dmSearchQuery: string;
  setDmSearchQuery: (q: string) => void;
  dmChannels: ColonyChannel[];
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
  userSettingsInitialSection?: 'account' | 'voice' | 'camera' | 'appearance';
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

  t: (key: string, params?: Record<string, any>) => string;
}

export type CommunityDialogsPortalProps = ChatDialogsPortalProps;

export function ChatDialogsPortal({
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
  onUpdateHub,
  isDmSearchOpen,
  setIsDmSearchOpen,
  dmSearchQuery,
  setDmSearchQuery,
  dmChannels,
  setActiveColonyId,
  setActiveChannelId,
  handleStartDM,
  isGiftModalOpen,
  setIsGiftModalOpen,
  handleSendGift,
  isUserSettingsOpen,
  setIsUserSettingsOpen,
  userSettingsInitialSection,
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
  t,
}: CommunityDialogsPortalProps) {
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
        isJoiningServer={colonyModals.isJoiningHub}
        onCreateServerSubmit={colonyModals.handleCreateHubSubmit}
        onJoinServer={colonyModals.handleJoinHub}
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
        onUpdateHub={onUpdateHub}
        onDeleteHub={(hub) => colonyModals.setHubToDelete(hub)}
        onOpenWebhooks={() => channelModals.setIsWebhookDialogOpen(true)}
        onUpdateMembers={setMembers}
      />

      {/* Edit Server Dialog */}
      <EditColonyDialog
        serverToEdit={colonyModals.hubToEdit}
        onClose={() => colonyModals.setHubToEdit(null)}
        editServerName={colonyModals.editHubName}
        setEditServerName={colonyModals.setEditHubName}
        editServerDesc={colonyModals.editHubDesc}
        setEditServerDesc={colonyModals.setEditHubDesc}
        onEditServerSubmit={colonyModals.handleEditHubSubmit}
        t={t}
      />

      {/* Delete Server Dialog */}
      <DeleteColonyDialog
        serverToDelete={colonyModals.hubToDelete}
        onClose={() => colonyModals.setHubToDelete(null)}
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
        t={t}
      />

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
        channel={channelModals.channelForSettings}
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
        featureTitle={authFeatureInfo.title}
        featureDescription={authFeatureInfo.desc}
      />
    </>
  );
}

export const CommunityDialogsPortal = ChatDialogsPortal;
