import React, { useMemo } from 'react';
import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { CommunityMember } from '@/chat/chat-types';
import { cn } from '@/lib/utils';
import { RoleBadge } from './role-badge';

export interface ServerMembersSidebarProps {
  displayMembers: CommunityMember[];
  onInviteClick: () => void;
  onStartDM: (member: CommunityMember) => void;
  t: (key: string) => string;
}

export function ServerMembersSidebar({
  displayMembers,
  onInviteClick,
  onStartDM,
  t,
}: ServerMembersSidebarProps) {
  const roleGroups = useMemo(
    () => [
      {
        key: 'owner',
        title: t('Pemilik Server'),
        filter: (m: CommunityMember) => m.role === 'owner',
      },
      {
        key: 'admin',
        title: t('Admin Server'),
        filter: (m: CommunityMember) => m.role === 'admin',
      },
      {
        key: 'bot',
        title: t('Bot & Integrasi'),
        filter: (m: CommunityMember) => m.role === 'bot',
      },
      {
        key: 'online',
        title: t('Online'),
        filter: (m: CommunityMember) =>
          m.role !== 'owner' && m.role !== 'admin' && m.role !== 'bot' && m.status !== 'offline',
      },
      {
        key: 'offline',
        title: t('Offline'),
        filter: (m: CommunityMember) =>
          m.role !== 'owner' && m.role !== 'admin' && m.role !== 'bot' && m.status === 'offline',
      },
    ],
    [t],
  );

  return (
    <div className="flex flex-col h-full bg-sidebar border-l border-sidebar-border select-none w-60 shrink-0 overflow-hidden">
      {/* Header: NON-SCROLLABLE APP BAR */}
      <div className="h-12 border-b border-sidebar-border px-4 flex items-center justify-between font-semibold text-xs text-muted-foreground uppercase tracking-wider shrink-0 bg-sidebar z-10">
        <span>
          {t('Anggota Server')} ({displayMembers.length})
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={onInviteClick}
          title={t('Undang Anggota')}
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Members List: SCROLLABLE DAFTAR ANGGOTA */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 [scrollbar-width:thin]">
        {displayMembers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center py-8">
            <Users className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground/60">{t('Belum ada anggota')}</p>
          </div>
        ) : (
          roleGroups.map((r) => {
            const matchedMembers = displayMembers.filter(r.filter);
            if (matchedMembers.length === 0) return null;

            return (
              <div key={r.key} className="mb-4">
                <div className="px-2 mb-1.5 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider flex items-center justify-between">
                  <span>{r.title}</span>
                  <span>{matchedMembers.length}</span>
                </div>
                <div className="space-y-0.5">
                  {matchedMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => onStartDM(member)}
                      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors hover:bg-sidebar-accent group cursor-pointer"
                    >
                      <CommunityAvatar
                        name={member.name}
                        imageUrl={member.avatar}
                        size={28}
                        status={member.status}
                        showStatus
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'text-xs font-medium truncate',
                              member.status === 'offline'
                                ? 'text-muted-foreground/60'
                                : 'text-foreground group-hover:text-primary',
                            )}
                          >
                            {member.name}
                          </span>
                          <RoleBadge role={member.role} roleLabel={member.roleLabel} />
                        </div>
                        {member.username && (
                          <span className="text-[10px] text-muted-foreground/60 truncate font-mono leading-none mt-0.5">
                            @{member.username}
                          </span>
                        )}
                        {member.customStatus && (
                          <span className="text-[10px] text-muted-foreground/70 truncate">
                            {member.customStatus}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
