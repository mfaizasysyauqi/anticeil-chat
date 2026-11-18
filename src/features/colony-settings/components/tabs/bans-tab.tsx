import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Ban,
  ShieldAlert,
  Plus,
  UserX,
  X,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { toast } from 'sonner';
import { getSocket } from '@/providers/socket-provider';
import { colonyApi } from '@/features/colonies/api/colonies-api';
import type { Colony, ColonyBan, ColonyMember } from '@/chat/chat-types';

interface BansTabProps {
  activeColony: Colony;
  members?: ColonyMember[];
  serverBans: ColonyBan[];
  setServerBans: React.Dispatch<React.SetStateAction<ColonyBan[]>>;
  onUpdateMembers?: (updater: (prev: ColonyMember[]) => ColonyMember[]) => void;
  onNavigateSection?: (section: string) => void;
  t: (key: string) => string;
}

const COMMON_BAN_REASONS = [
  'Melanggar aturan komunitas',
  'Spam atau promosi tidak sah',
  'Pelecehan atau perilaku toxic',
  'Akun bot mencurigakan',
];

export function BansTab({
  activeColony,
  members = [],
  serverBans,
  setServerBans,
  onUpdateMembers,
  onNavigateSection,
  t,
}: BansTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [customUserId, setCustomUserId] = useState('');
  const [customUserName, setCustomUserName] = useState('');
  const [banReason, setBanReason] = useState(COMMON_BAN_REASONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch fresh bans on mount
  useEffect(() => {
    let isMounted = true;
    const fetchBans = async () => {
      try {
        const bans = await colonyApi.getBans(activeColony.id);
        if (isMounted && Array.isArray(bans) && bans.length > 0) {
          setServerBans(bans);
        }
      } catch (err) {
        console.error('Failed to load bans:', err);
      }
    };
    fetchBans();
    return () => {
      isMounted = false;
    };
  }, [activeColony.id, setServerBans]);

  // Live Socket listener for bans / unbans
  useEffect(() => {
    const s = getSocket();
    const handleBanned = (payload: any) => {
      if (!payload || payload.hubId !== activeColony.id) return;
      colonyApi.getBans(activeColony.id).then((fresh) => {
        if (Array.isArray(fresh)) setServerBans(fresh);
      }).catch(() => {});
    };

    const handleUnbanned = (payload: any) => {
      if (!payload || payload.hubId !== activeColony.id) return;
      setServerBans((prev) => prev.filter((b) => b.userId !== payload.userId && b.id !== payload.userId));
    };

    s.on('COMMUNITY_USER_BANNED', handleBanned);
    s.on('COMMUNITY_USER_UNBANNED', handleUnbanned);
    return () => {
      s.off('COMMUNITY_USER_BANNED', handleBanned);
      s.off('COMMUNITY_USER_UNBANNED', handleUnbanned);
    };
  }, [activeColony.id, setServerBans]);

  const filteredBans = useMemo(() => {
    if (!searchQuery.trim()) return serverBans;
    const q = searchQuery.toLowerCase().trim();
    return serverBans.filter(
      (b) =>
        b.userName.toLowerCase().includes(q) ||
        (b.userEmail && b.userEmail.toLowerCase().includes(q)) ||
        b.userId.toLowerCase().includes(q)
    );
  }, [serverBans, searchQuery]);

  const handleRevokeBan = async (ban: ColonyBan) => {
    try {
      setServerBans((prev) => prev.filter((b) => b.id !== ban.id && b.userId !== ban.userId));
      await colonyApi.unbanUser(activeColony.id, ban.userId);
      toast.success(t(`Blokir untuk ${ban.userName} telah dicabut! ✅`));
    } catch {
      toast.error(t(`Gagal mencabut blokir untuk ${ban.userName}.`));
    }
  };

  const handleCreateBan = async (e: React.FormEvent) => {
    e.preventDefault();
    let targetId = selectedMemberId;
    let targetName = '';

    if (targetId && targetId !== 'custom') {
      const target = members.find((m) => m.id === targetId);
      targetName = target?.name || targetId;
    } else {
      targetId = customUserId.trim();
      targetName = customUserName.trim() || targetId;
    }

    if (!targetId) {
      toast.error(t('Pilih anggota atau masukkan ID pengguna yang akan diblokir.'));
      return;
    }

    setIsSubmitting(true);
    try {
      const banned = await colonyApi.banUser(activeColony.id, {
        userId: targetId,
        userName: targetName,
        reason: banReason,
      });

      setServerBans((prev) => [banned, ...prev.filter((b) => b.userId !== targetId)]);
      onUpdateMembers?.((prev) => prev.filter((m) => m.id !== targetId));

      setIsBanDialogOpen(false);
      setSelectedMemberId('');
      setCustomUserId('');
      setCustomUserName('');
      setBanReason(COMMON_BAN_REASONS[0]);

      toast.success(t(`${targetName} telah diblokir dari server 🚫`));
    } catch {
      toast.error(t('Gagal memblokir pengguna.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 w-full pb-16">
      {/* ── Header ── */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground">
          {t('Server Ban List')}
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t(
            'Bans by default are by account and IP. Ban circumvention can be reinforced with phone verification in'
          )}{' '}
          <button
            type="button"
            onClick={() => onNavigateSection?.('safety-setup')}
            className="text-sidebar-primary hover:underline font-semibold cursor-pointer"
          >
            {t('Safety Setup')}
          </button>
          .
        </p>
      </div>

      {/* ── Search Bar & Ban Button ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 max-w-md flex-1">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Search Bans by User Id or Username')}
              className="h-9 pl-9 text-xs bg-secondary border-border/70 text-foreground placeholder:text-muted-foreground rounded-lg focus-visible:ring-1 focus-visible:ring-sidebar-primary"
            />
          </div>
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="h-9 px-2 text-xs text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <Button
          type="button"
          variant="teal"
          onClick={() => setIsBanDialogOpen(true)}
          className="h-9 px-4 text-xs font-semibold rounded-lg cursor-pointer shrink-0 flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('Blokir Anggota')}</span>
        </Button>
      </div>

      {/* ── Main Container (Empty state or List) ── */}
      <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xl min-h-[380px] flex flex-col justify-center">
        {filteredBans.length === 0 ? (
          /* Empty State */
          <div className="p-12 md:p-16 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 bg-sidebar-primary/5 rounded-full blur-2xl pointer-events-none" />
              <svg className="w-28 h-28 drop-shadow-lg" viewBox="0 0 120 120" fill="none">
                <path d="M25 45L12 40" stroke="#4e5058" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M30 65L15 68" stroke="#4e5058" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M85 20L95 10" stroke="#4e5058" strokeWidth="2.5" strokeLinecap="round" />

                <path
                  d="M20 75C20 65 35 60 45 62C55 58 75 60 85 70C95 72 105 80 100 90C95 98 75 100 60 98C45 100 25 95 20 85Z"
                  fill="#18191c"
                  opacity="0.85"
                />

                <rect
                  x="30"
                  y="75"
                  width="10"
                  height="40"
                  rx="3"
                  transform="rotate(-45 30 75)"
                  fill="#4e5058"
                />
                <rect
                  x="33"
                  y="78"
                  width="4"
                  height="34"
                  rx="1.5"
                  transform="rotate(-45 33 78)"
                  fill="#35373c"
                />

                <rect
                  x="58"
                  y="26"
                  width="44"
                  height="26"
                  rx="6"
                  transform="rotate(-45 58 26)"
                  fill="#5c5f66"
                />
                <rect
                  x="64"
                  y="32"
                  width="32"
                  height="14"
                  rx="3"
                  transform="rotate(-45 64 32)"
                  fill="#80848e"
                />
                <circle cx="68" cy="46" r="1.8" fill="#2b2d31" />
                <circle cx="82" cy="32" r="1.8" fill="#2b2d31" />
              </svg>
            </div>

            <div className="space-y-1.5 max-w-sm">
              <h3 className="text-base font-bold text-foreground">
                {searchQuery ? t('No Bans Found') : t('No Bans')}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {searchQuery
                  ? t(`Tidak ada pengguna diblokir yang cocok dengan "${searchQuery}".`)
                  : t("You haven't banned anybody... but if and when you must, do not hesitate!")}
              </p>
            </div>
          </div>
        ) : (
          /* Banned Members List */
          <div className="divide-y divide-border/60">
            {filteredBans.map((ban) => (
              <div
                key={ban.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                    <Ban className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground truncate">
                        {ban.userName}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ID: {ban.userId}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      <span className="font-semibold text-foreground/80">
                        {t('Reason')}:
                      </span>{' '}
                      {ban.reason || t('Melanggar aturan komunitas')}
                      {ban.bannedByName && ` • ${t('oleh')} ${ban.bannedByName}`}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRevokeBan(ban)}
                  className="h-8 px-3.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30 rounded-lg cursor-pointer shrink-0"
                >
                  {t('Revoke Ban')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Ban Member Dialog ── */}
      <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <DialogContent className="sm:max-w-[420px] bg-card border border-border/80 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <ShieldAlert className="w-4 h-4 text-destructive" />
              <span>{t('Blokir Pengguna dari Server')}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t('Pengguna yang diblokir akan dikeluarkan dari server dan tidak dapat bergabung kembali melalui undangan.')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateBan} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t('Pilih Anggota')}
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-secondary border border-border/70 text-xs text-foreground focus:outline-none focus:border-sidebar-primary cursor-pointer"
              >
                <option value="">{t('-- Pilih anggota server --')}</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.id})
                  </option>
                ))}
                <option value="custom">{t('+ Masukkan ID kustom')}</option>
              </select>
            </div>

            {selectedMemberId === 'custom' && (
              <div className="space-y-3 p-3 rounded-lg bg-secondary/50 border border-border/60">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    {t('User ID')}
                  </label>
                  <Input
                    value={customUserId}
                    onChange={(e) => setCustomUserId(e.target.value)}
                    placeholder="e.g. user_12345"
                    className="h-8 text-xs bg-secondary border-border/70 text-foreground"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    {t('Username')}
                  </label>
                  <Input
                    value={customUserName}
                    onChange={(e) => setCustomUserName(e.target.value)}
                    placeholder="e.g. toxic_user"
                    className="h-8 text-xs bg-secondary border-border/70 text-foreground"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t('Alasan Pemblokiran')}
              </label>
              <select
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-secondary border border-border/70 text-xs text-foreground focus:outline-none focus:border-sidebar-primary cursor-pointer mb-2"
              >
                {COMMON_BAN_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <Input
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder={t('Alasan spesifik...')}
                className="h-8 text-xs bg-secondary border-border/70 text-foreground"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsBanDialogOpen(false)}
                className="text-xs"
              >
                {t('Batal')}
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={isSubmitting}
                className="text-xs font-semibold"
              >
                {isSubmitting ? t('Memblokir...') : t('Konfirmasi Blokir')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
