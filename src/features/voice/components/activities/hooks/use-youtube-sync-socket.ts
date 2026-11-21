import { useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { YouTubeVideoItem } from './use-youtube-player';

export interface UseYouTubeSyncSocketOptions {
  socket?: Socket | null;
  channelId: string;
  currentUser?: any;
  playerRef: React.MutableRefObject<any>;
  activeVideoIdRef: React.MutableRefObject<string | null>;
  ignoreLocalStateChangeUntilRef: React.MutableRefObject<number>;
  lastSeekTimestampRef: React.MutableRefObject<number>;
  lastKnownTimeRef: React.MutableRefObject<number>;
  initialSeekTimeRef: React.MutableRefObject<number>;
  isMeHostRef: React.MutableRefObject<boolean>;
  ytPlaylistRef: React.MutableRefObject<YouTubeVideoItem[]>;
  hostUserIdRef: React.MutableRefObject<string>;
  hostUserNameRef: React.MutableRefObject<string>;
  hostUserAvatarRef: React.MutableRefObject<string | null>;
  allowEveryoneEditRef: React.MutableRefObject<boolean>;
  isPlayingRef: React.MutableRefObject<boolean>;

  setActiveVideoId: (videoId: string) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setIsExpandedVideo: (expanded: boolean) => void;
  setNeedsUserGesture: (needed: boolean) => void;
  setYtPlaylist: React.Dispatch<React.SetStateAction<YouTubeVideoItem[]>>;
  setHostUserId: (id: string) => void;
  setHostUserName: (name: string) => void;
  setHostUserAvatar: (avatar: string | null) => void;
  setAllowEveryoneEdit: (allow: boolean) => void;
}

export function useYouTubeSyncSocket(options: UseYouTubeSyncSocketOptions) {
  const {
    socket,
    channelId,
    currentUser,
    playerRef,
    activeVideoIdRef,
    ignoreLocalStateChangeUntilRef,
    lastSeekTimestampRef,
    lastKnownTimeRef,
    initialSeekTimeRef,
    isMeHostRef,
    ytPlaylistRef,
    hostUserIdRef,
    hostUserNameRef,
    hostUserAvatarRef,
    allowEveryoneEditRef,
    isPlayingRef,
    setActiveVideoId,
    setIsPlaying,
    setCurrentTime,
    setIsExpandedVideo,
    setNeedsUserGesture,
    setYtPlaylist,
    setHostUserId,
    setHostUserName,
    setHostUserAvatar,
    setAllowEveryoneEdit,
  } = options;

  useEffect(() => {
    if (!socket) return;

    const handleYouTubeSocketEvent = (data: any) => {
      if (!data) return;
      if (data.channelId && data.channelId !== channelId) return;

      if (data.action === 'YOUTUBE_CHANGE_VIDEO') {
        const { videoId } = data.payload || {};
        if (videoId && videoId !== activeVideoIdRef.current) {
          ignoreLocalStateChangeUntilRef.current = Date.now() + 3500;
          initialSeekTimeRef.current = 0;
          setIsPlaying(true);
          setActiveVideoId(videoId);
          setIsExpandedVideo(false);
          // If player already exists, trigger play after load with guaranteed autoplay fallback
          if (playerRef.current) {
            setTimeout(() => {
              try {
                const res = playerRef.current?.playVideo?.();
                if (res && typeof res.catch === 'function') {
                  res.catch(() => {
                    try {
                      playerRef.current?.mute?.();
                      playerRef.current?.playVideo?.();
                      setNeedsUserGesture(true);
                    } catch (err) {}
                  });
                }
              } catch (e) {
                try {
                  playerRef.current?.mute?.();
                  playerRef.current?.playVideo?.();
                  setNeedsUserGesture(true);
                } catch (err) {}
              }
            }, 800);
          }
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
              res.catch(() => {
                try {
                  playerRef.current?.mute?.();
                  playerRef.current?.playVideo?.();
                  setNeedsUserGesture(true);
                } catch (err) {}
              });
            }
          } catch (e) {
            try {
              playerRef.current?.mute?.();
              playerRef.current?.playVideo?.();
              setNeedsUserGesture(true);
            } catch (err) {}
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
      } else if (data.action === 'YOUTUBE_RATE_CHANGE') {
        const { rate, senderId } = data.payload || {};
        if (senderId && (senderId === currentUser?.id || senderId === socket.id)) return;
        if (typeof rate === 'number' && playerRef.current) {
          try {
            playerRef.current.setPlaybackRate?.(rate);
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
        const {
          hostUserId: nextHostId,
          hostUserName: nextHostName,
          hostUserAvatar: nextHostAvatar,
        } = data.payload || {};
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
              try {
                const res = playerRef.current.playVideo?.();
                if (res && typeof res.catch === 'function') {
                  res.catch(() => {
                    try {
                      playerRef.current?.mute?.();
                      playerRef.current?.playVideo?.();
                      setNeedsUserGesture(true);
                    } catch (err) {}
                  });
                }
              } catch (e) {
                try {
                  playerRef.current?.mute?.();
                  playerRef.current?.playVideo?.();
                  setNeedsUserGesture(true);
                } catch (err) {}
              }
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
            channelId,
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
      channelId,
      action: 'YOUTUBE_QUERY_STATE',
    });

    return () => {
      socket.off('COMMUNITY_CALL_ACTIVITY_EVENT', handleYouTubeSocketEvent);
    };
  }, [socket, channelId, currentUser?.id]);
}
