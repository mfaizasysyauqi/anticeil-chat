import React from 'react';
import {
  Volume2,
  Lock,
  Radio,
  UserPlus,
  Settings,
  MessagesSquare,
  Columns3,
  Hash,
  Megaphone,
  Podcast,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ColonyChannel } from '@/chat/chat-types';

export interface SidebarChannelItemProps {
  channel: ColonyChannel;
  activeChannelId: string;
  setActiveChannelId: (id: string) => void;
  activeCallChannelId: string | null;
  setActiveCallChannelId: (id: string | null) => void;
  setIsCallPiP: (pip: boolean) => void;
  activeCallCounts?: Record<string, number>;
  selectedActivityAppId?: string | null;
  threadsMap: Record<string, any[]>;
  channelThreads: any[];
  activeThread: any;
  setActiveThread: (thread: any) => void;
  onItemClick?: () => void;
  onOpenInvite: () => void;
  onOpenEditChannel: (channel: ColonyChannel) => void;
  currentUser?: any;
  requireAuth?: (action: () => void, title?: string, desc?: string) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export const SidebarChannelItem: React.FC<SidebarChannelItemProps> = ({
  channel: ch,
  activeChannelId,
  setActiveChannelId,
  activeCallChannelId,
  setActiveCallChannelId,
  setIsCallPiP,
  activeCallCounts = {},
  selectedActivityAppId,
  threadsMap,
  channelThreads,
  activeThread,
  setActiveThread,
  onItemClick,
  onOpenInvite,
  onOpenEditChannel,
  currentUser,
  requireAuth,
  t,
}) => {
  const isActiveCh = activeChannelId === ch.id;

  const renderActionButtons = () => (
    <div
      className={cn(
        'items-center gap-0.5 ml-auto shrink-0 transition-opacity',
        isActiveCh
          ? 'flex opacity-100'
          : 'flex md:hidden md:group-hover:flex opacity-75 hover:opacity-100 group-hover:opacity-100',
      )}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenInvite();
        }}
        title={t('Buat Undangan')}
        aria-label={t('Buat Undangan')}
        className="p-1 sm:p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted/80 transition-colors"
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
        aria-label={t('Pengaturan Channel')}
        className="p-1 sm:p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted/80 transition-colors"
      >
        <Settings className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  const renderActivityBadge = () => {
    if (
      activeCallChannelId === ch.id &&
      (selectedActivityAppId === 'watch-together' || selectedActivityAppId === 'youtube')
    ) {
      return (
        <div
          className="w-5 h-3.5 bg-white rounded flex items-center justify-center shrink-0 shadow-xs border border-white/20"
          title="Watch Together Aktif"
        >
          <svg className="w-3.5 h-2.5" viewBox="0 0 24 24" fill="none">
            <path
              d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
              fill="#FF0000"
            />
            <polygon fill="#FFFFFF" points="9.545,15.568 15.818,12 9.545,8.432" />
          </svg>
        </div>
      );
    }
    return null;
  };

  if (ch.type === 'voice') {
    const callCount = activeCallCounts[ch.id] || 0;
    const isLimitSet = typeof ch.userLimit === 'number' && ch.userLimit > 0;
    const isFull = isLimitSet && callCount >= (ch.userLimit || 0);

    const handleVoiceClick = () => {
      if (isFull && activeCallChannelId !== ch.id) {
        toast.error(
          t('Saluran suara ini sudah penuh ({{current}}/{{limit}})', {
            current: callCount,
            limit: ch.userLimit,
          }),
        );
        return;
      }

      if (!currentUser && requireAuth) {
        requireAuth(
          () => {
            setActiveChannelId(ch.id);
            setActiveCallChannelId(ch.id);
            setIsCallPiP(false);
            onItemClick?.();
          },
          t('Gabung Panggilan Suara'),
          t('Masuk ke Anticeil untuk bergabung ke saluran suara atau panggilan.'),
        );
        return;
      }
      setActiveChannelId(ch.id);
      setActiveCallChannelId(ch.id);
      setIsCallPiP(false);
      onItemClick?.();
    };

    return (
      <div
        key={ch.id}
        onClick={handleVoiceClick}
        className={cn(
          'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all text-left group cursor-pointer relative',
          isActiveCh
            ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
            : isFull
            ? 'text-muted-foreground/60 hover:bg-sidebar-accent/50 hover:text-muted-foreground'
            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        )}
      >
        <Volume2
          className={cn(
            'w-4 h-4 shrink-0 transition-colors',
            isActiveCh
              ? 'text-primary'
              : isFull
              ? 'text-muted-foreground/40'
              : 'text-muted-foreground/70 group-hover:text-foreground',
          )}
        />
        <span className="truncate flex-1">{ch.name}</span>
        {ch.isPrivate && (
          <span title="Private Channel">
            <Lock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
          </span>
        )}

        {/* User Limit & Active Call Badge (Discord 1:1 Parity) */}
        {isLimitSet ? (
          <span
            className={cn(
              'px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shrink-0 font-mono transition-colors',
              isFull
                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                : callCount > 0
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-muted text-muted-foreground/70 border border-border/40',
            )}
            title={isFull ? t('Saluran suara penuh') : t('Kapasitas peserta saluran suara')}
          >
            {isFull ? (
              <Lock className="w-2.5 h-2.5 text-red-400" />
            ) : callCount > 0 ? (
              <Radio className="w-2.5 h-2.5 animate-pulse" />
            ) : null}
            <span>
              {callCount}/{ch.userLimit}
            </span>
          </span>
        ) : callCount > 0 ? (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 flex items-center gap-1 shrink-0 animate-pulse">
            <Radio className="w-2.5 h-2.5" />
            {callCount}
          </span>
        ) : null}

        {renderActionButtons()}
      </div>
    );
  }

  if (ch.type === 'forum') {
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
              isActiveCh ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground',
            )}
          />
          <span className="truncate flex-1">{ch.name}</span>
          {ch.isPrivate && (
            <span title="Private Channel">
              <Lock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
            </span>
          )}
          {renderActivityBadge()}
          {renderActionButtons()}
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
  }

  if (ch.type === 'kanban') {
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
              isActiveCh ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground',
            )}
          />
          <span className="truncate flex-1">{ch.name}</span>
          {ch.isPrivate && (
            <span title="Private Channel">
              <Lock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
            </span>
          )}
          {renderActionButtons()}
        </div>
      </div>
    );
  }

  // Default: text, announcement, or stage
  const ChannelIcon =
    ch.type === 'announcement' || ch.isAnnouncement
      ? Megaphone
      : ch.type === 'stage'
      ? Podcast
      : Hash;

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
        <ChannelIcon
          className={cn(
            'w-4 h-4 shrink-0 transition-colors',
            isActiveCh ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground',
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 truncate">
            <span className="truncate">{ch.name}</span>
            {ch.type === 'stage' && isActiveCh && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 text-[9px] font-bold shrink-0 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            )}
          </div>
        </div>
        {ch.isPrivate && (
          <span title="Private Channel">
            <Lock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
          </span>
        )}
        {renderActivityBadge()}
        {renderActionButtons()}
      </div>
    </div>
  );
};
