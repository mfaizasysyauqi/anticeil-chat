import React from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import {
  checkTextRateLimit,
  recordTextMessage,
  validateTextMessage,
} from '@/features/chat-input';
import { isE2eeEnabled, encryptMessage } from '@/lib/e2ee';
import { colonyApi } from '../chat-api';
import type {
  ColonyChannel,
  Colony,
  ColonyMember,
  ColonyMessage,
  ColonyRole,
} from '@/chat/chat-types';
import type {
  DiscordEmoji,
  DiscordSticker,
  DiscordGifItem,
} from '../anticeil-media-data';
import { DIRECTORY_APPS } from '@/features/colony-settings/components/tabs/directory-apps-data';

function getBotSlashResponse(commandText: string, botName: string): string {
  const lower = commandText.toLowerCase();
  if (lower.startsWith('/wordle')) {
    return `🟩⬛🟨⬛🟩 **Wordle Daily #1042**\n> 🎯 **Tantangan Hari Ini:** Tebak kata 5 huruf dalam 6 kesempatan!\n> Ketik \`/wordle [tebakan]\` untuk mencoba peruntunganmu bersama anggota koloni.`;
  }
  if (lower.startsWith('/imagine')) {
    const prompt = commandText.replace(/^\/imagine\s*(prompt:)?/i, '').trim() || 'futuristic neon city';
    return `🎨 **Midjourney v6.1**\n> 🔍 *Prompt: "${prompt}"*\n> ⚡ *Status: Rendering 100% (4K HDR)*\n\nhttps://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=1000&auto=format&fit=crop&q=80`;
  }
  if (lower.startsWith('/farm')) {
    return `🌾 **Farm Merge Valley**\n> 🎉 **Panen Sukses!** Anda memperoleh **+45 Gandum**, **+20 Jagung**, dan **+150 Koin Koloni**.\n> 🐔 Lembah pertanian bertumbuh! Level Lembah naik ke **Lv. 4**.`;
  }
  if (lower.startsWith('/exoplanet')) {
    return `🚀 **EXOPLANET (Andy Weir Original)**\n> ⚠️ *Peringatan Darurat:* Kapal koloni Anda mengalami anomali gravitasi di atmosfer Kepler-452b!\n> Pilih keputusan tim: \`/exoplanet vote stabilizer\` atau \`/exoplanet vote thrusters\`.`;
  }
  if (lower.startsWith('/carl-bot') || lower.startsWith('/warn')) {
    return `🛡️ **Carl-bot Auto-Moderation**\n> 📋 Tindakan tercatat di log audit koloni. Pengawasan otomatis aktif untuk 24 jam ke depan.`;
  }
  if (lower.startsWith('/gartic')) {
    return `🎨 **Gartic Phone Party**\n> 📱 Lobby permainan telepon gambar telah dibuka! Masuk ke voice channel dan klik kartu untuk mulai menggambar.`;
  }
  if (lower.startsWith('/play') || lower.startsWith('/rythm')) {
    return `🎵 **Rythm Music**\n> 🎧 Memutar: **Lofi Hip Hop Radio - Beats to Relax/Study to** (24/7 Live Stream) di saluran suara. Volume: 100%.`;
  }
  if (lower.startsWith('/forge') || lower.startsWith('/lore') || lower.startsWith('/trivia')) {
    return `💍 **The Rings of Power**\n> 🌋 Api Barad-dûr menyala terang! Anda berhasil menempa artefak baru. Bonus reputasi koloni +10%.`;
  }
  return `🤖 **${botName}**: Perintah \`${commandText}\` berhasil diterima dan dieksekusi secara realtime di koloni!`;
}

export interface UseMessageActionsOptions {
  currentUser: any;
  activeChannel: ColonyChannel | null;
  activeColony?: Colony | null;
  members: ColonyMember[];
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  stagedAttachment: any;
  setStagedAttachment: (att: any) => void;
  messagesMap: Record<string, ColonyMessage[]>;
  setMessagesMap: React.Dispatch<React.SetStateAction<Record<string, ColonyMessage[]>>>;
  setPinnedMessages: React.Dispatch<React.SetStateAction<ColonyMessage[]>>;
  setIsMediaPickerOpen: (open: boolean) => void;
  setIsGiftModalOpen: (open: boolean) => void;
  setIsPinnedPopoverOpen: (open: boolean) => void;
  setAuthFeatureInfo: (info: { title: string; desc: string }) => void;
  setIsAuthRequiredOpen: (open: boolean) => void;
  replyingToMessage?: ColonyMessage | null;
  setReplyingToMessage?: React.Dispatch<React.SetStateAction<ColonyMessage | null>>;
  createCalendarEvent: (event: any) => Promise<any>;
  t: (key: string) => string;
}

export function useMessageActions({
  currentUser,
  activeChannel,
  activeColony,
  members,
  inputText,
  setInputText,
  stagedAttachment,
  setStagedAttachment,
  messagesMap,
  setMessagesMap,
  setPinnedMessages,
  setIsMediaPickerOpen,
  setIsGiftModalOpen,
  setIsPinnedPopoverOpen,
  setAuthFeatureInfo,
  setIsAuthRequiredOpen,
  replyingToMessage,
  setReplyingToMessage,
  createCalendarEvent,
  t,
}: UseMessageActionsOptions) {
  // Send message
  const handleSendMessage = async (customContent?: string, customAttachment?: any) => {
    if (!currentUser) {
      setAuthFeatureInfo({
        title: t('Kirim Pesan'),
        desc: t('Masuk ke Anticeil untuk mengirim pesan di saluran ini.'),
      });
      setIsAuthRequiredOpen(true);
      return;
    }
    if (!activeChannel) return;
    const trimmedContent = (typeof customContent === 'string' ? customContent : inputText).trim();
    if (!trimmedContent && !stagedAttachment && !customAttachment) return;

    // Check message character length limit
    if (trimmedContent) {
      const lengthCheck = validateTextMessage(trimmedContent);
      if (!lengthCheck.valid) {
        toast.error(lengthCheck.error);
        return;
      }
    }

    // Check anti-spam rate limit
    const rateCheck = checkTextRateLimit();
    if (!rateCheck.allowed) {
      toast.error(rateCheck.reason || 'Terlalu cepat mengirim pesan. Harap tunggu sebentar.');
      return;
    }

    recordTextMessage();

    const currentUserId = currentUser?.id || 'anon-user';
    const currentUserName =
      `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() ||
      currentUser?.email?.split('@')[0] ||
      'Pengguna Anticeil';

    const myMemberInfo = members.find((m) => m.id === currentUserId || m.email === currentUser?.email);
    let myRole: ColonyRole = myMemberInfo?.role || 'member';
    if (activeColony?.role === 'owner') {
      myRole = 'owner';
    } else if (activeColony?.role === 'admin') {
      myRole = 'admin';
    }

    const contentToSend =
      trimmedContent && isE2eeEnabled()
        ? await encryptMessage(trimmedContent, activeChannel.id)
        : trimmedContent;

    const chosenAttachment = customAttachment || stagedAttachment;
    const payload: Partial<ColonyMessage> = {
      channelId: activeChannel.id,
      senderId: currentUserId,
      senderName: currentUserName,
      senderEmail: currentUser?.email || 'user@anticeil.com',
      senderAvatar: currentUser?.imageUrl ?? null,
      senderRole: myRole,
      content: contentToSend,
      attachments: chosenAttachment ? [chosenAttachment] : undefined,
      replyTo: replyingToMessage ? {
        id: replyingToMessage.id,
        senderId: replyingToMessage.senderId,
        senderName: replyingToMessage.senderName,
        content: replyingToMessage.content,
        senderAvatar: replyingToMessage.senderAvatar,
      } : null,
    };

    if (!customContent) {
      setInputText('');
    }
    setStagedAttachment(null);
    setReplyingToMessage?.(null);

    try {
      const saved = await colonyApi.sendMessage(activeChannel.id, payload);
      setMessagesMap((prev) => {
        const list = prev[activeChannel.id] || [];
        if (list.some((m) => m.id === saved.id)) return prev;
        return {
          ...prev,
          [activeChannel.id]: [...list, saved],
        };
      });

      // ── Bot Slash Command Handling ──
      if (trimmedContent.startsWith('/')) {
        const rawCmd = trimmedContent.split(' ')[0].toLowerCase();
        const installed = activeColony?.installedApps || [];

        // Find matching bot among installed apps or directory apps
        let targetBot = installed.find((b) =>
          b.slashCommands?.some((c) => c.toLowerCase().startsWith(rawCmd))
        );

        if (!targetBot) {
          const dirBot = DIRECTORY_APPS.find((d) =>
            d.commands.some((c) => c.toLowerCase().startsWith(rawCmd))
          );
          if (dirBot) {
            targetBot = {
              id: dirBot.id,
              name: dirBot.name,
              description: dirBot.description,
              category: dirBot.category,
              icon: dirBot.iconText,
              slashCommands: dirBot.commands,
              permissions: dirBot.permissions,
              enabled: true,
            };
          }
        }

        if (targetBot) {
          if (targetBot.enabled === false) {
            toast.warning(t(`Bot ${targetBot.name} sedang dinonaktifkan di server ini.`));
          } else if (
            targetBot.allowedChannels &&
            targetBot.allowedChannels.length > 0 &&
            !targetBot.allowedChannels.includes(activeChannel.id)
          ) {
            toast.warning(t(`Bot ${targetBot.name} tidak memiliki izin di saluran ini.`));
          } else {
            // Trigger simulated bot response
            setTimeout(async () => {
              try {
                const botReply = getBotSlashResponse(trimmedContent, targetBot.name);
                const botPayload: Partial<ColonyMessage> = {
                  channelId: activeChannel.id,
                  senderId: `bot_${targetBot.id}`,
                  senderName: targetBot.name,
                  senderEmail: `${targetBot.id}@bot.anticeil.com`,
                  senderAvatar: targetBot.icon || null,
                  senderRole: 'bot' as ColonyRole,
                  content: botReply,
                  replyTo: {
                    id: saved.id,
                    senderId: saved.senderId,
                    senderName: saved.senderName,
                    content: saved.content,
                  },
                };
                const botMsg = await colonyApi.sendMessage(activeChannel.id, botPayload);
                setMessagesMap((prev) => {
                  const list = prev[activeChannel.id] || [];
                  if (list.some((m) => m.id === botMsg.id)) return prev;
                  return {
                    ...prev,
                    [activeChannel.id]: [...list, botMsg],
                  };
                });
              } catch (botErr) {
                console.error('Failed to execute bot response', botErr);
              }
            }, 600);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to send message', err);
      const errMsg = err?.response?.data?.message || err?.data?.message || err?.message;
      if (errMsg && typeof errMsg === 'string') {
        toast.error(errMsg);
      } else {
        toast.error(t('Gagal mengirim pesan'));
      }
    }
  };

  // Schedule Message connected directly to PostgreSQL Calendar Database
  const handleScheduleMessage = async (scheduledDate: Date, customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend) {
      toast.error(t('Tulis pesan terlebih dahulu untuk dijadwalkan'));
      return;
    }

    try {
      await createCalendarEvent({
        title: `Scheduled: ${textToSend.slice(0, 30)}`,
        description: textToSend,
        type: 'task',
        startTime: scheduledDate.toISOString(),
        colonyId: activeColony?.id,
        hubName: activeColony?.name,
        channelId: activeChannel?.id,
        channelName: activeChannel?.name,
        status: 'scheduled',
      });
      toast.success(
        `${t('Pesan dijadwalkan untuk')} ${scheduledDate.toLocaleString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`,
      );
      setInputText('');
    } catch (err) {
      console.error('Failed to schedule message:', err);
      toast.error(t('Gagal menjadwalkan pesan ke database kalender'));
    }
  };

  // Discord-style Poll Creator
  const handleCreatePoll = async (question: string, options: string[]) => {
    if (!activeChannel) return;
    const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const optionsText = options
      .map((opt, i) => `${numberEmojis[i] || '▫️'} ${opt}`)
      .join('\n');
    const pollMessage = `📊 **POLL: ${question}**\n\n${optionsText}\n\n*${t('Bereaksi dengan emoji nomor di bawah untuk memilih!')}*`;

    try {
      await handleSendMessage(pollMessage);
      toast.success(t('Poll berhasil dibuat!'));
    } catch {
      toast.error(t('Gagal membuat poll'));
    }
  };

  // Fullstack Discord Sticker sender (direct message attachment)
  const handleSendSticker = async (sticker: DiscordSticker) => {
    if (!activeChannel) return;
    const rateCheck = checkTextRateLimit();
    if (!rateCheck.allowed) {
      toast.error(rateCheck.reason || 'Terlalu cepat mengirim pesan. Harap tunggu sebentar.');
      return;
    }
    recordTextMessage();
    setIsMediaPickerOpen(false);
    const currentUserId = currentUser?.id || 'anon-user';
    const currentUserName =
      `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() ||
      currentUser?.email?.split('@')[0] ||
      'Pengguna Anticeil';

    const myMemberInfo = members.find((m) => m.id === currentUserId || m.email === currentUser?.email);
    let myRole: ColonyRole = myMemberInfo?.role || 'member';
    if (activeColony?.role === 'owner') myRole = 'owner';
    else if (activeColony?.role === 'admin') myRole = 'admin';

    const payload: Partial<ColonyMessage> = {
      channelId: activeChannel.id,
      senderId: currentUserId,
      senderName: currentUserName,
      senderEmail: currentUser?.email || 'user@anticeil.com',
      senderAvatar: currentUser?.imageUrl ?? null,
      senderRole: myRole,
      content: '',
      attachments: [
        {
          type: 'sticker',
          url: sticker.url,
          name: sticker.name,
        },
      ],
    };

    try {
      const saved = await colonyApi.sendMessage(activeChannel.id, payload);
      setMessagesMap((prev) => {
        const list = prev[activeChannel.id] || [];
        if (list.some((m) => m.id === saved.id)) return prev;
        return { ...prev, [activeChannel.id]: [...list, saved] };
      });
    } catch (err) {
      console.error('Failed to send sticker', err);
    }
  };

  // Fullstack Discord GIF sender (direct animated GIF attachment)
  const handleSendGif = async (gif: DiscordGifItem) => {
    if (!activeChannel) return;
    const rateCheck = checkTextRateLimit();
    if (!rateCheck.allowed) {
      toast.error(rateCheck.reason || 'Terlalu cepat mengirim pesan. Harap tunggu sebentar.');
      return;
    }
    recordTextMessage();
    setIsMediaPickerOpen(false);
    const currentUserId = currentUser?.id || 'anon-user';
    const currentUserName =
      `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() ||
      currentUser?.email?.split('@')[0] ||
      'Pengguna Anticeil';

    const myMemberInfo = members.find((m) => m.id === currentUserId || m.email === currentUser?.email);
    let myRole: ColonyRole = myMemberInfo?.role || 'member';
    if (activeColony?.role === 'owner') myRole = 'owner';
    else if (activeColony?.role === 'admin') myRole = 'admin';

    const payload: Partial<ColonyMessage> = {
      channelId: activeChannel.id,
      senderId: currentUserId,
      senderName: currentUserName,
      senderEmail: currentUser?.email || 'user@anticeil.com',
      senderAvatar: currentUser?.imageUrl ?? null,
      senderRole: myRole,
      content: '',
      attachments: [
        {
          type: 'gif',
          url: gif.url,
          name: gif.title,
        },
      ],
    };

    try {
      const saved = await colonyApi.sendMessage(activeChannel.id, payload);
      setMessagesMap((prev) => {
        const list = prev[activeChannel.id] || [];
        if (list.some((m) => m.id === saved.id)) return prev;
        return { ...prev, [activeChannel.id]: [...list, saved] };
      });
    } catch (err) {
      console.error('Failed to send GIF', err);
    }
  };

  // Fullstack Discord Nitro Gift sender (interactive gift card in chat)
  const handleSendGift = async (tier: 'nectar' | 'pollen' | 'royal' | 'nitro' | 'nitro_basic') => {
    if (!activeChannel) return;
    setIsGiftModalOpen(false);
    const isRoyal = tier === 'royal';
    const isNectar = tier === 'nectar' || tier === 'nitro';
    const currentUserId = currentUser?.id || 'anon-user';
    const currentUserName =
      `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() ||
      currentUser?.email?.split('@')[0] ||
      'Pengguna Anticeil';

    const myMemberInfo = members.find((m) => m.id === currentUserId || m.email === currentUser?.email);
    let myRole: ColonyRole = myMemberInfo?.role || 'member';
    if (activeColony?.role === 'owner') myRole = 'owner';
    else if (activeColony?.role === 'admin') myRole = 'admin';

    const giftTitle = isRoyal ? 'Royal Enterprise 👑' : isNectar ? 'Nectar 🍯' : 'Pollen 🌼';
    const giftName = isRoyal
      ? 'Anticeil Royal Enterprise (1 Bulan)'
      : isNectar
      ? 'Anticeil Nectar (1 Bulan)'
      : 'Anticeil Pollen (1 Bulan)';
    const giftPrice = isRoyal ? 'IDR 499,000' : isNectar ? 'IDR 142,714' : 'IDR 42,714';

    const payload: Partial<ColonyMessage> = {
      channelId: activeChannel.id,
      senderId: currentUserId,
      senderName: currentUserName,
      senderEmail: currentUser?.email || 'user@anticeil.com',
      senderAvatar: currentUser?.imageUrl ?? null,
      senderRole: myRole,
      content: `🎁 Hadiah Anticeil ${giftTitle} untuk kamu!`,
      attachments: [
        {
          type: 'gift',
          url: isRoyal
            ? 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/crown.svg'
            : isNectar
            ? 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/sparkles.svg'
            : '',
          name: giftName,
          giftData: {
            tier,
            price: giftPrice,
            claimed: false,
          },
        },
      ],
    };

    try {
      const saved = await colonyApi.sendMessage(activeChannel.id, payload);
      setMessagesMap((prev) => {
        const list = prev[activeChannel.id] || [];
        if (list.some((m) => m.id === saved.id)) return prev;
        return { ...prev, [activeChannel.id]: [...list, saved] };
      });
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
      toast.success(t(`Berhasil mengirimkan Hadiah ${giftTitle}! 🎉`));
    } catch (err) {
      console.error('Failed to send gift', err);
    }
  };

  // Fullstack Emoji inserter / handler
  const handleSelectEmoji = (emoji: DiscordEmoji) => {
    if (emoji.url.length <= 4 && !emoji.url.startsWith('http')) {
      setInputText((prev) => prev + emoji.url);
    } else {
      setInputText((prev) => (prev ? `${prev} ${emoji.code} ` : `${emoji.code} `));
    }
  };

  // Delete message (Message CRUD)
  const handleDeleteMessage = async (msgId: string) => {
    if (!activeChannel) return;
    setMessagesMap((prev) => {
      const list = prev[activeChannel.id] || [];
      return {
        ...prev,
        [activeChannel.id]: list.filter((m) => m.id !== msgId),
      };
    });
    try {
      await colonyApi.deleteMessage(msgId);
    } catch (err) {
      console.error('Failed to delete message', err);
    }
  };

  // Toggle reaction
  const handleToggleReaction = async (msgId: string, emoji: string) => {
    if (!activeChannel) return;
    const currentUserId = currentUser?.id || 'me';

    setMessagesMap((prev) => {
      const list = prev[activeChannel.id] || [];
      const updatedList = list.map((msg) => {
        if (msg.id !== msgId) return msg;
        const reactions = { ...(msg.reactions || {}) };
        const userList = reactions[emoji] || [];
        if (userList.includes(currentUserId)) {
          reactions[emoji] = userList.filter((id) => id !== currentUserId);
          if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
          reactions[emoji] = [...userList, currentUserId];
        }
        return { ...msg, reactions };
      });
      return {
        ...prev,
        [activeChannel.id]: updatedList,
      };
    });

    try {
      await colonyApi.toggleReaction(msgId, emoji, currentUserId);
    } catch (err) {
      console.error('Failed to toggle reaction', err);
    }
  };

  // Toggle Pin Message Handler
  const handleTogglePin = async (msgId: string) => {
    if (!activeChannel) return;
    try {
      const updated = await colonyApi.togglePinMessage(
        msgId,
        activeChannel.id,
        currentUser?.firstName || currentUser?.email || 'You',
      );

      // Update message in messagesMap
      setMessagesMap((prev) => {
        const list = prev[activeChannel.id] || [];
        return {
          ...prev,
          [activeChannel.id]: list.map((m) =>
            m.id === msgId
              ? {
                  ...m,
                  isPinned: updated.isPinned,
                  pinnedAt: updated.pinnedAt,
                  pinnedBy: updated.pinnedBy,
                }
              : m,
          ),
        };
      });

      // Update pinnedMessages list
      setPinnedMessages((prev) => {
        if (updated.isPinned) {
          const target = (messagesMap[activeChannel.id] || []).find((m) => m.id === msgId);
          if (target) {
            return [
              {
                ...target,
                isPinned: true,
                pinnedAt: updated.pinnedAt,
                pinnedBy: updated.pinnedBy,
              },
              ...prev.filter((m) => m.id !== msgId),
            ];
          }
          return prev;
        } else {
          return prev.filter((m) => m.id !== msgId);
        }
      });

      if (updated.isPinned) {
        toast.success(t('Pesan disematkan ke saluran ini 📌'));
      } else {
        toast.info(t('Pesan dilepas dari sematan saluran'));
      }
    } catch (err) {
      console.error('Failed to toggle pin', err);
      toast.error(t('Gagal mengubah status sematan pesan'));
    }
  };

  // Jump to Message in chat
  const handleJumpToMessage = (msgId: string) => {
    setIsPinnedPopoverOpen(false);
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-primary/20', 'transition-colors', 'duration-500');
      setTimeout(() => {
        el.classList.remove('bg-primary/20');
      }, 2500);
    } else {
      toast.info('Pesan berada di riwayat percakapan sebelumnya');
    }
  };

  // Voice Note Send
  const handleSendVoiceNote = async (blob: Blob, durationSeconds: number) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      const voiceAttachment = {
        name: `Voice Note (${Math.round(durationSeconds)}s)`,
        type: 'voice-note' as const,
        url: dataUrl,
        duration: durationSeconds,
        size: `${Math.round(blob.size / 1024)} KB`,
      };
      await handleSendMessage('', voiceAttachment);
    };
    reader.readAsDataURL(blob);
  };

  return {
    handleSendMessage,
    handleSendVoiceNote,
    handleScheduleMessage,
    handleCreatePoll,
    handleSendSticker,
    handleSendGif,
    handleSendGift,
    handleSelectEmoji,
    handleDeleteMessage,
    handleToggleReaction,
    handleTogglePin,
    handleJumpToMessage,
  };
}
