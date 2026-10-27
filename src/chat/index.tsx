import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Hash,
  MessageSquare,
  Users,
  Search,
  Plus,
  Send,
  Sparkles,
  Layers,
  ChevronDown,
  ExternalLink,
  Shield,
  Crown,
  Paperclip,
  X,
  Trash2,
  Edit2,
  Compass,
  Bot,
  Terminal,
  Settings,
  Mic,
  MicOff,
  Headphones,
  Smile,
  Check,
  Share2,
  UserPlus,
  Copy,
  AlertCircle,
  Clock,
  AtSign,
  UserCheck,
  UserX,
  Inbox,
  Webhook,
  Bell,
  Pin,
  Lock,
  KeyRound,
  Zap,
  ChevronRight,
  Globe,
  BarChart3,
  ScrollText,
  Ban,
  Tag,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  Activity,
  Award,
  Flame,
  ShieldAlert,
  Video,
  PhoneCall,
  PhoneOff,
  Radio,
  Signal,
  Rocket,
  Maximize2,
  Minimize2,
  Camera,
  Upload,
  Gift,
  Volume2,
  MessagesSquare,
  TrendingUp,
  ArrowLeft,
  Menu,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { useTranslation } from '@/core/i18n';
import { useTheme } from '@/core/theme';
import { useResponsive, LAYOUT_SIZES, BREAKPOINTS } from '@/core';
import { HubRail, HubInviteDialog, CreateOrJoinHubDialog, EditHubDialog, DeleteHubDialog } from '@/features/hubs';
import { UserBottomDock, EditProfileDialog } from '@/features/profile';
import { FriendsView, type FriendRequest } from '@/features/friends';
import {
  ChannelSettingsDialog,
  PinnedMessagesPopover,
  CreateChannelDialog,
  EditChannelDialog,
  DeleteChannelDialog,
  DmSearchDialog,
  ChannelTopHeaderBar,
} from '@/features/channels';
import { ServerMembersSidebar } from '@/features/members';
import { ServerSettingsDialog, type ServerSettingsSection } from '@/features/server-settings';
import { WebhookDialog } from '@/features/webhooks';
import { CreateThreadModal, ThreadDrawer } from '@/features/threads';
import { SendGiftDialog } from '@/features/gifts';
import { ChatInputBar } from '@/features/chat-input';
import { QuickAddEmojiDialog, QuickAddStickerDialog } from '@/features/media';

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
} from './discord-media-data';
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

import { messagesApi, communityApi } from './messages-api';
import { CommunityAvatar } from './messages-avatar';
import {
  DEFAULT_CHANNELS,
  DEFAULT_HUBS,
  loadStoredHubs,
  saveStoredHubs,
} from './messages-data';
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
} from './messages-types';

// Preset realistic templates for sharing
const SHAREABLE_TEMPLATES = [
  {
    name: 'AI Lead Qualification & WhatsApp Follow-Up',
    description: 'Trigger Google Sheets -> AI Agent filtering -> WhatsApp Notification otomatis dalam 5 detik.',
    pieceCount: 4,
    price: 'Free',
    tags: ['Google Sheets', 'WhatsApp', 'OpenAI'],
  },
  {
    name: 'Enterprise Invoice OCR & Midtrans Sync',
    description: 'Otomatis ekstrak PDF tagihan via OCR dan rekonsiliasi status pembayaran Midtrans ke ERP.',
    pieceCount: 6,
    price: 'Free',
    tags: ['OCR', 'Midtrans', 'Gmail'],
  },
  {
    name: 'Social Media Multi-Platform Auto Publisher',
    description: 'Satu draft content otomatis publish serentak ke Instagram, Telegram Channel, dan LinkedIn.',
    pieceCount: 5,
    price: 'Free',
    tags: ['Groq AI', 'Telegram', 'Twitter'],
  },
];

// Rich message parser (supports **bold**, `code`, @mentions, and links)
function renderFormattedMessage(content: string) {
  if (!content) return null;
  const lines = content.split('\n');

  return lines.map((line, lineIdx) => {
    const tokens: React.ReactNode[] = [];
    const regex = /(\*\*.*?\*\*|`.*?`|@[\w\.-]+|https?:\/\/[^\s]+)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        tokens.push(line.substring(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
        tokens.push(
          <strong key={`${lineIdx}-${match.index}`} className="font-semibold text-foreground">
            {token.slice(2, -2)}
          </strong>,
        );
      } else if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
        tokens.push(
          <code
            key={`${lineIdx}-${match.index}`}
            className="px-1.5 py-0.5 rounded bg-muted/80 font-mono text-[11px] text-primary border border-border/40 inline-block align-baseline"
          >
            {token.slice(1, -1)}
          </code>,
        );
      } else if (token.startsWith('@')) {
        tokens.push(
          <span
            key={`${lineIdx}-${match.index}`}
            className="px-1.5 py-0.5 rounded-sm bg-primary/15 text-primary font-medium hover:underline cursor-pointer inline-block"
          >
            {token}
          </span>,
        );
      } else if (token.startsWith('http')) {
        tokens.push(
          <a
            key={`${lineIdx}-${match.index}`}
            href={token}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-2 hover:opacity-80"
          >
            {token}
          </a>,
        );
      } else {
        tokens.push(token);
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < line.length) {
      tokens.push(line.substring(lastIndex));
    }

    return (
      <React.Fragment key={lineIdx}>
        {tokens}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

export function CommunityPage() {
  const { t } = useTranslation();
  const { theme, setTheme, toggleTheme } = useTheme();
  const { isMobile, isTablet, isDesktop, deviceMode } = useResponsive();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('ap_token');
    localStorage.removeItem('anticeil_current_user');
    localStorage.removeItem('current_project');
    localStorage.removeItem('current_platform');
    sessionStorage.clear();
    toast.success(t('Berhasil keluar dari akun.'));
    setTimeout(() => {
      window.location.href = '/sign-in';
    }, 400);
  };

  const handleGoogleSignIn = async () => {
    try {
      toast.loading(t('Menghubungkan ke Google OAuth...'), { id: 'google-oauth' });
      const res: any = await api.get('/v1/authn/federated/login?providerName=google');
      if (res && res.loginUrl) {
        toast.success(t('Mengarahkan ke Google Sign-In...'), { id: 'google-oauth' });
        const state = {
          providerName: 'google',
          from: window.location.pathname + window.location.search,
          login: 'true',
        };
        const loginUrl = new URL(res.loginUrl);
        loginUrl.searchParams.set('state', JSON.stringify(state));
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
    const realDefaultAvatar = 'https://lh3.googleusercontent.com/a/ACg8ocK-hWNgZxd6J5-GGmZN2mVejw7_ZRZnD-MVzreVmP-4POZJi4d5=s96-c';
    try {
      const stored = localStorage.getItem('anticeil_current_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.imageUrl?.includes('unsplash.com') || parsed.avatar?.includes('unsplash.com') || parsed.imageUrl?.includes('53994a69daeb') || !parsed.imageUrl)) {
          parsed.imageUrl = realDefaultAvatar;
          parsed.avatar = realDefaultAvatar;
          localStorage.setItem('anticeil_current_user', JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch {}
    return {
      id: 'user_faiz',
      name: 'Muhammad Faiz Asy Syauqi',
      firstName: 'Muhammad Faiz',
      lastName: 'Asy Syauqi',
      username: 'mfaizasysyauqi',
      email: 'mfaizasysyauqi@gmail.com',
      avatar: realDefaultAvatar,
      imageUrl: realDefaultAvatar,
      platformRole: 'ADMIN',
      usernameUpdatedAt: new Date().toISOString(),
    };
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl);
      localStorage.setItem('ap_token', tokenFromUrl);
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('token');
      window.history.replaceState({}, document.title, cleanUrl.toString());
    }

    const fetchLiveUser = async () => {
      try {
        const user = await api.get('/v1/users/me');
        if (user && (user.id || user.email)) {
          const rawImg = user.imageUrl || user.avatar;
          const validImg = rawImg && !rawImg.includes('unsplash.com') && !rawImg.includes('53994a69daeb')
            ? rawImg
            : 'https://lh3.googleusercontent.com/a/ACg8ocK-hWNgZxd6J5-GGmZN2mVejw7_ZRZnD-MVzreVmP-4POZJi4d5=s96-c';
          const formatted = {
            ...user,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email,
            avatar: validImg,
            imageUrl: validImg,
          };
          setCurrentUser(formatted);
          localStorage.setItem('anticeil_current_user', JSON.stringify(formatted));
        }
      } catch (err) {}
    };
    fetchLiveUser();
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

  useEffect(() => {
    if (!socket) return;
    const handleCallState = (data: { channelId: string; active: boolean; participantCount: number }) => {
      if (data?.channelId) {
        setActiveCallCounts((prev) => ({
          ...prev,
          [data.channelId]: data.active ? data.participantCount : 0,
        }));
      }
    };
    socket.on('COMMUNITY_CALL_STATE', handleCallState);
    return () => {
      socket.off('COMMUNITY_CALL_STATE', handleCallState);
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

  // Friends panel state (Discord-style, shown when isHome)
  type FriendsTab = 'online' | 'all' | 'pending' | 'add';
  const [friendsTab, setFriendsTab] = useState<FriendsTab>('online');
  const [friendsSearchQuery, setFriendsSearchQuery] = useState('');
  const [addFriendInput, setAddFriendInput] = useState('');
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
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

  // Discord-style Resizable Sidebar state
  const DEFAULT_SIDEBAR_WIDTH = 240;
  const MIN_SIDEBAR_WIDTH = 180;
  const MAX_SIDEBAR_WIDTH = 480;
  const SIDEBAR_STORAGE_KEY = 'anticeil_channels_sidebar_width';

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= MIN_SIDEBAR_WIDTH && val <= MAX_SIDEBAR_WIDTH) return val;
      }
    } catch {}
    return DEFAULT_SIDEBAR_WIDTH;
  });
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [channelForSettings, setChannelForSettings] = useState<CommunityChannel | null>(null);

  // Responsive state for Mobile/Tablet sheets
  const [isMobileChannelsOpen, setIsMobileChannelsOpen] = useState(false);
  const [isMobileMembersOpen, setIsMobileMembersOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [isInvitingUsername, setIsInvitingUsername] = useState(false);
  const [userNotFound, setUserNotFound] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Edit Profile dialog state (Display Name & Username with 14-day cooldown)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editDisplayNameInput, setEditDisplayNameInput] = useState('');
  const [editUsernameInput, setEditUsernameInput] = useState('');

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

  // 3. WebSocket Realtime Listeners
  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = (newMsg: CommunityMessage) => {
      setMessagesMap((prev) => {
        const list = prev[newMsg.channelId] || [];
        if (list.some((m) => m.id === newMsg.id)) return prev;
        return {
          ...prev,
          [newMsg.channelId]: [...list, newMsg],
        };
      });
    };

    const handleMessageDeleted = ({ id, channelId }: { id: string; channelId?: string }) => {
      setMessagesMap((prev) => {
        const ch = channelId || activeChannelId;
        const list = prev[ch] || [];
        return {
          ...prev,
          [ch]: list.filter((m) => m.id !== id),
        };
      });
    };

    const handleReactionUpdated = ({
      id,
      channelId,
      reactions,
    }: {
      id: string;
      channelId?: string;
      reactions: Record<string, string[]>;
    }) => {
      setMessagesMap((prev) => {
        const ch = channelId || activeChannelId;
        const list = prev[ch] || [];
        return {
          ...prev,
          [ch]: list.map((m) => (m.id === id ? { ...m, reactions } : m)),
        };
      });
    };

    const handleChannelCreated = (newCh: CommunityChannel) => {
      setChannels((prev) => {
        if (prev.some((c) => c.id === newCh.id)) return prev;
        return [...prev, newCh];
      });
    };

    const handleChannelUpdated = (updatedCh: CommunityChannel) => {
      setChannels((prev) => prev.map((c) => (c.id === updatedCh.id ? { ...c, ...updatedCh } : c)));
    };

    const handleChannelDeleted = ({ id }: { id: string }) => {
      setChannels((prev) => prev.filter((c) => c.id !== id));
      setActiveChannelId((current) => (current === id ? '' : current));
    };

    socket.on('COMMUNITY_CHAT_MESSAGE', handleIncomingMessage);
    socket.on('COMMUNITY_MESSAGE_DELETED', handleMessageDeleted);
    socket.on('COMMUNITY_REACTION_UPDATED', handleReactionUpdated);
    socket.on('COMMUNITY_CHANNEL_CREATED', handleChannelCreated);
    socket.on('COMMUNITY_CHANNEL_UPDATED', handleChannelUpdated);
    socket.on('COMMUNITY_CHANNEL_DELETED', handleChannelDeleted);

    return () => {
      socket.off('COMMUNITY_CHAT_MESSAGE', handleIncomingMessage);
      socket.off('COMMUNITY_MESSAGE_DELETED', handleMessageDeleted);
      socket.off('COMMUNITY_REACTION_UPDATED', handleReactionUpdated);
      socket.off('COMMUNITY_CHANNEL_CREATED', handleChannelCreated);
      socket.off('COMMUNITY_CHANNEL_UPDATED', handleChannelUpdated);
      socket.off('COMMUNITY_CHANNEL_DELETED', handleChannelDeleted);
    };
  }, [socket, activeChannelId]);

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

  const isFriendsView = isHome && !activeChannel;

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

  // Launch Activity in Voice Stage
  const handleLaunchActivity = (appId: string) => {
    setSelectedActivityAppId(appId);
    setIsTemplatePopoverOpen(false);
    if (activeChannel) {
      setActiveCallChannelId(activeChannel.id);
      setIsCallPiP(false);
      setIsActivityOpen(true);
      socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
        channelId: activeChannel.id,
        action: 'START_ACTIVITY',
        payload: { appId },
      });
      toast.success(`Aktivitas ${appId} diluncurkan di panggung suara! 🚀`);
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

  // Cooldown calculation for username change (14 days / 2 weeks)
  const usernameCooldownDays = 14;
  const usernameLastUpdated = currentUser?.usernameUpdatedAt ? new Date(currentUser.usernameUpdatedAt) : null;
  const usernameCooldownEnd = usernameLastUpdated
    ? new Date(usernameLastUpdated.getTime() + usernameCooldownDays * 24 * 60 * 60 * 1000)
    : null;
  const isUsernameCooldownActive = usernameCooldownEnd ? new Date() < usernameCooldownEnd : false;

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

  const handleSaveDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = editDisplayNameInput.trim();
    if (!cleaned) {
      toast.error(t('Nama tampilan tidak boleh kosong.'));
      return;
    }
    updateNameMutation.mutate({ name: cleaned });
  };

  const updateUsernameMutation = userMutations.useUpdateUsername({
    onSuccess: (data) => {
      userHooks.invalidateCurrentUser(queryClient);
      toast.success(t(`Username berhasil diperbarui menjadi @${data.username}! 🎉`));
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || t('Gagal mengubah username.');
      toast.error(msg);
    },
  });

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = editUsernameInput.trim().replace(/^@/, '').toLowerCase();
    if (cleaned.length < 3 || cleaned.length > 32) {
      toast.error(t('Username harus antara 3 hingga 32 karakter.'));
      return;
    }
    if (!/^[a-z0-9_]+$/.test(cleaned)) {
      toast.error(t('Username hanya boleh menggunakan huruf kecil, angka, dan garis bawah (_).'));
      return;
    }
    updateUsernameMutation.mutate(cleaned);
  };

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

  // Discord-style Resizable Sidebar handlers
  const handleSidebarResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingSidebar(true);
  };

  const handleSidebarResizeReset = () => {
    setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(DEFAULT_SIDEBAR_WIDTH));
    } catch {}
  };

  useEffect(() => {
    if (!isResizingSidebar) return;

    const handleMouseMove = (e: MouseEvent) => {
      const miniRailEl = document.getElementById('anticeil-mini-rail');
      const miniRailOffset = miniRailEl ? miniRailEl.getBoundingClientRect().right : 56;
      const newWidth = Math.min(Math.max(e.clientX - miniRailOffset, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarWidth));
      } catch {}
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar, sidebarWidth]);

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

  // File Select with Strict Limit: Max 5MB, Images & Documents only (Videos banned to save storage)
  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so user can re-select same file if needed
    e.target.value = '';

    // 1. Strict Size Check (5MB max)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error('Ukuran file maksimal 5 MB untuk menjaga efisiensi storage.');
      return;
    }

    // 2. Reject Video and Audio formats
    if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
      toast.error('Format video dan audio tidak diizinkan. Harap unggah gambar atau dokumen.');
      return;
    }

    // 3. Allowed MIME types: images and documents (PDF, CSV, JSON, TXT, DOCX)
    const isImage = file.type.startsWith('image/');
    const isDocument =
      file.type === 'application/pdf' ||
      file.type === 'text/plain' ||
      file.type === 'text/csv' ||
      file.type === 'application/json' ||
      file.type.includes('wordprocessingml') ||
      file.type.includes('spreadsheetml') ||
      file.name.endsWith('.pdf') ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.csv') ||
      file.name.endsWith('.docx') ||
      file.name.endsWith('.xlsx');

    if (!isImage && !isDocument) {
      toast.error('Format file tidak didukung. Harap unggah gambar atau dokumen (PDF, TXT, CSV, JSON, DOCX).');
      return;
    }

    if (isImage) {
      const reader = new FileReader();
      reader.onload = () => {
        setStagedAttachment({
          type: 'image',
          url: reader.result as string,
          name: file.name,
          size: `${Math.round(file.size / 1024)} KB`,
        });
      };
      reader.readAsDataURL(file);
    } else {
      setStagedAttachment({
        type: 'file',
        url: '#',
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
      });
    }
  };

  // Render Hub Icon Helper (Discord style)
  const renderHubIcon = (hub: CommunityHub) => {
    if (hub.iconUrl) {
      return (
        <img
          src={hub.iconUrl}
          alt={hub.name}
          className="w-full h-full object-cover rounded-[14px]"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      );
    }
    switch (hub.iconType) {
      case 'logo':
        return (
          <img
            src="/logo.png"
            alt="Anticeil"
            className="size-7 object-contain pointer-events-none drop-shadow-xs"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/logo.svg';
            }}
          />
        );
      case 'spark':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'bot':
        return <Bot className="w-4 h-4 text-emerald-400" />;
      case 'templates':
        return <Layers className="w-4 h-4 text-purple-400" />;
      case 'code':
        return <Terminal className="w-4 h-4 text-blue-400" />;
      case 'dm':
        return <MessageSquare className="w-4 h-4 text-rose-400" />;
      default:
        return <span className="font-bold text-xs">{hub.initials}</span>;
    }
  };

  // Role Badge Helper (Discord Server Roles: Pemilik, Admin, Bot)
  const renderRoleBadge = (role: CommunityRole, roleLabel?: string) => {
    switch (role) {
      case 'owner':
        return (
          <Badge className="bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border-amber-500/20 text-[10px] px-1.5 py-0 uppercase font-semibold gap-1 shrink-0">
            <Crown className="w-2.5 h-2.5" /> {roleLabel || t('Pemilik')}
          </Badge>
        );
      case 'admin':
        return (
          <Badge className="bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border-rose-500/20 text-[10px] px-1.5 py-0 uppercase font-semibold gap-1 shrink-0">
            <Shield className="w-2.5 h-2.5" /> {roleLabel || t('Admin')}
          </Badge>
        );
      case 'bot':
        return (
          <Badge className="bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 border-indigo-500/20 text-[10px] px-1.5 py-0 uppercase font-semibold gap-1 shrink-0">
            <Bot className="w-2.5 h-2.5" /> {roleLabel || t('Bot')}
          </Badge>
        );
      default:
        return null;
    }
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

  // Component: Discord Mini Server/Hub Rail (delegates to reusable HubRail feature component)
  const renderDiscordHubRail = () => (
    <HubRail
      hubs={hubs}
      activeHubId={activeHubId}
      onSelectHub={(id) => {
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
      onOpenCreateHub={() => setIsCreateHubOpen(true)}
      platformName={platform?.name}
      renderHubIcon={renderHubIcon}
    />
  );

  // Component: Channels Sidebar Content (reusable for desktop & mobile drawer)
  const renderChannelsSidebarContent = (onItemClick?: () => void) => (
    <div className="flex flex-col h-full bg-sidebar select-none flex-1 min-w-0 overflow-hidden">
      {/* Header: Different for Home (DMs) vs Server (Channels) */}
      <div className="h-12 border-b border-sidebar-border px-2 flex items-center font-semibold shadow-2xs shrink-0 bg-sidebar z-10">
        {isHome ? (
          /* Home: Discord-style search bar "Find or start a conversation" */
          <button
            onClick={() => { setIsDmSearchOpen(true); setDmSearchQuery(''); }}
            className="w-full h-7 px-2 flex items-center gap-1.5 rounded-[4px] bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] transition-colors cursor-pointer border border-border"
          >
            <Search className="w-3 h-3 shrink-0 opacity-60" />
            <span className="truncate">{t('Cari atau mulai percakapan...')}</span>
          </button>
        ) : (
          /* Server: Title + dropdown with channel/server actions */
          <div className="w-full">
            <input
              type="file"
              ref={serverIconQuickInputRef}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !activeHub) return;
                if (file.size > 5 * 1024 * 1024) {
                  toast.error(t('Ukuran file maksimal 5 MB.'));
                  return;
                }
                const reader = new FileReader();
                reader.onload = async (event) => {
                  const res = event.target?.result as string;
                  if (res) {
                    const updated: CommunityHub = {
                      ...activeHub,
                      iconUrl: res,
                    };
                    setHubs((prev) => {
                      const next = prev.map((h) => (h.id === activeHub.id ? updated : h));
                      saveStoredHubs(next);
                      return next;
                    });
                    try {
                      await communityApi.updateHub(activeHub.id, {
                        iconUrl: res,
                      });
                    } catch {}
                    toast.success(t('Foto server berhasil diperbarui! 🖼️'));
                  }
                };
                reader.readAsDataURL(file);
                e.target.value = '';
              }}
              accept="image/*"
              className="hidden"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="w-full h-8 px-2 flex items-center justify-between rounded-md hover:bg-sidebar-accent/60 transition-colors cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-sidebar-ring group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {activeHub?.iconUrl ? (
                      <img
                        src={activeHub.iconUrl}
                        alt={activeHub.name}
                        className="w-5 h-5 rounded-[6px] object-cover shrink-0 border border-white/10"
                      />
                    ) : null}
                    <span className="text-sm font-semibold truncate tracking-tight text-foreground group-hover:text-primary transition-colors">
                      {activeHub?.name || t('Server')}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 ml-1 transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                {/* Server Picture Action */}
                <DropdownMenuItem
                  onClick={() => {
                    serverIconQuickInputRef.current?.click();
                  }}
                  className="cursor-pointer font-medium text-emerald-500 focus:text-emerald-500 focus:bg-emerald-500/10"
                >
                  <Camera className="w-4 h-4 mr-2 text-emerald-500" /> {t('Ubah Foto Server')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* Boost */}
                <DropdownMenuItem
                  onClick={() => {
                    setServerSettingsSection('boost');
                    setIsServerSettingsOpen(true);
                  }}
                  className="cursor-pointer font-medium text-primary focus:text-primary focus:bg-primary/10"
                >
                  <Zap className="w-4 h-4 mr-2 text-primary" /> {t('Server Boost')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* Invite & Settings */}
                <DropdownMenuItem
                  onClick={() => {
                    const code = activeHub?.inviteCode || activeHub?.id;
                    const url = `${window.location.origin}/messages?invite=${code}`;
                    navigator.clipboard.writeText(url);
                    toast.success(t('Link undangan berhasil disalin! 📋'));
                  }}
                  className="cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 mr-2" /> {t('Undang ke Server')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setServerSettingsSection('profile');
                    setIsServerSettingsOpen(true);
                  }}
                  className="cursor-pointer"
                >
                  <Settings className="w-4 h-4 mr-2" /> {t('Pengaturan Server')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* Channel & Category */}
                <DropdownMenuItem onClick={() => setIsCreateChannelOpen(true)} className="cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" /> {t('Buat Channel')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsCreateHubOpen(true)} className="cursor-pointer">
                  <Layers className="w-4 h-4 mr-2" /> {t('Buat Server Baru')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* Notification & Privacy */}
                <DropdownMenuItem
                  onClick={() => {
                    setServerSettingsSection('audit-log');
                    setIsServerSettingsOpen(true);
                  }}
                  className="cursor-pointer"
                >
                  <ScrollText className="w-4 h-4 mr-2" /> {t('Log Audit Server')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setServerSettingsSection('integrations');
                    setIsServerSettingsOpen(true);
                  }}
                  className="cursor-pointer"
                >
                  <Webhook className="w-4 h-4 mr-2" /> {t('Integrasi & Bot')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* Per-server profile */}
                <DropdownMenuItem
                  onClick={() => {
                    setServerSettingsSection('profile');
                    setIsServerSettingsOpen(true);
                  }}
                  className="cursor-pointer"
                >
                  <Edit2 className="w-4 h-4 mr-2" /> {t('Edit Profil Server')}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/templates" className="flex items-center">
                    <ExternalLink className="w-4 h-4 mr-2" /> {t('Jelajahi Marketplace')}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Scroll Area: Home=DMs only, Server=Channels only */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-3 pb-16 [scrollbar-width:thin]">
        {isHome ? (
          /* ===== HOME: DIRECT MESSAGES & FRIENDS NAVIGATION ===== */
          <div>
            {/* Discord-style Friends button at top of Direct Messages column */}
            <button
              onClick={() => {
                setActiveChannelId('');
                onItemClick?.();
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all text-left mb-3 cursor-pointer group',
                isFriendsView
                  ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <Users className={cn('w-4 h-4 shrink-0 transition-colors', isFriendsView ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
              <span className="flex-1 font-medium">{t('Teman')}</span>
              {friendRequests.length > 0 && (
                <span className="size-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {friendRequests.length}
                </span>
              )}
            </button>

            <div className="px-2 mb-1.5 flex items-center justify-between text-[11px] font-bold text-muted-foreground/80 tracking-wider uppercase">
              <span>{t('Pesan Langsung')}</span>
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      setIsDmSearchOpen(true);
                      setDmSearchQuery('');
                    }}
                    className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={4} className="font-semibold text-xs">
                  {t('Mulai DM Baru')}
                </TooltipContent>
              </Tooltip>
            </div>

            {dmChannels.length === 0 ? (
              <div className="px-2.5 py-3 text-[11px] text-muted-foreground/60 leading-relaxed text-center">
                <p>{t('Belum ada pesan langsung.')}</p>
                <button
                  onClick={() => {
                    setActiveChannelId('');
                    setFriendsTab('all');
                  }}
                  className="mt-1.5 text-primary hover:underline font-semibold cursor-pointer block mx-auto text-[11px]"
                >
                  {t('Buka Halaman Teman →')}
                </button>
              </div>
            ) : (
              <div className="space-y-0.5">
                {dmChannels.map((dm) => {
                  const isActiveDm = activeChannelId === dm.id;
                  const member = members.find((m) => `dm-${m.id}` === dm.id);
                  return (
                    <button
                      key={dm.id}
                      onClick={() => {
                        setActiveChannelId(dm.id);
                        onItemClick?.();
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all text-left group',
                        isActiveDm
                          ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
                          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      )}
                    >
                      {member ? (
                        <CommunityAvatar
                          name={member.name}
                          imageUrl={member.avatar}
                          size={18}
                          status={member.status}
                          showStatus
                        />
                      ) : (
                        <MessageSquare
                          className={cn(
                            'w-3.5 h-3.5 shrink-0 transition-colors',
                            isActiveDm ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground',
                          )}
                        />
                      )}
                      <span className="truncate flex-1">{dm.name}</span>
                      {activeCallCounts[dm.id] && activeCallCounts[dm.id] > 0 ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 flex items-center gap-1 shrink-0 animate-pulse">
                          <Radio className="w-2.5 h-2.5" />
                          {activeCallCounts[dm.id]}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ===== SERVER: CHANNELS ONLY (Discord Category Grouping) ===== */
          <div className="space-y-4">
            {hubChannels.length === 0 ? (
              <div className="px-2.5 py-4 text-center">
                <p className="text-[11px] text-muted-foreground/60 leading-relaxed mb-2">
                  {t('Belum ada channel')}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateChannelOpen(true)}
                  className="h-7 text-xs px-2.5 gap-1 w-full"
                >
                  <Plus className="w-3 h-3" />
                  {t('Buat Channel')}
                </Button>
              </div>
            ) : (
              <>
                {/* 1. TEXT CHANNELS CATEGORY */}
                <div>
                  <div
                    onClick={() => setCollapsedCategories((prev) => ({ ...prev, text: !prev.text }))}
                    className="px-2 mb-1 flex items-center justify-between text-[11px] font-bold text-muted-foreground/80 hover:text-foreground tracking-wider uppercase cursor-pointer select-none group/cat"
                  >
                    <div className="flex items-center gap-1">
                      <ChevronDown
                        className={cn(
                          'w-3 h-3 transition-transform duration-200',
                          collapsedCategories.text && '-rotate-90',
                        )}
                      />
                      <span>{t('Text Channels')}</span>
                      <span className="text-[10px] text-muted-foreground/60">
                        ({textChannels.length})
                      </span>
                    </div>
                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewChannelCategory('CHANNELS');
                            setNewChannelType('text');
                            setIsCreateChannelOpen(true);
                          }}
                          className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={4} className="font-semibold text-xs">
                        {t('Buat Text Channel')}
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {!collapsedCategories.text && (
                    <div className="space-y-0.5">
                      {textChannels.map((ch) => {
                        const isActiveCh = activeChannelId === ch.id;

                        return (
                          <div key={ch.id} className="space-y-0.5">
                            <div
                              onClick={() => {
                                setActiveChannelId(ch.id);
                                onItemClick?.();
                              }}
                              className={cn(
                                'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all text-left group cursor-pointer relative',
                                isActiveCh
                                  ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
                                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                              )}
                            >
                              <Hash
                                className={cn(
                                  'w-4 h-4 shrink-0 transition-colors',
                                  isActiveCh
                                    ? 'text-primary'
                                    : 'text-muted-foreground/70 group-hover:text-foreground',
                                )}
                              />
                              <span className="truncate flex-1">{ch.name}</span>
                              {ch.isPrivate && (
                                <span title="Private Channel">
                                  <Lock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                                </span>
                              )}

                              {/* Channel action buttons (Discord style: Add/Invite and Settings) */}
                              <div className="hidden group-hover:flex items-center gap-0.5 ml-auto shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsInviteOpen(true);
                                  }}
                                  title={t('Buat Undangan')}
                                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenEditChannel(ch, e)}
                                  title={t('Pengaturan Channel')}
                                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                  <Settings className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. VOICE CHANNELS CATEGORY */}
                <div>
                  <div
                    onClick={() => setCollapsedCategories((prev) => ({ ...prev, voice: !prev.voice }))}
                    className="px-2 mb-1 flex items-center justify-between text-[11px] font-bold text-muted-foreground/80 hover:text-foreground tracking-wider uppercase cursor-pointer select-none group/cat"
                  >
                    <div className="flex items-center gap-1">
                      <ChevronDown
                        className={cn(
                          'w-3 h-3 transition-transform duration-200',
                          collapsedCategories.voice && '-rotate-90',
                        )}
                      />
                      <span>{t('Voice Channels')}</span>
                      <span className="text-[10px] text-muted-foreground/60">
                        ({voiceChannels.length})
                      </span>
                    </div>
                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewChannelCategory('CHANNELS');
                            setNewChannelType('voice');
                            setIsCreateChannelOpen(true);
                          }}
                          className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={4} className="font-semibold text-xs">
                        {t('Buat Voice Channel')}
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {!collapsedCategories.voice && (
                    <div className="space-y-0.5">
                      {voiceChannels.map((ch) => {
                        const isActiveCh = activeChannelId === ch.id;
                        return (
                          <div
                            key={ch.id}
                            onClick={() => {
                              setActiveChannelId(ch.id);
                              setActiveCallChannelId(ch.id);
                              setIsCallPiP(false);
                              onItemClick?.();
                            }}
                            className={cn(
                              'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all text-left group cursor-pointer relative',
                              isActiveCh
                                ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
                                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                            )}
                          >
                            <Volume2
                              className={cn(
                                'w-4 h-4 shrink-0 transition-colors',
                                isActiveCh
                                  ? 'text-primary'
                                  : 'text-muted-foreground/70 group-hover:text-foreground',
                              )}
                            />
                            <span className="truncate flex-1">{ch.name}</span>
                            {ch.isPrivate && (
                              <span title="Private Channel">
                                <Lock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                              </span>
                            )}
                            {activeCallCounts[ch.id] && activeCallCounts[ch.id] > 0 ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 flex items-center gap-1 shrink-0 animate-pulse">
                                <Radio className="w-2.5 h-2.5" />
                                {activeCallCounts[ch.id]}
                              </span>
                            ) : null}

                            {/* Channel action buttons (Discord style: Add/Invite and Settings) */}
                            <div className="hidden group-hover:flex items-center gap-0.5 ml-auto shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsInviteOpen(true);
                                }}
                                title={t('Buat Undangan')}
                                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleOpenEditChannel(ch, e)}
                                title={t('Pengaturan Channel')}
                                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                              >
                                <Settings className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. FORUM CHANNELS CATEGORY */}
                <div>
                  <div
                    onClick={() => setCollapsedCategories((prev) => ({ ...prev, forum: !prev.forum }))}
                    className="px-2 mb-1 flex items-center justify-between text-[11px] font-bold text-muted-foreground/80 hover:text-foreground tracking-wider uppercase cursor-pointer select-none group/cat"
                  >
                    <div className="flex items-center gap-1">
                      <ChevronDown
                        className={cn(
                          'w-3 h-3 transition-transform duration-200',
                          collapsedCategories.forum && '-rotate-90',
                        )}
                      />
                      <span>{t('Forum Channels')}</span>
                      <span className="text-[10px] text-muted-foreground/60">
                        ({forumChannels.length})
                      </span>
                    </div>
                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewChannelCategory('CHANNELS');
                            setNewChannelType('forum');
                            setIsCreateChannelOpen(true);
                          }}
                          className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={4} className="font-semibold text-xs">
                        {t('Buat Forum Channel')}
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {!collapsedCategories.forum && (
                    <div className="space-y-0.5">
                      {forumChannels.map((ch) => {
                        const isActiveCh = activeChannelId === ch.id;
                        const childThreads =
                          threadsMap[ch.id] || (activeChannelId === ch.id ? channelThreads : []);

                        return (
                          <div key={ch.id} className="space-y-0.5">
                            <div
                              onClick={() => {
                                setActiveChannelId(ch.id);
                                setActiveThread(null);
                                onItemClick?.();
                              }}
                              className={cn(
                                'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all text-left group cursor-pointer relative',
                                isActiveCh
                                  ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
                                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                              )}
                            >
                              <MessagesSquare
                                className={cn(
                                  'w-4 h-4 shrink-0 transition-colors',
                                  isActiveCh
                                    ? 'text-primary'
                                    : 'text-muted-foreground/70 group-hover:text-foreground',
                                )}
                              />
                              <span className="truncate flex-1">{ch.name}</span>
                              {ch.isPrivate && (
                                <span title="Private Channel">
                                  <Lock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                                </span>
                              )}

                              {/* Channel action buttons (Discord style: Add/Invite and Settings) */}
                              <div className="hidden group-hover:flex items-center gap-0.5 ml-auto shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsInviteOpen(true);
                                  }}
                                  title={t('Buat Undangan')}
                                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenEditChannel(ch, e)}
                                  title={t('Pengaturan Channel')}
                                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                  <Settings className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Nested Threads under Forum Channel */}
                            {childThreads && childThreads.length > 0 && (
                              <div className="ml-4 pl-2.5 border-l border-border/40 space-y-0.5 my-0.5">
                                {childThreads.map((th) => {
                                  const isThActive =
                                    activeChannelId === ch.id && activeThread?.id === th.id;
                                  return (
                                    <div
                                      key={th.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveChannelId(ch.id);
                                        setActiveThread(th);
                                        onItemClick?.();
                                      }}
                                      className={cn(
                                        'flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors',
                                        isThActive
                                          ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
                                          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                      )}
                                    >
                                      <span className="text-muted-foreground/50 text-[11px] font-mono leading-none">
                                        └──
                                      </span>
                                      <span className="truncate flex-1">{th.name}</span>
                                      {th.messageCount > 0 && (
                                        <span className="text-[10px] text-muted-foreground/60 font-mono px-1 rounded bg-muted/40">
                                          {th.messageCount}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      {/* Pinned User Bottom Dock inside the channels sidebar - zero offside, matches sidebar theme background */}
      {renderUserBottomDock()}
    </div>
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
      onOpenEditProfile={() => {
        const fallback = currentUser?.email ? currentUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') : '';
        setEditDisplayNameInput(currentUserName);
        setEditUsernameInput(currentUser?.username || fallback);
        setIsEditProfileOpen(true);
      }}
      onLogout={handleLogout}
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

  // Friends Page helpers and state
  const onlineFriends = useMemo(() => {
    return displayMembers.filter(
      (m) => m.id !== currentUser?.id && m.email !== currentUser?.email && m.status !== 'offline',
    );
  }, [displayMembers, currentUser]);

  const allFriends = useMemo(() => {
    return displayMembers.filter(
      (m) => m.id !== currentUser?.id && m.email !== currentUser?.email,
    );
  }, [displayMembers, currentUser]);

  const filteredFriends = useMemo(() => {
    const list = friendsTab === 'online' ? onlineFriends : allFriends;
    if (!friendsSearchQuery.trim()) return list;
    const q = friendsSearchQuery.toLowerCase();
    return list.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.username && f.username.toLowerCase().includes(q)),
    );
  }, [friendsTab, onlineFriends, allFriends, friendsSearchQuery]);

  const handleAddFriend = async (targetUsername?: string) => {
    const raw = typeof targetUsername === 'string' ? targetUsername : addFriendInput;
    if (!raw.trim()) return;
    setIsAddingFriend(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      const cleanInput = raw.trim().replace(/^@/, '').toLowerCase();
      const found = members.find(
        (m) =>
          (m.username && m.username.toLowerCase() === cleanInput) ||
          m.name.toLowerCase() === cleanInput,
      );
      if (found) {
        if (found.id === currentUser?.id || found.email === currentUser?.email) {
          toast.error(t('Kamu tidak bisa menambahkan diri sendiri sebagai teman.'));
          return;
        }
        setFriendRequests((prev) => [
          ...prev.filter((r) => r.id !== found.id),
          {
            id: found.id,
            name: found.name,
            username: found.username || null,
            avatar: found.avatar || null,
            direction: 'outgoing' as const,
            status: 'pending' as const,
          },
        ]);
        toast.success(t('Permintaan pertemanan terkirim ke') + ` ${found.name}!`);
        setAddFriendInput('');
      } else {
        toast.error(t('Pengguna tidak ditemukan. Periksa username dan coba lagi.'));
      }
    } catch {
      toast.error(t('Gagal mengirim permintaan pertemanan.'));
    } finally {
      setIsAddingFriend(false);
    }
  };

  const handleAcceptRequest = (req: FriendRequest) => {
    setFriendRequests((prev) => prev.filter((r) => r.id !== req.id));
    toast.success(t('Permintaan pertemanan dari') + ` ${req.name} ` + t('diterima!'));
  };

  const handleRejectRequest = (req: FriendRequest) => {
    setFriendRequests((prev) => prev.filter((r) => r.id !== req.id));
    toast(t('Permintaan pertemanan ditolak.'));
  };

  const handleCancelRequest = (req: FriendRequest) => {
    setFriendRequests((prev) => prev.filter((r) => r.id !== req.id));
    toast(t('Permintaan pertemanan dibatalkan.'));
  };

  const handleStartDirectMessage = (member: any) => {
    setActiveHubId('anticeil');
    setActiveChannelId(`dm-${member.id}`);
  };

  // Component: Discord-Style Friends Main Page (delegates to reusable FriendsView feature component)
  const renderFriendsMainPage = () => (
    <FriendsView
      friendsTab={friendsTab}
      onTabChange={setFriendsTab}
      onlineFriends={onlineFriends}
      allFriends={allFriends}
      filteredFriends={filteredFriends}
      friendRequests={friendRequests}
      friendsSearchQuery={friendsSearchQuery}
      onSearchChange={setFriendsSearchQuery}
      onStartDM={handleStartDirectMessage}
      onAddFriend={handleAddFriend}
      isAddingFriend={isAddingFriend}
      onAcceptRequest={handleAcceptRequest}
      onRejectRequest={handleRejectRequest}
      onCancelRequest={handleCancelRequest}
      onOpenDmSearch={() => setIsDmSearchOpen(true)}
      onOpenSidebar={() => setIsMobileChannelsOpen(true)}
      horizontalPadding={CHANNEL_HORIZONTAL_PADDING}
    />
  );

  // ── Forum Channel View (matching Discord Screenshot 3) ─────────────────
  const renderForumChannelView = () => {
    const activeChannelThreadsList =
      threadsMap[activeChannel?.id || ''] || channelThreads || [];

    const filteredForumPosts = (() => {
      let list = [...activeChannelThreadsList];
      if (forumSearchQuery.trim()) {
        const q = forumSearchQuery.trim().toLowerCase();
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.creatorName.toLowerCase().includes(q),
        );
      }
      if (forumSort === 'active') {
        list.sort(
          (a, b) =>
            new Date(b.lastMessageAt || b.createdAt || b.created || '').getTime() -
            new Date(a.lastMessageAt || a.createdAt || a.created || '').getTime(),
        );
      } else {
        list.sort(
          (a, b) =>
            new Date(b.createdAt || b.created || '').getTime() - new Date(a.createdAt || a.created || '').getTime(),
        );
      }
      return list;
    })();

    // 1. Thread Discussion View (when a post is opened)
    if (activeThread) {
      return (
        <div className="flex-1 min-h-0 flex flex-col w-full h-full bg-background text-foreground">
          {/* Subheader with back button */}
          <div className={`${CHANNEL_HORIZONTAL_PADDING} py-3 border-b border-border flex items-center justify-between bg-card/40 shrink-0`}>
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveThread(null)}
                className="h-8 px-2.5 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>#{activeChannel?.name}</span>
              </Button>
              <Separator orientation="vertical" className="h-4 bg-border" />
              <div className="flex items-center gap-2 min-w-0">
                <MessagesSquare className="w-4 h-4 text-primary shrink-0" />
                <span className="font-bold text-sm text-foreground truncate">{activeThread.name}</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground shrink-0 font-mono hidden sm:block">
              {activeThread.creatorName} • {dayjs(activeThread.createdAt || activeThread.created).fromNow()}
            </div>
          </div>

          {/* Discussion feed: OP Card + Replies list */}
          <div className={`flex-1 min-h-0 overflow-y-auto ${CHANNEL_HORIZONTAL_PADDING} py-5 space-y-4 [scrollbar-width:thin]`}>
            {/* OP Card */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <CommunityAvatar
                  name={activeThread.creatorName}
                  imageUrl={activeThread.creatorAvatar}
                  size={28}
                />
                <span className="text-xs font-bold text-foreground">{activeThread.creatorName}</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {dayjs(activeThread.createdAt || activeThread.created).format('DD MMM YYYY, HH:mm')}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] py-0 px-1.5 text-primary border-primary/40 bg-primary/10"
                >
                  OP
                </Badge>
              </div>
              <h3 className="text-lg font-bold text-foreground">{activeThread.name}</h3>
              {threadMessages.length > 0 && threadMessages[0].content && (
                <div className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed pt-1 border-t border-border/50">
                  {renderFormattedMessage(threadMessages[0].content)}
                </div>
              )}
            </div>

            {/* Replies List */}
            <div className="space-y-3 pt-2">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                {t('Balasan')} ({Math.max(0, threadMessages.length - 1)})
              </div>

              {threadMessages.length <= 1 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  {t('Belum ada balasan. Jadilah yang pertama memberikan respons!')}
                </div>
              ) : (
                threadMessages.slice(1).map((msg) => (
                  <div
                    key={msg.id}
                    className="flex gap-3 p-3.5 rounded-xl bg-card/60 border border-border/60 hover:border-border transition-colors"
                  >
                    <CommunityAvatar
                      name={msg.senderName}
                      imageUrl={msg.senderAvatar}
                      size={32}
                      className="shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-foreground">{msg.senderName}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {dayjs(msg.createdAt).format('HH:mm')}
                        </span>
                      </div>
                      <div className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                        {renderFormattedMessage(msg.content)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Reply Bar */}
          <form
            onSubmit={handleSendThreadMessage}
            className={`${CHANNEL_HORIZONTAL_PADDING} py-3 border-t border-border bg-card/40 shrink-0`}
          >
            <div className="flex items-center gap-2">
              <Input
                value={threadInputText}
                onChange={(e) => setThreadInputText(e.target.value)}
                placeholder={t(`Kirim balasan ke #${activeThread.name}...`)}
                className="text-xs h-10 bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
              />
              <Button
                type="submit"
                disabled={!threadInputText.trim()}
                className="h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold gap-1.5 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{t('Balas')}</span>
              </Button>
            </div>
          </form>
        </div>
      );
    }

    // 2. Forum Board List View (Theme-consistent with Midnight, Dark, and Light modes)
    return (
      <div className="flex-1 min-h-0 flex flex-col w-full h-full bg-background text-foreground">
        {/* Top Search & Actions Bar */}
        <div className={`${CHANNEL_HORIZONTAL_PADDING} py-3 border-b border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/40 shrink-0`}>
          {/* Search or create a post input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={forumSearchQuery}
              onChange={(e) => setForumSearchQuery(e.target.value)}
              placeholder={t('Search or create a post...')}
              className="pl-9 text-xs h-9 bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          {/* Right actions: Sort & View, + New Post */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs gap-1.5 bg-muted border-border text-foreground hover:bg-accent cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>
                    {forumSort === 'newest' ? 'Sort & View' : 'Aktivitas Terakhir'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs bg-popover border-border text-popover-foreground">
                <DropdownMenuItem
                  onClick={() => setForumSort('newest')}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                >
                  Terbaru (Waktu Dibuat)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setForumSort('active')}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                >
                  Aktivitas Terakhir (Balasan Baru)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={() => setIsForumComposerOpen((prev) => !prev)}
              className="h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold gap-1.5 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('New Post')}</span>
            </Button>
          </div>
        </div>

        {/* Inline Post Composer (when user clicks New Post) */}
        {isForumComposerOpen && (
          <div className="p-4 border-b border-border bg-card/80 animate-in fade-in-50 duration-150">
            <form
              onSubmit={handleCreateForumPost}
              className="space-y-3 max-w-2xl mx-auto p-4 rounded-xl border border-border bg-muted/60 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <MessagesSquare className="w-3.5 h-3.5 text-primary" />
                  <span>{t('Create a Post in')} #{activeChannel?.name}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsForumComposerOpen(false)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Title
                </label>
                <Input
                  value={forumNewTitle}
                  onChange={(e) => setForumNewTitle(e.target.value)}
                  placeholder="Post title..."
                  className="text-sm font-semibold h-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Message
                </label>
                <textarea
                  value={forumNewMessage}
                  onChange={(e) => setForumNewMessage(e.target.value)}
                  placeholder="Tulis pesan atau topik diskusi di sini..."
                  rows={4}
                  className="w-full text-xs rounded-md bg-background border border-border p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsForumComposerOpen(false)}
                  className="text-xs text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingForumPost || !forumNewTitle.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-8 px-5"
                >
                  {isSubmittingForumPost ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Posts List Cards (Matching Screenshot 3) */}
        <div className={`flex-1 min-h-0 overflow-y-auto ${CHANNEL_HORIZONTAL_PADDING} py-4 [scrollbar-width:thin]`}>
          {filteredForumPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-4">
                <MessagesSquare className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">
                {forumSearchQuery ? 'No posts matching query' : `There are no posts in #${activeChannel?.name}`}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mb-5 leading-relaxed">
                {forumSearchQuery
                  ? 'Coba gunakan kata kunci pencarian yang lain.'
                  : 'Be the first to start an organized discussion in this forum channel!'}
              </p>
              {!isForumComposerOpen && (
                <Button
                  onClick={() => setIsForumComposerOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create a Post</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5 max-w-5xl mx-auto">
              {filteredForumPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setActiveThread(post)}
                  className="p-4 rounded-xl bg-card/60 hover:bg-card border border-border hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between shadow-xs hover:shadow-md"
                >
                  <div>
                    <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors mb-1 truncate">
                      {post.name}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      <span className="font-semibold text-foreground/90">{post.creatorName}: </span>
                      {post.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 mt-3 text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-foreground font-medium">
                      <MessagesSquare className="w-3.5 h-3.5 text-primary" />
                      <span>{post.messageCount || 0}</span>
                    </div>
                    <span>•</span>
                    <span className="font-mono">
                      {dayjs(post.lastMessageAt || post.createdAt || post.created).fromNow()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

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
        {/* DESKTOP & TABLET DISCORD HUB / SERVER MINI RAIL */}
        <div className="hidden md:flex flex-col h-full shrink-0 select-none">
          {renderDiscordHubRail()}
        </div>

        {/* DESKTOP & TABLET CHANNELS SIDEBAR (Resizable sidebar directly beside the fixed Mini Rail) */}
        <div
          className="hidden md:flex flex-col h-full shrink-0 border-r border-sidebar-border bg-sidebar select-none relative group/sidebar"
          style={{ width: `${sidebarWidth}px` }}
        >
          <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
            {renderChannelsSidebarContent()}
          </div>

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

        {/* MOBILE CHANNELS DRAWER */}
        <Sheet open={isMobileChannelsOpen} onOpenChange={setIsMobileChannelsOpen}>
          <SheetContent side="left" className={cn("p-0 flex flex-col h-full bg-sidebar border-r border-sidebar-border", LAYOUT_SIZES.DRAWER_WIDTH)}>
            <SheetHeader className="sr-only">
              <SheetTitle>{t('Navigasi Channel & Hub')}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-1 min-h-0 w-full overflow-hidden">
              {renderDiscordHubRail()}
              <div className="flex-1 flex flex-col h-full min-w-0">
                {renderChannelsSidebarContent(() => setIsMobileChannelsOpen(false))}
              </div>
            </div>
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

        {/* MAIN CONTENT AREA: DISCORD-STYLE FRIENDS HUB OR CHANNEL CHAT */}
        {isFriendsView ? (
          renderFriendsMainPage()
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
              />
            </div>
          ) : activeChannel?.type === 'forum' ? (
            renderForumChannelView()
          ) : (
          <>
          {/* Messages Feed (SCROLLABLE CONVERSATION) */}
          <div className={`flex-1 min-h-0 overflow-y-auto ${CHANNEL_HORIZONTAL_PADDING} py-4 space-y-4 [scrollbar-width:thin]`}>
            {!activeChannel ? (
              <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border/60 flex items-center justify-center text-muted-foreground mb-4">
                  <Hash className="w-8 h-8 opacity-60" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {t('Belum Ada Channel')}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mb-5 leading-relaxed">
                  {t('Workspace ini belum memiliki channel. Buat channel pertama untuk mulai berkolaborasi dan berkomunikasi dengan tim.')}
                </p>
                <Button onClick={() => setIsCreateChannelOpen(true)} size="sm" className="gap-1.5 shadow-2xs">
                  <Plus className="w-4 h-4" />
                  {t('Buat Channel Baru')}
                </Button>
              </div>
            ) : (
              <>
                {/* Welcome banner at top of channel */}
                <div className="mb-6 pt-4 pb-2">
                  <div className="w-14 h-14 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-primary mb-3">
                    <Hash className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Selamat datang di #{activeChannel.name}!
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
                    {activeChannel.description ||
                      'Ruang obrolan tim Anticeil. Mulai percakapan, bagikan template otomatisasi, atau koordinasikan alur kerja tim.'}
                  </p>
                </div>

                <Separator className="my-4 bg-border/40" />

                {/* Message List */}
                {filteredMessages.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    Belum ada pesan di channel ini. Jadilah yang pertama mengirim pesan!
                  </div>
                ) : (
                  filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  id={`msg-${msg.id}`}
                  className={cn(
                    "group relative flex gap-3 px-2 py-1.5 -mx-2 rounded-lg hover:bg-muted/40 transition-colors",
                    msg.isPinned && "border-l-2 border-primary bg-primary/5"
                  )}
                >
                  {/* Sender Avatar */}
                  <CommunityAvatar
                    name={msg.senderName}
                    email={msg.senderEmail}
                    imageUrl={msg.senderAvatar}
                    size={38}
                    className="shrink-0 mt-0.5"
                  />

                  {/* Message Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-foreground hover:underline cursor-pointer">
                        {msg.senderName}
                      </span>
                      {renderRoleBadge(msg.senderRole)}
                      {msg.isPinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded">
                          <Pin className="w-2.5 h-2.5" /> Tersemat
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="text-xs leading-relaxed text-foreground/90 break-words">
                      {renderFormattedMessage(msg.content)}
                    </div>

                    {/* Attachments rendering */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msg.attachments.map((att, attIdx) => {
                          if (att.type === 'template' && att.templateData) {
                            return (
                              <Card
                                key={attIdx}
                                className="p-3 max-w-md bg-sidebar border-border/80 rounded-lg shadow-xs hover:border-primary/50 transition-colors"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                                      <Layers className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-semibold">{att.templateData.name}</span>
                                  </div>
                                  <Badge variant="outline" className="text-[10px] font-mono">
                                    {att.templateData.price || 'Free'}
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2">
                                  {att.templateData.description}
                                </p>
                                <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-border/40">
                                  <span className="text-[10px] text-muted-foreground">
                                    {att.templateData.pieceCount} Langkah Alur
                                  </span>
                                  <Button size="sm" variant="default" className="h-7 text-xs px-2.5" asChild>
                                    <Link to="/templates">
                                      {t('Gunakan Template')}
                                      <ExternalLink className="w-3 h-3 ml-1" />
                                    </Link>
                                  </Button>
                                </div>
                              </Card>
                            );
                          }
                          if (att.type === 'sticker') {
                            return (
                              <div key={attIdx} className="my-1 inline-block select-none group/sticker" title={att.name}>
                                <img
                                  src={att.url}
                                  alt={att.name}
                                  className="w-36 h-36 object-contain drop-shadow-md hover:scale-105 transition-transform duration-200 cursor-pointer"
                                />
                              </div>
                            );
                          }
                          if (att.type === 'gif') {
                            return (
                              <div key={attIdx} className="my-1.5 max-w-sm rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black/40">
                                <img
                                  src={att.url}
                                  alt={att.name}
                                  className="max-h-72 w-full object-cover rounded-t-xl"
                                />
                                <div className="px-2.5 py-1 bg-[#111214] flex items-center justify-between text-[10px] text-[#949ba4]">
                                  <span className="font-bold tracking-wider text-primary uppercase">GIF via Klipy</span>
                                  <span className="truncate max-w-[200px]">{att.name}</span>
                                </div>
                              </div>
                            );
                          }
                          if (att.type === 'gift') {
                            const isClaimed = claimedGifts[msg.id] || att.giftData?.claimed;
                            return (
                              <div key={attIdx} className="my-2 max-w-sm rounded-2xl border border-primary/40 bg-gradient-to-b from-[#202225] to-[#18191c] shadow-2xl p-4 relative overflow-hidden">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5865f2] to-[#eb459e] flex items-center justify-center text-white shadow-lg text-2xl shrink-0">
                                    🎁
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[10px] font-black tracking-wider text-[#eb459e] uppercase block">
                                      A WILD GIFT APPEARS!
                                    </span>
                                    <h4 className="text-xs font-black text-white italic tracking-wide">
                                      {att.name || 'Discord Nitro Gift'}
                                    </h4>
                                    <p className="text-[10px] text-[#949ba4] truncate">
                                      {att.giftData?.price || 'IDR 142,714'} • Hadiah Komunitas
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                                  {isClaimed ? (
                                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                                      <Check className="w-3.5 h-3.5" /> Telah Diklaim
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-[#949ba4] flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Siap diklaim
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    disabled={isClaimed}
                                    onClick={() => {
                                      setClaimedGifts((prev) => ({ ...prev, [msg.id]: true }));
                                      confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 } });
                                      toast.success('🎉 Hadiah Nitro berhasil diklaim ke akun Anda!');
                                    }}
                                    className={cn(
                                      "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer",
                                      isClaimed
                                        ? "bg-white/10 text-[#949ba4] cursor-not-allowed"
                                        : "bg-[#248046] hover:bg-[#1a6334] text-white hover:shadow-emerald-900/30"
                                    )}
                                  >
                                    {isClaimed ? 'Diklaim' : 'Klaim Hadiah'}
                                  </button>
                                </div>
                              </div>
                            );
                          }
                          if (att.type === 'image') {
                            return (
                              <img
                                key={attIdx}
                                src={att.url}
                                alt={att.name}
                                className="max-h-60 rounded-md border border-border/60 object-cover"
                              />
                            );
                          }
                          return (
                            <div
                              key={attIdx}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/60 border border-border/40 text-xs"
                            >
                              <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="truncate">{att.name}</span>
                              {att.size && <span className="text-[10px] text-muted-foreground">({att.size})</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Reactions Row */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {Object.entries(msg.reactions).map(([emoji, userIds]) => {
                          const isReacted = userIds.includes(currentUser?.id || 'me');
                          return (
                            <button
                              key={emoji}
                              onClick={() => handleToggleReaction(msg.id, emoji)}
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border transition-colors cursor-pointer',
                                isReacted
                                  ? 'bg-primary/15 border-primary/40 text-primary font-medium'
                                  : 'bg-muted/50 border-border/50 text-muted-foreground hover:bg-muted',
                              )}
                            >
                              <span>{emoji}</span>
                              <span className="text-[11px] font-semibold">{userIds.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Discord Hover Action Bar (Reactions & Delete CRUD) */}
                  <div className="absolute right-3 -top-3.5 hidden group-hover:flex items-center bg-background border border-border/80 shadow-md rounded-md p-0.5 gap-0.5 z-10">
                    <button
                      onClick={() => handleToggleReaction(msg.id, '👍')}
                      className="p-1 hover:bg-muted rounded text-xs transition-colors"
                      title="Like"
                    >
                      👍
                    </button>
                    <button
                      onClick={() => handleToggleReaction(msg.id, '❤️')}
                      className="p-1 hover:bg-muted rounded text-xs transition-colors"
                      title="Love"
                    >
                      ❤️
                    </button>
                    <button
                      onClick={() => handleToggleReaction(msg.id, '🔥')}
                      className="p-1 hover:bg-muted rounded text-xs transition-colors"
                      title="Fire"
                    >
                      🔥
                    </button>
                    <button
                      onClick={() => handleToggleReaction(msg.id, '🎉')}
                      className="p-1 hover:bg-muted rounded text-xs transition-colors"
                      title="Party"
                    >
                      🎉
                    </button>

                    <Separator orientation="vertical" className="h-4 mx-0.5" />

                    {/* Pin/Unpin Message Button */}
                    <button
                      onClick={() => handleTogglePin(msg.id)}
                      className={cn(
                        "p-1 rounded text-xs transition-colors",
                        msg.isPinned
                          ? "text-primary bg-primary/10 hover:bg-primary/20"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                      title={msg.isPinned ? "Lepas Sematan (Unpin)" : "Sematkan Pesan (Pin)"}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>

                    {/* Start Thread from Message */}
                    <button
                      onClick={() => {
                        setNewThreadName(`Diskusi: ${msg.content.slice(0, 30)}`);
                        setNewThreadInitialMsg(msg.content);
                        setIsCreateThreadModalOpen(true);
                      }}
                      className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors"
                      title="Mulai Thread Baru"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>

                    <Separator orientation="vertical" className="h-4 mx-0.5" />

                    {/* Delete Message button (Message CRUD) */}
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="p-1 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 rounded transition-colors"
                      title="Hapus Pesan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

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

        {/* Create or Join Hub Dialog (Feature-First Component) */}
        <CreateOrJoinHubDialog
          open={isCreateHubOpen}
          onOpenChange={setIsCreateHubOpen}
          newHubName={newHubName}
          setNewHubName={setNewHubName}
          newHubDesc={newHubDesc}
          setNewHubDesc={setNewHubDesc}
          newHubIconUrl={newHubIconUrl}
          setNewHubIconUrl={setNewHubIconUrl}
          joinInviteCode={joinInviteCode}
          setJoinInviteCode={setJoinInviteCode}
          isJoiningHub={isJoiningHub}
          onCreateHubSubmit={handleCreateHubSubmit}
          onJoinHub={handleJoinHub}
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

        {/* Edit Hub Dialog (Feature-First Component) */}
        <EditHubDialog
          hubToEdit={hubToEdit}
          onClose={() => setHubToEdit(null)}
          editHubName={editHubName}
          setEditHubName={setEditHubName}
          editHubDesc={editHubDesc}
          setEditHubDesc={setEditHubDesc}
          onEditHubSubmit={handleEditHubSubmit}
          t={t}
        />

        {/* Delete Hub Dialog (Feature-First Component) */}
        <DeleteHubDialog
          hubToDelete={hubToDelete}
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
        {/* Hub Invite Dialog (Feature-First Component) */}
        <HubInviteDialog
          open={isInviteOpen}
          onOpenChange={setIsInviteOpen}
          activeHub={activeHub}
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
    </LockedFeatureGuard>
  );
}
export { CommunityPage as MessagesPage };
export default CommunityPage;
