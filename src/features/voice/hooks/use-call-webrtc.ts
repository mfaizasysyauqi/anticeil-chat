import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { Bot } from 'lucide-react';
import { toast } from 'sonner';
import { useCallMediaToggles } from './use-call-media-toggles';
import { useCallActivitySync } from './use-call-activity-sync';
import { DISCORD_APPS, DiscordAppDefinition } from '../data/voice-activities';
import { loadVoiceSettings } from './use-voice-settings';
import { channelWatchStateCache } from '../components/activities/hooks/use-youtube-player';
import type { CallParticipant } from '../types';
import type { ColonyChannel, Colony } from '@/chat/chat-types';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export interface UseCallWebRTCOptions {
  channel: ColonyChannel;
  activeColony?: Colony | null;
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
  initialAppId?: string | null;
  onToggleActivity?: (open?: boolean) => void;
  onActivityChange?: (appId: string | null) => void;
}

export function useCallWebRTC({
  channel,
  activeColony,
  currentUser,
  isPlusOrAbove,
  socket,
  isCallActive,
  initialAppId,
  onToggleActivity,
  onActivityChange,
}: UseCallWebRTCOptions) {
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

  const colonyId = activeColony?.id || channel.colonyId || 'anticeil';
  const inviteCode = activeColony?.inviteCode || activeColony?.id || channel.colonyId || '';

  // Upgrade modal state for Free Plan 2-person limit
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Activities & Games State
  const [activeAppId, setActiveAppId] = useState<string | null>(initialAppId || null);
  const activeAppIdRef = useRef<string | null>(activeAppId);
  activeAppIdRef.current = activeAppId;

  // Dynamically generate invite URL (specific canonical channel route)
  const callInviteUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const base = `${window.location.origin}/channels/${encodeURIComponent(colonyId)}/${encodeURIComponent(channel.id)}?invite=${encodeURIComponent(inviteCode)}`;
    return activeAppId ? `${base}&activity=${encodeURIComponent(activeAppId)}` : base;
  }, [colonyId, channel.id, inviteCode, activeAppId]);

  useEffect(() => {
    setActiveAppId(initialAppId || null);
    if (initialAppId) {
      onToggleActivity?.(true);
      onActivityChange?.(initialAppId);
    }
  }, [initialAppId, onToggleActivity, onActivityChange]);

  // Screen Sharing computed states
  const screenSharePeer = participants.find((p) => p.isScreenSharing);
  const isAnyoneScreenSharing = isScreenSharing || Boolean(screenSharePeer);
  const activeScreenStream = isScreenSharing ? screenStream : screenSharePeer?.stream || null;

  const currentActiveApp = useMemo(() => {
    if (!activeAppId) return null;
    const targetId = activeAppId === 'youtube' ? 'watch-together' : activeAppId;
    const standardApp = DISCORD_APPS.find((app) => app.id === targetId);
    if (standardApp) return standardApp;

    const colonyApp = activeColony?.installedApps?.find((a) => a.id === activeAppId);
    if (colonyApp) {
      return {
        id: colonyApp.id,
        title: colonyApp.name,
        bannerTitle: colonyApp.name.toUpperCase(),
        developer: 'Colony Bot',
        category: 'game' as const,
        bannerGradient: 'from-blue-600 via-indigo-700 to-zinc-950',
        iconBg: 'bg-primary',
        iconColor: 'text-white',
        icon: Bot,
        tagline: 'Aplikasi terpasang di Colony',
        description: `Aplikasi internal terpasang di koloni ${activeColony?.name || ''}`,
        accentColor: '#3b82f6',
      };
    }
    return null;
  }, [activeAppId, activeColony?.installedApps, activeColony?.name]);
  const currentActiveAppRef = useRef(currentActiveApp);
  currentActiveAppRef.current = currentActiveApp;

  const handleLaunchApp = (appId: string) => {
    // If switching to a new activity, explicitly auto-stop the old activity first
    if (activeAppId && activeAppId !== appId) {
      socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
        channelId: channel.id,
        action: 'ACTIVITY_STOP',
        payload: { previousAppId: activeAppId },
      });
      channelWatchStateCache.delete(channel.id);
    }

    setActiveAppId(appId);
    onToggleActivity?.(true);
    onActivityChange?.(appId);

    const app = DISCORD_APPS.find((a) => a.id === appId);
    socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId: channel.id,
      action: 'ACTIVITY_LAUNCH',
      payload: { appId, appName: app?.title || appId },
    });
    toast.success(`Aktivitas ${app?.title || appId} diluncurkan di panggung panggilan!`);
  };

  const handleStopActivity = () => {
    channelWatchStateCache.delete(channel.id);
    setActiveAppId(null);
    onToggleActivity?.(false);
    onActivityChange?.(null);
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

  // 1. Initialize Local Media (only acquire audio for voice channels, never force mic on text channels)
  const startLocalMedia = useCallback(async () => {
    if (channel.type !== 'voice' && channel.type !== 'stage') {
      return null;
    }
    try {
      const voiceSettings = loadVoiceSettings();
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: voiceSettings.echoCancellation,
        noiseSuppression: voiceSettings.noiseSuppression !== 'none',
        autoGainControl: true,
      };
      if (
        voiceSettings.inputDeviceId &&
        voiceSettings.inputDeviceId !== 'default' &&
        !voiceSettings.inputDeviceId.startsWith('hw-')
      ) {
        audioConstraints.deviceId = { exact: voiceSettings.inputDeviceId };
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: audioConstraints,
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
      return null;
    }
  }, [channel.type]);

  // 2. WebRTC Peer Connection Factory
  const createPeerConnection = (
    targetSocketId: string,
    peerInfo: CallParticipant,
    isInitiator: boolean,
    currentLocalStream: MediaStream | null,
  ): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current[targetSocketId] = pc;

    let isMakingOffer = false;
    const sendOffer = async () => {
      if (!isInitiator) return;
      try {
        if (pc.signalingState !== 'stable' || isMakingOffer) return;
        isMakingOffer = true;
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);
        socket?.emit('COMMUNITY_CALL_SIGNAL', {
          channelId: channel.id,
          targetSocketId,
          signal: offer,
        });
      } catch (err) {
        console.error('Failed to negotiate peer connection', err);
      } finally {
        isMakingOffer = false;
      }
    };

    pc.onnegotiationneeded = sendOffer;

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

    if (isInitiator) {
      setTimeout(() => {
        sendOffer();
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
                if (
                  prev.some((p) => p.socketId === existingPeer.socketId) ||
                  existingPeer.socketId === socket?.id ||
                  existingPeer.userId === currentUserId ||
                  (existingPeer.userName && existingPeer.userName.toLowerCase() === currentUserName.toLowerCase())
                ) {
                  return prev;
                }
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
          socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
            channelId: channel.id,
            action: 'ACTIVITY_QUERY',
          });
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
        if (
          prev.some((p) => p.socketId === data.socketId) ||
          data.socketId === socket?.id ||
          data.userId === currentUserId ||
          (data.userName && data.userName.toLowerCase() === currentUserName.toLowerCase())
        ) {
          return prev;
        }
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

      if (activeAppIdRef.current) {
        socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
          channelId: channel.id,
          action: 'ACTIVITY_LAUNCH',
          payload: { appId: activeAppIdRef.current },
        });
      }

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
  const {
    handleToggleMute,
    handleToggleVideo,
    handleToggleScreenShare,
  } = useCallMediaToggles({
    localStream,
    setLocalStream,
    screenStream,
    setScreenStream,
    isMuted,
    setIsMuted,
    isVideoOff,
    setIsVideoOff,
    isScreenSharing,
    setIsScreenSharing,
    peerConnections,
    channel,
    socket,
  });

  // Activity Socket Sync Events
  useCallActivitySync({
    socket,
    channelId: channel.id,
    activeAppIdRef,
    currentActiveAppRef,
    setActiveAppId,
    onToggleActivity,
    onActivityChange,
    currentUserId: currentUser?.id,
    participantsCount: participants.length,
  });

  const totalInCall = participants.length + 1;

  return {
    localStream,
    screenStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isSpeakingLocal,
    participants,
    currentUserName,
    totalInCall,
    activeAppId,
    currentActiveApp,
    isAnyoneScreenSharing,
    screenSharePeer,
    activeScreenStream,
    callInviteUrl,
    isUpgradeModalOpen,
    setIsUpgradeModalOpen,
    handleToggleMute,
    handleToggleVideo,
    handleToggleScreenShare,
    handleLaunchApp,
    handleStopActivity,
  };
}
