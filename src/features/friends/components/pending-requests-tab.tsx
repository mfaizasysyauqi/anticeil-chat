import React from 'react';
import { Inbox, UserCheck, UserX, X } from 'lucide-react';
import { CommunityAvatar } from '@/chat/messages-avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/core/i18n';
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
      <div className="text-[11px] font-bold text-muted-foreground/80 tracking-wider uppercase mb-3">
        {t('Tertunda')} — {friendRequests.length}
      </div>

      {friendRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Inbox className="w-16 h-16 text-white/20 mb-3 stroke-[1.2]" />
          <p className="text-xs text-muted-foreground font-medium">
            {t('Tidak ada permintaan pertemanan yang tertunda.')}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {friendRequests.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-[#111214] border-t border-white/[0.04] transition-colors group"
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

              {req.direction === 'incoming' ? (
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
                        onClick={() => onRejectRequest(req)}
                        className="size-9 rounded-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={4} className="font-semibold text-xs">
                      {t('Tolak')}
                    </TooltipContent>
                  </Tooltip>
                </div>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <Tooltip delayDuration={150}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onCancelRequest(req)}
                        className="size-9 rounded-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={4} className="font-semibold text-xs">
                      {t('Batalkan')}
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
