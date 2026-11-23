import React, { useState, useEffect, useMemo } from 'react';
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
  Check,
  Settings,
  UserPlus,
  Maximize,
} from 'lucide-react';
import { VOICE_BOTTOM_BAR_STYLES } from '../../constants';
import { CHANNEL_HORIZONTAL_PADDING, CHANNEL_VERTICAL_PADDING } from '@/lib/layout-constants';
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
import { MediumDialog } from '@/components/ui/medium-dialog';
import { SmallDialog } from '@/components/ui/small-dialog';
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
import { useCallWebRTC } from '../../hooks/use-call-webrtc';
import { LocalVideoView, RemoteVideoView, RemoteAudioView, ScreenVideoView } from '../video-views';

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
  socket?: any;
  isPlusOrAbove?: boolean;
  onOpenServerEvents?: () => void;
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
  isLocal?: boolean;
  stream?: MediaStream | null;
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
  socket,
  isPlusOrAbove = false,
  onOpenServerEvents,
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

  // Check if current user is owner or moderator
  const isColonyAdminOrOwner = useMemo(() => {
    if (!currentUser?.id) return false;
    if (activeColony?.ownerId && activeColony.ownerId === currentUser.id) return true;
    const role = (currentUser as any)?.role;
    return role === 'owner' || role === 'admin' || role === 'moderator';
  }, [activeColony?.ownerId, currentUser]);

  // Stage Status ('waiting' | 'live') & Topic
  const initialTopic = channel.topic || channel.description || `Diskusi #${channel.name}`;
  const [stageStatus, setStageStatus] = useState<'waiting' | 'live'>('waiting');
  const [stageTopic, setStageTopic] = useState<string>(initialTopic);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [userRole, setUserRole] = useState<'moderator' | 'speaker' | 'audience'>(
    isColonyAdminOrOwner ? 'moderator' : 'audience',
  );

  // Raised hands & speaker promote lists tracked via socket / backend
  const [raisedHandUserIds, setRaisedHandUserIds] = useState<Set<string>>(new Set());
  const [speakerUserIds, setSpeakerUserIds] = useState<Set<string>>(new Set());

  // Modals State
  const [isStartStageModalOpen, setIsStartStageModalOpen] = useState(false);
  const [isEndStageModalOpen, setIsEndStageModalOpen] = useState(false);
  const [isChangeTopicModalOpen, setIsChangeTopicModalOpen] = useState(false);
  const [newTopicInput, setNewTopicInput] = useState(initialTopic);
  const [notifyEveryone, setNotifyEveryone] = useState(true);

  // 1. Fullstack WebRTC Call & Audio Hook
  const {
    localStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isSpeakingLocal,
    participants,
    isAnyoneScreenSharing,
    activeScreenStream,
    handleToggleMute,
    handleToggleVideo,
    handleToggleScreenShare,
  } = useCallWebRTC({
    channel,
    activeColony,
    currentUser,
    isPlusOrAbove: !!isPlusOrAbove,
    socket: socket ?? null,
    isCallActive: stageStatus === 'live',
  });

  // 2. Load Stage State from PostgreSQL Database
  useEffect(() => {
    let isMounted = true;
    api
      .get(`/v1/colony/channels/${channel.id}/stage`)
      .then((res: any) => {
        if (isMounted && res) {
          if (res.status === 'live' || res.status === 'waiting') {
            setStageStatus(res.status);
          }
          if (res.topic) {
            setStageTopic(res.topic);
            setNewTopicInput(res.topic);
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [channel.id]);

  // 3. Realtime Socket Stage Events Listener
  useEffect(() => {
    if (!socket) return;
    const handleStageEvent = (event: any) => {
      if (!event || event.channelId !== channel.id) return;
      if (event.action === 'STAGE_START') {
        setStageStatus('live');
        if (event.topic) {
          setStageTopic(event.topic);
          setNewTopicInput(event.topic);
        }
        toast.info(t('Stage telah dimulai: {{topic}}', { topic: event.topic || channel.name }));
      } else if (event.action === 'STAGE_END') {
        setStageStatus('waiting');
        toast.info(t('Stage telah diakhiri oleh moderator'));
      } else if (event.action === 'STAGE_TOPIC_CHANGE') {
        if (event.topic) {
          setStageTopic(event.topic);
          setNewTopicInput(event.topic);
        }
      } else if (event.action === 'STAGE_HAND_RAISE') {
        setRaisedHandUserIds((prev) => {
          const next = new Set(prev);
          if (event.isHandRaised) {
            next.add(event.userId);
          } else {
            next.delete(event.userId);
          }
          return next;
        });
      } else if (event.action === 'STAGE_SPEAKER_PROMOTE') {
        if (event.userId === currentUser?.id) {
          setUserRole('speaker');
          toast.success(t('Anda telah dipromosikan menjadi pembicara!'));
        }
        setSpeakerUserIds((prev) => new Set([...prev, event.userId]));
      } else if (event.action === 'STAGE_SPEAKER_DEMOTE') {
        if (event.userId === currentUser?.id) {
          setUserRole('audience');
          toast.info(t('Anda kembali menjadi audiens'));
        }
        setSpeakerUserIds((prev) => {
          const next = new Set(prev);
          next.delete(event.userId);
          return next;
        });
      }
    };

    socket.on('COMMUNITY_STAGE_EVENT', handleStageEvent);
    return () => {
      socket.off('COMMUNITY_STAGE_EVENT', handleStageEvent);
    };
  }, [socket, channel.id, currentUser?.id, t]);

  // 4. Partition Real Speakers & Audience
  const { speakers, audience } = useMemo(() => {
    const spkList: StageParticipant[] = [];
    const audList: StageParticipant[] = [];

    // Local user
    if (userRole === 'moderator' || userRole === 'speaker') {
      spkList.push({
        id: currentUser?.id || 'usr_me',
        name: userName,
        avatar: currentUser?.imageUrl,
        isSpeaking: Boolean(isSpeakingLocal && !isMuted),
        isMuted,
        isCameraOn: !isVideoOff,
        isModerator: isColonyAdminOrOwner,
        isLocal: true,
        stream: localStream,
      });
    } else {
      audList.push({
        id: currentUser?.id || 'usr_me',
        name: userName,
        avatar: currentUser?.imageUrl,
        isHandRaised,
        isLocal: true,
      });
    }

    // Remote participants from WebRTC
    participants.forEach((p) => {
      const isPeerSpeaker =
        speakerUserIds.has(p.userId || p.socketId) ||
        (userRole === 'moderator' && participants.length <= 4); // Small stages treat connected users as speakers by default

      if (isPeerSpeaker) {
        spkList.push({
          id: p.socketId,
          name: p.userName,
          avatar: p.userAvatar,
          isSpeaking: Boolean(p.isSpeaking),
          isMuted: !p.hasAudio,
          isCameraOn: p.hasVideo,
          isModerator: false,
          isLocal: false,
          stream: p.stream,
        });
      } else {
        audList.push({
          id: p.socketId,
          name: p.userName,
          avatar: p.userAvatar,
          isHandRaised: raisedHandUserIds.has(p.userId || p.socketId),
          isLocal: false,
        });
      }
    });

    return { speakers: spkList, audience: audList };
  }, [
    userRole,
    currentUser?.id,
    currentUser?.imageUrl,
    userName,
    isSpeakingLocal,
    isMuted,
    isVideoOff,
    isColonyAdminOrOwner,
    localStream,
    isHandRaised,
    participants,
    speakerUserIds,
    raisedHandUserIds,
  ]);

  const activeSpeakingCount = useMemo(() => {
    return speakers.filter((s) => s.isSpeaking).length;
  }, [speakers]);

  // Discord Stage Quota Parity:
  // Free: 1,000 listeners (50 with video)
  // Lvl 2: 5,000 listeners (150 with video)
  // Lvl 3: 10,000 listeners (300 with video)
  const boostTier = activeColony?.boostTier || 0;
  const isVideoActiveOnStage = speakers.some((s) => s.isCameraOn) || isAnyoneScreenSharing;
  const maxStageAudience =
    boostTier >= 3
      ? isVideoActiveOnStage
        ? 300
        : 10000
      : boostTier >= 2
      ? isVideoActiveOnStage
        ? 150
        : 5000
      : isVideoActiveOnStage
      ? 50
      : 1000;

  const handleStageToggleVideo = () => {
    // Discord Hard-Cap Parity: Max 5 active speakers with video in a Stage
    const currentVideoSpeakers = speakers.filter((s) => s.isCameraOn && !s.isLocal).length;
    if (isVideoOff && currentVideoSpeakers >= 5) {
      toast.error(t('Batas pembicara video di Stage tercapai (Maksimal 5 pembicara dengan video)'));
      return;
    }
    handleToggleVideo();
  };

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

  const toggleMusic = () => {
    setIsMusicPlaying((prev) => !prev);
    toast.success(isMusicPlaying ? t('Musik latar dihentikan') : t('Musik latar dimainkan 🎵'));
  };

  // Start Stage Action (Persisted to Database & Emitted via Socket)
  const handleStartStage = async () => {
    if (!newTopicInput.trim()) {
      toast.error(t('Topik Stage tidak boleh kosong'));
      return;
    }
    const finalTopic = newTopicInput.trim();
    setStageTopic(finalTopic);
    setStageStatus('live');
    setUserRole(isColonyAdminOrOwner ? 'moderator' : 'speaker');
    setIsStartStageModalOpen(false);

    try {
      await api.post(`/v1/colony/channels/${channel.id}/stage/start`, {
        topic: finalTopic,
      });
    } catch {}

    socket?.emit('COMMUNITY_STAGE_EVENT', {
      channelId: channel.id,
      action: 'STAGE_START',
      topic: finalTopic,
      startedBy: currentUser?.id,
    });

    toast.success(t('Stage berhasil dimulai! 🎙️'));
  };

  // End Stage Action (Persisted to Database & Emitted via Socket)
  const handleEndStage = async () => {
    setStageStatus('waiting');
    setIsEndStageModalOpen(false);
    ambientSynth.stop();
    setIsMusicPlaying(false);

    try {
      await api.post(`/v1/colony/channels/${channel.id}/stage/end`);
    } catch {}

    socket?.emit('COMMUNITY_STAGE_EVENT', {
      channelId: channel.id,
      action: 'STAGE_END',
    });

    toast.info(t('Stage telah diakhiri untuk semua orang'));
    onDisconnect?.();
  };

  // Request to speak toggle (Persisted to Database & Emitted via Socket)
  const handleToggleHandRaise = async () => {
    const next = !isHandRaised;
    setIsHandRaised(next);

    try {
      await api.post(`/v1/colony/channels/${channel.id}/stage/hand-raise`, {
        userId: currentUser?.id || 'usr_me',
        isHandRaised: next,
      });
    } catch {}

    socket?.emit('COMMUNITY_STAGE_EVENT', {
      channelId: channel.id,
      action: 'STAGE_HAND_RAISE',
      userId: currentUser?.id,
      isHandRaised: next,
    });

    toast.success(next ? t('Tangan diangkat! Moderator telah diberitahu ✋') : t('Batal mengangkat tangan'));
  };

  // Handle changing topic
  const handleSaveTopic = async () => {
    if (!newTopicInput.trim()) return;
    const finalTopic = newTopicInput.trim();
    setStageTopic(finalTopic);
    setIsChangeTopicModalOpen(false);

    try {
      await api.put(`/v1/colony/channels/${channel.id}/stage/topic`, {
        topic: finalTopic,
      });
    } catch {}

    socket?.emit('COMMUNITY_STAGE_EVENT', {
      channelId: channel.id,
      action: 'STAGE_TOPIC_CHANGE',
      topic: finalTopic,
    });

    toast.success(t('Topik Stage diperbarui!'));
  };

  return (
    <TooltipProvider>
      <div className="flex-1 min-h-0 flex flex-col h-full w-full bg-background text-foreground overflow-hidden relative select-none">
        {/* ───────────────────────────────────────────────────────────── */}
        {/* TOP BAR: Topic, Indicators & Chat Toggle                      */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className={cn('h-12 border-b border-border flex items-center justify-between shrink-0 bg-background select-none z-10', CHANNEL_HORIZONTAL_PADDING)}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1.5 text-sm font-bold text-foreground truncate">
              <Podcast className="w-4 h-4 text-primary shrink-0" />
              <span className="truncate">{stageStatus === 'live' ? stageTopic : channel.name}</span>
            </div>

            <div className="h-4 w-px bg-border hidden sm:block" />

            {/* Speaking / Audience indicators */}
            <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Mic className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  {activeSpeakingCount > 0
                    ? `${activeSpeakingCount} is speaking`
                    : '0 is speaking'}
                </span>
              </div>
              <div className="flex items-center gap-1 font-mono">
                <Users className="w-3.5 h-3.5 text-muted-foreground/60" />
                <span>{`${audience.length}/${maxStageAudience} in audience`}</span>
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
                    isHandRaised
                      ? 'bg-amber-500/20 text-amber-500'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
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
                    isChatOpen
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
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
        {/* Symmetrical horizontal & vertical rhythm with app bar         */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div
          className={cn(
            'flex-1 min-h-0 overflow-y-auto max-lg:scrollbar-none custom-scrollbar flex flex-col',
            CHANNEL_HORIZONTAL_PADDING,
            CHANNEL_VERTICAL_PADDING,
          )}
        >
          {/* 1. WAITING STATE */}
          {stageStatus === 'waiting' && (
            <div className="w-full max-w-md mx-auto flex flex-col items-center text-center space-y-6 my-auto animate-in fade-in-50 duration-200">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {t('Waiting for the Stage to start')}
                </h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                  {t('What will you be talking about today?')}
                </p>
              </div>

              {/* Action Cards */}
              <div className="w-full space-y-2.5">
                {/* Card 1: Start the Stage */}
                <div
                  onClick={() => setIsStartStageModalOpen(true)}
                  className="w-full p-4 rounded-2xl bg-card hover:bg-muted/40 border border-border flex items-center justify-between gap-4 cursor-pointer transition-all text-left group shadow-xs"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Podcast className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {t('Start the Stage')}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {t('Pick a topic to start the conversation.')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-foreground transition-colors shrink-0" />
                </div>

                {/* Card 2: Create Event */}
                <div
                  onClick={() => {
                    onOpenServerEvents?.();
                  }}
                  className="w-full p-4 rounded-2xl bg-card hover:bg-muted/40 border border-border flex items-center justify-between gap-4 cursor-pointer transition-all text-left group shadow-xs"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground group-hover:text-amber-500 transition-colors">
                        {t('Create Event')}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {t('Schedule a Stage for a future date.')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-foreground transition-colors shrink-0" />
                </div>

                {/* Card 3: Continue without starting */}
                <div
                  onClick={() => {
                    setStageStatus('live');
                    setUserRole('audience');
                    if (!isMuted) {
                      handleToggleMute();
                    }
                    socket?.emit('COMMUNITY_STAGE_EVENT', {
                      channelId: channel.id,
                      action: 'STAGE_SPEAKER_DEMOTE',
                      userId: currentUser?.id,
                    });
                    toast.success(t('Bergabung sebagai audiens'));
                  }}
                  className="w-full p-4 rounded-2xl bg-card hover:bg-muted/40 border border-border flex items-center justify-between gap-4 cursor-pointer transition-all text-left group shadow-xs"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                      <Mic className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                        {t('Continue without starting')}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {t("For mic checks. Start when you're ready.")}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-foreground transition-colors shrink-0" />
                </div>
              </div>

              {/* Waiting User Status */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                <CommunityAvatar
                  name={userName}
                  imageUrl={currentUser?.imageUrl}
                  size={20}
                />
                <span>{t('{{name}} is currently waiting', { name: userName })}</span>
              </div>
            </div>
          )}

          {/* 2. LIVE STAGE STATE */}
          {stageStatus === 'live' && (
            <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col justify-start space-y-6 animate-in fade-in-50 duration-200">
              {/* Screen Share on Stage if active */}
              {isAnyoneScreenSharing && activeScreenStream && (
                <div className="w-full aspect-video max-h-[380px] rounded-2xl overflow-hidden bg-card border border-border shadow-2xl relative mb-4">
                  <ScreenVideoView stream={activeScreenStream} className="w-full h-full" />
                </div>
              )}

              {/* Speakers Section */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Mic className="w-3.5 h-3.5 text-primary" />
                  <span>{t('Speakers — {{count}}', { count: speakers.length })}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
                  {speakers.map((speaker) => (
                    <div
                      key={speaker.id}
                      className={cn(
                        'aspect-[4/3] rounded-2xl bg-card hover:bg-muted/30 border transition-all p-4 flex flex-col items-center justify-center relative shadow-xs group overflow-hidden',
                        speaker.isCameraOn && speaker.isSpeaking
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-emerald-500/20'
                          : 'border-border',
                      )}
                    >
                      {/* Video Stream or Avatar */}
                      {speaker.isCameraOn && speaker.stream ? (
                        <div className="absolute inset-0 rounded-2xl overflow-hidden">
                          {speaker.isLocal ? (
                            <LocalVideoView stream={speaker.stream} />
                          ) : (
                            <RemoteVideoView stream={speaker.stream} isMuted={speaker.isMuted} />
                          )}
                        </div>
                      ) : (
                        <div className="relative">
                          <CommunityAvatar
                            name={speaker.name}
                            imageUrl={speaker.avatar}
                            size={64}
                            className={cn(
                              'shrink-0 rounded-full transition-all aspect-square',
                              speaker.isSpeaking
                                ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-card shadow-xs'
                                : 'ring-1 ring-border/40',
                            )}
                          />
                        </div>
                      )}

                      {/* Name Tag */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-background/80 backdrop-blur-sm border border-border/40 text-xs font-semibold text-foreground max-w-[80%] truncate z-10">
                        <span className="truncate">{speaker.name}</span>
                        {speaker.isMuted && <MicOff className="w-3 h-3 text-destructive shrink-0" />}
                      </div>

                      {/* Moderator Shield Badge */}
                      {speaker.isModerator && (
                        <div
                          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-background/80 border border-border/40 text-primary flex items-center justify-center shadow z-10"
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
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span>{t('Audience — {{count}}', { count: audience.length })}</span>
                </div>

                {audience.length > 0 ? (
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
                        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-[70px]">
                          {member.name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 py-3 px-4 rounded-xl bg-card border border-border text-xs text-muted-foreground">
                    <Users className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                    <span>{t('Belum ada audiens yang bergabung di panggung ini.')}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* BOTTOM CONTROL DOCK - Unified with Voice Channel (DRY)         */}
        {/* ───────────────────────────────────────────────────────────── */}
        {stageStatus === 'live' && (
        <div className={VOICE_BOTTOM_BAR_STYLES.CONTAINER}>
          {/* Left: Invite to Stage */}
          <div className="flex items-center justify-start">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(window.location.href);
                    }
                    toast.success(t('Link panggung disalin ke clipboard!'));
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
                    onClick={handleToggleMute}
                    className={cn(
                      VOICE_BOTTOM_BAR_STYLES.BUTTON_TOGGLE,
                      isMuted ? 'text-red-500 hover:bg-red-500/10' : 'text-foreground hover:bg-muted/60',
                    )}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-semibold">
                  {isMuted ? t('Nyalakan Mikrofon') : t('Bisukan Mikrofon')}
                </TooltipContent>
              </Tooltip>

              {/* Video Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleStageToggleVideo}
                    className={cn(
                      VOICE_BOTTOM_BAR_STYLES.BUTTON_TOGGLE,
                      isVideoOff ? 'text-red-500 hover:bg-red-500/10' : 'text-foreground hover:bg-muted/60',
                    )}
                  >
                    {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-semibold">
                  {!isVideoOff ? t('Matikan Kamera') : t('Nyalakan Kamera')}
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
                    onClick={handleToggleScreenShare}
                    className={cn(
                      VOICE_BOTTOM_BAR_STYLES.BUTTON_ICON,
                      'hidden md:flex',
                      isScreenSharing && 'text-primary bg-primary/20',
                    )}
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-semibold">
                  {isScreenSharing ? t('Hentikan Berbagi Layar') : t('Bagikan Layar')}
                </TooltipContent>
              </Tooltip>

              {/* Ambient Music Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={toggleMusic}
                    className={cn(
                      VOICE_BOTTOM_BAR_STYLES.BUTTON_ICON,
                      'hidden md:flex',
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
                        socket?.emit('COMMUNITY_STAGE_EVENT', {
                          channelId: channel.id,
                          action: 'STAGE_SPEAKER_DEMOTE',
                          userId: currentUser?.id,
                        });
                      } else {
                        handleToggleHandRaise();
                      }
                    }}
                    className={cn(VOICE_BOTTOM_BAR_STYLES.BUTTON_ICON, 'hidden sm:flex')}
                  >
                    {userRole === 'moderator' || userRole === 'speaker' ? (
                      <Users className="w-5 h-5" />
                    ) : (
                      <Hand className={cn('w-5 h-5', isHandRaised && 'text-amber-400')} />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-semibold">
                  {userRole === 'moderator' || userRole === 'speaker'
                    ? t('Leave the Stage')
                    : isHandRaised
                    ? t('Batal Angkat Tangan')
                    : t('Request to Speak')}
                </TooltipContent>
              </Tooltip>

              {/* More Options `...` */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(VOICE_BOTTOM_BAR_STYLES.BUTTON_ICON, 'relative')}
                    aria-label="Opsi Lainnya"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                    {(isScreenSharing || isMusicPlaying || isHandRaised) && (
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
                  {/* Mobile/Compact-Only Options: Leave Stage/Raise Hand, Screen Share, Ambient Music */}
                  <div className="md:hidden space-y-0.5">
                    {/* Leave Stage / Raise Hand (hidden on bar for < sm) */}
                    <div className="sm:hidden">
                      <DropdownMenuItem
                        onClick={() => {
                          if (userRole === 'speaker' || userRole === 'moderator') {
                            toast.info(t('Anda turun dari panggung ke audiens'));
                            setUserRole('audience');
                            socket?.emit('COMMUNITY_STAGE_EVENT', {
                              channelId: channel.id,
                              action: 'STAGE_SPEAKER_DEMOTE',
                              userId: currentUser?.id,
                            });
                          } else {
                            handleToggleHandRaise();
                          }
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer text-foreground hover:bg-accent hover:text-accent-foreground transition-colors group"
                      >
                        {userRole === 'moderator' || userRole === 'speaker' ? (
                          <>
                            <Users className="w-4 h-4 text-muted-foreground group-hover:text-accent-foreground shrink-0" />
                            <span>{t('Leave the Stage')}</span>
                          </>
                        ) : (
                          <>
                            <Hand className={cn('w-4 h-4 shrink-0', isHandRaised ? 'text-amber-400' : 'text-muted-foreground group-hover:text-accent-foreground')} />
                            <span>{isHandRaised ? t('Batal Angkat Tangan') : t('Request to Speak')}</span>
                          </>
                        )}
                      </DropdownMenuItem>
                    </div>

                    {/* Screen Share */}
                    <DropdownMenuItem
                      onClick={handleToggleScreenShare}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer text-foreground hover:bg-accent hover:text-accent-foreground transition-colors group"
                    >
                      <Share2
                        className={cn(
                          'w-4 h-4 shrink-0',
                          isScreenSharing ? 'text-primary' : 'text-muted-foreground group-hover:text-accent-foreground',
                        )}
                      />
                      <div className="flex items-center justify-between flex-1 min-w-0">
                        <span>{isScreenSharing ? t('Hentikan Berbagi Layar') : t('Bagikan Layar')}</span>
                        {isScreenSharing && (
                          <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">
                            {t('Aktif')}
                          </span>
                        )}
                      </div>
                    </DropdownMenuItem>

                    {/* Ambient Music */}
                    <DropdownMenuItem
                      onClick={toggleMusic}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer text-foreground hover:bg-accent hover:text-accent-foreground transition-colors group"
                    >
                      <Music
                        className={cn(
                          'w-4 h-4 shrink-0',
                          isMusicPlaying ? 'text-emerald-500' : 'text-muted-foreground group-hover:text-accent-foreground',
                        )}
                      />
                      <div className="flex items-center justify-between flex-1 min-w-0">
                        <span>{t('Musik Latar')}</span>
                        {isMusicPlaying && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded font-bold">
                            {t('Memutar')}
                          </span>
                        )}
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-border my-1" />
                  </div>

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
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* MODAL 1: START THE STAGE (MEDIUM DIALOG TEMPLATE)              */}
        {/* ───────────────────────────────────────────────────────────── */}
        <MediumDialog
          open={isStartStageModalOpen}
          onOpenChange={setIsStartStageModalOpen}
          title={t('What will you be talking about?')}
          description={t('Write a topic to start your Stage.')}
          icon={
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
              <Mic className="w-5 h-5" />
            </div>
          }
          confirmLabel={t('Start Stage')}
          cancelLabel={t('Batal')}
          onConfirm={handleStartStage}
        >
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <span>{t('Stage Topic')}</span> <span className="text-destructive">*</span>
              </label>
              <Input
                value={newTopicInput}
                onChange={(e) => setNewTopicInput(e.target.value)}
                placeholder={channel.topic || channel.description || `Topik #${channel.name}`}
                className="bg-card border-border text-foreground text-xs h-9 rounded-lg focus-visible:ring-primary"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="notify-everyone"
                checked={notifyEveryone}
                onCheckedChange={(c) => setNotifyEveryone(!!c)}
              />
              <label
                htmlFor="notify-everyone"
                className="text-xs text-foreground cursor-pointer font-medium select-none"
              >
                {t('Notify @everyone')}
              </label>
            </div>
          </div>
        </MediumDialog>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* MODAL 2: END STAGE CONFIRMATION (SMALL DIALOG TEMPLATE)        */}
        {/* ───────────────────────────────────────────────────────────── */}
        <SmallDialog
          open={isEndStageModalOpen}
          onOpenChange={setIsEndStageModalOpen}
          title={t('Do you want to also end the Stage?')}
          titleClassName="text-base font-bold text-foreground"
          description={t('A Stage with no speakers will automatically end after a few minutes.')}
          confirmLabel={t('Disconnect and End')}
          cancelLabel={t('No, just disconnect quietly')}
          variant="destructive"
          onConfirm={handleEndStage}
          onClose={() => {
            setIsEndStageModalOpen(false);
            onDisconnect?.();
          }}
        />

        {/* ───────────────────────────────────────────────────────────── */}
        {/* MODAL 3: CHANGE THE TOPIC (MEDIUM DIALOG TEMPLATE)             */}
        {/* ───────────────────────────────────────────────────────────── */}
        <MediumDialog
          open={isChangeTopicModalOpen}
          onOpenChange={setIsChangeTopicModalOpen}
          title={t('Change the topic')}
          description={t('Update the live discussion topic for all audience members.')}
          icon={
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
              <Podcast className="w-4 h-4" />
            </div>
          }
          confirmLabel={t('Simpan Topik')}
          cancelLabel={t('Batal')}
          onConfirm={handleSaveTopic}
        >
          <div className="space-y-1.5 py-1">
            <label className="text-xs font-semibold text-foreground block">
              {t('Topik Baru')}
            </label>
            <Input
              value={newTopicInput}
              onChange={(e) => setNewTopicInput(e.target.value)}
              placeholder={channel.topic || channel.description || `Topik #${channel.name}`}
              className="bg-card border-border text-foreground text-xs h-9 rounded-lg focus-visible:ring-primary"
              autoFocus
            />
          </div>
        </MediumDialog>

        {/* Continuous Audio Streams for Stage Participants */}
        {participants.map((p) => (
          <RemoteAudioView key={`stage-audio-${p.socketId}`} stream={p.stream} isMuted={!p.hasAudio} />
        ))}
      </div>
    </TooltipProvider>
  );
}
