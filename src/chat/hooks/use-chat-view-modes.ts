import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface UseChatViewModesOptions {
  isHome: boolean;
  activeChannel: any;
  unreadNotifCount: number;
  setActiveColonyId: (id: string) => void;
  setActiveChannelId: (id: string) => void;
  t: (key: string) => string;
}

export function useChatViewModes({
  isHome,
  activeChannel,
  unreadNotifCount,
  setActiveColonyId,
  setActiveChannelId,
  t,
}: UseChatViewModesOptions) {
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number | string>>(() => ({
    anticeil: 3,
    hub_general: 47,
    hub_gaming: 167,
    hub_dev: 353,
    hub_anime: 651,
    hub_crypto: 87,
    hub_music: 743,
    hub_study: 512,
  }));

  const [homeView, setHomeView] = useState<
    'friends' | 'colonies' | 'servers' | 'message-requests' | 'notifications' | 'calendar' | 'assignments' | 'calls' | 'apps' | 'shop'
  >(() => {
    try {
      if (typeof window !== 'undefined') {
        const p = window.location.pathname.toLowerCase();
        if (p === '/shop') return 'shop';
        if (p === '/applications' || p === '/applications&activities' || p === '/apps' || p === '/app-directory') return 'apps';
        if (p === '/friends') return 'friends';
        if (p === '/calendar') return 'calendar';
        if (p === '/calls') return 'calls';
        if (p === '/colonies') return 'colonies';
        if (p === '/notifications') return 'notifications';
        if (p === '/message-requests') return 'message-requests';
        if (p === '/assignments') return 'assignments';
      }
    } catch {}
    return 'apps';
  });

  const [railMode, setRailMode] = useState<'servers' | 'friends'>(() => {
    try {
      const saved = localStorage.getItem('anticeil_rail_mode');
      return saved === 'servers' ? 'servers' : 'friends';
    } catch {
      return 'friends';
    }
  });

  const [collapsedCategories, setCollapsedCategories] = useState<{
    text: boolean;
    voice: boolean;
    forum: boolean;
  }>({ text: false, voice: false, forum: false });

  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isMobileChannelsOpen, setIsMobileChannelsOpen] = useState(false);
  const [isMobileMembersOpen, setIsMobileMembersOpen] = useState(false);

  useEffect(() => {
    const handleToggleMobileChannels = () => {
      setIsMobileChannelsOpen((prev) => !prev);
    };
    window.addEventListener('anticeil_toggle_mobile_channels', handleToggleMobileChannels);
    return () => {
      window.removeEventListener('anticeil_toggle_mobile_channels', handleToggleMobileChannels);
    };
  }, []);

  useEffect(() => {
    setUnreadCounts((prev) => {
      if (prev.anticeil === unreadNotifCount) return prev;
      return { ...prev, anticeil: unreadNotifCount };
    });
  }, [unreadNotifCount]);

  const handleToggleRailMode = () => {
    setRailMode((prev) => {
      const next = prev === 'servers' ? 'friends' : 'servers';
      try {
        localStorage.setItem('anticeil_rail_mode', next);
      } catch {}
      if (next === 'friends') {
        setActiveColonyId('anticeil');
        setActiveChannelId('');
        setHomeView('friends');
      } else {
        setActiveColonyId('anticeil');
        setActiveChannelId('');
        setHomeView('colonies');
      }
      toast.info(next === 'friends' ? t('Beralih ke Mode Teman') : t('Beralih ke Mode Colony'));
      return next;
    });
  };

  const isFriendsView = isHome && !activeChannel && homeView === 'friends';
  const isMessageRequestsView = isHome && !activeChannel && homeView === 'message-requests';
  const isNotificationsView = isHome && !activeChannel && homeView === 'notifications';
  const isCalendarView = isHome && !activeChannel && homeView === 'calendar';
  const isAssignmentsView = isHome && !activeChannel && homeView === 'assignments';
  const isCallsView = isHome && !activeChannel && homeView === 'calls';
  const isAppsView = isHome && !activeChannel && homeView === 'apps';
  const isShopView = isHome && !activeChannel && homeView === 'shop';
  const isColoniesView = isHome && !activeChannel && (homeView === 'colonies' || homeView === 'servers');

  return {
    unreadCounts,
    setUnreadCounts,
    homeView,
    setHomeView,
    railMode,
    setRailMode,
    handleToggleRailMode,
    collapsedCategories,
    setCollapsedCategories,
    isMuted,
    setIsMuted,
    isDeafened,
    setIsDeafened,
    isMobileChannelsOpen,
    setIsMobileChannelsOpen,
    isMobileMembersOpen,
    setIsMobileMembersOpen,
    isFriendsView,
    isMessageRequestsView,
    isNotificationsView,
    isCalendarView,
    isAssignmentsView,
    isCallsView,
    isAppsView,
    isShopView,
    isColoniesView,
  };
}
