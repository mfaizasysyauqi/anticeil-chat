import React from 'react';
import { Plus, Compass } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import type { CommunityHub } from '@/lib/community-hubs';
import { ServerIcon } from './server-icon';

export interface ServerRailProps {
  servers?: CommunityHub[];
  hubs?: CommunityHub[];
  activeServerId?: string;
  activeHubId?: string;
  onSelectServer?: (serverId: string) => void;
  onSelectHub?: (hubId: string) => void;
  onOpenCreateServer?: () => void;
  onOpenCreateHub?: () => void;
  platformName?: string;
  renderServerIcon?: (server: CommunityHub) => React.ReactNode;
  renderHubIcon?: (hub: CommunityHub) => React.ReactNode;
}

export function ServerRail({
  servers,
  hubs,
  activeServerId,
  activeHubId,
  onSelectServer,
  onSelectHub,
  onOpenCreateServer,
  onOpenCreateHub,
  platformName,
  renderServerIcon,
  renderHubIcon,
}: ServerRailProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const isTemplates = location.pathname.startsWith('/templates');

  const serverList = servers || hubs || [];
  const currentActiveId = activeServerId || activeHubId || '';
  const handleSelect = onSelectServer || onSelectHub || (() => {});
  const handleCreate = onOpenCreateServer || onOpenCreateHub || (() => {});
  const renderIcon = renderServerIcon || renderHubIcon || ((srv) => <ServerIcon hub={srv} />);

  const mainServer = serverList[0];
  const otherServers = serverList.slice(1);

  return (
    <div id="anticeil-mini-rail" className="w-14 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col items-center select-none z-10 h-full overflow-hidden">
      {/* Top Server (Workspace / Home) - Exactly h-14 to align with top bar */}
      {mainServer && (
        <div className="h-14 w-14 shrink-0 flex items-center justify-center relative group">
          {/* Signature left pill indicator */}
          <span
            className={cn(
              'absolute left-0 w-[3px] bg-foreground rounded-r-full transition-all duration-200',
              currentActiveId === mainServer.id ? 'h-6' : 'h-0 group-hover:h-3.5 opacity-80'
            )}
          />

          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleSelect(mainServer.id)}
                className={cn(
                  'relative size-10 flex items-center justify-center font-bold text-xs transition-all duration-200 cursor-pointer shrink-0 rounded-[14px]',
                  currentActiveId === mainServer.id
                    ? 'bg-primary/20 text-primary border border-primary/40 shadow-xs shadow-primary/10'
                    : 'bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80'
                )}
              >
                {renderIcon(mainServer)}

                {/* Unread badge pill */}
                {mainServer.unreadCount && mainServer.unreadCount > 0 ? (
                  <span className="absolute -top-1 -right-1 size-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center border-2 border-sidebar">
                    {mainServer.unreadCount}
                  </span>
                ) : null}
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

      {/* Scrollable lower server rail: Explore, Add Server, then other servers */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col items-center gap-2 pt-2 pb-16">
        {/* Discover / Templates Compass (Explore) - placed below Anticeil logo */}
        <div className="relative group w-full flex items-center justify-center">
          <span
            className={cn(
              'absolute left-0 w-[3px] bg-foreground rounded-r-full transition-all duration-200',
              isTemplates ? 'h-6' : 'h-0 group-hover:h-3.5 opacity-80'
            )}
          />

          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <Link
                to="/templates"
                className={cn(
                  'group relative size-10 rounded-[14px] flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 font-bold',
                  isTemplates
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                    : 'bg-sidebar-accent text-amber-500 dark:text-amber-400 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'
                )}
              >
                <Compass className="w-5 h-5 transition-transform duration-200 group-hover:scale-110 text-inherit" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs">
              {t('Jelajahi Template Otomasi')}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Add Server (+) Button - placed below Explore */}
        <div className="relative group w-full flex items-center justify-center">
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                onClick={handleCreate}
                className="group relative size-10 rounded-[14px] bg-sidebar-accent text-emerald-500 dark:text-emerald-400 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 font-bold"
              >
                <Plus className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90 text-inherit" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs">
              {t('Buat Server Baru')}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Separator before other user servers */}
        {otherServers.length > 0 && (
          <div className="w-8 h-[2px] bg-border rounded-full my-0.5 shrink-0" />
        )}

        {/* Other Servers */}
        {otherServers.map((srv) => {
          const isActive = currentActiveId === srv.id;
          return (
            <div key={srv.id} className="relative group w-full flex items-center justify-center">
              <span
                className={cn(
                  'absolute left-0 w-[3px] bg-foreground rounded-r-full transition-all duration-200',
                  isActive ? 'h-6' : 'h-0 group-hover:h-3.5 opacity-80'
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
                        : 'bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80'
                    )}
                  >
                    {renderIcon(srv)}

                    {srv.unreadCount && srv.unreadCount > 0 ? (
                      <span className="absolute -top-1 -right-1 size-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center border-2 border-sidebar">
                        {srv.unreadCount}
                      </span>
                    ) : null}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs">
                  {srv.name}
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Backward-compatible alias
export const HubRail = ServerRail;
export type HubRailProps = ServerRailProps;
