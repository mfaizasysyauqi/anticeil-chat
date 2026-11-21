import React, { useRef, useEffect, useState } from 'react';
import {
  Paperclip,
  X,
  Plus,
  Gift,
  Send,
  Upload,
  MessageSquarePlus,
  BarChart2,
  LayoutGrid,
  CalendarPlus,
  Mic,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceNoteRecorder } from './voice-note-recorder';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MediaPickerPopover } from './media-picker-popover';
import { ChatAppsPopover } from './chat-apps-popover';
import { SlashCommandAutocomplete } from './slash-command-autocomplete';
import { CreatePollModal } from './create-poll-modal';
import { CustomScheduleModal } from './custom-schedule-modal';
import { toast } from 'sonner';
import { MAX_MESSAGE_CHARS, getCurrentMaxMessageChars } from '../utils/text-limit';
import { getCurrentUserPlan } from '../utils/attachment';
import type { ColonyChannel, Colony } from '@/chat/chat-types';
import type { DiscordEmoji, DiscordSticker, DiscordGifItem } from '@/chat/anticeil-media-data';

export interface ChatInputBarProps {
  activeChannel: ColonyChannel | null;
  activeColony: Colony | null;
  channelPaddingClass?: string;
  stagedAttachment: { name: string; size?: string; url?: string; type?: string } | null;
  setStagedAttachment: (attachment: any) => void;
  inputText: string;
  setInputText: (text: string) => void;
  onSendMessage: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenGiftModal: () => void;
  onOpenCreateThreadModal?: () => void;
  onScheduleMessage?: (scheduledDate: Date, customText?: string) => Promise<void> | void;
  onSubmitPoll?: (question: string, options: string[]) => void;
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
  replyingTo?: { id: string; senderName: string; content: string } | null;
  onCancelReply?: () => void;
  appsSearchQuery: string;
  setAppsSearchQuery: (q: string) => void;
  onLaunchActivity: (id: string) => void;
  onSendVoiceNote?: (blob: Blob, durationSeconds: number) => void;
  t: (key: string) => string;
}

export function ChatInputBar({
  activeChannel,
  activeColony,
  channelPaddingClass = 'px-4 lg:px-6',
  stagedAttachment,
  setStagedAttachment,
  inputText,
  setInputText,
  onSendMessage,
  onSendVoiceNote,
  onFileSelect,
  onOpenGiftModal,
  onOpenCreateThreadModal,
  onScheduleMessage,
  onSubmitPoll,
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
  replyingTo,
  onCancelReply,
  appsSearchQuery,
  setAppsSearchQuery,
  onLaunchActivity,
  t,
}: ChatInputBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [isCustomScheduleOpen, setIsCustomScheduleOpen] = useState(false);
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  const [isSlashOpen, setIsSlashOpen] = useState(true);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const userPlan = getCurrentUserPlan();
  const maxMessageChars = getCurrentMaxMessageChars();
  const isNectar = userPlan === 'nectar_boost';

  // Auto-resize textarea to fit content dynamically up to 50vh max
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [inputText]);

  const handleQuickSchedule = async (preset: 'tomorrow-9am' | 'tomorrow-1pm' | 'monday-9am') => {
    const d = new Date();
    if (preset === 'tomorrow-9am') {
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
    } else if (preset === 'tomorrow-1pm') {
      d.setDate(d.getDate() + 1);
      d.setHours(13, 0, 0, 0);
    } else if (preset === 'monday-9am') {
      const day = d.getDay();
      const daysUntilMonday = ((1 - day + 7) % 7) || 7;
      d.setDate(d.getDate() + daysUntilMonday);
      d.setHours(9, 0, 0, 0);
    }
    await onScheduleMessage?.(d, inputText.trim());
    setIsPlusMenuOpen(false);
  };

  return (
    <div className={`sticky bottom-0 z-20 shrink-0 ${channelPaddingClass} pb-2 sm:pb-3 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-1 bg-background flex flex-col gap-1.5`}>
      {/* Discord Reply Banner */}
      {replyingTo && (
        <div className="px-3 py-1.5 rounded-[12px] bg-[#111214] border border-white/10 shadow-lg flex items-center justify-between text-xs animate-in slide-in-from-bottom-1 select-none">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <span className="text-muted-foreground">Membalas <span className="font-semibold text-primary">@{replyingTo.senderName}</span>:</span>
            <span className="truncate max-w-[280px] sm:max-w-[480px] md:max-w-[650px] pr-1.5 text-[#dbdee1]/90">{replyingTo.content || '[Lampiran]'}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancelReply}
            className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer rounded-full"
            title="Batalkan Balasan"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

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

      {/* Bot Slash Command Autocomplete */}
      {inputText.startsWith('/') && isSlashOpen && (
        <SlashCommandAutocomplete
          inputText={inputText}
          activeColony={activeColony}
          onSelectCommand={(cmd) => {
            setInputText(`${cmd} `);
            textareaRef.current?.focus();
          }}
          isOpen={isSlashOpen}
          selectedIndex={slashSelectedIndex}
        />
      )}

      {/* Voice Note Recorder Mode or Textarea Input Box */}
      {isRecordingVoice ? (
        <VoiceNoteRecorder
          onSendVoiceNote={(blob, duration) => {
            setIsRecordingVoice(false);
            onSendVoiceNote?.(blob, duration);
          }}
          onCancel={() => setIsRecordingVoice(false)}
        />
      ) : (
        <div className="w-full min-h-[52px] max-h-[50vh] flex items-end gap-2.5 rounded-[12px] bg-muted/70 dark:bg-card border border-border hover:border-foreground/30 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 px-3 py-2 transition-all shadow-xs">
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileSelect}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.json,.xlsx,.pptx,.md,.rtf,.zip,.rar,.7z"
            className="hidden"
          />

        {/* Discord Plus Action Menu (Upload, Thread, Poll, Apps, Schedule Message) */}
        <DropdownMenu open={isPlusMenuOpen} onOpenChange={setIsPlusMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="w-7 h-7 rounded-full bg-background dark:bg-muted text-foreground/80 hover:text-foreground hover:bg-background/90 flex items-center justify-center shrink-0 transition-all border border-border/80 shadow-xs cursor-pointer mb-1"
              title="Aksi Pesan (Upload, Thread, Poll, Apps, Schedule)"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="top"
            sideOffset={10}
            className="w-56 p-1.5 rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl backdrop-blur-md overflow-visible"
          >
            {/* 1. Upload a File */}
            <DropdownMenuItem
              onClick={() => {
                fileInputRef.current?.click();
                setIsPlusMenuOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-xs font-semibold"
            >
              <Upload className="w-4 h-4 shrink-0" />
              <span>{t('Upload a File')}</span>
            </DropdownMenuItem>

            {/* 2. Voice Note / Pesan Suara */}
            <DropdownMenuItem
              onClick={() => {
                setIsRecordingVoice(true);
                setIsPlusMenuOpen(false);
              }}
              disabled={!activeChannel}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-xs font-semibold"
            >
              <Mic className="w-4 h-4 shrink-0" />
              <span>{t('Voice Message')}</span>
            </DropdownMenuItem>

            {/* 3. Create Thread */}
            <DropdownMenuItem
              onClick={() => {
                onOpenCreateThreadModal?.();
                setIsPlusMenuOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-xs font-semibold"
            >
              <MessageSquarePlus className="w-4 h-4 shrink-0" />
              <span>{t('Create Thread')}</span>
            </DropdownMenuItem>

            {/* 4. Create Poll */}
            <DropdownMenuItem
              onClick={() => {
                setIsPollModalOpen(true);
                setIsPlusMenuOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-xs font-semibold"
            >
              <BarChart2 className="w-4 h-4 shrink-0" />
              <span>{t('Create Poll')}</span>
            </DropdownMenuItem>

            {/* 5. Use Apps */}
            <DropdownMenuItem
              onClick={() => {
                setIsTemplatePopoverOpen(true);
                setIsPlusMenuOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-xs font-semibold"
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span>{t('Use Apps')}</span>
            </DropdownMenuItem>

            {/* 6. Schedule Message */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-xs font-semibold">
                <CalendarPlus className="w-4 h-4 shrink-0" />
                <span>{t('Schedule Message')}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent
                sideOffset={8}
                alignOffset={-4}
                className="w-52 p-1.5 rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl backdrop-blur-md z-50 overflow-visible"
              >
                <DropdownMenuItem
                  onClick={() => handleQuickSchedule('tomorrow-9am')}
                  className="px-3 py-2 rounded-lg cursor-pointer text-xs font-medium"
                >
                  {t('Tomorrow at 9:00am')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleQuickSchedule('tomorrow-1pm')}
                  className="px-3 py-2 rounded-lg cursor-pointer text-xs font-medium"
                >
                  {t('Tomorrow at 1:00pm')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleQuickSchedule('monday-9am')}
                  className="px-3 py-2 rounded-lg cursor-pointer text-xs font-medium"
                >
                  {t('Monday at 9:00am')}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={() => {
                    setIsCustomScheduleOpen(true);
                    setIsPlusMenuOpen(false);
                  }}
                  className="px-3 py-2 rounded-lg cursor-pointer text-xs font-medium"
                >
                  {t('Custom...')}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Multiline Textarea Input - Auto-expands up to 50% viewport height */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={inputText}
          maxLength={maxMessageChars}
          onChange={(e) => {
            setInputText(e.target.value);
            if (!isSlashOpen && e.target.value.startsWith('/')) {
              setIsSlashOpen(true);
            }
          }}
          onKeyDown={(e) => {
            if (inputText.startsWith('/') && isSlashOpen) {
              if (e.key === 'Escape') {
                setIsSlashOpen(false);
                return;
              }
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSlashSelectedIndex((prev) => prev + 1);
                return;
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSlashSelectedIndex((prev) => Math.max(0, prev - 1));
                return;
              }
            }
            if (e.key === 'Enter' && !e.shiftKey) {
              if ((e.nativeEvent as any).isComposing) return;
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
          className="border-0 outline-none focus:outline-none focus:ring-0 text-sm px-1 py-1.5 bg-transparent flex-1 placeholder:text-muted-foreground/90 text-foreground font-medium disabled:opacity-50 resize-none min-h-[32px] max-h-[calc(50vh-2rem)] overflow-y-auto custom-scrollbar leading-relaxed"
        />

        {/* Right Action Icons: Counter, Gift, GIF, Sticker, Emoji, Apps & Send (Discord style) */}
        <div className="flex items-center gap-2 shrink-0 mb-1">
          {/* Character counter (shows remaining / total when text is present) */}
          {inputText.length > 0 && (
            <span
              className={`text-[10px] font-mono px-1 select-none transition-colors flex items-center gap-1 ${
                inputText.length >= maxMessageChars
                  ? 'text-destructive font-bold'
                  : inputText.length >= maxMessageChars - 200
                  ? 'text-amber-500 font-semibold'
                  : 'text-muted-foreground/60'
              }`}
              title={`${inputText.length} / ${maxMessageChars} karakter${isNectar ? ' (Nectar VIP 🍯)' : ''}`}
            >
              {isNectar && <span className="text-[10px]" title="Nectar VIP Perk: 4,000 karakter">🍯</span>}
              <span>
                {maxMessageChars - inputText.length <= 200
                  ? `${maxMessageChars - inputText.length}`
                  : `${inputText.length}/${maxMessageChars}`}
              </span>
            </span>
          )}

          {/* 1. Gift Icon (Desktop/tablet only) */}
          <button
            type="button"
            onClick={onOpenGiftModal}
            className="hidden sm:flex w-6 h-6 text-muted-foreground/90 hover:text-foreground items-center justify-center transition-colors cursor-pointer"
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
            activeColony={activeColony}
            serverDbEmojis={serverDbEmojis}
            serverDbStickers={serverDbStickers}
            onSelectEmoji={onSelectEmoji}
            onSendSticker={onSendSticker}
            onSendGif={onSendGif}
            onOpenQuickAddEmoji={onOpenQuickAddEmoji}
            onOpenQuickAddSticker={onOpenQuickAddSticker}
          />

          {/* Apps & Activity Popover (Desktop/tablet only, on mobile accessible via + menu) */}
          <div className="hidden sm:flex items-center">
            <ChatAppsPopover
              open={isTemplatePopoverOpen}
              onOpenChange={setIsTemplatePopoverOpen}
              appsSearchQuery={appsSearchQuery}
              setAppsSearchQuery={setAppsSearchQuery}
              onLaunchActivity={onLaunchActivity}
            />
          </div>

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
      )}

      {/* Create Poll Dialog */}
      <CreatePollModal
        open={isPollModalOpen}
        onOpenChange={setIsPollModalOpen}
        onSubmitPoll={(question, options) => {
          onSubmitPoll?.(question, options);
        }}
      />

      {/* Custom Schedule Dialog (connected to calendar DB) */}
      <CustomScheduleModal
        open={isCustomScheduleOpen}
        onOpenChange={setIsCustomScheduleOpen}
        currentText={inputText}
        onSchedule={async (date, text) => {
          await onScheduleMessage?.(date, text);
        }}
      />
    </div>
  );
}

