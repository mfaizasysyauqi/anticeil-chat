import React from 'react';
import {
  ChevronUp,
  ChevronDown,
  Users,
  Mic,
  MicOff,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import type { CallParticipant } from '../types';
import { LocalVideoView, RemoteVideoView, ScreenVideoView } from './video-views';

export interface ActivityFilmstripProps {
  isFilmstripCollapsed: boolean;
  onToggleFilmstrip: () => void;
  totalInCall: number;
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
  isScreenSharing: boolean;
  screenStream: MediaStream | null;
  onCopyCallLink: () => void;
}

export function ActivityFilmstrip({
  isFilmstripCollapsed,
  onToggleFilmstrip,
  totalInCall,
  isVideoOff,
  localStream,
  currentUserName,
  currentUser,
  isSpeakingLocal,
  isMuted,
  participants,
  isScreenSharing,
  screenStream,
  onCopyCallLink,
}: ActivityFilmstripProps) {
  return (
    <div className={cn('shrink-0 flex flex-col items-center z-10 pb-1 w-full', CHANNEL_HORIZONTAL_PADDING)}>
      {/* Collapse / Expand Toggle Pill (Discord Style) */}
      <button
        onClick={onToggleFilmstrip}
        className="h-5 px-3 -mb-1 rounded-full bg-card hover:bg-muted text-foreground/80 hover:text-foreground text-[10px] font-semibold flex items-center gap-1.5 transition-all border border-border shadow-md cursor-pointer z-20"
        title={isFilmstripCollapsed ? 'Tampilkan Kamera Peserta' : 'Sembunyikan Kamera Peserta'}
      >
        {isFilmstripCollapsed ? (
          <>
            <ChevronUp className="w-3 h-3 text-emerald-400" />
            <Users className="w-2.5 h-2.5" />
            <span>Kamera & Peserta ({totalInCall})</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
            <Users className="w-2.5 h-2.5" />
            <span>Sembunyikan ({totalInCall})</span>
          </>
        )}
      </button>

      {/* Video Cards Filmstrip (Horizontally centered or scrollable like Discord) */}
      {!isFilmstripCollapsed && (
        <div className="w-full max-w-full py-1 flex items-center justify-start sm:justify-center gap-2 overflow-x-auto [scrollbar-width:thin] px-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Local Participant Tile */}
          <div className="w-24 sm:w-32 md:w-36 h-16 sm:h-20 md:h-24 rounded-xl bg-card border border-border relative overflow-hidden shrink-0 flex items-center justify-center shadow-lg group">
            {!isVideoOff && localStream && localStream.getVideoTracks().some((t) => t.readyState === 'live' && t.enabled) ? (
              <LocalVideoView stream={localStream} />
            ) : (
              <div className="flex flex-col items-center justify-center gap-1">
                <CommunityAvatar
                  name={currentUserName}
                  imageUrl={currentUser?.imageUrl}
                  email={currentUser?.email}
                  size={36}
                  showStatus={false}
                  className={cn(
                    'shrink-0 rounded-full transition-all aspect-square',
                    isSpeakingLocal
                      ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-card'
                      : 'ring-1 ring-border',
                  )}
                />
                <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium truncate max-w-[75px] sm:max-w-[90px]">
                  {currentUserName}
                </span>
              </div>
            )}
            {/* Bottom tag */}
            <div className="absolute bottom-1 left-1 sm:bottom-1.5 sm:left-1.5 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs flex items-center gap-1 text-[8px] sm:text-[9px] font-semibold text-white border border-white/5">
              <span>Anda</span>
              {isMuted ? <MicOff className="w-2.5 h-2.5 text-red-400" /> : <Mic className="w-2.5 h-2.5 text-emerald-400" />}
            </div>
          </div>

          {/* Remote Participants Tiles */}
          {participants.map((peer) => (
            <div
              key={peer.socketId}
              className="w-24 sm:w-32 md:w-36 h-16 sm:h-20 md:h-24 rounded-xl bg-card border border-border relative overflow-hidden shrink-0 flex items-center justify-center shadow-lg group"
            >
              {peer.stream && peer.hasVideo && peer.stream.getVideoTracks().some((t) => t.readyState === 'live') ? (
                <RemoteVideoView stream={peer.stream} isMuted={false} />
              ) : (
                <div className="flex flex-col items-center justify-center gap-1">
                  <CommunityAvatar
                    name={peer.userName}
                    imageUrl={peer.userAvatar}
                    size={36}
                    showStatus={false}
                    className={cn(
                      'shrink-0 rounded-full transition-all aspect-square',
                      peer.isSpeaking
                        ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-card'
                        : 'ring-1 ring-border',
                    )}
                  />
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium truncate max-w-[75px] sm:max-w-[90px]">
                    {peer.userName}
                  </span>
                </div>
              )}
              {/* Bottom tag */}
              <div className="absolute bottom-1 left-1 sm:bottom-1.5 sm:left-1.5 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs flex items-center gap-1 text-[8px] sm:text-[9px] font-semibold text-white border border-white/5">
                <span className="truncate max-w-[65px] sm:max-w-[75px]">{peer.userName}</span>
                {!peer.hasAudio ? <MicOff className="w-2.5 h-2.5 text-red-400" /> : <Mic className="w-2.5 h-2.5 text-emerald-400" />}
              </div>
            </div>
          ))}

          {/* Screen Share Tile if sharing */}
          {isScreenSharing && (
            <div className="w-24 sm:w-32 md:w-36 h-16 sm:h-20 md:h-24 rounded-xl bg-card border border-emerald-500/40 relative overflow-hidden shrink-0 flex items-center justify-center shadow-lg group">
              <ScreenVideoView
                stream={screenStream}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.2 rounded bg-red-600 text-[8px] font-extrabold text-white flex items-center gap-1 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </div>
            </div>
          )}

          {/* Solo empty hint */}
          {participants.length === 0 && !isScreenSharing && (
            <div className="h-16 sm:h-20 md:h-24 px-3 sm:px-4 rounded-xl bg-card border border-dashed border-border flex items-center gap-2.5 sm:gap-3 shrink-0">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">Anda sendirian di panggung</span>
                <span className="text-[10px] text-muted-foreground">Undang rekan tim untuk menikmati aktivitas bersama</span>
              </div>
              <Button
                size="sm"
                onClick={onCopyCallLink}
                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-xs gap-1.5 transition-colors cursor-pointer border-0 shrink-0"
              >
                <Copy className="w-3 h-3 text-white" /> Salin Link
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
