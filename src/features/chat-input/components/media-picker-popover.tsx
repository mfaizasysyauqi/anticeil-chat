import React, { useState } from 'react';
import { Smile, TrendingUp, Search, Plus } from 'lucide-react';
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
} from '@/chat/discord-media-data';
import type { CommunityHub } from '@/chat/messages-types';

export interface MediaPickerPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeMediaTab: 'gifs' | 'stickers' | 'emojis';
  setActiveMediaTab: (tab: 'gifs' | 'stickers' | 'emojis') => void;
  mediaSearchQuery: string;
  setMediaSearchQuery: (query: string) => void;
  selectedGifCategory: string | null;
  setSelectedGifCategory: (cat: string | null) => void;
  activeHub: CommunityHub | null;
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
  activeHub,
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

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-2">
          {/* GIF Button */}
          <button
            type="button"
            onClick={() => {
              setActiveMediaTab('gifs');
              setMediaSearchQuery('');
              setSelectedGifCategory(null);
              onOpenChange(true);
            }}
            className={cn(
              "h-6 px-0.5 flex items-center justify-center transition-colors cursor-pointer",
              open && activeMediaTab === 'gifs' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
            )}
            title="Buka pemilih GIF"
          >
            <span className="text-[9px] font-black tracking-tight border-[1.5px] border-current px-1 py-0.5 rounded-[4px] leading-none select-none">
              GIF
            </span>
          </button>

          {/* Sticker Button */}
          <button
            type="button"
            onClick={() => {
              setActiveMediaTab('stickers');
              setMediaSearchQuery('');
              onOpenChange(true);
            }}
            className={cn(
              "w-6 h-6 flex items-center justify-center transition-colors cursor-pointer",
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

          {/* Emoji Button */}
          <button
            type="button"
            onClick={() => {
              setActiveMediaTab('emojis');
              setMediaSearchQuery('');
              onOpenChange(true);
            }}
            className={cn(
              "w-6 h-6 flex items-center justify-center transition-colors cursor-pointer",
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
        className="w-[490px] max-w-[96vw] h-[480px] p-0 bg-[#2b2d31] border border-white/10 text-[#dbdee1] shadow-2xl rounded-2xl select-none z-50 flex flex-col overflow-hidden"
      >
        {/* Header: Segmented Tabs & Search Bar */}
        <div className="p-3 pb-2.5 border-b border-white/5 bg-[#2b2d31]">
          <div className="flex items-center gap-1.5 mb-2.5">
            <div className="flex items-center p-1 rounded-lg bg-[#1e1f22] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveMediaTab('gifs')}
                className={cn(
                  "px-3 py-1 rounded-md transition-all text-xs font-bold cursor-pointer",
                  activeMediaTab === 'gifs' ? 'bg-[#35373c] text-white shadow-xs' : 'text-[#949ba4] hover:text-white'
                )}
              >
                GIFs
              </button>
              <button
                type="button"
                onClick={() => setActiveMediaTab('stickers')}
                className={cn(
                  "px-3 py-1 rounded-md transition-all text-xs font-bold cursor-pointer",
                  activeMediaTab === 'stickers' ? 'bg-[#35373c] text-white shadow-xs' : 'text-[#949ba4] hover:text-white'
                )}
              >
                Stickers
              </button>
              <button
                type="button"
                onClick={() => setActiveMediaTab('emojis')}
                className={cn(
                  "px-3 py-1 rounded-md transition-all text-xs font-bold cursor-pointer",
                  activeMediaTab === 'emojis' ? 'bg-[#35373c] text-white shadow-xs' : 'text-[#949ba4] hover:text-white'
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
                  ? "Cari stiker di semua server..."
                  : "Cari emoji..."
              }
              className="w-full bg-[#1e1f22] border-none rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#949ba4] focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {mediaSearchQuery && (
              <button
                type="button"
                onClick={() => setMediaSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#949ba4] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            )}
            {selectedGifCategory && !mediaSearchQuery && (
              <button
                type="button"
                onClick={() => setSelectedGifCategory(null)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-primary/20 hover:bg-primary/30 text-primary font-bold px-2 py-0.5 rounded cursor-pointer transition-colors"
                title="Kembali ke semua kategori"
              >
                ← Semua
              </button>
            )}
          </div>
        </div>

        {/* Body: Left Server Rail & Right Media Grid */}
        <div className="flex-1 flex min-h-0 overflow-hidden bg-[#2b2d31]">
          {/* Left Server Rail */}
          <div className="w-12 bg-[#1e1f22] border-r border-white/5 py-2 flex flex-col items-center gap-2 overflow-y-auto shrink-0 [scrollbar-width:none]">
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:rounded-2xl transition-all cursor-pointer"
              title="Sering Digunakan"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
            <div className="w-6 h-px bg-white/10 my-0.5" />

            {/* Current Active Hub */}
            {activeHub && (
              <div
                className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/20 text-white font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer overflow-hidden"
                title={`Server: ${activeHub.name}`}
              >
                {activeHub.iconUrl ? (
                  <img src={activeHub.iconUrl} alt={activeHub.name} className="w-full h-full object-cover" />
                ) : (
                  activeHub.name.slice(0, 2).toUpperCase()
                )}
              </div>
            )}

            {/* Standard Unicode / Discord Library */}
            <div
              className="w-8 h-8 rounded-full bg-muted border border-border/40 text-muted-foreground flex items-center justify-center text-xs font-bold cursor-pointer"
              title="Koleksi Standar Anticeil"
            >
              🌐
            </div>

            {/* Quick Add Media Shortcut Button */}
            <div className="mt-auto pt-2 border-t border-white/5 flex flex-col gap-1.5">
              {activeMediaTab === 'emojis' && (
                <button
                  type="button"
                  onClick={onOpenQuickAddEmoji}
                  className="w-8 h-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center transition-all cursor-pointer shadow-md"
                  title="Tambah emoji kustom baru ke server ini (PostgreSQL)"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                </button>
              )}
              {activeMediaTab === 'stickers' && (
                <button
                  type="button"
                  onClick={onOpenQuickAddSticker}
                  className="w-8 h-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center transition-all cursor-pointer shadow-md"
                  title="Tambah stiker kustom baru ke server ini (PostgreSQL)"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                </button>
              )}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 overflow-y-auto p-3 [scrollbar-width:thin]">
            {/* EMOJI TAB CONTENT */}
            {activeMediaTab === 'emojis' && (
              <div className="space-y-4">
                {/* 1. Server Custom Emojis (DB) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">
                      {activeHub?.name || 'Server'} — Kustom ({serverDbEmojis.length})
                    </span>
                    <button
                      type="button"
                      onClick={onOpenQuickAddEmoji}
                      className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Tambah
                    </button>
                  </div>

                  {serverDbEmojis.length === 0 ? (
                    <div className="p-3 rounded-xl bg-[#1e1f22]/50 border border-white/5 text-center text-xs text-[#949ba4]">
                      Belum ada emoji kustom di server ini.{' '}
                      <button
                        type="button"
                        onClick={onOpenQuickAddEmoji}
                        className="text-primary hover:underline font-semibold"
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
                            className="w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer relative group"
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
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4] block mb-2">
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
                        className="w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-2xl select-none"
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
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">
                    {activeHub?.name || 'Server'} — Stiker ({serverDbStickers.length})
                  </span>
                  <button
                    type="button"
                    onClick={onOpenQuickAddSticker}
                    className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Tambah
                  </button>
                </div>

                {serverDbStickers.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#1e1f22]/50 border border-white/5 text-center text-xs text-[#949ba4]">
                    Belum ada stiker di server ini.{' '}
                    <button
                      type="button"
                      onClick={onOpenQuickAddSticker}
                      className="text-primary hover:underline font-semibold"
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
                          className="aspect-square rounded-xl bg-[#1e1f22]/60 hover:bg-white/10 border border-white/5 p-2 flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 active:scale-95 cursor-pointer group shadow-sm"
                          title={sticker.name}
                        >
                          <img
                            src={sticker.url}
                            alt={sticker.name}
                            className="w-16 h-16 object-contain filter drop-shadow group-hover:scale-110 transition-transform"
                            loading="lazy"
                          />
                          <span className="text-[10px] font-medium text-[#dbdee1] truncate max-w-full">
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
                      <span className="text-xs font-bold text-white capitalize">
                        #{selectedGifCategory} ({DISCORD_GIF_ITEMS.filter((g) => g.category === selectedGifCategory).length})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {DISCORD_GIF_ITEMS.filter((g) => g.category === selectedGifCategory).map((gif) => (
                        <button
                          key={gif.id}
                          type="button"
                          onClick={() => {
                            onSendGif(gif);
                            onOpenChange(false);
                          }}
                          className="rounded-xl overflow-hidden aspect-video bg-[#1e1f22] relative group hover:ring-2 hover:ring-primary transition-all cursor-pointer"
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
                  <div className="grid grid-cols-2 gap-2">
                    {DISCORD_GIF_ITEMS.filter((g) =>
                      g.title.toLowerCase().includes(mediaSearchQuery.toLowerCase()) ||
                      g.category.toLowerCase().includes(mediaSearchQuery.toLowerCase())
                    ).map((gif) => (
                      <button
                        key={gif.id}
                        type="button"
                        onClick={() => {
                          onSendGif(gif);
                          onOpenChange(false);
                        }}
                        className="rounded-xl overflow-hidden aspect-video bg-[#1e1f22] relative group hover:ring-2 hover:ring-primary transition-all cursor-pointer"
                      >
                        <img src={gif.url} alt={gif.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                          <span className="text-[10px] font-semibold text-white truncate">{gif.title}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  /* 3. Discord Default: Categorized Banner Tiles */
                  <div className="grid grid-cols-2 gap-2.5">
                    {DISCORD_GIF_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedGifCategory(cat.id)}
                        className="rounded-xl overflow-hidden aspect-[16/9] relative group hover:ring-2 hover:ring-primary transition-all cursor-pointer shadow-md"
                      >
                        <img
                          src={cat.coverUrl}
                          alt={cat.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform filter brightness-75 group-hover:brightness-90"
                        />
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
        <div className="h-11 bg-[#1e1f22] border-t border-white/5 px-3 flex items-center justify-between text-xs text-[#949ba4] shrink-0">
          {activeMediaTab === 'emojis' && (
            hoveredEmoji ? (
              <div className="flex items-center gap-2">
                {hoveredEmoji.url.startsWith('http') || hoveredEmoji.url.startsWith('data:') ? (
                  <img src={hoveredEmoji.url} alt={hoveredEmoji.name} className="w-6 h-6 object-contain" />
                ) : (
                  <span className="text-xl">{hoveredEmoji.url}</span>
                )}
                <span className="font-mono text-white font-semibold">{hoveredEmoji.code}</span>
                <span className="text-[10px] text-[#949ba4]">({hoveredEmoji.server})</span>
              </div>
            ) : (
              <span className="text-[11px] text-[#949ba4]">Arahkan kursor ke emoji untuk melihat preview</span>
            )
          )}
          {activeMediaTab === 'stickers' && (
            hoveredSticker ? (
              <div className="flex items-center gap-2">
                <img src={hoveredSticker.url} alt={hoveredSticker.name} className="w-6 h-6 object-contain" />
                <span className="text-white font-semibold">{hoveredSticker.name}</span>
                <span className="text-[10px] text-[#949ba4]">({hoveredSticker.server})</span>
              </div>
            ) : (
              <span className="text-[11px] text-[#949ba4]">Arahkan kursor ke stiker untuk melihat detail</span>
            )
          )}
          {activeMediaTab === 'gifs' && (
            <div className="flex items-center justify-between w-full text-[11px]">
              <span>Ditenagai oleh <strong className="text-white">Tenor</strong></span>
              {selectedGifCategory && (
                <button
                  type="button"
                  onClick={() => setSelectedGifCategory(null)}
                  className="text-primary hover:underline cursor-pointer"
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
