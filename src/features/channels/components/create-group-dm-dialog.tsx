import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Users, X, Check, Loader2 } from 'lucide-react';
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
import { friendsApi } from '@/features/friends/api/friends-api';

export interface CreateGroupDmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friends?: any[];
  currentUser: any;
  onCreateGroupDm: (name: string, memberIds: string[]) => void;
  t?: (key: string) => string;
}

export function CreateGroupDmDialog({
  open,
  onOpenChange,
  friends = [],
  currentUser,
  onCreateGroupDm,
  t = (k) => k,
}: CreateGroupDmDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [fetchedFriends, setFetchedFriends] = useState<any[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  // Fetch real friends whenever dialog opens
  const fetchFriends = useCallback(async () => {
    if (!currentUser?.id) return;
    setIsLoadingFriends(true);
    try {
      const list = await friendsApi.getFriends(currentUser.id);
      if (Array.isArray(list)) {
        setFetchedFriends(list);
      }
    } catch {
      // Keep optimistic/fallback
    } finally {
      setIsLoadingFriends(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (open) {
      fetchFriends();
    } else {
      setSelectedIds([]);
      setGroupName('');
      setSearchQuery('');
    }
  }, [open, fetchFriends]);

  // Combine and strictly filter for real accepted friends only
  const availableFriends = useMemo(() => {
    const rawList = [...(friends || []), ...fetchedFriends];
    const friendMap = new Map<string, any>();

    rawList.forEach((f) => {
      if (!f || !f.id) return;

      const id = String(f.id);
      // Exclude seed/mock bot accounts
      if (id === 'u1' || id === 'u2') return;

      const name = (f.name || f.displayName || '').toLowerCase().trim();
      const username = (f.username || '').toLowerCase().trim();

      // Exclude generic placeholder labels & probe accounts
      const isGeneric =
        !name ||
        name === 'pengguna' ||
        name === 'pengguna anticeil' ||
        name === 'user' ||
        name === 'direct message' ||
        name === 'teman' ||
        name.includes('probe x') ||
        username.includes('apcheck');
      if (isGeneric) return false;

      // Exclude self
      const isSelf =
        (currentUser?.id && id === currentUser.id) ||
        (currentUser?.email && f.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
        (currentUser?.username && username === currentUser.username.toLowerCase()) ||
        (currentUser?.name && name === currentUser.name.toLowerCase());
      if (isSelf) return false;

      if (!friendMap.has(id)) {
        friendMap.set(id, {
          id: f.id,
          name: f.name || f.displayName || f.username || 'Teman',
          username: f.username || (f.email ? f.email.split('@')[0] : null),
          avatar: f.avatar || f.imageUrl || null,
          status: f.status || 'online',
        });
      }
    });

    return Array.from(friendMap.values());
  }, [friends, fetchedFriends, currentUser]);

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
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 9) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleRemoveChip = (id: string) => {
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const handleCreate = () => {
    if (selectedIds.length === 0) return;
    onCreateGroupDm(groupName.trim(), selectedIds);
    handleClose();
  };

  const handleClose = () => {
    setSelectedIds([]);
    setGroupName('');
    setSearchQuery('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="md" className="p-0 gap-0 overflow-hidden sm:max-w-md">
        <DialogHeader className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
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
          <div className="px-5 py-2.5 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar border-y border-border/50 bg-muted/20">
            {selectedIds.map((id) => {
              const friend = availableFriends.find((f) => f.id === id);
              const label = friend?.name || friend?.username || id;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium border border-primary/20"
                >
                  <span className="truncate max-w-[120px]">{label}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChip(id)}
                    className="hover:bg-primary/25 p-0.5 rounded-full transition-colors cursor-pointer"
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
          <div className="px-5 py-2.5 border-b border-border/50 bg-background">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              {t('Nama Grup (Opsional)')}
            </label>
            <Input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder={t('Contoh: Tim Kerja, Diskusi Proyek...')}
              className="h-8.5 text-xs bg-muted/30"
              maxLength={60}
            />
          </div>
        )}

        {/* Search Friend Input */}
        <div className="px-5 py-2.5 border-b border-border/50 bg-background">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Ketik nama teman untuk mencari...')}
              className="h-8.5 pl-8 text-xs bg-muted/40 border-sidebar-border"
              autoFocus
            />
          </div>
        </div>

        {/* Friends List */}
        <div className="max-h-[260px] min-h-[140px] overflow-y-auto custom-scrollbar divide-y divide-border/20 px-2 py-1">
          {isLoadingFriends && availableFriends.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-xs">{t('Memuat daftar teman...')}</span>
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="py-10 px-4 text-center">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2 text-muted-foreground">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-foreground">
                {availableFriends.length === 0
                  ? t('Belum ada teman di daftar kontak Anda')
                  : t('Tidak ada teman yang cocok')}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-[280px] mx-auto">
                {availableFriends.length === 0
                  ? t('Tambahkan teman terlebih dahulu melalui menu Teman untuk mulai mengobrol bersama dalam grup.')
                  : t('Coba periksa ejaan nama atau kata kunci pencarian Anda.')}
              </p>
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
                      size={34}
                      status={friend.status}
                      showStatus
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {friend.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {friend.username ? `@${friend.username}` : 'Teman'}
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
                <strong className="text-foreground">{selectedIds.length}</strong>/9 {t('teman terpilih')}
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
