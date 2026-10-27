import React from 'react';
import {
  ArrowLeft,
  Maximize2,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommunityAvatar } from '@/chat/messages-avatar';
import { CommunityChannel } from '@/chat/messages-types';
import { cn } from '@/lib/utils';
import { DiscordAppDefinition } from '../data/discord-activities';
import { CallParticipant } from './call-participant-grid';
import { LocalVideoView, RemoteVideoView, ScreenVideoView } from './video-views';

export interface PiPCallStageProps {
  channel: CommunityChannel;
  totalInCall: number;
  activeAppId: string | null;
  currentActiveApp?: DiscordAppDefinition | null;
  isScreenSharing: boolean;
  screenStream: MediaStream | null;
  screenSharePeer?: CallParticipant;
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
  onTogglePiP: () => void;
  onEndCall: () => void;
  handleToggleMute: () => void;
  handleToggleVideo: () => void;
}

export function PiPCallStage({
  channel,
  totalInCall,
  activeAppId,
  currentActiveApp,
  isScreenSharing,
  screenStream,
  screenSharePeer,
  isVideoOff,
  localStream,
  currentUserName,
  currentUser,
  isSpeakingLocal,
  isMuted,
  participants,
  onTogglePiP,
  onEndCall,
  handleToggleMute,
  handleToggleVideo,
}: PiPCallStageProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 w-[320px] sm:w-[340px] rounded-2xl bg-card border border-border text-foreground shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
      {/* Header (Discord PiP Style) */}
      <div className="h-9 px-3 bg-muted/50 flex items-center justify-between border-b border-border select-none">
        <button
          type="button"
          onClick={onTogglePiP}
          className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer group text-left min-w-0"
          title="Kembali ke Panggilan Penuh"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground group-hover:-translate-x-0.5 transition-transform shrink-0" />
          <span className="text-xs font-semibold text-foreground truncate max-w-[150px]">
            {channel.name}
          </span>
          <span className="text-[10px] text-muted-foreground">({totalInCall})</span>
        </button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onTogglePiP}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            title="Perbesar Layar Penuh"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onEndCall}
            className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-500/20"
            title="Putus Panggilan"
          >
            <PhoneOff className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Video & Activity Cards Stack (16:9 Landscape Rectangles like Discord) */}
      <div className="p-2 flex flex-col gap-2 max-h-[460px] overflow-y-auto [scrollbar-width:none]">
        {/* Active Activity Card (e.g. Watch Together like in Discord reference) */}
        {activeAppId !== null && currentActiveApp && (
          <div className="relative aspect-video w-full rounded-xl bg-card border border-border overflow-hidden flex flex-col items-center justify-center p-3 text-center shadow-lg group">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl filter drop-shadow">📺</span>
              <span className="text-xs font-bold text-foreground tracking-wide">{currentActiveApp.title}</span>
            </div>
            <p className="text-[10px] text-muted-foreground px-2 line-clamp-1">
              Aktivitas bersama sedang berjalan
            </p>
            <button
              type="button"
              onClick={onTogglePiP}
              className="mt-2 px-3 py-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-bold transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
            >
              Buka Aktivitas
            </button>
          </div>
        )}

        {/* Remote Screen Share View */}
        {screenSharePeer && screenSharePeer.stream && (
          <div className="relative aspect-video w-full rounded-xl bg-black border border-border overflow-hidden shadow-lg group">
            <ScreenVideoView stream={screenSharePeer.stream} className="w-full h-full object-contain" />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-xs flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 border border-white/10 z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>{screenSharePeer.userName} (Live)</span>
            </div>
          </div>
        )}

        {/* Local Screen Share View */}
        {isScreenSharing && screenStream && (
          <div className="relative aspect-video w-full rounded-xl bg-black border border-border overflow-hidden shadow-lg group">
            <ScreenVideoView stream={screenStream} className="w-full h-full object-contain" />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-xs flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 border border-white/10 z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>Layar Anda (Live)</span>
            </div>
          </div>
        )}

        {/* Remote Participants Mini Cards */}
        {participants.map((peer) => (
          <div
            key={peer.socketId}
            className="relative aspect-video w-full rounded-xl bg-card border border-border overflow-hidden flex items-center justify-center shadow-lg group"
          >
            {peer.stream && peer.hasVideo && peer.stream.getVideoTracks().some((t) => t.readyState === 'live') ? (
              <RemoteVideoView stream={peer.stream} isMuted={false} />
            ) : (
              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className="relative">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center transition-all',
                      peer.isSpeaking
                        ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-background'
                        : 'ring-1 ring-border',
                    )}
                  >
                    <CommunityAvatar
                      name={peer.userName}
                      imageUrl={peer.userAvatar}
                      size={48}
                      showStatus={false}
                      className="w-full h-full rounded-full"
                    />
                  </div>
                  {peer.isSpeaking && (
                    <div className="absolute inset-0 rounded-full bg-emerald-500/25 blur-lg animate-pulse -z-0" />
                  )}
                </div>
              </div>
            )}
            {/* Status Pill Bottom-Left */}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-card/85 backdrop-blur-xs flex items-center gap-1.5 text-[10px] font-semibold text-foreground border border-border z-10">
              <span className="truncate max-w-[120px]">{peer.userName}</span>
              {!peer.hasAudio ? (
                <MicOff className="w-2.5 h-2.5 text-red-400" />
              ) : (
                <Mic className="w-2.5 h-2.5 text-emerald-400" />
              )}
            </div>
            {peer.isScreenSharing && (
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-primary text-[9px] font-bold text-primary-foreground flex items-center gap-1 z-10 shadow-xs">
                <Monitor className="w-2.5 h-2.5" /> Share
              </div>
            )}
          </div>
        ))}

        {/* Local Mini Video Card */}
        <div className="relative aspect-video w-full rounded-xl bg-card border border-border overflow-hidden flex items-center justify-center shadow-lg group">
          {!isVideoOff && localStream && localStream.getVideoTracks().some((t) => t.readyState === 'live' && t.enabled) ? (
            <LocalVideoView stream={localStream} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5">
              <div
                className={cn(
                  'w-14 h-14 rounded-full flex items-center justify-center transition-all relative',
                  isSpeakingLocal
                    ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-background'
                    : 'ring-1 ring-border',
                )}
              >
                <CommunityAvatar
                  name={currentUserName}
                  imageUrl={currentUser?.imageUrl}
                  email={currentUser?.email}
                  size={56}
                  showStatus={false}
                  className="w-full h-full rounded-full"
                />
              </div>
              {isSpeakingLocal && (
                <div className="absolute inset-0 rounded-full bg-emerald-500/25 blur-lg animate-pulse -z-0" />
              )}
            </div>
          )}
          {/* Status Pill Bottom-Left */}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-card/85 backdrop-blur-xs flex items-center gap-1.5 text-[10px] font-semibold text-foreground border border-border z-10">
            <span className="truncate max-w-[120px]">{currentUserName} (Anda)</span>
            {isMuted ? (
              <MicOff className="w-2.5 h-2.5 text-red-400" />
            ) : (
              <Mic className="w-2.5 h-2.5 text-emerald-400" />
            )}
          </div>
        </div>
      </div>

      {/* Mini Quick Actions (Discord PiP Floating Controls) */}
      <div className="h-11 px-3 bg-muted/50 flex items-center justify-center gap-3 border-t border-border select-none">
        <Button
          size="icon"
          variant="ghost"
          onClick={handleToggleMute}
          className={cn(
            'h-7 w-7 rounded-full',
            isMuted ? 'bg-red-500/20 text-red-400' : 'text-white hover:bg-white/10',
          )}
          title={isMuted ? 'Nyalakan Mikrofon' : 'Bisukan Mikrofon'}
        >
          {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleToggleVideo}
          className={cn(
            'h-7 w-7 rounded-full',
            isVideoOff ? 'bg-red-500/20 text-red-400' : 'text-white hover:bg-white/10',
          )}
          title={isVideoOff ? 'Nyalakan Kamera' : 'Matikan Kamera'}
        >
          {isVideoOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onTogglePiP}
          className="h-7 w-7 rounded-full text-white hover:bg-white/10"
          title="Layar Penuh"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="icon"
          variant="destructive"
          onClick={onEndCall}
          className="h-7 w-7 rounded-full bg-red-600 hover:bg-red-700 text-white"
          title="Putus Panggilan"
        >
          <PhoneOff className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
