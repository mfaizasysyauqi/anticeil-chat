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
  Link as LinkIcon,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer flex items-center justify-center shrink-0"
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
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Pill 1: Audio & Video Controls */}
        <div className="h-11 bg-card rounded-xl flex items-center px-1 border border-border/60 shadow-md shrink-0">
          {/* Mic Toggle Button */}
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleMute}
                  className={cn(
                    'h-9 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 rounded-lg transition-colors cursor-pointer text-sm font-medium',
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
                    'h-9 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 rounded-lg transition-colors cursor-pointer text-sm font-medium',
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

        {/* Pill 2: Media, Activities & Extra Actions */}
        <div className="h-11 bg-card rounded-xl flex items-center px-1 gap-1 border border-border/60 shadow-md shrink-0">
          {/* Screen Share Button (Desktop only: hidden md:flex) */}
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleScreenShare}
                  className={cn(
                    'h-9 w-10 items-center justify-center rounded-lg transition-colors cursor-pointer hidden md:flex',
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

          {/* Activities Button (Desktop only: hidden md:flex) */}
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onOpenAppLauncher}
                  className={cn(
                    'h-9 w-10 items-center justify-center rounded-lg transition-colors cursor-pointer relative hidden md:flex',
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

          {/* Soundboard / Sparkles Button (Desktop only: hidden md:flex) */}
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => toast.info('Fitur Soundboard & Efek Suara Anticeil')}
                  className="h-9 w-10 items-center justify-center rounded-lg text-foreground hover:bg-muted/60 transition-colors cursor-pointer hidden md:flex"
                >
                  <Sparkles className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs font-semibold">
                Soundboard & Efek Suara
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* More Options (...) Button - Always visible, contains all extra controls on Mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-9 w-10 flex items-center justify-center rounded-lg text-foreground hover:bg-muted/60 transition-colors cursor-pointer relative"
                aria-label="Opsi Lainnya"
              >
                <MoreHorizontal className="w-5 h-5" />
                {/* On mobile: show indicator if screen sharing or activity is active */}
                {(isScreenSharing || activeAppId !== null) && (
                  <span className="md:hidden absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-card" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              side="top"
              sideOffset={12}
              className="w-56 p-1.5 rounded-xl bg-[#111214] border border-border/80 shadow-2xl text-foreground z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Mobile-Only Options: Screen Share, Activity, Soundboard */}
              <div className="md:hidden space-y-0.5">
                <DropdownMenuItem
                  onClick={onToggleScreenShare}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer hover:bg-white/5 transition-colors"
                >
                  {isScreenSharing ? (
                    <>
                      <MonitorOff className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-emerald-500 font-semibold">Hentikan Berbagi Layar</span>
                    </>
                  ) : (
                    <>
                      <Monitor className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>Berbagi Layar (Screen Share)</span>
                    </>
                  )}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={onOpenAppLauncher}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <Shapes
                    className={cn(
                      'w-4 h-4 shrink-0',
                      activeAppId !== null ? 'text-emerald-500' : 'text-muted-foreground',
                    )}
                  />
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <span>Aktivitas & Games</span>
                    {activeAppId !== null && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                        Aktif
                      </span>
                    )}
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => toast.info('Fitur Soundboard & Efek Suara Anticeil')}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>Soundboard & Efek Suara</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 bg-border/60" />
              </div>

              {/* General Options for All Screen Sizes */}
              <DropdownMenuItem
                onClick={onCopyCallLink}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer hover:bg-white/5 transition-colors"
              >
                <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>Salin Link Panggilan</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={onOpenInvite}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer hover:bg-white/5 transition-colors"
              >
                <UserPlus className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>Undang Teman</span>
              </DropdownMenuItem>

              {/* Small-screen Shortcuts for Popout and Fullscreen */}
              <div className="sm:hidden">
                <DropdownMenuSeparator className="my-1 bg-border/60" />
                <DropdownMenuItem
                  onClick={onTogglePiP}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>Popout (Picture-in-Picture)</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onToggleFullscreen}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <Maximize className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>Layar Penuh</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Pill 3: Red Squircle Disconnect Call Button */}
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onEndCall}
                className="h-11 px-4 sm:px-5 rounded-xl bg-destructive hover:bg-destructive/90 text-white flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
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

      {/* Right: Popout (PiP) & Fullscreen Controls (Hidden on small mobile screens to prevent overflow) */}
      <div className="hidden sm:flex items-center gap-1.5">
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
