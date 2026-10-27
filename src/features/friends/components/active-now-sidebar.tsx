import React from 'react';
import { CommunityAvatar } from '@/chat/messages-avatar';
import { useTranslation } from '@/core/i18n';
import type { FriendMember } from '../types';

interface ActiveNowSidebarProps {
  onlineFriends: FriendMember[];
  onStartDM: (member: FriendMember) => void;
  horizontalPadding?: string;
}

export function ActiveNowSidebar({
  onlineFriends,
  onStartDM,
  horizontalPadding = 'px-4',
}: ActiveNowSidebarProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`hidden xl:flex flex-col w-80 border-l border-sidebar-border ${horizontalPadding} py-4 bg-[#000000] shrink-0`}
    >
      <h3 className="text-sm font-bold text-white mb-4">{t('Sedang Aktif')}</h3>
      {onlineFriends.length === 0 ? (
        <div className="py-8 px-2 text-center">
          <p className="text-sm font-semibold text-white mb-1.5">{t('Saat ini sepi...')}</p>
          <p className="text-xs text-[#949ba4] leading-relaxed max-w-[240px] mx-auto">
            {t('Saat teman Anda online atau berkolaborasi di proyek, status mereka akan muncul di sini!')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {onlineFriends.slice(0, 5).map((f) => (
            <div
              key={f.id}
              onClick={() => onStartDM(f)}
              className="p-3 rounded-xl bg-[#111214] hover:bg-[#1e1f22] border border-white/5 transition-colors cursor-pointer group"
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
