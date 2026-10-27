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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import { CommunityChannel } from '@/chat/chat-types';

export interface YouTubeWatchTogetherProps {
  channel: CommunityChannel;
  currentUserName: string;
  socket: Socket | null;
}

export function YouTubeWatchTogether({
  channel,
  currentUserName,
  socket,
}: YouTubeWatchTogetherProps) {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [ytSearchQuery, setYtSearchQuery] = useState('');
  const [ytCategory, setYtCategory] = useState<string>('semua');
  const [isExpandedVideo, setIsExpandedVideo] = useState(false);
  const [ytVideos, setYtVideos] = useState<Array<{
    id: string;
    title: string;
    channel: string;
    thumbnail: string;
    duration: string;
    views?: string;
    uploadedAt?: string;
  }>>([]);
  const [ytPlaylist, setYtPlaylist] = useState<Array<{
    id: string;
    title: string;
    channel: string;
    thumbnail: string;
    duration: string;
    views?: string;
    uploadedAt?: string;
    addedBy: string;
  }>>([]);
  const [ytIsSearching, setYtIsSearching] = useState(false);
  const [ytSearchError, setYtSearchError] = useState<string | null>(null);
  const ytSearchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ytCacheRef = useRef<Map<string, Array<{ id: string; title: string; channel: string; thumbnail: string; duration: string; views?: string; uploadedAt?: string }>>>(new Map());

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
        let items: Array<{ id: string; title: string; channel: string; thumbnail: string; duration: string; views?: string; uploadedAt?: string }> = [];

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
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
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
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.standard?.url || item.snippet.thumbnails?.default?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
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
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
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
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.standard?.url || item.snippet.thumbnails?.default?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
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
    setActiveVideoId(video.id);
    setIsExpandedVideo(false);
    setYtPlaylist((prev) => {
      if (prev.some((item) => item.id === video.id)) return prev;
      return [
        ...prev,
        {
          ...video,
          addedBy: currentUserName || 'You',
        },
      ];
    });

    socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId: channel.id,
      action: 'YOUTUBE_CHANGE_VIDEO',
      payload: { videoId: video.id },
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
    setYtPlaylist((prev) => {
      if (prev.some((item) => item.id === video.id)) return prev;
      return [
        ...prev,
        {
          ...video,
          addedBy: currentUserName || 'You',
        },
      ];
    });
    if (!activeVideoId) {
      setActiveVideoId(video.id);
      setIsExpandedVideo(false);
    }
  };

  const handlePlayYouTubeUrl = (urlOrQuery: string) => {
    if (!urlOrQuery.trim()) return;
    const match = urlOrQuery.match(/(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const videoId = match ? match[1] : (urlOrQuery.trim().length === 11 && !urlOrQuery.includes(' ') ? urlOrQuery.trim() : null);

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

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background select-none">
      {activeVideoId && isExpandedVideo ? (
        <div className="relative w-full h-full bg-black flex flex-col">
          <button
            onClick={() => setIsExpandedVideo(false)}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-zinc-900 font-bold text-xs shadow-2xl hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95"
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
          <div className={cn('w-full md:w-[44%] lg:w-[42%] flex flex-col border-b md:border-b-0 md:border-r border-border py-4 gap-4 overflow-y-auto [scrollbar-width:thin]', CHANNEL_HORIZONTAL_PADDING)}>
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-border shadow-2xl group shrink-0">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=1&enablejsapi=1&rel=0`}
                title="YouTube Watch Together"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
              <button
                onClick={() => setIsExpandedVideo(true)}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-black/80 hover:bg-black text-white text-xs font-bold backdrop-blur-md border border-white/20 shadow-2xl transition-all hover:scale-105 active:scale-95"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Expand Video</span>
              </button>
            </div>

            <div className="flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-foreground leading-tight">
                  {channel?.name || 'general'} Playlist
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Video {Math.max(1, ytPlaylist.findIndex((v) => v.id === activeVideoId) + 1)}/{Math.max(ytPlaylist.length, 1)}
                </p>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-foreground text-xs font-medium">
                <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[9px] text-primary-foreground font-bold shrink-0">
                  {currentUserName?.[0]?.toUpperCase() || 'U'}
                </div>
                <span>You are <strong className="font-semibold text-primary">hosting</strong></span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>

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
                      <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-[9px] text-white font-bold">
                        {currentUserName?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="text-[11px] text-[#949ba4]">{currentUserName}</span>
                    </div>
                  </div>
                </div>
              ) : (
                ytPlaylist.map((item, idx) => {
                  const isPlaying = item.id === activeVideoId;
                  return (
                    <div
                      key={`${item.id}-${idx}`}
                      onClick={() => setActiveVideoId(item.id)}
                      className={cn(
                        'flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer',
                        isPlaying
                          ? 'bg-card border-primary/50 shadow-sm'
                          : 'bg-card/70 border-border hover:border-border/80 hover:bg-card',
                      )}
                    >
                      <Play className={cn('w-3.5 h-3.5 shrink-0 ml-1', isPlaying ? 'fill-current text-primary' : 'text-muted-foreground')} />
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
                        <p className={cn('text-xs font-semibold truncate', isPlaying ? 'text-foreground' : 'text-foreground/80')}>
                          {item.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">{item.channel}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[9px] text-primary-foreground font-bold">
                            {item.addedBy?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <span className="text-[11px] text-muted-foreground">{item.addedBy}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className={cn('flex-1 min-h-0 flex flex-col py-4 gap-4 overflow-y-auto [scrollbar-width:thin]', CHANNEL_HORIZONTAL_PADDING)}>
            <div className="relative w-full">
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

            <div className="flex items-center gap-2 text-foreground font-bold text-sm">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
              <span>Trending Videos</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ytVideos.map((video) => {
                const isQueuedOrPlaying = activeVideoId === video.id || ytPlaylist.some((p) => p.id === video.id);
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
                          onClick={(e) => handleAddToQueue(e, video)}
                          title="Add to queue"
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
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
        <div className={cn('flex-1 min-h-0 flex flex-col overflow-y-auto [scrollbar-width:thin] bg-background py-4 gap-4', CHANNEL_HORIZONTAL_PADDING)}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-foreground text-xs font-medium w-fit">
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-bold shrink-0">
                {currentUserName?.[0]?.toUpperCase() || 'U'}
              </div>
              <span>You are <strong className="font-semibold text-primary">hosting</strong></span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </div>

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

          <div className="flex items-center gap-2 text-foreground font-bold text-sm shrink-0">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span>Trending Videos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
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
                    onClick={(e) => handleAddToQueue(e, video)}
                    title="Add to queue"
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
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
