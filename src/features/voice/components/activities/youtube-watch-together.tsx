import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import {
  Play,
  Pause,
  Plus,
  Check,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Flame,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  Lock,
  ListVideo,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import { CommunityChannel } from '@/chat/chat-types';
import { CommunityAvatar } from '@/chat/chat-avatar';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface YouTubeWatchTogetherProps {
  channel: CommunityChannel;
  currentUserName: string;
  currentUser?: any;
  participants?: any[];
  socket: Socket | null;
}

export function YouTubeWatchTogether({
  channel,
  currentUserName,
  currentUser,
  participants = [],
  socket,
}: YouTubeWatchTogetherProps) {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [ytSearchQuery, setYtSearchQuery] = useState('');
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState('');
  const [searchTriggerCount, setSearchTriggerCount] = useState(0);
  const [ytCategory, setYtCategory] = useState<string>('semua');
  const [isExpandedVideo, setIsExpandedVideo] = useState(false);
  const [isExpandedPlaylistOpen, setIsExpandedPlaylistOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'browse' | 'playlist'>('browse');

  // Playback & Realtime Sync States
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
  const [needsUserGesture, setNeedsUserGesture] = useState<boolean>(false);

  const playerRef = useRef<any>(null);
  const isRemoteSyncRef = useRef<boolean>(false);
  const ignoreLocalStateChangeUntilRef = useRef<number>(0);
  const lastSeekTimestampRef = useRef<number>(0);
  const lastKnownTimeRef = useRef<number>(0);
  const initialSeekTimeRef = useRef<number>(0);

  // Host & Permission States
  const [hostUserId, setHostUserId] = useState<string>(() => currentUser?.id || 'me');
  const [hostUserName, setHostUserName] = useState<string>(() => currentUserName || 'You');
  const [hostUserAvatar, setHostUserAvatar] = useState<string | null>(
    () => currentUser?.imageUrl || currentUser?.avatar || null,
  );
  const [allowEveryoneEdit, setAllowEveryoneEdit] = useState<boolean>(true);
  const [isHostMenuOpen, setIsHostMenuOpen] = useState(false);

  const isMeHost = !hostUserId || hostUserId === currentUser?.id || hostUserId === 'me';
  const canEdit = allowEveryoneEdit || isMeHost;

  // Sync state refs to keep socket event handlers stable
  const isMeHostRef = useRef(isMeHost);
  isMeHostRef.current = isMeHost;
  const activeVideoIdRef = useRef(activeVideoId);
  activeVideoIdRef.current = activeVideoId;
  const ytPlaylistRef = useRef<Array<any>>([]);
  const hostUserIdRef = useRef(hostUserId);
  hostUserIdRef.current = hostUserId;
  const hostUserNameRef = useRef(hostUserName);
  hostUserNameRef.current = hostUserName;
  const hostUserAvatarRef = useRef(hostUserAvatar);
  hostUserAvatarRef.current = hostUserAvatar;
  const allowEveryoneEditRef = useRef(allowEveryoneEdit);
  allowEveryoneEditRef.current = allowEveryoneEdit;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const [ytVideos, setYtVideos] = useState<
    Array<{
      id: string;
      title: string;
      channel: string;
      thumbnail: string;
      duration: string;
      views?: string;
      uploadedAt?: string;
    }>
  >([]);

  const [ytPlaylist, setYtPlaylist] = useState<
    Array<{
      id: string;
      title: string;
      channel: string;
      thumbnail: string;
      duration: string;
      views?: string;
      uploadedAt?: string;
      addedBy: string;
    }>
  >([]);
  ytPlaylistRef.current = ytPlaylist;

  const [ytIsSearching, setYtIsSearching] = useState(false);
  const [ytSearchError, setYtSearchError] = useState<string | null>(null);
  const ytCacheRef = useRef<
    Map<
      string,
      Array<{
        id: string;
        title: string;
        channel: string;
        thumbnail: string;
        duration: string;
        views?: string;
        uploadedAt?: string;
      }>
    >
  >(new Map());

  const ytCategories = [
    { id: 'semua', label: '🔥 Trending', q: '', categoryId: '' },
    { id: 'music', label: '🎵 Musik', q: '', categoryId: '10' },
    { id: 'gaming', label: '🎮 Gaming', q: '', categoryId: '20' },
    { id: 'tech', label: '💻 Tech', q: 'programming tech coding tutorial', categoryId: '28' },
    { id: 'entertainment', label: '🎉 Hiburan', q: '', categoryId: '24' },
    { id: 'lofi', label: '☕ Lofi', q: 'lofi hip hop radio beats', categoryId: '' },
  ];

  const formatSeconds = (sec: number): string => {
    if (!sec || isNaN(sec) || sec < 0) return '00:00';
    const totalSeconds = Math.floor(sec);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const parseYtDuration = (duration?: string): string => {
    if (!duration) return '';
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '';
    const h = match[1];
    const m = match[2] || '0';
    const s = match[3] || '0';
    if (h) return `${h}:${m.padStart(2, '0')}:${s.padStart(2, '0')}`;
    return `${m}:${s.padStart(2, '0')}`;
  };

  const formatViews = (views?: string | number): string => {
    if (!views) return '';
    const num = typeof views === 'string' ? parseInt(views, 10) : views;
    if (isNaN(num)) return '';
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M views`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K views`;
    return `${num} views`;
  };

  const formatTimeAgo = (dateStr?: string): string => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins || 1}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} months ago`;
    return `${Math.floor(months / 12)} years ago`;
  };

  // Load YouTube IFrame API script
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
          channelId: channel.id,
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
          channelId: channel.id,
          action: 'YOUTUBE_PAUSE',
          payload: {
            currentTime: time,
            senderId: currentUser?.id || socket?.id,
          },
        });
      }
    } else if (state === 0) {
      setIsPlaying(false);
      // Auto play next video in playlist if host
      if (isMeHostRef.current && ytPlaylistRef.current.length > 0) {
        const currentIndex = ytPlaylistRef.current.findIndex(
          (v) => v.id === activeVideoIdRef.current,
        );
        if (currentIndex !== -1 && currentIndex < ytPlaylistRef.current.length - 1) {
          const nextVideo = ytPlaylistRef.current[currentIndex + 1];
          handleSelectVideo(nextVideo);
        }
      }
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
            playerRef.current.loadVideoById({
              videoId: activeVideoId,
              startSeconds: seekToTime,
            });
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

  // Clean up player on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }
    };
  }, []);

  // 500ms poller for tracking time & detecting manual scrubs in native YouTube iframe
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

        // Detect manual scrub inside YouTube iframe (jump > 2.5s)
        const delta = Math.abs(curr - last);
        if (delta > 0.8 && dur > 0 && last > 0) {
          if (canEdit) {
            socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
              channelId: channel.id,
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
  }, [activeVideoId, isScrubbing, isPlaying, canEdit, channel.id, socket, currentUser?.id]);

  // Periodic drift correction from host (every 4 seconds)
  useEffect(() => {
    if (!isMeHost || !activeVideoId || !isPlaying || !socket) return;

    const heartbeat = setInterval(() => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;
      try {
        const time = playerRef.current.getCurrentTime();
        if (typeof time === 'number' && time > 0) {
          socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
            channelId: channel.id,
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
  }, [isMeHost, activeVideoId, isPlaying, socket, channel.id, currentUser?.id]);

  // Unlock browser autoplay policy on user click
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

  // Seeking & playback control actions
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
      channelId: channel.id,
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
        channelId: channel.id,
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
        channelId: channel.id,
        action: 'YOUTUBE_PLAY',
        payload: {
          videoId: activeVideoId,
          currentTime: time,
          senderId: currentUser?.id || socket?.id,
        },
      });
    }
  };

  // Socket Activity Sync
  useEffect(() => {
    if (!socket) return;

    const handleYouTubeSocketEvent = (data: any) => {
      if (!data) return;
      if (data.channelId && data.channelId !== channel.id) return;

      if (data.action === 'YOUTUBE_CHANGE_VIDEO') {
        const { videoId } = data.payload || {};
        if (videoId && videoId !== activeVideoIdRef.current) {
          ignoreLocalStateChangeUntilRef.current = Date.now() + 3500;
          initialSeekTimeRef.current = 0;
          setActiveVideoId(videoId);
          setIsExpandedVideo(false);
        }
      } else if (data.action === 'YOUTUBE_SEEK') {
        const { currentTime: targetTime, isPlaying: remotePlaying, senderId } = data.payload || {};
        if (senderId && (senderId === currentUser?.id || senderId === socket.id)) return;

        if (typeof targetTime === 'number' && playerRef.current) {
          ignoreLocalStateChangeUntilRef.current = Date.now() + 1500;
          lastSeekTimestampRef.current = Date.now();
          lastKnownTimeRef.current = targetTime;
          setCurrentTime(targetTime);

          try {
            playerRef.current.seekTo(targetTime, true);
            if (remotePlaying) {
              playerRef.current.playVideo?.();
              setIsPlaying(true);
            } else if (remotePlaying === false) {
              playerRef.current.pauseVideo?.();
              setIsPlaying(false);
            }
          } catch (e) {}
        }
      } else if (data.action === 'YOUTUBE_PLAY') {
        const { currentTime: targetTime, senderId } = data.payload || {};
        if (senderId && (senderId === currentUser?.id || senderId === socket.id)) return;

        ignoreLocalStateChangeUntilRef.current = Date.now() + 1500;
        setIsPlaying(true);
        if (playerRef.current) {
          if (typeof targetTime === 'number') {
            const curr = playerRef.current.getCurrentTime?.() || 0;
            if (Math.abs(curr - targetTime) > 3.0) {
              try {
                playerRef.current.seekTo(targetTime, true);
              } catch (e) {}
            }
          }
          try {
            const res = playerRef.current.playVideo?.();
            if (res && typeof res.catch === 'function') {
              res.catch(() => setNeedsUserGesture(true));
            }
          } catch (e) {
            setNeedsUserGesture(true);
          }
        }
      } else if (data.action === 'YOUTUBE_PAUSE') {
        const { currentTime: targetTime, senderId } = data.payload || {};
        if (senderId && (senderId === currentUser?.id || senderId === socket.id)) return;

        ignoreLocalStateChangeUntilRef.current = Date.now() + 1500;
        setIsPlaying(false);
        if (playerRef.current) {
          try {
            playerRef.current.pauseVideo?.();
            if (typeof targetTime === 'number') {
              const curr = playerRef.current.getCurrentTime?.() || 0;
              if (Math.abs(curr - targetTime) > 3.0) {
                playerRef.current.seekTo(targetTime, false);
              }
            }
          } catch (e) {}
        }
      } else if (data.action === 'YOUTUBE_TIME_SYNC') {
        const { currentTime: targetTime, senderId } = data.payload || {};
        if (senderId && (senderId === currentUser?.id || senderId === socket.id)) return;

        if (playerRef.current && typeof targetTime === 'number') {
          // If player is currently buffering, NEVER interrupt buffering with a seek
          const pState = playerRef.current.getPlayerState?.();
          if (pState === 3) return;

          // Rate-limit sync seeks to prevent continuous buffering loops
          if (Date.now() - lastSeekTimestampRef.current < 3000) return;

          const localTime = playerRef.current.getCurrentTime?.() || 0;
          if (Math.abs(localTime - targetTime) > 4.5) {
            ignoreLocalStateChangeUntilRef.current = Date.now() + 3500;
            lastSeekTimestampRef.current = Date.now();
            lastKnownTimeRef.current = targetTime;
            setCurrentTime(targetTime);
            try {
              playerRef.current.seekTo(targetTime, true);
            } catch (e) {}
          }
        }
      } else if (data.action === 'YOUTUBE_UPDATE_PLAYLIST') {
        const { playlist } = data.payload || {};
        if (Array.isArray(playlist)) {
          setYtPlaylist(playlist);
        }
      } else if (data.action === 'YOUTUBE_CHANGE_HOST') {
        const { hostUserId: nextHostId, hostUserName: nextHostName, hostUserAvatar: nextHostAvatar } =
          data.payload || {};
        if (nextHostId) setHostUserId(nextHostId);
        if (nextHostName) setHostUserName(nextHostName);
        setHostUserAvatar(nextHostAvatar || null);
        toast.info(`${nextHostName || 'Seseorang'} sekarang menjadi host Watch Together`);
      } else if (data.action === 'YOUTUBE_TOGGLE_EDIT_PERMISSION') {
        const { allowEveryoneEdit: nextAllow } = data.payload || {};
        if (typeof nextAllow === 'boolean') {
          setAllowEveryoneEdit(nextAllow);
          toast.info(
            nextAllow
              ? 'Izin edit dibuka untuk semua peserta'
              : 'Izin edit playlist dikunci hanya untuk host',
          );
        }
      } else if (data.action === 'YOUTUBE_SYNC_STATE') {
        const {
          videoId,
          playlist,
          hostUserId: syncHostId,
          hostUserName: syncHostName,
          hostUserAvatar: syncHostAvatar,
          allowEveryoneEdit: syncAllow,
          currentTime: syncTime,
          isPlaying: syncPlaying,
        } = data.payload || {};
        if (videoId) {
          if (videoId !== activeVideoIdRef.current) {
            initialSeekTimeRef.current = typeof syncTime === 'number' ? syncTime : 0;
            ignoreLocalStateChangeUntilRef.current = Date.now() + 1500;
            setActiveVideoId(videoId);
          } else if (typeof syncTime === 'number' && playerRef.current) {
            const curr = playerRef.current.getCurrentTime?.() || 0;
            if (Math.abs(curr - syncTime) > 4.0) {
              ignoreLocalStateChangeUntilRef.current = Date.now() + 1500;
              try {
                playerRef.current.seekTo(syncTime, true);
              } catch (e) {}
            }
            if (syncPlaying) {
              playerRef.current.playVideo?.();
              setIsPlaying(true);
            } else if (syncPlaying === false) {
              playerRef.current.pauseVideo?.();
              setIsPlaying(false);
            }
          }
        }
        if (Array.isArray(playlist)) setYtPlaylist(playlist);
        if (syncHostId) setHostUserId(syncHostId);
        if (syncHostName) setHostUserName(syncHostName);
        if (syncHostAvatar !== undefined) setHostUserAvatar(syncHostAvatar);
        if (typeof syncAllow === 'boolean') setAllowEveryoneEdit(syncAllow);
      } else if (data.action === 'YOUTUBE_QUERY_STATE') {
        // If I am host, reply to newly joined participant
        if (isMeHostRef.current) {
          socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
            channelId: channel.id,
            action: 'YOUTUBE_SYNC_STATE',
            payload: {
              videoId: activeVideoIdRef.current,
              playlist: ytPlaylistRef.current,
              hostUserId: hostUserIdRef.current,
              hostUserName: hostUserNameRef.current,
              hostUserAvatar: hostUserAvatarRef.current,
              allowEveryoneEdit: allowEveryoneEditRef.current,
              currentTime: playerRef.current?.getCurrentTime?.() || 0,
              isPlaying: isPlayingRef.current,
            },
          });
        }
      }
    };

    socket.on('COMMUNITY_CALL_ACTIVITY_EVENT', handleYouTubeSocketEvent);

    // Ask peers for current watch state upon entering
    socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId: channel.id,
      action: 'YOUTUBE_QUERY_STATE',
    });

    return () => {
      socket.off('COMMUNITY_CALL_ACTIVITY_EVENT', handleYouTubeSocketEvent);
    };
  }, [socket, channel.id, currentUser?.id]);

  // YouTube API Search / Category fetch (only executes when submittedSearchQuery or ytCategory changes)
  useEffect(() => {
    const catObj = ytCategories.find((c) => c.id === ytCategory);
    const rawQ = submittedSearchQuery.trim();

    if (rawQ.includes('youtube.com') || rawQ.includes('youtu.be')) return;
    if (rawQ.length === 1) return;

    const cacheKey = rawQ ? `search:${rawQ.toLowerCase()}` : `cat:${ytCategory}`;

    // 1. Caching: Return cached results without consuming API quota
    if (ytCacheRef.current.has(cacheKey)) {
      setYtVideos(ytCacheRef.current.get(cacheKey)!);
      setYtIsSearching(false);
      setYtSearchError(null);
      return;
    }

    let isCancelled = false;

    const fetchVideos = async () => {
      setYtIsSearching(true);
      setYtSearchError(null);
      try {
        const key = import.meta.env.VITE_YOUTUBE_API_KEY || 'AIzaSyBg-0HDXNw2occXp6_89D4dXxBW0gISbQ4';
        let items: Array<{
          id: string;
          title: string;
          channel: string;
          thumbnail: string;
          duration: string;
          views?: string;
          uploadedAt?: string;
        }> = [];

        if (rawQ) {
          const params = new URLSearchParams({
            part: 'snippet',
            q: rawQ,
            type: 'video',
            maxResults: '16',
            key,
          });
          const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
          if (!res.ok) throw new Error(`YouTube API (${res.status}): pastikan kuota API aktif`);
          const data = await res.json();
          items = (data.items ?? []).map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            thumbnail:
              item.snippet.thumbnails?.medium?.url ||
              item.snippet.thumbnails?.default?.url ||
              `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
            duration: '',
            uploadedAt: formatTimeAgo(item.snippet?.publishedAt),
          }));
        } else if (catObj?.categoryId) {
          const params = new URLSearchParams({
            part: 'snippet,contentDetails,statistics',
            chart: 'mostPopular',
            regionCode: 'ID',
            videoCategoryId: catObj.categoryId,
            maxResults: '16',
            key,
          });
          const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`);
          if (!res.ok) throw new Error(`YouTube API (${res.status}): pastikan kuota API aktif`);
          const data = await res.json();
          items = (data.items ?? []).map((item: any) => ({
            id: item.id,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            thumbnail:
              item.snippet.thumbnails?.medium?.url ||
              item.snippet.thumbnails?.standard?.url ||
              item.snippet.thumbnails?.default?.url ||
              `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
            duration: parseYtDuration(item.contentDetails?.duration),
            views: formatViews(item.statistics?.viewCount),
            uploadedAt: formatTimeAgo(item.snippet?.publishedAt),
          }));
        } else if (catObj?.q) {
          const params = new URLSearchParams({
            part: 'snippet',
            q: catObj.q,
            type: 'video',
            maxResults: '16',
            key,
          });
          const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
          if (!res.ok) throw new Error(`YouTube API (${res.status}): pastikan kuota API aktif`);
          const data = await res.json();
          items = (data.items ?? []).map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            thumbnail:
              item.snippet.thumbnails?.medium?.url ||
              item.snippet.thumbnails?.default?.url ||
              `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
            duration: '',
            uploadedAt: formatTimeAgo(item.snippet?.publishedAt),
          }));
        } else {
          const params = new URLSearchParams({
            part: 'snippet,contentDetails,statistics',
            chart: 'mostPopular',
            regionCode: 'ID',
            maxResults: '16',
            key,
          });
          const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`);
          if (!res.ok) throw new Error(`YouTube API (${res.status}): pastikan kuota API aktif`);
          const data = await res.json();
          items = (data.items ?? []).map((item: any) => ({
            id: item.id,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            thumbnail:
              item.snippet.thumbnails?.medium?.url ||
              item.snippet.thumbnails?.standard?.url ||
              item.snippet.thumbnails?.default?.url ||
              `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
            duration: parseYtDuration(item.contentDetails?.duration),
            views: formatViews(item.statistics?.viewCount),
            uploadedAt: formatTimeAgo(item.snippet?.publishedAt),
          }));
        }

        if (!isCancelled) {
          ytCacheRef.current.set(cacheKey, items);
          setYtVideos(items);
        }
      } catch (e: any) {
        if (!isCancelled) {
          setYtSearchError(e.message ?? 'Gagal memuat video YouTube');
          setYtVideos([]);
        }
      } finally {
        if (!isCancelled) {
          setYtIsSearching(false);
        }
      }
    };

    fetchVideos();

    return () => {
      isCancelled = true;
    };
  }, [submittedSearchQuery, ytCategory, searchTriggerCount]);

  const handleSelectVideo = (video: {
    id: string;
    title: string;
    channel: string;
    thumbnail: string;
    duration: string;
    views?: string;
    uploadedAt?: string;
  }) => {
    if (!canEdit) {
      toast.info('Hanya host yang dapat mengganti video saat ini.');
      return;
    }

    ignoreLocalStateChangeUntilRef.current = Date.now() + 3500;
    initialSeekTimeRef.current = 0;
    setActiveVideoId(video.id);
    setIsExpandedVideo(false);

    let nextPlaylist = ytPlaylist;
    if (!ytPlaylist.some((item) => item.id === video.id)) {
      nextPlaylist = [
        ...ytPlaylist,
        {
          ...video,
          addedBy: currentUserName || 'You',
        },
      ];
      setYtPlaylist(nextPlaylist);
    }

    socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId: channel.id,
      action: 'YOUTUBE_CHANGE_VIDEO',
      payload: { videoId: video.id },
    });

    socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId: channel.id,
      action: 'YOUTUBE_UPDATE_PLAYLIST',
      payload: { playlist: nextPlaylist },
    });
  };

  const handleAddToQueue = (
    e: React.MouseEvent,
    video: {
      id: string;
      title: string;
      channel: string;
      thumbnail: string;
      duration: string;
      views?: string;
      uploadedAt?: string;
    },
  ) => {
    e.stopPropagation();
    if (!canEdit) {
      toast.info('Hanya host yang dapat menambah video ke playlist saat ini.');
      return;
    }

    let nextPlaylist = ytPlaylist;
    if (!ytPlaylist.some((item) => item.id === video.id)) {
      nextPlaylist = [
        ...ytPlaylist,
        {
          ...video,
          addedBy: currentUserName || 'You',
        },
      ];
      setYtPlaylist(nextPlaylist);
      socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
        channelId: channel.id,
        action: 'YOUTUBE_UPDATE_PLAYLIST',
        payload: { playlist: nextPlaylist },
      });
      toast.success(`Ditambahkan ke playlist: ${video.title}`);
    }

    if (!activeVideoId) {
      setActiveVideoId(video.id);
      setIsExpandedVideo(false);
      socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
        channelId: channel.id,
        action: 'YOUTUBE_CHANGE_VIDEO',
        payload: { videoId: video.id },
      });
    }
  };

  const handlePlayYouTubeUrl = (urlOrQuery: string) => {
    if (!urlOrQuery.trim()) return;
    if (!canEdit) {
      toast.info('Hanya host yang dapat memasukkan URL video saat ini.');
      return;
    }

    const match = urlOrQuery.match(
      /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    );
    const videoId = match
      ? match[1]
      : urlOrQuery.trim().length === 11 && !urlOrQuery.includes(' ')
        ? urlOrQuery.trim()
        : null;

    if (videoId) {
      const existing = ytVideos.find((v) => v.id === videoId);
      const newVideo = existing || {
        id: videoId,
        title: `YouTube Video (${videoId})`,
        channel: 'YouTube',
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: '',
        uploadedAt: 'Baru saja',
      };
      handleSelectVideo(newVideo);
      setYtSearchQuery('');
      setSubmittedSearchQuery('');
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = ytSearchQuery.trim();
    if (!raw) {
      setSubmittedSearchQuery('');
      return;
    }

    // Direct YouTube URL or 11-char video ID detection
    const match = raw.match(
      /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    );
    const videoId = match
      ? match[1]
      : raw.length === 11 && !raw.includes(' ')
        ? raw
        : null;

    if (videoId) {
      handlePlayYouTubeUrl(raw);
      setYtSearchQuery('');
      setSubmittedSearchQuery('');
      return;
    }

    // Keyword search: trigger on-submit
    setSubmittedSearchQuery(raw);
    setSearchTriggerCount((c) => c + 1);
  };

  const handleTransferHost = (participant: any) => {
    const newHostId = participant.userId || participant.socketId;
    const newHostName = participant.userName || 'Member';
    const newHostAvatar = participant.userAvatar || null;

    setHostUserId(newHostId);
    setHostUserName(newHostName);
    setHostUserAvatar(newHostAvatar);
    setIsHostMenuOpen(false);

    socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId: channel.id,
      action: 'YOUTUBE_CHANGE_HOST',
      payload: {
        hostUserId: newHostId,
        hostUserName: newHostName,
        hostUserAvatar: newHostAvatar,
      },
    });
    toast.success(`Host dialihkan ke ${newHostName}!`);
  };

  const handleClaimHost = () => {
    const myId = currentUser?.id || 'me';
    const myName = currentUserName || 'You';
    const myAvatar = currentUser?.imageUrl || currentUser?.avatar || null;

    setHostUserId(myId);
    setHostUserName(myName);
    setHostUserAvatar(myAvatar);
    setIsHostMenuOpen(false);

    socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId: channel.id,
      action: 'YOUTUBE_CHANGE_HOST',
      payload: {
        hostUserId: myId,
        hostUserName: myName,
        hostUserAvatar: myAvatar,
      },
    });
    toast.success('Kamu sekarang menjadi host!');
  };

  const handleToggleAllowEveryone = () => {
    if (!isMeHost) {
      toast.info('Hanya host yang dapat mengubah izin pengeditan.');
      return;
    }
    const nextVal = !allowEveryoneEdit;
    setAllowEveryoneEdit(nextVal);
    socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId: channel.id,
      action: 'YOUTUBE_TOGGLE_EDIT_PERMISSION',
      payload: { allowEveryoneEdit: nextVal },
    });
  };

  // Reusable Host Button & Popover Component
  const renderHostPopover = () => {
    const displayAvatar = isMeHost
      ? currentUser?.imageUrl || currentUser?.avatar
      : hostUserAvatar;
    const displayName = isMeHost ? currentUserName : hostUserName;

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsHostMenuOpen((prev) => !prev)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border hover:border-border/80 text-foreground text-xs font-medium cursor-pointer transition-all shadow-xs"
        >
          <div className="shrink-0 overflow-hidden rounded-full">
            <CommunityAvatar
              name={displayName}
              imageUrl={displayAvatar}
              size={20}
              showStatus={false}
            />
          </div>
          <span className="truncate max-w-[130px] sm:max-w-none">
            {isMeHost ? (
              <>
                You are <strong className="font-semibold text-primary">hosting</strong>
              </>
            ) : (
              <>
                <strong className="font-semibold text-primary">{displayName}</strong> is hosting
              </>
            )}
          </span>
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 shrink-0',
              isHostMenuOpen && 'rotate-180',
            )}
          />
        </button>

        {isHostMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsHostMenuOpen(false)}
            />
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-[#111214] border border-border/80 shadow-2xl p-4 z-50 text-foreground animate-in fade-in zoom-in-95 duration-150">
              {/* Permission Card */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-sky-500/40 bg-sky-500/5">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <Lock className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="text-xs text-foreground font-medium leading-tight">
                    Allow everyone to edit the playlist and video state
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={allowEveryoneEdit}
                  disabled={!isMeHost}
                  onClick={handleToggleAllowEveryone}
                  className={cn(
                    'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                    allowEveryoneEdit ? 'bg-sky-500' : 'bg-zinc-700',
                    !isMeHost && 'opacity-60 cursor-not-allowed',
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
                      allowEveryoneEdit ? 'translate-x-4' : 'translate-x-0',
                    )}
                  />
                </button>
              </div>

              {/* Select new host */}
              <div className="mt-3.5 mb-2">
                <span className="text-xs font-semibold text-muted-foreground">Select new host:</span>
              </div>

              {/* Participants List */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto [scrollbar-width:thin]">
                {/* Current User Row */}
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="shrink-0 rounded-full overflow-hidden">
                      <CommunityAvatar
                        name={currentUserName}
                        imageUrl={currentUser?.imageUrl || currentUser?.avatar}
                        size={28}
                        showStatus={false}
                      />
                    </div>
                    <span className="text-xs font-medium text-foreground truncate">
                      {currentUserName} (You)
                    </span>
                  </div>
                  {isMeHost ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[10px] tracking-wide shrink-0">
                      HOST
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleClaimHost}
                      className="px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-foreground text-xs font-medium cursor-pointer shrink-0 transition-colors"
                    >
                      Make Host
                    </button>
                  )}
                </div>

                {/* Remote Participants */}
                {participants.map((p) => {
                  const isRemoteHost = hostUserId === p.userId || hostUserId === p.socketId;
                  return (
                    <div
                      key={p.socketId}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="shrink-0 rounded-full overflow-hidden">
                          <CommunityAvatar
                            name={p.userName}
                            imageUrl={p.userAvatar}
                            size={28}
                            showStatus={false}
                          />
                        </div>
                        <span className="text-xs font-medium text-foreground truncate">
                          {p.userName}
                        </span>
                      </div>
                      {isRemoteHost ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[10px] tracking-wide shrink-0">
                          HOST
                        </span>
                      ) : isMeHost ? (
                        <button
                          type="button"
                          onClick={() => handleTransferHost(p)}
                          className="px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-foreground text-xs font-medium cursor-pointer shrink-0 transition-colors"
                        >
                          Make Host
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Realtime Synced Video Control Bar Component
  const renderSyncedControlBar = () => {
    return (
      <div className="w-full bg-card/90 backdrop-blur-md border border-border rounded-xl p-2.5 sm:p-3 flex flex-col gap-2 shrink-0 shadow-sm">
        {/* Scrubber hidden - native YT controls handle progress */}

        {/* Button row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Play/Pause */}
            <button
              type="button"
              onClick={handleTogglePlayPause}
              disabled={!canEdit}
              title={isPlaying ? 'Jeda (Pause)' : 'Putar (Play)'}
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 shadow-xs',
                !canEdit && 'opacity-60 cursor-not-allowed',
              )}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            {/* -10s */}
            <button
              type="button"
              onClick={() => handleJumpRelative(-10)}
              disabled={!canEdit}
              title="Mundur 10 detik"
              className={cn(
                'px-2 py-1 h-8 rounded-lg border border-border bg-muted/50 hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-95',
                !canEdit && 'opacity-60 cursor-not-allowed',
              )}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden sm:inline">-10s</span>
            </button>

            {/* +10s */}
            <button
              type="button"
              onClick={() => handleJumpRelative(10)}
              disabled={!canEdit}
              title="Maju 10 detik"
              className={cn(
                'px-2 py-1 h-8 rounded-lg border border-border bg-muted/50 hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-95',
                !canEdit && 'opacity-60 cursor-not-allowed',
              )}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden sm:inline">+10s</span>
            </button>
          </div>

          {/* Realtime Synced Badge + Expand Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Realtime Synced</span>
              <span className="sm:hidden">Synced</span>
            </div>

            <button
              type="button"
              onClick={() => setIsExpandedVideo((prev) => !prev)}
              className="p-1.5 h-8 w-8 rounded-lg border border-border bg-muted/50 hover:bg-muted text-foreground flex items-center justify-center transition-all cursor-pointer active:scale-95"
              title={isExpandedVideo ? 'Tampilan Normal' : 'Perbesar Video'}
            >
              {isExpandedVideo ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render playlist items list
  const renderPlaylistItems = () => {
    if (ytPlaylist.length === 0) {
      return (
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-card border border-border">
          <Play className="w-3.5 h-3.5 fill-current text-white shrink-0 ml-1" />
          <div className="relative w-24 aspect-video rounded-lg overflow-hidden shrink-0 bg-black">
            <img
              src={`https://i.ytimg.com/vi/${activeVideoId}/hqdefault.jpg`}
              alt="Playing"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('mqdefault')) {
                  target.src = `https://i.ytimg.com/vi/${activeVideoId}/mqdefault.jpg`;
                }
              }}
            />
            <span className="absolute inset-0 bg-black/45 flex items-center justify-center text-[10px] font-bold text-white tracking-wide">
              Playing
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {ytVideos.find((v) => v.id === activeVideoId)?.title || 'Now Playing'}
            </p>
            <p className="text-[11px] text-[#949ba4] truncate">
              {ytVideos.find((v) => v.id === activeVideoId)?.channel || 'YouTube'}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <CommunityAvatar
                name={currentUserName}
                imageUrl={currentUser?.imageUrl || currentUser?.avatar}
                size={18}
                showStatus={false}
              />
              <span className="text-[11px] text-[#949ba4] truncate">{currentUserName}</span>
            </div>
          </div>
        </div>
      );
    }

    return ytPlaylist.map((item, idx) => {
      const isCurrentItem = item.id === activeVideoId;
      return (
        <div
          key={`${item.id}-${idx}`}
          onClick={() => {
            if (!canEdit) {
              toast.info('Hanya host yang dapat mengganti video yang sedang diputar.');
              return;
            }
            setActiveVideoId(item.id);
            socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
              channelId: channel.id,
              action: 'YOUTUBE_CHANGE_VIDEO',
              payload: { videoId: item.id },
            });
          }}
          className={cn(
            'flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer',
            isCurrentItem
              ? 'bg-card border-primary/50 shadow-sm'
              : 'bg-card/70 border-border hover:border-border/80 hover:bg-card',
          )}
        >
          <Play
            className={cn(
              'w-3.5 h-3.5 shrink-0 ml-1',
              isCurrentItem ? 'fill-current text-primary' : 'text-muted-foreground',
            )}
          />
          <div className="relative w-24 aspect-video rounded-lg overflow-hidden shrink-0 bg-black">
            <img
              src={item.thumbnail || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('mqdefault')) {
                  target.src = `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`;
                }
              }}
            />
            {isCurrentItem ? (
              <span className="absolute inset-0 bg-black/45 flex items-center justify-center text-[10px] font-bold text-white tracking-wide">
                Playing
              </span>
            ) : item.duration ? (
              <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-semibold px-1 py-0.2 rounded">
                {item.duration}
              </span>
            ) : null}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'text-xs font-semibold truncate',
                isCurrentItem ? 'text-foreground' : 'text-foreground/80',
              )}
            >
              {item.title}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">{item.channel}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <CommunityAvatar
                name={item.addedBy}
                imageUrl={
                  item.addedBy === currentUserName
                    ? currentUser?.imageUrl || currentUser?.avatar
                    : participants.find((p) => p.userName === item.addedBy)?.userAvatar
                }
                size={18}
                showStatus={false}
              />
              <span className="text-[11px] text-muted-foreground truncate">
                {item.addedBy}
              </span>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background select-none">
      {activeVideoId ? (
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden bg-background">
          {/* Left Column (Desktop) or Top Section (Mobile): Video Player + Synced Control Bar + Playlist */}
          <div
            className={cn(
              'flex flex-col',
              isExpandedVideo
                ? 'w-full h-full p-0 gap-0 bg-black relative'
                : cn(
                    'w-full md:w-[44%] lg:w-[42%] border-b md:border-b-0 md:border-r border-border py-3 md:py-4 gap-3 md:gap-4 shrink-0 md:shrink md:overflow-y-auto [scrollbar-width:thin]',
                    mobileTab === 'browse' ? 'md:flex' : 'flex',
                    CHANNEL_HORIZONTAL_PADDING,
                  ),
            )}
          >
            {/* Video Player Box with YouTube IFrame API Target */}
            <div
              className={cn(
                'relative mx-auto w-full overflow-hidden bg-black group shrink-0 transition-all duration-200',
                isExpandedVideo
                  ? 'w-full h-full rounded-none flex items-center justify-center border-0'
                  : 'aspect-video max-h-[220px] sm:max-h-[260px] md:max-h-none rounded-2xl border border-border shadow-2xl',
              )}
            >
              {/* Target div for YouTube IFrame Player API */}
              <div
                id="yt-watch-together-player-frame"
                className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
              />

              {/* Browser Autoplay Blocked Banner */}
              {needsUserGesture && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-30 p-4 text-center">
                  <p className="text-xs sm:text-sm font-semibold text-white">
                    Browser membatasi pemutaran otomatis
                  </p>
                  <button
                    type="button"
                    onClick={handleUnlockAutoplay}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Klik untuk Sinkronkan Video</span>
                  </button>
                </div>
              )}

              {/* Expand Video Button Container: Hidden by default, only visible on hover */}
              {!isExpandedVideo && (
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setIsExpandedVideo(true)}
                    className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-black/85 hover:bg-black text-white text-xs font-bold backdrop-blur-md border border-white/20 shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Expand Video</span>
                  </button>
                </div>
              )}

              {/* Floating Return / Minimize Button in Expanded Mode (Only visible when video is hovered) */}
              {isExpandedVideo && (
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExpandedVideo(false);
                      setIsExpandedPlaylistOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/85 hover:bg-black text-white font-bold text-xs shadow-2xl backdrop-blur-md border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    title="Tampilan Normal"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Normal</span>
                  </button>
                </div>
              )}

              {/* Discord-style Floating Playlist Toggle Button in Expanded Mode */}
              {/* Only visible when video is hovered (> only appears on hover video) */}
              {/* Text 'Playlist' only appears when button itself is hovered */}
              {isExpandedVideo && !isExpandedPlaylistOpen && (
                <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                  <button
                    type="button"
                    onClick={() => setIsExpandedPlaylistOpen(true)}
                    className="group/pill flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/85 hover:bg-black text-white font-bold text-xs shadow-2xl backdrop-blur-md border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    title="Buka Playlist"
                  >
                    <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover/pill:max-w-[80px] group-hover/pill:opacity-100 transition-all duration-300 text-xs font-semibold">
                      Playlist
                    </span>
                    <ChevronRight className="w-4 h-4 stroke-[2.5] shrink-0" />
                  </button>
                </div>
              )}

              {/* Discord-style Slide-in Playlist Drawer when expanded */}
              {isExpandedVideo && isExpandedPlaylistOpen && (
                <>
                  {/* Backdrop click to close */}
                  <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-xs z-35 animate-in fade-in duration-200"
                    onClick={() => setIsExpandedPlaylistOpen(false)}
                  />

                  {/* Drawer Panel */}
                  <div className="absolute inset-y-0 left-0 z-40 w-full max-w-sm sm:max-w-md bg-background/95 backdrop-blur-2xl border-r border-border shadow-2xl flex flex-col p-4 animate-in slide-in-from-left duration-200">
                    <div className="flex items-center justify-between pb-3 border-b border-border/60 shrink-0">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsExpandedPlaylistOpen(false)}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                          title="Tutup Playlist"
                        >
                          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                        </button>
                        <div>
                          <h3 className="text-sm font-bold text-foreground leading-tight">
                            {channel?.name || 'General Voice'} Playlist
                          </h3>
                          <p className="text-[11px] text-muted-foreground">
                            Video{' '}
                            {Math.max(
                              1,
                              ytPlaylist.findIndex((v) => v.id === activeVideoId) + 1,
                            )}
                            /{Math.max(ytPlaylist.length, 1)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderHostPopover()}
                        <button
                          type="button"
                          onClick={() => setIsExpandedPlaylistOpen(false)}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Playlist items scroll container */}
                    <div className="flex-1 space-y-2 overflow-y-auto pr-1 pt-3 [scrollbar-width:thin]">
                      {renderPlaylistItems()}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Realtime Synced Video Control Bar (Hidden when expanded) */}
            {!isExpandedVideo && renderSyncedControlBar()}

            {/* Mobile / Tablet Segmented Tabs for overflow management */}
            {!isExpandedVideo && (
              <div className="md:hidden flex items-center border border-border bg-card/60 p-1 rounded-xl shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => setMobileTab('browse')}
                  className={cn(
                    'flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                    mobileTab === 'browse'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Pilih Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('playlist')}
                  className={cn(
                    'flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                    mobileTab === 'playlist'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  <ListVideo className="w-3.5 h-3.5" />
                  <span>Playlist ({ytPlaylist.length || 1})</span>
                </button>
              </div>
            )}

            {/* Playlist Content (Visible when !isExpandedVideo) */}
            {!isExpandedVideo && (
              <div
                className={cn(
                  'flex-col gap-3',
                  mobileTab === 'playlist' ? 'flex flex-1 min-h-0' : 'hidden md:flex md:flex-1 md:min-h-0',
                )}
              >
                {/* Header: Title + Host pill */}
                <div className="flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="text-sm font-bold text-foreground leading-tight">
                      {channel?.name || 'General Voice'} Playlist
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Video{' '}
                      {Math.max(
                        1,
                        ytPlaylist.findIndex((v) => v.id === activeVideoId) + 1,
                      )}
                      /{Math.max(ytPlaylist.length, 1)}
                    </p>
                  </div>

                  {renderHostPopover()}
                </div>

                {/* Playlist items scroll container */}
                <div className="flex-1 space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
                  {renderPlaylistItems()}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (Desktop) or Main Browse Area (Mobile when mobileTab === 'browse') */}
          <div
            className={cn(
              'flex-1 min-h-0 flex flex-col py-3 md:py-4 gap-3 md:gap-4 overflow-y-auto [scrollbar-width:thin]',
              isExpandedVideo ? 'hidden' : (mobileTab === 'browse' ? 'flex' : 'hidden md:flex'),
              CHANNEL_HORIZONTAL_PADDING,
            )}
          >
            {/* Sticky Search Header Bar */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md pt-1 pb-3 border-b border-border/50 flex flex-col gap-2.5 shrink-0 -mx-4 px-4 sm:-mx-6 sm:px-6 shadow-xs">
              <form onSubmit={handleSearchSubmit} className="relative w-full shrink-0 flex items-center">
                <input
                  type="text"
                  value={ytSearchQuery}
                  onChange={(e) => setYtSearchQuery(e.target.value)}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData('text');
                    const match = pasted.match(
                      /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
                    );
                    if (match) {
                      e.preventDefault();
                      handlePlayYouTubeUrl(pasted);
                      setYtSearchQuery('');
                      setSubmittedSearchQuery('');
                    }
                  }}
                  placeholder="Ketik lalu tekan Enter / Paste URL YouTube..."
                  className="w-full bg-muted/60 border border-border rounded-full pl-5 pr-20 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {ytSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setYtSearchQuery('');
                        if (submittedSearchQuery) setSubmittedSearchQuery('');
                      }}
                      className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      title="Hapus pencarian"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="p-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors cursor-pointer active:scale-95"
                    title="Cari (Enter)"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>

              {/* Category Badges */}
              <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] shrink-0">
                {ytCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setYtCategory(cat.id);
                      setYtSearchQuery('');
                      setSubmittedSearchQuery('');
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
                      ytCategory === cat.id && !submittedSearchQuery
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-card border border-border text-foreground/80 hover:text-foreground hover:bg-muted',
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Section Title */}
            <div className="flex items-center gap-2 text-foreground font-bold text-sm shrink-0">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
              <span>{submittedSearchQuery ? `Hasil Pencarian: "${submittedSearchQuery}"` : 'Trending Videos'}</span>
            </div>

            {ytIsSearching && (
              <div className="py-8 flex items-center justify-center text-xs text-muted-foreground">
                Memuat video YouTube...
              </div>
            )}

            {ytSearchError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {ytSearchError}
              </div>
            )}

            {/* Responsive Video Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pb-4">
              {ytVideos.map((video) => {
                const isQueuedOrPlaying =
                  activeVideoId === video.id || ytPlaylist.some((p) => p.id === video.id);
                return (
                  <div
                    key={video.id}
                    onClick={() => handleSelectVideo(video)}
                    className="group cursor-pointer flex flex-col"
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-card border border-border group-hover:border-primary/40 transition-all">
                      <img
                        src={video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.src.includes('mqdefault')) {
                            target.src = `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`;
                          }
                        }}
                      />

                      {isQueuedOrPlaying ? (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <div className="w-9 h-9 rounded-full bg-[#23a55a] flex items-center justify-center text-white shadow-xl">
                            <Check className="w-5 h-5 stroke-[3]" />
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleAddToQueue(e, video)}
                          title="Add to queue"
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg cursor-pointer"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      )}

                      {video.duration && (
                        <span className="absolute bottom-1.5 right-1.5 bg-black/85 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                          {video.duration}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-col">
                      <p className="text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {video.title}
                      </p>
                      <span className="text-[11px] text-muted-foreground mt-1 truncate">
                        {video.channel}
                      </span>
                      <span className="text-[11px] text-muted-foreground mt-0.5">
                        {[video.views, video.uploadedAt].filter(Boolean).join(' • ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Empty / Idle State when no video is playing yet */
        <div
          className={cn(
            'flex-1 min-h-0 flex flex-col overflow-y-auto [scrollbar-width:thin] bg-background pb-4 gap-4',
            CHANNEL_HORIZONTAL_PADDING,
          )}
        >
          {/* Fixed / Sticky Header: Host Popover, Search Bar, and Categories */}
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md pt-3 pb-3 border-b border-border/50 flex flex-col gap-3 shrink-0 -mx-4 px-4 sm:-mx-6 sm:px-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              {renderHostPopover()}

              <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xl flex items-center">
                <input
                  type="text"
                  value={ytSearchQuery}
                  onChange={(e) => setYtSearchQuery(e.target.value)}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData('text');
                    const match = pasted.match(
                      /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
                    );
                    if (match) {
                      e.preventDefault();
                      handlePlayYouTubeUrl(pasted);
                      setYtSearchQuery('');
                      setSubmittedSearchQuery('');
                    }
                  }}
                  placeholder="Ketik kata kunci atau tempel URL YouTube..."
                  className="w-full bg-muted/60 border border-border rounded-full pl-5 pr-20 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-400 transition-colors"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {ytSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setYtSearchQuery('');
                        if (submittedSearchQuery) setSubmittedSearchQuery('');
                      }}
                      className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      title="Hapus pencarian"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="p-1.5 rounded-full bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer active:scale-95"
                    title="Cari (Enter)"
                    aria-label="Cari"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] shrink-0">
              {ytCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setYtCategory(cat.id);
                    setYtSearchQuery('');
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
                    ytCategory === cat.id && !ytSearchQuery
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-card border border-border text-foreground/80 hover:text-foreground hover:bg-muted',
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-foreground font-bold text-sm shrink-0">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span>{submittedSearchQuery || ytSearchQuery ? `Hasil Pencarian: "${submittedSearchQuery || ytSearchQuery}"` : 'Trending Videos'}</span>
          </div>

          {ytIsSearching && (
            <div className="py-8 flex items-center justify-center text-xs text-muted-foreground">
              Memuat video YouTube...
            </div>
          )}

          {ytSearchError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              {ytSearchError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {ytVideos.map((video) => (
              <div
                key={video.id}
                onClick={() => handleSelectVideo(video)}
                className="group cursor-pointer flex flex-col"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-card border border-border group-hover:border-primary/40 transition-all">
                  <img
                    src={video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('mqdefault')) {
                        target.src = `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`;
                      }
                    }}
                  />

                  <button
                    type="button"
                    onClick={(e) => handleAddToQueue(e, video)}
                    title="Add to queue"
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  {video.duration && (
                    <span className="absolute bottom-1.5 right-1.5 bg-black/85 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                      {video.duration}
                    </span>
                  )}
                </div>

                <div className="mt-2.5 flex flex-col">
                  <p className="text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {video.title}
                  </p>
                  <span className="text-[11px] text-muted-foreground mt-1 truncate">
                    {video.channel}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    {[video.views, video.uploadedAt].filter(Boolean).join(' • ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
