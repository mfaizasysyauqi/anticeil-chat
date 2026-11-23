import React, { useState, useMemo } from 'react';
import { Users, UserPlus, LogOut, X, Shield, MessageSquare, Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { cn } from '@/lib/utils';
import { LAYOUT_DIALOG_SPACING } from '@/lib/layout-constants';
import type { ColonyChannel, ColonyMember } from '@/chat/chat-types';

export interface GroupDmMembersSidebarProps {
  channel: ColonyChannel;
  members: ColonyMember[];
  currentUser: any;
  onAddMember: (memberId: string) => void;
  onLeaveGroup: (channelId: string) => void;
  onStartDM?: (member: ColonyMember) => void;
  onClose?: () => void;
  t?: (key: string) => string;
}

export function GroupDmMembersSidebar({
  channel,
  members,
  currentUser,
  onAddMember,
  onLeaveGroup,
  onStartDM,
  onClose,
  t = (k) => k,
}: GroupDmMembersSidebarProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);

  // Group members list
  const memberIds = channel.dmUserIds || [];
  const groupMembers = useMemo(() => {
    return memberIds.map((id) => {
      const found = members.find((m) => m.id === id);
      if (found) return found;
      return {
        id,
        name: id === currentUser?.id ? (currentUser?.name || 'Anda') : `Pengguna ${id.slice(0, 4)}`,
        status: 'offline' as const,
      } as ColonyMember;
    });
  }, [memberIds, members, currentUser]);

  // Friends not yet in group
  const availableToAdd = useMemo(() => {
    const q = addSearchQuery.trim().toLowerCase();
    return members.filter((m) => {
      if (memberIds.includes(m.id)) return false;
      if (currentUser?.id && m.id === currentUser.id) return false;
      if (!q) return true;
      return (
        (m.name || '').toLowerCase().includes(q) ||
        (m.username || '').toLowerCase().includes(q)
      );
    });
  }, [members, memberIds, currentUser, addSearchQuery]);

  const handleExecuteAdd = () => {
    if (!selectedFriendId) return;
    onAddMember(selectedFriendId);
    setSelectedFriendId(null);
    setAddSearchQuery('');
    setIsAddOpen(false);
  };

  const handleExecuteLeave = () => {
    setIsLeaveConfirmOpen(false);
    onLeaveGroup(channel.id);
  };

  const isOwner = (id: string) => {
    return channel.ownerId ? channel.ownerId === id : id === memberIds[0];
  };

  return (
    <div className="w-full h-full flex flex-col bg-sidebar border-l border-sidebar-border select-none">
      {/* Header */}
      <div className="h-12 px-4 border-b border-sidebar-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Users className="w-4 h-4 text-muted-foreground shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
            {t('Anggota Grup')} ({groupMembers.length})
          </h3>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors cursor-pointer"
            title={t('Tutup')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Action: Tambah Teman */}
      <div className="p-3 border-b border-sidebar-border">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAddOpen(true)}
          className="w-full text-xs font-semibold flex items-center justify-center gap-2 border-dashed border-sidebar-border hover:border-primary hover:text-primary cursor-pointer h-8"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>{t('Tambah Teman')}</span>
        </Button>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
        {groupMembers.map((member) => {
          const isMe = currentUser?.id && member.id === currentUser.id;
          const owner = isOwner(member.id);

          return (
            <div
              key={member.id}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-accent/40 transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <CommunityAvatar
                  name={member.name}
                  imageUrl={member.avatar}
                  size={28}
                  status={member.status}
                  showStatus
                />
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {member.name}
                    </span>
                    {isMe && (
                      <span className="text-[10px] text-muted-foreground font-normal">
                        ({t('Anda')})
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                    {owner ? (
                      <span className="inline-flex items-center gap-0.5 text-amber-400 font-medium">
                        <Shield className="w-2.5 h-2.5 fill-amber-400/20" /> {t('Owner')}
                      </span>
                    ) : (
                      member.customStatus || member.username || t('Anggota')
                    )}
                  </span>
                </div>
              </div>

              {!isMe && onStartDM && (
                <button
                  type="button"
                  onClick={() => onStartDM(member)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent hover:text-foreground text-muted-foreground/70 transition-opacity cursor-pointer shrink-0 ml-1"
                  title={t('Kirim Pesan DM Pribadi')}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer: Tinggalkan Grup */}
      <div className="p-3 border-t border-sidebar-border shrink-0 bg-sidebar">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsLeaveConfirmOpen(true)}
          className="w-full text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center justify-center gap-2 cursor-pointer h-8"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t('Tinggalkan Grup')}</span>
        </Button>
      </div>

      {/* Dialog: Tambah Teman ke Grup */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent size="md" className="p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="text-sm font-bold text-foreground">
              {t('Tambah Teman ke Grup')}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {t('Pilih teman yang ingin Anda undang ke dalam obrolan grup ini.')}
            </DialogDescription>
          </DialogHeader>

          <div className="px-5 py-2.5 border-b border-border/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                value={addSearchQuery}
                onChange={(e) => setAddSearchQuery(e.target.value)}
                placeholder={t('Cari teman...')}
                className="h-8 pl-8 text-xs bg-muted/40"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-[220px] overflow-y-auto px-2 py-1 custom-scrollbar divide-y divide-border/20">
            {availableToAdd.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                {t('Semua teman Anda sudah berada di dalam grup ini.')}
              </div>
            ) : (
              availableToAdd.map((friend) => {
                const isSelected = selectedFriendId === friend.id;
                return (
                  <div
                    key={friend.id}
                    onClick={() => setSelectedFriendId(friend.id)}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-md transition-colors cursor-pointer',
                      isSelected ? 'bg-primary/10' : 'hover:bg-muted/60'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CommunityAvatar
                        name={friend.name}
                        imageUrl={friend.avatar}
                        size={28}
                        status={friend.status}
                        showStatus
                      />
                      <span className="text-xs font-semibold text-foreground truncate">
                        {friend.name}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ml-2',
                        isSelected
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-muted-foreground/40'
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="px-5 py-3 border-t border-border flex items-center justify-end gap-2 bg-muted/10">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAddOpen(false)}
              className="text-xs cursor-pointer"
            >
              {t('Batal')}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!selectedFriendId}
              onClick={handleExecuteAdd}
              className="text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-2xs"
            >
              {t('Tambahkan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Konfirmasi Tinggalkan Grup */}
      <Dialog open={isLeaveConfirmOpen} onOpenChange={setIsLeaveConfirmOpen}>
        <DialogContent size="sm" className="p-5 gap-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground">
              {t('Tinggalkan Grup')}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {t('Apakah Anda yakin ingin meninggalkan grup ini? Anda tidak akan menerima pesan baru dari grup ini lagi.')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsLeaveConfirmOpen(false)}
              className="text-xs cursor-pointer"
            >
              {t('Batal')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleExecuteLeave}
              className="text-xs font-bold cursor-pointer"
            >
              {t('Tinggalkan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
