import React, { useState, useEffect } from 'react';
import { Smile, TrendingUp, Search, Plus, Loader2, Compass } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  DISCORD_GIF_CATEGORIES,
  DISCORD_GIF_ITEMS,
  STANDARD_UNICODE_EMOJIS,
  DiscordEmoji,
  DiscordSticker,
  DiscordGifItem,
} from '@/chat/anticeil-media-data';
import type { Colony } from '@/chat/chat-types';
import { colonyApi } from '@/chat/chat-api';

export interface MediaPickerPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeMediaTab: 'gifs' | 'stickers' | 'emojis';
  setActiveMediaTab: (tab: 'gifs' | 'stickers' | 'emojis') => void;
  mediaSearchQuery: string;
  setMediaSearchQuery: (query: string) => void;
  selectedGifCategory: string | null;
  setSelectedGifCategory: (cat: string | null) => void;
  activeColony: Colony | null;
  serverDbEmojis: DiscordEmoji[];
  serverDbStickers: DiscordSticker[];
  onSelectEmoji: (emoji: DiscordEmoji) => void;
  onSendSticker: (sticker: DiscordSticker) => void;
  onSendGif: (gif: DiscordGifItem) => void;
  onOpenQuickAddEmoji: () => void;
  onOpenQuickAddSticker: () => void;
}

export function MediaPickerPopover({
  open,
  onOpenChange,
  activeMediaTab,
  setActiveMediaTab,
  mediaSearchQuery,
  setMediaSearchQuery,
  selectedGifCategory,
  setSelectedGifCategory,
  activeColony,
  serverDbEmojis,
  serverDbStickers,
  onSelectEmoji,
  onSendSticker,
  onSendGif,
  onOpenQuickAddEmoji,
  onOpenQuickAddSticker,
}: MediaPickerPopoverProps) {
  const [hoveredEmoji, setHoveredEmoji] = useState<DiscordEmoji | null>(null);
  const [hoveredSticker, setHoveredSticker] = useState<DiscordSticker | null>(null);
  const [apiGifs, setApiGifs] = useState<DiscordGifItem[]>([]);
  const [isLoadingGifs, setIsLoadingGifs] = useState(false);

  useEffect(() => {
    if (!open || activeMediaTab !== 'gifs') return;

    const query = (selectedGifCategory || mediaSearchQuery || '').trim();
    if (!query) {
      setApiGifs([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsLoadingGifs(true);
      try {
        const results = await colonyApi.searchGifs(query, 30);
        if (!cancelled) {
          setApiGifs(results && results.length > 0 ? results : []);
        }
      } catch {
        if (!cancelled) setApiGifs([]);
      } finally {
        if (!cancelled) setIsLoadingGifs(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, activeMediaTab, mediaSearchQuery, selectedGifCategory]);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-2">
          {/* GIF Button (Desktop only, hidden on mobile/tablet) */}
          <button
            type="button"
            onClick={() => {
              setActiveMediaTab('gifs');
              setMediaSearchQuery('');
              setSelectedGifCategory(null);
              onOpenChange(true);
            }}
            className={cn(
              "hidden lg:flex h-6 px-0.5 items-center justify-center transition-colors cursor-pointer",
              open && activeMediaTab === 'gifs' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
            )}
            title="Buka pemilih GIF"
          >
            <span className="text-[9px] font-black tracking-tight border-[1.5px] border-current px-1 py-0.5 rounded-[4px] leading-none select-none">
              GIF
            </span>
          </button>

          {/* Sticker Button (Desktop only, hidden on mobile/tablet) */}
          <button
            type="button"
            onClick={() => {
              setActiveMediaTab('stickers');
              setMediaSearchQuery('');
              onOpenChange(true);
            }}
            className={cn(
              "hidden lg:flex w-6 h-6 items-center justify-center transition-colors cursor-pointer",
              open && activeMediaTab === 'stickers' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
            title="Buka pemilih stiker"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8l6-6V4a2 2 0 0 0-2-2z" />
              <path d="M14 2v6h6" />
              <circle cx="9" cy="11" r="1" fill="currentColor" />
              <circle cx="13" cy="11" r="1" fill="currentColor" />
              <path d="M8 15s1.5 1.5 3 1.5 3-1.5 3-1.5" />
            </svg>
          </button>

          {/* Emoji Button (Visible on mobile, tablet, and desktop) */}
          <button
            type="button"
            onClick={() => {
              setActiveMediaTab('emojis');
              setMediaSearchQuery('');
              onOpenChange(true);
            }}
            className={cn(
              "flex w-6 h-6 items-center justify-center transition-colors cursor-pointer",
              open && activeMediaTab === 'emojis' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
            title="Pilih emoji"
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={14}
        className="w-[490px] max-w-[96vw] h-[480px] p-0 bg-background border border-border text-foreground shadow-2xl rounded-2xl select-none z-50 flex flex-col overflow-hidden"
      >
        {/* Header: Segmented Tabs & Search Bar */}
        <div className="p-3 pb-2.5 border-b border-border bg-background">
          <div className="flex items-center gap-1.5 mb-2.5">
            <div className="flex items-center p-1 rounded-lg bg-muted text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveMediaTab('gifs')}
                className={cn(
                  "px-3 py-1 rounded-md transition-all text-xs font-bold cursor-pointer",
                  activeMediaTab === 'gifs' ? 'bg-card text-card-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                GIFs
              </button>
              <button
                type="button"
                onClick={() => setActiveMediaTab('stickers')}
                className={cn(
                  "px-3 py-1 rounded-md transition-all text-xs font-bold cursor-pointer",
                  activeMediaTab === 'stickers' ? 'bg-card text-card-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Stickers
              </button>
              <button
                type="button"
                onClick={() => setActiveMediaTab('emojis')}
                className={cn(
                  "px-3 py-1 rounded-md transition-all text-xs font-bold cursor-pointer",
                  activeMediaTab === 'emojis' ? 'bg-card text-card-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Emoji
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full">
            <input
              type="text"
              value={mediaSearchQuery}
              onChange={(e) => setMediaSearchQuery(e.target.value)}
              placeholder={
                activeMediaTab === 'gifs'
                  ? selectedGifCategory
                    ? `Cari di #${selectedGifCategory}...`
                    : "Search Tenor GIFs..."
                  : activeMediaTab === 'stickers'
                  ? "Cari stiker di semua colony..."
                  : "Cari emoji..."
              }
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {mediaSearchQuery && (
              <button
                type="button"
                onClick={() => setMediaSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            )}
            {selectedGifCategory && !mediaSearchQuery && (
              <button
                type="button"
                onClick={() => setSelectedGifCategory(null)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-primary/10 hover:bg-primary/20 text-primary font-bold px-2 py-0.5 rounded cursor-pointer transition-colors"
                title="Kembali ke semua kategori"
              >
                ← Semua
              </button>
            )}
          </div>
        </div>

        {/* Body: Left Server Rail & Right Media Grid */}
        <div className="flex-1 flex min-h-0 overflow-hidden bg-background">
          {/* Left Server Rail */}
          <div className="w-12 bg-muted/40 border-r border-border py-2 flex flex-col items-center gap-2 overflow-y-auto shrink-0 scrollbar-none">
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:rounded-2xl transition-all cursor-pointer"
              title="Sering Digunakan"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
            <div className="w-6 h-px bg-border my-0.5" />

            {/* Current Active Hub */}
            {activeColony && (
              <div
                className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/20 text-white font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer overflow-hidden"
                title={`Colony: ${activeColony.name}`}
              >
                {activeColony.iconUrl ? (
                  <img src={activeColony.iconUrl} alt={activeColony.name} className="w-full h-full object-cover" />
                ) : (
                  activeColony.name.slice(0, 2).toUpperCase()
                )}
              </div>
            )}

            {/* Standard Unicode / Discord Library */}
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 flex items-center justify-center transition-all cursor-pointer"
              title="Koleksi Standar Anticeil"
            >
              <Compass className="w-4 h-4" />
            </button>

            {/* Quick Add Media Shortcut Button */}
            <div className="mt-auto pt-2 border-t border-border flex flex-col gap-1.5">
              {activeMediaTab === 'emojis' && (
                <button
                  type="button"
                  onClick={onOpenQuickAddEmoji}
                  className="w-8 h-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/30 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                  title="Tambah emoji kustom baru ke colony ini (PostgreSQL)"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                </button>
              )}
              {activeMediaTab === 'stickers' && (
                <button
                  type="button"
                  onClick={onOpenQuickAddSticker}
                  className="w-8 h-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/30 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                  title="Tambah stiker kustom baru ke colony ini (PostgreSQL)"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                </button>
              )}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            {/* EMOJI TAB CONTENT */}
            {activeMediaTab === 'emojis' && (
              <div className="space-y-4">
                {/* 1. Server Custom Emojis (DB) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {activeColony?.name || 'Colony'} — Kustom ({serverDbEmojis.length})
                    </span>
                    <button
                      type="button"
                      onClick={onOpenQuickAddEmoji}
                      className="text-[10px] text-foreground/80 hover:text-foreground hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Tambah
                    </button>
                  </div>

                  {serverDbEmojis.length === 0 ? (
                    <div className="p-3 rounded-xl bg-muted/40 border border-border text-center text-xs text-muted-foreground">
                      Belum ada emoji kustom di colony ini.{' '}
                      <button
                        type="button"
                        onClick={onOpenQuickAddEmoji}
                        className="text-foreground hover:underline font-semibold"
                      >
                        Klik untuk menambahkan!
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-8 gap-1.5">
                      {serverDbEmojis
                        .filter((e) => !mediaSearchQuery || e.name.toLowerCase().includes(mediaSearchQuery.toLowerCase()))
                        .map((emoji) => (
                          <button
                            key={emoji.id}
                            type="button"
                            onClick={() => {
                              onSelectEmoji(emoji);
                              onOpenChange(false);
                            }}
                            onMouseEnter={() => setHoveredEmoji(emoji)}
                            className="w-10 h-10 rounded-lg hover:bg-accent/50 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer relative group"
                            title={emoji.code}
                          >
                            {emoji.url.startsWith('http') || emoji.url.startsWith('data:') ? (
                              <img src={emoji.url} alt={emoji.name} className="w-7 h-7 object-contain" />
                            ) : (
                              <span className="text-2xl">{emoji.url}</span>
                            )}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* 2. Standard Unicode Emojis */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                    Standard Emojis
                  </span>
                  <div className="grid grid-cols-8 gap-1.5">
                    {STANDARD_UNICODE_EMOJIS.filter((e) =>
                      !mediaSearchQuery || e.name.toLowerCase().includes(mediaSearchQuery.toLowerCase())
                    ).map((emoji) => (
                      <button
                        key={emoji.id}
                        type="button"
                        onClick={() => {
                          onSelectEmoji(emoji);
                          onOpenChange(false);
                        }}
                        onMouseEnter={() => setHoveredEmoji(emoji)}
                        className="w-10 h-10 rounded-lg hover:bg-accent/50 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-2xl select-none"
                        title={emoji.code}
                      >
                        {emoji.url}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STICKERS TAB CONTENT */}
            {activeMediaTab === 'stickers' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {activeColony?.name || 'Colony'} — Stiker ({serverDbStickers.length})
                  </span>
                  <button
                    type="button"
                    onClick={onOpenQuickAddSticker}
                    className="text-[10px] text-foreground/80 hover:text-foreground hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Tambah
                  </button>
                </div>

                {serverDbStickers.length === 0 ? (
                  <div className="p-4 rounded-xl bg-muted/40 border border-border text-center text-xs text-muted-foreground">
                    Belum ada stiker di colony ini.{' '}
                    <button
                      type="button"
                      onClick={onOpenQuickAddSticker}
                      className="text-foreground hover:underline font-semibold"
                    >
                      Unggah stiker pertamamu!
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2.5">
                    {serverDbStickers
                      .filter((s) => !mediaSearchQuery || s.name.toLowerCase().includes(mediaSearchQuery.toLowerCase()))
                      .map((sticker) => (
                        <button
                          key={sticker.id}
                          type="button"
                          onClick={() => {
                            onSendSticker(sticker);
                            onOpenChange(false);
                          }}
                          onMouseEnter={() => setHoveredSticker(sticker)}
                          className="aspect-square rounded-xl bg-card hover:bg-accent/40 border border-border p-2 flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 active:scale-95 cursor-pointer group shadow-xs"
                          title={sticker.name}
                        >
                          <img
                            src={sticker.url}
                            alt={sticker.name}
                            className="w-16 h-16 object-contain filter drop-shadow group-hover:scale-110 transition-transform"
                            loading="lazy"
                          />
                          <span className="text-[10px] font-medium text-foreground/90 truncate max-w-full">
                            {sticker.name}
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* GIFS TAB CONTENT */}
            {activeMediaTab === 'gifs' && (
              <div>
                {/* 1. Categorized GIF Results */}
                {selectedGifCategory ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground capitalize flex items-center gap-1.5">
                        #{selectedGifCategory}
                        {isLoadingGifs && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(apiGifs.length > 0
                        ? apiGifs
                        : DISCORD_GIF_ITEMS.filter((g) => g.category === selectedGifCategory)
                      ).map((gif) => (
                        <button
                          key={gif.id}
                          type="button"
                          onClick={() => {
                            onSendGif(gif);
                            onOpenChange(false);
                          }}
                          className="rounded-xl overflow-hidden aspect-video bg-muted/60 relative group hover:ring-2 hover:ring-ring transition-all cursor-pointer"
                        >
                          <img src={gif.url} alt={gif.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                            <span className="text-[10px] font-semibold text-white truncate">{gif.title}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : mediaSearchQuery ? (
                  /* 2. Free Search GIF Results */
                  <div className="space-y-2">
                    {isLoadingGifs && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {(apiGifs.length > 0
                        ? apiGifs
                        : DISCORD_GIF_ITEMS.filter((g) =>
                            g.title.toLowerCase().includes(mediaSearchQuery.toLowerCase()) ||
                            g.category.toLowerCase().includes(mediaSearchQuery.toLowerCase())
                          )
                      ).map((gif) => (
                        <button
                          key={gif.id}
                          type="button"
                          onClick={() => {
                            onSendGif(gif);
                            onOpenChange(false);
                          }}
                          className="rounded-xl overflow-hidden aspect-video bg-muted/60 relative group hover:ring-2 hover:ring-ring transition-all cursor-pointer"
                        >
                          <img src={gif.url} alt={gif.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                            <span className="text-[10px] font-semibold text-white truncate">{gif.title}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* 3. Discord Default: Categorized Banner Tiles */
                  <div className="grid grid-cols-2 gap-2.5">
                    {DISCORD_GIF_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedGifCategory(cat.id)}
                        className="rounded-xl overflow-hidden aspect-[16/9] relative group hover:ring-2 hover:ring-ring transition-all cursor-pointer shadow-md"
                      >
                        {cat.coverUrl ? (
                          <img
                            src={cat.coverUrl}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform filter brightness-75 group-hover:brightness-90"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-yellow-500/40 via-orange-500/30 to-pink-500/40 flex items-center justify-center">
                            <svg className="w-8 h-8 text-yellow-300 fill-current opacity-80" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-2.5">
                          <span className="text-xs font-black text-white tracking-wide uppercase drop-shadow-md">
                            {cat.name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Preview Bar */}
        <div className="h-11 bg-muted/30 border-t border-border px-3 flex items-center justify-between text-xs text-muted-foreground shrink-0">
          {activeMediaTab === 'emojis' && (
            hoveredEmoji ? (
              <div className="flex items-center gap-2">
                {hoveredEmoji.url.startsWith('http') || hoveredEmoji.url.startsWith('data:') ? (
                  <img src={hoveredEmoji.url} alt={hoveredEmoji.name} className="w-6 h-6 object-contain" />
                ) : (
                  <span className="text-xl">{hoveredEmoji.url}</span>
                )}
                <span className="font-mono text-foreground font-semibold">{hoveredEmoji.code}</span>
                <span className="text-[10px] text-muted-foreground">({hoveredEmoji.server})</span>
              </div>
            ) : (
              <span className="text-[11px] text-muted-foreground">Arahkan kursor ke emoji untuk melihat preview</span>
            )
          )}
          {activeMediaTab === 'stickers' && (
            hoveredSticker ? (
              <div className="flex items-center gap-2">
                <img src={hoveredSticker.url} alt={hoveredSticker.name} className="w-6 h-6 object-contain" />
                <span className="text-foreground font-semibold">{hoveredSticker.name}</span>
                <span className="text-[10px] text-muted-foreground">({hoveredSticker.server})</span>
              </div>
            ) : (
              <span className="text-[11px] text-muted-foreground">Arahkan kursor ke stiker untuk melihat detail</span>
            )
          )}
          {activeMediaTab === 'gifs' && (
            <div className="flex items-center justify-between w-full text-[11px]">
              <span>Ditenagai oleh <strong className="text-foreground">Tenor</strong></span>
              {selectedGifCategory && (
                <button
                  type="button"
                  onClick={() => setSelectedGifCategory(null)}
                  className="text-foreground/80 hover:text-foreground hover:underline cursor-pointer font-medium"
                >
                  Kembali ke Semua Kategori
                </button>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
