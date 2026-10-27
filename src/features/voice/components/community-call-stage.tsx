import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import {
  Volume2,
  Play,
  MessageSquare,
  Menu,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { CommunityChannel, CommunityHub } from '@/chat/chat-types';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import { toast } from 'sonner';

import { DISCORD_APPS, DiscordAppDefinition } from '../data/discord-activities';
import type { CallParticipant } from '../types';
import { CallParticipantGrid } from './call-participant-grid';
import { CallControlsBar } from './call-controls-bar';
import { ActivityLauncherDialog } from './activity-launcher-dialog';
import { VoiceInviteDialog } from './voice-invite-dialog';
import { PiPCallStage } from './pip-call-stage';
import { ActivityFilmstrip } from './activity-filmstrip';
import { ActivityStage } from './activities/activity-stage';

export function YouTubeBadgeIcon({ className = 'w-5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
        fill="#FF0000"
      />
      <polygon fill="#FFFFFF" points="9.545,15.568 15.818,12 9.545,8.432" />
    </svg>
  );
}

export interface CommunityCallStageProps {
  channel: CommunityChannel;
  activeHub?: CommunityHub | null;
  currentUser: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    imageUrl?: string | null;
  } | null | undefined;
  isPlusOrAbove: boolean;
  socket: Socket | null;
  isCallActive: boolean;
  isPiP: boolean;
  initialAppId?: string | null;
  onToggleActivity?: (open?: boolean) => void;
  onTogglePiP: () => void;
  onEndCall: () => void;
  onNavigateToBilling?: () => void;
  onOpenMobileChannels?: () => void;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function CommunityCallStage({
  channel,
  activeHub,
  currentUser,
  isPlusOrAbove,
  socket,
  isCallActive,
  isPiP,
  initialAppId,
  onToggleActivity,
  onTogglePiP,
  onEndCall,
  onNavigateToBilling,
  onOpenMobileChannels,
}: CommunityCallStageProps) {
  // Local Media states
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSpeakingLocal, setIsSpeakingLocal] = useState(false);

  // Remote Peers & WebRTC connections
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const iceCandidateQueues = useRef<Record<string, RTCIceCandidateInit[]>>({});

  // Invite Modal state for sharing direct voice/video call link
  const [isInviteVoiceOpen, setIsInviteVoiceOpen] = useState(false);
  const [copiedVoiceCallLink, setCopiedVoiceCallLink] = useState(false);

  const hubId = activeHub?.id || channel.hubId || 'anticeil';
  const inviteCode = activeHub?.inviteCode || activeHub?.id || channel.hubId || '';
  const callInviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/messages?hub=${encodeURIComponent(hubId)}&channel=${encodeURIComponent(channel.id)}&invite=${encodeURIComponent(inviteCode)}`
    : '';

  // Upgrade modal state for Free Plan 2-person limit
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Activities & Games State
  const [isAppLauncherOpen, setIsAppLauncherOpen] = useState(false);
  const [activeAppId, setActiveAppId] = useState<string | null>(initialAppId || null);
  const [isFilmstripCollapsed, setIsFilmstripCollapsed] = useState(false);

  useEffect(() => {
    if (initialAppId) {
      setActiveAppId(initialAppId);
    }
  }, [initialAppId]);

  // Screen Sharing computed states
  const screenSharePeer = participants.find((p) => p.isScreenSharing);
  const isAnyoneScreenSharing = isScreenSharing || Boolean(screenSharePeer);
  const activeScreenStream = isScreenSharing ? screenStream : screenSharePeer?.stream || null;

  const handleLaunchApp = (appId: string) => {
    setActiveAppId(appId);
    setIsAppLauncherOpen(false);
    onToggleActivity?.(true);

    const app = DISCORD_APPS.find((a) => a.id === appId);
    socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId: channel.id,
      action: 'ACTIVITY_LAUNCH',
      payload: { appId, appName: app?.title || appId },
    });
    toast.success(`Aktivitas ${app?.title || appId} diluncurkan di panggung panggilan!`);
  };

  const handleStopActivity = () => {
    setActiveAppId(null);
    onToggleActivity?.(false);
    socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId: channel.id,
      action: 'ACTIVITY_STOP',
      payload: {},
    });
    toast.info('Aktivitas dihentikan, kembali ke tampilan kamera utama.');
  };

  // Audio meters for voice speaking detection
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const [fallbackUserId] = useState(() => `u_${Math.random().toString(36).slice(2, 9)}`);
  const currentUserId = currentUser?.id || fallbackUserId;
  const currentUserName =
    `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() ||
    currentUser?.email?.split('@')[0] ||
    'Pengguna Anticeil';

  // 1. Initialize Local Media
  const startLocalMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      setLocalStream(stream);
      setIsVideoOff(true);

      // Speaking detector
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyserRef.current = analyser;
        analyser.fftSize = 256;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkVolume = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          setIsSpeakingLocal(avg > 18);
          requestAnimationFrame(checkVolume);
        };
        requestAnimationFrame(checkVolume);
      } catch (audioErr) {
        console.warn('Audio analyser setup failed:', audioErr);
      }

      return stream;
    } catch (err: any) {
      console.warn('Could not acquire audio stream:', err);
      toast.error('Tidak dapat mengakses mikrofon. Pastikan izin mikrofon browser diizinkan.');
      return null;
    }
  }, []);

  // 2. WebRTC Peer Connection Factory
  const createPeerConnection = (
    targetSocketId: string,
    peerInfo: CallParticipant,
    isInitiator: boolean,
    currentLocalStream: MediaStream | null,
  ): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current[targetSocketId] = pc;

    if (currentLocalStream) {
      currentLocalStream.getTracks().forEach((track) => {
        if (track.kind === 'video' && isScreenSharing && screenStream && screenStream.getVideoTracks()[0]) {
          pc.addTrack(screenStream.getVideoTracks()[0], screenStream);
        } else {
          pc.addTrack(track, currentLocalStream);
        }
      });
      if (isScreenSharing && screenStream && screenStream.getVideoTracks()[0] && !currentLocalStream.getVideoTracks().length) {
        pc.addTrack(screenStream.getVideoTracks()[0], screenStream);
      }
    } else if (isScreenSharing && screenStream) {
      screenStream.getTracks().forEach((track) => {
        pc.addTrack(track, screenStream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('COMMUNITY_CALL_SIGNAL', {
          channelId: channel.id,
          targetSocketId,
          signal: { candidate: event.candidate },
        });
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.socketId === targetSocketId) {
            return { ...p, stream: remoteStream };
          }
          return p;
        }),
      );
    };

    pc.onnegotiationneeded = async () => {
      if (!isInitiator) return;
      try {
        if (pc.signalingState !== 'stable') return;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket?.emit('COMMUNITY_CALL_SIGNAL', {
          channelId: channel.id,
          targetSocketId,
          signal: offer,
        });
      } catch (err) {
        console.error('Failed to negotiate peer connection', err);
      }
    };

    if (isInitiator) {
      setTimeout(async () => {
        try {
          if (pc.signalingState === 'stable') {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket?.emit('COMMUNITY_CALL_SIGNAL', {
              channelId: channel.id,
              targetSocketId,
              signal: offer,
            });
          }
        } catch (e) {
          console.warn('Failed to send initial offer:', e);
        }
      }, 50);
    }

    return pc;
  };

  // 3. Join / Leave Call Lifecycle & Socket Listeners
  useEffect(() => {
    if (!isCallActive || !channel.id || !socket) return;

    let localMediaStream: MediaStream | null = null;

    const joinRoom = (stream: MediaStream | null) => {
      localMediaStream = stream;
      const initialHasVideo = !isVideoOff && Boolean(stream?.getVideoTracks().length);
      const initialHasAudio = !isMuted;
      socket.emit(
        'COMMUNITY_CALL_JOIN',
        {
          channelId: channel.id,
          user: {
            id: currentUserId,
            name: currentUserName,
            avatar: currentUser?.imageUrl,
          },
          hasVideo: initialHasVideo,
          hasAudio: initialHasAudio,
          isScreenSharing: false,
          mediaState: {
            hasVideo: initialHasVideo,
            hasAudio: initialHasAudio,
            isScreenSharing: false,
          },
          plan: isPlusOrAbove ? 'plus' : 'free',
        },
        (res: any) => {
          if (res?.success && Array.isArray(res.participants)) {
            res.participants.forEach((existingPeer: any) => {
              setParticipants((prev) => {
                if (prev.some((p) => p.socketId === existingPeer.socketId)) return prev;
                const newPeer: CallParticipant = {
                  socketId: existingPeer.socketId,
                  userId: existingPeer.userId,
                  userName: existingPeer.userName,
                  userAvatar: existingPeer.userAvatar,
                  hasVideo: existingPeer.mediaState?.hasVideo ?? existingPeer.hasVideo ?? true,
                  hasAudio: existingPeer.mediaState?.hasAudio ?? existingPeer.hasAudio ?? true,
                  isScreenSharing: existingPeer.mediaState?.isScreenSharing ?? existingPeer.isScreenSharing ?? false,
                };
                createPeerConnection(existingPeer.socketId, newPeer, true, localMediaStream);
                return [...prev, newPeer];
              });
            });
          }
        },
      );
    };

    startLocalMedia().then((stream) => {
      if (!socket.connected) {
        socket.connect();
        socket.once('connect', () => {
          joinRoom(stream);
        });
      } else {
        joinRoom(stream);
      }
    });

    const handleUserJoined = (data: {
      socketId: string;
      userId: string;
      userName: string;
      userAvatar?: string;
      mediaState?: { hasVideo?: boolean; hasAudio?: boolean; isScreenSharing?: boolean };
      hasVideo?: boolean;
      hasAudio?: boolean;
      isScreenSharing?: boolean;
      roomSize?: number;
    }) => {
      const roomSize = data.roomSize || 2;
      if (!isPlusOrAbove && roomSize > 2) {
        setIsUpgradeModalOpen(true);
      }

      const hasVideo = data.mediaState?.hasVideo ?? data.hasVideo ?? true;
      const hasAudio = data.mediaState?.hasAudio ?? data.hasAudio ?? true;
      const isScreenSharing = data.mediaState?.isScreenSharing ?? data.isScreenSharing ?? false;

      setParticipants((prev) => {
        if (prev.some((p) => p.socketId === data.socketId)) return prev;
        const newPeer: CallParticipant = {
          socketId: data.socketId,
          userId: data.userId,
          userName: data.userName,
          userAvatar: data.userAvatar,
          hasVideo,
          hasAudio,
          isScreenSharing,
        };
        createPeerConnection(data.socketId, newPeer, false, localMediaStream);
        return [...prev, newPeer];
      });

      toast.info(`${data.userName} bergabung dalam panggilan.`);
    };

    const handleUserLeft = (data: { socketId: string; userId?: string }) => {
      setParticipants((prev) => {
        const leaving = prev.find((p) => p.socketId === data.socketId);
        if (leaving) {
          toast.info(`${leaving.userName} keluar dari panggilan.`);
        }
        return prev.filter((p) => p.socketId !== data.socketId);
      });
      if (peerConnections.current[data.socketId]) {
        peerConnections.current[data.socketId].close();
        delete peerConnections.current[data.socketId];
      }
      delete iceCandidateQueues.current[data.socketId];
    };

    const handleSignal = async (data: {
      fromSocketId: string;
      fromUserId?: string;
      signal: any;
    }) => {
      let pc = peerConnections.current[data.fromSocketId];
      if (!pc) {
        const dummyPeer: CallParticipant = {
          socketId: data.fromSocketId,
          userId: data.fromUserId || 'unknown',
          userName: 'Rekan Panggilan',
          hasVideo: true,
          hasAudio: true,
        };
        pc = createPeerConnection(data.fromSocketId, dummyPeer, false, localMediaStream);
      }

      if (data.signal?.type === 'offer') {
        if (pc.signalingState !== 'stable') {
          try {
            await pc.setLocalDescription({ type: 'rollback' });
          } catch (e) {
            console.warn('Rollback failed:', e);
          }
        }
        await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
        if (iceCandidateQueues.current[data.fromSocketId]) {
          for (const cand of iceCandidateQueues.current[data.fromSocketId]) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (e) {}
          }
          delete iceCandidateQueues.current[data.fromSocketId];
        }
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('COMMUNITY_CALL_SIGNAL', {
          channelId: channel.id,
          targetSocketId: data.fromSocketId,
          signal: answer,
        });
      } else if (data.signal?.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
        if (iceCandidateQueues.current[data.fromSocketId]) {
          for (const cand of iceCandidateQueues.current[data.fromSocketId]) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (e) {}
          }
          delete iceCandidateQueues.current[data.fromSocketId];
        }
      } else if (data.signal?.candidate) {
        if (!pc.remoteDescription) {
          if (!iceCandidateQueues.current[data.fromSocketId]) {
            iceCandidateQueues.current[data.fromSocketId] = [];
          }
          iceCandidateQueues.current[data.fromSocketId].push(data.signal.candidate);
        } else {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
          } catch (e) {
            console.warn('ICE candidate addition failed:', e);
          }
        }
      }
    };

    const handlePeerMediaUpdated = (data: {
      socketId: string;
      hasVideo?: boolean;
      hasAudio?: boolean;
      isScreenSharing?: boolean;
      isSpeaking?: boolean;
    }) => {
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.socketId !== data.socketId) return p;
          return {
            ...p,
            hasVideo: data.hasVideo !== undefined ? data.hasVideo : p.hasVideo,
            hasAudio: data.hasAudio !== undefined ? data.hasAudio : p.hasAudio,
            isScreenSharing: data.isScreenSharing !== undefined ? data.isScreenSharing : p.isScreenSharing,
          };
        }),
      );
    };

    socket.on('COMMUNITY_CALL_USER_JOINED', handleUserJoined);
    socket.on('COMMUNITY_CALL_USER_LEFT', handleUserLeft);
    socket.on('COMMUNITY_CALL_SIGNAL', handleSignal);
    socket.on('COMMUNITY_CALL_PEER_MEDIA_UPDATED', handlePeerMediaUpdated);

    return () => {
      socket.off('COMMUNITY_CALL_USER_JOINED', handleUserJoined);
      socket.off('COMMUNITY_CALL_USER_LEFT', handleUserLeft);
      socket.off('COMMUNITY_CALL_SIGNAL', handleSignal);
      socket.off('COMMUNITY_CALL_PEER_MEDIA_UPDATED', handlePeerMediaUpdated);

      socket.emit('COMMUNITY_CALL_LEAVE', { channelId: channel.id });
      for (const id in peerConnections.current) {
        peerConnections.current[id].close();
      }
      peerConnections.current = {};

      if (localMediaStream) {
        localMediaStream.getTracks().forEach((track) => track.stop());
      }
      setLocalStream(null);
    };
  }, [isCallActive, channel.id, socket, isPlusOrAbove]);

  // 4. Media Control Actions
  const handleToggleMute = () => {
    if (!localStream) return;
    const next = !isMuted;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
    setIsMuted(next);
    socket?.emit('COMMUNITY_CALL_TOGGLE_MEDIA', {
      channelId: channel.id,
      hasAudio: !next,
    });
  };

  const handleToggleVideo = async () => {
    if (!localStream) {
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        setLocalStream(camStream);
        setIsVideoOff(false);
        socket?.emit('COMMUNITY_CALL_TOGGLE_MEDIA', {
          channelId: channel.id,
          hasVideo: true,
        });
        toast.success('Kamera diaktifkan');
      } catch (err) {
        toast.error('Tidak dapat mengakses kamera. Pastikan izin kamera aktif.');
      }
      return;
    }

    const next = !isVideoOff;
    const videoTracks = localStream.getVideoTracks();

    if (next) {
      videoTracks.forEach((track) => {
        track.stop();
        localStream.removeTrack(track);
      });

      for (const sId in peerConnections.current) {
        const pc = peerConnections.current[sId];
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(null).catch(() => {});
        }
      }

      setIsVideoOff(true);
      socket?.emit('COMMUNITY_CALL_TOGGLE_MEDIA', {
        channelId: channel.id,
        hasVideo: false,
      });
      toast.info('Kamera dinonaktifkan');
      return;
    }

    try {
      const camStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
      });
      const newTrack = camStream.getVideoTracks()[0];
      if (newTrack) {
        localStream.addTrack(newTrack);
        for (const sId in peerConnections.current) {
          const pc = peerConnections.current[sId];
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(newTrack).catch(() => {});
          } else {
            pc.addTrack(newTrack, localStream);
            if (pc.signalingState === 'stable') {
              pc.createOffer().then((offer) => {
                pc.setLocalDescription(offer);
                socket?.emit('COMMUNITY_CALL_SIGNAL', {
                  channelId: channel.id,
                  targetSocketId: sId,
                  signal: offer,
                });
              }).catch(() => {});
            }
          }
        }
        setIsVideoOff(false);
        socket?.emit('COMMUNITY_CALL_TOGGLE_MEDIA', {
          channelId: channel.id,
          hasVideo: true,
        });
        toast.success('Kamera diaktifkan');
      }
    } catch (err) {
      toast.error('Tidak dapat mengakses kamera. Pastikan izin kamera aktif.');
    }
  };

  const handleCopyCallLink = () => {
    setIsInviteVoiceOpen(true);
  };

  const handleExecuteCopyCallLink = () => {
    if (callInviteUrl) {
      navigator.clipboard.writeText(callInviteUrl);
      setCopiedVoiceCallLink(true);
      toast.success('Link panggilan berhasil disalin! Siap dibagikan ke teman.');
      setTimeout(() => setCopiedVoiceCallLink(false), 2500);
    }
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);

      const camTrack = (!isVideoOff && localStream) ? localStream.getVideoTracks()[0] : null;
      for (const sId in peerConnections.current) {
        const pc = peerConnections.current[sId];
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          try {
            await sender.replaceTrack(camTrack || null);
          } catch (e) {
            console.warn('Failed to revert track to camera', e);
          }
        }
      }

      socket?.emit('COMMUNITY_CALL_TOGGLE_MEDIA', {
        channelId: channel.id,
        isScreenSharing: false,
      });
      toast.info('Berbagi layar dihentikan');
      return;
    }

    try {
      let displayStream: MediaStream;
      try {
        displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
          } as any,
          audio: true,
        });
      } catch (audioErr: any) {
        if (audioErr?.name === 'NotAllowedError' || audioErr?.name === 'AbortError') {
          throw audioErr;
        }
        displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
      }

      setScreenStream(displayStream);
      setIsScreenSharing(true);

      const screenTrack = displayStream.getVideoTracks()[0];
      if (!screenTrack) {
        throw new Error('Tidak ada trek video ditemukan pada layar');
      }

      for (const sId in peerConnections.current) {
        const pc = peerConnections.current[sId];
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          try {
            await sender.replaceTrack(screenTrack);
          } catch (e) {
            console.warn('replaceTrack failed, adding track directly', e);
          }
        } else {
          try {
            pc.addTrack(screenTrack, displayStream);
            if (pc.signalingState === 'stable') {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socket?.emit('COMMUNITY_CALL_SIGNAL', {
                channelId: channel.id,
                targetSocketId: sId,
                signal: offer,
              });
            }
          } catch (negErr) {
            console.warn('Renegotiation failed on screen share addTrack', negErr);
          }
        }
      }

      screenTrack.onended = () => {
        setIsScreenSharing(false);
        setScreenStream(null);
        const camTrack = (!isVideoOff && localStream) ? localStream.getVideoTracks()[0] : null;
        for (const sId in peerConnections.current) {
          const pc = peerConnections.current[sId];
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(camTrack || null).catch(() => {});
          }
        }
        socket?.emit('COMMUNITY_CALL_TOGGLE_MEDIA', {
          channelId: channel.id,
          isScreenSharing: false,
        });
        toast.info('Berbagi layar dihentikan');
      };

      socket?.emit('COMMUNITY_CALL_TOGGLE_MEDIA', {
        channelId: channel.id,
        isScreenSharing: true,
      });
      toast.success('Berbagi layar aktif');
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.name === 'AbortError' || err?.message?.includes('Permission denied')) {
        toast.info('Berbagi layar dibatalkan');
      } else {
        console.warn('Screen share error', err);
        toast.error('Gagal berbagi layar: ' + (err?.message || 'Izin ditolak atau tidak didukung'));
      }
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Total active count including local
  const totalInCall = participants.length + 1;

  const currentActiveApp = useMemo(() => {
    return DISCORD_APPS.find((app) => app.id === activeAppId);
  }, [activeAppId]);

  // Activity Socket Sync Events
  useEffect(() => {
    if (!socket) return;
    const handleActivityEvent = (data: {
      fromSocketId: string;
      channelId?: string;
      fromUserId?: string;
      action: string;
      payload: any;
    }) => {
      if (!data) return;
      if (data.channelId && data.channelId !== channel.id) return;
      if (data.action === 'ACTIVITY_LAUNCH' || data.action === 'START_ACTIVITY') {
        const { appId, appName } = data.payload || {};
        if (appId) {
          setActiveAppId(appId);
          setIsAppLauncherOpen(false);
          onToggleActivity?.(true);
          toast.info(`${appName || appId} aktif di panggung panggilan! 🚀`);
        }
      } else if (data.action === 'ACTIVITY_STOP') {
        setActiveAppId(null);
        onToggleActivity?.(false);
        toast.info('Aktivitas dihentikan');
      } else if (data.action === 'ACTIVITY_QUERY') {
        if (activeAppId) {
          socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
            channelId: channel.id,
            action: 'ACTIVITY_LAUNCH',
            payload: { appId: activeAppId, appName: currentActiveApp?.title || activeAppId },
          });
        }
      }
    };

    socket.on('COMMUNITY_CALL_ACTIVITY_EVENT', handleActivityEvent);

    // Query active activity when entering channel
    socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId: channel.id,
      action: 'ACTIVITY_QUERY',
    });

    return () => {
      socket.off('COMMUNITY_CALL_ACTIVITY_EVENT', handleActivityEvent);
    };
  }, [socket, channel.id, onToggleActivity, activeAppId, currentActiveApp?.title]);

  // Sync active activity to peers when peer count changes
  useEffect(() => {
    if (activeAppId && socket && participants.length > 0) {
      socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
        channelId: channel.id,
        action: 'ACTIVITY_LAUNCH',
        payload: { appId: activeAppId, appName: currentActiveApp?.title || activeAppId },
      });
    }
  }, [activeAppId, participants.length, socket, channel.id, currentActiveApp?.title]);

  if (!isCallActive) return null;

  // Render Floating Picture-in-Picture Mini Stage
  if (isPiP) {
    return (
      <PiPCallStage
        channel={channel}
        totalInCall={totalInCall}
        activeAppId={activeAppId}
        currentActiveApp={currentActiveApp}
        isScreenSharing={isScreenSharing}
        screenStream={screenStream}
        screenSharePeer={screenSharePeer}
        isVideoOff={isVideoOff}
        localStream={localStream}
        currentUserName={currentUserName}
        currentUser={currentUser}
        isSpeakingLocal={isSpeakingLocal}
        isMuted={isMuted}
        participants={participants}
        onTogglePiP={onTogglePiP}
        onEndCall={onEndCall}
        handleToggleMute={handleToggleMute}
        handleToggleVideo={handleToggleVideo}
      />
    );
  }

  // Render Full Discord Stage View
  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col bg-background text-foreground select-none relative overflow-hidden group/stage">
      {/* Discord Top Stage App Bar */}
      <div className={cn('h-12 w-full flex items-center justify-between bg-background select-none shrink-0 z-20', CHANNEL_HORIZONTAL_PADDING)}>
        <div className="flex items-center gap-2 min-w-0">
          {/* Burger Menu Button (Visible on Mobile/Tablet: md:hidden) */}
          {onOpenMobileChannels && (
            <button
              type="button"
              onClick={onOpenMobileChannels}
              className="md:hidden h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mr-0.5 cursor-pointer shrink-0"
              title="Buka Menu Sidebar"
              aria-label="Buka Menu Sidebar"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
          )}
          <Volume2 className="w-5 h-5 text-muted-foreground shrink-0" />
          <span className="text-sm font-bold text-foreground truncate max-w-[140px] sm:max-w-[200px]">
            {channel.name}
          </span>
          {activeAppId !== null && currentActiveApp && (
            <>
              <span className="text-muted-foreground text-xs select-none">·</span>
              <div className="flex items-center gap-1.5 min-w-0">
                {activeAppId === 'watch-together' ? (
                  <YouTubeBadgeIcon className="w-5 h-3.5 shrink-0" />
                ) : (
                  <div className={cn('w-4 h-4 rounded flex items-center justify-center text-white shrink-0', currentActiveApp.iconBg)}>
                    <currentActiveApp.icon className="w-2.5 h-2.5" />
                  </div>
                )}
                <span className="text-sm font-bold text-foreground truncate max-w-[180px]">
                  {currentActiveApp.title}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center -space-x-1.5 overflow-hidden">
            {participants.slice(0, 3).map((p) => (
              <div key={p.socketId} title={p.userName} className="ring-2 ring-background rounded-full overflow-hidden">
                <CommunityAvatar
                  name={p.userName}
                  imageUrl={p.userAvatar}
                  size={24}
                  showStatus={false}
                />
              </div>
            ))}
            <div title={`${currentUserName} (Anda)`} className="ring-2 ring-background rounded-full overflow-hidden">
              <CommunityAvatar
                name={currentUserName}
                imageUrl={currentUser?.imageUrl}
                email={currentUser?.email}
                size={24}
                showStatus={false}
              />
            </div>
          </div>

          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    if (onToggleActivity) {
                      onToggleActivity();
                    } else {
                      toast.info('Obrolan teks suara');
                    }
                  }}
                  className="p-1.5 rounded-lg text-[#949ba4] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs font-semibold">
                Buka Obrolan Suara
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Main Call Stage Content */}
      {activeAppId !== null && currentActiveApp ? (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-background relative w-full h-full">
          <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden relative">
            <ActivityStage
              activeAppId={activeAppId}
              currentActiveApp={currentActiveApp}
              channel={channel}
              currentUserName={currentUserName}
              currentUser={currentUser}
              participants={participants}
              totalInCall={totalInCall}
              socket={socket}
              onStopActivity={handleStopActivity}
            />
          </div>

          <ActivityFilmstrip
            isFilmstripCollapsed={isFilmstripCollapsed}
            onToggleFilmstrip={() => setIsFilmstripCollapsed(!isFilmstripCollapsed)}
            totalInCall={totalInCall}
            isVideoOff={isVideoOff}
            localStream={localStream}
            currentUserName={currentUserName}
            currentUser={currentUser}
            isSpeakingLocal={isSpeakingLocal}
            isMuted={isMuted}
            participants={participants}
            isScreenSharing={isScreenSharing}
            screenStream={screenStream}
            onCopyCallLink={handleCopyCallLink}
          />
        </div>
      ) : (
        <CallParticipantGrid
          isAnyoneScreenSharing={isAnyoneScreenSharing}
          activeScreenStream={activeScreenStream}
          isScreenSharing={isScreenSharing}
          screenSharePeer={screenSharePeer}
          handleToggleScreenShare={handleToggleScreenShare}
          isVideoOff={isVideoOff}
          localStream={localStream}
          currentUserName={currentUserName}
          currentUser={currentUser}
          isSpeakingLocal={isSpeakingLocal}
          isMuted={isMuted}
          participants={participants}
          setIsInviteVoiceOpen={setIsInviteVoiceOpen}
          setIsAppLauncherOpen={setIsAppLauncherOpen}
        />
      )}

      {/* Discord Bottom Control Dock */}
      <CallControlsBar
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={isScreenSharing}
        activeAppId={activeAppId}
        currentActiveApp={currentActiveApp}
        onToggleMute={handleToggleMute}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onOpenInvite={() => setIsInviteVoiceOpen(true)}
        onOpenAppLauncher={() => setIsAppLauncherOpen(true)}
        onCopyCallLink={handleCopyCallLink}
        onEndCall={onEndCall}
        onTogglePiP={onTogglePiP}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* Discord-Style Activities Launcher Modal */}
      <ActivityLauncherDialog
        open={isAppLauncherOpen}
        onOpenChange={setIsAppLauncherOpen}
        activeAppId={activeAppId}
        currentActiveApp={currentActiveApp}
        onLaunchApp={handleLaunchApp}
        onStopActivity={handleStopActivity}
        isUpgradeModalOpen={isUpgradeModalOpen}
        setIsUpgradeModalOpen={setIsUpgradeModalOpen}
        onNavigateToBilling={onNavigateToBilling}
      />

      {/* Discord-Style Voice/Video Call Invite Modal */}
      <VoiceInviteDialog
        open={isInviteVoiceOpen}
        onOpenChange={setIsInviteVoiceOpen}
        channel={channel}
        activeHub={activeHub}
        callInviteUrl={callInviteUrl}
        copiedVoiceCallLink={copiedVoiceCallLink}
        onCopyCallLink={handleExecuteCopyCallLink}
      />
    </div>
  );
}
