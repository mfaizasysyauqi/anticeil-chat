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
import confetti from 'canvas-confetti';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { useTranslation } from '@/core/i18n';
import { useTheme } from '@/core/theme';
import { useResponsive, LAYOUT_SIZES } from '@/core';
import { parseJwt } from '@/lib/utils';
import {
  ServerRail,
  ServerInviteDialog,
  CreateOrJoinServerDialog,
  EditServerDialog,
  DeleteServerDialog,
  useServerModals,
} from '@/features/servers';
import { UserBottomDock, EditProfileDialog } from '@/features/profile';
import { FriendsView, type FriendRequest, useFriendsManager } from '@/features/friends';
import { MessageRequestsView, type MessageRequestItem, useMessageRequests } from '@/features/message-requests';
import { NotificationsView, type NotificationItem, useNotifications } from '@/features/notifications';
import { CalendarView, type CalendarEvent, useCalendarEvents } from '@/features/calendar';
import { AssignmentsView, type AssignmentItem, useAssignments } from '@/features/assignments';
import { CallsView, type CallLogItem, useCallLogs } from '@/features/calls';
import { AppsView } from '@/features/apps';
import { ServersView } from '@/features/servers';
import { KanbanChannelView, type KanbanCard } from '@/features/kanban';
import {
  ChannelSettingsDialog,
  CreateChannelDialog,
  EditChannelDialog,
  DeleteChannelDialog,
  DmSearchDialog,
  ChannelTopHeaderBar,
  ForumChannelView,
  ChannelsSidebar,
  useResizableSidebar,
  useChannelModals,
} from '@/features/channels';
import { ServerMembersSidebar } from '@/features/members';
import { ServerSettingsDialog, type ServerSettingsSection } from '@/features/server-settings';
import { WebhookDialog } from '@/features/webhooks';
import { CreateThreadModal, ThreadDrawer } from '@/features/threads';
import { SendGiftDialog } from '@/features/gifts';
import { ChatInputBar, processFileInput } from '@/features/chat-input';
import { MessagesFeed, renderFormattedMessage, useCommunitySocket } from '@/features/chat';
import { QuickAddEmojiDialog, QuickAddStickerDialog, useMediaModals } from '@/features/media';
import { AuthRequiredDialog } from '@/features/auth';

const LockedFeatureGuard: any = ({ children }: any) => <>{children}</>;
const authenticationSession: any = {
  getToken: () => localStorage.getItem('token') || localStorage.getItem('ap_token'),
  getProjectId: () => localStorage.getItem('projectId') || 'default',
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
import { CommunityCallStage, DISCORD_APPS } from '@/features/voice';
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

import { chatApi, communityApi } from './chat-api';
import {
  DEFAULT_CHANNELS,
  DEFAULT_HUBS,
  loadStoredHubs,
  saveStoredHubs,
} from './chat-defaults';
import {
  CommunityAttachment,
  CommunityChannel,
  CommunityChannelType,
  CommunityHub,
  CommunityHubId,
  CommunityMember,
  CommunityMessage,
  CommunityRole,
  CommunityAuditEntry,
  CommunityInvite,
  CommunityBan,
  CommunityCustomRole,
  CommunityHubStats,
  CommunityCustomEmoji,
  CommunityChannelNotification,
  CommunityChannelNotificationLevel,
  CommunityThread,
} from './chat-types';


// Rich message parser (supports **bold**, `code`, @mentions, and links)
export function CommunityPage() {
  const { t } = useTranslation();
  const { theme, setTheme, toggleTheme } = useTheme();
  const { isMobile, isTablet, isDesktop, deviceMode } = useResponsive();
  const navigate = useNavigate();

  const [isAuthRequiredOpen, setIsAuthRequiredOpen] = useState(false);
  const [authFeatureInfo, setAuthFeatureInfo] = useState<{ title?: string; desc?: string }>({});

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
    setHubs(DEFAULT_HUBS);
    setChannels([]);
    setMembers([]);
    setMessagesMap({});
    setActiveHubId('anticeil');
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
  const [activeCallChannelId, setActiveCallChannelId] = useState<string | null>(null);
  const [isCallPiP, setIsCallPiP] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [activeCallCounts, setActiveCallCounts] = useState<Record<string, number>>({});
  const [selectedActivityAppId, setSelectedActivityAppId] = useState<string | null>(null);
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
  const [hubs, setHubs] = useState<CommunityHub[]>(() => loadStoredHubs());
  const [activeHubId, setActiveHubId] = useState<CommunityHubId>(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('hub') || (params.get('invite')?.startsWith('hub_') ? params.get('invite') : null);
    return fromUrl || 'anticeil';
  });

  const [channels, setChannels] = useState<CommunityChannel[]>(DEFAULT_CHANNELS);
  const [activeChannelId, setActiveChannelId] = useState<string>(() => {
    return new URLSearchParams(window.location.search).get('channel') || '';
  });
  const [messagesMap, setMessagesMap] = useState<Record<string, CommunityMessage[]>>({});
  const [members, setMembers] = useState<CommunityMember[]>([]);

  // Home View Mode: Friends Hub vs Servers vs Message Requests vs Notifications vs Calendar vs Assignments vs Calls vs Apps
  const [homeView, setHomeView] = useState<'friends' | 'servers' | 'message-requests' | 'notifications' | 'calendar' | 'assignments' | 'calls' | 'apps'>('friends');

  // Feature-First Hooks (Fullstack connected to PostgreSQL DB)
  const {
    events: calendarEvents,
    setEvents: setCalendarEvents,
    handleCreateEvent: createCalendarEvent,
  } = useCalendarEvents();

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

  const activeHub = useMemo(() => {
    return hubs.find((h) => h.id === activeHubId) || hubs[0];
  }, [hubs, activeHubId]);

  // Listen to switch_hub and open_create_hub events from the Unified Mini Rail
  useEffect(() => {
    const handleSwitchHub = (e: any) => {
      const hubId = e.detail;
      if (hubId) {
        setActiveHubId(hubId);
        if (hubId === 'anticeil') {
          setActiveChannelId('');
        } else {
          const firstCh = channels.find(
            (c) => (c.hubId || 'anticeil') === hubId && c.category === 'CHANNELS',
          );
          if (firstCh) setActiveChannelId(firstCh.id);
        }
      }
    };
    const handleOpenCreateHub = () => {
      setIsCreateHubOpen(true);
    };
    window.addEventListener('anticeil_switch_hub', handleSwitchHub as EventListener);
    window.addEventListener('anticeil_open_create_hub', handleOpenCreateHub);
    return () => {
      window.removeEventListener('anticeil_switch_hub', handleSwitchHub as EventListener);
      window.removeEventListener('anticeil_open_create_hub', handleOpenCreateHub);
    };
  }, [channels]);

  // Broadcast activeHubId to Unified Mini Rail
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('anticeil_active_hub_changed', { detail: activeHubId }));
  }, [activeHubId]);

  // Synchronize browser URL address bar with active hub and active channel
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      let changed = false;
      if (activeHubId && activeHubId !== 'anticeil') {
        if (url.searchParams.get('hub') !== activeHubId) {
          url.searchParams.set('hub', activeHubId);
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
      } else if (url.searchParams.has('channel')) {
        url.searchParams.delete('channel');
        changed = true;
      }

      if (changed) {
        window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
      }
    } catch {}
  }, [activeHubId, activeChannelId]);

  const [inputText, setInputText] = useState('');
  const [stagedAttachment, setStagedAttachment] = useState<CommunityAttachment | null>(null);
  const [showMemberList, setShowMemberList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTemplatePopoverOpen, setIsTemplatePopoverOpen] = useState(false);

  // Server Modals & Actions (Feature-First Hook)
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
    setServerSettingsSection,
  } = useServerModals({
    hubs,
    setHubs,
    channels,
    setChannels,
    activeHub,
    setActiveHubId,
    setActiveChannelId,
    setActiveCallChannelId,
    setIsCallPiP,
    setMembers,
    t,
  });

  // Channel Modals & Actions (Feature-First Hook)
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
  } = useChannelModals({
    activeHubId,
    channels,
    setChannels,
    activeChannelId,
    setActiveChannelId,
    t,
  });

  // Media Modals & Quick Add (Feature-First Hook)
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
  } = useMediaModals({
    activeHub,
  });

  // Discord Send a Gift Modal - matching Screenshot 4
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [claimedGifts, setClaimedGifts] = useState<Record<string, boolean>>({});

  // ── Discord Pinned Messages (Screenshot 1) ───────────────────────────
  const [isPinnedPopoverOpen, setIsPinnedPopoverOpen] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<CommunityMessage[]>([]);
  const [isLoadingPins, setIsLoadingPins] = useState(false);

  // ── Discord Notification Settings (Screenshot 2) ─────────────────────
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [channelNotification, setChannelNotification] = useState<CommunityChannelNotification>({
    channelId: '',
    userId: 'me',
    level: 'default',
    isMuted: false,
    mutedUntil: null,
  });

  // ── Discord Threads (Screenshot 3) ───────────────────────────────────
  const [isThreadsPopoverOpen, setIsThreadsPopoverOpen] = useState(false);
  const [channelThreads, setChannelThreads] = useState<CommunityThread[]>([]);
  const [threadSearchQuery, setThreadSearchQuery] = useState('');
  const [isCreateThreadModalOpen, setIsCreateThreadModalOpen] = useState(false);
  const [newThreadName, setNewThreadName] = useState('');
  const [newThreadInitialMsg, setNewThreadInitialMsg] = useState('');
  const [isSubmittingThread, setIsSubmittingThread] = useState(false);
  const [activeThread, setActiveThread] = useState<CommunityThread | null>(null);
  const [threadMessages, setThreadMessages] = useState<CommunityMessage[]>([]);
  const [threadInputText, setThreadInputText] = useState('');
  const [isThreadDrawerOpen, setIsThreadDrawerOpen] = useState(false);

  // Forum Channel states (matching Discord Screenshot 3)
  const [forumSearchQuery, setForumSearchQuery] = useState('');
  const [forumSort, setForumSort] = useState<'newest' | 'active'>('newest');
  const [isForumComposerOpen, setIsForumComposerOpen] = useState(false);
  const [forumNewTitle, setForumNewTitle] = useState('');
  const [forumNewMessage, setForumNewMessage] = useState('');
  const [isSubmittingForumPost, setIsSubmittingForumPost] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<{ text: boolean; voice: boolean; forum: boolean }>({
    text: false,
    voice: false,
    forum: false,
  });
  const [threadsMap, setThreadsMap] = useState<Record<string, CommunityThread[]>>({});

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
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

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
          setHubs(DEFAULT_HUBS);
          setActiveHubId('anticeil');
          setActiveChannelId('');
        }
        return;
      }
      try {
        const currentProjectId = authenticationSession.getProjectId();
        const [channelsRes, membersRes, hubsRes] = await Promise.all([
          communityApi.getChannels(),
          communityApi.getMembers(currentProjectId || undefined),
          communityApi.getHubs(),
        ]);
        if (mounted) {
          if (Array.isArray(channelsRes)) {
            setChannels(channelsRes);
            const targetChannelParam = new URLSearchParams(window.location.search).get('channel');
            if (targetChannelParam) {
              const matchedChannel = channelsRes.find((c) => c.id === targetChannelParam);
              if (matchedChannel) {
                setActiveChannelId(matchedChannel.id);
                if (matchedChannel.type === 'voice') {
                  setActiveCallChannelId(matchedChannel.id);
                  setIsCallPiP(false);
                }
              }
            } else if (channelsRes.length > 0 && activeHubId !== 'anticeil') {
              const activeVoice = channelsRes.find(
                (c) => (c.hubId || 'anticeil') === activeHubId && c.type === 'voice' && (activeCallCounts[c.id] || 0) > 0,
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
            setHubs((prev) => {
              const home = prev.find((h) => h.id === 'anticeil') || DEFAULT_HUBS[0];
              const merged = [home, ...hubsRes.filter((s) => s.id !== 'anticeil')];
              saveStoredHubs(merged);
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
          communityApi.getMessages(activeChannelId),
          communityApi.getPinnedMessages(activeChannelId),
          communityApi.getChannelNotification(activeChannelId),
          communityApi.getThreads(activeChannelId),
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


  // Load thread messages when an active thread is selected
  useEffect(() => {
    if (!activeThread) return;
    let mounted = true;
    const loadThreadMsgs = async () => {
      try {
        const msgs = await communityApi.getThreadMessages(activeThread.id);
        if (mounted && msgs) {
          setThreadMessages(msgs);
        }
      } catch (err) {
        console.warn('Failed to load thread messages', activeThread.id, err);
      }
    };
    loadThreadMsgs();
    return () => {
      mounted = false;
    };
  }, [activeThread?.id]);


  // 3. WebSocket Realtime Listeners (Feature-First Hook)
  useCommunitySocket({
    socket,
    activeChannelId,
    setMessagesMap,
    setChannels,
    setActiveChannelId,
    setActiveCallCounts,
  });

  // Channels filtered by selected Hub
  const hubChannels = useMemo(() => {
    return channels.filter(
      (c) => (c.hubId || 'anticeil') === (activeHubId || 'anticeil') && c.category === 'CHANNELS',
    );
  }, [channels, activeHubId]);

  const textChannels = useMemo(() => {
    return hubChannels.filter((c) => c.type === 'text' || !c.type);
  }, [hubChannels]);

  const voiceChannels = useMemo(() => {
    return hubChannels.filter((c) => c.type === 'voice');
  }, [hubChannels]);

  const forumChannels = useMemo(() => {
    return hubChannels.filter((c) => c.type === 'forum');
  }, [hubChannels]);

  const dmChannels = useMemo(() => {
    return channels.filter((c) => c.category === 'DIRECT MESSAGES');
  }, [channels]);

  const isHome = activeHubId === 'anticeil';

  // Active channel resolution: Home prefers explicit activeChannelId (DM chat) or null (Friends page).
  // Servers MUST strictly isolate channels to the active server!
  const activeChannel = useMemo(() => {
    if (isHome) {
      if (!activeChannelId) return null;
      return dmChannels.find((c) => c.id === activeChannelId) || null;
    }
    if (hubChannels.length === 0) return null;
    if (activeChannelId) {
      const current = hubChannels.find((c) => c.id === activeChannelId);
      if (current) return current;
    }
    return hubChannels[0] || null;
  }, [isHome, activeChannelId, dmChannels, hubChannels]);

  // Load threads for all forum channels in the active hub so sidebar shows child threads
  useEffect(() => {
    if (!hubChannels.length) return;
    const forumChannels = hubChannels.filter((c) => c.type === 'forum');
    if (!forumChannels.length) return;

    forumChannels.forEach(async (fc) => {
      try {
        const ths = await communityApi.getThreads(fc.id);
        if (ths) {
          setThreadsMap((prev) => ({ ...prev, [fc.id]: ths }));
        }
      } catch {}
    });
  }, [hubChannels]);

  // Auto-fetch and sync channels when switching to a server
  useEffect(() => {
    if (!activeHubId || activeHubId === 'anticeil') return;
    let mounted = true;
    const loadHubChannels = async () => {
      try {
        const res = await communityApi.getChannels(activeHubId);
        if (mounted && Array.isArray(res)) {
          setChannels((prev) => {
            const others = prev.filter((c) => (c.hubId || 'anticeil') !== activeHubId);
            return [...others, ...res];
          });
          const targetChannelParam = new URLSearchParams(window.location.search).get('channel');
          const matchedTarget = res.find((c) => c.id === targetChannelParam);
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
        console.warn('Failed to load channels for hub', activeHubId, err);
      }
    };
    loadHubChannels();
    return () => {
      mounted = false;
    };
  }, [activeHubId]);

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
  const isServersView = isHome && !activeChannel && homeView === 'servers';

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

  useEffect(() => {
    scrollToBottom();
  }, [activeChannelId, currentMessages.length]);

  // Send message
  const handleSendMessage = async () => {
    if (!currentUser) {
      setAuthFeatureInfo({
        title: t('Kirim Pesan'),
        desc: t('Masuk ke Anticeil untuk mengirim pesan di saluran ini.'),
      });
      setIsAuthRequiredOpen(true);
      return;
    }
    if (!activeChannel) return;
    if (!inputText.trim() && !stagedAttachment) return;

    const currentUserId = currentUser?.id || 'anon-user';
    const currentUserName =
      `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() ||
      currentUser?.email?.split('@')[0] ||
      'Pengguna Anticeil';

    const myMemberInfo = members.find((m) => m.id === currentUserId || m.email === currentUser?.email);
    let myRole: CommunityRole = myMemberInfo?.role || 'member';
    if (activeHub?.role === 'owner') {
      myRole = 'owner';
    } else if (activeHub?.role === 'admin') {
      myRole = 'admin';
    }

    const payload: Partial<CommunityMessage> = {
      channelId: activeChannel.id,
      senderId: currentUserId,
      senderName: currentUserName,
      senderEmail: currentUser?.email || 'user@anticeil.com',
      senderAvatar: currentUser?.imageUrl ?? null,
      senderRole: myRole,
      content: inputText.trim(),
      attachments: stagedAttachment ? [stagedAttachment] : undefined,
    };

    setInputText('');
    setStagedAttachment(null);

    try {
      const saved = await communityApi.sendMessage(activeChannel.id, payload);
      setMessagesMap((prev) => {
        const list = prev[activeChannel.id] || [];
        if (list.some((m) => m.id === saved.id)) return prev;
        return {
          ...prev,
          [activeChannel.id]: [...list, saved],
        };
      });
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  // Fullstack Discord Sticker sender (direct message attachment)
  const handleSendSticker = async (sticker: DiscordSticker) => {
    if (!activeChannel) return;
    setIsMediaPickerOpen(false);
    const currentUserId = currentUser?.id || 'anon-user';
    const currentUserName =
      `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() ||
      currentUser?.email?.split('@')[0] ||
      'Pengguna Anticeil';

    const myMemberInfo = members.find((m) => m.id === currentUserId || m.email === currentUser?.email);
    let myRole: CommunityRole = myMemberInfo?.role || 'member';
    if (activeHub?.role === 'owner') myRole = 'owner';
    else if (activeHub?.role === 'admin') myRole = 'admin';

    const payload: Partial<CommunityMessage> = {
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
      const saved = await communityApi.sendMessage(activeChannel.id, payload);
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
    setIsMediaPickerOpen(false);
    const currentUserId = currentUser?.id || 'anon-user';
    const currentUserName =
      `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() ||
      currentUser?.email?.split('@')[0] ||
      'Pengguna Anticeil';

    const myMemberInfo = members.find((m) => m.id === currentUserId || m.email === currentUser?.email);
    let myRole: CommunityRole = myMemberInfo?.role || 'member';
    if (activeHub?.role === 'owner') myRole = 'owner';
    else if (activeHub?.role === 'admin') myRole = 'admin';

    const payload: Partial<CommunityMessage> = {
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
      const saved = await communityApi.sendMessage(activeChannel.id, payload);
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
  const handleSendGift = async (tier: 'nitro' | 'nitro_basic') => {
    if (!activeChannel) return;
    setIsGiftModalOpen(false);
    const isNitro = tier === 'nitro';
    const currentUserId = currentUser?.id || 'anon-user';
    const currentUserName =
      `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() ||
      currentUser?.email?.split('@')[0] ||
      'Pengguna Anticeil';

    const myMemberInfo = members.find((m) => m.id === currentUserId || m.email === currentUser?.email);
    let myRole: CommunityRole = myMemberInfo?.role || 'member';
    if (activeHub?.role === 'owner') myRole = 'owner';
    else if (activeHub?.role === 'admin') myRole = 'admin';

    const payload: Partial<CommunityMessage> = {
      channelId: activeChannel.id,
      senderId: currentUserId,
      senderName: currentUserName,
      senderEmail: currentUser?.email || 'user@anticeil.com',
      senderAvatar: currentUser?.imageUrl ?? null,
      senderRole: myRole,
      content: `🎁 Hadiah ${isNitro ? 'Discord Nitro' : 'Discord Nitro Basic'} untuk kamu!`,
      attachments: [
        {
          type: 'gift',
          url: isNitro
            ? 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png'
            : '',
          name: isNitro ? 'Discord Nitro (1 Bulan)' : 'Discord Nitro Basic (1 Bulan)',
          giftData: {
            tier,
            price: isNitro ? 'IDR 142,714' : 'IDR 42,714',
            claimed: false,
          },
        },
      ],
    };

    try {
      const saved = await communityApi.sendMessage(activeChannel.id, payload);
      setMessagesMap((prev) => {
        const list = prev[activeChannel.id] || [];
        if (list.some((m) => m.id === saved.id)) return prev;
        return { ...prev, [activeChannel.id]: [...list, saved] };
      });
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
      toast.success(t(`Berhasil mengirimkan Hadiah ${isNitro ? 'Nitro' : 'Nitro Basic'}! 🎉`));
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

  // Launch Activity in Voice Stage or Text Channel
  const handleLaunchActivity = async (
    appId: string,
    fromChatInvite: boolean = false,
    targetChannelId?: string,
  ) => {
    setSelectedActivityAppId(appId);
    setIsTemplatePopoverOpen(false);

    const originatingTextChannel = activeChannel && activeChannel.type !== 'voice' ? activeChannel : null;

    // Activities (Watch Together, games) require a voice call stage to run.
    // Always resolve target to a voice channel:
    let voiceDest = targetChannelId ? channels.find((c) => c.id === targetChannelId && c.type === 'voice') : null;
    if (!voiceDest && activeCallChannelId) {
      voiceDest = channels.find((c) => c.id === activeCallChannelId && c.type === 'voice');
    }
    if (!voiceDest && activeChannel?.type === 'voice') {
      voiceDest = activeChannel;
    }
    if (!voiceDest) {
      voiceDest = hubChannels.find((c) => c.type === 'voice' && (activeCallCounts[c.id] || 0) > 0);
    }
    if (!voiceDest) {
      voiceDest = hubChannels.find((c) => c.type === 'voice');
    }
    if (!voiceDest) {
      voiceDest = channels.find((c) => c.type === 'voice');
    }

    if (voiceDest) {
      if (voiceDest.hubId && voiceDest.hubId !== activeHubId) {
        setActiveHubId(voiceDest.hubId);
      }
      setActiveChannelId(voiceDest.id);
      setActiveCallChannelId(voiceDest.id);
      setIsCallPiP(false);
      setIsActivityOpen(true);
      socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
        channelId: voiceDest.id,
        action: 'START_ACTIVITY',
        payload: { appId },
      });

      const app = EXTENDED_DISCORD_APPS.find((a) => a.id === appId) || {
        id: appId,
        title: appId === 'watch-together' || appId === 'youtube' ? 'Watch Together' : appId,
        developer: appId === 'watch-together' || appId === 'youtube' ? 'YouTube' : 'Community App',
        description: 'Tonton video YouTube bersama rekan secara sinkron realtime tanpa delay.',
        icon: '▶️',
        iconBg: 'bg-red-600',
        bannerGradient: 'bg-white',
      };

      toast.success(t(`Aktivitas ${app.title} diluncurkan! 🚀`));

      // If launched from a text channel (not clicking Play from an existing message),
      // create and post the Discord-like Activity Invitation message in the text channel!
      if (!fromChatInvite && originatingTextChannel) {
        const currentUserId = currentUser?.id || 'anon-user';
        const currentUserName =
          `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() ||
          currentUser?.email?.split('@')[0] ||
          'Pengguna Anticeil';

        const myMemberInfo = members.find((m) => m.id === currentUserId || m.email === currentUser?.email);
        let myRole: CommunityRole = myMemberInfo?.role || 'member';
        if (activeHub?.role === 'owner') myRole = 'owner';
        else if (activeHub?.role === 'admin') myRole = 'admin';

        const payload: Partial<CommunityMessage> = {
          channelId: originatingTextChannel.id,
          senderId: currentUserId,
          senderName: currentUserName,
          senderEmail: currentUser?.email || 'user@anticeil.com',
          senderAvatar: currentUser?.imageUrl ?? null,
          senderRole: myRole,
          content: '',
          attachments: [
            {
              type: 'activity',
              url: '',
              name: app.title,
              activityData: {
                appId,
                name: app.title,
                developer: app.developer,
                description: app.description,
                icon: app.icon,
                iconBg: app.iconBg,
                bannerGradient: app.bannerGradient,
                startedBy: currentUserName,
                startedByAvatar: currentUser?.imageUrl ?? null,
                channelId: voiceDest.id,
                channelName: voiceDest.name,
              },
            },
          ],
        };

        try {
          const saved = await communityApi.sendMessage(originatingTextChannel.id, payload);
          setMessagesMap((prev) => {
            const list = prev[originatingTextChannel.id] || [];
            if (list.some((m) => m.id === saved.id)) return prev;
            return { ...prev, [originatingTextChannel.id]: [...list, saved] };
          });
        } catch (err) {
          console.error('Failed to send activity invite message', err);
        }
      }
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
      await communityApi.deleteMessage(msgId);
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
      await communityApi.toggleReaction(msgId, emoji, currentUserId);
    } catch (err) {
      console.error('Failed to toggle reaction', err);
    }
  };

  // ── Toggle Pin Message Handler ──────────────────────────────────────
  const handleTogglePin = async (msgId: string) => {
    if (!activeChannel) return;
    try {
      const updated = await communityApi.togglePinMessage(
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

  // ── Update Channel Notification Settings Handler ─────────────────────
  const handleUpdateNotification = async (
    level?: CommunityChannelNotificationLevel,
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
      await communityApi.updateChannelNotification(activeChannel.id, {
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

  // ── Thread Handlers (Feature-First) ──────────────────────────────────
  const handleCreateThread = async (name: string, initialMessage?: string) => {
    if (!activeChannel) return;
    try {
      const created = await communityApi.createThread(activeChannel.id, {
        name,
        creatorName: currentUser?.firstName || currentUser?.email || 'You',
        creatorAvatar: currentUser?.imageUrl ?? null,
        initialMessage,
      });

      setChannelThreads((prev) => [created, ...prev.filter((t) => t.id !== created.id)]);
      setActiveThread(created);
      setIsThreadDrawerOpen(true);
      setIsCreateThreadModalOpen(false);
      setIsThreadsPopoverOpen(false);
      toast.success(`Thread #${created.name} berhasil dibuat! 🧵`);
    } catch (err) {
      console.error('Failed to create thread', err);
      toast.error('Gagal membuat thread');
      throw err;
    }
  };

  const handleSendThreadMessage = async (contentOrEvent?: string | React.FormEvent) => {
    if (contentOrEvent && typeof contentOrEvent !== 'string') {
      contentOrEvent.preventDefault();
    }
    const content = typeof contentOrEvent === 'string' ? contentOrEvent : threadInputText.trim();
    if (!content || !activeThread || !activeChannel) return;
    if (typeof contentOrEvent !== 'string') {
      setThreadInputText('');
    }
    const newMsg: CommunityMessage = {
      id: `msg_th_${Date.now()}`,
      channelId: activeChannel.id,
      threadId: activeThread.id,
      senderId: currentUser?.id || 'me',
      senderName: currentUser?.firstName || currentUser?.email || 'You',
      senderEmail: currentUser?.email || '',
      senderAvatar: currentUser?.imageUrl ?? null,
      senderRole: 'member',
      content,
      createdAt: new Date().toISOString(),
    };

    setThreadMessages((prev) => [...prev, newMsg]);

    try {
      const res = await communityApi.sendThreadMessage(activeThread.id, activeChannel.id, {
        content,
        senderName: currentUser?.firstName || currentUser?.email || 'You',
        senderAvatar: currentUser?.imageUrl ?? null,
      });
      if (res && res.id) {
        setThreadMessages((prev) => prev.map((m) => (m.id === newMsg.id ? res : m)));
        setActiveThread((prev) => (prev ? { ...prev, messageCount: (prev.messageCount || 0) + 1, lastMessageAt: new Date().toISOString() } : null));
        setChannelThreads((prev) =>
          prev.map((t) =>
            t.id === activeThread.id
              ? { ...t, messageCount: (t.messageCount || 0) + 1, lastMessageAt: new Date().toISOString() }
              : t,
          ),
        );
      }
    } catch (err) {
      console.error('Failed to send thread message', err);
    }
  };

  // ── Forum Channel Create Post Handler (Screenshot 3) ────────────────
  const handleCreateForumPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChannel || !forumNewTitle.trim()) return;
    setIsSubmittingForumPost(true);
    try {
      const created = await communityApi.createThread(activeChannel.id, {
        name: forumNewTitle.trim(),
        creatorName: currentUser?.firstName || currentUser?.email || 'You',
        creatorAvatar: currentUser?.imageUrl ?? null,
        initialMessage: forumNewMessage.trim() || undefined,
      });
      if (created) {
        setChannelThreads((prev) => [created, ...prev.filter((t) => t.id !== created.id)]);
        setThreadsMap((prev) => ({
          ...prev,
          [activeChannel.id]: [created, ...(prev[activeChannel.id] || []).filter((t) => t.id !== created.id)],
        }));
        setActiveThread(created);
        setIsForumComposerOpen(false);
        setForumNewTitle('');
        setForumNewMessage('');
        toast.success(t(`Post "${created.name}" berhasil dibuat! 💬`));
      }
    } catch (err) {
      console.error('Failed to create forum post', err);
      toast.error(t('Gagal membuat forum post'));
    } finally {
      setIsSubmittingForumPost(false);
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
  const handleStartDM = (member: CommunityMember) => {
    const dmId = `dm-${member.id}`;
    const existing = channels.find((c) => c.id === dmId);
    if (!existing) {
      const newDMChannel: CommunityChannel = {
        id: dmId,
        name: member.name,
        description: `Percakapan langsung dengan ${member.name} (${member.customStatus || member.role})`,
        category: 'DIRECT MESSAGES',
        hubId: 'anticeil',
        isDirectMessage: true,
        dmUserId: member.id,
      };
      setChannels((prev) => [...prev, newDMChannel]);
    }
    // DMs live in Home hub, auto-switch
    setActiveHubId('anticeil');
    setActiveChannelId(dmId);
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
    if (item.hubId && item.hubId !== activeHubId) {
      setActiveHubId(item.hubId);
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

  const displayMembers: CommunityMember[] = useMemo(() => {
    const isOwner = activeHub?.role === 'owner';
    const isAdmin = activeHub?.role === 'admin';
    const list = members.map((m) => {
      if (m.id === currentUser?.id || m.email === currentUser?.email) {
        return {
          ...m,
          username: m.username || currentUser?.username || null,
          role: isOwner ? ('owner' as CommunityRole) : isAdmin ? ('admin' as CommunityRole) : (m.role || 'member'),
          roleLabel: isOwner ? 'Pemilik' : isAdmin ? 'Admin' : undefined,
        };
      }
      return m;
    });

    if (currentUser && !list.some((m) => m.id === currentUser.id || m.email === currentUser.email)) {
      const currentRole: CommunityRole = isOwner ? 'owner' : isAdmin ? 'admin' : 'member';
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
  }, [members, currentUser, activeHub]);

  // Friends Manager (Feature-First Hook)
  const friends = useFriendsManager({
    displayMembers,
    currentUser,
    members,
    t,
  });

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
        setActiveHubId('anticeil');
        setActiveChannelId('');
        setHomeView('friends');
      } else {
        const firstServer = hubs.find((h) => h.id !== 'anticeil') || hubs[0];
        if (firstServer) {
          setActiveHubId(firstServer.id);
          const firstCh = channels.find((c) => (c.hubId || 'anticeil') === firstServer.id && c.category === 'CHANNELS');
          setActiveChannelId(firstCh?.id || '');
        }
      }
      toast.info(next === 'friends' ? t('Beralih ke Mode Teman') : t('Beralih ke Mode Server'));
      return next;
    });
  };

  // Component: Server Rail (delegates to reusable ServerRail feature component)
  const renderDiscordHubRail = () => (
    <ServerRail
      servers={hubs}
      activeServerId={activeHubId}
      onSelectServer={(id) => {
        if (id !== 'anticeil' && !currentUser) {
          setAuthFeatureInfo({
            title: t('Akses Server'),
            desc: t('Masuk ke Anticeil untuk mengakses saluran dan mengobrol di server ini.'),
          });
          setIsAuthRequiredOpen(true);
          return;
        }
        setActiveHubId(id);
        if (id === 'anticeil') {
          setActiveChannelId('');
        } else {
          const firstCh = channels.find(
            (c) => (c.hubId || 'anticeil') === id && c.category === 'CHANNELS',
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
      onSelectFriend={(f) => handleStartDirectMessage(f)}
      onOpenAddFriend={() => {
        setActiveHubId('anticeil');
        setActiveChannelId('');
        setHomeView('friends');
        friends.setFriendsTab('add');
      }}
    />
  );

  // Component: Channels Sidebar Content (delegates to ChannelsSidebar feature component)
  const renderChannelsSidebarContent = (onItemClick?: () => void) => (
    <ChannelsSidebar
      isHome={isHome}
      activeHub={activeHub}
      channels={channels}
      activeChannelId={activeChannelId}
      setActiveChannelId={setActiveChannelId}
      activeCallChannelId={activeCallChannelId}
      setActiveCallChannelId={setActiveCallChannelId}
      isFriendsView={isFriendsView}
      homeView={homeView}
      setHomeView={setHomeView}
      messageRequestsCount={messageRequests.filter((r) => !r.isSpam).length}
      unreadNotificationsCount={notifications.filter((n) => !n.isRead).length}
      setFriendsTab={friends.setFriendsTab}
      friendRequests={friends.friendRequests}
      dmChannels={dmChannels}
      members={members}
      collapsedCategories={collapsedCategories}
      setCollapsedCategories={setCollapsedCategories}
      threadsMap={threadsMap}
      channelThreads={channelThreads}
      activeThread={activeThread}
      setActiveThread={setActiveThread}
      activeCallCounts={activeCallCounts}
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
          if (section) setServerSettingsSection(section);
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
        if (!activeHub) return;
        if (file.size > 5 * 1024 * 1024) {
          toast.error(t('Ukuran file maksimal 5 MB.'));
          return;
        }
        const reader = new FileReader();
        reader.onload = async (event) => {
          const res = event.target?.result as string;
          if (res) {
            const updated: CommunityHub = { ...activeHub, iconUrl: res };
            setHubs((prev) => {
              const next = prev.map((h) => (h.id === activeHub.id ? updated : h));
              saveStoredHubs(next);
              return next;
            });
            try {
              await communityApi.updateHub(activeHub.id, { iconUrl: res });
            } catch {}
            toast.success(t('Foto server berhasil diperbarui! 🖼️'));
          }
        };
        reader.readAsDataURL(file);
      }}
      onOpenEditHub={() => setHubToEdit(activeHub)}
      onOpenDeleteHub={() => setHubToDelete(activeHub)}
      setIsCallPiP={setIsCallPiP}
      userBottomDock={null}
      t={t}
    />
  );

  // Component: User Footer Profile Dock (delegates to reusable UserBottomDock feature component)
  const renderUserBottomDock = () => (
    <UserBottomDock
      currentUser={currentUser}
      currentUserName={currentUserName}
      isMuted={isMuted}
      setIsMuted={setIsMuted}
      isDeafened={isDeafened}
      setIsDeafened={setIsDeafened}
      onOpenEditProfile={() => setIsEditProfileOpen(true)}
      onLogout={handleLogout}
      onGoogleSignIn={handleGoogleSignIn}
      activeCallChannelId={activeCallChannelId}
      activeCallChannelName={channels.find((c) => c.id === activeCallChannelId)?.name}
      activeHubName={activeHub?.name}
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

  const handleStartDirectMessage = (member: any) => {
    if (!member) return;
    const dmId = `dm-${member.id}`;
    const dmName = member.name || member.username || member.firstName || 'Direct Message';
    setChannels((prev) => {
      const exists = prev.some((c) => c.id === dmId);
      if (exists) return prev;
      const newDm: CommunityChannel = {
        id: dmId,
        name: dmName,
        description: `Percakapan langsung dengan ${dmName}`,
        category: 'DIRECT MESSAGES',
        hubId: 'anticeil',
        isDirectMessage: true,
        dmUserId: member.id,
        type: 'text',
      };
      return [newDm, ...prev];
    });
    setActiveHubId('anticeil');
    setActiveChannelId(dmId);
    setHomeView('friends');
  };

  // Component: Discord-Style Friends Main Page (delegates to reusable FriendsView feature component)
  const renderFriendsMainPage = () => (
    <FriendsView
      {...friends}
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
      onStartDM={handleStartDirectMessage}
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

  // Component: Members Sidebar Content
  // Component: Members Sidebar Content (delegates to ServerMembersSidebar feature component)
  const renderMembersSidebarContent = () => (
    <ServerMembersSidebar
      displayMembers={displayMembers}
      onInviteClick={() => setIsInviteOpen(true)}
      onStartDM={handleStartDM}
      t={t}
    />
  );

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
        <div
          className="hidden md:flex flex-col h-full shrink-0 border-r border-sidebar-border bg-sidebar select-none relative group/sidebar"
          style={{ width: `${56 + sidebarWidth}px` }}
        >
          {/* Top/Middle Area: Mini Rail on left + Channels Sidebar on right */}
          <div className="flex flex-1 min-h-0 w-full overflow-hidden">
            <div className="w-14 shrink-0 h-full flex flex-col">
              {renderDiscordHubRail()}
            </div>
            <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
              {renderChannelsSidebarContent()}
            </div>
          </div>

          {/* Bottom Dock: Spans across the entire left area including Mini Rail */}
          {renderUserBottomDock()}

          {/* DISCORD-STYLE RESIZE HANDLE ON RIGHT BORDER */}
          <div
            role="separator"
            aria-orientation="vertical"
            title={t('Tarik untuk mengubah ukuran sidebar (Double-klik untuk reset)')}
            onMouseDown={handleSidebarResizeStart}
            onDoubleClick={handleSidebarResizeReset}
            className={cn(
              'absolute top-0 right-[-3px] w-[6px] h-full cursor-col-resize z-30 transition-colors select-none',
              isResizingSidebar
                ? 'bg-primary/80'
                : 'hover:bg-primary/50 bg-transparent'
            )}
          />
        </div>

        {/* MOBILE & TABLET CHANNELS DRAWER */}
        <Sheet open={isMobileChannelsOpen} onOpenChange={setIsMobileChannelsOpen}>
          <SheetContent side="left" className={cn("p-0 flex flex-col h-full bg-sidebar border-r border-sidebar-border", LAYOUT_SIZES.DRAWER_WIDTH)}>
            <SheetHeader className="sr-only">
              <SheetTitle>{t('Navigasi Channel & Hub')}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-1 min-h-0 w-full overflow-hidden">
              <div className="w-14 shrink-0 h-full flex flex-col">
                {renderDiscordHubRail()}
              </div>
              <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
                {renderChannelsSidebarContent(() => setIsMobileChannelsOpen(false))}
              </div>
            </div>
            {/* Bottom Dock: Spans full drawer width including Mini Rail */}
            {renderUserBottomDock()}
          </SheetContent>
        </Sheet>

        {/* MOBILE MEMBERS DRAWER (Server Context) */}
        <Sheet open={isMobileMembersOpen} onOpenChange={setIsMobileMembersOpen}>
          <SheetContent side="right" className={cn("p-0 bg-sidebar border-l border-sidebar-border", LAYOUT_SIZES.MEMBERS_DRAWER_WIDTH)}>
            <SheetHeader className="sr-only">
              <SheetTitle>{t('Anggota Server')}</SheetTitle>
            </SheetHeader>
            {renderMembersSidebarContent()}
          </SheetContent>
        </Sheet>

        {/* MAIN CONTENT AREA: DISCORD-STYLE FRIENDS HUB, MESSAGE REQUESTS, NOTIFICATIONS, OR CHANNEL CHAT */}
        {isFriendsView ? (
          renderFriendsMainPage()
        ) : isMessageRequestsView ? (
          <MessageRequestsView
            requests={messageRequests}
            onAccept={handleAcceptMessageRequest}
            onIgnore={handleIgnoreMessageRequest}
            onReportSpam={handleReportSpamMessageRequest}
            onOpenSidebar={() => setIsMobileChannelsOpen(true)}
            horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
          />
        ) : isNotificationsView ? (
          <NotificationsView
            notifications={notifications}
            onMarkAllAsRead={handleMarkAllNotificationsRead}
            onMarkAsRead={handleMarkNotificationRead}
            onJumpToMessage={handleJumpToNotification}
            onOpenSidebar={() => setIsMobileChannelsOpen(true)}
            horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
          />
        ) : isCalendarView ? (
          <CalendarView
            events={calendarEvents}
            hubs={hubs}
            channels={channels}
            onJoinChannel={(channelId) => {
              const targetChannel = channels.find((c) => c.id === channelId);
              if (targetChannel?.hubId) {
                setActiveHubId(targetChannel.hubId);
              }
              setActiveChannelId(channelId);
              setActiveCallChannelId(channelId);
            }}
            onOpenSidebar={() => setIsMobileChannelsOpen(true)}
            onCreateEvent={createCalendarEvent}
            horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
          />
        ) : isAssignmentsView ? (
          <AssignmentsView
            assignments={assignments}
            hubs={hubs}
            onOpenBoard={(hubId, channelId) => {
              setActiveHubId(hubId);
              setActiveChannelId(channelId);
            }}
            onToggleComplete={(assignmentId) => {
              handleToggleComplete(assignmentId);
            }}
            onOpenSidebar={() => setIsMobileChannelsOpen(true)}
            horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
          />
        ) : isCallsView ? (
          <CallsView
            calls={callLogs}
            friends={friends.allFriends}
            onStartCall={(friend) => {
              handleCreateCallLog({
                peerId: friend.id,
                peerName: friend.name,
                peerAvatar: friend.avatar || null,
                type: 'outgoing',
                isVideo: false,
              });
              handleStartDirectMessage(friend);
            }}
            onOpenSidebar={() => setIsMobileChannelsOpen(true)}
            horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
          />
        ) : isAppsView ? (
          <AppsView
            channels={channels}
            activeCallChannelId={activeCallChannelId}
            onLaunchActivity={handleLaunchActivity}
            onOpenSidebar={() => setIsMobileChannelsOpen(true)}
            horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
          />
        ) : isServersView ? (
          <ServersView
            servers={hubs}
            onSelectServer={(hubId) => {
              setActiveHubId(hubId);
              const firstCh = channels.find(
                (c) => (c.hubId || 'anticeil') === hubId && c.category === 'CHANNELS',
              );
              setActiveChannelId(firstCh?.id || '');
            }}
            onOpenCreateServer={() =>
              requireAuth(
                () => setIsCreateHubOpen(true),
                t('Buat Server Komunitas'),
                t('Masuk ke Anticeil untuk membuat server komunitas Anda sendiri.'),
              )
            }
            onOpenSidebar={() => setIsMobileChannelsOpen(true)}
            horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
          />
        ) : (
          <div className="flex flex-1 flex-col h-full min-h-0 min-w-0 bg-background overflow-hidden">
          {/* Channel Top Header Bar (Feature-First Component) */}
          {!( (activeCallChannelId === activeChannel?.id || activeChannel?.type === 'voice') && !isCallPiP ) && (
            <ChannelTopHeaderBar
              activeChannel={activeChannel}
              channelPaddingClass={CHANNEL_HORIZONTAL_PADDING}
              isHome={isHome}
              onOpenMobileChannels={() => setIsMobileChannelsOpen(true)}
              isThreadsPopoverOpen={isThreadsPopoverOpen}
              setIsThreadsPopoverOpen={setIsThreadsPopoverOpen}
              channelThreads={channelThreads}
              threadSearchQuery={threadSearchQuery}
              setThreadSearchQuery={setThreadSearchQuery}
              onOpenCreateThreadModal={() => setIsCreateThreadModalOpen(true)}
              onSelectThread={(th) => {
                setActiveThread(th as any);
                setIsThreadDrawerOpen(true);
              }}
              isNotificationDropdownOpen={isNotificationDropdownOpen}
              setIsNotificationDropdownOpen={setIsNotificationDropdownOpen}
              channelNotification={channelNotification}
              onUpdateNotification={handleUpdateNotification}
              isPinnedPopoverOpen={isPinnedPopoverOpen}
              setIsPinnedPopoverOpen={setIsPinnedPopoverOpen}
              pinnedMessages={pinnedMessages}
              onJumpToMessage={handleJumpToMessage}
              onTogglePin={handleTogglePin}
              showMemberList={showMemberList}
              setShowMemberList={setShowMemberList}
              onOpenMobileMembers={() => setIsMobileMembersOpen(true)}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              t={t}
            />
          )}

          {/* Call Stage (automatically displays when active on this channel, or when it is a voice channel, and not PiP) */}
          {(activeCallChannelId === activeChannel?.id || activeChannel?.type === 'voice') && !isCallPiP ? (
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col w-full h-full">
              <CommunityCallStage
                channel={activeChannel!}
                activeHub={activeHub}
                currentUser={currentUser}
                isPlusOrAbove={isPlusOrAbove}
                socket={socket}
                isCallActive={true}
                isPiP={false}
                initialAppId={selectedActivityAppId}
                onToggleActivity={(open) => setIsActivityOpen((prev) => (typeof open === 'boolean' ? open : !prev))}
                onTogglePiP={() => setIsCallPiP(true)}
                onEndCall={() => {
                  setActiveCallChannelId(null);
                  setSelectedActivityAppId(null);
                  setIsActivityOpen(false);
                  const defaultTextChannel = hubChannels.find((c) => c.type === 'text' || !c.type);
                  if (defaultTextChannel && activeChannel?.type === 'voice') {
                    setActiveChannelId(defaultTextChannel.id);
                  }
                }}
                onNavigateToBilling={() => navigate('/platform/billing')}
                onOpenMobileChannels={() => setIsMobileChannelsOpen(true)}
              />
            </div>
          ) : activeChannel?.type === 'forum' ? (
            <ForumChannelView
              activeChannel={activeChannel}
              activeThread={activeThread}
              setActiveThread={setActiveThread}
              channelThreadsList={threadsMap[activeChannel?.id || ''] || channelThreads || []}
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
              onCreateForumPost={handleCreateForumPost}
              threadInputText={threadInputText}
              setThreadInputText={setThreadInputText}
              onSendThreadMessage={handleSendThreadMessage}
              channelPaddingClass={CHANNEL_HORIZONTAL_PADDING}
              t={t}
            />
          ) : activeChannel?.type === 'kanban' ? (
            <KanbanChannelView
              activeChannel={activeChannel}
              activeHub={activeHub}
              displayMembers={displayMembers}
              currentUser={currentUser}
              onOpenSidebar={() => setIsMobileChannelsOpen(true)}
              horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
              onCardsUpdate={handleKanbanCardsUpdate}
            />
          ) : (
          <>
          {/* Messages Feed (Feature-First Component) */}
          <MessagesFeed
            activeChannel={activeChannel}
            channelPaddingClass={CHANNEL_HORIZONTAL_PADDING}
            filteredMessages={filteredMessages}
            currentUser={currentUser}
            claimedGifts={claimedGifts}
            setClaimedGifts={setClaimedGifts}
            onOpenCreateChannel={() => setIsCreateChannelOpen(true)}
            onToggleReaction={handleToggleReaction}
            onTogglePin={handleTogglePin}
            onStartThread={(initialName, initialContent) => {
              setNewThreadName(initialName);
              setNewThreadInitialMsg(initialContent);
              setIsCreateThreadModalOpen(true);
            }}
            onDeleteMessage={handleDeleteMessage}
            onJoinActivity={(appId, channelId) => handleLaunchActivity(appId, true, channelId)}
            messagesEndRef={messagesEndRef}
            t={t}
          />

          {/* Chat Input Bar (Feature-First Component) */}
          <ChatInputBar
            activeChannel={activeChannel}
            activeHub={activeHub}
            channelPaddingClass={CHANNEL_HORIZONTAL_PADDING}
            stagedAttachment={stagedAttachment}
            setStagedAttachment={setStagedAttachment}
            inputText={inputText}
            setInputText={setInputText}
            onSendMessage={handleSendMessage}
            onFileSelect={handleFileChange}
            onOpenGiftModal={() => setIsGiftModalOpen(true)}
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
            onSelectEmoji={handleSelectEmoji}
            onSendSticker={handleSendSticker}
            onSendGif={handleSendGif}
            onOpenQuickAddEmoji={() => setIsQuickAddEmojiOpen(true)}
            onOpenQuickAddSticker={() => setIsQuickAddStickerOpen(true)}
            isTemplatePopoverOpen={isTemplatePopoverOpen}
            setIsTemplatePopoverOpen={setIsTemplatePopoverOpen}
            appsSearchQuery={appsSearchQuery}
            setAppsSearchQuery={setAppsSearchQuery}
            onLaunchActivity={handleLaunchActivity}
            t={t}
          />
          </>
          )}
        </div>
        )}

        {/* DESKTOP MEMBERS SIDEBAR (w-60 - Hidden in Voice Channels like Discord) */}
        {showMemberList && !isFriendsView && activeChannel?.type !== 'voice' && activeCallChannelId !== activeChannel?.id && (
          <div className="hidden lg:flex shrink-0">
            {renderMembersSidebarContent()}
          </div>
        )}

        {/* Send Gift Dialog (Feature-First Component) */}
        <SendGiftDialog
          open={isGiftModalOpen}
          onOpenChange={setIsGiftModalOpen}
          onSendGift={handleSendGift}
        />

        {/* Quick Add Server Emoji Dialog (Feature-First Component) */}
        <QuickAddEmojiDialog
          open={isQuickAddEmojiOpen}
          onOpenChange={setIsQuickAddEmojiOpen}
          activeHub={activeHub}
          quickEmojiName={quickEmojiName}
          setQuickEmojiName={setQuickEmojiName}
          quickEmojiCode={quickEmojiCode}
          setQuickEmojiCode={setQuickEmojiCode}
          quickEmojiUrl={quickEmojiUrl}
          setQuickEmojiUrl={setQuickEmojiUrl}
          isSubmittingServerMedia={isSubmittingServerMedia}
          onQuickAddEmoji={handleQuickAddEmoji}
        />

        {/* Quick Add Server Sticker Dialog (Feature-First Component) */}
        <QuickAddStickerDialog
          open={isQuickAddStickerOpen}
          onOpenChange={setIsQuickAddStickerOpen}
          activeHub={activeHub}
          quickStickerName={quickStickerName}
          setQuickStickerName={setQuickStickerName}
          quickStickerUrl={quickStickerUrl}
          setQuickStickerUrl={setQuickStickerUrl}
          isSubmittingServerMedia={isSubmittingServerMedia}
          onQuickAddSticker={handleQuickAddSticker}
        />

        {/* Create or Join Server Dialog (Feature-First Component) */}
        <CreateOrJoinServerDialog
          open={isCreateHubOpen}
          onOpenChange={setIsCreateHubOpen}
          newServerName={newHubName}
          setNewServerName={setNewHubName}
          newServerDesc={newHubDesc}
          setNewServerDesc={setNewHubDesc}
          newServerIconUrl={newHubIconUrl}
          setNewServerIconUrl={setNewHubIconUrl}
          joinInviteCode={joinInviteCode}
          setJoinInviteCode={setJoinInviteCode}
          isJoiningServer={isJoiningHub}
          onCreateServerSubmit={handleCreateHubSubmit}
          onJoinServer={handleJoinHub}
          t={t}
        />

        {/* ===== SERVER SETTINGS MODAL (Feature-First Component) ===== */}
        <ServerSettingsDialog
          isOpen={isServerSettingsOpen}
          initialSection={serverSettingsSection}
          onClose={() => setIsServerSettingsOpen(false)}
          activeHub={activeHub}
          currentUser={currentUser}
          members={members}
          channels={channels}
          onUpdateHub={async (hubId, updates) => {
            if (!activeHub) return;
            const updated = { ...activeHub, ...updates };
            setHubs((prev) => {
              const next = prev.map((h) => (h.id === hubId ? updated : h));
              saveStoredHubs(next);
              return next;
            });
            try {
              await communityApi.updateHub(hubId, updates);
            } catch {}
          }}
          onDeleteHub={(hub) => setHubToDelete(hub)}
          onOpenWebhooks={() => setIsWebhookDialogOpen(true)}
          onUpdateMembers={setMembers}
        />

        {/* Edit Server Dialog (Feature-First Component) */}
        <EditServerDialog
          serverToEdit={hubToEdit}
          onClose={() => setHubToEdit(null)}
          editServerName={editHubName}
          setEditServerName={setEditHubName}
          editServerDesc={editHubDesc}
          setEditServerDesc={setEditHubDesc}
          onEditServerSubmit={handleEditHubSubmit}
          t={t}
        />

        {/* Delete Server Dialog (Feature-First Component) */}
        <DeleteServerDialog
          serverToDelete={hubToDelete}
          onClose={() => setHubToDelete(null)}
          onDeleteConfirm={handleDeleteHubConfirm}
          t={t}
        />

        {/* ===== WEBHOOK INTEGRATION DIALOG (Feature-First Component) ===== */}
        <WebhookDialog
          isOpen={isWebhookDialogOpen}
          onClose={() => setIsWebhookDialogOpen(false)}
          activeChannel={activeChannel}
          hubChannels={hubChannels}
          activeHub={activeHub}
          onSelectChannel={(chId) => setActiveChannelId(chId)}
          onCreateChannel={() => setIsCreateChannelOpen(true)}
        />

        {/* Create Channel Dialog (Feature-First Component) */}
        <CreateChannelDialog
          open={isCreateChannelOpen}
          onOpenChange={setIsCreateChannelOpen}
          activeHub={activeHub}
          newChannelCategory={newChannelCategory}
          newChannelType={newChannelType}
          setNewChannelType={setNewChannelType}
          newChannelName={newChannelName}
          setNewChannelName={setNewChannelName}
          newChannelIsPrivate={newChannelIsPrivate}
          setNewChannelIsPrivate={setNewChannelIsPrivate}
          onCreateChannelSubmit={handleCreateChannelSubmit}
          t={t}
        />

        {/* Edit Channel Dialog (Feature-First Component) */}
        <EditChannelDialog
          channelToEdit={channelToEdit}
          onClose={() => setChannelToEdit(null)}
          editChannelType={editChannelType}
          setEditChannelType={setEditChannelType}
          editChannelName={editChannelName}
          setEditChannelName={setEditChannelName}
          editChannelDesc={editChannelDesc}
          setEditChannelDesc={setEditChannelDesc}
          onEditChannelSubmit={handleEditChannelSubmit}
          t={t}
        />

        {/* Delete Channel Dialog (Feature-First Component) */}
        <DeleteChannelDialog
          channelToDelete={channelToDelete}
          onClose={() => setChannelToDelete(null)}
          onDeleteConfirm={handleDeleteChannelConfirm}
          t={t}
        />

        {/* DM Search Dialog (Feature-First Component) */}
        <DmSearchDialog
          open={isDmSearchOpen}
          onOpenChange={setIsDmSearchOpen}
          dmSearchQuery={dmSearchQuery}
          setDmSearchQuery={setDmSearchQuery}
          dmChannels={dmChannels}
          members={members}
          currentUser={currentUser}
          onSelectDmChannel={(channelId) => {
            setActiveHubId('anticeil');
            setActiveChannelId(channelId);
          }}
          onStartDM={handleStartDM}
          t={t}
        />
      </div>
    </TooltipProvider>
        {/* Server Invite Dialog (Feature-First Component) */}
        <ServerInviteDialog
          open={isInviteOpen}
          onOpenChange={setIsInviteOpen}
          activeServer={activeHub}
          onInviteUsername={async (username) => {
            const currentHubId = activeHub?.id;
            if (!currentHubId) return false;
            try {
              const res = await communityApi.inviteMemberByUsername(currentHubId, username);
              if (res.found && res.user) {
                if (res.alreadyMember) {
                  toast.info(t(`@${res.user.username || username} sudah menjadi anggota server ini.`));
                } else {
                  toast.success(t(`Berhasil menambahkan @${res.user.username || username} ke server! 🎉`));
                  setMembers((prev) => {
                    if (prev.some((m) => m.id === res.user!.id)) return prev;
                    return [...prev, res.user!];
                  });
                }
                return true;
              }
              return false;
            } catch (err) {
              toast.error(t('Gagal mengundang pengguna. Silakan coba lagi.'));
              return false;
            }
          }}
          t={t}
        />

        {/* Edit Profile & Identity Dialog (Feature-First Component) */}
        <EditProfileDialog
          open={isEditProfileOpen}
          onOpenChange={setIsEditProfileOpen}
          currentUser={currentUser}
          currentUserName={currentUserName}
          onSaveDisplayName={async (name) => {
            try {
              await updateNameMutation.mutateAsync({ firstName: name, lastName: '' });
              toast.success(t('Nama tampilan berhasil disimpan! 🎉'));
            } catch {
              toast.error(t('Gagal menyimpan nama tampilan.'));
            }
          }}
          isSavingDisplayName={updateNameMutation.isPending}
          onSaveUsername={async (username) => {
            try {
              await updateUsernameMutation.mutateAsync({ username });
              toast.success(t('Username berhasil diperbarui! 🎉'));
            } catch (err: any) {
              toast.error(err?.response?.data?.message || t('Gagal menyimpan username.'));
            }
          }}
          isSavingUsername={updateUsernameMutation.isPending}
          theme={theme}
          setTheme={setTheme}
          onGoogleSignIn={handleGoogleSignIn}
          onLogout={handleLogout}
          t={t}
        />

        {/* ===== CREATE THREAD MODAL (Feature-First Component) ===== */}
        <CreateThreadModal
          isOpen={isCreateThreadModalOpen}
          onClose={() => setIsCreateThreadModalOpen(false)}
          channelName={activeChannel?.name}
          onCreateThread={handleCreateThread}
        />

        {/* ===== THREAD DRAWER (Feature-First Component) ===== */}
        <ThreadDrawer
          isOpen={isThreadDrawerOpen}
          onClose={() => setIsThreadDrawerOpen(false)}
          activeThread={activeThread}
          threadMessages={threadMessages}
          onSendMessage={handleSendThreadMessage}
          renderFormattedMessage={renderFormattedMessage}
        />

        {/* Discord-style Channel Settings Dialog (Screenshot 5) */}
        <ChannelSettingsDialog
          channel={channelForSettings}
          isOpen={!!channelForSettings}
          onClose={() => setChannelForSettings(null)}
          onUpdateChannel={handleUpdateChannelSettings}
          onDeleteChannel={(ch) => {
            setChannelForSettings(null);
            handleOpenDeleteChannel(ch, { stopPropagation: () => {} } as any);
          }}
          onOpenWebhooks={(chId) => {
            setActiveChannelId(chId);
            setIsWebhookDialogOpen(true);
          }}
        />

        {/* Floating PiP Call Stage */}
        {activeCallChannelId && isCallPiP && (() => {
          const pipChannel = channels.find((c) => c.id === activeCallChannelId);
          if (!pipChannel) return null;
          return (
            <CommunityCallStage
              channel={pipChannel}
              activeHub={activeHub}
              currentUser={currentUser}
              isPlusOrAbove={isPlusOrAbove}
              socket={socket}
              isCallActive={true}
              isPiP={true}
              initialAppId={selectedActivityAppId}
              onToggleActivity={(open) => setIsActivityOpen((prev) => (typeof open === 'boolean' ? open : !prev))}
              onTogglePiP={() => {
                setActiveChannelId(activeCallChannelId);
                setIsCallPiP(false);
              }}
              onEndCall={() => {
                setActiveCallChannelId(null);
                setIsActivityOpen(false);
              }}
              onNavigateToBilling={() => navigate('/platform/billing')}
            />
          );
        })()}

        {/* Global Auth Required Prompt Dialog */}
        <AuthRequiredDialog
          isOpen={isAuthRequiredOpen}
          onClose={() => setIsAuthRequiredOpen(false)}
          onGoogleSignIn={handleGoogleSignIn}
          featureTitle={authFeatureInfo.title}
          featureDescription={authFeatureInfo.desc}
        />
    </LockedFeatureGuard>
  );
}
export { CommunityPage as MessagesPage };
export default CommunityPage;
