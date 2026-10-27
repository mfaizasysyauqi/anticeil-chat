import React from 'react';
import { MessageSquare } from 'lucide-react';
import { CommunityAvatar } from '@/chat/messages-avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/core/i18n';
import type { FriendMember } from '../types';

interface FriendItemProps {
  member: FriendMember;
  onStartDM: (member: FriendMember) => void;
}

export function FriendItem({ member, onStartDM }: FriendItemProps) {
  const { t } = useTranslation();

  return (
    <div
      onClick={() => onStartDM(member)}
      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#111214] border-t border-white/[0.04] transition-colors group cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0">
        <CommunityAvatar
          name={member.name}
          imageUrl={member.avatar || member.imageUrl}
          size={40}
          status={member.status as any}
          showStatus
        />
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {member.name}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            {member.username
              ? `@${member.username}`
              : member.customStatus || (member.status === 'online' ? t('Online') : t('Offline'))}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <button
              onClick={() => onStartDM(member)}
              className="size-9 rounded-full bg-[#111214] hover:bg-[#1e1f22] hover:text-foreground text-muted-foreground flex items-center justify-center transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={4} className="font-semibold text-xs">
            {t('Pesan')}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
