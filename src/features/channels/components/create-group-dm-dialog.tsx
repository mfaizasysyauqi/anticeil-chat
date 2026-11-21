import React, { useState, useMemo } from 'react';
import { Search, Users, X, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { cn } from '@/lib/utils';
import { LAYOUT_DIALOG_SPACING } from '@/lib/layout-constants';
import type { ColonyMember } from '@/chat/chat-types';

export interface CreateGroupDmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friends: ColonyMember[];
  currentUser: any;
  onCreateGroupDm: (name: string, memberIds: string[]) => void;
  t?: (key: string) => string;
}

export function CreateGroupDmDialog({
  open,
  onOpenChange,
  friends,
  currentUser,
  onCreateGroupDm,
  t = (k) => k,
}: CreateGroupDmDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');

  // Filter out current user from selectable list
  const availableFriends = useMemo(() => {
    return friends.filter((f) => {
      if (currentUser?.id && f.id === currentUser.id) return false;
      return true;
    });
  }, [friends, currentUser]);

  // Search filter
  const filteredFriends = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return availableFriends;
    return availableFriends.filter((f) => {
      const name = (f.name || '').toLowerCase();
      const username = (f.username || '').toLowerCase();
      return name.includes(q) || username.includes(q);
    });
  }, [availableFriends, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleRemoveChip = (id: string) => {
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const handleCreate = () => {
    if (selectedIds.length === 0) return;
    onCreateGroupDm(groupName.trim(), selectedIds);
    // Reset state & close
    setSelectedIds([]);
    setGroupName('');
    setSearchQuery('');
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedIds([]);
    setGroupName('');
    setSearchQuery('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn('sm:max-w-[480px] p-0 gap-0 overflow-hidden', LAYOUT_DIALOG_SPACING.STANDARD_CONTAINER)}>
        <DialogHeader className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {t('Buat Group DM')}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {t('Pilih hingga 9 teman untuk bergabung dalam obrolan grup.')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Selected Friend Chips */}
        {selectedIds.length > 0 && (
          <div className="px-5 py-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar border-y border-border/50 bg-muted/20">
            {selectedIds.map((id) => {
              const member = friends.find((f) => f.id === id);
              const label = member?.name || member?.username || id;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium border border-primary/20"
                >
                  <span className="truncate max-w-[120px]">{label}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChip(id)}
                    className="hover:bg-primary/20 p-0.5 rounded-full transition-colors cursor-pointer"
                    title={t('Hapus')}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Group Name (Shown when at least 1 friend selected) */}
        {selectedIds.length > 0 && (
          <div className="px-5 py-2.5 border-b border-border/50">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              {t('Nama Grup (Opsional)')}
            </label>
            <Input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder={t('Contoh: Tim Kerja, Diskusi Proyek...')}
              className="h-8 text-xs bg-muted/30"
              maxLength={60}
            />
          </div>
        )}

        {/* Search Friend Input */}
        <div className="px-5 py-2.5 border-b border-border/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Ketik nama teman untuk mencari...')}
              className="h-8 pl-8 text-xs bg-muted/40 border-sidebar-border"
              autoFocus
            />
          </div>
        </div>

        {/* Friends List */}
        <div className="max-h-[260px] overflow-y-auto custom-scrollbar divide-y divide-border/20 px-2 py-1">
          {filteredFriends.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              {availableFriends.length === 0
                ? t('Belum ada teman di daftar kontak Anda.')
                : t('Tidak ada teman yang cocok dengan pencarian.')}
            </div>
          ) : (
            filteredFriends.map((friend) => {
              const isSelected = selectedIds.includes(friend.id);
              return (
                <div
                  key={friend.id}
                  onClick={() => toggleSelect(friend.id)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-md transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-primary/10 hover:bg-primary/15'
                      : 'hover:bg-muted/60'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CommunityAvatar
                      name={friend.name}
                      imageUrl={friend.avatar}
                      size={32}
                      status={friend.status}
                      showStatus
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {friend.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {friend.customStatus || friend.username || friend.role || 'Member'}
                      </span>
                    </div>
                  </div>

                  {/* Custom Checkbox */}
                  <div
                    className={cn(
                      'w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ml-2',
                      isSelected
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground/40 hover:border-muted-foreground'
                    )}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Dialog Footer */}
        <DialogFooter className="px-5 py-3 border-t border-border flex items-center justify-between gap-2 bg-muted/10 sm:justify-between">
          <div className="text-xs text-muted-foreground">
            {selectedIds.length > 0 ? (
              <span>
                <strong className="text-foreground">{selectedIds.length}</strong> {t('teman terpilih')}
              </span>
            ) : (
              <span>{t('Pilih minimal 1 teman')}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-xs cursor-pointer"
            >
              {t('Batal')}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={selectedIds.length === 0}
              onClick={handleCreate}
              className="text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-2xs"
            >
              {selectedIds.length > 1
                ? `${t('Buat Group DM')} (${selectedIds.length})`
                : t('Buat Group DM')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
