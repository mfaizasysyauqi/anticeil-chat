import React, { useState, useMemo } from 'react';
import {
  Inbox,
  CheckCheck,
  Check,
  AtSign,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Video,
  Calendar,
  ListTodo,
  ArrowRight,
  X,
  Clock,
  Sparkles,
  Volume2,
  Gamepad2,
  MessageSquare,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { EmptyState } from '@/components/ui/empty';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { getColonyInitials } from '@/features/colonies/components/colony-icon';
import { useNotifications, type NotificationItem } from '@/features/notifications';
import { useCallLogs, type CallLogItem } from '@/features/calls';
import { useCalendarEvents, type CalendarEvent } from '@/features/calendar';
import { useAssignments, type AssignmentItem } from '@/features/assignments';
import type { Colony } from '@/chat/chat-types';
import type { FriendMember } from '@/features/friends';
import { useTranslation } from '@/core/i18n';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export type InboxTab = 'unread' | 'mentions' | 'calls' | 'scheduled';

export interface InboxPopoverProps {
  notifications?: NotificationItem[];
  unreadNotifCount?: number;
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onJumpToNotification?: (item: any) => void;
  callLogs?: CallLogItem[];
  friends?: FriendMember[];
  colonies?: Colony[];
  onStartCall?: (friend: FriendMember, isVideo?: boolean) => void;
  calendarEvents?: CalendarEvent[];
  assignments?: AssignmentItem[];
  className?: string;
  triggerClassName?: string;
}

export function InboxPopover({
  notifications: propNotifications,
  unreadNotifCount: propUnreadCount,
  onMarkNotificationRead: propMarkRead,
  onMarkAllNotificationsRead: propMarkAllRead,
  onJumpToNotification,
  callLogs: propCallLogs,
  friends = [],
  colonies = [],
  onStartCall,
  calendarEvents: propCalendarEvents,
  assignments: propAssignments,
  className,
  triggerClassName,
}: InboxPopoverProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<InboxTab>('unread');
  const [callsFilter, setCallsFilter] = useState<'all' | 'missed'>('all');

  // Fallback to internal hooks if props are omitted
  const internalNotifs = useNotifications();
  const internalCalls = useCallLogs();
  const internalCalendar = useCalendarEvents();
  const internalAssignments = useAssignments();

  const notifications = propNotifications ?? internalNotifs.notifications;
  const onMarkNotificationRead = propMarkRead ?? internalNotifs.handleMarkAsRead;
  const onMarkAllNotificationsRead = propMarkAllRead ?? internalNotifs.handleMarkAllAsRead;

  const callLogs = propCallLogs ?? internalCalls.calls;
  const calendarEvents = propCalendarEvents ?? internalCalendar.events;
  const assignments = propAssignments ?? internalAssignments.assignments;

  // Counts for tabs & badge
  const unreadCount = propUnreadCount ?? notifications.filter((n) => !n.isRead).length;
  const mentionsCount = useMemo(
    () => notifications.filter((n) => n.type === 'mention' && !n.isRead).length,
    [notifications]
  );
  const missedCallsCount = useMemo(
    () => callLogs.filter((c) => c.type === 'missed').length,
    [callLogs]
  );
  const isTaskCompleted = (a: AssignmentItem) => a.columnId === 'done' || Boolean(a.completedAt);

  const pendingTasksCount = useMemo(
    () => assignments.filter((a) => !isTaskCompleted(a)).length,
    [assignments]
  );

  const totalBadgeCount = unreadCount + missedCallsCount;

  // Filtered Lists
  const unreadItems = useMemo(
    () => notifications.filter((n) => !n.isRead),
    [notifications]
  );

  const mentionItems = useMemo(
    () => notifications.filter((n) => n.type === 'mention'),
    [notifications]
  );

  const filteredCalls = useMemo(() => {
    if (callsFilter === 'missed') {
      return callLogs.filter((c) => c.type === 'missed');
    }
    return callLogs;
  }, [callLogs, callsFilter]);

  const handleItemJump = (item: any) => {
    setIsOpen(false);
    if (onJumpToNotification) {
      onJumpToNotification(item);
    } else {
      // Dispatch custom navigation event for seamless channel jump
      window.dispatchEvent(
        new CustomEvent('anticeil_jump_to_channel', {
          detail: {
            colonyId: item.colonyId || 'anticeil',
            channelId: item.channelId,
            messageId: item.messageId,
          },
        })
      );
    }
  };

  const handleCallback = (call: CallLogItem, isVideo: boolean = false) => {
    setIsOpen(false);
    const peerMatch = friends.find(
      (f) => f.id === call.peerId || f.name.toLowerCase() === call.peerName.toLowerCase()
    );
    if (peerMatch && onStartCall) {
      onStartCall(peerMatch, isVideo);
    } else {
      // Emit voice call initiation event
      window.dispatchEvent(
        new CustomEvent('anticeil_start_call', {
          detail: {
            peerId: call.peerId,
            peerName: call.peerName,
            isVideo,
          },
        })
      );
    }
  };

  const getActionIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'mention':
        return <AtSign className="w-3.5 h-3.5 text-blue-400" />;
      case 'activity':
        return <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'reply':
        return <MessageSquare className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <MessageSquare className="w-3.5 h-3.5 text-primary" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 transition-colors cursor-pointer relative',
                totalBadgeCount > 0
                  ? 'text-foreground'
                  : isOpen
                  ? 'text-foreground bg-accent'
                  : 'text-foreground/70 hover:text-foreground hover:bg-accent/60',
                triggerClassName
              )}
              aria-label={t('Kotak Masuk (Inbox)')}
            >
              <Inbox className="w-4 h-4" />
              {totalBadgeCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#da373c] text-white text-[9px] font-black flex items-center justify-center leading-none shadow-xs border border-card">
                  {totalBadgeCount > 9 ? '9+' : totalBadgeCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6} className="font-semibold text-xs">
          {t('Kotak Masuk (Inbox)')}
        </TooltipContent>
      </Tooltip>

      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        className={cn(
          'w-[420px] sm:w-[480px] max-w-[95vw] h-[520px] max-h-[85vh] p-0 bg-card border border-border text-foreground shadow-2xl rounded-2xl select-none z-50 flex flex-col overflow-hidden',
          className
        )}
      >
        {/* 1. Header: Title & Mark All Read Action */}
        <div className="p-3 px-4 border-b border-border/60 flex items-center justify-between bg-muted/20 shrink-0">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground tracking-tight">{t('Kotak Masuk')}</h2>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllNotificationsRead}
                className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                title={t('Tandai semua telah dibaca')}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px] font-medium">{t('Tandai Dibaca')}</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* 2. Navigation Tabs (Discord Style) */}
        <div className="flex items-center gap-1 p-2 px-3 border-b border-border/50 bg-background/50 overflow-x-auto scrollbar-none shrink-0">
          <button
            onClick={() => setActiveTab('unread')}
            className={cn(
              'px-2.5 py-1 rounded-[6px] text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shrink-0',
              activeTab === 'unread'
                ? 'bg-accent text-accent-foreground font-bold shadow-2xs'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
          >
            <span>{t('Belum Dibaca')}</span>
            {unreadCount > 0 && (
              <span className="min-w-[16px] h-4 px-1 rounded-full bg-[#da373c] text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('mentions')}
            className={cn(
              'px-2.5 py-1 rounded-[6px] text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shrink-0',
              activeTab === 'mentions'
                ? 'bg-accent text-accent-foreground font-bold shadow-2xs'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
          >
            <span>@Mentions</span>
            {mentionsCount > 0 && (
              <span className="min-w-[16px] h-4 px-1 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">
                {mentionsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('calls')}
            className={cn(
              'px-2.5 py-1 rounded-[6px] text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shrink-0',
              activeTab === 'calls'
                ? 'bg-accent text-accent-foreground font-bold shadow-2xs'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
          >
            <span>{t('Panggilan')}</span>
            {missedCallsCount > 0 && (
              <span className="min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {missedCallsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('scheduled')}
            className={cn(
              'px-2.5 py-1 rounded-[6px] text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shrink-0',
              activeTab === 'scheduled'
                ? 'bg-accent text-accent-foreground font-bold shadow-2xs'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
          >
            <span>{t('Terjadwal')}</span>
            {pendingTasksCount > 0 && (
              <span className="min-w-[16px] h-4 px-1 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-bold flex items-center justify-center border border-amber-500/30">
                {pendingTasksCount}
              </span>
            )}
          </button>
        </div>

        {/* 3. Main Body Content */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {/* TAB: UNREADS */}
          {activeTab === 'unread' && (
            <ScrollArea className="flex-1 h-full">
              {unreadItems.length === 0 ? (
                <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
                  <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3 shadow-2xs">
                    <CheckCheck className="w-6 h-6 stroke-[2]" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{t('Semuanya Bersih')}</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                    {t('Anda telah membaca semua pesan dan notifikasi terbaru.')}
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-1.5">
                  {unreadItems.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleItemJump(n)}
                      className="group p-3 rounded-xl bg-card hover:bg-muted/40 border border-border/50 hover:border-primary/40 transition-all cursor-pointer flex items-start gap-3 relative shadow-2xs"
                    >
                      <div className="relative shrink-0">
                        <CommunityAvatar
                          name={n.actorName}
                          imageUrl={n.actorAvatar}
                          size={36}
                          variant="squircle"
                          className="rounded-[10px]"
                        />
                        <div className="absolute -bottom-1 -right-1 size-4 rounded-full bg-background flex items-center justify-center border border-border">
                          {getActionIcon(n.type)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-foreground truncate">
                            {n.actorName}
                          </span>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {dayjs(n.createdAt).fromNow()}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] text-primary font-medium mt-0.5">
                          <span className="truncate">{n.hubName || 'Colony'}</span>
                          <span>•</span>
                          <span className="truncate">#{n.channelName || 'general'}</span>
                        </div>

                        <p className="text-xs text-foreground/90 mt-1 line-clamp-2 leading-relaxed">
                          {n.summary || n.title}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-1 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkNotificationRead(n.id);
                          }}
                          className="h-7 w-7 text-muted-foreground hover:text-emerald-400 cursor-pointer"
                          title={t('Tandai Dibaca')}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-primary cursor-pointer"
                          title={t('Buka')}
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}

          {/* TAB: MENTIONS */}
          {activeTab === 'mentions' && (
            <ScrollArea className="flex-1 h-full">
              {mentionItems.length === 0 ? (
                <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
                  <div className="size-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3 shadow-2xs">
                    <AtSign className="w-6 h-6 stroke-[2]" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{t('Belum Ada Sebutan')}</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                    {t('Saat seseorang menyebut Anda dengan @mention, obrolan tersebut akan terkumpul di sini.')}
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-1.5">
                  {mentionItems.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleItemJump(n)}
                      className={cn(
                        'group p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 relative shadow-2xs',
                        !n.isRead
                          ? 'bg-blue-500/5 border-blue-500/30 hover:border-blue-500/50'
                          : 'bg-card hover:bg-muted/40 border-border/50'
                      )}
                    >
                      <CommunityAvatar
                        name={n.actorName}
                        imageUrl={n.actorAvatar}
                        size={36}
                        variant="squircle"
                        className="rounded-[10px]"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-foreground truncate">
                            {n.actorName}
                          </span>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {dayjs(n.createdAt).fromNow()}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] text-blue-400 font-medium mt-0.5">
                          <span className="truncate">{n.hubName || 'Colony'}</span>
                          <span>•</span>
                          <span className="truncate">#{n.channelName || 'general'}</span>
                        </div>

                        <p className="text-xs text-foreground/90 mt-1 line-clamp-2 leading-relaxed">
                          {n.summary || n.title}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-1 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-primary cursor-pointer"
                          title={t('Buka')}
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}

          {/* TAB: CALLS */}
          {activeTab === 'calls' && (
            <div className="flex-1 flex flex-col h-full min-h-0">
              {/* Calls Sub-filter */}
              <div className="flex items-center gap-1 p-2 px-3 border-b border-border/40 bg-muted/10 shrink-0">
                <button
                  onClick={() => setCallsFilter('all')}
                  className={cn(
                    'px-2 py-0.5 rounded-[4px] text-[11px] font-semibold cursor-pointer transition-colors',
                    callsFilter === 'all'
                      ? 'bg-accent text-accent-foreground font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t('Semua')}
                </button>
                <button
                  onClick={() => setCallsFilter('missed')}
                  className={cn(
                    'px-2 py-0.5 rounded-[4px] text-[11px] font-semibold cursor-pointer transition-colors flex items-center gap-1',
                    callsFilter === 'missed'
                      ? 'bg-accent text-accent-foreground font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span>{t('Terlewat')}</span>
                  {missedCallsCount > 0 && (
                    <span className="size-3.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {missedCallsCount}
                    </span>
                  )}
                </button>
              </div>

              <ScrollArea className="flex-1 h-full">
                {filteredCalls.length === 0 ? (
                  <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
                    <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3 shadow-2xs">
                      <Phone className="w-6 h-6 stroke-[2]" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">
                      {callsFilter === 'missed' ? t('Tidak Ada Panggilan Terlewat') : t('Belum Ada Riwayat')}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                      {t('Riwayat panggilan suara dan video akan ditampilkan di sini.')}
                    </p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1.5">
                    {filteredCalls.map((call) => {
                      const isMissed = call.type === 'missed';
                      const isIncoming = call.type === 'incoming';
                      const rawAvatar = call.peerAvatar;
                      const validAvatar =
                        rawAvatar && !rawAvatar.includes('logo.png') && !rawAvatar.includes('logo.svg')
                          ? rawAvatar
                          : null;

                      return (
                        <div
                          key={call.id}
                          className="group p-2.5 rounded-xl bg-card hover:bg-muted/40 border border-border/50 hover:border-primary/40 transition-all flex items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0">
                              <CommunityAvatar
                                name={call.peerName}
                                imageUrl={validAvatar}
                                size={36}
                                variant="squircle"
                                className="rounded-[10px]"
                              />
                              <div
                                className={cn(
                                  'absolute -bottom-1 -right-1 size-4 rounded-full flex items-center justify-center border border-background text-[9px]',
                                  isMissed
                                    ? 'bg-red-500 text-white'
                                    : isIncoming
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-blue-500 text-white'
                                )}
                              >
                                {isMissed ? (
                                  <PhoneMissed className="w-2.5 h-2.5" />
                                ) : isIncoming ? (
                                  <PhoneIncoming className="w-2.5 h-2.5" />
                                ) : (
                                  <PhoneOutgoing className="w-2.5 h-2.5" />
                                )}
                              </div>
                            </div>

                            <div className="min-w-0">
                              <span
                                className={cn(
                                  'text-xs font-bold truncate block',
                                  isMissed ? 'text-red-400' : 'text-foreground'
                                )}
                              >
                                {call.peerName}
                              </span>
                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                                <span>
                                  {isMissed
                                    ? t('Panggilan Terlewat')
                                    : isIncoming
                                    ? t('Panggilan Masuk')
                                    : t('Panggilan Keluar')}
                                </span>
                                {call.duration && (
                                  <>
                                    <span>•</span>
                                    <span>{call.duration}</span>
                                  </>
                                )}
                                <span>•</span>
                                <span>{dayjs(call.timestamp).fromNow()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="icon-xs"
                              variant="outline"
                              onClick={() => handleCallback(call, false)}
                              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:border-primary/50 cursor-pointer"
                              title={t('Panggilan Suara')}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon-xs"
                              variant="outline"
                              onClick={() => handleCallback(call, true)}
                              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:border-primary/50 cursor-pointer"
                              title={t('Panggilan Video')}
                            >
                              <Video className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* TAB: SCHEDULED / TASKS */}
          {activeTab === 'scheduled' && (
            <ScrollArea className="flex-1 h-full">
              {calendarEvents.length === 0 && assignments.length === 0 ? (
                <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
                  <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 shadow-2xs">
                    <Calendar className="w-6 h-6 stroke-[2]" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{t('Tidak Ada Jadwal Tertunda')}</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                    {t('Semua tugas dan agenda operasional komunitas telah selesai.')}
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-3">
                  {/* Calendar Events Section */}
                  {calendarEvents.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 px-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>{t('Agenda Mendatang')} ({calendarEvents.length})</span>
                      </div>
                      {calendarEvents.slice(0, 5).map((ev) => (
                        <div
                          key={ev.id}
                          className="p-2.5 rounded-xl bg-card border border-border/50 flex items-center justify-between gap-2 shadow-2xs"
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-foreground truncate block">
                              {ev.title}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                              <Clock className="w-3 h-3 text-primary" />
                              <span>{dayjs(ev.startTime).format('DD MMM, HH:mm')}</span>
                              {ev.channelName && (
                                <>
                                  <span>•</span>
                                  <span>#{ev.channelName}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Assignments Section */}
                  {assignments.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-1.5 px-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        <ListTodo className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{t('Tugas Saya')} ({assignments.length})</span>
                      </div>
                      {assignments.slice(0, 5).map((asg) => {
                        const isDone = isTaskCompleted(asg);
                        return (
                          <div
                            key={asg.id}
                            className="p-2.5 rounded-xl bg-card border border-border/50 flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <div className="min-w-0">
                              <span
                                className={cn(
                                  'text-xs font-semibold truncate block',
                                  isDone ? 'line-through text-muted-foreground' : 'text-foreground'
                                )}
                              >
                                {asg.title}
                              </span>
                              {asg.dueDate && (
                                <span className="text-[10px] text-muted-foreground block mt-0.5">
                                  {t('Tenggat')}: {dayjs(asg.dueDate).format('DD MMM YYYY')}
                                </span>
                              )}
                            </div>

                            <span
                              className={cn(
                                'text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider shrink-0',
                                isDone
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-muted text-muted-foreground border border-border'
                              )}
                            >
                              {isDone ? t('Selesai') : t('Tertunda')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
