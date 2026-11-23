import React, { useMemo } from 'react';
import {
  Search,
  Users,
  Compass,
  Mail,
  Calendar,
  Backpack,
  Store,
  Rocket,
  Plus,
  MessageSquare,
  Radio,
  X,
  PanelLeftClose,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CommunityAvatar } from '@/chat/chat-avatar';
import type { ColonyChannel, ColonyMember } from '@/chat/chat-types';

export interface HomeChannelsSidebarProps {
  currentUser?: any;
  activeChannelId: string;
  setActiveChannelId: (id: string) => void;
  homeView?: 'ai' | 'friends' | 'colonies' | 'servers' | 'message-requests' | 'notifications' | 'calendar' | 'assignments' | 'calls' | 'apps' | 'shop' | 'quests';
  setHomeView?: (view: 'ai' | 'friends' | 'colonies' | 'servers' | 'message-requests' | 'notifications' | 'calendar' | 'assignments' | 'calls' | 'apps' | 'shop' | 'quests') => void;
  messageRequestsCount?: number | string;
  unreadNotificationsCount?: number | string;
  setFriendsTab: (tab: any) => void;
  friendRequests: any[];
  dmChannels: ColonyChannel[];
  members: ColonyMember[];
  activeCallCounts?: Record<string, number>;
  onItemClick?: () => void;
  onCloseDM?: (id: string) => void;
  onOpenDmSearch: () => void;
  onOpenCreateGroupDm?: () => void;
  onToggleCollapseSidebar?: () => void;
  t: (key: string, params?: Record<string, any>) => string;
}

function formatSidebarBadge(count: number | string | undefined): string | null {
  if (count === undefined || count === null || count === 0 || count === '0' || count === '') return null;
  const num = typeof count === 'string' ? Number(count) : count;
  if (!isNaN(num)) {
    if (num >= 9000) return '9K+';
    if (num >= 1000) return `${Math.floor(num / 1000)}K+`;
    return String(num);
  }
  return String(count);
}

export function HomeChannelsSidebar({
  currentUser,
  activeChannelId,
  setActiveChannelId,
  homeView = 'friends',
  setHomeView,
  messageRequestsCount = 0,
  unreadNotificationsCount = 0,
  setFriendsTab,
  friendRequests,
  dmChannels,
  members,
  activeCallCounts = {},
  onItemClick,
  onCloseDM,
  onOpenDmSearch,
  onOpenCreateGroupDm,
  onToggleCollapseSidebar,
  t,
}: HomeChannelsSidebarProps) {
  const msgReqBadge = formatSidebarBadge(messageRequestsCount);
  const friendReqBadge = formatSidebarBadge(friendRequests?.length);
  return (
    <>
      {/* Home Header: Search bar "Find or start a conversation" */}
      <div className="h-12 border-b border-sidebar-border px-2 flex items-center justify-between gap-1.5 font-semibold shadow-2xs shrink-0 bg-sidebar z-10">
        <button
          onClick={onOpenDmSearch}
          className="flex-1 min-w-0 h-7 px-2 flex items-center gap-1.5 rounded-[4px] bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] transition-colors cursor-pointer border border-border"
        >
          <Search className="w-3 h-3 shrink-0 opacity-60" />
          <span className="truncate">{t('Cari atau mulai percakapan...')}</span>
        </button>
        {onToggleCollapseSidebar && (
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapseSidebar}
                className="hidden md:flex h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent cursor-pointer shrink-0"
                title={t('Tutup Sidebar (Ctrl+B)')}
              >
                <PanelLeftClose className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {t('Tutup Sidebar')} <kbd className="ml-1 text-[10px] text-muted-foreground font-mono">Ctrl+B</kbd>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Scroll Area: Home navigation and DMs */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-3 pb-16 custom-scrollbar">
        {/* Navigation buttons */}
        <div className="space-y-0.5 mb-3">
          {/* 1. Aplikasi & Aktivitas (Launcher utama) */}
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
            <span className="flex-1 font-medium">{t('Aplikasi')}</span>
          </button>

          {/* 2. Colony (Workspace / Discovery) */}
          <button
            onClick={() => {
              setActiveChannelId('');
              setHomeView?.('colonies');
              onItemClick?.();
            }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all text-left cursor-pointer group',
              !activeChannelId && homeView === 'colonies'
                ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            )}
          >
            <Compass
              className={cn(
                'w-4 h-4 shrink-0 transition-colors',
                !activeChannelId && homeView === 'colonies'
                  ? 'text-primary'
                  : 'text-muted-foreground group-hover:text-foreground',
              )}
            />
            <span className="flex-1 font-medium">{t('Colony')}</span>
          </button>

          {/* 3. Kalender & Tugas Saya (Jadwal operasional & tugas lintas app) */}
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

          {/* 5. Pemisah tipis / section personal */}
          <div className="my-2 mx-1 border-t border-sidebar-border/60" />

          {/* 6. Teman */}
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
            {friendReqBadge && (
              <span className="min-w-[18px] h-[18px] px-1 bg-[#da373c] text-white text-[10px] font-black rounded-full flex items-center justify-center shrink-0 ml-auto leading-none shadow-xs">
                {friendReqBadge}
              </span>
            )}
          </button>

          {/* 7. Permintaan Pesan & Panggilan */}
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
            {msgReqBadge && (
              <span className="min-w-[18px] h-[18px] px-1 bg-[#da373c] text-white text-[10px] font-black rounded-full flex items-center justify-center shrink-0 ml-auto leading-none shadow-xs">
                {msgReqBadge}
              </span>
            )}
          </button>

          {/* 7. Shop */}
          <button
            onClick={() => {
              setActiveChannelId('');
              setHomeView?.('shop');
              onItemClick?.();
            }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all text-left cursor-pointer group',
              !activeChannelId && homeView === 'shop'
                ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            )}
          >
            <Store
              className={cn(
                'w-4 h-4 shrink-0 transition-colors',
                !activeChannelId && homeView === 'shop'
                  ? 'text-primary'
                  : 'text-muted-foreground group-hover:text-foreground',
              )}
            />
            <span className="flex-1 font-medium">{t('Shop')}</span>
          </button>

          {/* 9. Quests (Discord 1:1 Gamification) */}
          <button
            onClick={() => {
              setActiveChannelId('');
              setHomeView?.('quests');
              onItemClick?.();
            }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all text-left cursor-pointer group',
              !activeChannelId && homeView === 'quests'
                ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            )}
          >
            <Compass
              className={cn(
                'w-4 h-4 shrink-0 transition-colors',
                !activeChannelId && homeView === 'quests'
                  ? 'text-primary'
                  : 'text-muted-foreground group-hover:text-foreground',
              )}
            />
            <span className="flex-1 font-medium">{t('Quests')}</span>
          </button>
        </div>

        {/* Direct Messages Header */}
        <div className="px-2 mb-1.5 flex items-center justify-between text-[11px] font-bold text-muted-foreground/80 tracking-wider uppercase">
          <span>{t('Pesan Langsung')}</span>
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                onClick={() => (onOpenCreateGroupDm ? onOpenCreateGroupDm() : onOpenDmSearch())}
                className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={4} className="font-semibold text-xs">
              {t('Buat Group DM / Mulai DM')}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Direct Messages List */}
        {(() => {
          if (!currentUser) {
            return (
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
            );
          }

          const seen = new Set<string>();
          const validDms = dmChannels.filter((dm) => {
            const name = (dm.name || '').toLowerCase().trim();
            const id = String(dm.id || '');
            const dmUserId = String(dm.dmUserId || '');

            // Group DMs are always valid in this list
            if (dm.isGroupDm || id.startsWith('gdm-')) {
              return true;
            }

            if (
              !id.startsWith('dm-') ||
              id === 'dm-u1' ||
              dmUserId === 'u1' ||
              (!dmUserId && (name === 'direct message' || name === 'pengguna')) ||
              dm.type === 'voice' ||
              dm.type === 'forum' ||
              dm.type === 'kanban' ||
              name.includes('general voice') ||
              name === 'pengguna anticeil'
            ) {
              return false;
            }

            // Filter out orphaned/dummy fallback entries with generic names that have no valid member
            if (name === 'pengguna' || name === 'direct message') {
              const hasMatchingMember = members.some((m) => {
                if (m.id === currentUser?.id) return false;
                return (dmUserId && m.id === dmUserId) || (m.id && id.includes(m.id));
              });
              if (!hasMatchingMember) return false;
            }
            const nameKey = `name-${name}`;
            const userKey = dmUserId ? `user-${dmUserId}` : null;
            if (seen.has(nameKey) || (userKey && seen.has(userKey))) return false;
            seen.add(nameKey);
            if (userKey) seen.add(userKey);
            return true;
          });

          if (validDms.length === 0) {
            return (
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
            );
          }

          return (
            <div className="space-y-0.5">
              {validDms.map((dm) => {
                const isActiveDm = activeChannelId === dm.id;
                const isGroup = Boolean(dm.isGroupDm || dm.id.startsWith('gdm-'));

                const isSelf = (user: any): boolean => {
                  if (!user || !currentUser) return false;
                  const myId = currentUser.id ? String(currentUser.id) : '';
                  const myEmail = (currentUser.email || '').toLowerCase().trim();
                  const myName = (
                    currentUser.name ||
                    `${currentUser.firstName || ''} ${currentUser.lastName || ''}`
                  )
                    .toLowerCase()
                    .trim();
                  const myUsername = (currentUser.username || '').toLowerCase().trim();

                  const uid = user.id ? String(user.id) : '';
                  const uemail = (user.email || '').toLowerCase().trim();
                  const uname = (user.name || user.displayName || user.firstName || '')
                    .toLowerCase()
                    .trim();
                  const uusername = (user.username || '').toLowerCase().trim();

                  if (myId && uid && myId === uid) return true;
                  if (myEmail && uemail && myEmail === uemail) return true;
                  if (myUsername && uusername && myUsername === uusername) return true;
                  if (myName && uname && myName === uname) return true;
                  return false;
                };

                let otherUserId: string | null = null;
                if (dm.dmUserId && !isSelf({ id: dm.dmUserId })) {
                  otherUserId = String(dm.dmUserId);
                }
                if (!otherUserId && dm.id?.startsWith('dm-')) {
                  const parts = dm.id.slice(3).split('-').filter(Boolean);
                  const peerPart = parts.find((p: string) => !isSelf({ id: p }) && p !== 'chat');
                  if (peerPart) otherUserId = peerPart;
                }

                const isGenericDmName =
                  !dm.name ||
                  dm.name.toLowerCase() === 'direct message' ||
                  dm.name.toLowerCase() === 'pesan langsung' ||
                  isSelf({ name: dm.name });

                const member = isGroup
                  ? null
                  : members.find((m) => {
                      if (isSelf(m)) return false;
                      if (otherUserId && String(m.id) === otherUserId) return true;
                      if (!isGenericDmName && dm.name) {
                        const mName = (m.name || '').toLowerCase();
                        const mUser = (m.username || '').toLowerCase();
                        const dName = dm.name.toLowerCase();
                        return mName === dName || mUser === dName;
                      }
                      return false;
                    });

                // Fallback avatar lookup from cached community messages if member avatar is not in active memory
                let cachedMessageAvatar: string | undefined;
                try {
                  if (typeof window !== 'undefined') {
                    const rawMsgs = localStorage.getItem('anticeil_colony_messages_v3');
                    if (rawMsgs) {
                      const msgsMap = JSON.parse(rawMsgs);
                      const channelMsgs = msgsMap[dm.id];
                      if (Array.isArray(channelMsgs)) {
                        for (let i = channelMsgs.length - 1; i >= 0; i--) {
                          const msg = channelMsgs[i];
                          if (
                            msg?.senderAvatar &&
                            !isSelf({ id: msg.senderId, name: msg.senderName, username: msg.senderUsername })
                          ) {
                            cachedMessageAvatar = msg.senderAvatar;
                            break;
                          }
                        }
                      }
                      if (!cachedMessageAvatar && !isGenericDmName && dm.name) {
                        const searchName = dm.name.toLowerCase().trim();
                        for (const list of Object.values(msgsMap) as any[]) {
                          if (!Array.isArray(list)) continue;
                          for (let i = list.length - 1; i >= 0; i--) {
                            const msg = list[i];
                            if (
                              msg?.senderAvatar &&
                              msg.senderName &&
                              !isSelf({ id: msg.senderId, name: msg.senderName, username: msg.senderUsername }) &&
                              (msg.senderName.toLowerCase() === searchName ||
                                msg.senderName.toLowerCase().startsWith(searchName) ||
                                searchName.startsWith(msg.senderName.toLowerCase()))
                            ) {
                              cachedMessageAvatar = msg.senderAvatar;
                              break;
                            }
                          }
                          if (cachedMessageAvatar) break;
                        }
                      }
                    }
                  }
                } catch {}

                const myAvatar = currentUser?.imageUrl || currentUser?.avatar || null;
                const candidateAvatars = [
                  member?.avatar,
                  (member as any)?.imageUrl,
                  (dm as any).recipientAvatar,
                  (dm as any).avatar,
                  (dm as any).imageUrl,
                  (dm as any).dmUserAvatar,
                  (dm as any).icon,
                  cachedMessageAvatar,
                ].filter(Boolean);

                const resolvedImageUrl =
                  candidateAvatars.find((av) => !myAvatar || av !== myAvatar) || undefined;

                return (
                  <div
                    key={dm.id}
                    onClick={() => {
                      setActiveChannelId(dm.id);
                      onItemClick?.();
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all text-left group cursor-pointer',
                      isActiveDm
                        ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
                        : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    )}
                  >
                    {isGroup ? (
                      <div className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                        <Users className="w-3 h-3" />
                      </div>
                    ) : (
                      <CommunityAvatar
                        name={member?.name || member?.username || dm.name || 'Pengguna'}
                        imageUrl={resolvedImageUrl}
                        size={20}
                        status={member?.status || (dm as any).status || (!isSelf(dm) ? 'online' : undefined)}
                        showStatus={Boolean(member?.status || (dm as any).status || !isSelf(dm))}
                      />
                    )}
                    <span className="truncate flex-1">{isGroup ? dm.name : (member?.name || member?.username || dm.name)}</span>
                    {isGroup && dm.dmUserIds && dm.dmUserIds.length > 0 && (
                      <span className="text-[10px] text-muted-foreground/70 font-semibold px-1 rounded bg-muted/40 shrink-0">
                        {dm.dmUserIds.length}
                      </span>
                    )}
                    {activeCallCounts[dm.id] && activeCallCounts[dm.id] > 0 ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 flex items-center gap-1 shrink-0 animate-pulse">
                        <Radio className="w-2.5 h-2.5" />
                        {activeCallCounts[dm.id]}
                      </span>
                    ) : null}
                    {onCloseDM && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCloseDM(dm.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-sidebar hover:text-foreground text-muted-foreground/60 transition-opacity shrink-0"
                        title={isGroup ? t('Tinggalkan Grup') : t('Tutup Percakapan')}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </>
  );
}
