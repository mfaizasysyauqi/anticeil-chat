import React from 'react';
import {
  Play,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Minimize2,
  ListVideo,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import type { ColonyChannel } from '@/chat/chat-types';
import type { YouTubeVideoItem } from './hooks/use-youtube-player';
import { YouTubePlaylistView } from './youtube-playlist-view';

export interface YouTubePlayerStageProps {
  channel: ColonyChannel;
  activeVideoId: string | null;
  isExpandedVideo: boolean;
  setIsExpandedVideo: (val: boolean) => void;
  isExpandedPlaylistOpen: boolean;
  setIsExpandedPlaylistOpen: (val: boolean) => void;
  needsUserGesture: boolean;
  handleUnlockAutoplay: () => void;
  mobileTab: 'browse' | 'playlist';
  setMobileTab: (tab: 'browse' | 'playlist') => void;
  ytPlaylist: YouTubeVideoItem[];
  currentUserName: string;
  currentUser?: any;
  participants?: any[];
  ytVideos: YouTubeVideoItem[];
  canEdit: boolean;
  onPlayPlaylistItem: (item: YouTubeVideoItem) => void;
  renderHostPopover: (align?: 'left' | 'right') => React.ReactNode;
}

export function YouTubePlayerStage({
  channel,
  activeVideoId,
  isExpandedVideo,
  setIsExpandedVideo,
  isExpandedPlaylistOpen,
  setIsExpandedPlaylistOpen,
  needsUserGesture,
  handleUnlockAutoplay,
  mobileTab,
  setMobileTab,
  ytPlaylist,
  currentUserName,
  currentUser,
  participants = [],
  ytVideos,
  canEdit,
  onPlayPlaylistItem,
  renderHostPopover,
}: YouTubePlayerStageProps) {
  return (
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
        <div
          id="yt-watch-together-player-frame"
          className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
        />

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

        {isExpandedVideo && isExpandedPlaylistOpen && (
          <>
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-xs z-35 animate-in fade-in duration-200"
              onClick={() => setIsExpandedPlaylistOpen(false)}
            />

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

              <div className="flex-1 space-y-2 overflow-y-auto pr-1 pt-3 [scrollbar-width:thin]">
                <YouTubePlaylistView
                  playlist={ytPlaylist}
                  activeVideoId={activeVideoId}
                  currentUserName={currentUserName}
                  currentUser={currentUser}
                  participants={participants}
                  ytVideos={ytVideos}
                  canEdit={canEdit}
                  onPlayVideo={onPlayPlaylistItem}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile / Tablet Tabs */}
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

      {/* Playlist Content */}
      {!isExpandedVideo && (
        <div
          className={cn(
            'flex-col gap-3',
            mobileTab === 'playlist' ? 'flex flex-1 min-h-0' : 'hidden md:flex md:flex-1 md:min-h-0',
          )}
        >
          <div className="flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-sm font-bold text-foreground">Daftar Putar</h3>
              <p className="text-[11px] text-muted-foreground">
                {ytPlaylist.length} video dalam antrean
              </p>
            </div>
            {renderHostPopover('left')}
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
            <YouTubePlaylistView
              playlist={ytPlaylist}
              activeVideoId={activeVideoId}
              currentUserName={currentUserName}
              currentUser={currentUser}
              participants={participants}
              ytVideos={ytVideos}
              canEdit={canEdit}
              onPlayVideo={onPlayPlaylistItem}
            />
          </div>
        </div>
      )}
    </div>
  );
}
