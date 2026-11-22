import React, { useState } from 'react';
import {
  Bell,
  BellOff,
  AtSign,
  MessageSquare,
  Gamepad2,
  CheckCheck,
  Check,
  ArrowRight,
  Menu,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { SidebarNavToggle } from '@/components/ui/sidebar-nav-toggle';
import { EmptyState } from '@/components/ui/empty';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING, CHANNEL_VERTICAL_PADDING, LAYOUT_PAGE_SPACING } from '@/lib/layout-constants';
import { useTranslation } from '@/core/i18n';
import { CommunityAvatar } from '@/chat/chat-avatar';
import type { NotificationItem, NotificationsTab } from '../types';

function formatNotificationDate(dateStr?: string) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Hari ini, ${timeStr}`;
    if (isYesterday) return `Kemarin, ${timeStr}`;
    return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) + `, ${timeStr}`;
  } catch {
    return dateStr;
  }
}

interface NotificationsViewProps {
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: string) => void;
  onJumpToMessage: (item: NotificationItem) => void;
  onOpenSidebar?: () => void;
  horizontalPadding?: string;
  verticalPadding?: string;
  currentUserId?: string;
}

export function NotificationsView({
  notifications,
  onMarkAllAsRead,
  onMarkAsRead,
  onJumpToMessage,
  onOpenSidebar,
  horizontalPadding = CHANNEL_HORIZONTAL_PADDING,
  verticalPadding = CHANNEL_VERTICAL_PADDING,
  currentUserId,
}: NotificationsViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<NotificationsTab>('all');

  const visibleNotifications = notifications.filter((n) => {
    // 0. If user is logged out, never show any notifications
    if (!currentUserId) {
      return false;
    }
    // 1. Never show a notification where current user is the actor (the sender who mentioned someone else)
    if (n.actorId === currentUserId) {
      return false;
    }
    // 2. If target recipients are specified, current user MUST be one of the targets
    const targets = n.targetUserIds || (n.targetUserId ? [n.targetUserId] : []);
    if (targets.length > 0) {
      if (!targets.includes(currentUserId)) return false;
    }
    return true;
  });

  const unreadCount = visibleNotifications.filter((n) => !n.isRead).length;
  const mentionsCount = visibleNotifications.filter((n) => n.type === 'mention').length;

  const filteredNotifications = visibleNotifications.filter((n) => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'mentions') return n.type === 'mention';
    return true;
  });

  const getActionIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'mention':
        return <AtSign className="w-3.5 h-3.5 text-blue-400" />;
      case 'activity':
        return <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'reply':
        return <MessageSquare className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-primary" />;
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 min-w-0 bg-background overflow-hidden select-none">
      {/* Top Header Bar */}
      <div
        className={cn(
          'sticky top-0 z-20 h-12 border-b border-sidebar-border flex items-center justify-between shrink-0 bg-background overflow-hidden',
          horizontalPadding
        )}
      >
        <div className="flex items-center gap-2 shrink-0">
          <SidebarNavToggle onClick={onOpenSidebar} />

          {/* Title & Icon: Hidden on mobile (<sm), shown on tablet & desktop */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">{t('Notifikasi')}</span>
          </div>

          <Separator orientation="vertical" className="hidden sm:block h-4 mx-1 shrink-0" />
        </div>

        {/* Filter Pills */}
        <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto scrollbar-none px-1">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                'px-3 py-1 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0',
                activeTab === 'all'
                  ? 'bg-accent text-accent-foreground shadow-2xs font-bold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <span>{t('Semua')}</span>
              {visibleNotifications.length > 0 && (
                <span className="text-[10px] text-muted-foreground/80">({visibleNotifications.length})</span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('mentions')}
              className={cn(
                'px-3 py-1 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0',
                activeTab === 'mentions'
                  ? 'bg-accent text-accent-foreground shadow-2xs font-bold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <span>@Mentions</span>
              {mentionsCount > 0 && (
                <span className="text-[10px] text-muted-foreground/80">({mentionsCount})</span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('unread')}
              className={cn(
                'px-3 py-1 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0',
                activeTab === 'unread'
                  ? 'bg-accent text-accent-foreground shadow-2xs font-bold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <span>{t('Belum Dibaca')}</span>
              {unreadCount > 0 && (
                <span className="size-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

        {/* Right Action: Mark All as Read */}
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="xs"
            onClick={onMarkAllAsRead}
            className="h-7 text-xs font-medium text-muted-foreground hover:text-foreground gap-1.5 shrink-0"
            title={t('Tandai Semua Sudah Dibaca')}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('Tandai Semua Dibaca')}</span>
          </Button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto max-lg:scrollbar-none custom-scrollbar">
        <div className={cn(LAYOUT_PAGE_SPACING.BODY_HORIZONTAL, verticalPadding, 'space-y-2.5')}>
        {filteredNotifications.length === 0 ? (
          <EmptyState
            icon={<BellOff className="w-8 h-8 stroke-[1.8] text-primary" />}
            title={
              activeTab === 'unread'
                ? t('Tidak ada notifikasi belum dibaca')
                : activeTab === 'mentions'
                  ? t('Belum ada sebutan @mention untuk Anda')
                  : t('Tidak ada notifikasi baru')
            }
            description={t(
              'Semua pembaruan obrolan, mention, dan undangan aktivitas akan terkumpul rapi di sini.'
            )}
          />
        ) : (
          <div className="space-y-2.5">
            {filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => onJumpToMessage(item)}
                className={cn(
                  'relative w-full flex items-start gap-3.5 px-4 py-3.5 rounded-xl border transition-all cursor-pointer group shadow-2xs overflow-hidden',
                  !item.isRead
                    ? 'bg-accent/40 border-primary/30 hover:border-primary/50'
                    : 'bg-card/40 border-border/40 hover:bg-accent/20 hover:border-border/80',
                )}
              >
                {/* Discord-style unread left pill bar */}
                {!item.isRead && (
                  <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-primary rounded-r-full shadow-[0_0_8px_rgba(var(--primary-rgb,59,130,246),0.5)]" />
                )}

                {/* Avatar with type badge */}
                <div className="relative shrink-0">
                  <CommunityAvatar
                    imageUrl={item.actorAvatar}
                    name={item.actorName}
                    className="w-10 h-10 border border-border/50 rounded-full"
                  />
                  {!item.isRead && (
                    <span className="absolute -top-0.5 -left-0.5 size-2.5 rounded-full bg-primary ring-2 ring-background z-10" />
                  )}
                  <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-background border border-border flex items-center justify-center shadow-xs">
                    {getActionIcon(item.type)}
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap text-xs">
                      <span className="font-bold text-foreground hover:underline">
                        {item.actorName}
                      </span>
                      <span className="text-muted-foreground">
                        {item.type === 'mention'
                          ? t('menyebut Anda di')
                          : item.type === 'reply'
                            ? t('membalas pesan Anda di')
                            : item.type === 'activity'
                              ? t('mengundang Anda ke aktivitas')
                              : (item.title?.replace(new RegExp(`^@?${item.actorName}\\s*`, 'i'), '').replace(new RegExp(`\\s*#${item.channelName}$`, 'i'), '') || t('mengirim notifikasi'))}
                      </span>
                      {item.channelName && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                          #{item.channelName}
                        </span>
                      )}
                      {item.hubName && item.hubName.toLowerCase() !== 'anticeil' && (
                        <span className="text-[10px] text-muted-foreground/60">• {item.hubName}</span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground/60 shrink-0">
                      {formatNotificationDate(item.createdAt)}
                    </span>
                  </div>

                  {/* Summary Snippet Box */}
                  <div className="text-xs text-foreground/80 bg-muted/40 border-l-2 border-primary/50 px-2.5 py-1.5 rounded-r mt-1 line-clamp-2">
                    {item.summary}
                  </div>
                </div>

                {/* Action buttons on hover */}
                <div className="flex items-center gap-1 self-center shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead(item.id);
                      }}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title={t('Tandai sudah dibaca')}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className="p-1.5 rounded-md text-primary group-hover:translate-x-0.5 transition-transform">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
