import React from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommunityAvatar } from '@/chat/chat-avatar';
import type { YouTubeVideoItem } from './hooks/use-youtube-player';

export interface YouTubePlaylistViewProps {
  playlist: YouTubeVideoItem[];
  activeVideoId: string | null;
  currentUserName: string;
  currentUser?: any;
  participants?: any[];
  ytVideos: YouTubeVideoItem[];
  canEdit: boolean;
  onPlayVideo: (video: YouTubeVideoItem) => void;
}

export const YouTubePlaylistView: React.FC<YouTubePlaylistViewProps> = ({
  playlist,
  activeVideoId,
  currentUserName,
  currentUser,
  participants = [],
  ytVideos,
  canEdit,
  onPlayVideo,
}) => {
  if (playlist.length === 0) {
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

  return (
    <>
      {playlist.map((item, idx) => {
        const isCurrentItem = item.id === activeVideoId;
        return (
          <div
            key={`${item.id}-${idx}`}
            onClick={() => onPlayVideo(item)}
            className={cn(
              'flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer',
              isCurrentItem
                ? 'bg-card border-primary/50 shadow-xs'
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
      })}
    </>
  );
};
