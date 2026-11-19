import React, { useState } from 'react';
import { Play, Equal, MoreHorizontal, Trash2, ListPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommunityAvatar } from '@/chat/chat-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/core/i18n';
import type { YouTubeVideoItem } from './hooks/use-youtube-player';

const FALLBACK_THUMBNAIL = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180' fill='%2318181b'><rect width='320' height='180' fill='%2318181b'/><circle cx='160' cy='90' r='26' fill='%23ef4444'/><polygon points='153,78 173,90 153,102' fill='%23ffffff'/></svg>";

export interface YouTubePlaylistViewProps {
  playlist: YouTubeVideoItem[];
  activeVideoId: string | null;
  currentUserName: string;
  currentUser?: any;
  participants?: any[];
  ytVideos: YouTubeVideoItem[];
  canEdit: boolean;
  onPlayVideo: (video: YouTubeVideoItem) => void;
  onReorderPlaylist?: (newPlaylist: YouTubeVideoItem[]) => void;
  onRemoveItem?: (index: number, video: YouTubeVideoItem) => void;
  onPlayNext?: (index: number, video: YouTubeVideoItem) => void;
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
  onReorderPlaylist,
  onRemoveItem,
  onPlayNext,
}) => {
  const { t } = useTranslation();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [menuOpenIndex, setMenuOpenIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!canEdit) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!canEdit || draggedIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...playlist];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);

    setDraggedIndex(null);
    setDragOverIndex(null);
    onReorderPlaylist?.(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

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
              if (!target.dataset.triedFallback) {
                target.dataset.triedFallback = '1';
                target.src = FALLBACK_THUMBNAIL;
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
        const isDragging = draggedIndex === idx;
        const isDragOver = dragOverIndex === idx && draggedIndex !== idx;
        const isMenuOpen = menuOpenIndex === idx;
        const isMyItem = item.addedBy === currentUserName;
        const canDeleteThisItem = canEdit || isMyItem;

        return (
          <div
            key={`${item.id}-${idx}`}
            draggable={canEdit}
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
            onClick={() => onPlayVideo(item)}
            className={cn(
              'group relative flex items-center gap-3 p-2.5 rounded-xl border transition-all select-none cursor-pointer',
              isCurrentItem
                ? 'bg-card border-primary/50 shadow-xs'
                : 'bg-card/70 border-border hover:border-border/80 hover:bg-card',
              isDragging && 'opacity-40 border-dashed border-primary scale-[0.99]',
              isDragOver && 'border-primary ring-2 ring-primary/60 bg-primary/10',
            )}
          >
            {/* Left Slot: Number or Play triangle when idle; Drag Handle on hover if canEdit (Discord 1:1) */}
            <div className="w-5 flex items-center justify-center shrink-0 ml-0.5">
              {canEdit ? (
                <>
                  <span className={cn('group-hover:hidden transition-colors', isCurrentItem ? 'text-primary' : 'text-muted-foreground')}>
                    {isCurrentItem ? (
                      <Play className="w-3.5 h-3.5 fill-current text-primary" />
                    ) : (
                      <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                        {idx + 1}
                      </span>
                    )}
                  </span>
                  <span
                    className="hidden group-hover:flex items-center justify-center text-muted-foreground group-hover:text-foreground cursor-grab active:cursor-grabbing"
                    title={t('Tarik untuk atur urutan')}
                  >
                    <Equal className="w-4 h-4 stroke-[2.5]" />
                  </span>
                </>
              ) : (
                <span className={isCurrentItem ? 'text-primary' : 'text-muted-foreground'}>
                  {isCurrentItem ? (
                    <Play className="w-3.5 h-3.5 fill-current text-primary" />
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                      {idx + 1}
                    </span>
                  )}
                </span>
              )}
            </div>

            {/* Thumbnail */}
            <div className="relative w-24 aspect-video rounded-lg overflow-hidden shrink-0 bg-black">
              <img
                src={item.thumbnail || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.triedFallback) {
                    target.dataset.triedFallback = '1';
                    target.src = FALLBACK_THUMBNAIL;
                  }
                }}
              />
              {isCurrentItem ? (
                <span className="absolute inset-0 bg-black/55 flex items-center justify-center text-[10px] font-bold text-white tracking-wide">
                  Playing
                </span>
              ) : item.duration ? (
                <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-semibold px-1 py-0.2 rounded">
                  {item.duration}
                </span>
              ) : null}
            </div>

            {/* Info */}
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

            {/* Right Options Dropdown (MoreHorizontal / ··· like Discord) */}
            {(canDeleteThisItem || canEdit) && (
              <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu
                  open={isMenuOpen}
                  onOpenChange={(open) => setMenuOpenIndex(open ? idx : null)}
                >
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        'size-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all cursor-pointer',
                        isMenuOpen ? 'opacity-100 bg-muted/80' : 'opacity-0 group-hover:opacity-100'
                      )}
                      title={t('Opsi video')}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-40 bg-card/95 backdrop-blur-md border-border text-foreground p-1 space-y-0.5 shadow-xl z-[200]"
                  >
                    {/* Delete Option (Red styled like Discord) */}
                    {canDeleteThisItem && (
                      <DropdownMenuItem
                        onClick={() => {
                          setMenuOpenIndex(null);
                          onRemoveItem?.(idx, item);
                        }}
                        className="flex items-center gap-2 text-xs font-semibold text-red-500 hover:text-white hover:bg-red-600 focus:text-white focus:bg-red-600 rounded-md py-1.5 px-2.5 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t('Delete')}</span>
                      </DropdownMenuItem>
                    )}

                    {/* Play Next Option */}
                    {canEdit && !isCurrentItem && (
                      <DropdownMenuItem
                        onClick={() => {
                          setMenuOpenIndex(null);
                          onPlayNext?.(idx, item);
                        }}
                        className="flex items-center gap-2 text-xs font-medium text-foreground hover:bg-muted rounded-md py-1.5 px-2.5 cursor-pointer transition-colors"
                      >
                        <ListPlus className="w-3.5 h-3.5" />
                        <span>{t('Play next')}</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};
