import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import type { YouTubeVideoItem } from './use-youtube-player';

export interface UseYouTubeSearchOptions {
  submittedSearchQuery: string;
  ytCategory: string;
  searchTriggerCount: number;
}

export const YT_CATEGORIES = [
  { id: 'semua', label: '🔥 Trending', q: 'trending indonesia' },
  { id: 'music', label: '🎵 Musik', q: 'music indonesia' },
  { id: 'gaming', label: '🎮 Gaming', q: 'gaming walkthrough' },
  { id: 'tech', label: '💻 Tech', q: 'programming coding tutorial' },
  { id: 'entertainment', label: '🎉 Hiburan', q: 'komedi hiburan' },
  { id: 'lofi', label: '☕ Lofi', q: 'lofi hip hop radio' },
];

const CURATED_CATEGORY_VIDEOS: Record<string, YouTubeVideoItem[]> = {
  semua: [
    {
      id: 'jfKfPfyJRdk',
      title: 'lofi hip hop radio 📚 - beats to relax/study to',
      channel: 'Lofi Girl',
      thumbnail: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',
      duration: 'LIVE',
      views: '54M views',
      uploadedAt: 'Live',
    },
    {
      id: 'r72GP1PIZa0',
      title: 'Grand Theft Auto VI Trailer 1',
      channel: 'Rockstar Games',
      thumbnail: 'https://i.ytimg.com/vi/r72GP1PIZa0/hqdefault.jpg',
      duration: '1:31',
      views: '210M views',
      uploadedAt: '1 tahun lalu',
    },
    {
      id: 'WPni755-Krg',
      title: 'Tulus - Hati-Hati di Jalan (Official Lyric Video)',
      channel: 'Tulus',
      thumbnail: 'https://i.ytimg.com/vi/WPni755-Krg/hqdefault.jpg',
      duration: '4:04',
      views: '190M views',
      uploadedAt: '2 tahun lalu',
    },
    {
      id: 'kJQP7kiw5Fk',
      title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
      channel: 'Luis Fonsi',
      thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
      duration: '4:41',
      views: '8.5B views',
      uploadedAt: '7 tahun lalu',
    },
    {
      id: 'JGwWNGJdvx8',
      title: 'Ed Sheeran - Shape of You',
      channel: 'Ed Sheeran',
      thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg',
      duration: '4:23',
      views: '6.2B views',
      uploadedAt: '7 tahun lalu',
    },
    {
      id: 'dQw4w9WgXcQ',
      title: 'Rick Astley - Never Gonna Give You Up',
      channel: 'Rick Astley',
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      duration: '3:32',
      views: '1.5B views',
      uploadedAt: '14 tahun lalu',
    },
    {
      id: '0e3GPea1Tyg',
      title: 'Minecraft Official Trailer',
      channel: 'Minecraft',
      thumbnail: 'https://i.ytimg.com/vi/0e3GPea1Tyg/hqdefault.jpg',
      duration: '2:22',
      views: '160M views',
      uploadedAt: '12 tahun lalu',
    },
    {
      id: 'fJ9rUzIMcZQ',
      title: 'Queen - Bohemian Rhapsody (Official Video)',
      channel: 'Queen Official',
      thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
      duration: '5:59',
      views: '1.7B views',
      uploadedAt: '15 tahun lalu',
    },
  ],
  music: [
    {
      id: 'WPni755-Krg',
      title: 'Tulus - Hati-Hati di Jalan (Official Lyric Video)',
      channel: 'Tulus',
      thumbnail: 'https://i.ytimg.com/vi/WPni755-Krg/hqdefault.jpg',
      duration: '4:04',
      views: '190M views',
      uploadedAt: '2 tahun lalu',
    },
    {
      id: 'F4gS-2283uM',
      title: 'Sheila On 7 - Dan (Official Music Video)',
      channel: 'Sony Music Entertainment Indonesia',
      thumbnail: 'https://i.ytimg.com/vi/F4gS-2283uM/hqdefault.jpg',
      duration: '4:48',
      views: '110M views',
      uploadedAt: '11 tahun lalu',
    },
    {
      id: 'kJQP7kiw5Fk',
      title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
      channel: 'Luis Fonsi',
      thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
      duration: '4:41',
      views: '8.5B views',
      uploadedAt: '7 tahun lalu',
    },
    {
      id: 'JGwWNGJdvx8',
      title: 'Ed Sheeran - Shape of You',
      channel: 'Ed Sheeran',
      thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg',
      duration: '4:23',
      views: '6.2B views',
      uploadedAt: '7 tahun lalu',
    },
  ],
  gaming: [
    {
      id: 'r72GP1PIZa0',
      title: 'Grand Theft Auto VI Trailer 1',
      channel: 'Rockstar Games',
      thumbnail: 'https://i.ytimg.com/vi/r72GP1PIZa0/hqdefault.jpg',
      duration: '1:31',
      views: '210M views',
      uploadedAt: '1 tahun lalu',
    },
    {
      id: '0e3GPea1Tyg',
      title: 'Minecraft Official Trailer',
      channel: 'Minecraft',
      thumbnail: 'https://i.ytimg.com/vi/0e3GPea1Tyg/hqdefault.jpg',
      duration: '2:22',
      views: '160M views',
      uploadedAt: '12 tahun lalu',
    },
    {
      id: 'eaW0tYpxyp0',
      title: 'VALORANT // Cinematic Trailer',
      channel: 'VALORANT',
      thumbnail: 'https://i.ytimg.com/vi/eaW0tYpxyp0/hqdefault.jpg',
      duration: '3:50',
      views: '45M views',
      uploadedAt: '3 tahun lalu',
    },
  ],
  tech: [
    {
      id: 'SqcY0GlETPk',
      title: 'React in 100 Seconds',
      channel: 'Fireship',
      thumbnail: 'https://i.ytimg.com/vi/SqcY0GlETPk/hqdefault.jpg',
      duration: '2:24',
      views: '1.8M views',
      uploadedAt: '3 tahun lalu',
    },
    {
      id: 'Tn6-PIqc4UM',
      title: 'TypeScript in 100 Seconds',
      channel: 'Fireship',
      thumbnail: 'https://i.ytimg.com/vi/Tn6-PIqc4UM/hqdefault.jpg',
      duration: '2:15',
      views: '1.4M views',
      uploadedAt: '3 tahun lalu',
    },
    {
      id: 'w7ejDZ8SWv8',
      title: 'Next.js in 100 Seconds',
      channel: 'Fireship',
      thumbnail: 'https://i.ytimg.com/vi/w7ejDZ8SWv8/hqdefault.jpg',
      duration: '2:30',
      views: '1.2M views',
      uploadedAt: '2 tahun lalu',
    },
  ],
  entertainment: [
    {
      id: 'dQw4w9WgXcQ',
      title: 'Rick Astley - Never Gonna Give You Up',
      channel: 'Rick Astley',
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      duration: '3:32',
      views: '1.5B views',
      uploadedAt: '14 tahun lalu',
    },
    {
      id: 'fJ9rUzIMcZQ',
      title: 'Queen - Bohemian Rhapsody (Official Video)',
      channel: 'Queen Official',
      thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
      duration: '5:59',
      views: '1.7B views',
      uploadedAt: '15 tahun lalu',
    },
  ],
  lofi: [
    {
      id: 'jfKfPfyJRdk',
      title: 'lofi hip hop radio 📚 - beats to relax/study to',
      channel: 'Lofi Girl',
      thumbnail: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',
      duration: 'LIVE',
      views: '54M views',
      uploadedAt: 'Live',
    },
    {
      id: '4xDzrJKXOOY',
      title: 'synthwave radio 🌌 - chill synth / retro beats',
      channel: 'Lofi Girl',
      thumbnail: 'https://i.ytimg.com/vi/4xDzrJKXOOY/hqdefault.jpg',
      duration: 'LIVE',
      views: '12M views',
      uploadedAt: 'Live',
    },
  ],
};

const INVIDIOUS_MIRRORS = [
  'https://invidious.nerdvpn.de',
  'https://inv.tux.pizza',
  'https://invidious.jing.rocks',
];

export function useYouTubeSearch({
  submittedSearchQuery,
  ytCategory,
  searchTriggerCount,
}: UseYouTubeSearchOptions) {
  const [ytVideos, setYtVideos] = useState<YouTubeVideoItem[]>(() => {
    return CURATED_CATEGORY_VIDEOS[ytCategory] || CURATED_CATEGORY_VIDEOS.semua;
  });
  const [ytIsSearching, setYtIsSearching] = useState(false);
  const [ytSearchError, setYtSearchError] = useState<string | null>(null);
  const ytCacheRef = useRef<Map<string, YouTubeVideoItem[]>>(new Map());

  useEffect(() => {
    const catObj = YT_CATEGORIES.find((c) => c.id === ytCategory);
    const rawQ = submittedSearchQuery.trim();

    if (rawQ.includes('youtube.com') || rawQ.includes('youtu.be')) return;
    if (rawQ.length === 1) return;

    const cacheKey = rawQ ? `search:${rawQ.toLowerCase()}` : `cat:${ytCategory}`;

    // Return cached results if available
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

        // 1. Check backend scraper first
        try {
          const endpoint = rawQ
            ? `/v1/community/youtube/search?q=${encodeURIComponent(rawQ)}`
            : `/v1/community/youtube/search?category=${encodeURIComponent(catObj?.q || ytCategory || '')}`;
          const backendRes = await api.get<{ items: any[] }>(endpoint);
          if (Array.isArray(backendRes?.items) && backendRes.items.length > 0) {
            items = backendRes.items;
          }
        } catch {
          // backend scraper optional
        }

        // 2. Direct zero-quota search via public Invidious instances without API key
        if (items.length === 0 && rawQ) {
          for (const mirror of INVIDIOUS_MIRRORS) {
            if (items.length > 0) break;
            try {
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 3500);
              const res = await fetch(
                `${mirror}/api/v1/search?q=${encodeURIComponent(rawQ)}&type=video`,
                { signal: controller.signal }
              );
              clearTimeout(timeout);

              if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                  items = data.slice(0, 16).map((item: any) => ({
                    id: item.videoId || item.id,
                    title: item.title,
                    channel: item.author || item.channelTitle || 'YouTube Channel',
                    thumbnail:
                      item.videoThumbnails?.[0]?.url ||
                      `https://i.ytimg.com/vi/${item.videoId || item.id}/hqdefault.jpg`,
                    duration: item.lengthSeconds
                      ? `${Math.floor(item.lengthSeconds / 60)}:${(item.lengthSeconds % 60).toString().padStart(2, '0')}`
                      : '',
                    views: item.viewCountText || (item.viewCount ? `${item.viewCount} views` : ''),
                    uploadedAt: item.publishedText || '',
                  }));
                }
              }
            } catch {
              // try next mirror
            }
          }
        }

        // 3. Fallback to curated high-quality videos if query or category has matching items
        if (items.length === 0) {
          const baseList = CURATED_CATEGORY_VIDEOS[ytCategory] || CURATED_CATEGORY_VIDEOS.semua;
          if (rawQ) {
            const qLower = rawQ.toLowerCase();
            const matched = Object.values(CURATED_CATEGORY_VIDEOS)
              .flat()
              .filter(
                (v, idx, arr) =>
                  arr.findIndex((x) => x.id === v.id) === idx &&
                  (v.title.toLowerCase().includes(qLower) ||
                    v.channel.toLowerCase().includes(qLower))
              );
            items = matched.length > 0 ? matched : baseList;
          } else {
            items = baseList;
          }
        }

        if (!isCancelled) {
          ytCacheRef.current.set(cacheKey, items);
          setYtVideos(items);
        }
      } catch {
        if (!isCancelled) {
          const fallback = CURATED_CATEGORY_VIDEOS[ytCategory] || CURATED_CATEGORY_VIDEOS.semua;
          setYtVideos(fallback);
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

  return {
    ytVideos,
    setYtVideos,
    ytIsSearching,
    ytSearchError,
  };
}
