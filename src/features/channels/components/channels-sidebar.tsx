import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ChevronDown,
  Zap,
  UserPlus,
  Settings,
  Webhook,
  Plus,
  Radio,
  Camera,
  Edit2,
  Trash2,
  Users,
  MessageSquare,
  Hash,
  Volume2,
  MessagesSquare,
  Lock,
  Layers,
  ScrollText,
  ExternalLink,
  Mail,
  Bell,
  Calendar,
  Backpack,
  Phone,
  Rocket,
  Columns3,
  Compass,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CommunityAvatar } from '@/chat/chat-avatar';
import type {
  CommunityHub,
  CommunityChannel,
  CommunityMember,
  CommunityChannelType,
} from '@/chat/chat-types';
import type { ServerSettingsSection } from '@/features/server-settings';

export interface ChannelsSidebarProps {
  isHome: boolean;
  activeHub: CommunityHub | null;
  channels: CommunityChannel[];
  activeChannelId: string;
  setActiveChannelId: (id: string) => void;
  activeCallChannelId: string | null;
  setActiveCallChannelId: (id: string | null) => void;
  isFriendsView: boolean;
  homeView?: 'friends' | 'servers' | 'message-requests' | 'notifications' | 'calendar' | 'assignments' | 'calls' | 'apps';
  setHomeView?: (view: 'friends' | 'servers' | 'message-requests' | 'notifications' | 'calendar' | 'assignments' | 'calls' | 'apps') => void;
  messageRequestsCount?: number;
  unreadNotificationsCount?: number;
  setFriendsTab: (tab: any) => void;
  friendRequests: any[];
  dmChannels: CommunityChannel[];
  members: CommunityMember[];
  collapsedCategories: any;
  setCollapsedCategories: any;
  threadsMap: Record<string, any[]>;
  channelThreads: any[];
  activeThread: any;
  setActiveThread: (thread: any) => void;
  activeCallCounts?: Record<string, number>;
  onItemClick?: () => void;
  onOpenDmSearch: () => void;
  onOpenInvite: () => void;
  onOpenServerSettings: (section?: ServerSettingsSection) => void;
  onOpenCreateChannel: (category: string, type?: CommunityChannelType) => void;
  onOpenCreateHub?: () => void;
  onOpenEditChannel: (channel: CommunityChannel) => void;
  onUpdateHubIcon?: (file: File) => Promise<void> | void;
  onOpenEditHub?: () => void;
  onOpenDeleteHub?: () => void;
  setIsCallPiP: (pip: boolean) => void;
  userBottomDock?: React.ReactNode;
  t: (key: string, params?: Record<string, any>) => string;
}

export function ChannelsSidebar({
  isHome,
  activeHub,
  channels,
  activeChannelId,
  setActiveChannelId,
  activeCallChannelId,
  setActiveCallChannelId,
  isFriendsView,
  homeView = 'friends',
  setHomeView,
  messageRequestsCount = 0,
  unreadNotificationsCount = 0,
  setFriendsTab,
  friendRequests,
  dmChannels,
  members,
  collapsedCategories,
  setCollapsedCategories,
  threadsMap,
  channelThreads,
  activeThread,
  setActiveThread,
  activeCallCounts = {},
  onItemClick,
  onOpenDmSearch,
  onOpenInvite,
  onOpenServerSettings,
  onOpenCreateChannel,
  onOpenCreateHub,
  onOpenEditChannel,
  onUpdateHubIcon,
  onOpenEditHub,
  onOpenDeleteHub,
  setIsCallPiP,
  userBottomDock,
  t,
}: ChannelsSidebarProps) {
  const serverIconQuickInputRef = useRef<HTMLInputElement>(null);

  const hubChannels = channels.filter(
    (c) => (c.hubId || 'anticeil') === (activeHub?.id || 'anticeil') && !c.isDirectMessage,
  );
  const textChannels = hubChannels.filter((c) => !c.type || c.type === 'text');
  const voiceChannels = hubChannels.filter((c) => c.type === 'voice');
  const forumChannels = hubChannels.filter((c) => c.type === 'forum');
  const kanbanChannels = hubChannels.filter((c) => c.type === 'kanban');

  const toggleCategoryCollapse = (category: string) => {
    setCollapsedCategories((prev: any) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
<div className="flex flex-col h-full bg-sidebar select-none flex-1 min-w-0 overflow-hidden">
      {/* Header: Different for Home (DMs) vs Server (Channels) */}
      <div className="h-12 border-b border-sidebar-border px-2 flex items-center font-semibold shadow-2xs shrink-0 bg-sidebar z-10">
        {isHome ? (
          /* Home: Discord-style search bar "Find or start a conversation" */
          <button
            onClick={onOpenDmSearch}
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
                if (onUpdateHubIcon) {
                  await onUpdateHubIcon(file);
                }
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
                  className="cursor-pointer font-medium text-primary focus:text-primary focus:bg-primary/10"
                >
                  <Camera className="w-4 h-4 mr-2 text-primary" /> {t('Ubah Foto Server')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* Boost */}
                <DropdownMenuItem
                  onClick={() => {
                    onOpenServerSettings('boost');
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
                    onOpenServerSettings('profile');
                  }}
                  className="cursor-pointer"
                >
                  <Settings className="w-4 h-4 mr-2" /> {t('Pengaturan Server')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* Channel & Category */}
                <DropdownMenuItem onClick={() => onOpenCreateChannel('CHANNELS', 'text')} className="cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" /> {t('Buat Channel')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onOpenCreateHub?.()} className="cursor-pointer">
                  <Layers className="w-4 h-4 mr-2" /> {t('Buat Server Baru')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* Notification & Privacy */}
                <DropdownMenuItem
                  onClick={() => {
                    onOpenServerSettings('audit-log');
                  }}
                  className="cursor-pointer"
                >
                  <ScrollText className="w-4 h-4 mr-2" /> {t('Log Audit Server')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    onOpenServerSettings('integrations');
                  }}
                  className="cursor-pointer"
                >
                  <Webhook className="w-4 h-4 mr-2" /> {t('Integrasi & Bot')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* Per-server profile */}
                <DropdownMenuItem
                  onClick={() => {
                    onOpenServerSettings('profile');
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
            {/* Discord-style Home Navigation: Teman, Permintaan Pesan, Notifikasi */}
            <div className="space-y-0.5 mb-3">
              {/* Friends button */}
              <button
                onClick={() => {
                  setActiveChannelId('');
                  setHomeView?.('friends');
                  onItemClick?.();
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all text-left cursor-pointer group',
                  !activeChannelId && homeView === 'friends'
                    ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                <Users
                  className={cn(
                    'w-4 h-4 shrink-0 transition-colors',
                    !activeChannelId && homeView === 'friends'
                      ? 'text-primary'
                      : 'text-muted-foreground group-hover:text-foreground',
                  )}
                />
                <span className="flex-1 font-medium">{t('Teman')}</span>
                {friendRequests.length > 0 && (
                  <span className="size-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {friendRequests.length}
                  </span>
                )}
              </button>

              {/* Server & Komunitas button (for easy discovery) */}
              <button
                onClick={() => {
                  setActiveChannelId('');
                  setHomeView?.('servers');
                  onItemClick?.();
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all text-left cursor-pointer group',
                  !activeChannelId && homeView === 'servers'
                    ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                <Compass
                  className={cn(
                    'w-4 h-4 shrink-0 transition-colors',
                    !activeChannelId && homeView === 'servers'
                      ? 'text-primary'
                      : 'text-muted-foreground group-hover:text-foreground',
                  )}
                />
                <span className="flex-1 font-medium">{t('Server & Komunitas')}</span>
              </button>

              {/* Message Requests button (Discord-style) */}
              <button
                onClick={() => {
                  setActiveChannelId('');
                  setHomeView?.('message-requests');
                  onItemClick?.();
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all text-left cursor-pointer group',
                  !activeChannelId && homeView === 'message-requests'
                    ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                <Mail
                  className={cn(
                    'w-4 h-4 shrink-0 transition-colors',
                    !activeChannelId && homeView === 'message-requests'
                      ? 'text-primary'
                      : 'text-muted-foreground group-hover:text-foreground',
                  )}
                />
                <span className="flex-1 font-medium">{t('Permintaan Pesan')}</span>
                {messageRequestsCount > 0 && (
                  <span className="size-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {messageRequestsCount}
                  </span>
                )}
              </button>

              {/* Notifications button */}
              <button
                onClick={() => {
                  setActiveChannelId('');
                  setHomeView?.('notifications');
                  onItemClick?.();
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all text-left cursor-pointer group',
                  !activeChannelId && homeView === 'notifications'
                    ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                <Bell
                  className={cn(
                    'w-4 h-4 shrink-0 transition-colors',
                    !activeChannelId && homeView === 'notifications'
                      ? 'text-primary'
                      : 'text-muted-foreground group-hover:text-foreground',
                  )}
                />
                <span className="flex-1 font-medium">{t('Notifikasi')}</span>
                {unreadNotificationsCount > 0 && (
                  <span className="size-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Calendar button (Teams & Google Meet style) */}
              <button
                onClick={() => {
                  setActiveChannelId('');
                  setHomeView?.('calendar');
                  onItemClick?.();
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all text-left cursor-pointer group',
                  !activeChannelId && homeView === 'calendar'
                    ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                <Calendar
                  className={cn(
                    'w-4 h-4 shrink-0 transition-colors',
                    !activeChannelId && homeView === 'calendar'
                      ? 'text-primary'
                      : 'text-muted-foreground group-hover:text-foreground',
                  )}
                />
                <span className="flex-1 font-medium">{t('Kalender')}</span>
              </button>

              {/* Assignments button (Teams style) */}
              <button
                onClick={() => {
                  setActiveChannelId('');
                  setHomeView?.('assignments');
                  onItemClick?.();
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all text-left cursor-pointer group',
                  !activeChannelId && homeView === 'assignments'
                    ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                <Backpack
                  className={cn(
                    'w-4 h-4 shrink-0 transition-colors',
                    !activeChannelId && homeView === 'assignments'
                      ? 'text-primary'
                      : 'text-muted-foreground group-hover:text-foreground',
                  )}
                />
                <span className="flex-1 font-medium">{t('Tugas Saya')}</span>
              </button>

              {/* Calls button */}
              <button
                onClick={() => {
                  setActiveChannelId('');
                  setHomeView?.('calls');
                  onItemClick?.();
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all text-left cursor-pointer group',
                  !activeChannelId && homeView === 'calls'
                    ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                <Phone
                  className={cn(
                    'w-4 h-4 shrink-0 transition-colors',
                    !activeChannelId && homeView === 'calls'
                      ? 'text-primary'
                      : 'text-muted-foreground group-hover:text-foreground',
                  )}
                />
                <span className="flex-1 font-medium">{t('Panggilan')}</span>
              </button>

              {/* Anticeil Apps Directory button */}
              <button
                onClick={() => {
                  setActiveChannelId('');
                  setHomeView?.('apps');
                  onItemClick?.();
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all text-left cursor-pointer group',
                  !activeChannelId && homeView === 'apps'
                    ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                <Rocket
                  className={cn(
                    'w-4 h-4 shrink-0 transition-colors',
                    !activeChannelId && homeView === 'apps'
                      ? 'text-primary'
                      : 'text-muted-foreground group-hover:text-foreground',
                  )}
                />
                <span className="flex-1 font-medium">{t('Aplikasi & Activities')}</span>
              </button>
            </div>

            <div className="px-2 mb-1.5 flex items-center justify-between text-[11px] font-bold text-muted-foreground/80 tracking-wider uppercase">
              <span>{t('Pesan Langsung')}</span>
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onOpenDmSearch()}
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
                  onClick={() => onOpenCreateChannel('CHANNELS', 'text')}
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
                            onOpenCreateChannel('CHANNELS', 'text');
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
                                    onOpenInvite();
                                  }}
                                  title={t('Buat Undangan')}
                                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenEditChannel(ch);
                                  }}
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
                            onOpenCreateChannel('CHANNELS', 'voice');
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
                                  onOpenInvite();
                                }}
                                title={t('Buat Undangan')}
                                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenEditChannel(ch);
                                }}
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
                            onOpenCreateChannel('CHANNELS', 'forum');
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
                                    onOpenInvite();
                                  }}
                                  title={t('Buat Undangan')}
                                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenEditChannel(ch);
                                  }}
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

                {/* 4. KANBAN CHANNELS CATEGORY */}
                <div>
                  <div
                    onClick={() => setCollapsedCategories((prev: any) => ({ ...prev, kanban: !prev.kanban }))}
                    className="px-2 mb-1 flex items-center justify-between text-[11px] font-bold text-muted-foreground/80 hover:text-foreground tracking-wider uppercase cursor-pointer select-none group/cat"
                  >
                    <div className="flex items-center gap-1">
                      <ChevronDown
                        className={cn(
                          'w-3 h-3 transition-transform duration-200',
                          collapsedCategories.kanban && '-rotate-90',
                        )}
                      />
                      <span>{t('Kanban Boards')}</span>
                      <span className="text-[10px] text-muted-foreground/60">
                        ({kanbanChannels.length})
                      </span>
                    </div>
                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenCreateChannel('CHANNELS', 'kanban');
                          }}
                          className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={4} className="font-semibold text-xs">
                        {t('Buat Kanban Board')}
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {!collapsedCategories.kanban && (
                    <div className="space-y-0.5">
                      {kanbanChannels.map((ch) => {
                        const isActiveCh = activeChannelId === ch.id;

                        return (
                          <div key={ch.id} className="relative group">
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
                              <Columns3
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

                              {/* Channel action buttons */}
                              <div className="hidden group-hover:flex items-center gap-0.5 ml-auto shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenInvite();
                                  }}
                                  title={t('Buat Undangan')}
                                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenEditChannel(ch);
                                  }}
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
              </>
            )}
          </div>
        )}
      </div>
      {/* Pinned User Bottom Dock inside the channels sidebar - zero offside, matches sidebar theme background */}
      {userBottomDock}
    </div>
  );
}
