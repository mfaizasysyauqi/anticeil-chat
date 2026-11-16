export const formatSeconds = (sec: number): string => {
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

export const parseYtDuration = (duration?: string): string => {
  if (!duration) return '';
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const h = match[1];
  const m = match[2] || '0';
  const s = match[3] || '0';
  if (h) return `${h}:${m.padStart(2, '0')}:${s.padStart(2, '0')}`;
  return `${m}:${s.padStart(2, '0')}`;
};

export const formatViews = (views?: string | number): string => {
  if (!views) return '';
  const num = typeof views === 'string' ? parseInt(views, 10) : views;
  if (isNaN(num)) return '';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M views`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K views`;
  return `${num} views`;
};

export const formatTimeAgo = (dateStr?: string): string => {
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
