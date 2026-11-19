import React, { useState } from 'react';
import { Plus, Users, Globe, UserPlus, Compass, LayoutGrid, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AnticeilLogo } from '@/components/ui/anticeil-logo';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import type { Colony } from '@/lib/colony';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { ServerIcon } from './colony-icon';
import { toast } from 'sonner';

export interface ColonyRailProps {
  servers?: Colony[];
  colonies?: Colony[];
  activeServerId?: string;
  activeColonyId?: string;
  unreadCounts?: Record<string, number | string>;
  onSelectServer?: (serverId: string) => void;
  onSelectHub?: (colonyId: string) => void;
  onOpenCreateServer?: () => void;
  onOpenCreateHub?: () => void;
  platformName?: string;
  renderServerIcon?: (server: Colony) => React.ReactNode;
  renderHubIcon?: (hub: Colony) => React.ReactNode;
  railMode?: 'colonies' | 'servers' | 'friends';
  onToggleRailMode?: () => void;
  friends?: any[];
  activeChannelId?: string;
  onSelectFriend?: (friend: any) => void;
  onOpenAddFriend?: () => void;
  isAiActive?: boolean;
  onSelectAiCenter?: () => void;
  homeView?: string;
}

function formatUnreadBadge(count: number | string | undefined): string | null {
  if (count === undefined || count === null || count === 0 || count === '0' || count === '') return null;
  const num = typeof count === 'string' ? Number(count) : count;
  if (!isNaN(num)) {
    if (num >= 9000) return '9K+';
    if (num >= 1000) return `${Math.floor(num / 1000)}K+`;
    return String(num);
  }
  return String(count);
}

/** Sum all server (non-DM, non-anticeil) unread counts */
function sumServerUnread(counts: Record<string, number | string> | undefined, servers: Colony[]): string | null {
  if (!counts) return null;
  let total = 0;
  for (const srv of servers) {
    const v = counts[srv.id];
    if (!v) continue;
    const n = typeof v === 'string' ? parseInt(v, 10) || 0 : v;
    total += n;
  }
  return formatUnreadBadge(total);
}

/** Sum all DM/friend unread counts */
function sumFriendUnread(counts: Record<string, number | string> | undefined, friends: any[]): string | null {
  if (!counts) return null;
  let total = 0;
  const countedKeys = new Set<string>();

  for (const f of friends) {
    const directKey = f.id;
    const dmKey = `dm-${f.id}`;
    const v = counts[directKey] ?? counts[dmKey];
    if (counts[directKey] !== undefined) countedKeys.add(directKey);
    if (counts[dmKey] !== undefined) countedKeys.add(dmKey);
    if (v) {
      const n = typeof v === 'string' ? parseInt(v, 10) || 0 : v;
      total += n;
    }
  }

  // Also catch any other 'dm-*' unread keys
  for (const [k, v] of Object.entries(counts)) {
    if (k.startsWith('dm-') && !countedKeys.has(k)) {
      const n = typeof v === 'string' ? parseInt(v, 10) || 0 : v;
      total += n;
    }
  }

  return formatUnreadBadge(total);
}

export function ColonyRail({
  servers,
  colonies,
  activeServerId,
  activeColonyId,
  unreadCounts,
  onSelectServer,
  onSelectHub,
  onOpenCreateServer,
  onOpenCreateHub,
  platformName,
  renderServerIcon,
  renderHubIcon,
  railMode,
  onToggleRailMode,
  friends = [],
  activeChannelId,
  onSelectFriend,
  onOpenAddFriend,
  isAiActive,
  onSelectAiCenter,
  homeView,
}: ColonyRailProps) {
  const { t } = useTranslation();

  const [internalMode, setInternalMode] = useState<'colonies' | 'servers' | 'friends'>(() => {
    try {
      return (localStorage.getItem('anticeil_rail_mode') as any) || 'colonies';
    } catch {
      return 'servers';
    }
  });

  const mode = railMode || internalMode;
  const isFriendsMode = mode === 'friends';

  const handleToggleMode = () => {
    if (onToggleRailMode) {
      onToggleRailMode();
    } else {
      const next = isFriendsMode ? 'servers' : 'friends';
      setInternalMode(next);
      try {
        localStorage.setItem('anticeil_rail_mode', next);
      } catch {}
      toast.info(next === 'friends' ? t('Beralih ke Mode Teman') : t('Beralih ke Mode Colony'));
    }
  };

  const serverList = servers || colonies || [];
  const currentActiveId = activeServerId || activeColonyId || '';
  const handleSelect = onSelectServer || onSelectHub || (() => {});
  const handleCreate = onOpenCreateServer || onOpenCreateHub || (() => {});
  const renderIcon = (srv: Colony, active?: boolean) => {
    if (renderServerIcon) return renderServerIcon(srv);
    if (renderHubIcon) return renderHubIcon(srv);
    return <ServerIcon hub={srv} isActive={active} />;
  };

  const mainServer = serverList[0];
  const otherServers = serverList.slice(1);
  const friendList = friends || [];

  // Logo Anticeil: ONLY notification count, not chat messages
  const mainUnread = formatUnreadBadge(unreadCounts?.['anticeil'] ?? 0);

  // Switcher badges: total server chats vs total DM chats
  const serverModeBadge = sumServerUnread(unreadCounts, otherServers);
  const friendModeBadge = sumFriendUnread(unreadCounts, friendList);

  const isAiCurrentlyActive =
    Boolean(isAiActive) ||
    (currentActiveId === 'anticeil' && (homeView === 'ai' || !homeView) && !activeChannelId);

  const activeFriendSelected =
    isFriendsMode &&
    friendList.some(
      (f) =>
        activeChannelId === `dm-${f.id}` ||
        (Boolean(activeChannelId?.startsWith('dm-')) && Boolean(activeChannelId?.includes(f.id))),
    );

  const isDirectMessagesActive =
    currentActiveId === 'anticeil' &&
    (homeView !== 'ai' || Boolean(activeChannelId)) &&
    !activeFriendSelected;

  return (
    <div id="anticeil-mini-rail" className="w-14 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col items-center select-none z-10 h-full overflow-hidden">
      {/* 1. Fixed top buttons: AI Command Center (Logo), Hub Fitur (LayoutGrid) with symmetrical gap-2 */}
      <div className="w-full flex flex-col items-center gap-2 pt-2 shrink-0">
        {/* 1. Top Button: Logo Anticeil -> AI Command Center (Halaman Utama) */}
        <div className="relative group w-full flex items-center justify-center">
          <span
            className={cn(
              'absolute left-0 w-[4px] bg-foreground rounded-r-full transition-all duration-200',
              isAiCurrentlyActive
                ? 'h-10'
                : 'h-0 group-hover:h-3.5 opacity-80',
            )}
          />

          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  if (onSelectAiCenter) {
                    onSelectAiCenter();
                  } else {
                    handleSelect('ai-center');
                  }
                }}
                className={cn(
                  'relative size-10 flex items-center justify-center font-bold text-xs transition-all duration-200 cursor-pointer shrink-0 rounded-[14px]',
                  isAiCurrentlyActive
                    ? 'bg-primary/20 text-primary border border-primary/30 shadow-xs'
                    : 'bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-foreground',
                )}
              >
                <AnticeilLogo className="size-6 transition-colors duration-150" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs">
              {t('AI Command Center')}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* 2. Dedicated Button: Direct Messages & Home Activities (Pesan Langsung & Aktivitas) */}
        <div className="relative group w-full flex items-center justify-center">
          <span
            className={cn(
              'absolute left-0 w-[4px] bg-foreground rounded-r-full transition-all duration-200',
              isDirectMessagesActive
                ? 'h-10'
                : mainUnread
                ? 'h-2 group-hover:h-5'
                : 'h-0 group-hover:h-3.5 opacity-80',
            )}
          />

          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleSelect('anticeil')}
                className={cn(
                  'relative size-10 flex items-center justify-center font-bold text-xs transition-all duration-200 cursor-pointer shrink-0 rounded-[14px]',
                  isDirectMessagesActive
                    ? 'bg-primary/20 text-primary border border-primary/30 shadow-xs'
                    : 'bg-sidebar-accent text-muted-foreground hover:bg-sidebar-accent/80 hover:text-foreground',
                )}
              >
                <LayoutGrid className="w-5 h-5 transition-transform duration-200 group-hover:scale-105" />

                {/* Discord-style bottom-right unread badge pill */}
                {mainUnread && (
                  <span className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#da373c] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-sidebar z-20 shadow-md pointer-events-none leading-none tracking-tight animate-in zoom-in-75">
                    {mainUnread}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs">
              {t('Hub Fitur & Pesan Langsung')}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Scrollable lower rail: Switcher, Add (+), then list */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col items-center gap-2 pt-2 pb-16">
        {/* Switcher Button: Servers vs Friends (matches standard server icon aesthetic) */}
        <div className="relative group w-full flex items-center justify-center">
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleToggleMode}
                className={cn(
                  'group relative size-10 rounded-[14px] bg-sidebar-accent hover:bg-sidebar-accent/80 flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 font-bold',
                  isFriendsMode ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
                aria-label={isFriendsMode ? 'Mode Teman. Klik untuk ganti ke Mode Colony' : 'Mode Colony. Klik untuk ganti ke Mode Teman'}
              >
                {isFriendsMode ? (
                  <Users className="w-5 h-5 transition-transform duration-200 group-hover:scale-110 text-foreground" />
                ) : (
                  <Compass className="w-5 h-5 transition-transform duration-200 group-hover:scale-110 text-muted-foreground group-hover:text-foreground" />
                )}

                {/* Badge: total server unreads (when in server mode) or total DM unreads (when in friend mode) */}
                {isFriendsMode
                  ? friendModeBadge && (
                      <span className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#da373c] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-sidebar z-20 shadow-md pointer-events-none leading-none tracking-tight">
                        {friendModeBadge}
                      </span>
                    )
                  : serverModeBadge && (
                      <span className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#da373c] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-sidebar z-20 shadow-md pointer-events-none leading-none tracking-tight">
                        {serverModeBadge}
                      </span>
                    )
                }
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs">
              {isFriendsMode ? t('Mode: Teman (Klik untuk Mode Colony)') : t('Mode: Colony (Klik untuk Mode Teman)')}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Add (+) Button: Add Server vs Add Friend */}
        <div className="relative group w-full flex items-center justify-center">
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={isFriendsMode ? onOpenAddFriend : handleCreate}
                className="group relative size-10 rounded-[14px] bg-sidebar-accent hover:bg-sidebar-accent/80 flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 font-bold text-muted-foreground hover:text-foreground"
              >
                {isFriendsMode ? (
                  <UserPlus className="w-5 h-5 transition-transform duration-200 group-hover:scale-110 text-muted-foreground group-hover:text-foreground" />
                ) : (
                  <Plus className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90 text-muted-foreground group-hover:text-foreground" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs">
              {isFriendsMode ? t('Tambah Teman Baru') : t('Buat Colony Baru')}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Separator before list */}
        {((isFriendsMode && friendList.length > 0) || (!isFriendsMode && otherServers.length > 0)) && (
          <div className="w-8 h-[2px] bg-border rounded-full my-0.5 shrink-0" />
        )}

        {/* Mode-specific list: Friends list OR Servers list */}
        {isFriendsMode ? (
          friendList.map((f) => {
            const isDmActive =
              activeChannelId === `dm-${f.id}` ||
              (Boolean(activeChannelId?.startsWith('dm-')) && Boolean(activeChannelId?.includes(f.id)));
            const friendUnread = formatUnreadBadge(
              unreadCounts?.[f.id] ?? unreadCounts?.[`dm-${f.id}`] ?? f.unreadCount,
            );
            const hasProfileImage = Boolean(f.imageUrl || f.avatar);

            return (
              <div key={f.id} className="relative group w-full flex items-center justify-center">
                <span
                  className={cn(
                    'absolute left-0 w-[4px] bg-foreground rounded-r-full transition-all duration-200',
                    isDmActive
                      ? 'h-10'
                      : friendUnread
                      ? 'h-2 group-hover:h-5'
                      : 'h-0 group-hover:h-3.5 opacity-80',
                  )}
                />

                <Tooltip delayDuration={150}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onSelectFriend?.(f)}
                      className={cn(
                        'relative size-10 flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 rounded-[14px]',
                        isDmActive
                          ? hasProfileImage
                            ? 'ring-2 ring-primary ring-offset-1 ring-offset-sidebar shadow-xs'
                            : 'bg-primary/20 text-primary border border-primary/30 shadow-xs'
                          : 'bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-foreground',
                      )}
                    >
                      <CommunityAvatar
                        name={f.name}
                        imageUrl={f.imageUrl || f.avatar}
                        size={40}
                        isActive={isDmActive}
                        className="rounded-[14px]"
                      />

                      {/* Online Status Dot */}
                      <span
                        className={cn(
                          'absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-sidebar',
                          f.status === 'online'
                            ? 'bg-emerald-500'
                            : f.status === 'idle'
                            ? 'bg-amber-500'
                            : f.status === 'dnd'
                            ? 'bg-red-500'
                            : 'bg-muted-foreground/40',
                        )}
                      />

                      {/* Discord-style bottom-right unread badge pill for friend */}
                      {friendUnread && (
                        <span className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#da373c] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-sidebar z-20 shadow-md pointer-events-none leading-none tracking-tight animate-in zoom-in-75">
                          {friendUnread}
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs">
                    <div>
                      <div className="font-bold">{f.name}</div>
                      <div className="text-[10px] text-muted-foreground capitalize">
                        {f.status || 'Offline'}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            );
          })
        ) : (
          otherServers.map((srv) => {
            const isActive = currentActiveId === srv.id;
            const serverUnread = formatUnreadBadge(unreadCounts?.[srv.id] ?? srv.unreadCount);
            const hasCustomIcon = Boolean(srv.iconUrl);

            return (
              <div key={srv.id} className="relative group w-full flex items-center justify-center">
                <span
                  className={cn(
                    'absolute left-0 w-[4px] bg-foreground rounded-r-full transition-all duration-200',
                    isActive
                      ? 'h-10'
                      : serverUnread
                      ? 'h-2 group-hover:h-5'
                      : 'h-0 group-hover:h-3.5 opacity-80',
                  )}
                />

                <Tooltip delayDuration={150}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleSelect(srv.id)}
                      className={cn(
                        'relative size-10 flex items-center justify-center font-bold text-xs transition-all duration-200 cursor-pointer shrink-0 rounded-[14px]',
                        isActive
                          ? hasCustomIcon
                            ? 'ring-2 ring-primary ring-offset-1 ring-offset-sidebar shadow-xs'
                            : 'bg-primary/20 text-primary border border-primary/30 shadow-xs'
                          : 'bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-foreground',
                      )}
                    >
                      {renderIcon(srv, isActive)}

                      {/* Discord-style bottom-right unread badge pill for server */}
                      {serverUnread && (
                        <span className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#da373c] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-sidebar z-20 shadow-md pointer-events-none leading-none tracking-tight animate-in zoom-in-75">
                          {serverUnread}
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs">
                    {srv.name}
                  </TooltipContent>
                </Tooltip>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Backward-compatible alias

// Backward-compatible alias
export const ServerRail = ColonyRail;
export type ServerRailProps = ColonyRailProps;
