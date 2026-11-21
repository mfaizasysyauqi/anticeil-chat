import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Podcast,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Calendar,
  Share2,
  Users,
  Music,
  MoreHorizontal,
  PhoneOff,
  Hand,
  MessageSquare,
  Shield,
  ChevronRight,
  ChevronDown,
  X,
  Volume2,
  VolumeX,
  Check,
  Radio,
  Settings,
  Sparkles,
  Smile,
  AlertTriangle,
  UserPlus,
  Maximize,
} from 'lucide-react';
import { VOICE_BOTTOM_BAR_STYLES } from '../../constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useTranslation } from '@/core/i18n';
import type { ColonyChannel, Colony } from '@/chat/chat-types';

export interface StageViewProps {
  channel: ColonyChannel;
  activeColony?: Colony | null;
  currentUser?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    imageUrl?: string | null;
  } | null;
  onDisconnect?: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
}

interface StageParticipant {
  id: string;
  name: string;
  avatar?: string | null;
  isSpeaking?: boolean;
  isMuted?: boolean;
  isCameraOn?: boolean;
  isModerator?: boolean;
  isHandRaised?: boolean;
}

// Ambient stage synthesizer for background music
class StageAmbientSynth {
  private ctx: AudioContext | null = null;
  private isRunning = false;
  private timer: any = null;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      const chords = [
        [261.63, 329.63, 392.0, 493.88], // Cmaj7
        [220.0, 261.63, 329.63, 392.0], // Am7
        [174.61, 220.0, 261.63, 329.63], // Fmaj7
        [196.0, 246.94, 293.66, 392.0], // G
      ];
      let chordIndex = 0;
      const playChord = () => {
        if (!this.isRunning || !this.ctx) return;
        const now = this.ctx.currentTime;
        const currentChord = chords[chordIndex % chords.length];
        chordIndex++;
        currentChord.forEach((freq) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.exponentialRampToValueAtTime(0.015, now + 1.2);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 4);
        });
      };
      playChord();
      this.timer = setInterval(playChord, 4000);
    } catch {
      // AudioContext gesture requirement handled
    }
  }

  stop() {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
    }
  }
}

const ambientSynth = new StageAmbientSynth();

export function StageView({
  channel,
  activeColony,
  currentUser,
  onDisconnect,
  onToggleChat,
  isChatOpen = false,
}: StageViewProps) {
  const { t } = useTranslation();
  const userName =
    currentUser?.firstName ||
    currentUser?.email?.split('@')[0] ||
    activeColony?.name ||
    'zmsta';

  // State: Stage Status ('waiting' | 'live')
  const [stageStatus, setStageStatus] = useState<'waiting' | 'live'>('waiting');
  const [stageTopic, setStageTopic] = useState<string>('The debate is over: diet is better than regular');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [userRole, setUserRole] = useState<'moderator' | 'speaker' | 'audience'>('moderator');

  // Modals State
  const [isStartStageModalOpen, setIsStartStageModalOpen] = useState(false);
  const [isEndStageModalOpen, setIsEndStageModalOpen] = useState(false);
  const [isChangeTopicModalOpen, setIsChangeTopicModalOpen] = useState(false);
  const [newTopicInput, setNewTopicInput] = useState(stageTopic);
  const [notifyEveryone, setNotifyEveryone] = useState(true);

  // Participants
  const [speakers, setSpeakers] = useState<StageParticipant[]>([
    {
      id: currentUser?.id || 'usr_me',
      name: userName,
      avatar: currentUser?.imageUrl,
      isSpeaking: false,
      isMuted: isMicMuted,
      isCameraOn,
      isModerator: true,
    },
  ]);

  const [audience, setAudience] = useState<StageParticipant[]>([
    {
      id: 'usr_aud_1',
      name: 'Alex',
      avatar: null,
      isHandRaised: false,
    },
    {
      id: 'usr_aud_2',
      name: 'Sarah',
      avatar: null,
      isHandRaised: false,
    },
  ]);

  // Load Stage State from PostgreSQL Database
  useEffect(() => {
    let isMounted = true;
    api.get(`/v1/colony/channels/${channel.id}/stage`).then((res: any) => {
      if (isMounted && res) {
        if (res.status === 'live' || res.status === 'waiting') {
          setStageStatus(res.status);
        }
        if (res.topic) {
          setStageTopic(res.topic);
          setNewTopicInput(res.topic);
        }
        if (Array.isArray(res.speakers) && res.speakers.length > 0) {
          setSpeakers(res.speakers);
        }
        if (Array.isArray(res.audience) && res.audience.length > 0) {
          setAudience(res.audience);
        }
      }
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [channel.id]);

  // Speaking indicator simulation
  useEffect(() => {
    if (stageStatus !== 'live' || isMicMuted) return;
    const interval = setInterval(() => {
      setSpeakers((prev) =>
        prev.map((s, idx) => (idx === 0 ? { ...s, isSpeaking: Math.random() > 0.4 } : s)),
      );
    }, 2000);
    return () => clearInterval(interval);
  }, [stageStatus, isMicMuted]);

  // Ambient Music Lifecycle
  useEffect(() => {
    if (isMusicPlaying) {
      ambientSynth.start();
    } else {
      ambientSynth.stop();
    }
    return () => {
      ambientSynth.stop();
    };
  }, [isMusicPlaying]);

  // Toggle ambient music
  const toggleMusic = () => {
    setIsMusicPlaying((prev) => !prev);
    toast.success(isMusicPlaying ? t('Musik latar dihentikan') : t('Musik latar dimainkan 🎵'));
  };

  // Start Stage Action (Persisted to Database)
  const handleStartStage = async () => {
    if (!newTopicInput.trim()) {
      toast.error(t('Topik Stage tidak boleh kosong'));
      return;
    }
    const finalTopic = newTopicInput.trim();
    setStageTopic(finalTopic);
    setStageStatus('live');
    setIsStartStageModalOpen(false);
    try {
      await api.post(`/v1/colony/channels/${channel.id}/stage/start`, {
        topic: finalTopic,
        speakers,
        audience,
      });
    } catch {}
    toast.success(t('Stage berhasil dimulai! 🎙️'));
  };

  // End Stage Action (Persisted to Database)
  const handleEndStage = async () => {
    setStageStatus('waiting');
    setIsEndStageModalOpen(false);
    try {
      await api.post(`/v1/colony/channels/${channel.id}/stage/end`);
    } catch {}
    toast.info(t('Stage telah diakhiri untuk semua orang'));
    onDisconnect?.();
  };

  // Request to speak toggle (Persisted to Database)
  const handleToggleHandRaise = async () => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    try {
      await api.post(`/v1/colony/channels/${channel.id}/stage/hand-raise`, {
        userId: currentUser?.id || 'usr_me',
        isHandRaised: next,
      });
    } catch {}
    toast.success(next ? t('Tangan diangkat! Moderator telah diberitahu ✋') : t('Batal mengangkat tangan'));
  };

  return (
    <TooltipProvider>
      <div className="flex-1 flex flex-col h-full w-full bg-gradient-to-b from-[#141638] via-[#0f1124] to-[#090a16] text-white overflow-hidden relative select-none">
        {/* ───────────────────────────────────────────────────────────── */}
        {/* TOP BAR: Topic, Indicators & Chat Toggle                      */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="h-12 border-b border-white/[0.08] px-4 flex items-center justify-between shrink-0 bg-black/20 backdrop-blur-md z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1.5 text-sm font-bold text-white truncate">
              <Podcast className="w-4 h-4 text-primary shrink-0" />
              <span className="truncate">{stageStatus === 'live' ? stageTopic : channel.name}</span>
            </div>

            <div className="h-4 w-px bg-white/10 hidden sm:block" />

            {/* Speaking / Audience indicators */}
            <div className="hidden sm:flex items-center gap-3 text-xs text-white/60">
              <div className="flex items-center gap-1">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>{stageStatus === 'live' ? '1 is speaking' : '0 is speaking'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-white/50" />
                <span>{`${audience.length} in audience`}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Hand Raise indicator / button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleToggleHandRaise}
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer',
                    isHandRaised ? 'bg-amber-500/20 text-amber-300' : 'text-white/70 hover:bg-white/10 hover:text-white',
                  )}
                >
                  <Hand className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {isHandRaised ? t('Turunkan Tangan') : t('Request to Speak')}
              </TooltipContent>
            </Tooltip>

            {/* Chat Toggle button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleChat}
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer',
                    isChatOpen ? 'bg-primary/20 text-primary' : 'text-white/70 hover:bg-white/10 hover:text-white',
                  )}
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {t('Buka Chat Saluran')}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* MAIN BODY                                                     */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 flex flex-col justify-center items-center">
          {/* 1. WAITING STATE (Screenshot 3) */}
          {stageStatus === 'waiting' && (
            <div className="w-full max-w-md mx-auto flex flex-col items-center text-center space-y-6 my-auto animate-in fade-in-50 duration-200">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {t('Waiting for the Stage to start')}
                </h1>
                <p className="text-sm text-white/60 mt-1.5">
                  {t('What will you be talking about today?')}
                </p>
              </div>

              {/* 3 Discord Action Cards */}
              <div className="w-full space-y-2.5">
                {/* Card 1: Start the Stage */}
                <div
                  onClick={() => setIsStartStageModalOpen(true)}
                  className="w-full p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-between gap-4 cursor-pointer transition-all text-left group shadow-lg"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                      <Podcast className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                        {t('Start the Stage')}
                      </h3>
                      <p className="text-xs text-white/50">
                        {t('Pick a topic to start the conversation.')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors shrink-0" />
                </div>

                {/* Card 2: Create Event */}
                <div
                  onClick={() => {
                    toast.info(t('Fitur Penjadwalan Acara Stage siap digunakan'));
                  }}
                  className="w-full p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-between gap-4 cursor-pointer transition-all text-left group shadow-lg"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                        {t('Create Event')}
                      </h3>
                      <p className="text-xs text-white/50">
                        {t('Schedule a Stage for a future date.')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors shrink-0" />
                </div>

                {/* Card 3: Continue without starting */}
                <div
                  onClick={() => {
                    setStageStatus('live');
                    toast.success(t('Bergabung dalam mode mic check'));
                  }}
                  className="w-full p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-between gap-4 cursor-pointer transition-all text-left group shadow-lg"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Mic className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {t('Continue without starting')}
                      </h3>
                      <p className="text-xs text-white/50">
                        {t("For mic checks. Start when you're ready.")}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors shrink-0" />
                </div>
              </div>

              {/* Waiting User Status */}
              <div className="flex items-center gap-2 text-xs text-white/50 pt-2">
                <CommunityAvatar
                  name={userName}
                  imageUrl={currentUser?.imageUrl}
                  size={20}
                />
                <span>{t('{{name}} is currently waiting', { name: userName })}</span>
              </div>
            </div>
          )}

          {/* 2. LIVE STAGE STATE (Screenshots 5, 7, 8, 9) */}
          {stageStatus === 'live' && (
            <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col justify-start space-y-8 animate-in fade-in-50 duration-200">
              {/* Speakers Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/60">
                  <Mic className="w-3.5 h-3.5" />
                  <span>{t('Speakers — {{count}}', { count: speakers.length })}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {speakers.map((speaker) => (
                    <div
                      key={speaker.id}
                      className={cn(
                        'aspect-[4/3] rounded-2xl bg-[#2b2d31]/80 hover:bg-[#313338] border transition-all p-4 flex flex-col items-center justify-center relative shadow-lg group',
                        speaker.isSpeaking ? 'border-emerald-500 shadow-emerald-500/20' : 'border-white/[0.08]',
                      )}
                    >
                      {/* Avatar with speaking ring */}
                      <div className="relative">
                        <div
                          className={cn(
                            'p-1 rounded-full transition-all',
                            speaker.isSpeaking && 'ring-2 ring-emerald-400 animate-pulse',
                          )}
                        >
                          <CommunityAvatar
                            name={speaker.name}
                            imageUrl={speaker.avatar}
                            size={64}
                          />
                        </div>
                      </div>

                      {/* Name Tag */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-xs font-semibold text-white max-w-[80%] truncate">
                        <span className="truncate">{speaker.name}</span>
                        {speaker.isMuted && <MicOff className="w-3 h-3 text-rose-400 shrink-0" />}
                      </div>

                      {/* Moderator Shield Badge */}
                      {speaker.isModerator && (
                        <div
                          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center shadow"
                          title={t('Stage Moderator')}
                        >
                          <Shield className="w-3.5 h-3.5 text-primary" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Audience Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/60">
                  <Users className="w-3.5 h-3.5" />
                  <span>{t('Audience — {{count}}', { count: audience.length })}</span>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                  {audience.map((member) => (
                    <div
                      key={member.id}
                      className="flex flex-col items-center space-y-1.5 group cursor-pointer"
                    >
                      <div className="relative">
                        <CommunityAvatar
                          name={member.name}
                          imageUrl={member.avatar}
                          size={44}
                        />
                        {member.isHandRaised && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center shadow text-xs">
                            ✋
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-white/70 group-hover:text-white transition-colors truncate max-w-[70px]">
                        {member.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* BOTTOM CONTROL DOCK - Unified with Voice Channel (DRY)         */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className={VOICE_BOTTOM_BAR_STYLES.CONTAINER}>
          {/* Left: Invite to Stage */}
          <div className="flex items-center justify-start">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    toast.info(t('Link panggung disalin ke clipboard'));
                  }}
                  className={VOICE_BOTTOM_BAR_STYLES.SIDE_BUTTON}
                  title={t('Undang Teman ke Stage')}
                >
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs font-semibold">
                {t('Undang Teman ke Stage')}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Center: Controls Pill Group */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-3">
            {/* Pill 1: Audio & Video controls */}
            <div className={VOICE_BOTTOM_BAR_STYLES.PILL}>
              {/* Mic Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setIsMicMuted((prev) => !prev)}
                    className={cn(
                      VOICE_BOTTOM_BAR_STYLES.BUTTON_TOGGLE,
                      isMicMuted ? 'text-red-500 hover:bg-red-500/10' : 'text-foreground hover:bg-muted/60',
                    )}
                  >
                    {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-semibold">
                  {isMicMuted ? t('Nyalakan Mikrofon') : t('Bisukan Mikrofon')}
                </TooltipContent>
              </Tooltip>

              {/* Video Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setIsCameraOn((prev) => !prev)}
                    className={cn(
                      VOICE_BOTTOM_BAR_STYLES.BUTTON_TOGGLE,
                      !isCameraOn ? 'text-red-500 hover:bg-red-500/10' : 'text-foreground hover:bg-muted/60',
                    )}
                  >
                    {!isCameraOn ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-semibold">
                  {isCameraOn ? t('Matikan Kamera') : t('Nyalakan Kamera')}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Pill 2: Tools (Screen, Music, Hands, More) */}
            <div className={VOICE_BOTTOM_BAR_STYLES.PILL_GAP}>
              {/* Share Screen */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      toast.info(t('Berbagi layar siap digunakan'));
                    }}
                    className={VOICE_BOTTOM_BAR_STYLES.BUTTON_ICON}
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-semibold">
                  {t('Bagikan Layar')}
                </TooltipContent>
              </Tooltip>

              {/* Ambient Music Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={toggleMusic}
                    className={cn(
                      'h-9 w-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer',
                      isMusicPlaying
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'text-foreground hover:bg-muted/60',
                    )}
                  >
                    <Music className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-semibold">
                  {isMusicPlaying ? t('Mute Music') : t('Unmute Music')}
                </TooltipContent>
              </Tooltip>

              {/* Leave the Stage / Raise Hand */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      if (userRole === 'speaker' || userRole === 'moderator') {
                        toast.info(t('Anda turun dari panggung ke audiens'));
                        setUserRole('audience');
                      } else {
                        handleToggleHandRaise();
                      }
                    }}
                    className={VOICE_BOTTOM_BAR_STYLES.BUTTON_ICON}
                  >
                    {userRole === 'moderator' || userRole === 'speaker' ? (
                      <Users className="w-5 h-5" />
                    ) : (
                      <Hand className="w-5 h-5" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-semibold">
                  {userRole === 'moderator' || userRole === 'speaker'
                    ? t('Leave the Stage')
                    : t('Request to Speak')}
                </TooltipContent>
              </Tooltip>

              {/* More Options `...` */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={VOICE_BOTTOM_BAR_STYLES.BUTTON_ICON}
                    aria-label="Opsi Lainnya"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="center"
                  side="top"
                  sideOffset={12}
                  className="w-56 p-1.5 rounded-xl bg-background border border-border shadow-2xl text-foreground z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <DropdownMenuItem
                    onClick={() => {
                      setNewTopicInput(stageTopic);
                      setIsChangeTopicModalOpen(true);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    {t('Change the topic')}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => toast.info(t('Pengaturan notifikasi: Only @mentions'))}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <span>{t('Notification Settings')}</span>
                    <span className="text-[10px] text-muted-foreground">{t('Only @mentions')}</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => toast.success(t('Pilihan kamera diperbarui'))}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <span>{t('Show My Own Camera')}</span>
                    <Check className="w-3.5 h-3.5 text-primary" />
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => toast.success(t('Pratinjau pesan diaktifkan'))}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <span>{t('Show New Message Previews')}</span>
                    <Check className="w-3.5 h-3.5 text-primary" />
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-border my-1" />

                  <DropdownMenuItem
                    onClick={() => toast.info(t('Membuka pengaturan audio & video'))}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{t('Voice & Video Settings')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Pill 3: Red Disconnect Button with Chevron */}
            <div className="h-11 rounded-xl bg-destructive hover:bg-destructive/90 text-white shadow-md flex items-center overflow-hidden shrink-0 active:scale-95">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      if (stageStatus === 'live' && (userRole === 'moderator' || userRole === 'speaker')) {
                        setIsEndStageModalOpen(true);
                      } else {
                        onDisconnect?.();
                      }
                    }}
                    className="h-11 px-3.5 sm:px-4 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-bold text-destructive">
                  {t('Disconnect Quietly')}
                </TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="h-11 px-2.5 hover:bg-black/20 flex items-center justify-center transition-colors cursor-pointer border-l border-white/20"
                    aria-label="Opsi Putus"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  side="top"
                  sideOffset={12}
                  className="w-56 p-1.5 rounded-xl bg-background border border-border shadow-2xl text-foreground z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <DropdownMenuItem
                    onClick={() => setIsEndStageModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4 text-destructive" />
                    <span>{t('End Stage for Everyone')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Right: Fullscreen Utility */}
          <div className="flex items-center justify-end gap-1 sm:gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    if (document.fullscreenElement) {
                      document.exitFullscreen().catch(() => {});
                    } else {
                      document.documentElement.requestFullscreen().catch(() => {});
                    }
                  }}
                  className={VOICE_BOTTOM_BAR_STYLES.SIDE_BUTTON}
                  title={t('Layar Penuh')}
                >
                  <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs font-semibold">
                {t('Layar Penuh')}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* MODAL 1: START THE STAGE (Screenshot 4)                      */}
        {/* ───────────────────────────────────────────────────────────── */}
        <Dialog open={isStartStageModalOpen} onOpenChange={setIsStartStageModalOpen}>
          <DialogContent size="md" className="bg-[#313338] border-white/10 text-white p-6 rounded-2xl shadow-2xl">
            <DialogHeader className="space-y-3 text-center">
              {/* 3D Neon Studio Mic Illustration */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/30">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <DialogTitle className="text-xl font-extrabold text-white">
                {t('What will you be talking about?')}
              </DialogTitle>
              <DialogDescription className="text-xs text-white/60">
                {t('Write a topic to start your Stage.')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 block">
                  {t('Stage Topic')} <span className="text-rose-400">*</span>
                </label>
                <Input
                  value={newTopicInput}
                  onChange={(e) => setNewTopicInput(e.target.value)}
                  placeholder="The debate is over: diet is better than regular"
                  className="bg-[#1e1f22] border-white/10 text-white text-xs h-10 rounded-lg focus-visible:ring-primary"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="notify-everyone"
                  checked={notifyEveryone}
                  onCheckedChange={(c) => setNotifyEveryone(!!c)}
                  className="data-[state=checked]:bg-[#5865F2] data-[state=checked]:border-[#5865F2]"
                />
                <label
                  htmlFor="notify-everyone"
                  className="text-xs text-white/80 cursor-pointer font-medium select-none"
                >
                  {t('Notify @everyone')}
                </label>
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                variant="ghost"
                onClick={() => setIsStartStageModalOpen(false)}
                className="text-xs text-white/70 hover:text-white h-9 px-4"
              >
                {t('Cancel')}
              </Button>
              <Button
                onClick={handleStartStage}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-xs h-9 px-5 rounded-lg shadow-sm"
              >
                {t('Start Stage')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* MODAL 2: END STAGE CONFIRMATION (Screenshot 12)              */}
        {/* ───────────────────────────────────────────────────────────── */}
        <Dialog open={isEndStageModalOpen} onOpenChange={setIsEndStageModalOpen}>
          <DialogContent size="sm" className="bg-[#313338] border-white/10 text-white p-6 rounded-2xl shadow-2xl">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-lg font-bold text-white">
                {t('Do you want to also end the Stage?')}
              </DialogTitle>
              <DialogDescription className="text-xs text-white/60 leading-relaxed">
                {t('A Stage with no speakers will automatically end after a few minutes.')}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="pt-4 flex flex-col gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEndStageModalOpen(false);
                  onDisconnect?.();
                }}
                className="w-full bg-[#4e5058]/40 hover:bg-[#4e5058]/60 text-white text-xs font-semibold h-10 rounded-lg"
              >
                {t('No, just disconnect quietly')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleEndStage}
                className="w-full bg-[#da373c] hover:bg-[#c03135] text-white text-xs font-semibold h-10 rounded-lg"
              >
                {t('Disconnect and End')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* MODAL 3: CHANGE THE TOPIC                                    */}
        {/* ───────────────────────────────────────────────────────────── */}
        <Dialog open={isChangeTopicModalOpen} onOpenChange={setIsChangeTopicModalOpen}>
          <DialogContent size="md" className="bg-[#313338] border-white/10 text-white p-6 rounded-2xl shadow-2xl">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-base font-bold text-white">
                {t('Change the topic')}
              </DialogTitle>
              <DialogDescription className="text-xs text-white/60">
                {t('Update the live discussion topic for all audience members.')}
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              <Input
                value={newTopicInput}
                onChange={(e) => setNewTopicInput(e.target.value)}
                placeholder="Topik diskusi panggung"
                className="bg-[#1e1f22] border-white/10 text-white text-xs h-10 rounded-lg focus-visible:ring-primary"
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                variant="ghost"
                onClick={() => setIsChangeTopicModalOpen(false)}
                className="text-xs text-white/70 hover:text-white h-9 px-4"
              >
                {t('Batal')}
              </Button>
              <Button
                onClick={() => {
                  setStageTopic(newTopicInput);
                  setIsChangeTopicModalOpen(false);
                  toast.success(t('Topik Stage diperbarui!'));
                }}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-xs h-9 px-5 rounded-lg shadow-sm"
              >
                {t('Simpan Topik')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
