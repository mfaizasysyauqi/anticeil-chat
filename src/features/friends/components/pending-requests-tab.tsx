import React from 'react';
import { Inbox, UserCheck, UserX, X } from 'lucide-react';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { EmptyState } from '@/components/ui/empty';
import { useTranslation } from '@/core/i18n';
import { PageSectionHeader } from '@/components/ui/page-section-header';
import type { FriendRequest } from '../types';

interface PendingRequestsTabProps {
  friendRequests: FriendRequest[];
  onAcceptRequest: (req: FriendRequest) => void;
  onRejectRequest: (req: FriendRequest) => void;
  onCancelRequest: (req: FriendRequest) => void;
}

export function PendingRequestsTab({
  friendRequests,
  onAcceptRequest,
  onRejectRequest,
  onCancelRequest,
}: PendingRequestsTabProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full">
      <PageSectionHeader
        icon={Inbox}
        title={t('Tertunda')}
        count={friendRequests.length}
        className="mb-3"
      />

      {friendRequests.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-8 h-8 stroke-[1.8]" />}
          title={t('Tidak Ada Permintaan Tertunda')}
          description={t('Saat seseorang mengirimkan permintaan pertemanan, permintaannya akan muncul di sini.')}
        />
      ) : (
        <div className="space-y-1">
          {friendRequests.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/40 border-t border-border/40 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <CommunityAvatar name={req.name} imageUrl={req.avatar} size={40} />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-foreground truncate">{req.name}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {req.username ? `@${req.username} • ` : ''}
                    {req.direction === 'incoming'
                      ? t('Permintaan Pertemanan Masuk')
                      : t('Permintaan Pertemanan Keluar')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Tooltip delayDuration={150}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onAcceptRequest(req)}
                      className="size-9 rounded-full bg-emerald-500/10 hover:bg-emerald-600 text-emerald-500 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={4} className="font-semibold text-xs">
                    {t('Terima')}
                  </TooltipContent>
                </Tooltip>

                <Tooltip delayDuration={150}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => (req.direction === 'incoming' ? onRejectRequest(req) : onCancelRequest(req))}
                      className="size-9 rounded-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      {req.direction === 'incoming' ? <UserX className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={4} className="font-semibold text-xs">
                    {req.direction === 'incoming' ? t('Tolak') : t('Batalkan')}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
