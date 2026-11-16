import React from 'react';
import { Socket } from 'socket.io-client';
import { toast } from 'sonner';
import type { ColonyChannel } from '@/chat/chat-types';

export interface UseCallMediaTogglesProps {
  localStream: MediaStream | null;
  setLocalStream: React.Dispatch<React.SetStateAction<MediaStream | null>>;
  screenStream: MediaStream | null;
  setScreenStream: React.Dispatch<React.SetStateAction<MediaStream | null>>;
  isMuted: boolean;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  isVideoOff: boolean;
  setIsVideoOff: React.Dispatch<React.SetStateAction<boolean>>;
  isScreenSharing: boolean;
  setIsScreenSharing: React.Dispatch<React.SetStateAction<boolean>>;
  peerConnections: React.MutableRefObject<Record<string, RTCPeerConnection>>;
  channel: ColonyChannel;
  socket: Socket | null;
}

export function useCallMediaToggles({
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
}: UseCallMediaTogglesProps) {
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

  return {
    handleToggleMute,
    handleToggleVideo,
    handleToggleScreenShare,
  };
}
