import React, { useRef } from 'react';
import { Paperclip, X, Plus, Gift, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MediaPickerPopover } from './media-picker-popover';
import { ChatAppsPopover } from './chat-apps-popover';
import type { CommunityChannel, CommunityHub } from '@/chat/messages-types';
import type { DiscordEmoji, DiscordSticker, DiscordGifItem } from '@/chat/discord-media-data';

export interface ChatInputBarProps {
  activeChannel: CommunityChannel | null;
  activeHub: CommunityHub | null;
  channelPaddingClass?: string;
  stagedAttachment: { name: string; size?: string; url?: string; type?: string } | null;
  setStagedAttachment: (attachment: any) => void;
  inputText: string;
  setInputText: (text: string) => void;
  onSendMessage: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenGiftModal: () => void;
  // Media Picker props
  isMediaPickerOpen: boolean;
  setIsMediaPickerOpen: (open: boolean) => void;
  activeMediaTab: 'gifs' | 'stickers' | 'emojis';
  setActiveMediaTab: (tab: 'gifs' | 'stickers' | 'emojis') => void;
  mediaSearchQuery: string;
  setMediaSearchQuery: (q: string) => void;
  selectedGifCategory: string | null;
  setSelectedGifCategory: (cat: string | null) => void;
  serverDbEmojis: DiscordEmoji[];
  serverDbStickers: DiscordSticker[];
  onSelectEmoji: (emoji: DiscordEmoji) => void;
  onSendSticker: (sticker: DiscordSticker) => void;
  onSendGif: (gif: DiscordGifItem) => void;
  onOpenQuickAddEmoji: () => void;
  onOpenQuickAddSticker: () => void;
  // Apps props
  isTemplatePopoverOpen: boolean;
  setIsTemplatePopoverOpen: (open: boolean) => void;
  appsSearchQuery: string;
  setAppsSearchQuery: (q: string) => void;
  onLaunchActivity: (id: string) => void;
  t: (key: string) => string;
}

export function ChatInputBar({
  activeChannel,
  activeHub,
  channelPaddingClass = 'px-4 lg:px-6',
  stagedAttachment,
  setStagedAttachment,
  inputText,
  setInputText,
  onSendMessage,
  onFileSelect,
  onOpenGiftModal,
  isMediaPickerOpen,
  setIsMediaPickerOpen,
  activeMediaTab,
  setActiveMediaTab,
  mediaSearchQuery,
  setMediaSearchQuery,
  selectedGifCategory,
  setSelectedGifCategory,
  serverDbEmojis,
  serverDbStickers,
  onSelectEmoji,
  onSendSticker,
  onSendGif,
  onOpenQuickAddEmoji,
  onOpenQuickAddSticker,
  isTemplatePopoverOpen,
  setIsTemplatePopoverOpen,
  appsSearchQuery,
  setAppsSearchQuery,
  onLaunchActivity,
  t,
}: ChatInputBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`shrink-0 ${channelPaddingClass} pb-2 lg:pb-1 pt-0 bg-transparent z-10 flex flex-col gap-1.5`}>
      {/* Staged Attachment Indicator */}
      {stagedAttachment && (
        <div className="p-2 rounded-[12px] bg-[#111214] border border-white/10 shadow-2xl backdrop-blur-md flex items-center justify-between text-xs animate-in slide-in-from-bottom-1">
          <div className="flex items-center gap-2 truncate">
            <Paperclip className="w-4 h-4 text-primary shrink-0" />
            <span className="font-medium truncate text-[#dbdee1]">{stagedAttachment.name}</span>
            {stagedAttachment.size && (
              <span className="text-[10px] text-muted-foreground">({stagedAttachment.size})</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStagedAttachment(null)}
            className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Discord Signature Chat Input Box */}
      <div className="w-full h-[52px] flex items-center gap-3 rounded-[12px] bg-muted/70 dark:bg-card border border-border hover:border-foreground/30 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 px-3 transition-all shadow-xs">
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json"
          className="hidden"
        />

        {/* Upload file button: circular plus button ala Discord */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-7 h-7 rounded-full bg-background dark:bg-muted text-foreground/80 hover:text-foreground hover:bg-background/90 flex items-center justify-center shrink-0 transition-all border border-border/80 shadow-xs cursor-pointer"
          title="Lampirkan Gambar atau Dokumen (Maks. 5 MB)"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Text Input - 100% transparent to blend seamlessly with container */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSendMessage();
            }
          }}
          disabled={!activeChannel}
          placeholder={
            activeChannel
              ? activeChannel.category === 'DIRECT MESSAGES' || activeChannel.isDirectMessage
                ? `Message @${activeChannel.name}`
                : `Message #${activeChannel.name}`
              : t('Pilih atau buat channel terlebih dahulu...')
          }
          className="border-0 outline-none focus:outline-none focus:ring-0 text-sm px-1 h-full bg-transparent flex-1 placeholder:text-muted-foreground/90 text-foreground font-medium disabled:opacity-50"
        />

        {/* Right Action Icons: Gift, GIF, Sticker, Emoji, Apps & Send (Discord style) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 1. Gift Icon */}
          <button
            type="button"
            onClick={onOpenGiftModal}
            className="w-6 h-6 text-muted-foreground/90 hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            title="Kirim Hadiah (Send a Gift)"
          >
            <Gift className="w-5 h-5" />
          </button>

          {/* Unified Media Picker Popover (GIFs, Stickers, Emoji) */}
          <MediaPickerPopover
            open={isMediaPickerOpen}
            onOpenChange={setIsMediaPickerOpen}
            activeMediaTab={activeMediaTab}
            setActiveMediaTab={setActiveMediaTab}
            mediaSearchQuery={mediaSearchQuery}
            setMediaSearchQuery={setMediaSearchQuery}
            selectedGifCategory={selectedGifCategory}
            setSelectedGifCategory={setSelectedGifCategory}
            activeHub={activeHub}
            serverDbEmojis={serverDbEmojis}
            serverDbStickers={serverDbStickers}
            onSelectEmoji={onSelectEmoji}
            onSendSticker={onSendSticker}
            onSendGif={onSendGif}
            onOpenQuickAddEmoji={onOpenQuickAddEmoji}
            onOpenQuickAddSticker={onOpenQuickAddSticker}
          />

          {/* Apps & Activity Popover */}
          <ChatAppsPopover
            open={isTemplatePopoverOpen}
            onOpenChange={setIsTemplatePopoverOpen}
            appsSearchQuery={appsSearchQuery}
            setAppsSearchQuery={setAppsSearchQuery}
            onLaunchActivity={onLaunchActivity}
          />

          {/* Send Button — only visible when there's content */}
          {(inputText.trim() || stagedAttachment) && (
            <button
              type="button"
              onClick={onSendMessage}
              disabled={!activeChannel}
              className="w-6 h-6 ml-1 text-primary hover:text-[#4752c4] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 animate-in zoom-in-75 duration-150"
              title="Kirim Pesan (Enter)"
            >
              <Send className="w-4 h-4 fill-current" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
