import React, { useState } from 'react';
import { Socket } from 'socket.io-client';
import {
  Volume2,
  MessageSquare,
  Menu,
  Maximize2,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { ColonyChannel, Colony } from '@/chat/chat-types';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import { toast } from 'sonner';

import { useCallWebRTC } from '../hooks/use-call-webrtc';
import { CallParticipantGrid } from './call-participant-grid';
import { CallControlsBar } from './call-controls-bar';
import { ActivityLauncherDialog } from './activity-launcher-dialog';
import { VoiceInviteDialog } from './voice-invite-dialog';
import { PiPCallStage } from './pip-call-stage';
import { ActivityFilmstrip } from './activity-filmstrip';
import { ActivityStage } from './activities/activity-stage';
import { MagneticFloatingCollapseButton } from '@/components/ui/magnetic-floating-collapse-button';
import { ActivityAppBar, YouTubeBadgeIcon } from '@/features/apps/components/activity-app-bar';

export { YouTubeBadgeIcon };

export interface CallStageProps {
  channel: ColonyChannel;
  activeColony?: Colony | null;
  currentUser: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    imageUrl?: string | null;
  } | null | undefined;
  isPlusOrAbove: boolean;
  socket: Socket | null;
  isCallActive: boolean;
  isPiP: boolean;
  initialAppId?: string | null;
  isChatOpen?: boolean;
  onToggleChat?: () => void;
  onToggleActivity?: (open?: boolean) => void;
  onActivityChange?: (appId: string | null) => void;
  onTogglePiP: () => void;
  onEndCall: () => void;
  onNavigateToBilling?: () => void;
  onOpenMobileChannels?: () => void;
}

export type CommunityCallStageProps = CallStageProps;

export function CallStage({
  channel,
  activeColony,
  currentUser,
  isPlusOrAbove,
  socket,
  isCallActive,
  isPiP,
  initialAppId,
  isChatOpen,
  onToggleChat,
  onToggleActivity,
  onActivityChange,
  onTogglePiP,
  onEndCall,
  onNavigateToBilling,
  onOpenMobileChannels,
}: CommunityCallStageProps) {
  // Invite Modal state
  const [isInviteVoiceOpen, setIsInviteVoiceOpen] = useState(false);
  const [copiedVoiceCallLink, setCopiedVoiceCallLink] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isAppLauncherOpen, setIsAppLauncherOpen] = useState(false);
  const [isFilmstripCollapsed, setIsFilmstripCollapsed] = useState(false);

  // WebRTC & Media hook
  const {
    localStream,
    screenStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isSpeakingLocal,
    participants,
    currentUserName,
    totalInCall,
    activeAppId,
    currentActiveApp,
    isAnyoneScreenSharing,
    screenSharePeer,
    activeScreenStream,
    callInviteUrl,
    isUpgradeModalOpen,
    setIsUpgradeModalOpen,
    handleToggleMute,
    handleToggleVideo,
    handleToggleScreenShare,
    handleLaunchApp,
    handleStopActivity,
  } = useCallWebRTC({
    channel,
    activeColony,
    currentUser,
    isPlusOrAbove,
    socket,
    isCallActive,
    initialAppId,
    onToggleActivity,
    onActivityChange,
  });

  const handleCopyCallLink = () => {
    setIsInviteVoiceOpen(true);
  };

  const handleExecuteCopyCallLink = () => {
    if (callInviteUrl) {
      navigator.clipboard.writeText(callInviteUrl);
      setCopiedVoiceCallLink(true);
      toast.success(
        activeAppId
          ? `Link panggilan & aktivitas ${currentActiveApp?.title || ''} disalin!`
          : 'Link panggilan berhasil disalin!',
      );
      setTimeout(() => setCopiedVoiceCallLink(false), 2500);
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  if (!isCallActive) return null;

  // Render Floating Picture-in-Picture Mini Stage
  if (isPiP) {
    return (
      <PiPCallStage
        channel={channel}
        totalInCall={totalInCall}
        activeAppId={activeAppId}
        currentActiveApp={currentActiveApp}
        isScreenSharing={isScreenSharing}
        screenStream={screenStream}
        screenSharePeer={screenSharePeer}
        isVideoOff={isVideoOff}
        localStream={localStream}
        currentUserName={currentUserName}
        currentUser={currentUser}
        isSpeakingLocal={isSpeakingLocal}
        isMuted={isMuted}
        participants={participants}
        onTogglePiP={onTogglePiP}
        onEndCall={onEndCall}
        handleToggleMute={handleToggleMute}
        handleToggleVideo={handleToggleVideo}
      />
    );
  }

  // Render Full Discord Stage View
  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col bg-background text-foreground select-none relative overflow-hidden group/stage">
      {/* Discord Top Stage App Bar */}
      {!isTheaterMode && activeAppId !== null && currentActiveApp ? (
        <ActivityAppBar
          app={currentActiveApp}
          onClose={() => {
            handleStopActivity();
            if (channel.type !== 'voice') {
              onEndCall();
            }
          }}
          onToggleTheaterMode={() => setIsTheaterMode(true)}
          onCopyLink={handleExecuteCopyCallLink}
          isChatOpen={isChatOpen}
          onToggleChat={onToggleChat}
          onOpenMobileChannels={onOpenMobileChannels}
          horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
        />
      ) : !isTheaterMode && channel.type === 'voice' ? (
        <div className={cn('h-12 w-full flex items-center justify-between bg-background select-none shrink-0 z-20', CHANNEL_HORIZONTAL_PADDING)}>
          <div className="flex items-center gap-2 min-w-0">
            {onOpenMobileChannels && (
              <button
                type="button"
                onClick={onOpenMobileChannels}
                className="md:hidden h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mr-0.5 cursor-pointer shrink-0"
                title="Buka Menu Sidebar"
                aria-label="Buka Menu Sidebar"
              >
                <Menu className="w-5 h-5 text-foreground" />
              </button>
            )}
            <Volume2 className="w-5 h-5 text-muted-foreground shrink-0" />
            <span className="text-sm font-bold text-foreground truncate max-w-[140px] sm:max-w-[200px]">
              {channel.name}
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center -space-x-1.5 overflow-hidden">
              {participants
                .filter(
                  (p) =>
                    p.userId !== currentUser?.id &&
                    p.socketId !== socket?.id &&
                    (!p.userName || p.userName.toLowerCase() !== currentUserName.toLowerCase())
                )
                .slice(0, 3)
                .map((p) => (
                  <CommunityAvatar
                    key={p.socketId}
                    name={p.userName}
                    imageUrl={p.userAvatar}
                    size={24}
                    showStatus={false}
                    tooltipText={p.userName}
                    className="ring-2 ring-background shrink-0"
                  />
                ))}
              <CommunityAvatar
                name={currentUserName}
                imageUrl={currentUser?.imageUrl}
                size={24}
                showStatus={false}
                tooltipText={`${currentUserName} (Anda)`}
                className="ring-2 ring-background shrink-0"
              />
            </div>

            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      if (onToggleChat) {
                        onToggleChat();
                      } else if (onToggleActivity) {
                        onToggleActivity();
                      } else {
                        toast.info('Obrolan teks suara');
                      }
                    }}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors cursor-pointer',
                      isChatOpen
                        ? 'bg-white/20 text-white'
                        : 'text-[#949ba4] hover:text-white hover:bg-white/10',
                    )}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs font-semibold">
                  {isChatOpen ? 'Sembunyikan Obrolan' : 'Buka Obrolan Suara'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      ) : null}

      {/* Main Call Stage Content */}
      {activeAppId !== null && currentActiveApp ? (
        <div
          className={cn(
            'flex-1 min-h-0 flex flex-col overflow-hidden bg-background relative w-full h-full rounded-none border-0',
            isTheaterMode && 'fixed inset-0 z-50 w-screen h-screen'
          )}
        >
          {isTheaterMode && (
            <MagneticFloatingCollapseButton
              onCollapse={() => setIsTheaterMode(false)}
              tooltipText="Keluar Mode Sinematik (ESC)"
            />
          )}

          <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden relative rounded-none border-0">
            <ActivityStage
              activeAppId={activeAppId}
              currentActiveApp={currentActiveApp}
              channel={channel}
              activeColony={activeColony}
              currentUserName={currentUserName}
              currentUser={currentUser}
              participants={participants}
              totalInCall={totalInCall}
              socket={socket}
              onStopActivity={handleStopActivity}
              isScreenSharing={isScreenSharing}
              screenStream={activeScreenStream || screenStream}
              onToggleScreenShare={handleToggleScreenShare}
            />
          </div>

          {!isTheaterMode && channel.type === 'voice' && (
            <ActivityFilmstrip
              isFilmstripCollapsed={isFilmstripCollapsed}
              onToggleFilmstrip={() => setIsFilmstripCollapsed(!isFilmstripCollapsed)}
              totalInCall={totalInCall}
              isVideoOff={isVideoOff}
              localStream={localStream}
              currentUserName={currentUserName}
              currentUser={currentUser}
              isSpeakingLocal={isSpeakingLocal}
              isMuted={isMuted}
              participants={participants}
              isScreenSharing={isScreenSharing}
              screenStream={screenStream}
              onCopyCallLink={handleCopyCallLink}
            />
          )}
        </div>
      ) : (
        <CallParticipantGrid
          isAnyoneScreenSharing={isAnyoneScreenSharing}
          activeScreenStream={activeScreenStream}
          isScreenSharing={isScreenSharing}
          screenSharePeer={screenSharePeer}
          handleToggleScreenShare={handleToggleScreenShare}
          isVideoOff={isVideoOff}
          localStream={localStream}
          currentUserName={currentUserName}
          currentUser={currentUser}
          isSpeakingLocal={isSpeakingLocal}
          isMuted={isMuted}
          participants={participants}
          setIsInviteVoiceOpen={setIsInviteVoiceOpen}
          setIsAppLauncherOpen={setIsAppLauncherOpen}
        />
      )}

      {/* Discord Bottom Control Dock */}
      <CallControlsBar
        isTextChannel={channel.type !== 'voice'}
        participants={participants}
        currentUser={currentUser}
        currentUserName={currentUserName}
        isSpeakingLocal={isSpeakingLocal}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={isScreenSharing}
        activeAppId={activeAppId}
        currentActiveApp={currentActiveApp}
        isChatOpen={isChatOpen}
        onToggleMute={handleToggleMute}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onOpenInvite={() => setIsInviteVoiceOpen(true)}
        onOpenAppLauncher={() => setIsAppLauncherOpen(true)}
        onCopyCallLink={handleCopyCallLink}
        onEndCall={onEndCall}
        onTogglePiP={onTogglePiP}
        onToggleFullscreen={handleToggleFullscreen}
        onToggleChat={() => {
          if (onToggleChat) {
            onToggleChat();
          } else if (onToggleActivity) {
            onToggleActivity();
          } else {
            onTogglePiP();
          }
        }}
      />

      {/* Activities Launcher Modal */}
      <ActivityLauncherDialog
        open={isAppLauncherOpen}
        onOpenChange={setIsAppLauncherOpen}
        activeAppId={activeAppId}
        currentActiveApp={currentActiveApp}
        onLaunchApp={handleLaunchApp}
        onStopActivity={handleStopActivity}
        isUpgradeModalOpen={isUpgradeModalOpen}
        setIsUpgradeModalOpen={setIsUpgradeModalOpen}
        onNavigateToBilling={onNavigateToBilling}
        activeColony={activeColony}
      />

      {/* Voice/Video Call Invite Modal */}
      <VoiceInviteDialog
        open={isInviteVoiceOpen}
        onOpenChange={setIsInviteVoiceOpen}
        channel={channel}
        activeColony={activeColony}
        callInviteUrl={callInviteUrl}
        copiedVoiceCallLink={copiedVoiceCallLink}
        onCopyCallLink={handleExecuteCopyCallLink}
        currentActiveApp={currentActiveApp}
      />
    </div>
  );
}

export const CommunityCallStage = CallStage;
