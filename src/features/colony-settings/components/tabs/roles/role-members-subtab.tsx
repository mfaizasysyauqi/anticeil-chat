import React, { useMemo } from 'react';
import { Search, Users, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { CommunityCustomRole, ColonyMember } from '@/chat/chat-types';

export interface RoleMembersSubtabProps {
  activeRole: CommunityCustomRole | null;
  members: ColonyMember[];
  assignedMemberIds: string[];
  setAssignedMemberIds: React.Dispatch<React.SetStateAction<string[]>>;
  memberSearchInRole: string;
  setMemberSearchInRole: (val: string) => void;
  isAddingMembersModalOpen: boolean;
  setIsAddingMembersModalOpen: (val: boolean) => void;
  t: (key: string) => string;
}

export function RoleMembersSubtab({
  activeRole,
  members,
  assignedMemberIds,
  setAssignedMemberIds,
  memberSearchInRole,
  setMemberSearchInRole,
  isAddingMembersModalOpen,
  setIsAddingMembersModalOpen,
  t,
}: RoleMembersSubtabProps) {
  const roleMembers = useMemo(() => {
    return members.filter((m) => {
      const isDirectlyAssigned = assignedMemberIds.includes(m.id);
      const isRoleMatching =
        activeRole &&
        m.role?.toLowerCase() === activeRole.name?.toLowerCase();
      const matchesSearch =
        !memberSearchInRole ||
        m.name.toLowerCase().includes(memberSearchInRole.toLowerCase()) ||
        (m.email && m.email.toLowerCase().includes(memberSearchInRole.toLowerCase()));
      return (isDirectlyAssigned || isRoleMatching) && matchesSearch;
    });
  }, [members, assignedMemberIds, activeRole, memberSearchInRole]);

  return (
          <div className="space-y-4">
            {/* Search & Add Members Bar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={memberSearchInRole}
                  onChange={(e) => setMemberSearchInRole(e.target.value)}
                  placeholder={t('Search Members')}
                  className="w-full text-xs h-9 pl-9 pr-3 rounded-lg bg-[#1e1f22] border border-border/80 text-foreground focus:outline-none focus:border-[#5865F2]"
                />
              </div>

              <Button
                size="sm"
                onClick={() => setIsAddingMembersModalOpen(true)}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold h-9 px-4 rounded-lg cursor-pointer shrink-0"
              >
                {t('Add Members')}
              </Button>
            </div>

            {/* Member List or Empty State */}
            {roleMembers.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <div className="size-12 rounded-full bg-[#2b2d31] flex items-center justify-center text-muted-foreground mx-auto text-xl">
                  👥
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('No members were found.')}{' '}
                  <button
                    type="button"
                    onClick={() => setIsAddingMembersModalOpen(true)}
                    className="text-blue-400 hover:underline font-semibold cursor-pointer"
                  >
                    {t('Add members to this role.')}
                  </button>
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border/80 bg-[#1e1f22] divide-y divide-border/60 overflow-hidden">
                {roleMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <CommunityAvatar
                        name={m.name}
                        imageUrl={m.avatar}
                        size={32}
                      />
                      <div>
                        <span className="text-xs font-bold text-foreground block">
                          {m.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          @{m.name.toLowerCase().replace(/\s+/g, '_')}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAssignedMemberIds((prev) =>
                          prev.filter((id) => id !== m.id),
                        );
                        toast.success(
                          t(
                            `Peran dicabut dari ${m.name}.`,
                          ),
                        );
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      title={t('Hapus dari Peran')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Members Selection Modal */}
            {isAddingMembersModalOpen && (
              <div className="p-4 rounded-xl border border-border/80 bg-[#1e1f22] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    {t('Pilih Anggota untuk Peran Ini')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingMembersModalOpen(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                  {members.map((m) => {
                    const isAlreadyAssigned = roleMembers.some(
                      (rm) => rm.id === m.id,
                    );
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          if (isAlreadyAssigned) {
                            setAssignedMemberIds((prev) =>
                              prev.filter((id) => id !== m.id),
                            );
                          } else {
                            setAssignedMemberIds((prev) => [...prev, m.id]);
                            toast.success(t(`${m.name} ditambahkan ke peran!`));
                          }
                        }}
                        className={cn(
                          'flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors',
                          isAlreadyAssigned
                            ? 'bg-[#5865F2]/20 text-[#5865F2]'
                            : 'hover:bg-[#2b2d31] text-foreground',
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <CommunityAvatar
                            name={m.name}
                            imageUrl={m.avatar}
                            size={26}
                          />
                          <span className="font-semibold">{m.name}</span>
                        </div>
                        {isAlreadyAssigned && (
                          <Check className="w-4 h-4 text-[#5865F2]" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
  );
}
