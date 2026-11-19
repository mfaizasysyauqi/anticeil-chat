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
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { ColonyChannel } from '@/chat/chat-types';
import { cn } from '@/lib/utils';
import { DiscordAppDefinition } from '../data/voice-activities';
import type { CallParticipant } from '../types';
import { LocalVideoView, RemoteVideoView, ScreenVideoView } from './video-views';

export interface PiPCallStageProps {
  channel: ColonyChannel;
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

function ActivityMonitorGraphic() {
  return (
    <svg
      viewBox="0 0 240 140"
      className="w-48 h-28 drop-shadow-md select-none pointer-events-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background Cloud */}
      <path
        d="M50 85 C30 85 20 70 30 55 C35 40 55 35 70 45 C80 25 110 20 130 35 C145 25 170 30 180 50 C200 55 205 75 190 90 C180 100 150 100 50 100 Z"
        fill="#3b489a"
        opacity="0.9"
      />

      {/* Little Stars / Sparkles */}
      <path d="M40 32 L42 37 L47 39 L42 41 L40 46 L38 41 L33 39 L38 37 Z" fill="#7289da" opacity="0.8" />
      <path d="M190 40 L191.5 43.5 L195 45 L191.5 46.5 L190 50 L188.5 46.5 L185 45 L188.5 43.5 Z" fill="#7289da" opacity="0.8" />
      <path d="M72 15 L73 17.5 L75.5 18.5 L73 19.5 L72 22 L71 19.5 L68.5 18.5 L71 17.5 Z" fill="#7289da" opacity="0.8" />

      {/* Monitor Tower / Stand Behind */}
      <rect x="156" y="42" width="22" height="60" rx="3" fill="#4b5563" />
      <rect x="160" y="48" width="14" height="2" fill="#9ca3af" />
      <rect x="160" y="53" width="14" height="2" fill="#9ca3af" />
      <rect x="160" y="58" width="14" height="2" fill="#9ca3af" />

      {/* Monitor Outer Casing */}
      <rect x="68" y="38" width="86" height="64" rx="4" fill="#e5e7eb" stroke="#374151" strokeWidth="2" />
      {/* Monitor Screen Inset */}
      <rect x="74" y="44" width="74" height="48" rx="2" fill="#ffffff" />
      {/* YouTube Play Icon on Screen */}
      <rect x="97" y="58" width="28" height="20" rx="4" fill="#ef4444" />
      <polygon points="108,63 118,68 108,73" fill="#ffffff" />

      {/* Monitor Base Stand */}
      <rect x="99" y="102" width="24" height="6" fill="#d1d5db" />
      <rect x="91" y="108" width="40" height="4" rx="1" fill="#9ca3af" />

      {/* Cactus Plant on top of Monitor */}
      <rect x="105" y="26" width="12" height="12" rx="2" fill="#d97706" />
      <ellipse cx="111" cy="22" rx="4" ry="7" fill="#10b981" />
      <circle cx="107" cy="20" r="1.5" fill="#059669" />
      <circle cx="115" cy="22" r="1.5" fill="#059669" />
      <polygon points="111,13 113,16 109,16" fill="#f43f5e" />

      {/* Red Coffee Mug */}
      <rect x="170" y="78" width="16" height="22" rx="2" fill="#ef4444" />
      <path d="M186 83 C191 83 191 95 186 95" stroke="#ef4444" strokeWidth="2.5" fill="none" />

      {/* Keyboard */}
      <rect x="52" y="112" width="80" height="12" rx="2" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1" />
      <rect x="56" y="115" width="72" height="6" rx="1" fill="#d1d5db" />

      {/* Mouse */}
      <rect x="142" y="114" width="10" height="12" rx="4" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1" />
      <line x1="147" y1="114" x2="147" y2="119" stroke="#9ca3af" strokeWidth="1" />
    </svg>
  );
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
  // Discord-style Minimized Activity PiP Window (Image 2)
  if (activeAppId !== null && currentActiveApp) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-[300px] sm:w-[320px] rounded-2xl bg-[#111214] border border-white/10 text-foreground shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header: ← Watch Together */}
        <div className="h-10 px-3.5 pt-2 flex items-center justify-between select-none">
          <button
            type="button"
            onClick={onTogglePiP}
            className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer text-left min-w-0 group"
            title={`Kembali ke ${currentActiveApp.title}`}
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-white group-hover:-translate-x-0.5 transition-transform shrink-0" />
            <span className="text-sm font-bold text-white truncate">
              {currentActiveApp.title}
            </span>
          </button>
        </div>

        {/* Center: Activity Illustration & Return Prompt */}
        <div
          onClick={onTogglePiP}
          className="px-4 py-3 flex flex-col items-center justify-center cursor-pointer group select-none"
          title="Klik untuk membuka aktivitas"
        >
          <ActivityMonitorGraphic />
          <p className="mt-3 text-xs font-semibold text-[#949ba4] text-center group-hover:text-white transition-colors">
            {activeAppId === 'watch-together' || activeAppId === 'youtube'
              ? 'Return to Watch Together to add videos!'
              : `Return to ${currentActiveApp.title} to play!`}
          </p>
        </div>

        {/* Footer: Current User Avatar on left, Leave button on right */}
        <div className="h-12 px-3.5 pb-2 flex items-center justify-between select-none">
          <div className="flex items-center gap-2 min-w-0">
            <CommunityAvatar
              name={currentUserName}
              imageUrl={currentUser?.imageUrl}
              email={currentUser?.email}
              size={28}
              className="w-7 h-7 rounded-full shrink-0 ring-1 ring-border"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onEndCall}
            className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Tinggalkan Aktivitas"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }
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
      <div className="p-2 flex flex-col gap-2 max-h-[460px] overflow-y-auto scrollbar-none">
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
