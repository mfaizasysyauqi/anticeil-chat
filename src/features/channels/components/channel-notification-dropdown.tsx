import React from 'react';
import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ChannelNotificationSettings {
  isMuted?: boolean;
  level?: 'default' | 'all' | 'mentions' | 'nothing';
  mutedUntil?: string | null;
}

export interface ChannelNotificationDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelNotification: ChannelNotificationSettings;
  onUpdateNotification: (
    level?: 'default' | 'all' | 'mentions' | 'nothing',
    isMuted?: boolean,
    duration?: string | null,
  ) => void;
}

export function ChannelNotificationDropdown({
  open,
  onOpenChange,
  channelNotification,
  onUpdateNotification,
}: ChannelNotificationDropdownProps) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 transition-colors cursor-pointer",
            channelNotification.isMuted
              ? "text-red-400 hover:text-red-300"
              : open
              ? "text-white bg-white/10"
              : "text-[#b5bac1] hover:text-[#dbdee1] hover:bg-white/5"
          )}
          title={channelNotification.isMuted ? "Channel Muted" : "Notification Settings"}
        >
          <Bell className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="w-[240px] bg-[#111214] border border-[#2b2d31] text-[#dbdee1] rounded-2xl p-2 shadow-2xl z-50"
      >
        {/* Mute Channel with Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg hover:bg-[#2b2d31] hover:text-white cursor-pointer transition-colors">
            <span className={channelNotification.isMuted ? "text-red-400" : ""}>
              {channelNotification.isMuted ? "Saluran Dibisukan" : "Mute Channel"}
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-[180px] bg-[#111214] border border-[#2b2d31] text-[#dbdee1] rounded-xl p-1 shadow-2xl">
            {channelNotification.isMuted ? (
              <DropdownMenuItem
                onClick={() => onUpdateNotification(undefined, false, null)}
                className="px-3 py-2 text-xs font-medium rounded-lg hover:bg-[#2b2d31] text-emerald-400 cursor-pointer"
              >
                Bunyikan Saluran (Unmute)
              </DropdownMenuItem>
            ) : (
              [
                { label: 'Until I turn it back on', duration: null },
                { label: 'For 15 minutes', duration: '15m' },
                { label: 'For 1 Hour', duration: '1h' },
                { label: 'For 3 Hours', duration: '3h' },
                { label: 'For 8 Hours', duration: '8h' },
                { label: 'For 24 Hours', duration: '24h' },
              ].map((item) => (
                <DropdownMenuItem
                  key={item.label}
                  onClick={() => onUpdateNotification(undefined, true, item.duration)}
                  className="px-3 py-2 text-xs font-medium rounded-lg hover:bg-[#2b2d31] hover:text-white cursor-pointer"
                >
                  {item.label}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator className="my-1.5 bg-white/10" />

        {/* Radio Items */}
        <div className="space-y-1">
          {[
            {
              key: 'default',
              title: 'Use Category Default',
              subtitle: 'All Messages',
            },
            {
              key: 'all',
              title: 'All Messages',
            },
            {
              key: 'mentions',
              title: 'Only @mentions',
            },
            {
              key: 'nothing',
              title: 'Nothing',
            },
          ].map((opt) => {
            const isSelected = (channelNotification.level || 'default') === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onUpdateNotification(opt.key as any)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#2b2d31] transition-colors text-left cursor-pointer group"
              >
                <div>
                  <span className="text-xs font-bold text-white block">
                    {opt.title}
                  </span>
                  {opt.subtitle && (
                    <span className="text-[10px] text-[#949ba4] block">
                      {opt.subtitle}
                    </span>
                  )}
                </div>

                {/* Radio Dot */}
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                  isSelected ? "border-primary bg-primary text-primary-foreground" : "border-[#4e5058] group-hover:border-[#949ba4]"
                )}>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
