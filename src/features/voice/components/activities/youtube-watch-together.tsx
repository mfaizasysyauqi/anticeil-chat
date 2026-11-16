import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import {
  Play,
  ChevronRight,
  ChevronLeft,
  Flame,
  Maximize2,
  Minimize2,
  ListVideo,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import { ColonyChannel } from '@/chat/chat-types';

import {
  useYouTubePlayer,
  channelWatchStateCache,
  type YouTubeVideoItem,
  type ChannelWatchStateCache,
} from './hooks/use-youtube-player';
import { useYouTubeSyncSocket } from './hooks/use-youtube-sync-socket';
import { useYouTubeSearch } from './hooks/use-youtube-search';
import { YouTubeHostPopover } from './youtube-host-popover';
import { YouTubeSearchBar } from './youtube-search-bar';
import { YouTubeVideoCard } from './youtube-video-card';
import { YouTubePlaylistView } from './youtube-playlist-view';

export type { YouTubeVideoItem, ChannelWatchStateCache };
export * from './youtube-utils';

export interface YouTubeWatchTogetherProps {
  channel: ColonyChannel;
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
  const cachedState = channelWatchStateCache.get(channel.id);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(() => cachedState?.videoId || null);
  const [ytSearchQuery, setYtSearchQuery] = useState('');
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState('');
  const [searchTriggerCount, setSearchTriggerCount] = useState(0);
  const [ytCategory, setYtCategory] = useState<string>('semua');
  const [isExpandedVideo, setIsExpandedVideo] = useState(false);
  const [isExpandedPlaylistOpen, setIsExpandedPlaylistOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'browse' | 'playlist'>('browse');

  // Host & Permission States
  const [hostUserId, setHostUserId] = useState<string>(
    () => cachedState?.hostUserId || currentUser?.id || 'me',
  );
  const [hostUserName, setHostUserName] = useState<string>(
    () => cachedState?.hostUserName || currentUserName || 'You',
  );
  const [hostUserAvatar, setHostUserAvatar] = useState<string | null>(
    () => cachedState?.hostUserAvatar ?? (currentUser?.imageUrl || currentUser?.avatar || null),
  );
  const [allowEveryoneEdit, setAllowEveryoneEdit] = useState<boolean>(
    () => cachedState?.allowEveryoneEdit ?? true,
  );
  const [isHostMenuOpen, setIsHostMenuOpen] = useState(false);

  const isMeHost = !hostUserId || hostUserId === currentUser?.id || hostUserId === 'me';
  const canEdit = allowEveryoneEdit || isMeHost;

  const handleSelectVideoRef = useRef<(video: YouTubeVideoItem) => void>(() => {});

  const [ytPlaylist, setYtPlaylist] = useState<YouTubeVideoItem[]>([]);
  const ytPlaylistRef = useRef<Array<any>>([]);
  ytPlaylistRef.current = ytPlaylist;

  const {
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
  } = useYouTubePlayer({
    channelId: channel.id,
    activeVideoId,
    canEdit,
    isMeHost,
    socket,
    currentUser,
    onVideoEnded: () => {
      if (isMeHostRef.current && ytPlaylistRef.current.length > 0) {
        const currentIndex = ytPlaylistRef.current.findIndex(
          (v) => v.id === activeVideoIdRef.current,
        );
        if (currentIndex !== -1 && currentIndex < ytPlaylistRef.current.length - 1) {
          const nextVideo = ytPlaylistRef.current[currentIndex + 1];
          handleSelectVideoRef.current?.(nextVideo);
        }
      }
    },
    getUnmountSnapshot: () => ({
      playlist: ytPlaylistRef.current,
      hostUserId,
      hostUserName,
      hostUserAvatar,
      allowEveryoneEdit,
    }),
  });

  // Sync state refs to keep socket event handlers stable
  const isMeHostRef = useRef(isMeHost);
  isMeHostRef.current = isMeHost;
  const activeVideoIdRef = useRef(activeVideoId);
  activeVideoIdRef.current = activeVideoId;
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

  // Search hook
  const { ytVideos, setYtVideos, ytIsSearching, ytSearchError } = useYouTubeSearch({
    submittedSearchQuery,
    ytCategory,
    searchTriggerCount,
  });

  // Realtime Socket Sync
  useYouTubeSyncSocket({
    socket,
    channelId: channel.id,
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
  });

  // Keyboard Navigation: Skip backward (-5s) and forward (+5s) via ArrowLeft / ArrowRight
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.closest('input, textarea, [contenteditable="true"]'))
      ) {
        return;
      }

      if (!activeVideoId) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleJumpRelative(-5);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleJumpRelative(5);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeVideoId, handleJumpRelative]);

  const handleSelectVideo = (video: YouTubeVideoItem) => {
    handleSelectVideoRef.current = handleSelectVideo;
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
      payload: { videoId: video.id, isPlaying: true },
    });

    setTimeout(() => {
      socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
        channelId: channel.id,
        action: 'YOUTUBE_PLAY',
        payload: { videoId: video.id, currentTime: 0, senderId: currentUser?.id || socket?.id },
      });
    }, 1500);

    socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId: channel.id,
      action: 'YOUTUBE_UPDATE_PLAYLIST',
      payload: { playlist: nextPlaylist },
    });
  };

  const handleAddToQueue = (e: React.MouseEvent, video: YouTubeVideoItem) => {
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

  const renderHostPopover = (align: 'left' | 'right' = 'left') => (
    <YouTubeHostPopover
      isMeHost={isMeHost}
      currentUser={currentUser}
      currentUserName={currentUserName}
      hostUserAvatar={hostUserAvatar}
      hostUserName={hostUserName}
      hostUserId={hostUserId}
      isHostMenuOpen={isHostMenuOpen}
      setIsHostMenuOpen={setIsHostMenuOpen}
      allowEveryoneEdit={allowEveryoneEdit}
      handleToggleAllowEveryone={handleToggleAllowEveryone}
      participants={participants}
      handleTransferHost={handleTransferHost}
      handleClaimHost={handleClaimHost}
      align={align}
    />
  );

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
                    'w-full md:w-[44%] lg:w-[42%] border-b md:border-b-0 md:border-r border-border pt-2 pb-1.5 md:py-4 gap-2 md:gap-4 shrink-0 md:shrink md:overflow-y-auto [scrollbar-width:thin]',
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
              <div
                id="yt-watch-together-player-frame"
                className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
              />

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

              {isExpandedVideo && isExpandedPlaylistOpen && (
                <>
                  <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-xs z-35 animate-in fade-in duration-200"
                    onClick={() => setIsExpandedPlaylistOpen(false)}
                  />

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
                        {renderHostPopover('right')}
                        <button
                          type="button"
                          onClick={() => setIsExpandedPlaylistOpen(false)}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2 overflow-y-auto pr-1 pt-3 [scrollbar-width:thin]">
                      <YouTubePlaylistView
                        playlist={ytPlaylist}
                        activeVideoId={activeVideoId}
                        currentUserName={currentUserName}
                        currentUser={currentUser}
                        participants={participants}
                        ytVideos={ytVideos}
                        canEdit={canEdit}
                        onPlayVideo={(item) => {
                          if (!canEdit) {
                            toast.info('Hanya host yang dapat mengganti video.');
                            return;
                          }
                          setActiveVideoId(item.id);
                          setIsPlaying(true);
                          ignoreLocalStateChangeUntilRef.current = Date.now() + 3500;
                          socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
                            channelId: channel.id,
                            action: 'YOUTUBE_CHANGE_VIDEO',
                            payload: { videoId: item.id, isPlaying: true },
                          });
                          setTimeout(() => {
                            socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
                              channelId: channel.id,
                              action: 'YOUTUBE_PLAY',
                              payload: { videoId: item.id, currentTime: 0, senderId: currentUser?.id || socket?.id },
                            });
                          }, 1500);
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile / Tablet Tabs */}
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

            {/* Playlist Content */}
            {!isExpandedVideo && (
              <div
                className={cn(
                  'flex-col gap-3',
                  mobileTab === 'playlist' ? 'flex flex-1 min-h-0' : 'hidden md:flex md:flex-1 md:min-h-0',
                )}
              >
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

                <div className="flex-1 space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
                  <YouTubePlaylistView
                    playlist={ytPlaylist}
                    activeVideoId={activeVideoId}
                    currentUserName={currentUserName}
                    currentUser={currentUser}
                    participants={participants}
                    ytVideos={ytVideos}
                    canEdit={canEdit}
                    onPlayVideo={(item) => {
                      if (!canEdit) {
                        toast.info('Hanya host yang dapat mengganti video.');
                        return;
                      }
                      setActiveVideoId(item.id);
                      setIsPlaying(true);
                      ignoreLocalStateChangeUntilRef.current = Date.now() + 3500;
                      socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
                        channelId: channel.id,
                        action: 'YOUTUBE_CHANGE_VIDEO',
                        payload: { videoId: item.id, isPlaying: true },
                      });
                      setTimeout(() => {
                        socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
                          channelId: channel.id,
                          action: 'YOUTUBE_PLAY',
                          payload: { videoId: item.id, currentTime: 0, senderId: currentUser?.id || socket?.id },
                        });
                      }, 1500);
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column (Desktop) or Browse Area (Mobile) */}
          <div
            className={cn(
              'flex-1 min-h-0 flex flex-col pt-0 pb-3 md:pb-4 gap-2 md:gap-3 overflow-y-auto overflow-x-hidden [scrollbar-width:thin]',
              isExpandedVideo ? 'hidden' : (mobileTab === 'browse' ? 'flex' : 'hidden md:flex'),
              CHANNEL_HORIZONTAL_PADDING,
            )}
          >
            <div className="sticky top-0 z-20 bg-background pt-3 pb-2.5 border-b border-border/50 flex flex-col gap-2 shrink-0 -mx-3 px-3 sm:-mx-4 sm:px-4 shadow-xs">
              <YouTubeSearchBar
                query={ytSearchQuery}
                setQuery={setYtSearchQuery}
                onSubmit={handleSearchSubmit}
                onPasteUrl={handlePlayYouTubeUrl}
              />
            </div>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pb-4">
              {ytVideos.map((video) => (
                <YouTubeVideoCard
                  key={video.id}
                  video={video}
                  isQueuedOrPlaying={activeVideoId === video.id || ytPlaylist.some((p) => p.id === video.id)}
                  onSelectVideo={handleSelectVideo}
                  onAddToQueue={handleAddToQueue}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Empty / Idle State */
        <div
          className={cn(
            'flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden [scrollbar-width:thin] bg-background pb-4 gap-2',
            CHANNEL_HORIZONTAL_PADDING,
          )}
        >
          <div className="sticky top-0 z-30 bg-background pt-3 pb-2.5 border-b border-border/50 flex flex-col gap-2 shrink-0 -mx-3 px-3 sm:-mx-4 sm:px-4 shadow-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              {renderHostPopover()}
              <YouTubeSearchBar
                query={ytSearchQuery}
                setQuery={setYtSearchQuery}
                onSubmit={handleSearchSubmit}
                onPasteUrl={handlePlayYouTubeUrl}
                placeholder="Ketik kata kunci atau tempel URL YouTube..."
                className="flex-1 max-w-xl"
              />
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
              <YouTubeVideoCard
                key={video.id}
                video={video}
                isQueuedOrPlaying={activeVideoId === video.id || ytPlaylist.some((p) => p.id === video.id)}
                onSelectVideo={handleSelectVideo}
                onAddToQueue={handleAddToQueue}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
export default YouTubeWatchTogether;
