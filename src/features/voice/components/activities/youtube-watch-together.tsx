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
import { YouTubePlayerStage } from './youtube-player-stage';

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

  const handleReorderPlaylist = (newPlaylist: YouTubeVideoItem[]) => {
    if (!canEdit) {
      toast.info('Hanya host yang dapat mengatur urutan playlist saat ini.');
      return;
    }
    setYtPlaylist(newPlaylist);
    socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId: channel.id,
      action: 'YOUTUBE_UPDATE_PLAYLIST',
      payload: { playlist: newPlaylist },
    });
  };

  const handleRemovePlaylistItem = (index: number, item: YouTubeVideoItem) => {
    const isMyItem = item.addedBy === currentUserName;
    if (!canEdit && !isMyItem) {
      toast.info('Hanya host yang dapat menghapus video ini dari playlist.');
      return;
    }

    const nextPlaylist = ytPlaylist.filter((_, i) => i !== index);
    setYtPlaylist(nextPlaylist);
    socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId: channel.id,
      action: 'YOUTUBE_UPDATE_PLAYLIST',
      payload: { playlist: nextPlaylist },
    });
    toast.success(`Dihapus dari playlist: ${item.title}`);

    // If the removed item was currently active:
    if (activeVideoId === item.id) {
      if (nextPlaylist.length > 0) {
        const nextIndex = Math.min(index, nextPlaylist.length - 1);
        handleSelectVideo(nextPlaylist[nextIndex]);
      }
    }
  };

  const handlePlayNext = (index: number, item: YouTubeVideoItem) => {
    if (!canEdit) {
      toast.info('Hanya host yang dapat mengatur urutan playlist saat ini.');
      return;
    }
    const currentIndex = ytPlaylist.findIndex((v) => v.id === activeVideoId);
    const targetIndex = currentIndex !== -1 ? currentIndex + 1 : 1;
    if (index === targetIndex || index === currentIndex) return;

    const nextPlaylist = [...ytPlaylist];
    const [removed] = nextPlaylist.splice(index, 1);
    nextPlaylist.splice(targetIndex, 0, removed);

    setYtPlaylist(nextPlaylist);
    socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId: channel.id,
      action: 'YOUTUBE_UPDATE_PLAYLIST',
      payload: { playlist: nextPlaylist },
    });
    toast.success(`Akan diputar berikutnya: ${item.title}`);
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

      if (!existing) {
        fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
          .then((r) => r.json())
          .then((data) => {
            if (data?.title) {
              const enriched: YouTubeVideoItem = {
                id: videoId,
                title: data.title,
                channel: data.author_name || 'YouTube',
                thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                duration: '',
                uploadedAt: 'Direct Link',
              };
              setYtPlaylist((prev) =>
                prev.map((item) => (item.id === videoId ? { ...item, ...enriched } : item)),
              );
            }
          })
          .catch(() => {});
      }
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
          <YouTubePlayerStage
            channel={channel}
            activeVideoId={activeVideoId}
            isExpandedVideo={isExpandedVideo}
            setIsExpandedVideo={setIsExpandedVideo}
            isExpandedPlaylistOpen={isExpandedPlaylistOpen}
            setIsExpandedPlaylistOpen={setIsExpandedPlaylistOpen}
            needsUserGesture={needsUserGesture}
            handleUnlockAutoplay={handleUnlockAutoplay}
            mobileTab={mobileTab}
            setMobileTab={setMobileTab}
            ytPlaylist={ytPlaylist}
            currentUserName={currentUserName}
            currentUser={currentUser}
            participants={participants}
            ytVideos={ytVideos}
            canEdit={canEdit}
            onReorderPlaylist={handleReorderPlaylist}
            onRemovePlaylistItem={handleRemovePlaylistItem}
            onPlayNext={handlePlayNext}
            onPlayPlaylistItem={(item) => {
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
            renderHostPopover={renderHostPopover}
          />

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

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pb-4">
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

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pb-4">
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
