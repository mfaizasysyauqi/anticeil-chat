import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { colonyApi } from '@/chat/chat-api';
import type {
  ColonyChannel,
  ColonyMessage,
  ColonyChannelNotification,
  ColonyChannelNotificationLevel,
} from '@/chat/chat-types';

interface UseChannelPinsNotificationsOptions {
  activeChannel: ColonyChannel | null;
}

export function useChannelPinsNotifications({ activeChannel }: UseChannelPinsNotificationsOptions) {
  const [isPinnedPopoverOpen, setIsPinnedPopoverOpen] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<ColonyMessage[]>([]);

  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [channelNotification, setChannelNotification] = useState<ColonyChannelNotification>({
    channelId: '',
    userId: 'me',
    level: 'default',
    isMuted: false,
    mutedUntil: null,
  });

  const handleUpdateNotification = useCallback(
    async (
      level?: ColonyChannelNotificationLevel,
      muteState?: boolean,
      mutedUntil?: string | null,
    ) => {
      if (!activeChannel) return;
      const nextLevel = level !== undefined ? level : channelNotification.level;
      const nextMuted = muteState !== undefined ? muteState : channelNotification.isMuted;
      const nextUntil = mutedUntil !== undefined ? mutedUntil : channelNotification.mutedUntil;

      setChannelNotification((prev) => ({
        ...prev,
        level: nextLevel,
        isMuted: nextMuted,
        mutedUntil: nextUntil,
      }));

      try {
        await colonyApi.updateChannelNotification(activeChannel.id, {
          level: nextLevel,
          isMuted: nextMuted,
          mutedUntil: nextUntil,
        });
        if (muteState !== undefined) {
          toast.success(nextMuted ? 'Saluran dibisukan 🔕' : 'Saluran dibunyikan kembali 🔔');
        } else {
          toast.success(`Notifikasi saluran diatur ke: ${nextLevel}`);
        }
      } catch (err) {
        console.error('Failed to update notification settings', err);
        toast.error('Gagal memperbarui notifikasi saluran');
      }
    },
    [activeChannel, channelNotification],
  );

  return {
    isPinnedPopoverOpen,
    setIsPinnedPopoverOpen,
    pinnedMessages,
    setPinnedMessages,
    isNotificationDropdownOpen,
    setIsNotificationDropdownOpen,
    channelNotification,
    setChannelNotification,
    handleUpdateNotification,
  };
}

