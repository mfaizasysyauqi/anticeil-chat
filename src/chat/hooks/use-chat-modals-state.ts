import { useState } from 'react';
import { useColonyModals } from '@/features/colonies';
import { useChannelModals } from '@/features/channels';
import { useMediaModals } from '@/features/media';
import type { Colony, ColonyChannel, ColonyMember } from '../chat-types';

export interface UseChatModalsStateProps {
  colonies: Colony[];
  setColonies: React.Dispatch<React.SetStateAction<Colony[]>>;
  channels: ColonyChannel[];
  setChannels: React.Dispatch<React.SetStateAction<ColonyChannel[]>>;
  activeColony: Colony | null;
  setActiveColonyId: (id: string) => void;
  setActiveChannelId: (id: string) => void;
  setActiveCallChannelId: (id: string | null) => void;
  setIsCallPiP: (pip: boolean) => void;
  setSelectedActivityAppId: (appId: string | null) => void;
  setIsActivityOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setMembers: React.Dispatch<React.SetStateAction<ColonyMember[]>>;
  activeColonyId: string;
  activeChannelId: string;
  t: (key: string, params?: Record<string, any>) => string;
}

export function useChatModalsState(props: UseChatModalsStateProps) {
  const {
    colonies,
    setColonies,
    channels,
    setChannels,
    activeColony,
    setActiveColonyId,
    setActiveChannelId,
    setActiveCallChannelId,
    setIsCallPiP,
    setSelectedActivityAppId,
    setIsActivityOpen,
    setMembers,
    activeColonyId,
    activeChannelId,
    t,
  } = props;

  const colonyModals = useColonyModals({
    colonies,
    setColonies,
    channels,
    setChannels,
    activeColony: activeColony || undefined,
    setActiveColonyId,
    setActiveChannelId,
    setActiveCallChannelId,
    setIsCallPiP,
    setSelectedActivityAppId,
    setIsActivityOpen,
    setMembers,
    t,
  });

  const channelModals = useChannelModals({
    activeColonyId,
    channels,
    setChannels,
    activeChannelId,
    setActiveChannelId,
    t,
  });

  const mediaModals = useMediaModals({ activeColony: activeColony || undefined });
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [claimedGifts, setClaimedGifts] = useState<Record<string, boolean>>({});

  return {
    colonyModals,
    channelModals,
    mediaModals,
    isGiftModalOpen,
    setIsGiftModalOpen,
    claimedGifts,
    setClaimedGifts,
  };
}
