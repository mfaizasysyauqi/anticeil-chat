import React, { useState } from 'react';
import { Plus, Users, Globe, UserPlus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import type { CommunityHub } from '@/lib/community-hubs';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { ServerIcon } from './server-icon';
import { toast } from 'sonner';

export interface ServerRailProps {
  servers?: CommunityHub[];
  hubs?: CommunityHub[];
  activeServerId?: string;
  activeHubId?: string;
  unreadCounts?: Record<string, number | string>;
  onSelectServer?: (serverId: string) => void;
  onSelectHub?: (hubId: string) => void;
  onOpenCreateServer?: () => void;
  onOpenCreateHub?: () => void;
  platformName?: string;
  renderServerIcon?: (server: CommunityHub) => React.ReactNode;
  renderHubIcon?: (hub: CommunityHub) => React.ReactNode;
  railMode?: 'servers' | 'friends';
  onToggleRailMode?: () => void;
  friends?: any[];
  activeChannelId?: string;
  onSelectFriend?: (friend: any) => void;
  onOpenAddFriend?: () => void;
}

function formatUnreadBadge(count: number | string | undefined): string | null {
  if (count === undefined || count === null || count === 0 || count === '0' || count === '') return null;
  if (typeof count === 'string') return count;
  if (count >= 1000) return `${Math.floor(count / 1000)}K+`;
  return String(count);
}

export function ServerRail({
  servers,
  hubs,
  activeServerId,
  activeHubId,
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
}: ServerRailProps) {
  const { t } = useTranslation();

  const [internalMode, setInternalMode] = useState<'servers' | 'friends'>(() => {
    try {
      return (localStorage.getItem('anticeil_rail_mode') as any) || 'servers';
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
      toast.info(next === 'friends' ? t('Beralih ke Mode Teman') : t('Beralih ke Mode Server'));
    }
  };

  const serverList = servers || hubs || [];
  const currentActiveId = activeServerId || activeHubId || '';
  const handleSelect = onSelectServer || onSelectHub || (() => {});
  const handleCreate = onOpenCreateServer || onOpenCreateHub || (() => {});
  const renderIcon = renderServerIcon || renderHubIcon || ((srv) => <ServerIcon hub={srv} />);

  const mainServer = serverList[0];
  const otherServers = serverList.slice(1);
  const friendList = friends || [];

  const mainUnread = mainServer
    ? formatUnreadBadge(
        unreadCounts?.[mainServer.id] ??
          unreadCounts?.['home'] ??
          unreadCounts?.['anticeil'] ??
          mainServer.unreadCount,
      )
    : null;

  return (
    <div id="anticeil-mini-rail" className="w-14 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col items-center select-none z-10 h-full overflow-hidden">
      {/* Top Server (Workspace / Home) - Exactly h-14 to align with top bar */}
      {mainServer && (
        <div className="h-14 w-14 shrink-0 flex items-center justify-center relative group">
          {/* Signature left pill indicator */}
          <span
            className={cn(
              'absolute left-0 w-[4px] bg-foreground rounded-r-full transition-all duration-200',
              currentActiveId === mainServer.id && !activeChannelId?.startsWith('dm-')
                ? 'h-10'
                : mainUnread
                ? 'h-2 group-hover:h-5'
                : 'h-0 group-hover:h-3.5 opacity-80',
            )}
          />

          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleSelect(mainServer.id)}
                className={cn(
                  'relative size-10 flex items-center justify-center font-bold text-xs transition-all duration-200 cursor-pointer shrink-0 rounded-[14px]',
                  currentActiveId === mainServer.id && !activeChannelId?.startsWith('dm-')
                    ? 'bg-primary/20 text-primary border border-primary/40 shadow-xs shadow-primary/10'
                    : 'bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80',
                )}
              >
                {renderIcon(mainServer)}

                {/* Discord-style bottom-right unread badge pill */}
                {mainUnread && (
                  <span className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#da373c] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-sidebar z-20 shadow-md pointer-events-none leading-none tracking-tight animate-in zoom-in-75">
                    {mainUnread}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs">
              {platformName ? `${platformName} (${mainServer.name})` : `${mainServer.name} Workspace`}
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Separator bar */}
      <div className="w-full flex items-center justify-center h-0 relative shrink-0 z-20">
        <div className="w-8 h-[2px] bg-border rounded-full" />
      </div>

      {/* Scrollable lower rail: Switcher, Add (+), then list */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col items-center gap-2 pt-2 pb-16">
        {/* Switcher Button: Servers vs Friends (replaces explore) */}
        <div className="relative group w-full flex items-center justify-center">
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleToggleMode}
                className={cn(
                  'group relative size-10 rounded-[14px] flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 font-bold',
                  isFriendsMode
                    ? 'bg-amber-400 text-black shadow-xs shadow-amber-400/30 hover:bg-amber-300 hover:text-black'
                    : 'bg-sidebar-accent text-amber-400 hover:bg-amber-400 hover:text-black dark:hover:text-black',
                )}
                aria-label={isFriendsMode ? 'Mode Teman. Klik untuk ganti ke Mode Server' : 'Mode Server. Klik untuk ganti ke Mode Teman'}
              >
                {isFriendsMode ? (
                  <Users className="w-5 h-5 transition-transform duration-200 group-hover:scale-110 text-inherit" />
                ) : (
                  <Globe className="w-5 h-5 transition-transform duration-200 group-hover:scale-110 text-inherit" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs">
              {isFriendsMode ? t('Mode: Teman (Klik untuk Mode Server)') : t('Mode: Server (Klik untuk Mode Teman)')}
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
                className={cn(
                  'group relative size-10 rounded-[14px] bg-sidebar-accent flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 font-bold',
                  'text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:text-white',
                )}
              >
                {isFriendsMode ? (
                  <UserPlus className="w-5 h-5 transition-transform duration-200 group-hover:scale-110 text-inherit" />
                ) : (
                  <Plus className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90 text-inherit" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs">
              {isFriendsMode ? t('Tambah Teman Baru') : t('Buat Server Baru')}
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
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-sidebar shadow-xs'
                          : 'hover:opacity-90',
                      )}
                    >
                      <CommunityAvatar
                        name={f.name}
                        imageUrl={f.imageUrl || f.avatar}
                        size={40}
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
                          ? 'bg-primary/20 text-primary border border-primary/40 shadow-xs shadow-primary/10'
                          : 'bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80',
                      )}
                    >
                      {renderIcon(srv)}

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
export const HubRail = ServerRail;
export type HubRailProps = ServerRailProps;
