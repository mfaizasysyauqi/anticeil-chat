import React from 'react';
import { Users } from 'lucide-react';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { EmptyState } from '@/components/ui/empty';
import { useTranslation } from '@/core/i18n';
import { CHANNEL_HORIZONTAL_PADDING, CHANNEL_VERTICAL_PADDING } from '@/lib/layout-constants';
import { cn } from '@/lib/utils';
import type { FriendMember } from '../types';

interface ActiveNowSidebarProps {
  onlineFriends: FriendMember[];
  onStartDM: (member: FriendMember) => void;
  horizontalPadding?: string;
  verticalPadding?: string;
}

export function ActiveNowSidebar({
  onlineFriends,
  onStartDM,
  horizontalPadding = CHANNEL_HORIZONTAL_PADDING,
  verticalPadding = CHANNEL_VERTICAL_PADDING,
}: ActiveNowSidebarProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        'hidden xl:flex flex-col w-80 border-l border-sidebar-border bg-background shrink-0',
        horizontalPadding,
        verticalPadding
      )}
    >
      <h3 className="text-sm font-bold text-foreground mb-4">{t('Sedang Aktif')}</h3>
      {onlineFriends.length === 0 ? (
        <EmptyState
          compact
          icon={<Users className="w-6 h-6 stroke-[1.8] text-primary/80" />}
          title={t('Saat ini sepi...')}
          description={t(
            'Saat teman Anda online atau berkolaborasi di proyek, status mereka akan muncul di sini!'
          )}
        />
      ) : (
        <div className="space-y-2">
          {onlineFriends.slice(0, 5).map((f) => (
            <div
              key={f.id}
              onClick={() => onStartDM(f)}
              className="p-3 rounded-xl bg-card hover:bg-muted border border-border transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <CommunityAvatar
                  name={f.name}
                  imageUrl={f.avatar || f.imageUrl}
                  size={32}
                  status={f.status as any}
                  showStatus
                />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary truncate">
                    {f.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {f.username ? `@${f.username}` : t('Online')}
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground/80 flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500 shrink-0 inline-block" />
                <span className="truncate">{t('Sedang aktif di workspace')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
