import React, { useState } from 'react';
import { UserPlus, Sparkles, Search, Loader2, Check, UserCheck, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/core/i18n';
import { friendsApi } from '../api/friends-api';
import type { FriendMember, FriendRequest } from '../types';
import type { ColonyMember } from '@/chat/chat-types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LAYOUT_DIALOG_SPACING } from '@/lib/layout-constants';
import { cn } from '@/lib/utils';

export interface AddFriendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddFriend: (username: string, userId?: string) => Promise<void> | void;
  isAddingFriend?: boolean;
  currentUser?: any;
  allFriends?: FriendMember[];
  friendRequests?: FriendRequest[];
  members?: ColonyMember[];
}

export function AddFriendDialog({
  open,
  onOpenChange,
  onAddFriend,
  isAddingFriend = false,
  currentUser,
  allFriends = [],
  friendRequests = [],
  members = [],
}: AddFriendDialogProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResults, setSearchResults] = useState<FriendMember[]>([]);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = query.trim().replace(/^@/, '');
    if (!clean) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      // 1. Fetch matches from API
      const apiResults = await friendsApi.searchUsers(clean);

      // 2. Also match from current members list if available
      const localMatches: FriendMember[] = members
        .filter(
          (m) =>
            (m.username && m.username.toLowerCase().includes(clean.toLowerCase())) ||
            m.name.toLowerCase().includes(clean.toLowerCase()) ||
            (m.email && m.email.toLowerCase().includes(clean.toLowerCase())),
        )
        .map((m) => ({
          id: m.id,
          name: m.name,
          username: m.username || null,
          avatar: m.avatar || null,
          status: m.status || 'online',
        }));

      // 3. Deduplicate
      const seen = new Set<string>();
      const combined: FriendMember[] = [];
      [...apiResults, ...localMatches].forEach((u) => {
        if (u && u.id && !seen.has(u.id)) {
          seen.add(u.id);
          combined.push(u);
        }
      });

      setSearchResults(combined);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (user: FriendMember) => {
    setSendingId(user.id);
    try {
      await onAddFriend(user.username || user.name, user.id);
      setSentMap((prev) => ({ ...prev, [user.id]: true }));
    } finally {
      setSendingId(null);
    }
  };

  const isUserFriend = (u: FriendMember) => {
    return allFriends.some(
      (f) => f.id === u.id || (u.username && f.username?.toLowerCase() === u.username.toLowerCase()),
    );
  };

  const isUserPending = (u: FriendMember) => {
    return (
      sentMap[u.id] ||
      friendRequests.some(
        (r) =>
          r.direction === 'outgoing' &&
          (r.id === u.id || (u.username && r.username?.toLowerCase() === u.username.toLowerCase())),
      )
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-background border-border">
        <div className={cn('py-4 pb-3 border-b border-border/50', LAYOUT_DIALOG_SPACING.PANE_HORIZONTAL)}>
          <DialogHeader className="pb-1 text-left">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <UserPlus className="w-5 h-5 text-primary" />
              <span>{t('Tambah Teman')}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t('Cari nama pengguna atau nama lengkap teman untuk mengirim permintaan.')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSearch} className="mt-3">
            <div className="relative flex items-center rounded-lg bg-background border border-border focus-within:border-primary/80 transition-colors p-1.5 shadow-2xs">
              <Search className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('Ketik username atau nama, lalu tekan Enter...')}
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-xs px-2.5 h-8 placeholder:text-muted-foreground/60 flex-1 text-foreground"
                autoFocus
              />
              <Button
                type="submit"
                disabled={!query.trim() || isSearching}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-8 px-3.5 shrink-0 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t('Cari')}
              </Button>
            </div>
          </form>
        </div>

        {/* Results / Empty View */}
        <div className={cn('py-4 max-h-[300px] overflow-y-auto [scrollbar-width:thin]', LAYOUT_DIALOG_SPACING.PANE_HORIZONTAL)}>
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs">{t('Mencari pengguna...')}</p>
            </div>
          ) : hasSearched && searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <div className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center mb-2.5">
                <AlertCircle className="w-6 h-6 text-muted-foreground/60" />
              </div>
              <h4 className="text-xs font-semibold text-foreground mb-1">{t('Pengguna Tidak Ditemukan')}</h4>
              <p className="text-[11px] max-w-xs leading-relaxed text-muted-foreground/80">
                {t('Tidak ada pengguna yang cocok dengan nama atau username')} "{query}". {t('Coba periksa kembali ejaannya.')}
              </p>
            </div>
          ) : hasSearched && searchResults.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1 pb-1">
                {t('Hasil Pencarian')} ({searchResults.length})
              </p>
              {searchResults.map((user) => {
                const isMe = currentUser && (user.id === currentUser.id || user.email === currentUser.email);
                const isFriend = isUserFriend(user);
                const isPending = isUserPending(user);
                const isSendingThis = sendingId === user.id;

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-card/80 hover:bg-accent/40 border border-border/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <Avatar className="w-9 h-9 shrink-0 border border-border/50">
                        {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
                        <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                          {user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          @{user.username || user.email?.split('@')[0] || user.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isMe ? (
                        <span className="text-[11px] font-medium text-muted-foreground/70 px-2 py-1 bg-muted/40 rounded border border-border/40">
                          {t('Akun Anda')}
                        </span>
                      ) : isFriend ? (
                        <span className="text-[11px] font-medium text-primary px-2.5 py-1 bg-primary/10 rounded border border-primary/20 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {t('Teman')}
                        </span>
                      ) : isPending ? (
                        <span className="text-[11px] font-medium text-amber-400 px-2.5 py-1 bg-amber-500/10 rounded border border-amber-500/20 flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          {t('Terkirim')}
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleSendRequest(user)}
                          disabled={isSendingThis || isAddingFriend}
                          className="h-7 px-3 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer transition-all"
                        >
                          {isSendingThis ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="w-3 h-3 mr-1" />
                              {t('Tambah')}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2.5">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-foreground mb-1">{t('Mulai Mencari Teman')}</p>
              <p className="text-[11px] max-w-xs leading-relaxed text-muted-foreground/80">
                {t('Ketik nama pengguna atau nama lengkap teman di kolom pencarian di atas, lalu tekan Enter atau klik Cari.')}
              </p>
            </div>
          )}
        </div>

        <div className={cn('py-3 bg-muted/20 border-t border-border/40 flex items-center justify-end', LAYOUT_DIALOG_SPACING.PANE_HORIZONTAL)}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8 px-3 cursor-pointer"
          >
            {t('Tutup')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
