import React, { useState } from 'react';
import { Sparkles, Search, Loader2, Check, UserCheck, AlertCircle, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from '@/core/i18n';
import { friendsApi } from '../api/friends-api';
import type { FriendMember, FriendRequest } from '../types';
import type { CommunityMember } from '@/chat/chat-types';

export interface AddFriendTabProps {
  onAddFriend: (username: string, userId?: string) => Promise<void> | void;
  isAddingFriend?: boolean;
  currentUser?: any;
  allFriends?: FriendMember[];
  friendRequests?: FriendRequest[];
  members?: CommunityMember[];
}

export function AddFriendTab({
  onAddFriend,
  isAddingFriend = false,
  currentUser,
  allFriends = [],
  friendRequests = [],
  members = [],
}: AddFriendTabProps) {
  const { t } = useTranslation();
  const [inputVal, setInputVal] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResults, setSearchResults] = useState<FriendMember[]>([]);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputVal.trim().replace(/^@/, '');
    if (!clean) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const apiResults = await friendsApi.searchUsers(clean);
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
    <div className="w-full max-w-2xl">
      <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-1">
        {t('Tambah Teman')}
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        {t('Cari nama pengguna atau nama lengkap teman untuk mengirim permintaan pertemanan.')}
      </p>

      <form onSubmit={handleSearch}>
        <div className="relative flex items-center rounded-lg bg-card border border-border focus-within:border-primary/80 transition-colors p-2 shadow-2xs">
          <Search className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
          <Input
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={t('Ketik username atau nama, lalu tekan Enter...')}
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-xs px-2.5 h-8 placeholder:text-muted-foreground/60 flex-1 text-foreground"
            autoFocus
          />
          <Button
            type="submit"
            disabled={!inputVal.trim() || isSearching}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-8 px-4 shrink-0 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t('Cari')}
          </Button>
        </div>
      </form>

      {/* Results Section */}
      {isSearching ? (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-xs">{t('Mencari pengguna...')}</p>
        </div>
      ) : hasSearched ? (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              {t('Hasil Pencarian')} ({searchResults.length})
            </h3>
            {searchResults.length > 0 && (
              <span className="text-[11px] text-muted-foreground">
                {t('Pilih pengguna di bawah untuk mengirim permintaan pertemanan')}
              </span>
            )}
          </div>

          {searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground bg-card/40 rounded-xl border border-border/50">
              <div className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center mb-2.5">
                <AlertCircle className="w-6 h-6 text-muted-foreground/60" />
              </div>
              <h4 className="text-xs font-semibold text-foreground mb-1">{t('Pengguna Tidak Ditemukan')}</h4>
              <p className="text-[11px] max-w-sm leading-relaxed text-muted-foreground/80">
                {t('Tidak ada pengguna yang cocok dengan nama atau username')} "{inputVal}". {t('Coba periksa kembali ejaannya.')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((user) => {
                const isMe = currentUser && (user.id === currentUser.id || user.email === currentUser.email);
                const isFriend = isUserFriend(user);
                const isPending = isUserPending(user);
                const isSendingThis = sendingId === user.id;

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/60 hover:border-primary/30 transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      <Avatar className="w-10 h-10 shrink-0 border border-border/50">
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
                        <span className="text-[11px] font-medium text-muted-foreground/70 px-2.5 py-1 bg-muted/40 rounded-md border border-border/40">
                          {t('Akun Anda')}
                        </span>
                      ) : isFriend ? (
                        <span className="text-[11px] font-medium text-primary px-3 py-1 bg-primary/10 rounded-md border border-primary/20 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          {t('Sudah Berteman')}
                        </span>
                      ) : isPending ? (
                        <span className="text-[11px] font-medium text-amber-400 px-3 py-1 bg-amber-500/10 rounded-md border border-amber-500/20 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5" />
                          {t('Permintaan Terkirim')}
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleSendRequest(user)}
                          disabled={isSendingThis || isAddingFriend}
                          className="h-8 px-3.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer transition-all shadow-2xs"
                        >
                          {isSendingThis ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                              {t('Tambahkan Teman')}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          <Separator className="my-8" />
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {t('Mulai berteman di Anticeil!')}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
              {t(
                'Ketik username atau nama teman di atas, lalu tekan Enter untuk mencari dan mengirim permintaan pertemanan.'
              )}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
