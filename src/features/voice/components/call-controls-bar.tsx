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
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import { toast } from 'sonner';
import { DiscordAppDefinition } from '../data/voice-activities';

const SOUNDBOARD_EFFECTS = [
  { id: 'airhorn', name: 'Airhorn', emoji: '📢', desc: 'Hype horn' },
  { id: 'quack', name: 'Bebek Quack', emoji: '🦆', desc: 'Konyol' },
  { id: 'tada', name: 'Ta-da!', emoji: '🎉', desc: 'Perayaan' },
  { id: 'bonk', name: 'Bonk', emoji: '🔨', desc: 'Pukulan kartun' },
  { id: 'applause', name: 'Tepuk Tangan', emoji: '👏', desc: 'Sorak tepuk' },
  { id: 'cricket', name: 'Jangkrik', emoji: '🦗', desc: 'Hening' },
  { id: 'chime', name: 'Chime Ding', emoji: '🔔', desc: 'Notifikasi' },
];

function playCallSoundEffect(type: string) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 'airhorn') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(466.16, now);
      osc.frequency.setValueAtTime(466.16, now + 0.15);
      osc.frequency.setValueAtTime(466.16, now + 0.3);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'quack') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'tada') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      osc.frequency.setValueAtTime(1046.5, now + 0.3);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'bonk') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'applause') {
      const bufferSize = ctx.sampleRate * 0.8;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1000;
      noise.connect(filter);
      filter.connect(gain);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      noise.start(now);
      noise.stop(now + 0.8);
    } else if (type === 'cricket') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(4500, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (e) {
    console.error('Audio synthesis failed:', e);
  }
}

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
  const [isSoundboardOpen, setIsSoundboardOpen] = React.useState(false);
  const [activeSoundPlaying, setActiveSoundPlaying] = React.useState<string | null>(null);
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
                      ? 'bg-primary/20 text-primary hover:bg-primary/30'
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
                      ? 'bg-primary/20 text-primary hover:bg-primary/30'
                      : 'text-foreground hover:bg-muted/60',
                  )}
                >
                  <Shapes className="w-5 h-5" />
                  {activeAppId !== null && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-card" />
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

          {/* Soundboard Popover */}
          <Popover open={isSoundboardOpen} onOpenChange={setIsSoundboardOpen}>
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "h-9 w-10 items-center justify-center rounded-lg text-foreground hover:bg-muted/60 transition-colors cursor-pointer hidden md:flex",
                        isSoundboardOpen && "bg-muted text-primary"
                      )}
                      aria-label="Soundboard"
                    >
                      <Sparkles className="w-5 h-5" />
                    </button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-semibold">
                  Soundboard & Efek Suara
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <PopoverContent
              side="top"
              align="center"
              sideOffset={14}
              className="w-80 p-3 bg-card border border-border shadow-2xl rounded-2xl text-foreground z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">Soundboard Suara</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    {SOUNDBOARD_EFFECTS.length} Efek
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-0.5">
                  {SOUNDBOARD_EFFECTS.map((snd) => {
                    const isPlaying = activeSoundPlaying === snd.id;
                    return (
                      <button
                        key={snd.id}
                        type="button"
                        onClick={() => {
                          setActiveSoundPlaying(snd.id);
                          playCallSoundEffect(snd.id);
                          toast.success(`Memainkan efek ${snd.name}!`, { duration: 1500 });
                          setTimeout(() => setActiveSoundPlaying(null), 700);
                        }}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-xl text-left border transition-all cursor-pointer group",
                          isPlaying
                            ? "bg-primary/20 border-primary shadow-xs ring-1 ring-primary"
                            : "bg-muted/40 hover:bg-muted/80 border-border/60 hover:border-primary/40"
                        )}
                      >
                        <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">
                          {snd.emoji}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{snd.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{snd.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </PopoverContent>
          </Popover>

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
                  <span className="md:hidden absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-card" />
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
                      <MonitorOff className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-primary font-semibold">Hentikan Berbagi Layar</span>
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
                      activeAppId !== null ? 'text-primary' : 'text-muted-foreground group-hover:text-accent-foreground',
                    )}
                  />
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <span>Aktivitas & Games</span>
                    {activeAppId !== null && (
                      <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">
                        Aktif
                      </span>
                    )}
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setIsSoundboardOpen(true)}
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
