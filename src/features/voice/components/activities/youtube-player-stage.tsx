import React, { useState } from 'react';
import {
  Play,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Minimize2,
  ListVideo,
  Search,
  X,
  Settings,
  SlidersHorizontal,
  Gauge,
  Subtitles,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { Socket } from 'socket.io-client';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import type { ColonyChannel } from '@/chat/chat-types';
import type { YouTubeVideoItem } from './hooks/use-youtube-player';
import { YouTubePlaylistView } from './youtube-playlist-view';

const SPEED_OPTIONS = [
  { label: '0.25x', value: 0.25 },
  { label: '0.5x', value: 0.5 },
  { label: '0.75x', value: 0.75 },
  { label: 'Normal (1x)', value: 1 },
  { label: '1.25x', value: 1.25 },
  { label: '1.5x', value: 1.5 },
  { label: '1.75x', value: 1.75 },
  { label: '2x', value: 2 },
];

const QUALITY_OPTIONS = [
  { label: '1080p (HD)', value: 'hd1080' },
  { label: '720p (HD)', value: 'hd720' },
  { label: '480p', value: 'large' },
  { label: '360p', value: 'medium' },
  { label: '240p', value: 'small' },
  { label: '144p', value: 'tiny' },
  { label: 'Otomatis', value: 'auto' },
];

const CAPTION_OPTIONS = [
  { label: 'Tidak aktif', value: 'off' },
  { label: 'Bahasa Indonesia', value: 'id' },
  { label: 'English', value: 'en' },
];

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
  onReorderPlaylist?: (newPlaylist: YouTubeVideoItem[]) => void;
  onRemovePlaylistItem?: (index: number, video: YouTubeVideoItem) => void;
  onPlayNext?: (index: number, video: YouTubeVideoItem) => void;
  renderHostPopover: (align?: 'left' | 'right') => React.ReactNode;
  playerRef?: React.MutableRefObject<any>;
  socket?: Socket | null;
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
  onReorderPlaylist,
  onRemovePlaylistItem,
  onPlayNext,
  renderHostPopover,
  playerRef,
  socket,
}: YouTubePlayerStageProps) {
  // Video Player Settings Dialog state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'main' | 'quality' | 'speed' | 'captions'>('main');
  const [currentQuality, setCurrentQuality] = useState<string>('hd1080');
  const [currentSpeed, setCurrentSpeed] = useState<number>(1);
  const [currentCaption, setCurrentCaption] = useState<string>('off');

  const handleSelectQuality = (val: string) => {
    setCurrentQuality(val);
    try {
      playerRef?.current?.setPlaybackQuality?.(val);
    } catch (e) {}
    const opt = QUALITY_OPTIONS.find((o) => o.value === val);
    toast.success(`Kualitas video diatur ke ${opt?.label || val}`);
    setActiveSettingsTab('main');
  };

  const handleSelectSpeed = (val: number) => {
    setCurrentSpeed(val);
    try {
      playerRef?.current?.setPlaybackRate?.(val);
    } catch (e) {}
    if (canEdit && socket) {
      socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
        channelId: channel.id,
        action: 'YOUTUBE_RATE_CHANGE',
        payload: { rate: val },
      });
    }
    const opt = SPEED_OPTIONS.find((o) => o.value === val);
    toast.success(`Kecepatan putar diatur ke ${opt?.label || `${val}x`}`);
    setActiveSettingsTab('main');
  };

  const handleSelectCaption = (val: string) => {
    setCurrentCaption(val);
    try {
      if (val === 'off') {
        playerRef?.current?.unloadModule?.('captions');
      } else {
        playerRef?.current?.loadModule?.('captions');
        playerRef?.current?.setOption?.('captions', 'track', { languageCode: val });
      }
    } catch (e) {}
    const opt = CAPTION_OPTIONS.find((o) => o.value === val);
    toast.success(`Teks subtitel diatur ke ${opt?.label || val}`);
    setActiveSettingsTab('main');
  };

  const currentQualityLabel =
    QUALITY_OPTIONS.find((o) => o.value === currentQuality)?.label || '1080p';
  const currentSpeedLabel =
    currentSpeed === 1
      ? 'Normal'
      : SPEED_OPTIONS.find((o) => o.value === currentSpeed)?.label || `${currentSpeed}x`;
  const currentCaptionLabel =
    CAPTION_OPTIONS.find((o) => o.value === currentCaption)?.label || 'Tidak aktif';

  return (
    <div
      className={cn(
        'flex flex-col',
        isExpandedVideo
          ? 'w-full h-full p-0 gap-0 bg-black relative'
          : cn(
              'w-full md:w-[48%] lg:w-[46%] border-b md:border-b-0 md:border-r border-border pt-2 pb-1.5 md:py-4 gap-2 md:gap-4 shrink-0 md:shrink md:overflow-y-auto custom-scrollbar',
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
            ? 'w-full h-full rounded-none flex items-center justify-center border-0 aspect-auto'
            : 'w-full aspect-video min-h-[260px] sm:min-h-[300px] rounded-2xl border border-border shadow-2xl flex items-center justify-center',
        )}
      >
        <div
          id="yt-watch-together-player-frame"
          className={cn(
            'w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0',
            isExpandedVideo
              ? 'max-h-full max-w-[calc(100vh*16/9)] mx-auto aspect-video'
              : 'min-h-[260px] sm:min-h-[300px] aspect-video',
          )}
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

        {/* Hover Controls: Non-Expanded Mode */}
        {!isExpandedVideo && (
          <div className="absolute top-3 right-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsSettingsOpen(true);
                setActiveSettingsTab('main');
              }}
              className="p-2 rounded-full bg-black/85 hover:bg-black text-white hover:text-primary backdrop-blur-md border border-white/20 shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Pengaturan Video (Kualitas, Kecepatan, Teks)"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsExpandedVideo(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/85 hover:bg-black text-white text-xs font-bold backdrop-blur-md border border-white/20 shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Perbesar Layar"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Expand</span>
            </button>
          </div>
        )}

        {/* Hover Controls: Expanded Mode */}
        {isExpandedVideo && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsSettingsOpen(true);
                setActiveSettingsTab('main');
              }}
              className="p-2 rounded-full bg-black/85 hover:bg-black text-white hover:text-primary backdrop-blur-md border border-white/20 shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Pengaturan Video"
            >
              <Settings className="w-4 h-4" />
            </button>
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

        {/* Settings Dialog Overlay */}
        {isSettingsOpen && (
          <div className="absolute inset-0 z-40 flex items-center justify-center p-3 animate-in fade-in duration-150">
            {/* Click outside to close */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => {
                setIsSettingsOpen(false);
                setActiveSettingsTab('main');
              }}
            />

            <div className="relative w-72 sm:w-80 rounded-2xl bg-[#1e1f22]/95 backdrop-blur-2xl border border-white/10 shadow-2xl p-3 z-50 text-white select-none overflow-hidden animate-in zoom-in-95 duration-150">
              {/* MAIN MENU: NO SCROLLBAR (kalo gaperlu ada scrollbar hapus) */}
              {activeSettingsTab === 'main' && (
                <div className="space-y-1 overflow-hidden">
                  <div className="flex items-center justify-between pb-2 mb-1 border-b border-white/10">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-primary" />
                      Pengaturan Pemutar
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSettingsOpen(false)}
                      className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveSettingsTab('quality')}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <SlidersHorizontal className="w-4 h-4 text-white/70 group-hover:text-primary transition-colors shrink-0" />
                      <span className="text-xs font-medium text-white">Kualitas</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-white/60">
                      <span>{currentQualityLabel}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-white/40" />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSettingsTab('speed')}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Gauge className="w-4 h-4 text-white/70 group-hover:text-amber-400 transition-colors shrink-0" />
                      <span className="text-xs font-medium text-white">Kecepatan</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-white/60">
                      <span>{currentSpeedLabel}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-white/40" />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSettingsTab('captions')}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Subtitles className="w-4 h-4 text-white/70 group-hover:text-emerald-400 transition-colors shrink-0" />
                      <span className="text-xs font-medium text-white">Teks</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-white/60">
                      <span>{currentCaptionLabel}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-white/40" />
                    </div>
                  </button>
                </div>
              )}

              {/* SUBMENU 1: KUALITAS (Uses custom-scrollbar template) */}
              {activeSettingsTab === 'quality' && (
                <div>
                  <div className="flex items-center gap-2 pb-2 mb-2 border-b border-white/10">
                    <button
                      type="button"
                      onClick={() => setActiveSettingsTab('main')}
                      className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-white">Kualitas Video</span>
                  </div>

                  <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                    {QUALITY_OPTIONS.map((q) => (
                      <button
                        key={q.value}
                        type="button"
                        onClick={() => handleSelectQuality(q.value)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left cursor-pointer transition-colors',
                          currentQuality === q.value
                            ? 'bg-primary/20 text-primary font-bold'
                            : 'text-white/80 hover:bg-white/10 hover:text-white',
                        )}
                      >
                        <span>{q.label}</span>
                        {currentQuality === q.value && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SUBMENU 2: KECEPATAN (Uses custom-scrollbar template) */}
              {activeSettingsTab === 'speed' && (
                <div>
                  <div className="flex items-center gap-2 pb-2 mb-2 border-b border-white/10">
                    <button
                      type="button"
                      onClick={() => setActiveSettingsTab('main')}
                      className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-white">Kecepatan Pemutaran</span>
                  </div>

                  <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                    {SPEED_OPTIONS.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => handleSelectSpeed(s.value)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left cursor-pointer transition-colors',
                          currentSpeed === s.value
                            ? 'bg-amber-500/20 text-amber-400 font-bold'
                            : 'text-white/80 hover:bg-white/10 hover:text-white',
                        )}
                      >
                        <span>{s.label}</span>
                        {currentSpeed === s.value && <Check className="w-4 h-4 text-amber-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SUBMENU 3: TEKS / SUBTITEL */}
              {activeSettingsTab === 'captions' && (
                <div>
                  <div className="flex items-center gap-2 pb-2 mb-2 border-b border-white/10">
                    <button
                      type="button"
                      onClick={() => setActiveSettingsTab('main')}
                      className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-white">Teks (Subtitel)</span>
                  </div>

                  <div className="space-y-1 overflow-hidden">
                    {CAPTION_OPTIONS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => handleSelectCaption(c.value)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left cursor-pointer transition-colors',
                          currentCaption === c.value
                            ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                            : 'text-white/80 hover:bg-white/10 hover:text-white',
                        )}
                      >
                        <span>{c.label}</span>
                        {currentCaption === c.value && <Check className="w-4 h-4 text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
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

              <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1 pt-3">
                <YouTubePlaylistView
                  playlist={ytPlaylist}
                  activeVideoId={activeVideoId}
                  currentUserName={currentUserName}
                  currentUser={currentUser}
                  participants={participants}
                  ytVideos={ytVideos}
                  canEdit={canEdit}
                  onPlayVideo={onPlayPlaylistItem}
                  onReorderPlaylist={onReorderPlaylist}
                  onRemoveItem={onRemovePlaylistItem}
                  onPlayNext={onPlayNext}
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

          <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
            <YouTubePlaylistView
              playlist={ytPlaylist}
              activeVideoId={activeVideoId}
              currentUserName={currentUserName}
              currentUser={currentUser}
              participants={participants}
              ytVideos={ytVideos}
              canEdit={canEdit}
              onPlayVideo={onPlayPlaylistItem}
              onReorderPlaylist={onReorderPlaylist}
              onRemoveItem={onRemovePlaylistItem}
              onPlayNext={onPlayNext}
            />
          </div>
        </div>
      )}
    </div>
  );
}
