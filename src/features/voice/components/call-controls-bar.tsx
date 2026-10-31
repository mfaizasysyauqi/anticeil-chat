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
  MessageSquare,
  LogOut,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import { toast } from 'sonner';
import { DiscordAppDefinition } from '../data/discord-activities';

export interface CallControlsBarProps {
  isTextChannel?: boolean;
  participants?: Array<{
    socketId: string;
    userName: string;
    userAvatar?: string | null;
    isSpeaking?: boolean;
  }>;
  currentUser?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    imageUrl?: string | null;
  } | null | undefined;
  currentUserName?: string;
  isSpeakingLocal?: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  activeAppId: string | null;
  currentActiveApp?: DiscordAppDefinition | null;
  isChatOpen?: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onOpenInvite: () => void;
  onOpenAppLauncher: () => void;
  onCopyCallLink?: () => void;
  onEndCall: () => void;
  onTogglePiP: () => void;
  onToggleFullscreen: () => void;
  onToggleChat?: () => void;
}

export function CallControlsBar({
  isTextChannel = false,
  participants,
  currentUser,
  currentUserName,
  isSpeakingLocal = false,
  isMuted,
  isVideoOff,
  isScreenSharing,
  activeAppId,
  currentActiveApp,
  isChatOpen = false,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onOpenInvite,
  onOpenAppLauncher,
  onCopyCallLink,
  onEndCall,
  onTogglePiP,
  onToggleFullscreen,
  onToggleChat,
}: CallControlsBarProps) {
  if (isTextChannel) {
    return (
      <div
        className={cn(
          'h-16 shrink-0 w-full grid grid-cols-[auto_1fr_auto] sm:grid-cols-[1fr_auto_1fr] items-center bg-background select-none z-20',
          CHANNEL_HORIZONTAL_PADDING,
        )}
      >
        {/* Left: Foto profile peserta (Discord style: no extra border, hover shows username) */}
        <div className="flex items-center justify-start gap-1.5">
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-pointer inline-flex shrink-0">
                  <CommunityAvatar
                    name={currentUserName || 'You'}
                    imageUrl={currentUser?.imageUrl}
                    size={36}
                    showStatus={false}
                    className={cn(
                      'shrink-0 aspect-square rounded-full transition-all',
                      isSpeakingLocal && 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-background',
                    )}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs font-semibold">
                {currentUserName || 'You'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {participants?.map((p) => (
            <TooltipProvider key={p.socketId} delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-pointer inline-flex shrink-0">
                    <CommunityAvatar
                      name={p.userName}
                      imageUrl={p.userAvatar}
                      size={36}
                      showStatus={false}
                      className={cn(
                        'shrink-0 aspect-square rounded-full transition-all',
                        p.isSpeaking && 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-background',
                      )}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-semibold">
                  {p.userName}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        {/* Center: Menu simpel cuma show chat, minimize activity, sama leave chat */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          <div className="h-11 bg-card rounded-xl flex items-center px-1.5 gap-1 border border-border/60 shadow-md shrink-0">
            {/* 1. Show Chat */}
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onToggleChat || onTogglePiP}
                    className={cn(
                      'h-9 w-9 rounded-lg transition-colors flex items-center justify-center cursor-pointer active:scale-95',
                      isChatOpen
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/80',
                    )}
                    title={isChatOpen ? 'Sembunyikan Obrolan' : 'Buka Obrolan'}
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-semibold">
                  {isChatOpen ? 'Sembunyikan Obrolan' : 'Tampilkan Obrolan'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* 2. Minimize Activity */}
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onTogglePiP}
                    className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                    title="Perkecil Aktivitas"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-semibold">
                  Perkecil Aktivitas
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* 3. Leave Chat / Activity (Red button with door/exit icon) */}
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onEndCall}
                    className="h-9 px-3 rounded-lg bg-destructive hover:bg-destructive/90 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 ml-0.5"
                    title="Tinggalkan Aktivitas"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-bold text-destructive">
                  Tinggalkan Aktivitas
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Right: Pop out & Layar Penuh tetap dipertahankan */}
        <div className="flex items-center justify-end gap-1 sm:gap-1.5">
          {/* Popout / Picture in Picture */}
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onTogglePiP}
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                  title="Popout (Picture-in-Picture)"
                >
                  <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
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
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                  title="Layar Penuh"
                >
                  <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
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
  return (
    <div
      className={cn(
        'h-16 shrink-0 w-full grid grid-cols-[auto_1fr_auto] sm:grid-cols-[1fr_auto_1fr] items-center bg-background select-none z-20',
        CHANNEL_HORIZONTAL_PADDING,
      )}
    >
      {/* Left: Invite Friends / Add to Call */}
      <div className="flex items-center justify-start">
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
      <div className="flex items-center justify-center gap-1.5 sm:gap-3">
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
              className="w-56 p-1.5 rounded-xl bg-background border border-border shadow-2xl text-foreground z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Mobile-Only Options: Screen Share, Activity, Soundboard */}
              <div className="md:hidden space-y-0.5">
                <DropdownMenuItem
                  onClick={onToggleScreenShare}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer text-foreground hover:bg-accent hover:text-accent-foreground transition-colors group"
                >
                  {isScreenSharing ? (
                    <>
                      <MonitorOff className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-emerald-500 font-semibold">Hentikan Berbagi Layar</span>
                    </>
                  ) : (
                    <>
                      <Monitor className="w-4 h-4 text-muted-foreground group-hover:text-accent-foreground shrink-0" />
                      <span>Berbagi Layar (Screen Share)</span>
                    </>
                  )}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={onOpenAppLauncher}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer text-foreground hover:bg-accent hover:text-accent-foreground transition-colors group"
                >
                  <Shapes
                    className={cn(
                      'w-4 h-4 shrink-0',
                      activeAppId !== null ? 'text-emerald-500' : 'text-muted-foreground group-hover:text-accent-foreground',
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
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer text-foreground hover:bg-accent hover:text-accent-foreground transition-colors group"
                >
                  <Sparkles className="w-4 h-4 text-muted-foreground group-hover:text-accent-foreground shrink-0" />
                  <span>Soundboard & Efek Suara</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 bg-border" />
              </div>

              {/* General Options for All Screen Sizes */}
              <DropdownMenuItem
                onClick={onOpenInvite}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer text-foreground hover:bg-accent hover:text-accent-foreground transition-colors group"
              >
                <UserPlus className="w-4 h-4 text-muted-foreground group-hover:text-accent-foreground shrink-0" />
                <span>Undang Teman ke Panggilan</span>
              </DropdownMenuItem>
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

      {/* Right: Popout (PiP) & Fullscreen Controls - Aligned Right, Visible on Mobile & Desktop */}
      <div className="flex items-center justify-end gap-1 sm:gap-1.5">
        {/* Popout / Picture in Picture */}
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onTogglePiP}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                title="Popout (Picture-in-Picture)"
              >
                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
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
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                title="Layar Penuh"
              >
                <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
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
