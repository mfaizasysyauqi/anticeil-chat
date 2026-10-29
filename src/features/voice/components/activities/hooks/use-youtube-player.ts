import { useState, useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { toast } from 'sonner';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface YouTubeVideoItem {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  views?: string;
  uploadedAt?: string;
  addedBy?: string;
}

export interface ChannelWatchStateCache {
  videoId: string | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playlist?: YouTubeVideoItem[];
  hostUserId?: string;
  hostUserName?: string;
  hostUserAvatar?: string | null;
  allowEveryoneEdit?: boolean;
}

// Module-level in-memory cache to preserve video playback and state
// seamlessly when minimizing to PiP or restoring to full stage.
export const channelWatchStateCache = new Map<string, ChannelWatchStateCache>();

export interface UseYouTubePlayerOptions {
  channelId: string;
  activeVideoId: string | null;
  canEdit: boolean;
  isMeHost: boolean;
  socket: Socket | null;
  currentUser?: any;
  onVideoEnded?: () => void;
  getUnmountSnapshot?: () => {
    playlist?: YouTubeVideoItem[];
    hostUserId?: string;
    hostUserName?: string;
    hostUserAvatar?: string | null;
    allowEveryoneEdit?: boolean;
  };
}

export function useYouTubePlayer({
  channelId,
  activeVideoId,
  canEdit,
  isMeHost,
  socket,
  currentUser,
  onVideoEnded,
  getUnmountSnapshot,
}: UseYouTubePlayerOptions) {
  const cachedState = channelWatchStateCache.get(channelId);

  const [currentTime, setCurrentTime] = useState<number>(() => cachedState?.currentTime || 0);
  const [duration, setDuration] = useState<number>(() => cachedState?.duration || 0);
  const [isPlaying, setIsPlaying] = useState<boolean>(() => cachedState?.isPlaying ?? true);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
  const [needsUserGesture, setNeedsUserGesture] = useState<boolean>(false);

  const playerRef = useRef<any>(null);
  const ignoreLocalStateChangeUntilRef = useRef<number>(0);
  const lastSeekTimestampRef = useRef<number>(0);
  const lastKnownTimeRef = useRef<number>(cachedState?.currentTime || 0);
  const initialSeekTimeRef = useRef<number>(cachedState?.currentTime || 0);

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.YT) {
      const existingScript = document.getElementById('youtube-iframe-api');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }
    }
  }, []);

  // Player state change handler
  const handlePlayerStateChange = (state: number) => {
    // 1: PLAYING, 2: PAUSED, 0: ENDED, 3: BUFFERING
    if (state === 1) {
      setIsPlaying(true);
      setNeedsUserGesture(false);
      // Only broadcast if not in ignore window, user has permission, and local interaction
      if (Date.now() >= ignoreLocalStateChangeUntilRef.current && canEdit) {
        const time = playerRef.current?.getCurrentTime?.() || 0;
        socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
          channelId,
          action: 'YOUTUBE_PLAY',
          payload: {
            currentTime: time,
            senderId: currentUser?.id || socket?.id,
          },
        });
      }
    } else if (state === 2) {
      setIsPlaying(false);
      const time = playerRef.current?.getCurrentTime?.() || 0;
      // Prevent pause broadcast on video initial load (time === 0) or during ignore window
      if (Date.now() >= ignoreLocalStateChangeUntilRef.current && canEdit && time > 0.5) {
        socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
          channelId,
          action: 'YOUTUBE_PAUSE',
          payload: {
            currentTime: time,
            senderId: currentUser?.id || socket?.id,
          },
        });
      }
    } else if (state === 0) {
      setIsPlaying(false);
      onVideoEnded?.();
    }
  };

  // Initialize or update YouTube Player when activeVideoId changes
  useEffect(() => {
    if (!activeVideoId) {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
        setIsPlayerReady(false);
      }
      return;
    }

    let isMounted = true;
    let pollInterval: any = null;

    const initOrLoad = () => {
      if (!isMounted) return;
      if (!window.YT || !window.YT.Player) return;

      const targetEl = document.getElementById('yt-watch-together-player-frame');
      if (!targetEl) return;

      if (playerRef.current) {
        try {
          const currentLoadedId = playerRef.current.getVideoData?.()?.video_id;
          if (currentLoadedId === activeVideoId) return;

          if (typeof playerRef.current.loadVideoById === 'function') {
            ignoreLocalStateChangeUntilRef.current = Date.now() + 3500;
            const seekToTime = initialSeekTimeRef.current || 0;
            initialSeekTimeRef.current = 0;
            lastKnownTimeRef.current = seekToTime;
            setCurrentTime(seekToTime);
            setIsPlaying(true);
            playerRef.current.loadVideoById({
              videoId: activeVideoId,
              startSeconds: seekToTime,
            });
            setTimeout(() => {
              try { playerRef.current?.playVideo?.(); } catch (e) {}
            }, 300);
          }
        } catch (err) {
          console.error('Error loading video in YT Player:', err);
        }
        return;
      }

      try {
        ignoreLocalStateChangeUntilRef.current = Date.now() + 1500;
        playerRef.current = new window.YT.Player('yt-watch-together-player-frame', {
          width: '100%',
          height: '100%',
          videoId: activeVideoId,
          playerVars: {
            autoplay: 1,
            controls: 1,
            rel: 0,
            enablejsapi: 1,
            playsinline: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
          events: {
            onReady: (event: any) => {
              if (!isMounted) return;
              setIsPlayerReady(true);
              try {
                const dur = event.target.getDuration?.() || 0;
                setDuration(dur);
                if (initialSeekTimeRef.current > 0) {
                  event.target.seekTo(initialSeekTimeRef.current, true);
                  initialSeekTimeRef.current = 0;
                }
                event.target.playVideo?.();
              } catch (e) {}
            },
            onStateChange: (event: any) => {
              if (!isMounted) return;
              handlePlayerStateChange(event.data);
            },
          },
        });
      } catch (err) {
        console.error('Failed to create YouTube Player:', err);
      }
    };

    if (window.YT && window.YT.Player) {
      setTimeout(initOrLoad, 50);
    } else {
      pollInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(pollInterval);
          initOrLoad();
        }
      }, 200);
    }

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [activeVideoId]);

  // Save state to cache on unmount (for PiP / minimize restore)
  useEffect(() => {
    return () => {
      let snapshotTime = currentTime;
      let snapshotDuration = duration;
      let snapshotPlaying = isPlaying;
      try {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          snapshotTime = playerRef.current.getCurrentTime() || snapshotTime;
          snapshotDuration = playerRef.current.getDuration() || snapshotDuration;
          const state = playerRef.current.getPlayerState?.();
          snapshotPlaying = state === 1;
        }
      } catch (e) {}

      if (activeVideoId) {
        const extraSnapshot = getUnmountSnapshot?.();
        channelWatchStateCache.set(channelId, {
          videoId: activeVideoId,
          currentTime: snapshotTime,
          duration: snapshotDuration,
          isPlaying: snapshotPlaying,
          playlist: extraSnapshot?.playlist,
          hostUserId: extraSnapshot?.hostUserId,
          hostUserName: extraSnapshot?.hostUserName,
          hostUserAvatar: extraSnapshot?.hostUserAvatar,
          allowEveryoneEdit: extraSnapshot?.allowEveryoneEdit,
        });
      } else {
        channelWatchStateCache.delete(channelId);
      }

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 100ms poller for tracking time & detecting manual scrubs in native YouTube iframe
  useEffect(() => {
    if (!activeVideoId) return;

    const interval = setInterval(() => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;

      try {
        const curr = playerRef.current.getCurrentTime() || 0;
        const dur = playerRef.current.getDuration() || 0;
        if (dur > 0) setDuration(dur);

        if (!isScrubbing) {
          setCurrentTime(curr);
        }

        const last = lastKnownTimeRef.current;
        lastKnownTimeRef.current = curr;

        // Skip manual seek broadcast if within remote sync grace window or tab hidden
        if (Date.now() < ignoreLocalStateChangeUntilRef.current) return;
        if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;

        // Detect manual scrub inside YouTube iframe (jump > 0.8s)
        const delta = Math.abs(curr - last);
        if (delta > 0.8 && dur > 0 && last > 0) {
          if (canEdit) {
            socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
              channelId,
              action: 'YOUTUBE_SEEK',
              payload: {
                videoId: activeVideoId,
                currentTime: curr,
                isPlaying,
                senderId: currentUser?.id || socket?.id,
              },
            });
          }
        }
      } catch (e) {}
    }, 100);

    return () => clearInterval(interval);
  }, [activeVideoId, isScrubbing, isPlaying, canEdit, channelId, socket, currentUser?.id]);

  // Periodic drift correction from host (every 4 seconds)
  useEffect(() => {
    if (!isMeHost || !activeVideoId || !isPlaying || !socket) return;

    const heartbeat = setInterval(() => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;
      try {
        const time = playerRef.current.getCurrentTime();
        if (typeof time === 'number' && time > 0) {
          socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
            channelId,
            action: 'YOUTUBE_TIME_SYNC',
            payload: {
              videoId: activeVideoId,
              currentTime: time,
              isPlaying: true,
              senderId: currentUser?.id || socket.id,
            },
          });
        }
      } catch (e) {}
    }, 4000);

    return () => clearInterval(heartbeat);
  }, [isMeHost, activeVideoId, isPlaying, socket, channelId, currentUser?.id]);

  // Playback Control Handlers
  const handleUnlockAutoplay = () => {
    setNeedsUserGesture(false);
    if (playerRef.current) {
      try {
        playerRef.current.unMute?.();
        playerRef.current.playVideo?.();
        setIsPlaying(true);
      } catch (e) {}
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
  };

  const handleSeekStart = () => {
    setIsScrubbing(true);
  };

  const handleSeekCommit = (newTime: number) => {
    setIsScrubbing(false);
    if (!canEdit) {
      toast.info('Hanya host yang dapat mengubah timestamp.');
      return;
    }
    if (!playerRef.current) return;

    ignoreLocalStateChangeUntilRef.current = Date.now() + 1500;
    lastSeekTimestampRef.current = Date.now();
    lastKnownTimeRef.current = newTime;
    setCurrentTime(newTime);
    setNeedsUserGesture(false);

    try {
      if (typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(newTime, true);
      }
    } catch (e) {}

    socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId,
      action: 'YOUTUBE_SEEK',
      payload: {
        videoId: activeVideoId,
        currentTime: newTime,
        isPlaying,
        senderId: currentUser?.id || socket?.id,
      },
    });
  };

  const handleJumpRelative = (deltaSeconds: number) => {
    if (!canEdit) {
      toast.info('Hanya host yang dapat mengubah timestamp.');
      return;
    }
    const current = playerRef.current?.getCurrentTime?.() || currentTime;
    const targetTime = Math.max(0, Math.min(duration || 999999, current + deltaSeconds));
    handleSeekCommit(targetTime);
  };

  const handleTogglePlayPause = () => {
    if (!canEdit) {
      toast.info('Hanya host yang dapat memutar/menjeda video.');
      return;
    }
    if (!playerRef.current) return;

    ignoreLocalStateChangeUntilRef.current = Date.now() + 3500;
    setNeedsUserGesture(false);
    const time = playerRef.current.getCurrentTime?.() || currentTime;
    if (isPlaying) {
      setIsPlaying(false);
      try {
        playerRef.current.pauseVideo();
      } catch (e) {}
      socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
        channelId,
        action: 'YOUTUBE_PAUSE',
        payload: {
          videoId: activeVideoId,
          currentTime: time,
          senderId: currentUser?.id || socket?.id,
        },
      });
    } else {
      setIsPlaying(true);
      try {
        playerRef.current.playVideo();
      } catch (e) {}
      socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
        channelId,
        action: 'YOUTUBE_PLAY',
        payload: {
          videoId: activeVideoId,
          currentTime: time,
          senderId: currentUser?.id || socket?.id,
        },
      });
    }
  };

  return {
    playerRef,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    isPlaying,
    setIsPlaying,
    isScrubbing,
    setIsScrubbing,
    isPlayerReady,
    setIsPlayerReady,
    needsUserGesture,
    setNeedsUserGesture,
    ignoreLocalStateChangeUntilRef,
    lastSeekTimestampRef,
    lastKnownTimeRef,
    initialSeekTimeRef,
    handleUnlockAutoplay,
    handleSeekChange,
    handleSeekStart,
    handleSeekCommit,
    handleJumpRelative,
    handleTogglePlayPause,
  };
}
