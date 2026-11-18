import { useMemo, useEffect, useRef } from 'react';
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
  // Channels filtered by selected Hub (must match colony sidebar and avoid dropping custom categories)
  const colonyChannels = useMemo(() => {
    return channels.filter(
      (c) =>
        (c.colonyId || 'anticeil') === (activeColonyId || 'anticeil') &&
        !c.isDirectMessage &&
        c.category !== 'DIRECT MESSAGES' &&
        !c.id.startsWith('dm-') &&
        !c.id.startsWith('gdm-'),
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
        (c.id.startsWith('dm-') || c.id.startsWith('gdm-') || c.isDirectMessage || c.isGroupDm) &&
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
      if (activeChannelId.startsWith('gdm-')) {
        return channels.find((c) => c.id === activeChannelId) || null;
      }
      if (activeChannelId.startsWith('dm-')) {
        const parts = activeChannelId.slice(3).split('-').filter(Boolean);
        const otherUserId =
          parts.find((p) => p !== currentUser?.id) || parts[0];
        const otherMember = members.find((m) => m.id === otherUserId);
        if (!otherMember || otherUserId === 'u1' || otherUserId === 'anticeil') {
          return null;
        }
        const dmName =
          otherMember.name || otherMember.username || 'Pengguna';
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
    if (colonyChannels.length === 0) {
      if (activeChannelId) {
        return channels.find((c) => c.id === activeChannelId) || null;
      }
      return null;
    }
    if (activeChannelId) {
      const current =
        colonyChannels.find((c) => c.id === activeChannelId) ||
        channels.find((c) => c.id === activeChannelId);
      if (current) return current;
    }
    // Default to the first text channel (# general), NEVER accidentally jump into a voice channel
    const defaultText = colonyChannels.find((c) => c.type === 'text' || !c.type);
    return defaultText || colonyChannels[0] || null;
  }, [isHome, activeChannelId, dmChannels, colonyChannels, channels, members, currentUser]);

  // Track previous channel ID so voice call auto-connects ONLY when the user explicitly switches into a voice channel,
  // and NEVER re-triggers when activeCallChannelId is cleared (e.g. on disconnect/leave).
  const prevChannelIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeChannel?.id && activeChannel.id !== prevChannelIdRef.current) {
      prevChannelIdRef.current = activeChannel.id;
      if (activeChannel.type === 'voice') {
        setActiveCallChannelId(activeChannel.id);
        setIsCallPiP(false);
      }
    }
  }, [
    activeChannel?.id,
    activeChannel?.type,
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
