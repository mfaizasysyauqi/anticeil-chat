import { useState, useEffect, useMemo } from 'react';
import { Colony, ColonyChannel, ColonyId, ColonyMember } from '../chat-types';
import { DEFAULT_COLONIES, loadStoredColonies, loadStoredDmChannels, DEFAULT_CHANNELS } from '../chat-defaults';

interface UseColonyDataOptions {
  /** Called when "anticeil_open_create_colony" event fires */
  onOpenCreateColony?: () => void;
  /** Called when "anticeil_open_add_friend" event fires */
  onOpenAddFriend?: () => void;
}

export function useColonyData(options?: UseColonyDataOptions) {
  const { onOpenCreateColony, onOpenAddFriend } = options || {};
  const [colonies, setColonies] = useState<Colony[]>(() => loadStoredColonies());

  const [activeColonyId, setActiveColonyId] = useState<ColonyId>(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname.toLowerCase();
      if (pathname.startsWith('/channels/') && !pathname.startsWith('/channels/@me')) {
        const parts = pathname.split('/').filter(Boolean);
        if (parts[1]) return parts[1];
      }
      const params = new URLSearchParams(window.location.search);
      const fromUrl =
        params.get('colony') ||
        params.get('hub') ||
        (params.get('invite')?.startsWith('hub_') ? params.get('invite') : null);
      if (fromUrl) return fromUrl;
    }
    return 'anticeil';
  });

  const [channels, setChannels] = useState<ColonyChannel[]>(() => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('ap_token')) : null;
    if (!token) return DEFAULT_CHANNELS;
    const storedDms = loadStoredDmChannels();
    return [...storedDms, ...DEFAULT_CHANNELS];
  });

  const [activeChannelId, setActiveChannelId] = useState<string>(() => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('ap_token')) : null;
    if (!token) return '';
    return new URLSearchParams(window.location.search).get('channel') || '';
  });

  const [members, setMembers] = useState<ColonyMember[]>([]);

  // Derived: active colony object
  const activeColony = useMemo(
    () =>
      colonies.find((h) => h.id === activeColonyId) ||
      colonies.find((h) => h.id === 'anticeil') ||
      colonies[0],
    [colonies, activeColonyId],
  );

  // Event listeners: colony switch + create colony + add friend
  useEffect(() => {
    const handleSwitchColony = (e: any) => {
      const colonyId = e.detail;
      if (!colonyId) return;
      setActiveColonyId(colonyId);
      if (colonyId === 'anticeil') {
        setActiveChannelId('');
      } else {
        const firstCh = channels.find(
          (c) => (c.colonyId || 'anticeil') === colonyId && c.category === 'CHANNELS',
        );
        if (firstCh) setActiveChannelId(firstCh.id);
      }
    };

    const handleCreateColony = () => {
      onOpenCreateColony?.();
    };

    const handleAddFriend = () => {
      onOpenAddFriend?.();
    };

    window.addEventListener('anticeil_switch_colony', handleSwitchColony as EventListener);
    window.addEventListener('anticeil_switch_hub', handleSwitchColony as EventListener);
    window.addEventListener('anticeil_open_create_colony', handleCreateColony);
    window.addEventListener('anticeil_open_add_friend', handleAddFriend);
    return () => {
      window.removeEventListener('anticeil_switch_colony', handleSwitchColony as EventListener);
      window.removeEventListener('anticeil_switch_hub', handleSwitchColony as EventListener);
      window.removeEventListener('anticeil_open_create_colony', handleCreateColony);
      window.removeEventListener('anticeil_open_add_friend', handleAddFriend);
    };
  }, [channels, onOpenCreateColony, onOpenAddFriend]);

  return {
    colonies,
    setColonies,
    activeColonyId,
    setActiveColonyId,
    channels,
    setChannels,
    activeChannelId,
    setActiveChannelId,
    members,
    setMembers,
    activeColony,
  };
}

