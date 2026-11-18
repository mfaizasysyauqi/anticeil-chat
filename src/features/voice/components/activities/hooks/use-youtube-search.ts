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
      id: 'Jdj13fGMmmA',
      title: 'Yura Yunita - Dunia Tipu-Tipu (Official Music Video)',
      channel: 'YURA YUNITA',
      thumbnail: 'https://i.ytimg.com/vi/Jdj13fGMmmA/hqdefault.jpg',
      duration: '4:21',
      views: '58M views',
      uploadedAt: '2 tahun lalu',
    },
    {
      id: 'hLz4xOo7MGQ',
      title: 'Yura Yunita - Tutur Batin (Official Music Video)',
      channel: 'YURA YUNITA',
      thumbnail: 'https://i.ytimg.com/vi/hLz4xOo7MGQ/hqdefault.jpg',
      duration: '3:56',
      views: '45M views',
      uploadedAt: '2 tahun lalu',
    },
    {
      id: 'rFZHOHl-L8A',
      title: 'lofi hip hop radio 📚 - beats to relax/study to',
      channel: 'Lofi Girl',
      thumbnail: 'https://i.ytimg.com/vi/rFZHOHl-L8A/hqdefault.jpg',
      duration: 'LIVE',
      views: '54M views',
      uploadedAt: 'Live',
    },
    {
      id: 'QdBZY2fkU-0',
      title: 'Grand Theft Auto VI Trailer 1',
      channel: 'Rockstar Games',
      thumbnail: 'https://i.ytimg.com/vi/QdBZY2fkU-0/hqdefault.jpg',
      duration: '1:31',
      views: '210M views',
      uploadedAt: '1 tahun lalu',
    },
    {
      id: 'k2qgadSvNyU',
      title: 'Tulus - Hati-Hati di Jalan (Official Lyric Video)',
      channel: 'Tulus',
      thumbnail: 'https://i.ytimg.com/vi/k2qgadSvNyU/hqdefault.jpg',
      duration: '4:04',
      views: '190M views',
      uploadedAt: '2 tahun lalu',
    },
    {
      id: 'mIbEJKUjV0s',
      title: 'Yura Yunita - Berawal Dari Tatap (Official Music Video)',
      channel: 'YURA YUNITA',
      thumbnail: 'https://i.ytimg.com/vi/mIbEJKUjV0s/hqdefault.jpg',
      duration: '3:45',
      views: '62M views',
      uploadedAt: '8 tahun lalu',
    },
    {
      id: 'qhn0Hi97CoA',
      title: 'Yura Yunita ft. Glenn Fredly - Cinta Dan Rahasia (Official Music Video)',
      channel: 'YURA YUNITA',
      thumbnail: 'https://i.ytimg.com/vi/qhn0Hi97CoA/hqdefault.jpg',
      duration: '4:20',
      views: '145M views',
      uploadedAt: '9 tahun lalu',
    },
    {
      id: 'W5OPDlDJ2gk',
      title: 'Yura Yunita - Risalah Hati (Official Music Video)',
      channel: 'YURA YUNITA',
      thumbnail: 'https://i.ytimg.com/vi/W5OPDlDJ2gk/hqdefault.jpg',
      duration: '4:49',
      views: '24M views',
      uploadedAt: '1 tahun lalu',
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
      id: 'MmB9b5njVbA',
      title: 'Minecraft Official Trailer',
      channel: 'Minecraft',
      thumbnail: 'https://i.ytimg.com/vi/MmB9b5njVbA/hqdefault.jpg',
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
      id: 'Jdj13fGMmmA',
      title: 'Yura Yunita - Dunia Tipu-Tipu (Official Music Video)',
      channel: 'YURA YUNITA',
      thumbnail: 'https://i.ytimg.com/vi/Jdj13fGMmmA/hqdefault.jpg',
      duration: '4:21',
      views: '58M views',
      uploadedAt: '2 tahun lalu',
    },
    {
      id: 'hLz4xOo7MGQ',
      title: 'Yura Yunita - Tutur Batin (Official Music Video)',
      channel: 'YURA YUNITA',
      thumbnail: 'https://i.ytimg.com/vi/hLz4xOo7MGQ/hqdefault.jpg',
      duration: '3:56',
      views: '45M views',
      uploadedAt: '2 tahun lalu',
    },
    {
      id: 'mIbEJKUjV0s',
      title: 'Yura Yunita - Berawal Dari Tatap (Official Music Video)',
      channel: 'YURA YUNITA',
      thumbnail: 'https://i.ytimg.com/vi/mIbEJKUjV0s/hqdefault.jpg',
      duration: '3:45',
      views: '62M views',
      uploadedAt: '8 tahun lalu',
    },
    {
      id: 'qhn0Hi97CoA',
      title: 'Yura Yunita ft. Glenn Fredly - Cinta Dan Rahasia (Official Music Video)',
      channel: 'YURA YUNITA',
      thumbnail: 'https://i.ytimg.com/vi/qhn0Hi97CoA/hqdefault.jpg',
      duration: '4:20',
      views: '145M views',
      uploadedAt: '9 tahun lalu',
    },
    {
      id: 'W5OPDlDJ2gk',
      title: 'Yura Yunita - Risalah Hati (Official Music Video)',
      channel: 'YURA YUNITA',
      thumbnail: 'https://i.ytimg.com/vi/W5OPDlDJ2gk/hqdefault.jpg',
      duration: '4:49',
      views: '24M views',
      uploadedAt: '1 tahun lalu',
    },
    {
      id: 'k2qgadSvNyU',
      title: 'Tulus - Hati-Hati di Jalan (Official Lyric Video)',
      channel: 'Tulus',
      thumbnail: 'https://i.ytimg.com/vi/k2qgadSvNyU/hqdefault.jpg',
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
  ],
  gaming: [
    {
      id: 'QdBZY2fkU-0',
      title: 'Grand Theft Auto VI Trailer 1',
      channel: 'Rockstar Games',
      thumbnail: 'https://i.ytimg.com/vi/QdBZY2fkU-0/hqdefault.jpg',
      duration: '1:31',
      views: '210M views',
      uploadedAt: '1 tahun lalu',
    },
    {
      id: 'MmB9b5njVbA',
      title: 'Minecraft Official Trailer',
      channel: 'Minecraft',
      thumbnail: 'https://i.ytimg.com/vi/MmB9b5njVbA/hqdefault.jpg',
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
      id: 'rFZHOHl-L8A',
      title: 'lofi hip hop radio 📚 - beats to relax/study to',
      channel: 'Lofi Girl',
      thumbnail: 'https://i.ytimg.com/vi/rFZHOHl-L8A/hqdefault.jpg',
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

        // 1. Check if raw query matches curated catalog with token-based search
        if (rawQ) {
          const qTokens = rawQ.toLowerCase().split(/\s+/).filter(Boolean);
          const allCurated = Object.values(CURATED_CATEGORY_VIDEOS)
            .flat()
            .filter((v, idx, arr) => arr.findIndex((x) => x.id === v.id) === idx);

          const matched = allCurated.filter((v) => {
            const title = v.title.toLowerCase();
            const channel = v.channel.toLowerCase();
            return qTokens.some((tok) => title.includes(tok) || channel.includes(tok));
          });

          if (matched.length > 0) {
            items = matched;
          }
        }

        // 2. Query backend scraper if available
        if (items.length === 0) {
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
        }

        // 3. Fallback to curated category list without displaying red API error banners
        if (items.length === 0) {
          const baseList = CURATED_CATEGORY_VIDEOS[ytCategory] || CURATED_CATEGORY_VIDEOS.semua;
          items = baseList;
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
