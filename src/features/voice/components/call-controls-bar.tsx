import React from 'react';
import {
  UserPlus,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Shapes,
  Sparkles,
  MoreHorizontal,
  PhoneOff,
  ExternalLink,
  Maximize,
  ChevronDown,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import { toast } from 'sonner';
import { DiscordAppDefinition } from '../data/discord-activities';

export interface CallControlsBarProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  activeAppId: string | null;
  currentActiveApp?: DiscordAppDefinition | null;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onOpenInvite: () => void;
  onOpenAppLauncher: () => void;
  onCopyCallLink: () => void;
  onEndCall: () => void;
  onTogglePiP: () => void;
  onToggleFullscreen: () => void;
}

export function CallControlsBar({
  isMuted,
  isVideoOff,
  isScreenSharing,
  activeAppId,
  currentActiveApp,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onOpenInvite,
  onOpenAppLauncher,
  onCopyCallLink,
  onEndCall,
  onTogglePiP,
  onToggleFullscreen,
}: CallControlsBarProps) {
  return (
    <div
      className={cn(
        'h-16 shrink-0 w-full flex items-center justify-between bg-background border-t border-border/40 select-none z-20',
        CHANNEL_HORIZONTAL_PADDING,
      )}
    >
      {/* Left: Invite Friends / Add to Call */}
      <div className="flex items-center">
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onOpenInvite}
                className="h-10 w-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer flex items-center justify-center"
              >
                <UserPlus className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs font-semibold">
              Undang Teman ke Panggilan
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Center: Controls Pill Group with Strict Consistent h-11 Height */}
      <div className="flex items-center gap-3">
        {/* Pill 1: Audio & Video Controls (Exact h-11, matching other containers) */}
        <div className="h-11 bg-card rounded-xl flex items-center px-1 border border-border/60 shadow-md">
          {/* Mic Toggle Button */}
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleMute}
                  className={cn(
                    'h-9 flex items-center gap-2 px-3 rounded-lg transition-colors cursor-pointer text-sm font-medium',
                    isMuted ? 'hover:bg-red-500/10' : 'hover:bg-muted/60',
                  )}
                >
                  {isMuted ? (
                    <MicOff className="w-5 h-5 text-red-500" />
                  ) : (
                    <Mic className="w-5 h-5 text-foreground" />
                  )}
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs font-semibold">
                {isMuted ? 'Nyalakan Mikrofon' : 'Bisukan Mikrofon'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Video Toggle Button */}
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleVideo}
                  className={cn(
                    'h-9 flex items-center gap-2 px-3 rounded-lg transition-colors cursor-pointer text-sm font-medium',
                    isVideoOff ? 'hover:bg-red-500/10' : 'hover:bg-muted/60',
                  )}
                >
                  {isVideoOff ? (
                    <VideoOff className="w-5 h-5 text-red-500" />
                  ) : (
                    <Video className="w-5 h-5 text-foreground" />
                  )}
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs font-semibold">
                {isVideoOff ? 'Nyalakan Kamera' : 'Matikan Kamera'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Pill 2: Media, Activities & Extra Actions (Exact h-11, matching other containers) */}
        <div className="h-11 bg-card rounded-xl flex items-center px-1 gap-1 border border-border/60 shadow-md">
          {/* Screen Share Button */}
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleScreenShare}
                  className={cn(
                    'h-9 w-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer',
                    isScreenSharing
                      ? 'bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600/30'
                      : 'text-foreground hover:bg-muted/60',
                  )}
                >
                  {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs font-semibold">
                {isScreenSharing ? 'Hentikan Berbagi Layar' : 'Berbagi Layar (Screen Share)'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Activities (Rocket / Shapes) Button */}
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onOpenAppLauncher}
                  className={cn(
                    'h-9 w-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer relative',
                    activeAppId !== null
                      ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30'
                      : 'text-foreground hover:bg-muted/60',
                  )}
                >
                  <Shapes className="w-5 h-5" />
                  {activeAppId !== null && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-card" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs font-semibold">
                {activeAppId !== null
                  ? `Aktivitas Aktif (${currentActiveApp?.title}) - Menu`
                  : 'Mulai Aktivitas (Apps & Games)'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Soundboard / Sparkles Button */}
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => toast.info('Fitur Soundboard & Efek Suara Anticeil')}
                  className="h-9 w-10 flex items-center justify-center rounded-lg text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs font-semibold">
                Soundboard & Efek Suara
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* More Options (...) Button */}
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onCopyCallLink}
                  className="h-9 w-10 flex items-center justify-center rounded-lg text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs font-semibold">
                Salin Link Panggilan & Opsi Lainnya
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Pill 3: Red Squircle Disconnect Call Button (Exact h-11, matching other containers) */}
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onEndCall}
                className="h-11 px-5 rounded-xl bg-destructive hover:bg-destructive/90 text-white flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs font-bold text-destructive">
              Putus Panggilan
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Right: Popout (PiP) & Fullscreen Controls */}
      <div className="flex items-center gap-1.5">
        {/* Popout / Picture in Picture */}
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onTogglePiP}
                className="h-10 w-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer flex items-center justify-center"
              >
                <ExternalLink className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs font-semibold">
              Popout (Picture-in-Picture)
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Fullscreen */}
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onToggleFullscreen}
                className="h-10 w-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer flex items-center justify-center"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs font-semibold">
              Layar Penuh
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
