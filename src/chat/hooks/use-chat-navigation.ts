import { useMemo, useEffect } from 'react';
import type { ColonyChannel, ColonyMember } from '../chat-types';

export interface UseChatNavigationProps {
  channels: ColonyChannel[];
  activeColonyId: string;
  activeChannelId: string;
  currentUser: any;
  members: ColonyMember[];
  activeCallChannelId: string | null;
  setActiveCallChannelId: (id: string | null) => void;
  setIsCallPiP: (pip: boolean) => void;
}

export function useChatNavigation({
  channels,
  activeColonyId,
  activeChannelId,
  currentUser,
  members,
  activeCallChannelId,
  setActiveCallChannelId,
  setIsCallPiP,
}: UseChatNavigationProps) {
  // Channels filtered by selected Hub
  const colonyChannels = useMemo(() => {
    return channels.filter(
      (c) =>
        (c.colonyId || 'anticeil') === (activeColonyId || 'anticeil') &&
        c.category === 'CHANNELS',
    );
  }, [channels, activeColonyId]);

  const textChannels = useMemo(() => {
    return colonyChannels.filter((c) => c.type === 'text' || !c.type);
  }, [colonyChannels]);

  const voiceChannels = useMemo(() => {
    return colonyChannels.filter((c) => c.type === 'voice');
  }, [colonyChannels]);

  const forumChannels = useMemo(() => {
    return colonyChannels.filter((c) => c.type === 'forum');
  }, [colonyChannels]);

  const dmChannels = useMemo(() => {
    return channels.filter(
      (c) =>
        c.category === 'DIRECT MESSAGES' &&
        typeof c.id === 'string' &&
        c.id.startsWith('dm-') &&
        (!c.colonyId || c.colonyId === 'anticeil') &&
        c.type !== 'voice' &&
        c.type !== 'forum' &&
        c.type !== 'kanban',
    );
  }, [channels]);

  const isHome = activeColonyId === 'anticeil';

  // Active channel resolution: Home prefers explicit activeChannelId (DM chat) or null (Friends page).
  // Servers MUST strictly isolate channels to the active server!
  const activeChannel = useMemo(() => {
    if (isHome) {
      if (!activeChannelId) return null;
      const found = dmChannels.find((c) => c.id === activeChannelId);
      if (found) return found;
      if (activeChannelId.startsWith('dm-')) {
        const parts = activeChannelId.slice(3).split('-').filter(Boolean);
        const otherUserId =
          parts.find((p) => p !== currentUser?.id) || parts[0];
        const otherMember = members.find((m) => m.id === otherUserId);
        const dmName =
          otherMember?.name || otherMember?.username || 'Direct Message';
        return {
          id: activeChannelId,
          name: dmName,
          description: `Percakapan langsung dengan ${dmName}`,
          category: 'DIRECT MESSAGES',
          colonyId: 'anticeil',
          isDirectMessage: true,
          dmUserId: otherUserId,
          type: 'text',
        } as ColonyChannel;
      }
      return null;
    }
    if (colonyChannels.length === 0) return null;
    if (activeChannelId) {
      const current = colonyChannels.find((c) => c.id === activeChannelId);
      if (current) return current;
    }
    return colonyChannels[0] || null;
  }, [isHome, activeChannelId, dmChannels, colonyChannels, members, currentUser]);

  // Automatically connect to voice call when switching to or opening a voice channel
  useEffect(() => {
    if (activeChannel?.type === 'voice') {
      if (activeCallChannelId !== activeChannel.id) {
        setActiveCallChannelId(activeChannel.id);
        setIsCallPiP(false);
      }
    }
  }, [
    activeChannel?.id,
    activeChannel?.type,
    activeCallChannelId,
    setActiveCallChannelId,
    setIsCallPiP,
  ]);

  return {
    colonyChannels,
    textChannels,
    voiceChannels,
    forumChannels,
    dmChannels,
    isHome,
    activeChannel,
  };
}
