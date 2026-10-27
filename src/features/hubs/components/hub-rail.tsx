import React from 'react';
import { Plus, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import type { CommunityHub } from '@/lib/community-hubs';

interface HubRailProps {
  hubs: CommunityHub[];
  activeHubId: string;
  onSelectHub: (hubId: string) => void;
  onOpenCreateHub: () => void;
  platformName?: string;
  renderHubIcon: (hub: CommunityHub) => React.ReactNode;
}

export function HubRail({
  hubs,
  activeHubId,
  onSelectHub,
  onOpenCreateHub,
  platformName,
  renderHubIcon,
}: HubRailProps) {
  const { t } = useTranslation();
  const mainHub = hubs[0];
  const otherHubs = hubs.slice(1);

  return (
    <div className="w-14 shrink-0 bg-[#000000] border-r border-sidebar-border flex flex-col items-center select-none z-10 h-full overflow-hidden">
      {/* Top Hub (Workspace / Home) - Exactly h-14 to align with top bar */}
      {mainHub && (
        <div className="h-14 w-14 shrink-0 flex items-center justify-center relative group">
          {/* Discord signature left pill indicator */}
          <span
            className={cn(
              'absolute left-0 w-[3px] bg-foreground rounded-r-full transition-all duration-200',
              activeHubId === mainHub.id ? 'h-6' : 'h-0 group-hover:h-3.5 opacity-80'
            )}
          />

          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onSelectHub(mainHub.id)}
                className={cn(
                  'relative size-10 flex items-center justify-center font-bold text-xs transition-all duration-200 cursor-pointer shrink-0 rounded-[14px]',
                  activeHubId === mainHub.id
                    ? 'bg-primary/20 text-primary border border-primary/40 shadow-xs shadow-primary/10'
                    : 'bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80'
                )}
              >
                {renderHubIcon(mainHub)}

                {/* Unread badge pill */}
                {mainHub.unreadCount && mainHub.unreadCount > 0 ? (
                  <span className="absolute -top-1 -right-1 size-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center border-2 border-sidebar">
                    {mainHub.unreadCount}
                  </span>
                ) : null}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs">
              {platformName ? `${platformName} (${mainHub.name})` : `${mainHub.name} Workspace`}
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Discord separator bar */}
      <div className="w-full flex items-center justify-center h-0 relative shrink-0 z-20">
        <div className="w-8 h-[2px] bg-sidebar-border/40 rounded-full" />
      </div>

      {/* Scrollable lower hub rail: other hubs (if any), plus buttons */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col items-center gap-2 pt-2 pb-16">
        {otherHubs.map((hub) => {
          const isActive = activeHubId === hub.id;
          return (
            <div key={hub.id} className="relative group w-full flex items-center justify-center">
              <span
                className={cn(
                  'absolute left-0 w-[3px] bg-foreground rounded-r-full transition-all duration-200',
                  isActive ? 'h-6' : 'h-0 group-hover:h-3.5 opacity-80'
                )}
              />

              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSelectHub(hub.id)}
                    className={cn(
                      'relative size-10 flex items-center justify-center font-bold text-xs transition-all duration-200 cursor-pointer shrink-0 rounded-[14px]',
                      isActive
                        ? 'bg-primary/20 text-primary border border-primary/40 shadow-xs shadow-primary/10'
                        : 'bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80'
                    )}
                  >
                    {renderHubIcon(hub)}

                    {hub.unreadCount && hub.unreadCount > 0 ? (
                      <span className="absolute -top-1 -right-1 size-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center border-2 border-sidebar">
                        {hub.unreadCount}
                      </span>
                    ) : null}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs">
                  {hub.name}
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}

        {/* Add Server (+) Button */}
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <button
              onClick={onOpenCreateHub}
              className="group relative size-10 rounded-[14px] bg-sidebar-accent text-emerald-500 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0"
            >
              <Plus className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs">
            {t('Buat Server Baru')}
          </TooltipContent>
        </Tooltip>

        {/* Discover / Templates Compass */}
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <Link
              to="/templates"
              className="group relative size-10 rounded-[14px] bg-sidebar-accent text-muted-foreground hover:bg-primary hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0"
            >
              <Compass className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs">
            {t('Jelajahi Template Otomasi')}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
