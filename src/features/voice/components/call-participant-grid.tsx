import React from 'react';
import {
  Monitor,
  MonitorOff,
  Mic,
  MicOff,
  UserPlus,
  Shapes,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import { LocalVideoView, RemoteVideoView, ScreenVideoView } from './video-views';

import type { CallParticipant } from '../types';
export type { CallParticipant };

export interface CallParticipantGridProps {
  isAnyoneScreenSharing: boolean;
  activeScreenStream: MediaStream | null;
  isScreenSharing: boolean;
  screenSharePeer?: CallParticipant;
  handleToggleScreenShare: () => void;
  isVideoOff: boolean;
  localStream: MediaStream | null;
  currentUserName: string;
  currentUser?: {
    imageUrl?: string | null;
    email?: string;
  } | null;
  isSpeakingLocal: boolean;
  isMuted: boolean;
  participants: CallParticipant[];
  setIsInviteVoiceOpen: (open: boolean) => void;
  setIsAppLauncherOpen: (open: boolean) => void;
}

export function CallParticipantGrid({
  isAnyoneScreenSharing,
  activeScreenStream,
  isScreenSharing,
  screenSharePeer,
  handleToggleScreenShare,
  isVideoOff,
  localStream,
  currentUserName,
  currentUser,
  isSpeakingLocal,
  isMuted,
  participants,
  setIsInviteVoiceOpen,
  setIsAppLauncherOpen,
}: CallParticipantGridProps) {
  if (isAnyoneScreenSharing) {
    return (
      <div className={cn('flex-1 min-h-0 flex flex-col overflow-hidden w-full h-full bg-background py-3 gap-3', CHANNEL_HORIZONTAL_PADDING)}>
        {/* Main Hero Screen View */}
        <div className="flex-1 min-h-0 relative rounded-2xl overflow-hidden bg-black/95 border border-border shadow-2xl flex items-center justify-center">
          {activeScreenStream ? (
            <ScreenVideoView stream={activeScreenStream} className="w-full h-full" />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Monitor className="w-12 h-12 text-primary/60 animate-pulse" />
              <span className="text-sm font-medium">Menghubungkan streaming layar...</span>
            </div>
          )}

          {/* Top Badge Overlay */}
          <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-black/75 backdrop-blur-md flex items-center gap-2 border border-white/10 z-10 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <Monitor className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white tracking-wide">
              {isScreenSharing
                ? 'Layar Anda (Live)'
                : `Layar ${screenSharePeer?.userName || 'Rekan'} (Live)`}
            </span>
          </div>

          {/* Top Right Stop Button if Local Sharing */}
          {isScreenSharing && (
            <button
              type="button"
              onClick={handleToggleScreenShare}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md shadow-lg transition-all cursor-pointer z-10"
            >
              <MonitorOff className="w-4 h-4" />
              <span>Hentikan Berbagi</span>
            </button>
          )}
        </div>

        {/* Bottom Participant Filmstrip */}
        <div className="h-24 sm:h-28 shrink-0 flex items-center gap-2.5 overflow-x-auto px-1 py-1 no-scrollbar">
          {/* Local Participant Tile */}
          <div className="w-32 sm:w-40 h-full rounded-xl bg-card border border-border relative overflow-hidden shrink-0 flex items-center justify-center shadow-lg group">
            {!isVideoOff && localStream && localStream.getVideoTracks().some((t) => t.readyState === 'live' && t.enabled) ? (
              <LocalVideoView stream={localStream} />
            ) : (
              <div className="flex flex-col items-center justify-center gap-1">
                <div
                  className={cn(
                    'w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all',
                    isSpeakingLocal
                      ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-card'
                      : 'ring-1 ring-border',
                  )}
                >
                  <CommunityAvatar
                    name={currentUserName}
                    imageUrl={currentUser?.imageUrl}
                    email={currentUser?.email}
                    size={44}
                    showStatus={false}
                    className="w-full h-full rounded-full"
                  />
                </div>
              </div>
            )}
            <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs flex items-center gap-1 text-[10px] font-semibold text-white border border-white/10">
              <span className="truncate max-w-[90px]">{currentUserName}</span>
              {isMuted ? <MicOff className="w-2.5 h-2.5 text-red-400" /> : <Mic className="w-2.5 h-2.5 text-emerald-400" />}
            </div>
          </div>

          {/* Remote Participants Tiles */}
          {participants.map((peer) => (
            <div
              key={peer.socketId}
              className="w-32 sm:w-40 h-full rounded-xl bg-card border border-border relative overflow-hidden shrink-0 flex items-center justify-center shadow-lg group"
            >
              {peer.stream && peer.hasVideo && peer.stream.getVideoTracks().some((t) => t.readyState === 'live') ? (
                <RemoteVideoView stream={peer.stream} isMuted={false} />
              ) : (
                <div className="flex flex-col items-center justify-center gap-1">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center ring-1 ring-white/10">
                    <CommunityAvatar
                      name={peer.userName}
                      imageUrl={peer.userAvatar}
                      size={44}
                      showStatus={false}
                      className="w-full h-full rounded-full"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[90px]">
                    {peer.userName}
                  </span>
                </div>
              )}
              <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs flex items-center gap-1 text-[10px] font-semibold text-white border border-white/10">
                <span className="truncate max-w-[90px]">{peer.userName}</span>
                {!peer.hasAudio ? <MicOff className="w-2.5 h-2.5 text-red-400" /> : <Mic className="w-2.5 h-2.5 text-emerald-400" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Normal Participant Grid View (Case B2)
  return (
    <div className={cn('flex-1 min-h-0 flex items-center justify-center overflow-y-auto w-full h-full py-4', CHANNEL_HORIZONTAL_PADDING)}>
      <div
        className={cn(
          'w-full max-h-full grid items-center justify-center gap-4 transition-all duration-300',
          participants.length <= 1 && 'grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto',
          (participants.length === 2 || participants.length === 3) && 'grid-cols-2 max-w-5xl mx-auto',
          participants.length >= 4 && 'grid-cols-2 md:grid-cols-3 max-w-6xl mx-auto',
        )}
      >
        {/* LOCAL PARTICIPANT TILE (Fixed 16:9 Landscape Rectangle like Discord) */}
        <div
          className="relative aspect-video w-full max-h-[calc(100vh-180px)] rounded-2xl overflow-hidden flex items-center justify-center transition-all bg-card border border-border/60 shadow-xl group"
        >
          {!isVideoOff && localStream && localStream.getVideoTracks().some((t) => t.readyState === 'live' && t.enabled) ? (
            <LocalVideoView stream={localStream} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-6">
              <div className="relative">
                <div
                  className={cn(
                    'w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 overflow-hidden',
                    isSpeakingLocal
                      ? 'ring-4 ring-emerald-500 ring-offset-4 ring-offset-background scale-105'
                      : 'ring-2 ring-border',
                  )}
                >
                  <CommunityAvatar
                    name={currentUserName}
                    imageUrl={currentUser?.imageUrl}
                    email={currentUser?.email}
                    size={96}
                    showStatus={false}
                    className="w-full h-full rounded-full"
                  />
                </div>
                {isSpeakingLocal && (
                  <div className="absolute inset-0 rounded-full bg-emerald-500/25 blur-xl animate-pulse -z-0" />
                )}
              </div>
            </div>
          )}

          {/* Status Pill Bottom-Left */}
          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-card/85 backdrop-blur-xs flex items-center gap-2 text-xs font-semibold text-foreground border border-border/60 z-10 shadow-xs">
            <span className="truncate max-w-[140px]">{currentUserName}</span>
            {isMuted && <MicOff className="w-3.5 h-3.5 text-red-400" />}
          </div>

          {isScreenSharing && (
            <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded bg-primary text-[10px] font-bold text-primary-foreground flex items-center gap-1 z-10 shadow-xs">
              <Monitor className="w-3 h-3" /> Berbagi Layar
            </div>
          )}
        </div>

        {/* SOLO PROMPT CARD (Fixed 16:9 Landscape Rectangle with Turtle, Trophy, Gem + Invite / Activity) */}
        {participants.length === 0 && (
          <div className="relative aspect-video w-full max-h-[calc(100vh-180px)] rounded-2xl bg-card border border-border/60 overflow-hidden flex flex-col items-center justify-center p-6 text-center shadow-xl">
            {/* Discord Activity Illustration: Purple Turtle, Star Trophy, Green Polyhedron */}
            <div className="relative mb-5 flex items-center justify-center">
              <div className="w-28 h-28 rounded-full bg-primary/10 blur-2xl absolute -inset-2" />
              <div className="relative flex items-center justify-center gap-3">
                <span className="text-4xl sm:text-5xl filter drop-shadow-2xl hover:scale-110 transition-transform cursor-default select-none">
                  🐢
                </span>
                <span className="text-4xl sm:text-5xl filter drop-shadow-2xl -mt-4 hover:scale-110 transition-transform cursor-default select-none">
                  🏆
                </span>
                <span className="text-4xl sm:text-5xl filter drop-shadow-2xl hover:scale-110 transition-transform cursor-default select-none">
                  💎
                </span>
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight mb-1.5">
              Anda satu-satunya di sini
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mb-5 leading-relaxed">
              Undang teman atau mulai aktivitas game & streaming bersama untuk meramaikan panggilan ini!
            </p>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsInviteVoiceOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 rounded-xl text-xs sm:text-sm gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Undang Teman</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAppLauncherOpen(true)}
                className="border-border hover:bg-muted text-foreground font-semibold px-4 py-2 rounded-xl text-xs sm:text-sm gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Shapes className="w-4 h-4 text-emerald-400" />
                <span>Mulai Aktivitas</span>
              </Button>
            </div>
          </div>
        )}

        {/* REMOTE PARTICIPANTS TILES */}
        {participants.map((peer) => (
          <div
            key={peer.socketId}
            className="relative aspect-video w-full max-h-[calc(100vh-180px)] rounded-2xl bg-card border border-border/60 overflow-hidden flex items-center justify-center transition-all shadow-xl group"
          >
            {peer.stream && peer.hasVideo && peer.stream.getVideoTracks().some((t) => t.readyState === 'live') ? (
              <RemoteVideoView stream={peer.stream} isMuted={false} />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-6">
                <div className="relative">
                  <div
                    className={cn(
                      'w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 overflow-hidden',
                      peer.isSpeaking
                        ? 'ring-4 ring-emerald-500 ring-offset-4 ring-offset-background scale-105'
                        : 'ring-2 ring-border',
                    )}
                  >
                    <CommunityAvatar
                      name={peer.userName}
                      imageUrl={peer.userAvatar}
                      size={96}
                      showStatus={false}
                      className="w-full h-full rounded-full"
                    />
                  </div>
                  {peer.isSpeaking && (
                    <div className="absolute inset-0 rounded-full bg-emerald-500/25 blur-xl animate-pulse -z-0" />
                  )}
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-sm sm:text-base font-bold text-foreground tracking-wide">{peer.userName}</span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    {!peer.hasAudio ? <MicOff className="w-3 h-3 text-red-400" /> : <Mic className="w-3 h-3 text-emerald-400" />}
                    {!peer.hasAudio ? 'Muted' : 'Tersambung'}
                  </span>
                </div>
              </div>
            )}

            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-card/85 backdrop-blur-xs flex items-center gap-2 text-xs font-semibold text-foreground border border-border/60 z-10 shadow-xs">
              <span className="truncate max-w-[140px]">{peer.userName}</span>
              {!peer.hasAudio ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
            </div>

            {peer.isScreenSharing && (
              <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded bg-primary text-[10px] font-bold text-primary-foreground flex items-center gap-1 z-10">
                <Monitor className="w-3 h-3" /> Berbagi Layar
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
