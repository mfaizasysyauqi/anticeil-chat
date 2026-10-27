import React, { useState, useEffect, useRef, useMemo } from 'react';
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
} from '@/features/servers';
import { UserBottomDock, EditProfileDialog } from '@/features/profile';
import { FriendsView, type FriendRequest, useFriendsManager } from '@/features/friends';
import { MessageRequestsView, type MessageRequestItem } from '@/features/message-requests';
import { NotificationsView, type NotificationItem } from '@/features/notifications';
import { CalendarView, type CalendarEvent } from '@/features/calendar';
import { AssignmentsView, type AssignmentItem } from '@/features/assignments';
import { CallsView, type CallLogItem } from '@/features/calls';
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
} from '@/features/channels';
import { ServerMembersSidebar } from '@/features/members';
import { ServerSettingsDialog, type ServerSettingsSection } from '@/features/server-settings';
import { WebhookDialog } from '@/features/webhooks';
import { CreateThreadModal, ThreadDrawer } from '@/features/threads';
import { SendGiftDialog } from '@/features/gifts';
import { ChatInputBar, processFileInput } from '@/features/chat-input';
import { MessagesFeed, renderFormattedMessage, useCommunitySocket } from '@/features/chat';
import { QuickAddEmojiDialog, QuickAddStickerDialog } from '@/features/media';
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

  // Server / Hub Creation & Join Modal state (ala Discord "Tambah Server")
  const [isCreateHubOpen, setIsCreateHubOpen] = useState(false);
  const [newHubName, setNewHubName] = useState('');
  const [newHubDesc, setNewHubDesc] = useState('');
  const [joinInviteCode, setJoinInviteCode] = useState('');
  const [isJoiningHub, setIsJoiningHub] = useState(false);

  // Server Edit & Delete state
  const [hubToEdit, setHubToEdit] = useState<CommunityHub | null>(null);
  const [editHubName, setEditHubName] = useState('');
  const [editHubDesc, setEditHubDesc] = useState('');
  const [hubToDelete, setHubToDelete] = useState<CommunityHub | null>(null);

  const [channels, setChannels] = useState<CommunityChannel[]>(DEFAULT_CHANNELS);
  const [activeChannelId, setActiveChannelId] = useState<string>(() => {
    return new URLSearchParams(window.location.search).get('channel') || '';
  });
  const [messagesMap, setMessagesMap] = useState<Record<string, CommunityMessage[]>>({});
  const [members, setMembers] = useState<CommunityMember[]>([]);

  // Home View Mode: Friends Hub vs Servers vs Message Requests vs Notifications vs Calendar vs Assignments vs Calls vs Apps
  const [homeView, setHomeView] = useState<'friends' | 'servers' | 'message-requests' | 'notifications' | 'calendar' | 'assignments' | 'calls' | 'apps'>('friends');

  // Calendar Events State
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem('anticeil_calendar_events');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'cal-1',
        title: 'Weekly Standup & Design Sync',
        description: 'Review progres fitur Anticeil Chat, voice stage, dan persiapan rilis v2.0.',
        type: 'meeting',
        startTime: dayjs().hour(14).minute(0).second(0).toISOString(),
        endTime: dayjs().hour(15).minute(0).second(0).toISOString(),
        hubId: 'anticeil',
        hubName: 'Anticeil Official',
        channelId: 'voice-general',
        channelName: 'General Voice',
        status: 'scheduled',
        attendees: [{ id: 'u1', name: 'Anticeil Official' }],
      },
      {
        id: 'cal-2',
        title: 'Sprint Review & Demo Watch Together',
        description: 'Live test sinkronisasi YouTube Watch Together dan WebRTC Call.',
        type: 'meeting',
        startTime: dayjs().add(1, 'day').hour(16).minute(30).second(0).toISOString(),
        endTime: dayjs().add(1, 'day').hour(17).minute(30).second(0).toISOString(),
        hubId: 'anticeil',
        hubName: 'Anticeil Official',
        channelId: 'voice-gaming',
        channelName: 'Gaming & Chill',
        status: 'scheduled',
        attendees: [{ id: 'u1', name: 'Anticeil Official' }],
      },
      {
        id: 'cal-3',
        title: 'Deadline: Integrasi Kanban & Assignments',
        description: 'Selesaikan pengerjaan papan kanban dan agregasi kartu tugas personal.',
        type: 'task',
        startTime: dayjs().add(2, 'day').hour(23).minute(59).second(0).toISOString(),
        hubId: 'anticeil',
        hubName: 'Anticeil Official',
        channelName: 'tugas-tim',
        status: 'scheduled',
      },
    ];
  });

  // Assignments / Personal Tasks State
  const [assignments, setAssignments] = useState<AssignmentItem[]>(() => {
    try {
      const saved = localStorage.getItem('anticeil_assignments');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'assign-1',
        title: 'Implementasi Papan Kanban & Sinkronisasi Realtime',
        description: 'Buat papan kerja model Trello / Microsoft Plan untuk pembagian tugas tim.',
        columnId: 'in_progress',
        channelId: 'kanban-dev',
        channelName: 'tugas-tim',
        hubId: 'anticeil',
        hubName: 'Anticeil Official',
        priority: 'urgent',
        dueDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
        tags: ['Kanban', 'Feature'],
        createdAt: dayjs().toISOString(),
      },
      {
        id: 'assign-2',
        title: 'Integrasikan Jadwal Meeting ke Kalender Personal',
        description: 'Tampilkan agenda meeting mingguan dan bulanan dengan tombol 1-klik gabung call.',
        columnId: 'todo',
        channelId: 'kanban-dev',
        channelName: 'tugas-tim',
        hubId: 'anticeil',
        hubName: 'Anticeil Official',
        priority: 'high',
        dueDate: dayjs().add(3, 'day').format('YYYY-MM-DD'),
        tags: ['Calendar', 'Teams'],
        createdAt: dayjs().toISOString(),
      },
      {
        id: 'assign-3',
        title: 'Uji Sinkronisasi Pause YouTube Watch Together',
        description: 'Pastikan member lain langsung ikut ter-pause saat host menekan tombol pause.',
        columnId: 'done',
        channelId: 'kanban-dev',
        channelName: 'tugas-tim',
        hubId: 'anticeil',
        hubName: 'Anticeil Official',
        priority: 'medium',
        dueDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
        tags: ['QA', 'Resolved'],
        createdAt: dayjs().toISOString(),
        completedAt: dayjs().toISOString(),
      },
    ];
  });

  // Call Logs State
  const [callLogs, setCallLogs] = useState<CallLogItem[]>(() => {
    try {
      const saved = localStorage.getItem('anticeil_call_logs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'call-1',
        peerId: 'peer-1',
        peerName: 'Muhammad Farhan',
        peerAvatar: null,
        type: 'incoming',
        isVideo: true,
        timestamp: dayjs().subtract(2, 'hour').toISOString(),
        duration: '14m 32s',
      },
      {
        id: 'call-2',
        peerId: 'peer-2',
        peerName: 'Anticeil Official',
        peerAvatar: null,
        type: 'missed',
        isVideo: false,
        timestamp: dayjs().subtract(1, 'day').toISOString(),
      },
      {
        id: 'call-3',
        peerId: 'peer-1',
        peerName: 'Muhammad Farhan',
        peerAvatar: null,
        type: 'outgoing',
        isVideo: false,
        timestamp: dayjs().subtract(2, 'day').toISOString(),
        duration: '45m 10s',
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('anticeil_calendar_events', JSON.stringify(calendarEvents));
    } catch {}
  }, [calendarEvents]);

  useEffect(() => {
    try {
      localStorage.setItem('anticeil_assignments', JSON.stringify(assignments));
    } catch {}
  }, [assignments]);

  useEffect(() => {
    try {
      localStorage.setItem('anticeil_call_logs', JSON.stringify(callLogs));
    } catch {}
  }, [callLogs]);

  // Discord-style Message Requests (matching user screenshot)
  const [messageRequests, setMessageRequests] = useState<MessageRequestItem[]>(() => {
    const saved = localStorage.getItem('anticeil_message_requests');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [
      {
        id: 'mr-1',
        userId: 'user-gwiyo',
        name: '귀요미규짱',
        username: 'gwiyomigyujjang',
        avatar: null,
        date: 'February 23, 2023',
        mutualServers: 0,
        isSpam: false,
        initialMessage: 'Halo! Salam kenal ya kak 👋',
      },
      {
        id: 'mr-2',
        userId: 'user-silence',
        name: 'Silence',
        username: 'silence03330',
        avatar: null,
        date: 'February 19, 2023',
        mutualServers: 1,
        isSpam: false,
        initialMessage: 'Kak mau tanya tentang channel voice kemarin dong',
      },
      {
        id: 'mr-3',
        userId: 'user-d4nni',
        name: '꧁D4nni꧂',
        username: 'd4nni7199',
        avatar: null,
        date: 'February 11, 2023',
        mutualServers: 0,
        isSpam: false,
        initialMessage: 'Boleh mabar game nanti malam?',
      },
      {
        id: 'mr-4',
        userId: 'user-kevkirk',
        name: 'KevKirk',
        username: 'kevkirk',
        avatar: null,
        date: 'February 3, 2023',
        mutualServers: 0,
        isSpam: false,
        initialMessage: 'Hey, are you active in Anticeil?',
      },
      // Spam requests
      {
        id: 'mr-spam-1',
        userId: 'spam-bf423',
        name: 'deleted_user_bf423af095f2',
        username: 'deleted_user',
        avatar: null,
        date: 'August 10, 2023',
        mutualServers: 0,
        isSpam: true,
        initialMessage: 'Free nitro gift click link below: http://...',
      },
      {
        id: 'mr-spam-2',
        userId: 'spam-f3098',
        name: 'deleted_user_f3098e5bfff4',
        username: 'deleted_user',
        avatar: null,
        date: 'May 31, 2023',
        mutualServers: 0,
        isSpam: true,
        initialMessage: 'Join crypto server earn 500$ daily now!!',
      },
      {
        id: 'mr-spam-3',
        userId: 'spam-fireboy',
        name: 'fireboy',
        username: 'fireboy6114',
        avatar: null,
        date: 'February 12, 2023',
        mutualServers: 0,
        isSpam: true,
        initialMessage: 'Check out this suspicious link right now',
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('anticeil_message_requests', JSON.stringify(messageRequests));
    } catch {}
  }, [messageRequests]);

  // Notifications state (Feed ala MS Teams / Discord Inbox)
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('anticeil_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [
      {
        id: 'notif-1',
        actorId: 'usr-daffa',
        actorName: 'Daffa, znafian',
        type: 'mention',
        title: 'menandai Anda di pesan baru',
        summary: '@you jangan lupa coba fitur Watch Together realtime barusan ya!',
        channelId: 'general',
        channelName: 'general',
        createdAt: '5 mnt lalu',
        isRead: false,
      },
      {
        id: 'notif-2',
        actorId: 'usr-pengebom',
        actorName: 'Pengebom',
        type: 'activity',
        title: 'meluncurkan aktivitas baru',
        summary: 'Aktivitas Watch Together (YouTube) telah dimulai. Klik untuk bergabung!',
        channelId: 'general',
        channelName: 'general',
        createdAt: '20 mnt lalu',
        isRead: false,
      },
      {
        id: 'notif-3',
        actorId: 'usr-silence',
        actorName: 'Silence',
        type: 'reply',
        title: 'membalas thread Anda',
        summary: 'Thread "Fitur baru": Saya sudah coba di perangkat mobile dan responsive banget.',
        channelId: 'general',
        channelName: 'general',
        createdAt: '1 jam lalu',
        isRead: true,
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('anticeil_notifications', JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

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

  // Discord Media Picker (GIFs, Stickers, Emoji) - matching Screenshots 1, 2, 3
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState<'gifs' | 'stickers' | 'emojis'>('emojis');
  const [mediaSearchQuery, setMediaSearchQuery] = useState('');
  const [hoveredEmoji, setHoveredEmoji] = useState<DiscordEmoji | null>(null);
  const [hoveredSticker, setHoveredSticker] = useState<DiscordSticker | null>(null);
  const [selectedGifCategory, setSelectedGifCategory] = useState<string | null>(null);
  const [selectedServerFilter, setSelectedServerFilter] = useState<string>('all');
  const [serverDbEmojis, setServerDbEmojis] = useState<DiscordEmoji[]>([]);
  const [serverDbStickers, setServerDbStickers] = useState<DiscordSticker[]>([]);
  const [isLoadingServerMedia, setIsLoadingServerMedia] = useState(false);
  const [isQuickAddEmojiOpen, setIsQuickAddEmojiOpen] = useState(false);
  const [quickEmojiName, setQuickEmojiName] = useState('');
  const [quickEmojiUrl, setQuickEmojiUrl] = useState('');
  const [quickEmojiCode, setQuickEmojiCode] = useState('');
  const [isQuickAddStickerOpen, setIsQuickAddStickerOpen] = useState(false);
  const [quickStickerName, setQuickStickerName] = useState('');
  const [quickStickerUrl, setQuickStickerUrl] = useState('');
  const [isSubmittingServerMedia, setIsSubmittingServerMedia] = useState(false);

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

  // Channel CRUD Modals
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelCategory, setNewChannelCategory] = useState<'CHANNELS' | 'DIRECT MESSAGES'>('CHANNELS');
  const [newChannelType, setNewChannelType] = useState<CommunityChannelType>('text');
  const [newChannelIsPrivate, setNewChannelIsPrivate] = useState(false);

  const [channelToEdit, setChannelToEdit] = useState<CommunityChannel | null>(null);
  const [editChannelName, setEditChannelName] = useState('');
  const [editChannelDesc, setEditChannelDesc] = useState('');
  const [editChannelType, setEditChannelType] = useState<CommunityChannelType>('text');

  const [channelToDelete, setChannelToDelete] = useState<CommunityChannel | null>(null);

  // Discord-style Resizable Sidebar hook
  const {
    sidebarWidth,
    isResizingSidebar,
    handleSidebarResizeStart,
    handleSidebarResizeReset,
  } = useResizableSidebar();
  const [channelForSettings, setChannelForSettings] = useState<CommunityChannel | null>(null);

  // Responsive state for Mobile/Tablet sheets
  const [isMobileChannelsOpen, setIsMobileChannelsOpen] = useState(false);
  const [isMobileMembersOpen, setIsMobileMembersOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [isInvitingUsername, setIsInvitingUsername] = useState(false);
  const [userNotFound, setUserNotFound] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Edit Profile dialog state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // DM Search Dialog (Discord-style "Find or start a conversation")
  const [isDmSearchOpen, setIsDmSearchOpen] = useState(false);
  const [dmSearchQuery, setDmSearchQuery] = useState('');

  // Webhook Integration Dialog (Discord-style incoming webhooks & IDs)
  const [isWebhookDialogOpen, setIsWebhookDialogOpen] = useState<boolean>(false);
  const [isServerSettingsOpen, setIsServerSettingsOpen] = useState(false);
  const [serverSettingsSection, setServerSettingsSection] = useState<ServerSettingsSection>('profile');
  const serverIconQuickInputRef = useRef<HTMLInputElement | null>(null);
  const newHubIconFileInputRef = useRef<HTMLInputElement | null>(null);
  const [newHubIconUrl, setNewHubIconUrl] = useState('');

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

  // Load Server Emojis and Stickers from DB for active server
  useEffect(() => {
    if (!activeHub?.id) {
      setServerDbEmojis([]);
      setServerDbStickers([]);
      return;
    }
    let mounted = true;
    const loadServerMedia = async () => {
      try {
        setIsLoadingServerMedia(true);
        const [emojis, stickers] = await Promise.all([
          communityApi.getServerEmojis(activeHub.id),
          communityApi.getServerStickers(activeHub.id),
        ]);
        if (mounted) {
          setServerDbEmojis(emojis || []);
          setServerDbStickers(stickers || []);
        }
      } catch (err) {
        console.warn('Failed to load server emojis/stickers', activeHub.id, err);
      } finally {
        if (mounted) setIsLoadingServerMedia(false);
      }
    };
    loadServerMedia();
    return () => {
      mounted = false;
    };
  }, [activeHub?.id, isMediaPickerOpen]);

  const handleQuickAddEmoji = async () => {
    if (!activeHub?.id || !quickEmojiName.trim() || !quickEmojiUrl.trim()) return;
    try {
      setIsSubmittingServerMedia(true);
      const code = quickEmojiCode.trim() || `:${quickEmojiName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')}:`;
      const created = await communityApi.addServerEmoji(activeHub.id, {
        name: quickEmojiName.trim(),
        code,
        url: quickEmojiUrl.trim(),
      });
      if (created) {
        setServerDbEmojis((prev) => [...prev, created]);
        toast.success(`Emoji ${code} berhasil disimpan ke database server! ✨`);
        setQuickEmojiName('');
        setQuickEmojiUrl('');
        setQuickEmojiCode('');
        setIsQuickAddEmojiOpen(false);
      }
    } catch (err) {
      toast.error('Gagal menambahkan emoji server');
    } finally {
      setIsSubmittingServerMedia(false);
    }
  };

  const handleQuickAddSticker = async () => {
    if (!activeHub?.id || !quickStickerName.trim() || !quickStickerUrl.trim()) return;
    try {
      setIsSubmittingServerMedia(true);
      const created = await communityApi.addServerSticker(activeHub.id, {
        name: quickStickerName.trim(),
        url: quickStickerUrl.trim(),
      });
      if (created) {
        setServerDbStickers((prev) => [...prev, created]);
        toast.success(`Stiker ${quickStickerName} berhasil disimpan ke database server! 🏷️`);
        setQuickStickerName('');
        setQuickStickerUrl('');
        setIsQuickAddStickerOpen(false);
      }
    } catch (err) {
      toast.error('Gagal menambahkan stiker server');
    } finally {
      setIsSubmittingServerMedia(false);
    }
  };

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

    // If joining from chat invite, find the exact channel where the activity/call was launched
    let destChannel = activeChannel;
    if (fromChatInvite) {
      if (targetChannelId) {
        const found = channels.find((c) => c.id === targetChannelId);
        if (found) destChannel = found;
      }
      // If still not a voice channel, check if there's an active voice channel in the hub
      if (destChannel?.type !== 'voice') {
        const activeVoice = hubChannels.find((c) => c.type === 'voice' && (activeCallCounts[c.id] || 0) > 0);
        if (activeVoice) destChannel = activeVoice;
      }
    } else if (activeChannel?.type !== 'voice') {
      // If launching from text channel, prefer existing active voice channel if one is in call
      const activeVoice = hubChannels.find((c) => c.type === 'voice' && (activeCallCounts[c.id] || 0) > 0);
      if (activeVoice) destChannel = activeVoice;
    }

    if (destChannel) {
      setActiveChannelId(destChannel.id);
      setActiveCallChannelId(destChannel.id);
      setIsCallPiP(false);
      setIsActivityOpen(true);
      socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
        channelId: destChannel.id,
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
      if (!fromChatInvite && activeChannel && activeChannel.type !== 'voice') {
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
                channelId: destChannel.id,
                channelName: destChannel.name,
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

  // Join Server via Invite Code/Link
  const handleJoinHub = async (codeToJoin?: string) => {
    const rawCode = (codeToJoin || joinInviteCode).trim();
    if (!rawCode) {
      toast.error(t('Masukkan kode atau link undangan yang valid.'));
      return;
    }

    let code = rawCode;
    if (rawCode.includes('invite=')) {
      code = rawCode.split('invite=')[1].split('&')[0];
    } else if (rawCode.includes('/')) {
      code = rawCode.split('/').pop() || rawCode;
    }

    try {
      setIsJoiningHub(true);
      const joinedHub = await communityApi.joinHub(code);
      setHubs((prev) => {
        const next = [...prev.filter((h) => h.id !== joinedHub.id), joinedHub];
        saveStoredHubs(next);
        return next;
      });
      setActiveHubId(joinedHub.id);

      // fetch channels for joined server
      const hubChannels = await communityApi.getChannels(joinedHub.id);
      if (hubChannels && hubChannels.length > 0) {
        setChannels((prev) => [...prev.filter((c) => c.hubId !== joinedHub.id), ...hubChannels]);
        const targetChannelParam = new URLSearchParams(window.location.search).get('channel');
        const matchedChannel = hubChannels.find((c) => c.id === targetChannelParam);
        if (matchedChannel) {
          setActiveChannelId(matchedChannel.id);
          if (matchedChannel.type === 'voice') {
            setActiveCallChannelId(matchedChannel.id);
            setIsCallPiP(false);
          }
        } else {
          setActiveChannelId(hubChannels[0].id);
        }
      }

      setIsCreateHubOpen(false);
      setJoinInviteCode('');
      toast.success(t(`Berhasil bergabung ke server ${joinedHub.name}! 🎉`));

      // Clear ?invite= from URL so page reloads don't re-trigger auto-join, while preserving hub & channel
      const url = new URL(window.location.href);
      if (url.searchParams.has('invite')) {
        url.searchParams.delete('invite');
        if (!url.searchParams.has('hub')) {
          url.searchParams.set('hub', joinedHub.id);
        }
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
      }
    } catch {
      toast.error(t('Kode undangan tidak valid atau server tidak ditemukan.'));
    } finally {
      setIsJoiningHub(false);
    }
  };

  // Invite by Username
  const handleInviteByUsername = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rawUser = inviteUsername.trim().replace(/^@/, '');
    if (!rawUser) {
      toast.error(t('Masukkan username yang ingin diundang'));
      return;
    }

    const currentHubId = activeHub?.id;
    if (!currentHubId) {
      toast.error(t('Server tidak valid.'));
      return;
    }

    try {
      setIsInvitingUsername(true);
      setUserNotFound(null);
      const res = await communityApi.inviteMemberByUsername(currentHubId, rawUser);
      if (res.found && res.user) {
        if (res.alreadyMember) {
          toast.info(t(`@${res.user.username || rawUser} sudah menjadi anggota server ini.`));
        } else {
          toast.success(t(`Berhasil menambahkan @${res.user.username || rawUser} ke server! 🎉`));
          setMembers((prev) => {
            if (prev.some((m) => m.id === res.user!.id)) return prev;
            return [...prev, res.user!];
          });
        }
        setInviteUsername('');
        setUserNotFound(null);
      } else {
        setUserNotFound(rawUser);
      }
    } catch (err) {
      console.error('Invite by username failed', err);
      toast.error(t('Gagal mengundang pengguna. Silakan coba lagi.'));
    } finally {
      setIsInvitingUsername(false);
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

  // Create Server / Hub (Discord style Server CRUD)
  const handleCreateHubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHubName.trim()) return;

    try {
      const createdHub = await communityApi.createHub({
        name: newHubName.trim(),
        description: newHubDesc.trim() || undefined,
        iconUrl: newHubIconUrl || undefined,
      });

      const updatedHubs = [...hubs.filter((h) => h.id !== createdHub.id), createdHub];
      setHubs(updatedHubs);
      saveStoredHubs(updatedHubs);
      setActiveHubId(createdHub.id);

      let hubChannels = await communityApi.getChannels(createdHub.id);
      if (!hubChannels || hubChannels.length === 0) {
        const [defaultCh, defaultVoice, defaultForum] = await Promise.all([
          communityApi.createChannel({
            name: 'general',
            description: `Saluran obrolan umum untuk server ${createdHub.name}`,
            category: 'CHANNELS',
            hubId: createdHub.id,
            type: 'text',
          }),
          communityApi.createChannel({
            name: 'General Voice',
            description: `Saluran suara & video untuk server ${createdHub.name}`,
            category: 'CHANNELS',
            hubId: createdHub.id,
            type: 'voice',
          }),
          communityApi.createChannel({
            name: 'forum-diskusi',
            description: `Ruang diskusi topik untuk server ${createdHub.name}`,
            category: 'CHANNELS',
            hubId: createdHub.id,
            type: 'forum',
          }),
        ]);
        hubChannels = [defaultCh, defaultVoice, defaultForum];
      }
      setChannels((prev) => [...prev.filter((c) => c.hubId !== createdHub.id), ...hubChannels]);
      setActiveChannelId(hubChannels[0].id);

      setIsCreateHubOpen(false);
      setNewHubName('');
      setNewHubDesc('');
      setNewHubIconUrl('');
      toast.success(t('Server baru berhasil dibuat!'));
    } catch (err) {
      console.warn('API createHub fallback', err);
      const newId = `hub_${Date.now()}`;
      const newHub: CommunityHub = {
        id: newId,
        name: newHubName.trim(),
        iconType: undefined as any,
        initials: newHubName.trim().slice(0, 2).toUpperCase() || 'SV',
        description: newHubDesc.trim() || '',
        iconUrl: newHubIconUrl || undefined,
      };

      const defaultText: CommunityChannel = {
        id: `ch_${Date.now()}_gen`,
        name: 'general',
        description: `Saluran obrolan umum untuk server ${newHub.name}`,
        category: 'CHANNELS',
        hubId: newId,
        type: 'text',
      };
      const defaultVoice: CommunityChannel = {
        id: `ch_${Date.now()}_voice`,
        name: 'General Voice',
        description: `Saluran suara & video untuk server ${newHub.name}`,
        category: 'CHANNELS',
        hubId: newId,
        type: 'voice',
      };
      const defaultForum: CommunityChannel = {
        id: `ch_${Date.now()}_forum`,
        name: 'forum-diskusi',
        description: `Ruang diskusi topik untuk server ${newHub.name}`,
        category: 'CHANNELS',
        hubId: newId,
        type: 'forum',
      };

      const updatedHubs = [...hubs, newHub];
      setHubs(updatedHubs);
      saveStoredHubs(updatedHubs);
      setChannels((prev) => [...prev, defaultText, defaultVoice, defaultForum]);
      setActiveHubId(newId);
      setActiveChannelId(defaultText.id);

      setIsCreateHubOpen(false);
      setNewHubName('');
      setNewHubDesc('');
      setNewHubIconUrl('');
      toast.success(t('Server baru berhasil dibuat!'));
    }
  };

  // Edit / Rename Server (Hub CRUD: Update)
  const handleOpenEditHub = (hub: CommunityHub) => {
    setHubToEdit(hub);
    setEditHubName(hub.name);
    setEditHubDesc(hub.description || '');
  };

  const handleEditHubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hubToEdit || !editHubName.trim()) return;

    const newName = editHubName.trim();
    try {
      const updated = await communityApi.updateHub(hubToEdit.id, {
        name: newName,
        description: editHubDesc.trim() || undefined,
      });
      const updatedHubs = hubs.map((h) => (h.id === updated.id ? { ...h, ...updated } : h));
      setHubs(updatedHubs);
      saveStoredHubs(updatedHubs);
      setHubToEdit(null);
      toast.success(t('Nama server berhasil diperbarui!'));
    } catch {
      const updatedHubs: CommunityHub[] = hubs.map((h) => {
        if (h.id === hubToEdit.id) {
          return {
            ...h,
            name: newName,
            initials: newName.slice(0, 2).toUpperCase() || 'SV',
            description: editHubDesc.trim() || undefined,
          };
        }
        return h;
      });

      setHubs(updatedHubs);
      saveStoredHubs(updatedHubs);
      setHubToEdit(null);
      toast.success(t('Nama server berhasil diperbarui!'));
    }
  };

  // Delete Server (Hub CRUD: Delete)
  const handleDeleteHubConfirm = async () => {
    if (!hubToDelete) return;
    if (hubToDelete.id === 'anticeil') {
      toast.error(t('Server default tidak dapat dihapus.'));
      setHubToDelete(null);
      return;
    }

    try {
      await communityApi.deleteHub(hubToDelete.id);
    } catch (err) {
      console.warn('API deleteHub error', err);
    }

    const updatedHubs = hubs.filter((h) => h.id !== hubToDelete.id);
    setHubs(updatedHubs);
    saveStoredHubs(updatedHubs);

    // Filter out channels that belonged to this deleted hub
    setChannels((prev) => prev.filter((c) => c.hubId !== hubToDelete.id));

    // Switch active hub to default 'anticeil'
    setActiveHubId('anticeil');

    // Home hub = DMs, switch to first DM
    const firstDm = channels.find((c) => c.category === 'DIRECT MESSAGES');
    setActiveChannelId(firstDm?.id || '');

    setHubToDelete(null);
    toast.success(t('Server berhasil dihapus!'));
  };

  // Create Channel (Channel CRUD)
  const handleCreateChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    const formattedName =
      newChannelType === 'voice'
        ? newChannelName.trim()
        : newChannelName.trim().toLowerCase().replace(/\s+/g, '-');

    try {
      const created = await communityApi.createChannel({
        name: formattedName,
        description: newChannelDesc.trim(),
        category: newChannelCategory,
        hubId: activeHubId === 'direct-messages' ? 'anticeil' : activeHubId,
        type: newChannelType,
        isPrivate: newChannelIsPrivate,
      });

      setChannels((prev) => {
        if (prev.some((c) => c.id === created.id)) return prev;
        return [...prev, created];
      });
      setActiveChannelId(created.id);
      setIsCreateChannelOpen(false);
      setNewChannelName('');
      setNewChannelDesc('');
      setNewChannelType('text');
      setNewChannelIsPrivate(false);
      toast.success(t(`Channel ${created.name} berhasil dibuat!`));
    } catch (err) {
      console.error('Failed to create channel', err);
    }
  };

  // Edit Channel (Channel Settings Dialog)
  const handleOpenEditChannel = (channel: CommunityChannel, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setChannelForSettings(channel);
  };

  const handleUpdateChannelSettings = async (channelId: string, updates: Partial<CommunityChannel>) => {
    try {
      const updated = await communityApi.updateChannel(channelId, {
        name: updates.name,
        description: updates.description,
        type: updates.type,
        slowmode: updates.slowmode,
        contentVisibility: updates.contentVisibility,
      });
      setChannels((prev) =>
        prev.map((c) => (c.id === channelId ? { ...c, ...updated, ...updates } : c)),
      );
      toast.success(t('Pengaturan channel berhasil disimpan!'));
    } catch (err) {
      console.error('Failed to update channel settings', err);
      toast.error(t('Gagal menyimpan perubahan channel'));
      throw err;
    }
  };

  const handleEditChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelToEdit || !editChannelName.trim()) return;

    try {
      const updated = await communityApi.updateChannel(channelToEdit.id, {
        name: editChannelName.trim(),
        description: editChannelDesc.trim(),
        type: editChannelType,
      });
      setChannels((prev) =>
        prev.map((c) => (c.id === channelToEdit.id ? { ...c, ...updated, type: editChannelType } : c)),
      );
      setChannelToEdit(null);
      toast.success(t('Channel berhasil diperbarui!'));
    } catch (err) {
      console.error('Failed to edit channel', err);
    }
  };

  // Delete Channel (Channel CRUD)
  const handleOpenDeleteChannel = (channel: CommunityChannel, e: React.MouseEvent) => {
    e.stopPropagation();
    setChannelToDelete(channel);
  };

  const handleDeleteChannelConfirm = async () => {
    if (!channelToDelete) return;
    const id = channelToDelete.id;
    setChannels((prev) => prev.filter((c) => c.id !== id));
    if (activeChannelId === id) {
      setActiveChannelId('');
    }
    setChannelToDelete(null);

    try {
      await communityApi.deleteChannel(id);
    } catch (err) {
      console.error('Failed to delete channel', err);
    }
  };

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

  // Message Requests Handlers
  const handleAcceptMessageRequest = (item: MessageRequestItem) => {
    setMessageRequests((prev) => prev.filter((r) => r.id !== item.id));
    handleStartDM({
      id: item.userId,
      name: item.name,
      username: item.username,
      avatar: item.avatar,
    } as any);
    toast.success(t(`Permintaan pesan dari ${item.name} diterima! Membuka obrolan.`));
  };

  const handleIgnoreMessageRequest = (item: MessageRequestItem) => {
    setMessageRequests((prev) => prev.filter((r) => r.id !== item.id));
    toast.info(t(`Permintaan pesan dari ${item.name} diabaikan.`));
  };

  const handleReportSpamMessageRequest = (item: MessageRequestItem) => {
    setMessageRequests((prev) => prev.filter((r) => r.id !== item.id));
    toast.success(t(`Pesan dari ${item.name} dilaporkan sebagai spam.`));
  };

  // Notifications Handlers
  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success(t('Semua notifikasi ditandai sudah dibaca'));
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
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
    setActiveHubId('anticeil');
    setActiveChannelId(`dm-${member.id}`);
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
            onCreateEvent={(newEvent) => {
              const created: CalendarEvent = {
                ...newEvent,
                id: `cal-ev-${Date.now()}`,
              };
              setCalendarEvents((prev) => [created, ...prev]);
              toast.success('Jadwal meeting berhasil ditambahkan!');
            }}
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
            onToggleComplete={(assignmentId, isCompleted) => {
              setAssignments((prev) =>
                prev.map((a) =>
                  a.id === assignmentId
                    ? { ...a, columnId: isCompleted ? 'done' : 'in_progress', completedAt: isCompleted ? dayjs().toISOString() : undefined }
                    : a
                )
              );
            }}
            onOpenSidebar={() => setIsMobileChannelsOpen(true)}
            horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
          />
        ) : isCallsView ? (
          <CallsView
            calls={callLogs}
            friends={friends.allFriends}
            onStartCall={(friend) => {
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
              onCardsUpdate={(cards) => {
                setAssignments((prev) => {
                  const otherCards = prev.filter((c) => c.channelId !== activeChannel.id);
                  return [...cards, ...otherCards];
                });
              }}
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
