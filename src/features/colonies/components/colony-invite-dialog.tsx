import React, { useState, useEffect, useMemo } from 'react';
import {
  UserPlus,
  AtSign,
  UserCheck,
  AlertCircle,
  Share2,
  Copy,
  Check,
  Search,
  Loader2,
  Users,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { friendsApi } from '@/features/friends/api/friends-api';
import type { Colony, ColonyMember } from '@/chat/chat-types';
import type { FriendMember } from '@/features/friends/types';

export interface ColonyInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeServer?: Colony | null;
  activeColony?: Colony | null;
  onInviteUsername: (username: string, userId?: string) => Promise<boolean | void>;
  members?: ColonyMember[];
  t: (key: string) => string;
}

export function ColonyInviteDialog({
  open,
  onOpenChange,
  activeServer,
  activeColony,
  onInviteUsername,
  members = [],
  t,
}: ColonyInviteDialogProps) {
  const currentServer = activeServer ?? activeColony;
  const [searchQuery, setSearchQuery] = useState('');
  const [candidateUsers, setCandidateUsers] = useState<FriendMember[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [userNotFound, setUserNotFound] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Load available users when dialog opens
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setUserNotFound(null);
      return;
    }

    let isMounted = true;
    const loadUsers = async () => {
      setIsLoadingUsers(true);
      try {
        // Fetch candidates from friends / users API
        const [friends, searched] = await Promise.all([
          friendsApi.getFriends().catch(() => []),
          friendsApi.searchUsers('a').catch(() => []),
        ]);

        if (isMounted) {
          const map = new Map<string, FriendMember>();
          // Include workspace members if passed
          members.forEach((m) => {
            if (m && m.id) {
              map.set(m.id, {
                id: m.id,
                name: m.name,
                username: m.username || null,
                avatar: m.avatar || null,
                email: m.email || '',
                status: m.status || 'online',
              });
            }
          });
          friends.forEach((f) => {
            if (f && f.id) map.set(f.id, f);
          });
          searched.forEach((s) => {
            if (s && s.id) map.set(s.id, s);
          });

          setCandidateUsers(Array.from(map.values()));
        }
      } catch (err) {
        console.warn('Failed to load candidate users for invite dialog', err);
      } finally {
        if (isMounted) setIsLoadingUsers(false);
      }
    };

    loadUsers();
    return () => {
      isMounted = false;
    };
  }, [open, members]);

  // Dynamically filter users based on search query
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().replace(/^@/, '').toLowerCase();
    if (!q) return candidateUsers;
    return candidateUsers.filter((u) => {
      const matchName = u.name.toLowerCase().includes(q);
      const matchUser = u.username && u.username.toLowerCase().includes(q);
      const matchEmail = u.email && u.email.toLowerCase().includes(q);
      return matchName || matchUser || matchEmail;
    });
  }, [candidateUsers, searchQuery]);

  // Search more from DB if query produces no candidates
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = searchQuery.trim().replace(/^@/, '');
    if (!clean) return;

    setIsLoadingUsers(true);
    setUserNotFound(null);
    try {
      const results = await friendsApi.searchUsers(clean);
      if (results.length > 0) {
        setCandidateUsers((prev) => {
          const map = new Map<string, FriendMember>();
          prev.forEach((u) => map.set(u.id, u));
          results.forEach((r) => map.set(r.id, r));
          return Array.from(map.values());
        });
      } else if (filteredUsers.length === 0) {
        setUserNotFound(clean);
      }
    } catch {
      setUserNotFound(clean);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleInviteUser = async (user: FriendMember) => {
    setInvitingId(user.id);
    setUserNotFound(null);
    try {
      const usernameOrName = user.username || user.name;
      const success = await onInviteUsername(usernameOrName, user.id);
      if (success !== false) {
        setSentMap((prev) => ({ ...prev, [user.id]: true }));
      }
    } finally {
      setInvitingId(null);
    }
  };

  const handleDirectInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawUser = searchQuery.trim().replace(/^@/, '');
    if (!rawUser) {
      toast.error(t('Masukkan username yang ingin diundang'));
      return;
    }

    // If top match exists in filtered users, invite that user directly
    const topMatch = filteredUsers[0];
    if (topMatch && (topMatch.username?.toLowerCase() === rawUser.toLowerCase() || topMatch.name.toLowerCase() === rawUser.toLowerCase())) {
      await handleInviteUser(topMatch);
      return;
    }

    setInvitingId('manual');
    setUserNotFound(null);
    try {
      const success = await onInviteUsername(rawUser);
      if (success === false) {
        setUserNotFound(rawUser);
      } else {
        setSearchQuery('');
      }
    } catch {
      setUserNotFound(rawUser);
    } finally {
      setInvitingId(null);
    }
  };

  const handleCopyLink = () => {
    const code = currentServer?.inviteCode || currentServer?.id;
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/messages?invite=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast.success(t('Tautan undangan berhasil disalin! 📋'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-background border-border">
        {/* Header */}
        <div className="p-5 pb-3 border-b border-border/50">
          <DialogHeader className="pb-1 text-left">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <UserPlus className="w-5 h-5 text-primary" />
              <span>
                {t('Undang Teman ke Colony')} {currentServer?.name || 'Colony'}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t('Pilih pengguna di bawah atau cari username untuk mengirimkan undangan colony tertunda.')}
            </DialogDescription>
          </DialogHeader>

          {/* Search bar */}
          <form onSubmit={handleDirectInviteSubmit} className="mt-3">
            <div className="relative flex items-center rounded-lg bg-background border border-border focus-within:border-primary/80 transition-colors p-1.5 shadow-2xs">
              <Search className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (userNotFound) setUserNotFound(null);
                }}
                placeholder={t('Ketik username atau nama pengguna...')}
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-xs px-2.5 h-8 placeholder:text-muted-foreground/60 flex-1 text-foreground"
                autoFocus
              />
              <Button
                type="submit"
                disabled={!searchQuery.trim() || invitingId !== null}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-8 px-3.5 shrink-0 transition-all cursor-pointer disabled:opacity-50"
              >
                {invitingId === 'manual' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  t('Undang')
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* User Selection List */}
        <div className="px-5 py-3">
          <div className="text-[11px] font-bold text-muted-foreground/80 tracking-wider uppercase mb-2 flex items-center justify-between">
            <span>{t('PILIH PENGGUNA')} ({filteredUsers.length})</span>
            {isLoadingUsers && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
          </div>

          <div className="max-h-[220px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredUsers.length === 0 ? (
              <EmptyState
                compact
                icon={<Users className="w-6 h-6 stroke-[1.8] text-primary/80" />}
                title={
                  searchQuery.trim()
                    ? t('Tidak ada pengguna yang cocok dengan pencarian.')
                    : t('Belum ada daftar pengguna.')
                }
                action={
                  searchQuery.trim() ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleSearchSubmit}
                      className="text-xs text-primary hover:underline cursor-pointer"
                    >
                      {t('Cari lebih banyak di database...')}
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              filteredUsers.map((user) => {
                const isAlreadyMember = members.some((m) => m.id === user.id);
                const isSent = sentMap[user.id];
                const isInvitingThis = invitingId === user.id;

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CommunityAvatar name={user.name} imageUrl={user.avatar} size={36} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {user.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate">
                          @{user.username || user.email?.split('@')[0] || user.name.toLowerCase().replace(/\s+/g, '')}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      {isAlreadyMember ? (
                        <span className="text-[11px] font-semibold text-emerald-400 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          <span>{t('Anggota')}</span>
                        </span>
                      ) : isSent ? (
                        <span className="text-[11px] font-semibold text-primary px-2.5 py-1 rounded-md bg-amber-400/10 border border-amber-400/20">
                          {t('Terkirim 📩')}
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleInviteUser(user)}
                          disabled={isInvitingThis || invitingId !== null}
                          className="h-7 px-3 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-2xs gap-1"
                        >
                          {isInvitingThis ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3" />
                              <span>{t('Undang')}</span>
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* User not found alert callout */}
          {userNotFound && (
            <div className="mt-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs space-y-2 animate-in fade-in-50 duration-200">
              <div className="flex items-start gap-2 text-amber-500 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {t('Pengguna')} @{userNotFound} {t('tidak ditemukan')}
                </span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                {t('Pengguna belum terdaftar di Anticeil. Bagikan tautan undangan di bawah ini langsung kepada mereka agar dapat bergabung.')}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full text-xs gap-1.5 h-8 border-amber-500/40 hover:bg-amber-500/20 text-foreground cursor-pointer"
                onClick={handleCopyLink}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? t('Link Tersalin!') : t('Salin Link Undangan Otomatis')}</span>
              </Button>
            </div>
          )}

          {/* Share Link Section */}
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-primary" />
                {t('Tautan Undangan Colony')}
              </span>
              <span className="text-[10px] text-muted-foreground font-normal">
                {t('Tidak pernah kedaluwarsa')}
              </span>
            </label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/messages?invite=${currentServer?.inviteCode || currentServer?.id}`}
                className="text-xs font-mono bg-muted/40 select-all h-8"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                type="button"
                variant="default"
                size="sm"
                className="gap-1.5 shrink-0 cursor-pointer h-8 bg-muted hover:bg-muted/80 text-foreground border border-border"
                onClick={handleCopyLink}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? t('Tersalin!') : t('Salin')}</span>
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="p-3 bg-muted/20 border-t border-border flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              setUserNotFound(null);
              setSearchQuery('');
            }}
          >
            {t('Selesai')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Backward-compatible alias

// Backward-compatible alias
export const ServerInviteDialog = ColonyInviteDialog;
export type ServerInviteDialogProps = ColonyInviteDialogProps;
