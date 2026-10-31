import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import {
  Play,
  Plus,
  Check,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Flame,
  Maximize2,
  Minimize2,
  Lock,
  ListVideo,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import { ColonyChannel } from '@/chat/chat-types';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { api } from '@/lib/api';

import {
  useYouTubePlayer,
  channelWatchStateCache,
  type YouTubeVideoItem,
  type ChannelWatchStateCache,
} from './hooks/use-youtube-player';
import { useYouTubeSyncSocket } from './hooks/use-youtube-sync-socket';
import { YouTubeHostPopover } from './youtube-host-popover';

export type { YouTubeVideoItem, ChannelWatchStateCache };

// Pure formatting helpers moved to module level (avoid re-allocating per render)
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

  const [ytVideos, setYtVideos] = useState<YouTubeVideoItem[]>([]);
  const [ytPlaylist, setYtPlaylist] = useState<YouTubeVideoItem[]>([]);
  ytPlaylistRef.current = ytPlaylist;

  const [ytIsSearching, setYtIsSearching] = useState(false);
  const [ytSearchError, setYtSearchError] = useState<string | null>(null);
  const ytCacheRef = useRef<Map<string, YouTubeVideoItem[]>>(new Map());

  const ytCategories = [
    { id: 'semua', label: '🔥 Trending', q: '', categoryId: '' },
    { id: 'music', label: '🎵 Musik', q: '', categoryId: '10' },
    { id: 'gaming', label: '🎮 Gaming', q: '', categoryId: '20' },
    { id: 'tech', label: '💻 Tech', q: 'programming tech coding tutorial', categoryId: '28' },
    { id: 'entertainment', label: '🎉 Hiburan', q: '', categoryId: '24' },
    { id: 'lofi', label: '☕ Lofi', q: 'lofi hip hop radio beats', categoryId: '' },
  ];

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
        let items: YouTubeVideoItem[] = [];

        // 1. Primary: Unlimited Zero-Quota Search & Trending via Backend Scraper
        try {
          const endpoint = rawQ
            ? `/v1/community/youtube/search?q=${encodeURIComponent(rawQ)}`
            : `/v1/community/youtube/search?category=${encodeURIComponent(catObj?.q || ytCategory || '')}`;
          const backendRes = await api.get<{ items: any[] }>(endpoint);
          if (Array.isArray(backendRes?.items) && backendRes.items.length > 0) {
            items = backendRes.items;
          }
        } catch (backendErr) {}

        // 2. Fallback to Google YouTube API v3 if backend didn't return items
        if (items.length === 0) {
          const key = import.meta.env.VITE_YOUTUBE_API_KEY || 'AIzaSyBg-0HDXNw2occXp6_89D4dXxBW0gISbQ4';
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

    // After a short delay, also emit YOUTUBE_PLAY so members who already
    // have the player initialized will start playing at second 0
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

  const handleAddToQueue = (
    e: React.MouseEvent,
    video: YouTubeVideoItem,
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

  // Reusable Search Bar Component (DRY for active player view and idle search view)
  const renderSearchBar = (
    placeholder = 'Ketik lalu tekan Enter / Paste URL YouTube...',
    className?: string,
  ) => (
    <form
      onSubmit={handleSearchSubmit}
      className={cn('relative w-full shrink-0 flex items-center', className)}
    >
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
        placeholder={placeholder}
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
          aria-label="Cari"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </form>
  );

  // Reusable Video Card Component (DRY for active search panel and idle search view)
  const renderVideoCard = (video: YouTubeVideoItem) => {
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
    );
  };

  // Reusable Host Button & Popover Component
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
                name={item.addedBy || 'User'}
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

                    {/* Playlist items scroll container */}
                    <div className="flex-1 space-y-2 overflow-y-auto pr-1 pt-3 [scrollbar-width:thin]">
                      {renderPlaylistItems()}
                    </div>
                  </div>
                </>
              )}
            </div>


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
              'flex-1 min-h-0 flex flex-col pt-0 pb-3 md:py-3 gap-2 md:gap-3 overflow-y-auto [scrollbar-width:thin]',
              isExpandedVideo ? 'hidden' : (mobileTab === 'browse' ? 'flex' : 'hidden md:flex'),
              CHANNEL_HORIZONTAL_PADDING,
            )}
          >
            {/* Sticky Search Header Bar */}
            <div className="sticky top-0 z-20 bg-background pt-1.5 pb-2 border-b border-border/50 flex flex-col gap-2 shrink-0 -mx-4 px-4 sm:-mx-6 sm:px-6 shadow-xs">
              {renderSearchBar()}
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
              {ytVideos.map(renderVideoCard)}
            </div>
          </div>
        </div>
      ) : (
        /* Empty / Idle State when no video is playing yet */
        <div
          className={cn(
            'flex-1 min-h-0 flex flex-col overflow-y-auto [scrollbar-width:thin] bg-background pb-4 gap-2',
            CHANNEL_HORIZONTAL_PADDING,
          )}
        >
          {/* Fixed / Sticky Header: Host Popover, Search Bar, and Categories */}
          <div className="sticky top-0 z-30 bg-background pt-2 pb-1.5 border-b border-border/50 flex flex-col gap-2 shrink-0 -mx-4 px-4 sm:-mx-6 sm:px-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              {renderHostPopover()}
              {renderSearchBar('Ketik kata kunci atau tempel URL YouTube...', 'flex-1 max-w-xl')}
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
            {ytVideos.map(renderVideoCard)}
          </div>
        </div>
      )}
    </div>
  );
}
