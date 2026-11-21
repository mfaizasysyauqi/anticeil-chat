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
  Sparkles,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  FileText,
  Film,
  Music,
  AtSign,
} from 'lucide-react';
import { SmallDialog } from '@/components/ui/small-dialog';
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
import { MentionAutocomplete, type MentionOption } from './mention-autocomplete';
import { CreatePollModal } from './create-poll-modal';
import { CustomScheduleModal } from './custom-schedule-modal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MAX_MESSAGE_CHARS, getCurrentMaxMessageChars } from '../utils/text-limit';
import { getCurrentUserPlan, processFilesBatch, MAX_UPLOAD_FILES_LIMIT } from '../utils/attachment';
import type { ColonyChannel, Colony, ColonyMember, ColonyCustomRole } from '@/chat/chat-types';
import type { DiscordEmoji, DiscordSticker, DiscordGifItem } from '@/chat/anticeil-media-data';

export interface ChatInputBarProps {
  activeChannel: ColonyChannel | null;
  activeColony: Colony | null;
  members?: ColonyMember[];
  roles?: ColonyCustomRole[];
  currentUser?: any;
  channelPaddingClass?: string;
  stagedAttachment: { name: string; size?: string; url?: string; type?: string } | null;
  setStagedAttachment: (attachment: any) => void;
  stagedAttachments?: any[];
  setStagedAttachments?: React.Dispatch<React.SetStateAction<any[]>>;
  inputText: string;
  setInputText: (text: string) => void;
  onSendMessage: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenGiftModal: () => void;
  onOpenSubscriptionModal?: () => void;
  onOpenCreateThreadModal?: () => void;
  onScheduleMessage?: (scheduledDate: Date, customText?: string) => Promise<void> | void;
  onSubmitPoll?: (
    question: string,
    options: Array<{ text: string; emoji?: string }> | string[],
    allowMultiple?: boolean,
    durationHours?: number,
  ) => void;
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
  members = [],
  roles = [],
  currentUser,
  channelPaddingClass = 'px-4 lg:px-6',
  stagedAttachment,
  setStagedAttachment,
  stagedAttachments = [],
  setStagedAttachments,
  inputText,
  setInputText,
  onSendMessage,
  onSendVoiceNote,
  onFileSelect,
  onOpenGiftModal,
  onOpenSubscriptionModal,
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

  // Discord-style @Mention autocomplete state
  const [isMentionOpen, setIsMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);

  const getMentionTrigger = (text: string, cursorPos: number) => {
    const textBeforeCursor = text.slice(0, cursorPos);
    const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_\-\s]{0,30})$/);
    if (!match) return null;
    const matchStr = match[0];
    const atIndex = textBeforeCursor.length - matchStr.length + (matchStr.startsWith(' ') || matchStr.startsWith('\n') ? 1 : 0);
    return {
      query: match[1],
      atIndex,
    };
  };

  const updateMentionState = (text: string, cursorPos?: number) => {
    const pos = cursorPos ?? textareaRef.current?.selectionStart ?? text.length;
    const trigger = getMentionTrigger(text, pos);
    if (trigger) {
      setMentionQuery(trigger.query);
      setIsMentionOpen(true);
    } else {
      setIsMentionOpen(false);
      setMentionQuery('');
      setMentionSelectedIndex(0);
    }
  };

  const filteredMentionItems = React.useMemo<MentionOption[]>(() => {
    if (!isMentionOpen) return [];
    const cleanQ = (mentionQuery || '').toLowerCase().trim();

    const mems: MentionOption[] = members.map((m) => {
      const cleanName = m.name?.trim() || 'Pengguna';
      const handle = m.username
        ? `_${m.username.replace(/^@/, '')}_`
        : m.email
        ? `_${m.email.split('@')[0]}_`
        : undefined;
      return {
        id: `member_${m.id}`,
        type: 'member' as const,
        label: cleanName,
        value: `@${cleanName}`,
        name: cleanName,
        tag: handle,
        avatar: m.avatar,
        status: m.status || 'offline',
      };
    }).filter((m) => !cleanQ || m.name.toLowerCase().includes(cleanQ) || (m.tag && m.tag.toLowerCase().includes(cleanQ)));

    const specials: MentionOption[] = [
      {
        id: 'special_everyone',
        type: 'special' as const,
        label: '@everyone',
        value: '@everyone',
        name: '@everyone',
        description: 'Notify everyone who has permission to view this channel.',
      },
      {
        id: 'special_here',
        type: 'special' as const,
        label: '@here',
        value: '@here',
        name: '@here',
        description: 'Notify everyone online who has permission to view this channel.',
      },
      {
        id: 'special_game',
        type: 'special' as const,
        label: '@game',
        value: '@game',
        name: '@game',
        description: 'Mention a game',
      },
      {
        id: 'special_time',
        type: 'special' as const,
        label: '@time',
        value: '@time',
        name: '@time',
        description: "Refer to a time dynamically in the viewer's time zone",
      },
    ].filter((s) => !cleanQ || s.label.toLowerCase().includes(cleanQ) || s.label.replace(/^@/, '').toLowerCase().includes(cleanQ));

    const validRoles = roles.length > 0 ? roles : [
      {
        id: 'role_new_role',
        colonyId: 'colony-1',
        name: 'new role',
        color: '#94a3b8',
        permissions: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
      },
    ];

    const rols: MentionOption[] = validRoles.map((r) => {
      const roleName = r.name.replace(/^@/, '').trim();
      return {
        id: `role_${r.id}`,
        type: 'role' as const,
        label: `@${roleName}`,
        value: `@${roleName}`,
        name: `@${roleName}`,
        description: 'Notify users with this role who have permission to view this channel.',
        color: r.color || '#94a3b8',
      };
    }).filter((r) => !cleanQ || r.label.toLowerCase().includes(cleanQ) || r.label.replace(/^@/, '').toLowerCase().includes(cleanQ));

    return [...mems, ...specials, ...rols];
  }, [isMentionOpen, mentionQuery, members, roles]);

  const handleSelectMention = (item: MentionOption) => {
    const textarea = textareaRef.current;
    const cursorPos = textarea?.selectionStart ?? inputText.length;
    const trigger = getMentionTrigger(inputText, cursorPos);

    const textToInsert = `${item.value} `;
    let newText = '';
    let newCursorPos = 0;

    if (trigger) {
      const beforeAt = inputText.slice(0, trigger.atIndex);
      const afterCursor = inputText.slice(cursorPos);
      newText = `${beforeAt}${textToInsert}${afterCursor}`;
      newCursorPos = beforeAt.length + textToInsert.length;
    } else {
      newText = `${inputText}${inputText.endsWith(' ') || !inputText ? '' : ' '}${textToInsert}`;
      newCursorPos = newText.length;
    }

    setInputText(newText);
    setIsMentionOpen(false);
    setMentionSelectedIndex(0);

    requestAnimationFrame(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    });
  };

  const handleOpenMentionDirectly = () => {
    const textarea = textareaRef.current;
    const needsSpace = inputText.length > 0 && !inputText.endsWith(' ');
    const newText = `${inputText}${needsSpace ? ' ' : ''}@`;
    setInputText(newText);
    setIsMentionOpen(true);
    setMentionQuery('');
    setMentionSelectedIndex(0);
    requestAnimationFrame(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(newText.length, newText.length);
      }
    });
  };
  const userPlan = getCurrentUserPlan();
  const maxMessageChars = getCurrentMaxMessageChars();
  const isNectar = userPlan === 'nectar_boost';

  const [isTooManyUploadsOpen, setIsTooManyUploadsOpen] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [editingAttachmentIdx, setEditingAttachmentIdx] = useState<number | null>(null);
  const [editingAttachmentName, setEditingAttachmentName] = useState<string>('');

  const attachmentsList = stagedAttachments && stagedAttachments.length > 0
    ? stagedAttachments
    : stagedAttachment
    ? [stagedAttachment]
    : [];

  useEffect(() => {
    const handleLimitEvent = () => setIsTooManyUploadsOpen(true);
    window.addEventListener('anticeil_too_many_uploads', handleLimitEvent);
    return () => window.removeEventListener('anticeil_too_many_uploads', handleLimitEvent);
  }, []);

  const removeAttachment = (index: number) => {
    if (setStagedAttachments) {
      setStagedAttachments((prev) => prev.filter((_, i) => i !== index));
    }
    if (index === 0 && setStagedAttachment) {
      setStagedAttachment(null);
    }
    if (editingAttachmentIdx === index) {
      setEditingAttachmentIdx(null);
    }
  };

  const toggleSpoiler = (index: number) => {
    if (setStagedAttachments) {
      setStagedAttachments((prev) =>
        prev.map((item, i) => (i === index ? { ...item, isSpoiler: !item.isSpoiler } : item))
      );
    }
  };

  const saveRename = (index: number) => {
    const trimmed = editingAttachmentName.trim();
    if (trimmed && setStagedAttachments) {
      setStagedAttachments((prev) =>
        prev.map((item, i) => (i === index ? { ...item, name: trimmed } : item))
      );
    }
    setEditingAttachmentIdx(null);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const files = e.clipboardData?.files;
    if (files && files.length > 0) {
      e.preventDefault();
      processFilesBatch(
        files,
        attachmentsList.length,
        (newAtt) => {
          if (setStagedAttachments) {
            setStagedAttachments((prev) => [...prev, newAtt]);
          } else {
            setStagedAttachment(newAtt);
          }
        },
        () => setIsTooManyUploadsOpen(true)
      );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      processFilesBatch(
        files,
        attachmentsList.length,
        (newAtt) => {
          if (setStagedAttachments) {
            setStagedAttachments((prev) => [...prev, newAtt]);
          } else {
            setStagedAttachment(newAtt);
          }
        },
        () => setIsTooManyUploadsOpen(true)
      );
    }
  };

  const handleOpenSubscription = () => {
    if (onOpenSubscriptionModal) {
      onOpenSubscriptionModal();
    } else if (onOpenGiftModal) {
      onOpenGiftModal();
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('anticeil_open_user_settings', { detail: { section: 'nitro' } }));
    }
  };

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

      {/* Discord-style Multi-Attachment Staged Preview Strip (Image 2) */}
      {attachmentsList.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar p-2 mb-2 max-w-full rounded-[14px] bg-muted/40 border border-border/60 animate-in slide-in-from-bottom-1">
          {attachmentsList.map((att, idx) => {
            const isImage = att.type === 'image' || att.url?.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i);
            const isVideo = att.type === 'video' || att.url?.match(/\.(mp4|webm|mov)($|\?)/i);
            const isAudio = att.type === 'audio' || att.type === 'voice-note';

            return (
              <div
                key={idx}
                className="relative w-44 h-36 shrink-0 rounded-[12px] bg-card border border-border/80 shadow-xs flex flex-col justify-between overflow-hidden p-2 group hover:border-primary/50 transition-all select-none"
              >
                {/* Top-Right Action Pill: Spoiler, Edit/Rename, Trash */}
                <div className="absolute top-2 right-2 flex items-center bg-background/90 dark:bg-black/80 backdrop-blur-md rounded-md p-0.5 border border-border/60 shadow-sm opacity-90 group-hover:opacity-100 transition-opacity z-20">
                  {/* 1. Toggle Spoiler Button */}
                  <button
                    type="button"
                    onClick={() => toggleSpoiler(idx)}
                    className={cn(
                      'p-1 rounded transition-colors cursor-pointer',
                      att.isSpoiler
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                    title={att.isSpoiler ? t('Hapus Spoiler') : t('Tandai sebagai Spoiler')}
                  >
                    {att.isSpoiler ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  {/* 2. Edit / Rename Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAttachmentIdx(idx);
                      setEditingAttachmentName(att.name);
                    }}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    title={t('Ubah Nama Lampiran')}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  {/* 3. Delete / Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="p-1 rounded text-destructive/80 hover:text-destructive hover:bg-destructive/20 transition-colors cursor-pointer"
                    title={t('Hapus Lampiran')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Media Preview or File Icon Area */}
                <div className="w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden rounded-md relative bg-muted/40">
                  {isImage ? (
                    <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
                      <img
                        src={att.url}
                        alt={att.name}
                        className={cn(
                          'w-full h-full object-cover transition-all',
                          att.isSpoiler && 'blur-md scale-105'
                        )}
                      />
                      {att.isSpoiler && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded bg-black/70 text-white border border-white/20 select-none">
                            SPOILER
                          </span>
                        </div>
                      )}
                    </div>
                  ) : isVideo ? (
                    <div className="w-full h-full relative flex items-center justify-center bg-black/40">
                      <Film className="w-8 h-8 text-muted-foreground" />
                      {att.isSpoiler && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded bg-black/70 text-white">
                            SPOILER
                          </span>
                        </div>
                      )}
                    </div>
                  ) : isAudio ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-primary">
                      <Music className="w-8 h-8" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground">
                      <FileText className="w-8 h-8" />
                    </div>
                  )}
                </div>

                {/* Bottom Filename & Size */}
                <div className="mt-1.5 w-full flex flex-col min-w-0">
                  {editingAttachmentIdx === idx ? (
                    <input
                      type="text"
                      autoFocus
                      value={editingAttachmentName}
                      onChange={(e) => setEditingAttachmentName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename(idx);
                        if (e.key === 'Escape') setEditingAttachmentIdx(null);
                      }}
                      onBlur={() => saveRename(idx)}
                      className="w-full text-xs bg-muted border border-primary px-1.5 py-0.5 rounded outline-none text-foreground font-medium"
                    />
                  ) : (
                    <div className="flex items-center justify-between gap-1 min-w-0">
                      <span className="font-semibold text-xs truncate text-foreground leading-tight" title={att.name}>
                        {att.name}
                      </span>
                      {att.size && (
                        <span className="text-[10px] text-muted-foreground shrink-0 leading-tight">
                          {att.size}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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

      {/* Discord-style @Mention Autocomplete Menu */}
      {isMentionOpen && (
        <MentionAutocomplete
          isOpen={isMentionOpen}
          query={mentionQuery}
          members={members}
          roles={roles}
          selectedIndex={mentionSelectedIndex}
          onSelect={handleSelectMention}
          onHoverIndex={(idx) => setMentionSelectedIndex(idx)}
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
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'w-full min-h-[52px] max-h-[50vh] flex items-end gap-2.5 rounded-[12px] bg-muted/70 dark:bg-card border transition-all shadow-xs px-3 py-2',
            isDraggingOver
              ? 'border-primary ring-2 ring-primary/40 bg-primary/5'
              : 'border-border hover:border-foreground/30 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'
          )}
        >
          <input
            type="file"
            multiple
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
              onSelect={(e) => {
                e.preventDefault();
                setIsPlusMenuOpen(false);
                setTimeout(() => {
                  setIsTemplatePopoverOpen(true);
                }, 50);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-xs font-semibold"
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span>{t('Use Apps')}</span>
            </DropdownMenuItem>

            {/* 6. Mention (@) */}
            <DropdownMenuItem
              onClick={() => {
                handleOpenMentionDirectly();
                setIsPlusMenuOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-xs font-semibold"
            >
              <AtSign className="w-4 h-4 shrink-0 text-primary" />
              <span>{t('Mention (@)')}</span>
            </DropdownMenuItem>

            {/* 7. Schedule Message */}
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
          maxLength={maxMessageChars + 4000}
          onPaste={handlePaste}
          onClick={(e) => {
            updateMentionState(e.currentTarget.value, e.currentTarget.selectionStart);
          }}
          onKeyUp={(e) => {
            if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
              updateMentionState(e.currentTarget.value, e.currentTarget.selectionStart);
            }
          }}
          onChange={(e) => {
            setInputText(e.target.value);
            if (!isSlashOpen && e.target.value.startsWith('/')) {
              setIsSlashOpen(true);
            }
            updateMentionState(e.target.value, e.target.selectionStart);
          }}
          onKeyDown={(e) => {
            // Discord @Mention keyboard navigation
            if (isMentionOpen && filteredMentionItems.length > 0) {
              if (e.key === 'Escape') {
                setIsMentionOpen(false);
                return;
              }
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setMentionSelectedIndex((prev) => (prev + 1) % filteredMentionItems.length);
                return;
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setMentionSelectedIndex((prev) => (prev - 1 + filteredMentionItems.length) % filteredMentionItems.length);
                return;
              }
              if ((e.key === 'Enter' || e.key === 'Tab') && !e.shiftKey) {
                e.preventDefault();
                const item = filteredMentionItems[mentionSelectedIndex] || filteredMentionItems[0];
                if (item) {
                  handleSelectMention(item);
                }
                return;
              }
            }

            // Slash Command keyboard navigation
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
              if (inputText.length > maxMessageChars) {
                toast.error(t('Pesan melebihi batas karakter! Upgrade ke Anticeil Pollen / Nectar / Royal untuk mengirim hingga 4.000 karakter.'));
                return;
              }
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

        {/* Right Action Icons: Negative Counter (Discord style on overlimit), Gift, GIF, Sticker, Emoji, Apps & Send */}
        <div className="flex items-center gap-2 shrink-0 mb-1">
          {/* Discord-style negative counter ONLY when exceeding character limit */}
          {inputText.length > maxMessageChars && (
            <span
              className="text-xs font-mono font-bold text-destructive px-1 select-none transition-colors animate-pulse"
              title={`${inputText.length} / ${maxMessageChars} ${t('karakter')}`}
            >
              -{inputText.length - maxMessageChars}
            </span>
          )}

          {/* Mention (@) trigger button */}
          <button
            type="button"
            onClick={handleOpenMentionDirectly}
            className="w-6 h-6 text-muted-foreground/90 hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            title={t('Sebut pengguna (@mention)')}
          >
            <AtSign className="w-4 h-4" />
          </button>

          {/* 1. Gift Icon */}
          <button
            type="button"
            onClick={onOpenGiftModal}
            className="flex w-6 h-6 text-muted-foreground/90 hover:text-foreground items-center justify-center transition-colors cursor-pointer"
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

          {/* Apps & Activity Popover */}
          <div className="flex items-center">
            <ChatAppsPopover
              open={isTemplatePopoverOpen}
              onOpenChange={setIsTemplatePopoverOpen}
              appsSearchQuery={appsSearchQuery}
              setAppsSearchQuery={setAppsSearchQuery}
              onLaunchActivity={onLaunchActivity}
            />
          </div>

          {/* Send Button — only visible when there's content */}
          {(inputText.trim() || attachmentsList.length > 0) && (
            <button
              type="button"
              onClick={() => {
                if (inputText.length > maxMessageChars) {
                  toast.error(t('Pesan melebihi batas karakter! Upgrade ke Anticeil Pollen / Nectar / Royal untuk mengirim hingga 4.000 karakter.'));
                  return;
                }
                onSendMessage();
              }}
              disabled={!activeChannel || inputText.length > maxMessageChars}
              className={cn(
                "w-6 h-6 ml-1 flex items-center justify-center transition-colors cursor-pointer animate-in zoom-in-75 duration-150",
                inputText.length > maxMessageChars
                  ? "text-muted-foreground/30 cursor-not-allowed"
                  : "text-primary hover:text-primary/80 disabled:opacity-40"
              )}
              title={inputText.length > maxMessageChars ? t('Pesan melebihi batas karakter') : t('Kirim Pesan (Enter)')}
            >
              <Send className="w-4 h-4 fill-current" />
            </button>
          )}
        </div>
      </div>
      )}

      {/* Discord-style Nitro / Pollen / Nectar / Royal Overlimit Banner (Image 2) */}
      {inputText.length > maxMessageChars && (
        <div className="mt-1.5 flex items-center justify-between px-3 py-2 rounded-lg bg-card/95 border border-destructive/40 shadow-sm text-xs animate-in fade-in slide-in-from-top-1 select-none">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-primary shrink-0 animate-pulse" />
            <span className="text-muted-foreground font-medium truncate">
              {t('Kirim pesan lebih panjang dengan')}{' '}
              <button
                type="button"
                onClick={handleOpenSubscription}
                className="text-primary font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                Anticeil Pollen / Nectar / Royal
              </button>
              !
            </span>
          </div>
          <span className="font-mono font-bold text-destructive text-xs shrink-0 ml-2">
            -{inputText.length - maxMessageChars}
          </span>
        </div>
      )}

      {/* Create Poll Dialog (Discord Style) */}
      <CreatePollModal
        open={isPollModalOpen}
        onOpenChange={setIsPollModalOpen}
        onSubmitPoll={(question, options, allowMultiple, durationHours) => {
          onSubmitPoll?.(question, options, allowMultiple, durationHours);
        }}
        onSchedulePoll={() => {
          setIsPollModalOpen(false);
          setIsCustomScheduleOpen(true);
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

      {/* Discord-style Too Many Uploads Dialog (Image 1) */}
      <SmallDialog
        open={isTooManyUploadsOpen}
        onOpenChange={setIsTooManyUploadsOpen}
        onClose={() => setIsTooManyUploadsOpen(false)}
        title={t('Too many uploads!')}
        description={t('You can only upload 10 files at a time!')}
        confirmLabel={t('Got It')}
        hideCancel={true}
        variant="default"
        onConfirm={() => setIsTooManyUploadsOpen(false)}
        showCloseButton={true}
      />
    </div>
  );
}

