import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import {
  Play,
  Plus,
  Check,
  Search,
  ChevronRight,
  ChevronDown,
  Flame,
  Maximize2,
  Lock,
  ListVideo,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import { CommunityChannel } from '@/chat/chat-types';
import { CommunityAvatar } from '@/chat/chat-avatar';

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
  const [ytCategory, setYtCategory] = useState<string>('semua');
  const [isExpandedVideo, setIsExpandedVideo] = useState(false);
  const [mobileTab, setMobileTab] = useState<'browse' | 'playlist'>('browse');

  // Host & Permission States
  const [hostUserId, setHostUserId] = useState<string>(() => currentUser?.id || 'me');
  const [hostUserName, setHostUserName] = useState<string>(() => currentUserName || 'You');
  const [hostUserAvatar, setHostUserAvatar] = useState<string | null>(
    () => currentUser?.imageUrl || currentUser?.avatar || null,
  );
  const [allowEveryoneEdit, setAllowEveryoneEdit] = useState<boolean>(true);
  const [isHostMenuOpen, setIsHostMenuOpen] = useState(false);

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

  const [ytIsSearching, setYtIsSearching] = useState(false);
  const [ytSearchError, setYtSearchError] = useState<string | null>(null);
  const ytSearchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const isMeHost = !hostUserId || hostUserId === currentUser?.id || hostUserId === 'me';
  const canEdit = allowEveryoneEdit || isMeHost;

  const ytCategories = [
    { id: 'semua', label: '🔥 Trending', q: '', categoryId: '' },
    { id: 'music', label: '🎵 Musik', q: '', categoryId: '10' },
    { id: 'gaming', label: '🎮 Gaming', q: '', categoryId: '20' },
    { id: 'tech', label: '💻 Tech', q: 'programming tech coding tutorial', categoryId: '28' },
    { id: 'entertainment', label: '🎉 Hiburan', q: '', categoryId: '24' },
    { id: 'lofi', label: '☕ Lofi', q: 'lofi hip hop radio beats', categoryId: '' },
  ];

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

  // Socket Activity Sync
  useEffect(() => {
    if (!socket) return;

    const handleYouTubeSocketEvent = (data: any) => {
      if (!data) return;
      if (data.channelId && data.channelId !== channel.id) return;

      if (data.action === 'YOUTUBE_CHANGE_VIDEO') {
        const { videoId } = data.payload || {};
        if (videoId) {
          setActiveVideoId(videoId);
          setIsExpandedVideo(false);
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
        } = data.payload || {};
        if (videoId) setActiveVideoId(videoId);
        if (Array.isArray(playlist)) setYtPlaylist(playlist);
        if (syncHostId) setHostUserId(syncHostId);
        if (syncHostName) setHostUserName(syncHostName);
        if (syncHostAvatar !== undefined) setHostUserAvatar(syncHostAvatar);
        if (typeof syncAllow === 'boolean') setAllowEveryoneEdit(syncAllow);
      } else if (data.action === 'YOUTUBE_QUERY_STATE') {
        // If I am host, reply to newly joined participant
        if (isMeHost) {
          socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
            channelId: channel.id,
            action: 'YOUTUBE_SYNC_STATE',
            payload: {
              videoId: activeVideoId,
              playlist: ytPlaylist,
              hostUserId,
              hostUserName,
              hostUserAvatar,
              allowEveryoneEdit,
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
  }, [
    socket,
    channel.id,
    isMeHost,
    activeVideoId,
    ytPlaylist,
    hostUserId,
    hostUserName,
    hostUserAvatar,
    allowEveryoneEdit,
  ]);

  // YouTube API Search / Category fetch
  useEffect(() => {
    if (ytSearchDebounce.current) clearTimeout(ytSearchDebounce.current);

    const catObj = ytCategories.find((c) => c.id === ytCategory);
    const rawQ = ytSearchQuery.trim();

    if (rawQ.includes('youtube.com') || rawQ.includes('youtu.be')) return;
    if (rawQ.length === 1) return;

    const cacheKey = rawQ ? `search:${rawQ.toLowerCase()}` : `cat:${ytCategory}`;

    if (ytCacheRef.current.has(cacheKey)) {
      setYtVideos(ytCacheRef.current.get(cacheKey)!);
      setYtIsSearching(false);
      setYtSearchError(null);
      return;
    }

    ytSearchDebounce.current = setTimeout(async () => {
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

        ytCacheRef.current.set(cacheKey, items);
        setYtVideos(items);
      } catch (e: any) {
        setYtSearchError(e.message ?? 'Gagal memuat video YouTube');
        setYtVideos([]);
      } finally {
        setYtIsSearching(false);
      }
    }, rawQ ? 500 : 0);

    return () => {
      if (ytSearchDebounce.current) clearTimeout(ytSearchDebounce.current);
    };
  }, [ytSearchQuery, ytCategory]);

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
    }
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

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background select-none">
      {activeVideoId && isExpandedVideo ? (
        <div className="relative w-full h-full bg-black flex flex-col">
          <button
            onClick={() => setIsExpandedVideo(false)}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-zinc-900 font-bold text-xs shadow-2xl hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>Playlist</span>
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          <iframe
            src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=1&enablejsapi=1&rel=0`}
            title="YouTube Watch Together"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      ) : activeVideoId && !isExpandedVideo ? (
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden bg-background">
          {/* Left Column (Desktop) or Top Section (Mobile): Video Player + Playlist */}
          <div
            className={cn(
              'w-full md:w-[44%] lg:w-[42%] flex flex-col border-b md:border-b-0 md:border-r border-border py-3 md:py-4 gap-3 md:gap-4 shrink-0 md:shrink md:overflow-y-auto [scrollbar-width:thin]',
              mobileTab === 'browse' ? 'md:flex' : 'flex',
              CHANNEL_HORIZONTAL_PADDING,
            )}
          >
            {/* Video Player Box with Hover-Only Expand Button */}
            <div className="relative aspect-video max-h-[220px] sm:max-h-[260px] md:max-h-none mx-auto w-full rounded-2xl overflow-hidden bg-black border border-border shadow-2xl group shrink-0">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=1&enablejsapi=1&rel=0`}
                title="YouTube Watch Together"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
              {/* Expand Video Button Container: Hidden by default, only visible on hover */}
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
            </div>

            {/* Mobile / Tablet Segmented Tabs for overflow management */}
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

            {/* Playlist Content (Visible on desktop always; on mobile only when mobileTab === 'playlist') */}
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
                {ytPlaylist.length === 0 ? (
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
                ) : (
                  ytPlaylist.map((item, idx) => {
                    const isPlaying = item.id === activeVideoId;
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
                          isPlaying
                            ? 'bg-card border-primary/50 shadow-sm'
                            : 'bg-card/70 border-border hover:border-border/80 hover:bg-card',
                        )}
                      >
                        <Play
                          className={cn(
                            'w-3.5 h-3.5 shrink-0 ml-1',
                            isPlaying ? 'fill-current text-primary' : 'text-muted-foreground',
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
                          {isPlaying ? (
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
                              isPlaying ? 'text-foreground' : 'text-foreground/80',
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
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column (Desktop) or Main Browse Area (Mobile when mobileTab === 'browse') */}
          <div
            className={cn(
              'flex-1 min-h-0 flex flex-col py-3 md:py-4 gap-3 md:gap-4 overflow-y-auto [scrollbar-width:thin]',
              mobileTab === 'browse' ? 'flex' : 'hidden md:flex',
              CHANNEL_HORIZONTAL_PADDING,
            )}
          >
            {/* Search Input Bar */}
            <div className="relative w-full shrink-0">
              <input
                type="text"
                value={ytSearchQuery}
                onChange={(e) => setYtSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePlayYouTubeUrl(ytSearchQuery);
                  }
                }}
                placeholder="Search or paste YouTube URL"
                className="w-full bg-muted/60 border border-border rounded-full pl-5 pr-11 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Category Badges */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] shrink-0">
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

            {/* Section Title */}
            <div className="flex items-center gap-2 text-foreground font-bold text-sm shrink-0">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
              <span>{ytSearchQuery ? `Hasil Pencarian: "${ytSearchQuery}"` : 'Trending Videos'}</span>
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
            'flex-1 min-h-0 flex flex-col overflow-y-auto [scrollbar-width:thin] bg-background py-4 gap-4',
            CHANNEL_HORIZONTAL_PADDING,
          )}
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
            {renderHostPopover()}

            <div className="relative flex-1 max-w-xl">
              <input
                type="text"
                value={ytSearchQuery}
                onChange={(e) => setYtSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePlayYouTubeUrl(ytSearchQuery);
                  }
                }}
                placeholder="Search or paste YouTube URL"
                className="w-full bg-muted/60 border border-border rounded-full pl-5 pr-11 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] shrink-0">
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

          <div className="flex items-center gap-2 text-foreground font-bold text-sm shrink-0">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span>{ytSearchQuery ? `Hasil Pencarian: "${ytSearchQuery}"` : 'Trending Videos'}</span>
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
