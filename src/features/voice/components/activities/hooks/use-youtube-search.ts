import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import type { YouTubeVideoItem } from './use-youtube-player';
import { formatTimeAgo, formatViews, parseYtDuration } from '../youtube-utils';

export interface UseYouTubeSearchOptions {
  submittedSearchQuery: string;
  ytCategory: string;
  searchTriggerCount: number;
}

export const YT_CATEGORIES = [
  { id: 'semua', label: '🔥 Trending', q: '', categoryId: '' },
  { id: 'music', label: '🎵 Musik', q: '', categoryId: '10' },
  { id: 'gaming', label: '🎮 Gaming', q: '', categoryId: '20' },
  { id: 'tech', label: '💻 Tech', q: 'programming tech coding tutorial', categoryId: '28' },
  { id: 'entertainment', label: '🎉 Hiburan', q: '', categoryId: '24' },
  { id: 'lofi', label: '☕ Lofi', q: 'lofi hip hop radio beats', categoryId: '' },
];

export function useYouTubeSearch({
  submittedSearchQuery,
  ytCategory,
  searchTriggerCount,
}: UseYouTubeSearchOptions) {
  const [ytVideos, setYtVideos] = useState<YouTubeVideoItem[]>([]);
  const [ytIsSearching, setYtIsSearching] = useState(false);
  const [ytSearchError, setYtSearchError] = useState<string | null>(null);
  const ytCacheRef = useRef<Map<string, YouTubeVideoItem[]>>(new Map());

  useEffect(() => {
    const catObj = YT_CATEGORIES.find((c) => c.id === ytCategory);
    const rawQ = submittedSearchQuery.trim();

    if (rawQ.includes('youtube.com') || rawQ.includes('youtu.be')) return;
    if (rawQ.length === 1) return;

    const cacheKey = rawQ ? `search:${rawQ.toLowerCase()}` : `cat:${ytCategory}`;

    // Caching
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

        // 2. Fallback to Google YouTube API v3
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

  return {
    ytVideos,
    setYtVideos,
    ytIsSearching,
    ytSearchError,
  };
}
