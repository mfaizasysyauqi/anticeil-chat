import { useState, useEffect } from 'react';
import type { Colony } from '@/chat/chat-types';
import type { DiscordEmoji, DiscordSticker } from '@/chat/anticeil-media-data';
import { colonyApi } from '@/chat/chat-api';
import { toast } from 'sonner';

interface UseMediaModalsOptions {
  activeColony: Colony | undefined;
}

export function useMediaModals({ activeColony }: UseMediaModalsOptions) {
  // Media Picker state
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState<'gifs' | 'stickers' | 'emojis'>('emojis');
  const [mediaSearchQuery, setMediaSearchQuery] = useState('');
  const [selectedGifCategory, setSelectedGifCategory] = useState<string | null>(null);

  // Server Media DB state
  const [serverDbEmojis, setServerDbEmojis] = useState<DiscordEmoji[]>([]);
  const [serverDbStickers, setServerDbStickers] = useState<DiscordSticker[]>([]);
  const [isLoadingServerMedia, setIsLoadingServerMedia] = useState(false);

  // Quick Add Emoji state
  const [isQuickAddEmojiOpen, setIsQuickAddEmojiOpen] = useState(false);
  const [quickEmojiName, setQuickEmojiName] = useState('');
  const [quickEmojiUrl, setQuickEmojiUrl] = useState('');
  const [quickEmojiCode, setQuickEmojiCode] = useState('');

  // Quick Add Sticker state
  const [isQuickAddStickerOpen, setIsQuickAddStickerOpen] = useState(false);
  const [quickStickerName, setQuickStickerName] = useState('');
  const [quickStickerUrl, setQuickStickerUrl] = useState('');

  const [isSubmittingServerMedia, setIsSubmittingServerMedia] = useState(false);

  // Load Server Emojis and Stickers from DB for active server
  useEffect(() => {
    if (!activeColony?.id) {
      setServerDbEmojis([]);
      setServerDbStickers([]);
      return;
    }
    let mounted = true;
    const loadServerMedia = async () => {
      try {
        setIsLoadingServerMedia(true);
        const [emojis, stickers] = await Promise.all([
          colonyApi.getServerEmojis(activeColony.id),
          colonyApi.getServerStickers(activeColony.id),
        ]);
        if (mounted) {
          setServerDbEmojis(emojis || []);
          setServerDbStickers(stickers || []);
        }
      } catch (err) {
        console.warn('Failed to load server emojis/stickers', activeColony.id, err);
      } finally {
        if (mounted) setIsLoadingServerMedia(false);
      }
    };
    loadServerMedia();
    return () => {
      mounted = false;
    };
  }, [activeColony?.id, isMediaPickerOpen]);

  const handleQuickAddEmoji = async () => {
    if (!activeColony?.id || !quickEmojiName.trim() || !quickEmojiUrl.trim()) return;
    try {
      setIsSubmittingServerMedia(true);
      const code = quickEmojiCode.trim() || `:${quickEmojiName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')}:`;
      const created = await colonyApi.addServerEmoji(activeColony.id, {
        name: quickEmojiName.trim(),
        code,
        url: quickEmojiUrl.trim(),
      });
      if (created) {
        setServerDbEmojis((prev) => [...prev, created]);
        toast.success(`Emoji ${code} berhasil disimpan ke database colony! ✨`);
        setQuickEmojiName('');
        setQuickEmojiUrl('');
        setQuickEmojiCode('');
        setIsQuickAddEmojiOpen(false);
      }
    } catch {
      toast.error('Gagal menambahkan emoji colony');
    } finally {
      setIsSubmittingServerMedia(false);
    }
  };

  const handleQuickAddSticker = async () => {
    if (!activeColony?.id || !quickStickerName.trim() || !quickStickerUrl.trim()) return;
    try {
      setIsSubmittingServerMedia(true);
      const created = await colonyApi.addServerSticker(activeColony.id, {
        name: quickStickerName.trim(),
        url: quickStickerUrl.trim(),
      });
      if (created) {
        setServerDbStickers((prev) => [...prev, created]);
        toast.success(`Stiker ${quickStickerName} berhasil disimpan ke database colony! 🏷️`);
        setQuickStickerName('');
        setQuickStickerUrl('');
        setIsQuickAddStickerOpen(false);
      }
    } catch {
      toast.error('Gagal menambahkan stiker colony');
    } finally {
      setIsSubmittingServerMedia(false);
    }
  };

  return {
    // Media Picker
    isMediaPickerOpen,
    setIsMediaPickerOpen,
    activeMediaTab,
    setActiveMediaTab,
    mediaSearchQuery,
    setMediaSearchQuery,
    selectedGifCategory,
    setSelectedGifCategory,

    // Server Media DB
    serverDbEmojis,
    setServerDbEmojis,
    serverDbStickers,
    setServerDbStickers,
    isLoadingServerMedia,

    // Quick Add Emoji
    isQuickAddEmojiOpen,
    setIsQuickAddEmojiOpen,
    quickEmojiName,
    setQuickEmojiName,
    quickEmojiUrl,
    setQuickEmojiUrl,
    quickEmojiCode,
    setQuickEmojiCode,
    handleQuickAddEmoji,

    // Quick Add Sticker
    isQuickAddStickerOpen,
    setIsQuickAddStickerOpen,
    quickStickerName,
    setQuickStickerName,
    quickStickerUrl,
    setQuickStickerUrl,
    handleQuickAddSticker,

    isSubmittingServerMedia,
  };
}
