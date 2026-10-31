import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  Plus,
  Send,
  Settings,
  Check,
  Webhook,
  Pin,
  Activity,
  Video,
  Gift,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { useTranslation } from '@/core/i18n';
import { useTheme } from '@/core/theme';
import { useResponsive, LAYOUT_SIZES } from '@/core';
import { parseJwt } from '@/lib/utils';
import {
  ColonyRail,
  ColoniesView,
  useColonyModals,
} from '@/features/colonies';
import { UserBottomDock, DmUserProfileSidebar } from '@/features/profile';
import { FriendsView, AddFriendDialog, type FriendRequest, useFriendsManager, friendsApi } from '@/features/friends';
import { MessageRequestsView, type MessageRequestItem, useMessageRequests } from '@/features/message-requests';
import { NotificationsView, type NotificationItem, useNotifications } from '@/features/notifications';
import { CalendarView, type CalendarEvent, useCalendarEvents } from '@/features/calendar';
import { ColonyEventsModal } from '@/features/events';
import { AssignmentsView, type AssignmentItem, useAssignments } from '@/features/assignments';
import { CallsView, type CallLogItem, useCallLogs } from '@/features/calls';
import { AppsView } from '@/features/apps';
import { KanbanChannelView, type KanbanCard } from '@/features/kanban';
import {
  ChannelTopHeaderBar,
  ForumChannelView,
  ChannelsSidebar,
  useResizableSidebar,
  useChannelModals,
} from '@/features/channels';
import { ColonyMembersSidebar } from '@/features/members';
import type { ColonySettingsSection } from '@/features/colony-settings';
import {
  ChatInputBar,
  processFileInput,
} from '@/features/chat-input';
import { MessagesFeed, renderFormattedMessage, useCommunitySocket, ChatDialogsPortal } from '@/features/chat';
import { useMediaModals } from '@/features/media';
import { ChatDesktopSidebar } from './components/chat-desktop-sidebar';
import { ChatMobileDrawers } from './components/chat-mobile-drawers';
import { ChatMainView } from './components/chat-main-view';
import { useActivityLauncher } from './hooks/use-activity-launcher';
import { useMessageActions } from './hooks/use-message-actions';
import { useThreadManager } from './hooks/use-thread-manager';

const LockedFeatureGuard: any = ({ children }: any) => <>{children}</>;
const authenticationSession: any = {
  getToken: () => localStorage.getItem('token') || localStorage.getItem('ap_token'),
  getProjectId: () => localStorage.getItem('projectId') || 'default',
  getUser: () => {
    try {
      const raw =
        localStorage.getItem('user') ||
        localStorage.getItem('currentUser') ||
        localStorage.getItem('anticeil_current_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
};
const userMutations: any = {
  useUpdateUser: () => ({ mutateAsync: async () => {}, mutate: () => {} }),
  useUpdateName: (opts?: any) => ({
    mutateAsync: async (data: any) => opts?.onSuccess?.(data),
    mutate: (data: any) => opts?.onSuccess?.(data),
  }),
  useUpdateUsername: (opts?: any) => ({
    mutateAsync: async (data: any) => opts?.onSuccess?.(data),
    mutate: (data: any) => opts?.onSuccess?.(data),
  }),
};
const userHooks: any = {
  useCurrentUser: () => ({ data: null }),
  invalidateCurrentUser: async (_client?: any) => {},
};
const queryClient: any = {
  invalidateQueries: async () => {},
};

import { useSocket } from '@/providers/socket-provider';
import { CallStage, DISCORD_APPS } from '@/features/voice';
import {
  DISCORD_EMOJI_SERVERS,
  DISCORD_EMOJIS,
  DISCORD_STICKERS,
  DISCORD_GIF_CATEGORIES,
  DISCORD_GIF_ITEMS,
  EXTENDED_DISCORD_APPS,
  STANDARD_UNICODE_EMOJIS,
  DiscordEmoji,
  DiscordSticker,
  DiscordGifItem,
} from './anticeil-media-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';

import { chatApi, colonyApi } from './chat-api';
import {
  DEFAULT_CHANNELS,
  DEFAULT_COLONIES,
  loadStoredColonies,
  saveStoredColonies,
  getDmChannelId,
  loadStoredDmChannels,
  saveStoredDmChannels,
} from './chat-defaults';
import {
  CommunityAttachment,
  ColonyChannel,
  ColonyChannelType,
  Colony,
  ColonyId,
  ColonyMember,
  ColonyMessage,
  ColonyRole,
  CommunityAuditEntry,
  CommunityInvite,
  ColonyBan,
  CommunityCustomRole,
  ColonyStats,
  CommunityCustomEmoji,
  ColonyChannelNotification,
  ColonyChannelNotificationLevel,
  ColonyThread,
} from './chat-types';


// Rich message parser (supports **bold**, `code`, @mentions, and links)
export function CommunityPage() {
  const { t } = useTranslation();
  const { theme, setTheme, toggleTheme } = useTheme();
  const { isMobile, isTablet, isDesktop, deviceMode } = useResponsive();
  const navigate = useNavigate();

  const [isAuthRequiredOpen, setIsAuthRequiredOpen] = useState(false);
  const [authFeatureInfo, setAuthFeatureInfo] = useState<{ title?: string; desc?: string }>({});
  const [isAddFriendDialogOpen, setIsAddFriendDialogOpen] = useState(false);

  const requireAuth = (action: () => void, title?: string, desc?: string) => {
    if (!currentUser) {
      setAuthFeatureInfo({ title, desc });
      setIsAuthRequiredOpen(true);
      return;
    }
    action();
  };

  const handleLogout = () => {
    // Clear all user session, community, channels, and hubs caches from localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('anticeil_community_') ||
          key.startsWith('anticeil_current_') ||
          key.startsWith('anticeil_threads_') ||
          key.startsWith('anticeil_notif_') ||
          key === 'token' ||
          key === 'ap_token' ||
          key === 'projectId' ||
          key === 'current_project' ||
          key === 'current_platform')
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    sessionStorage.clear();
    setCurrentUser(null);
    setColonies(DEFAULT_COLONIES);
    setChannels([]);
    setMembers([]);
    setMessagesMap({});
    setActiveColonyId('anticeil');
    setActiveChannelId('');
    window.dispatchEvent(new Event('storage'));
    toast.success(t('Berhasil keluar dari akun.'));
    setTimeout(() => {
      window.location.href = window.location.origin + window.location.pathname;
    }, 200);
  };

  const handleGoogleSignIn = async () => {
    try {
      toast.loading(t('Menghubungkan ke Google OAuth...'), { id: 'google-oauth' });
      const res: any = await api.get('/v1/authn/federated/login?providerName=google');
      if (res && res.loginUrl) {
        toast.success(t('Membuka Google Sign-In...'), { id: 'google-oauth' });
        const state = {
          providerName: 'google',
          from: window.location.href,
          activepiecesLogin: 'true',
          login: 'true',
        };
        const loginUrl = new URL(res.loginUrl);
        loginUrl.searchParams.set('state', JSON.stringify(state));
        loginUrl.searchParams.set('prompt', 'select_account');

        window.location.href = loginUrl.toString();
        return;
      }
      throw new Error('No loginUrl returned');
    } catch (err: any) {
      console.error('Google OAuth initiation failed:', err);
      toast.error(t('Google OAuth belum aktif di server atau gagal terhubung.'), { id: 'google-oauth' });
    }
  };

  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const urlToken = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') : null;
      if (urlToken) {
        localStorage.setItem('token', urlToken);
        localStorage.setItem('ap_token', urlToken);
      }
      const token = urlToken || localStorage.getItem('token') || localStorage.getItem('ap_token');
      if (!token) return null;
      const stored = localStorage.getItem('anticeil_current_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.id || parsed.email)) {
          return parsed;
        }
      }
      const jwt = parseJwt(token);
      if (jwt && (jwt.id || jwt.email)) {
        return {
          ...jwt,
          name: `${jwt.firstName || ''} ${jwt.lastName || ''}`.trim() || jwt.username || jwt.email,
          avatar: jwt.imageUrl || null,
          imageUrl: jwt.imageUrl || null,
        };
      }
    } catch {}
    return null;
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl);
      localStorage.setItem('ap_token', tokenFromUrl);
      window.dispatchEvent(new Event('storage'));
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('token');
      window.history.replaceState({}, document.title, cleanUrl.toString());
      toast.success(t('Berhasil masuk!'));
    }

    const fetchLiveUser = async (customToken?: string) => {
      const token = customToken || localStorage.getItem('token') || localStorage.getItem('ap_token');
      if (!token) {
        setCurrentUser(null);
        return;
      }
      const payload = parseJwt(token);
      if (!payload || !payload.id) {
        return;
      }
      try {
        const user = await api.get(`/v1/users/${payload.id}`);
        if (user && (user.id || user.email)) {
          const rawImg = user.imageUrl || user.avatar || payload.imageUrl;
          const validImg = rawImg && !rawImg.includes('unsplash.com') && !rawImg.includes('53994a69daeb')
            ? rawImg
            : null;
          const formatted = {
            ...payload,
            ...user,
            name: `${user.firstName || payload.firstName || ''} ${user.lastName || payload.lastName || ''}`.trim() || user.username || user.email,
            avatar: validImg,
            imageUrl: validImg,
          };
          setCurrentUser(formatted);
          localStorage.setItem('anticeil_current_user', JSON.stringify(formatted));
        }
      } catch (err) {
        // Fallback to token payload
      }
    };

    const codeFromUrl = params.get('code');
    if (codeFromUrl) {
      const claimCode = async () => {
        try {
          toast.loading(t('Memverifikasi autentikasi...'), { id: 'oauth-claim' });
          const claimRes: any = await api.post('/v1/authn/federated/claim', {
            providerName: 'google',
            code: codeFromUrl,
          });
          if (claimRes && claimRes.token) {
            localStorage.setItem('token', claimRes.token);
            localStorage.setItem('ap_token', claimRes.token);
            if (claimRes.projectId) {
              localStorage.setItem('projectId', claimRes.projectId);
            }
            window.dispatchEvent(new Event('storage'));

            const jwt = parseJwt(claimRes.token) || {};
            const rawImg = claimRes.imageUrl || claimRes.avatar || jwt.imageUrl;
            const validImg = rawImg && !rawImg.includes('unsplash.com') && !rawImg.includes('53994a69daeb')
              ? rawImg
              : null;
            const formatted = {
              ...jwt,
              ...claimRes,
              name: `${claimRes.firstName || jwt.firstName || ''} ${claimRes.lastName || jwt.lastName || ''}`.trim() || claimRes.username || claimRes.email,
              avatar: validImg,
              imageUrl: validImg,
            };
            setCurrentUser(formatted);
            localStorage.setItem('anticeil_current_user', JSON.stringify(formatted));

            // Immediately fetch live user profile & avatar with new token
            await fetchLiveUser(claimRes.token);

            toast.success(t('Berhasil masuk!'), { id: 'oauth-claim' });

            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete('code');
            cleanUrl.searchParams.delete('state');
            window.history.replaceState({}, document.title, cleanUrl.toString());
          }
        } catch (err) {
          console.error('Failed to claim auth code:', err);
          toast.error(t('Gagal memverifikasi sesi login.'), { id: 'oauth-claim' });
        }
      };
      claimCode();
    } else {
      fetchLiveUser();
    }
  }, []);
  const platform: any = { name: 'Anticeil', plan: { plan: 'plus' } };
  const isPlusOrAbove = true;
  const isTeamOrEnterprise = true;
  const socket = useSocket();

  // Discord Voice & Video Call State (Anticeil Call & Activity)
  const [activeCallChannelId, setActiveCallChannelId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('activity') && p.get('channel') ? p.get('channel') : null;
    }
    return null;
  });
  const [isCallPiP, setIsCallPiP] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return Boolean(new URLSearchParams(window.location.search).get('activity'));
    }
    return false;
  });
  const [activeCallCounts, setActiveCallCounts] = useState<Record<string, number>>({});
  const [selectedActivityAppId, setSelectedActivityAppId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const act = new URLSearchParams(window.location.search).get('activity');
      if (act === 'youtube') return 'watch-together';
      return act || null;
    }
    return null;
  });
  const [appsSearchQuery, setAppsSearchQuery] = useState('');

  // Auto-sync active voice channel activity across peers
  useEffect(() => {
    if (!socket) return;
    const handleRemoteActivity = (data: any) => {
      if (!data) return;
      if (data.action === 'ACTIVITY_LAUNCH' || data.action === 'START_ACTIVITY') {
        const appId = data.payload?.appId;
        if (appId) {
          setSelectedActivityAppId(appId);
          setIsActivityOpen(true);
        }
      } else if (data.action === 'ACTIVITY_STOP') {
        setSelectedActivityAppId(null);
        setIsActivityOpen(false);
      }
    };

    socket.on('COMMUNITY_CALL_ACTIVITY_EVENT', handleRemoteActivity);
    return () => {
      socket.off('COMMUNITY_CALL_ACTIVITY_EVENT', handleRemoteActivity);
    };
  }, [socket]);

  // Discord Hubs & Channels state
  const [colonies, setColonies] = useState<Colony[]>(() => loadStoredColonies());
  const [activeColonyId, setActiveColonyId] = useState<ColonyId>(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('hub') || (params.get('invite')?.startsWith('hub_') ? params.get('invite') : null);
    return fromUrl || 'anticeil';
  });

  const [channels, setChannels] = useState<ColonyChannel[]>(() => {
    const storedDms = loadStoredDmChannels();
    return [...storedDms, ...DEFAULT_CHANNELS];
  });
  const [activeChannelId, setActiveChannelId] = useState<string>(() => {

    return new URLSearchParams(window.location.search).get('channel') || '';
  });
  const [replyingToMessage, setReplyingToMessage] = useState<ColonyMessage | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, ColonyMessage[]>>({});
  const [members, setMembers] = useState<ColonyMember[]>([]);

  // Discord-style unread message counter badges for mini rail (servers & friends)
  // Key 'anticeil' = NOTIFICATION-ONLY count (shown on logo badge)
  // Per server/friend keys = their individual chat unread counts (summed by switcher buttons)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number | string>>(() => ({
    anticeil: 3,       // notifications only (logo badge)
    hub_general: 47,
    hub_gaming: 167,
    hub_dev: 353,
    hub_anime: 651,
    hub_crypto: 87,
    hub_music: 743,
    hub_study: 512,
  }));

  // Home View Mode: Friends Hub vs Servers vs Message Requests vs Notifications vs Calendar vs Assignments vs Calls vs Apps
  const [homeView, setHomeView] = useState<'friends' | 'colonies' | 'servers' | 'message-requests' | 'notifications' | 'calendar' | 'assignments' | 'calls' | 'apps'>('friends');

  // Feature-First Hooks (Fullstack connected to PostgreSQL DB)
  const {
    events: calendarEvents,
    setEvents: setCalendarEvents,
    handleCreateEvent: createCalendarEvent,
  } = useCalendarEvents();
  const [isColonyEventsModalOpen, setIsColonyEventsModalOpen] = useState(false);

  const {
    assignments,
    setAssignments,
    handleToggleComplete,
  } = useAssignments();

  const {
    calls: callLogs,
    setCalls: setCallLogs,
    handleCreateCallLog,
  } = useCallLogs();

  const {
    requests: messageRequests,
    setRequests: setMessageRequests,
    handleAccept: handleAcceptMessageRequestRaw,
    handleIgnore: handleIgnoreMessageRequest,
    handleSpam: handleReportSpamMessageRequest,
  } = useMessageRequests();

  const {
    notifications,
    setNotifications,
    handleMarkAsRead: handleMarkNotificationRead,
    handleMarkAllAsRead: handleMarkAllNotificationsRead,
  } = useNotifications();

  // Logo Anticeil badge: ONLY count unread notifications
  const unreadNotifCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  useEffect(() => {
    setUnreadCounts((prev) => {
      if (prev.anticeil === unreadNotifCount) return prev;
      return { ...prev, anticeil: unreadNotifCount };
    });
  }, [unreadNotifCount]);

  const activeColony = useMemo(() => {
    return colonies.find((h) => h.id === activeColonyId) || colonies[0];
  }, [colonies, activeColonyId]);

  // Listen to switch_hub and open_create_hub events from the Unified Mini Rail
  useEffect(() => {
    const handleSwitchColony = (e: any) => {
      const colonyId = e.detail;
      if (colonyId) {
        setActiveColonyId(colonyId);
        if (colonyId === 'anticeil') {
          setActiveChannelId('');
        } else {
          const firstCh = channels.find(
            (c) => (c.colonyId || 'anticeil') === colonyId && c.category === 'CHANNELS',
          );
          if (firstCh) setActiveChannelId(firstCh.id);
        }
      }
    };
    const handleOpenCreateHub = () => {
      setIsCreateHubOpen(true);
    };
    const handleOpenAddFriend = () => {
      setIsAddFriendDialogOpen(true);
    };
    window.addEventListener('anticeil_switch_hub', handleSwitchColony as EventListener);
    window.addEventListener('anticeil_open_create_hub', handleOpenCreateHub);
    window.addEventListener('anticeil_open_add_friend', handleOpenAddFriend);
    return () => {
      window.removeEventListener('anticeil_switch_hub', handleSwitchColony as EventListener);
      window.removeEventListener('anticeil_open_create_hub', handleOpenCreateHub);
      window.removeEventListener('anticeil_open_add_friend', handleOpenAddFriend);
    };
  }, [channels]);

  // Broadcast activeColonyId to Unified Mini Rail
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('anticeil_active_hub_changed', { detail: activeColonyId }));
  }, [activeColonyId]);

  // Synchronize browser URL address bar with active hub and active channel
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      let changed = false;
      if (activeColonyId && activeColonyId !== 'anticeil') {
        if (url.searchParams.get('hub') !== activeColonyId) {
          url.searchParams.set('hub', activeColonyId);
          changed = true;
        }
      } else if (url.searchParams.has('hub')) {
        url.searchParams.delete('hub');
        changed = true;
      }

      if (activeChannelId) {
        if (url.searchParams.get('channel') !== activeChannelId) {
          url.searchParams.set('channel', activeChannelId);
          changed = true;
        }
      } else if (url.searchParams.has('channel') && channels.length > 0) {
        url.searchParams.delete('channel');
        changed = true;
      }

      if (selectedActivityAppId) {
        if (url.searchParams.get('activity') !== selectedActivityAppId) {
          url.searchParams.set('activity', selectedActivityAppId);
          changed = true;
        }
      } else if (url.searchParams.has('activity') && channels.length > 0 && !isActivityOpen) {
        url.searchParams.delete('activity');
        changed = true;
      }

      if (changed) {
        window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
      }
    } catch {}
  }, [activeColonyId, activeChannelId, selectedActivityAppId, channels.length, isActivityOpen]);

  const [inputText, setInputText] = useState('');
  const [stagedAttachment, setStagedAttachment] = useState<CommunityAttachment | null>(null);
  const [showMemberList, setShowMemberList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTemplatePopoverOpen, setIsTemplatePopoverOpen] = useState(false);

  // Server Modals & Actions (Feature-First Hook)
  const colonyModals = useColonyModals({
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
    t,
  });
  const {
    isCreateHubOpen,
    setIsCreateHubOpen,
    newHubName,
    setNewHubName,
    newHubDesc,
    setNewHubDesc,
    newHubIconUrl,
    setNewHubIconUrl,
    joinInviteCode,
    setJoinInviteCode,
    isJoiningHub,
    handleCreateHubSubmit,
    handleJoinHub,
    hubToEdit,
    setHubToEdit,
    editHubName,
    setEditHubName,
    editHubDesc,
    setEditHubDesc,
    handleOpenEditHub,
    handleEditHubSubmit,
    hubToDelete,
    setHubToDelete,
    handleDeleteHubConfirm,
    isInviteOpen,
    setIsInviteOpen,
    inviteUsername,
    setInviteUsername,
    isInvitingUsername,
    userNotFound,
    handleInviteByUsername,
    isServerSettingsOpen,
    setIsServerSettingsOpen,
    serverSettingsSection,
    setColonySettingsSection,
  } = colonyModals;

  // Channel Modals & Actions (Feature-First Hook)
  const channelModals = useChannelModals({
    activeColonyId,
    channels,
    setChannels,
    activeChannelId,
    setActiveChannelId,
    t,
  });
  const {
    isCreateChannelOpen,
    setIsCreateChannelOpen,
    newChannelName,
    setNewChannelName,
    newChannelDesc,
    setNewChannelDesc,
    newChannelCategory,
    setNewChannelCategory,
    newChannelType,
    setNewChannelType,
    newChannelIsPrivate,
    setNewChannelIsPrivate,
    handleCreateChannelSubmit,
    channelToEdit,
    setChannelToEdit,
    editChannelName,
    setEditChannelName,
    editChannelDesc,
    setEditChannelDesc,
    editChannelType,
    setEditChannelType,
    handleOpenEditChannel,
    handleEditChannelSubmit,
    channelToDelete,
    setChannelToDelete,
    handleOpenDeleteChannel,
    handleDeleteChannelConfirm,
    channelForSettings,
    setChannelForSettings,
    handleUpdateChannelSettings,
    isWebhookDialogOpen,
    setIsWebhookDialogOpen,
  } = channelModals;

  // Media Modals & Quick Add (Feature-First Hook)
  const mediaModals = useMediaModals({
    activeColony,
  });
  const {
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
    isLoadingServerMedia,
    isQuickAddEmojiOpen,
    setIsQuickAddEmojiOpen,
    quickEmojiName,
    setQuickEmojiName,
    quickEmojiUrl,
    setQuickEmojiUrl,
    quickEmojiCode,
    setQuickEmojiCode,
    handleQuickAddEmoji,
    isQuickAddStickerOpen,
    setIsQuickAddStickerOpen,
    quickStickerName,
    setQuickStickerName,
    quickStickerUrl,
    setQuickStickerUrl,
    handleQuickAddSticker,
    isSubmittingServerMedia,
  } = mediaModals;

  // Discord Send a Gift Modal - matching Screenshot 4
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [claimedGifts, setClaimedGifts] = useState<Record<string, boolean>>({});

  // ── Discord Pinned Messages (Screenshot 1) ───────────────────────────
  const [isPinnedPopoverOpen, setIsPinnedPopoverOpen] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<ColonyMessage[]>([]);
  const [isLoadingPins, setIsLoadingPins] = useState(false);

  // ── Discord Notification Settings (Screenshot 2) ─────────────────────
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [channelNotification, setChannelNotification] = useState<ColonyChannelNotification>({
    channelId: '',
    userId: 'me',
    level: 'default',
    isMuted: false,
    mutedUntil: null,
  });

  // Channels filtered by selected Hub
  const colonyChannels = useMemo(() => {
    return channels.filter(
      (c) => (c.colonyId || 'anticeil') === (activeColonyId || 'anticeil') && c.category === 'CHANNELS',
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
        const otherUserId = parts.find((p) => p !== currentUser?.id) || parts[0];
        const otherMember = members.find((m) => m.id === otherUserId);
        const dmName = otherMember?.name || otherMember?.username || 'Direct Message';
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

  // ── Discord Threads & Forum (Feature-First Hook) ─────────────────────
  const {
    isThreadsPopoverOpen,
    setIsThreadsPopoverOpen,
    channelThreads,
    setChannelThreads,
    threadSearchQuery,
    setThreadSearchQuery,
    isCreateThreadModalOpen,
    setIsCreateThreadModalOpen,
    newThreadName,
    setNewThreadName,
    newThreadInitialMsg,
    setNewThreadInitialMsg,
    isSubmittingThread,
    setIsSubmittingThread,
    activeThread,
    setActiveThread,
    threadMessages,
    setThreadMessages,
    threadInputText,
    setThreadInputText,
    isThreadDrawerOpen,
    setIsThreadDrawerOpen,
    forumSearchQuery,
    setForumSearchQuery,
    forumSort,
    setForumSort,
    isForumComposerOpen,
    setIsForumComposerOpen,
    forumNewTitle,
    setForumNewTitle,
    forumNewMessage,
    setForumNewMessage,
    isSubmittingForumPost,
    setIsSubmittingForumPost,
    threadsMap,
    setThreadsMap,
    handleCreateThread,
    handleSendThreadMessage,
    handleCreateForumPost,
  } = useThreadManager({
    activeChannel,
    activeChannelId,
    currentUser,
    t,
  });
  const [collapsedCategories, setCollapsedCategories] = useState<{ text: boolean; voice: boolean; forum: boolean }>({
    text: false,
    voice: false,
    forum: false,
  });

  // Audio / mic dummy state for Discord user footer
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  // Discord-style Resizable Sidebar hook
  const {
    sidebarWidth,
    isResizingSidebar,
    handleSidebarResizeStart,
    handleSidebarResizeReset,
  } = useResizableSidebar();

  // Responsive state for Mobile/Tablet sheets
  const [isMobileChannelsOpen, setIsMobileChannelsOpen] = useState(false);
  const [isMobileMembersOpen, setIsMobileMembersOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Edit Profile dialog state
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [userSettingsInitialSection, setUserSettingsInitialSection] = useState<'account' | 'voice' | 'camera' | 'appearance'>('account');
  const handleOpenUserSettings = (section: 'account' | 'voice' | 'camera' | 'appearance' = 'account') => {
    setUserSettingsInitialSection(section);
    setIsUserSettingsOpen(true);
  };

  // DM Search Dialog (Discord-style "Find or start a conversation")
  const [isDmSearchOpen, setIsDmSearchOpen] = useState(false);
  const [dmSearchQuery, setDmSearchQuery] = useState('');


  // Listen to burger menu clicks from top app bar on mobile/tablet
  useEffect(() => {
    const handleToggleMobileChannels = () => {
      setIsMobileChannelsOpen((prev) => !prev);
    };
    window.addEventListener('anticeil_toggle_mobile_channels', handleToggleMobileChannels);
    return () => {
      window.removeEventListener('anticeil_toggle_mobile_channels', handleToggleMobileChannels);
    };
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Initial Load from Backend API
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      const token = authenticationSession.getToken();
      if (!token) {
        if (mounted) {
          setChannels([]);
          setMembers([]);
          setColonies(DEFAULT_COLONIES);
          setActiveColonyId('anticeil');
          setActiveChannelId('');
        }
        return;
      }
      try {
        const currentProjectId = authenticationSession.getProjectId();
        const [channelsRes, membersRes, hubsRes, friendsRes] = await Promise.all([
          colonyApi.getChannels(),
          colonyApi.getMembers(currentProjectId || undefined),
          colonyApi.getColonies(),
          friendsApi.getFriends().catch(() => []),
        ]);
        if (mounted) {
          if (Array.isArray(channelsRes)) {
            const storedDms = loadStoredDmChannels();
            const friendDms: ColonyChannel[] = [];
            const effectiveUser = authenticationSession.getUser() || currentUser;
            const myId = effectiveUser?.id;

            if (Array.isArray(friendsRes) && myId) {
              friendsRes.forEach((f) => {
                if (!f.id || f.id === myId) return;
                const dmName = f.name || f.username || 'Direct Message';
                if (dmName.toLowerCase() === 'pengguna' || dmName.toLowerCase() === 'pengguna anticeil') return;
                const dmId = getDmChannelId(myId, f.id);
                friendDms.push({
                  id: dmId,
                  name: dmName,
                  description: `Percakapan langsung dengan ${dmName}`,
                  category: 'DIRECT MESSAGES',
                  colonyId: 'anticeil',
                  isDirectMessage: true,
                  dmUserId: f.id,
                  type: 'text',
                });
              });
            }

            const dmMap = new Map<string, ColonyChannel>();
            storedDms
              .filter((dm) => typeof dm.id === 'string' && dm.id.startsWith('dm-') && dm.type !== 'voice')
              .forEach((dm) => dmMap.set(dm.id, dm));
            friendDms.forEach((dm) => {
              if (!dmMap.has(dm.id)) dmMap.set(dm.id, dm);
            });
            const allDms = Array.from(dmMap.values());
            saveStoredDmChannels(allDms);

            const serverChannels = channelsRes.filter((c) => c.category !== 'DIRECT MESSAGES' && !c.id.startsWith('dm-'));
            const mergedAllChannels = [...allDms, ...serverChannels];
            setChannels(mergedAllChannels);

            const targetChannelParam = new URLSearchParams(window.location.search).get('channel');
            const targetActivityParam = new URLSearchParams(window.location.search).get('activity');
            if (targetActivityParam) {
              const normalizedAct = targetActivityParam === 'youtube' ? 'watch-together' : targetActivityParam;
              setSelectedActivityAppId(normalizedAct);
              setIsActivityOpen(true);
            }
            if (targetChannelParam) {
              let matchedChannel = mergedAllChannels.find((c) => c.id === targetChannelParam);
              if (!matchedChannel && targetActivityParam) {
                matchedChannel = mergedAllChannels.find((c) => (c.colonyId || 'anticeil') === activeColonyId && c.type === 'voice');
              }
              if (matchedChannel) {
                setActiveChannelId(matchedChannel.id);
                if (matchedChannel.type === 'voice') {
                  setActiveCallChannelId(matchedChannel.id);
                  setIsCallPiP(false);
                }
              }
            } else if (targetActivityParam) {
              const activeVoice = channelsRes.find(
                (c) => (c.colonyId || 'anticeil') === activeColonyId && c.type === 'voice',
              );
              if (activeVoice) {
                setActiveChannelId(activeVoice.id);
                setActiveCallChannelId(activeVoice.id);
                setIsCallPiP(false);
              }
            } else if (channelsRes.length > 0 && activeColonyId !== 'anticeil') {
              const activeVoice = channelsRes.find(
                (c) => (c.colonyId || 'anticeil') === activeColonyId && c.type === 'voice' && (activeCallCounts[c.id] || 0) > 0,
              );
              if (activeVoice) {
                setActiveChannelId(activeVoice.id);
                setActiveCallChannelId(activeVoice.id);
                setIsCallPiP(false);
              } else {
                setActiveChannelId((curr) => curr || channelsRes[0].id);
              }
            }
          }
          if (Array.isArray(membersRes)) {
            setMembers(membersRes);
          }
          if (Array.isArray(hubsRes) && hubsRes.length > 0) {
            setColonies((prev) => {
              const home = prev.find((h) => h.id === 'anticeil') || DEFAULT_COLONIES[0];
              const merged = [home, ...hubsRes.filter((s) => s.id !== 'anticeil')];
              saveStoredColonies(merged);
              return merged;
            });
          }
        }
      } catch (err) {
        console.warn('Initial community load fallback', err);
      }
    };
    loadData();

    // Check if user came from an invite link: /messages?invite=xyz
    const params = new URLSearchParams(window.location.search);
    const inviteParam = params.get('invite');
    const activityParam = params.get('activity');
    if (activityParam) {
      setSelectedActivityAppId(activityParam);
      setIsActivityOpen(true);
    }
    if (inviteParam) {
      handleJoinHub(inviteParam);
    }

    return () => {
      mounted = false;
    };
  }, []);

  // 2. Load Messages, Pins, Notifications & Threads when Active Channel Changes
  useEffect(() => {
    if (!activeChannelId) return;
    let mounted = true;
    const loadChannelData = async () => {
      try {
        const [msgs, pins, notif, ths] = await Promise.all([
          colonyApi.getMessages(activeChannelId),
          colonyApi.getPinnedMessages(activeChannelId),
          colonyApi.getChannelNotification(activeChannelId),
          colonyApi.getThreads(activeChannelId),
        ]);
        if (mounted) {
          if (msgs) {
            setMessagesMap((prev) => ({
              ...prev,
              [activeChannelId]: msgs,
            }));
          }
          if (pins) {
            setPinnedMessages(pins);
          }
          if (notif) {
            setChannelNotification(notif);
          }
          if (ths) {
            setChannelThreads(ths);
            setThreadsMap((prev) => ({ ...prev, [activeChannelId]: ths }));
          }
        }
      } catch (err) {
        console.warn('Failed to load channel data', activeChannelId, err);
      }
    };
    loadChannelData();
    return () => {
      mounted = false;
    };
  }, [activeChannelId]);


  // 3. WebSocket Realtime Listeners (Feature-First Hook)
  useCommunitySocket({
    socket,
    activeChannelId,
    setMessagesMap,
    setChannels,
    setActiveChannelId,
    setActiveCallCounts,
  });

  // Canonicalize DM channel ID when opened with legacy single-user id (e.g. ?channel=dm-userId)
  useEffect(() => {
    if (!currentUser?.id || !activeChannelId?.startsWith('dm-')) return;
    const parts = activeChannelId.slice(3).split('-').filter(Boolean);
    if (parts.length === 1 && parts[0] && parts[0] !== currentUser.id) {
      const otherUserId = parts[0];
      const canonicalId = getDmChannelId(currentUser.id, otherUserId);
      const otherMember = members.find((m) => m.id === otherUserId);
      const dmName = otherMember?.name || otherMember?.username || 'Direct Message';

      setChannels((prev) => {
        const exists = prev.some((c) => c.id === canonicalId);
        if (exists) return prev;
        const newDm: ColonyChannel = {
          id: canonicalId,
          name: dmName,
          description: `Percakapan langsung dengan ${dmName}`,
          category: 'DIRECT MESSAGES',
          colonyId: 'anticeil',
          isDirectMessage: true,
          dmUserId: otherUserId,
          type: 'text',
        };
        const updated = [newDm, ...prev];
        saveStoredDmChannels(updated.filter((c) => c.category === 'DIRECT MESSAGES'));
        return updated;
      });

      setActiveChannelId(canonicalId);
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('channel', canonicalId);
        window.history.replaceState(null, '', url.pathname + url.search);
      } catch {}
    }
  }, [currentUser?.id, activeChannelId, members]);

  // Load threads for all forum channels in the active hub so sidebar shows child threads
  useEffect(() => {
    if (!colonyChannels.length) return;
    const forumChannels = colonyChannels.filter((c) => c.type === 'forum');
    if (!forumChannels.length) return;

    forumChannels.forEach(async (fc) => {
      try {
        const ths = await colonyApi.getThreads(fc.id);
        if (ths) {
          setThreadsMap((prev) => ({ ...prev, [fc.id]: ths }));
        }
      } catch {}
    });
  }, [colonyChannels]);

  // Auto-fetch and sync channels when switching to a colony
  useEffect(() => {
    if (!activeColonyId || activeColonyId === 'anticeil') return;
    let mounted = true;
    const loadColonyChannels = async () => {
      try {
        const res = await colonyApi.getChannels(activeColonyId);
        if (mounted && Array.isArray(res)) {
          setChannels((prev) => {
            const others = prev.filter((c) => (c.colonyId || 'anticeil') !== activeColonyId);
            return [...others, ...res];
          });
          const targetChannelParam = new URLSearchParams(window.location.search).get('channel');
          const targetActivityParam = new URLSearchParams(window.location.search).get('activity');
          if (targetActivityParam) {
            const normalizedAct = targetActivityParam === 'youtube' ? 'watch-together' : targetActivityParam;
            setSelectedActivityAppId(normalizedAct);
            setIsActivityOpen(true);
          }
          let matchedTarget = res.find((c) => c.id === targetChannelParam);
          if (!matchedTarget && targetActivityParam) {
            matchedTarget = res.find((c) => c.type === 'voice');
          }
          if (matchedTarget) {
            setActiveChannelId(matchedTarget.id);
            if (matchedTarget.type === 'voice') {
              setActiveCallChannelId(matchedTarget.id);
              setIsCallPiP(false);
            }
          } else {
            setActiveChannelId((curr) => {
              const exists = res.some((c) => c.id === curr);
              if (exists) return curr;
              if (targetActivityParam) {
                const voiceCh = res.find((c) => c.type === 'voice');
                if (voiceCh) {
                  setActiveCallChannelId(voiceCh.id);
                  setIsCallPiP(false);
                  return voiceCh.id;
                }
              }
              const activeVoice = res.find((c) => c.type === 'voice' && (activeCallCounts[c.id] || 0) > 0);
              if (activeVoice) {
                setActiveCallChannelId(activeVoice.id);
                setIsCallPiP(false);
                return activeVoice.id;
              }
              return res[0]?.id || '';
            });
          }
        }
      } catch (err) {
        console.warn('Failed to load channels for colony', activeColonyId, err);
      }
    };
    loadColonyChannels();
    return () => {
      mounted = false;
    };
  }, [activeColonyId]);

  // Automatically connect to voice call when switching to or opening a voice channel
  useEffect(() => {
    if (activeChannel?.type === 'voice') {
      if (activeCallChannelId !== activeChannel.id) {
        setActiveCallChannelId(activeChannel.id);
        setIsCallPiP(false);
      }
    }
  }, [activeChannel?.id, activeChannel?.type]);

  const isFriendsView = isHome && !activeChannel && homeView === 'friends';
  const isMessageRequestsView = isHome && !activeChannel && homeView === 'message-requests';
  const isNotificationsView = isHome && !activeChannel && homeView === 'notifications';
  const isCalendarView = isHome && !activeChannel && homeView === 'calendar';
  const isAssignmentsView = isHome && !activeChannel && homeView === 'assignments';
  const isCallsView = isHome && !activeChannel && homeView === 'calls';
  const isAppsView = isHome && !activeChannel && homeView === 'apps';
  const isColoniesView = isHome && !activeChannel && (homeView === 'colonies' || homeView === 'servers');

  // Active messages & filter
  const currentMessages = activeChannel ? messagesMap[activeChannel.id] || [] : [];
  const filteredMessages = searchQuery.trim()
    ? currentMessages.filter(
        (m) =>
          m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.senderName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : currentMessages;

  // Auto scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Mark channel read when opened
  useEffect(() => {
    if (activeChannelId && currentUser?.id) {
      colonyApi.markChannelRead(activeChannelId, currentUser.id);
    }
  }, [activeChannelId, currentUser?.id]);

  // Auto scroll - initial scroll to unread divider
  useEffect(() => {
    if (!activeChannelId) return;
    setReplyingToMessage(null);
    const unreadCount = activeChannel?.unreadCount || 0;
    if (unreadCount > 0) {
      requestAnimationFrame(() => {
        const divider = document.getElementById('discord-unread-divider');
        if (divider) {
          divider.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          scrollToBottom();
        }
      });
    } else {
      scrollToBottom();
    }
  }, [activeChannelId]);

  useEffect(() => {
    // Only auto scroll to bottom when new messages arrive
    scrollToBottom();
  }, [currentMessages.length]);



  const {
    handleSendMessage,
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
  } = useMessageActions({
    currentUser,
    activeChannel,
    activeColony,
    members,
    replyingToMessage,
    setReplyingToMessage,
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
    createCalendarEvent,
    t,
  });

  // Launch Activity in Voice Stage or Text Channel (Direct Message & Server)
  const { handleLaunchActivity } = useActivityLauncher({
    channels,
    setChannels,
    dmChannels,
    activeChannel,
    activeCallChannelId,
    activeColonyId,
    activeColony,
    currentUser,
    members,
    socket,
    t,
    setSelectedActivityAppId,
    setIsTemplatePopoverOpen,
    setActiveColonyId,
    setActiveChannelId,
    setActiveCallChannelId,
    setIsCallPiP,
    setIsActivityOpen,
    setMessagesMap,
  });

  // ── Update Channel Notification Settings Handler ─────────────────────
  const handleUpdateNotification = async (
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
  };


  const updateNameMutation = userMutations.useUpdateName({
    onSuccess: (data: any) => {
      userHooks.invalidateCurrentUser(queryClient);
      const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email;
      toast.success(t(`Nama tampilan berhasil diperbarui menjadi ${fullName}! 🎉`));
      setMembers((prev) =>
        prev.map((m) =>
          m.id === currentUser?.id || m.email === currentUser?.email
            ? { ...m, name: fullName }
            : m,
        ),
      );
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || t('Gagal mengubah nama tampilan.');
      toast.error(msg);
    },
  });

  const updateUsernameMutation = userMutations.useUpdateUsername({
    onSuccess: (data: any) => {
      userHooks.invalidateCurrentUser(queryClient);
      toast.success(t(`Username berhasil diperbarui menjadi @${data.username}! 🎉`));
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || t('Gagal mengubah username.');
      toast.error(msg);
    },
  });


  // Start DM
  const handleStartDM = (member: any) => {
    if (!member) return;
    const dmId = currentUser?.id ? getDmChannelId(currentUser.id, member.id) : `dm-${member.id}`;
    const dmName = member.name || member.username || member.firstName || 'Direct Message';
    setChannels((prev) => {
      const existing = prev.find((c) => c.id === dmId);
      const updated = existing
        ? prev.map((c) => (c.id === dmId ? { ...c, dmUserId: member.id, name: dmName } : c))
        : [
            {
              id: dmId,
              name: dmName,
              description: `Percakapan langsung dengan ${dmName} (${member.customStatus || member.role || 'Member'})`,
              category: 'DIRECT MESSAGES' as const,
              colonyId: 'anticeil',
              isDirectMessage: true,
              dmUserId: member.id,
              type: 'text' as const,
            },
            ...prev,
          ];
      saveStoredDmChannels(updated.filter((c) => c.category === 'DIRECT MESSAGES'));
      return updated;
    });
    // DMs live in Home hub, auto-switch
    setActiveColonyId('anticeil');
    setActiveChannelId(dmId);
    setHomeView('friends');
    setIsMobileChannelsOpen(false);
    setIsMobileMembersOpen(false);
  };

  // Kanban update handler
  const handleKanbanCardsUpdate = useCallback((cards: KanbanCard[]) => {
    if (!activeChannel?.id) return;
    setAssignments((prev) => {
      const otherCards = prev.filter((c) => c.channelId !== activeChannel.id);
      return [...cards, ...otherCards];
    });
  }, [activeChannel?.id, setAssignments]);

  // Message Requests Handlers
  const handleAcceptMessageRequest = (item: MessageRequestItem) => {
    handleAcceptMessageRequestRaw(item);
    handleStartDM({
      id: item.userId,
      name: item.name,
      username: item.username,
      avatar: item.avatar,
    } as any);
  };

  const handleJumpToNotification = (item: NotificationItem) => {
    handleMarkNotificationRead(item.id);
    if (item.colonyId && item.colonyId !== activeColonyId) {
      setActiveColonyId(item.colonyId);
    }
    setActiveChannelId(item.channelId);
  };

  // File Select with Strict Limit: Max 5MB, Images & Documents only (Videos banned to save storage)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFileInput(e, setStagedAttachment);
  };

  const currentUserName =
    `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() ||
    currentUser?.email?.split('@')[0] ||
    'Pengguna Anticeil';

  const displayMembers: ColonyMember[] = useMemo(() => {
    const isOwner = activeColony?.role === 'owner';
    const isAdmin = activeColony?.role === 'admin';
    const list = members.map((m) => {
      if (m.id === currentUser?.id || m.email === currentUser?.email) {
        return {
          ...m,
          username: m.username || currentUser?.username || null,
          role: isOwner ? ('owner' as ColonyRole) : isAdmin ? ('admin' as ColonyRole) : (m.role || 'member'),
          roleLabel: isOwner ? 'Pemilik' : isAdmin ? 'Admin' : undefined,
        };
      }
      return m;
    });

    if (currentUser && !list.some((m) => m.id === currentUser.id || m.email === currentUser.email)) {
      const currentRole: ColonyRole = isOwner ? 'owner' : isAdmin ? 'admin' : 'member';
      const currentLabel = isOwner ? 'Pemilik' : isAdmin ? 'Admin' : undefined;
      list.unshift({
        id: currentUser.id,
        name: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email,
        email: currentUser.email,
        username: currentUser.username || null,
        avatar: currentUser.imageUrl ?? null,
        role: currentRole,
        roleLabel: currentLabel,
        platformRole: currentUser.platformRole,
        status: 'online',
        customStatus: undefined,
      });
    }
    return list;
  }, [members, currentUser, activeColony]);

  // Friends Manager (Feature-First Hook)
  const friends = useFriendsManager({
    displayMembers,
    currentUser,
    members,
    dmChannels,
    t,
  });

  // Auto-sync DM channels for friends so they appear in Direct Messages sidebar by default
  useEffect(() => {
    if (!currentUser?.id) return;
    const friendsList = friends.allFriends || [];
    if (friendsList.length === 0) return;

    setChannels((prev) => {
      let changed = false;
      // Purge any stale 'pengguna' or 'general voice' channels
      const currentList = prev.filter((c) => {
        if (c.category !== 'DIRECT MESSAGES') return true;
        const name = (c.name || '').toLowerCase().trim();
        return name !== 'pengguna' && name !== 'pengguna anticeil' && name !== 'general voice';
      });
      if (currentList.length !== prev.length) {
        changed = true;
      }
      friendsList.forEach((friend) => {
        if (!friend.id || friend.id === currentUser.id) return;
        const dmName = friend.name || friend.username || 'Direct Message';
        if (dmName.toLowerCase() === 'pengguna' || dmName.toLowerCase() === 'pengguna anticeil') return;
        const dmId = getDmChannelId(currentUser.id, friend.id);
        const exists = currentList.some((c) => c.id === dmId);
        if (!exists) {
          const newDm: ColonyChannel = {
            id: dmId,
            name: dmName,
            description: `Percakapan langsung dengan ${dmName}`,
            category: 'DIRECT MESSAGES',
            colonyId: 'anticeil',
            isDirectMessage: true,
            dmUserId: friend.id,
            type: 'text',
          };
          currentList.unshift(newDm);
          changed = true;
        }
      });
      if (changed) {
        saveStoredDmChannels(currentList.filter((c) => c.category === 'DIRECT MESSAGES'));
        return currentList;
      }
      return prev;
    });
  }, [currentUser?.id, friends.allFriends]);

  // Rail Mode: Switcher between Servers and Friends
  const [railMode, setRailMode] = useState<'servers' | 'friends'>(() => {
    try {
      return (localStorage.getItem('anticeil_rail_mode') as any) || 'servers';
    } catch {
      return 'servers';
    }
  });

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
      toast.info(next === 'friends' ? t('Beralih ke Mode Teman') : t('Beralih ke Mode Server'));
      return next;
    });
  };

  // Component: Server Rail (delegates to reusable ColonyRail feature component)
  const renderDiscordHubRail = () => (
    <ColonyRail
      servers={colonies}
      activeServerId={activeColonyId}
      unreadCounts={unreadCounts}
      onSelectServer={(id) => {
        if (id !== 'anticeil') {
          setUnreadCounts((prev) => ({ ...prev, [id]: 0 }));
        }
        if (id !== 'anticeil' && !currentUser) {
          setAuthFeatureInfo({
            title: t('Akses Server'),
            desc: t('Masuk ke Anticeil untuk mengakses saluran dan mengobrol di server ini.'),
          });
          setIsAuthRequiredOpen(true);
          return;
        }
        setActiveColonyId(id);
        if (id === 'anticeil') {
          setActiveChannelId('');
        } else {
          const firstCh = channels.find(
            (c) => (c.colonyId || 'anticeil') === id && c.category === 'CHANNELS',
          );
          setActiveChannelId(firstCh?.id || '');
        }
      }}
      onOpenCreateServer={() =>
        requireAuth(
          () => setIsCreateHubOpen(true),
          t('Buat Server Komunitas'),
          t('Masuk ke Anticeil untuk membuat server komunitas Anda sendiri.'),
        )
      }
      platformName={platform?.name}
      railMode={railMode}
      onToggleRailMode={handleToggleRailMode}
      friends={friends.allFriends}
      activeChannelId={activeChannelId}
      onSelectFriend={(f) => {
        setUnreadCounts((prev) => ({ ...prev, [f.id]: 0, [`dm-${f.id}`]: 0 }));
        handleStartDM(f);
      }}
      onOpenAddFriend={() =>
        requireAuth(
          () => setIsAddFriendDialogOpen(true),
          t('Tambah Teman Baru'),
          t('Masuk ke Anticeil untuk menambahkan teman baru.'),
        )
      }
    />
  );

  // Comprehensive directory of all known members (friends + server members + current user)
  // Ensures DM avatars in sidebar and chat headers never lose their photo
  const allKnownMembers = useMemo(() => {
    const map = new Map<string, ColonyMember>();
    members.forEach((m) => map.set(m.id, m));
    displayMembers.forEach((m) => map.set(m.id, m));
    (friends.allFriends || []).forEach((f) => {
      const existing = map.get(f.id);
      map.set(f.id, {
        id: f.id,
        name: f.name || existing?.name || 'Member',
        email: f.email || existing?.email || '',
        avatar: f.avatar || existing?.avatar || null,
        username: f.username || existing?.username || null,
        role: existing?.role || 'member',
        status: (f.status as any) || existing?.status || 'online',
      });
    });
    return Array.from(map.values());
  }, [members, displayMembers, friends.allFriends]);

  // Component: Channels Sidebar Content (delegates to ChannelsSidebar feature component)
  const renderChannelsSidebarContent = (onItemClick?: () => void) => (
    <ChannelsSidebar
      currentUser={currentUser}
      isHome={isHome}
      activeColony={activeColony}
      channels={channels}
      activeChannelId={activeChannelId}
      setActiveChannelId={setActiveChannelId}
      activeCallChannelId={activeCallChannelId}
      setActiveCallChannelId={setActiveCallChannelId}
      isFriendsView={isFriendsView}
      homeView={homeView}
      setHomeView={setHomeView}
      messageRequestsCount={messageRequests.filter((r) => !r.isSpam).length}
      unreadNotificationsCount={unreadCounts?.['anticeil'] ?? unreadNotifCount}
      setFriendsTab={friends.setFriendsTab}
      friendRequests={friends.friendRequests}
      dmChannels={dmChannels}
      members={allKnownMembers}
      collapsedCategories={collapsedCategories}
      setCollapsedCategories={setCollapsedCategories}
      threadsMap={threadsMap}
      channelThreads={channelThreads}
      activeThread={activeThread}
      setActiveThread={setActiveThread}
      activeCallCounts={activeCallCounts}
      calendarEvents={calendarEvents}
      onOpenServerEvents={() => setIsColonyEventsModalOpen(true)}
      onItemClick={onItemClick}
      onOpenDmSearch={() =>
        requireAuth(
          () => {
            setIsDmSearchOpen(true);
            setDmSearchQuery('');
          },
          t('Cari Percakapan'),
          t('Masuk ke Anticeil untuk memulai obrolan langsung.'),
        )
      }
      onOpenInvite={() =>
        requireAuth(
          () => setIsInviteOpen(true),
          t('Undang Teman'),
          t('Masuk untuk membagikan tautan undangan server.'),
        )
      }
      onOpenServerSettings={(section) => {
        requireAuth(() => {
          if (section) setColonySettingsSection(section);
          setIsServerSettingsOpen(true);
        });
      }}
      onOpenCreateChannel={(category, type = 'text') => {
        requireAuth(
          () => {
            setNewChannelCategory(category as any);
            setNewChannelType(type);
            setIsCreateChannelOpen(true);
          },
          t('Buat Saluran'),
          t('Masuk ke Anticeil untuk membuat saluran obrolan atau panggilan suara.'),
        );
      }}
      onOpenCreateHub={() =>
        requireAuth(
          () => setIsCreateHubOpen(true),
          t('Buat Server'),
          t('Masuk ke Anticeil untuk membuat server komunitas.'),
        )
      }
      onOpenEditChannel={(ch) => handleOpenEditChannel(ch)}
      onUpdateHubIcon={async (file) => {
        if (!activeColony) return;
        if (file.size > 5 * 1024 * 1024) {
          toast.error(t('Ukuran file maksimal 5 MB.'));
          return;
        }
        const reader = new FileReader();
        reader.onload = async (event) => {
          const res = event.target?.result as string;
          if (res) {
            const updated: Colony = { ...activeColony, iconUrl: res };
            setColonies((prev) => {
              const next = prev.map((h) => (h.id === activeColony.id ? updated : h));
              saveStoredColonies(next);
              return next;
            });
            try {
              await colonyApi.updateColony(activeColony.id, { iconUrl: res });
            } catch {}
            toast.success(t('Foto server berhasil diperbarui! 🖼️'));
          }
        };
        reader.readAsDataURL(file);
      }}
      onOpenEditHub={() => setHubToEdit(activeColony)}
      onOpenDeleteHub={() => setHubToDelete(activeColony)}
      setIsCallPiP={setIsCallPiP}
      selectedActivityAppId={selectedActivityAppId}
      userBottomDock={null}
      t={t}
    />
  );

  // Component: User Footer Profile Dock (delegates to reusable UserBottomDock feature component)
  const renderUserBottomDock = () => {
    const activeCallChannel = channels.find((c) => c.id === activeCallChannelId);
    return (
      <UserBottomDock
        currentUser={currentUser}
        currentUserName={currentUserName}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        isDeafened={isDeafened}
        setIsDeafened={setIsDeafened}
        onOpenSettings={handleOpenUserSettings}
        onLogout={handleLogout}
        onGoogleSignIn={handleGoogleSignIn}
        activeCallChannelId={activeCallChannelId}
        activeCallChannelName={activeCallChannel?.name}
        activeColonyName={activeColony?.name}
        isActivityChannel={!!activeCallChannelId && activeCallChannel?.type !== 'voice'}
        onReturnToCall={() => {
          setActiveChannelId(activeCallChannelId!);
          setIsCallPiP(false);
        }}
        onDisconnectCall={() => {
          setActiveCallChannelId(null);
          setIsActivityOpen(false);
        }}
      />
    );
  };

  // Component: Discord-Style Friends Main Page (delegates to reusable FriendsView feature component)
  const renderFriendsMainPage = () => (
    <FriendsView
      {...friends}
      currentUser={currentUser}
      members={members}
      onTabChange={(tab) => {
        if (tab === 'add' && !currentUser) {
          setAuthFeatureInfo({
            title: t('Tambah Teman'),
            desc: t('Masuk ke Anticeil untuk mencari dan menambahkan teman baru.'),
          });
          setIsAuthRequiredOpen(true);
          return;
        }
        friends.onTabChange(tab);
      }}
      onStartDM={handleStartDM}
      onOpenDmSearch={() =>
        requireAuth(
          () => {
            setIsDmSearchOpen(true);
            setDmSearchQuery('');
          },
          t('Cari Percakapan'),
          t('Masuk ke Anticeil untuk memulai obrolan langsung.'),
        )
      }
      onOpenSidebar={() => setIsMobileChannelsOpen(true)}
      horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
    />
  );

  // Active DM partner resolution for user profile sidebar
  const isDmMode = Boolean(
    isHome ||
    activeChannel?.category === 'DIRECT MESSAGES' ||
    activeChannel?.isDirectMessage ||
    activeChannel?.id?.startsWith('dm-')
  );

  const activeDmUserId = useMemo(() => {
    if (!activeChannel) return undefined;
    if (activeChannel.dmUserId) return activeChannel.dmUserId;
    if (activeChannel.id?.startsWith('dm-')) {
      const parts = activeChannel.id.slice(3).split('-').filter(Boolean);
      return parts.find((p) => p !== currentUser?.id) || parts[0];
    }
    return undefined;
  }, [activeChannel, currentUser?.id]);

  const activeDmMember = useMemo(() => {
    if (!activeDmUserId) return undefined;
    return allKnownMembers.find((m) => m.id === activeDmUserId);
  }, [activeDmUserId, allKnownMembers]);

  // Component: Members / DM User Profile Sidebar Content
  const renderMembersSidebarContent = () => {
    if (isDmMode && activeDmUserId) {
      return (
        <DmUserProfileSidebar
          userId={activeDmUserId}
          member={activeDmMember}
          currentUser={currentUser}
          colonies={colonies}
          friends={friends.allFriends}
          onStartCall={(callType) => {
            if (activeDmUserId) {
              handleCreateCallLog({
                peerId: activeDmUserId,
                peerName: activeDmMember?.name || activeChannel?.name || 'Direct Message',
                peerAvatar: activeDmMember?.avatar || null,
                type: 'outgoing',
                isVideo: callType === 'video',
                channelId: activeChannel?.id,
                duration: 'Ongoing',
              });
            }
          }}
          onSelectHub={(colonyId) => {
            setActiveColonyId(colonyId);
            setIsMobileMembersOpen(false);
          }}
          onClose={() => {
            setShowMemberList(false);
            setIsMobileMembersOpen(false);
          }}
          t={t}
        />
      );
    }

    return (
      <ColonyMembersSidebar
        displayMembers={displayMembers}
        onInviteClick={() => setIsInviteOpen(true)}
        onStartDM={handleStartDM}
        t={t}
      />
    );
  };

  return (
    <LockedFeatureGuard
      locked={false}
      lockTier="Plus"
      lockTitle={t('Unlock Chat & Collaboration')}
      lockDescription={t(
        'Berkomunikasi secara real-time, berbagi template otomatisasi instan, dan kolaborasi terpadu dengan rekan tim kerja Anda. Buka fitur ini dengan upgrade ke paket Plus (hingga 5 pengguna) atau Team.',
      )}
    >
      <TooltipProvider delayDuration={200}>
      <div className="flex h-full w-full overflow-hidden bg-background">
        {/* DESKTOP & TABLET COMBINED LEFT COLUMN (Mini Rail + Channels Sidebar + Bottom Dock across both) */}
        <ChatDesktopSidebar
          sidebarWidth={sidebarWidth}
          isResizingSidebar={isResizingSidebar}
          onResizeStart={handleSidebarResizeStart}
          onResizeReset={handleSidebarResizeReset}
          renderDiscordHubRail={renderDiscordHubRail}
          renderChannelsSidebarContent={renderChannelsSidebarContent}
          renderUserBottomDock={renderUserBottomDock}
          t={t}
        />

        {/* MOBILE & TABLET DRAWERS */}
        <ChatMobileDrawers
          isMobileChannelsOpen={isMobileChannelsOpen}
          setIsMobileChannelsOpen={setIsMobileChannelsOpen}
          isMobileMembersOpen={isMobileMembersOpen}
          setIsMobileMembersOpen={setIsMobileMembersOpen}
          renderDiscordHubRail={renderDiscordHubRail}
          renderChannelsSidebarContent={renderChannelsSidebarContent}
          renderMembersSidebarContent={renderMembersSidebarContent}
          renderUserBottomDock={renderUserBottomDock}
          t={t}
        />

        {/* MAIN CONTENT AREA: DISCORD-STYLE FRIENDS HUB, NOTIFICATIONS, CHANNEL CHAT, ETC. */}
        <ChatMainView
          isFriendsView={isFriendsView}
          renderFriendsMainPage={renderFriendsMainPage}
          isMessageRequestsView={isMessageRequestsView}
          messageRequests={messageRequests}
          handleAcceptMessageRequest={handleAcceptMessageRequest}
          handleIgnoreMessageRequest={handleIgnoreMessageRequest}
          handleReportSpamMessageRequest={handleReportSpamMessageRequest}
          setIsMobileChannelsOpen={setIsMobileChannelsOpen}
          isNotificationsView={isNotificationsView}
          notifications={notifications}
          handleMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          handleMarkNotificationRead={handleMarkNotificationRead}
          handleJumpToNotification={handleJumpToNotification}
          isCalendarView={isCalendarView}
          calendarEvents={calendarEvents}
          colonies={colonies}
          channels={channels}
          colonyChannels={colonyChannels}
          setActiveColonyId={setActiveColonyId}
          setActiveChannelId={setActiveChannelId}
          setActiveCallChannelId={setActiveCallChannelId}
          createCalendarEvent={createCalendarEvent}
          isAssignmentsView={isAssignmentsView}
          assignments={assignments}
          handleToggleComplete={handleToggleComplete}
          isCallsView={isCallsView}
          callLogs={callLogs}
          friends={friends}
          handleCreateCallLog={handleCreateCallLog}
          handleStartDirectMessage={handleStartDM}
          isAppsView={isAppsView}
          members={members}
          activeCallChannelId={activeCallChannelId}
          handleLaunchActivity={handleLaunchActivity}
          handleStartDM={handleStartDM}
          isColoniesView={isColoniesView}
          requireAuth={requireAuth}
          setIsCreateHubOpen={setIsCreateHubOpen}
          activeChannel={activeChannel}
          isHome={isHome}
          isCallPiP={isCallPiP}
          isThreadsPopoverOpen={isThreadsPopoverOpen}
          setIsThreadsPopoverOpen={setIsThreadsPopoverOpen}
          channelThreads={channelThreads}
          threadSearchQuery={threadSearchQuery}
          setThreadSearchQuery={setThreadSearchQuery}
          setIsCreateThreadModalOpen={setIsCreateThreadModalOpen}
          setActiveThread={setActiveThread}
          setIsThreadDrawerOpen={setIsThreadDrawerOpen}
          isNotificationDropdownOpen={isNotificationDropdownOpen}
          setIsNotificationDropdownOpen={setIsNotificationDropdownOpen}
          channelNotification={channelNotification}
          handleUpdateNotification={handleUpdateNotification}
          isPinnedPopoverOpen={isPinnedPopoverOpen}
          setIsPinnedPopoverOpen={setIsPinnedPopoverOpen}
          pinnedMessages={pinnedMessages}
          handleJumpToMessage={handleJumpToMessage}
          handleTogglePin={handleTogglePin}
          showMemberList={showMemberList}
          setShowMemberList={setShowMemberList}
          setIsMobileMembersOpen={setIsMobileMembersOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeColony={activeColony}
          currentUser={currentUser}
          isPlusOrAbove={isPlusOrAbove}
          socket={socket}
          isActivityOpen={isActivityOpen}
          selectedActivityAppId={selectedActivityAppId}
          setSelectedActivityAppId={setSelectedActivityAppId}
          setIsActivityOpen={setIsActivityOpen}
          setIsCallPiP={setIsCallPiP}
          navigate={navigate}
          activeThread={activeThread}
          threadsMap={threadsMap}
          threadMessages={threadMessages}
          forumSearchQuery={forumSearchQuery}
          setForumSearchQuery={setForumSearchQuery}
          forumSort={forumSort}
          setForumSort={setForumSort}
          isForumComposerOpen={isForumComposerOpen}
          setIsForumComposerOpen={setIsForumComposerOpen}
          forumNewTitle={forumNewTitle}
          setForumNewTitle={setForumNewTitle}
          forumNewMessage={forumNewMessage}
          setForumNewMessage={setForumNewMessage}
          isSubmittingForumPost={isSubmittingForumPost}
          handleCreateForumPost={handleCreateForumPost}
          threadInputText={threadInputText}
          setThreadInputText={setThreadInputText}
          handleSendThreadMessage={handleSendThreadMessage}
          displayMembers={displayMembers}
          handleKanbanCardsUpdate={handleKanbanCardsUpdate}
          replyingToMessage={replyingToMessage}
          setReplyingToMessage={setReplyingToMessage}
          filteredMessages={filteredMessages}
          claimedGifts={claimedGifts}
          setClaimedGifts={setClaimedGifts}
          setIsCreateChannelOpen={setIsCreateChannelOpen}
          handleToggleReaction={handleToggleReaction}
          setNewThreadName={setNewThreadName}
          setNewThreadInitialMsg={setNewThreadInitialMsg}
          handleDeleteMessage={handleDeleteMessage}
          messagesEndRef={messagesEndRef}
          stagedAttachment={stagedAttachment}
          setStagedAttachment={setStagedAttachment}
          inputText={inputText}
          setInputText={setInputText}
          handleSendMessage={handleSendMessage}
          handleFileChange={handleFileChange}
          setIsGiftModalOpen={setIsGiftModalOpen}
          isMediaPickerOpen={isMediaPickerOpen}
          setIsMediaPickerOpen={setIsMediaPickerOpen}
          activeMediaTab={activeMediaTab}
          setActiveMediaTab={setActiveMediaTab}
          mediaSearchQuery={mediaSearchQuery}
          setMediaSearchQuery={setMediaSearchQuery}
          selectedGifCategory={selectedGifCategory}
          setSelectedGifCategory={setSelectedGifCategory}
          serverDbEmojis={serverDbEmojis}
          serverDbStickers={serverDbStickers}
          handleSelectEmoji={handleSelectEmoji}
          handleSendSticker={handleSendSticker}
          handleSendGif={handleSendGif}
          setIsQuickAddEmojiOpen={setIsQuickAddEmojiOpen}
          setIsQuickAddStickerOpen={setIsQuickAddStickerOpen}
          isTemplatePopoverOpen={isTemplatePopoverOpen}
          setIsTemplatePopoverOpen={setIsTemplatePopoverOpen}
          appsSearchQuery={appsSearchQuery}
          setAppsSearchQuery={setAppsSearchQuery}
          handleScheduleMessage={handleScheduleMessage}
          handleCreatePoll={handleCreatePoll}
          t={t}
        />

        {/* DESKTOP MEMBERS / USER PROFILE SIDEBAR */}
        {showMemberList && !isFriendsView && activeChannel?.type !== 'voice' && activeCallChannelId !== activeChannel?.id && (
          <div className={cn("hidden lg:flex shrink-0", isDmMode && activeDmUserId ? "w-80" : "w-60")}>
            {renderMembersSidebarContent()}
          </div>
        )}

        {/* Community Dialogs & Modals Portal */}
        <ColonyEventsModal
        isOpen={isColonyEventsModalOpen}
        onClose={() => setIsColonyEventsModalOpen(false)}
        activeColony={activeColony}
        channels={channels}
        events={calendarEvents}
        onCreateEvent={createCalendarEvent}
        currentUser={currentUser}
        onJoinChannel={(chId) => {
          setActiveCallChannelId(chId);
          setActiveChannelId(chId);
        }}
      />
      <ChatDialogsPortal
          colonyModals={colonyModals}
          channelModals={channelModals}
          mediaModals={mediaModals}
          activeColony={activeColony}
          activeChannel={activeChannel}
          currentUser={currentUser}
          members={members}
          setMembers={setMembers}
          channels={channels}
          colonyChannels={colonyChannels}
          onUpdateHub={async (colonyId, updates) => {
            if (!activeColony) return;
            const updated = { ...activeColony, ...updates };
            setColonies((prev) => {
              const next = prev.map((h) => (h.id === colonyId ? updated : h));
              saveStoredColonies(next);
              return next;
            });
            try {
              await colonyApi.updateColony(colonyId, updates);
            } catch {}
          }}
          isDmSearchOpen={isDmSearchOpen}
          setIsDmSearchOpen={setIsDmSearchOpen}
          dmSearchQuery={dmSearchQuery}
          setDmSearchQuery={setDmSearchQuery}
          dmChannels={dmChannels}
          setActiveColonyId={setActiveColonyId}
          setActiveChannelId={setActiveChannelId}
          handleStartDM={handleStartDM}
          isGiftModalOpen={isGiftModalOpen}
          setIsGiftModalOpen={setIsGiftModalOpen}
          handleSendGift={handleSendGift}
          isUserSettingsOpen={isUserSettingsOpen}
          setIsUserSettingsOpen={setIsUserSettingsOpen}
          userSettingsInitialSection={userSettingsInitialSection}
          currentUserName={currentUserName}
          updateNameMutation={updateNameMutation}
          updateUsernameMutation={updateUsernameMutation}
          theme={theme}
          setTheme={setTheme}
          handleGoogleSignIn={handleGoogleSignIn}
          handleLogout={handleLogout}
          isCreateThreadModalOpen={isCreateThreadModalOpen}
          setIsCreateThreadModalOpen={setIsCreateThreadModalOpen}
          handleCreateThread={handleCreateThread}
          isThreadDrawerOpen={isThreadDrawerOpen}
          setIsThreadDrawerOpen={setIsThreadDrawerOpen}
          activeThread={activeThread}
          threadMessages={threadMessages}
          handleSendThreadMessage={handleSendThreadMessage}
          renderFormattedMessage={renderFormattedMessage}
          activeCallChannelId={activeCallChannelId}
          setActiveCallChannelId={setActiveCallChannelId}
          isCallPiP={isCallPiP}
          setIsCallPiP={setIsCallPiP}
          isPlusOrAbove={isPlusOrAbove}
          socket={socket}
          selectedActivityAppId={selectedActivityAppId}
          setSelectedActivityAppId={setSelectedActivityAppId}
          setIsActivityOpen={setIsActivityOpen}
          navigate={navigate}
          isAuthRequiredOpen={isAuthRequiredOpen}
          setIsAuthRequiredOpen={setIsAuthRequiredOpen}
          authFeatureInfo={authFeatureInfo}
          t={t}
        />

        {/* Add Friend Dialog Modal */}
        <AddFriendDialog
          open={isAddFriendDialogOpen}
          onOpenChange={setIsAddFriendDialogOpen}
          onAddFriend={friends.onAddFriend}
          isAddingFriend={friends.isAddingFriend}
          currentUser={currentUser}
          allFriends={friends.allFriends}
          friendRequests={friends.friendRequests}
          members={members}
        />
      </div>
    </TooltipProvider>
    </LockedFeatureGuard>
  );
}
export { CommunityPage as MessagesPage };
export default CommunityPage;
