import React from 'react';
import { Plus, Check } from 'lucide-react';
import type { YouTubeVideoItem } from './hooks/use-youtube-player';

export interface YouTubeVideoCardProps {
  video: YouTubeVideoItem;
  isQueuedOrPlaying: boolean;
  onSelectVideo: (video: YouTubeVideoItem) => void;
  onAddToQueue: (e: React.MouseEvent, video: YouTubeVideoItem) => void;
}

export const YouTubeVideoCard: React.FC<YouTubeVideoCardProps> = ({
  video,
  isQueuedOrPlaying,
  onSelectVideo,
  onAddToQueue,
}) => {
  return (
    <div
      onClick={() => onSelectVideo(video)}
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
            onClick={(e) => onAddToQueue(e, video)}
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
