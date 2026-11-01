import React, { useState } from 'react';
import { Search, ChevronDown, X, UserX, Ban } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { colonyApi } from '@/chat/chat-api';
import { toast } from 'sonner';
import type { Colony, ColonyMember } from '@/chat/chat-types';

interface MembersTabProps {
  activeColony: Colony;
  currentUser: ColonyMember | null;
  members: ColonyMember[];
  onUpdateMembers?: (updater: (prev: ColonyMember[]) => ColonyMember[]) => void;
  onInitiateBan: (member: ColonyMember) => void;
  t: (key: string) => string;
}

export function MembersTab({
  activeColony,
  currentUser,
  members,
  onUpdateMembers,
  onInitiateBan,
  t,
}: MembersTabProps) {
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  const filteredMembers = members.filter(
    (m) =>
      !memberSearchQuery ||
      m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearchQuery.toLowerCase()),
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">{t('Anggota Colony')}</h2>
      <p className="text-sm text-muted-foreground mb-4">
        {t('Kelola hak akses peran, keluarkan, atau blokir anggota colony.')}
      </p>

      {/* Search & Filter */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={memberSearchQuery}
          onChange={(e) => setMemberSearchQuery(e.target.value)}
          placeholder="Cari nama atau email anggota..."
          className="pl-9 text-xs"
        />
      </div>

      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {filteredMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{t('Tidak ada anggota yang cocok.')}</p>
        ) : (
          filteredMembers.map((m) => {
            const isMe = m.id === currentUser?.id || m.email === currentUser?.email;
            return (
              <div
                key={m.id}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg border bg-card/40 hover:bg-muted/40 transition-colors"
              >
                <CommunityAvatar name={m.name} imageUrl={m.avatar} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    {isMe && (
                      <Badge variant="secondary" className="text-[9px] py-0 px-1">
                        {t('Anda')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                </div>

                {/* Role dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs capitalize gap-1">
                      {m.role}
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {(['owner', 'admin', 'moderator', 'member'] as const).map((r) => (
                      <DropdownMenuItem
                        key={r}
                        onClick={async () => {
                          onUpdateMembers?.((prev) =>
                            prev.map((item) => (item.id === m.id ? { ...item, role: r } : item)),
                          );
                          await colonyApi.updateMemberRole(activeColony.id, m.id, r);
                          toast.success(t(`Peran ${m.name} diubah menjadi ${r}`));
                        }}
                        className="capitalize cursor-pointer"
                      >
                        {r}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Kick / Ban actions */}
                {!isMe && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <X className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={async () => {
                          onUpdateMembers?.((prev) => prev.filter((item) => item.id !== m.id));
                          await colonyApi.kickMember(activeColony.id, m.id);
                          toast.success(t(`${m.name} dikeluarkan dari colony`));
                        }}
                        className="text-red-500 cursor-pointer"
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        {t('Keluarkan (Kick)')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onInitiateBan(m)}
                        className="text-red-600 cursor-pointer"
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        {t('Blokir (Ban)')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
