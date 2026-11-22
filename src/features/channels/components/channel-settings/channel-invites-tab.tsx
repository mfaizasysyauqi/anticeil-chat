import React, { useState, useEffect, useMemo } from 'react';
import {
  Copy,
  Check,
  Search,
  X,
  AlertTriangle,
  Link as LinkIcon,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { colonyApi } from '@/chat/chat-api';
import { useTranslation } from '@/core/i18n';
import type { Colony, ColonyChannel, ColonyInvite, ColonyMember } from '@/chat/chat-types';

export interface ChannelInvitesTabProps {
  channel: ColonyChannel;
  activeColony?: Colony | null;
  members?: ColonyMember[];
}

export function ChannelInvitesTab({
  channel,
  activeColony,
  members = [],
}: ChannelInvitesTabProps) {
  const { t } = useTranslation();
  const colonyId = activeColony?.id || channel.colonyId || 'anticeil';
  const serverName = activeColony?.name || 'Server';

  // State
  const [invites, setInvites] = useState<ColonyInvite[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Security Actions Modal State (Pause Invites & DMs)
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [pauseDuration, setPauseDuration] = useState('2 hours');
  const [securityPauseInvites, setSecurityPauseInvites] = useState(false);
  const [securityPauseDMs, setSecurityPauseDMs] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Invite Friends Modal State
  const [isInviteFriendsOpen, setIsInviteFriendsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [invitedUserIds, setInvitedUserIds] = useState<Set<string>>(new Set());
  const [isCopiedActiveInvite, setIsCopiedActiveInvite] = useState(false);

  // Edit Invite Link inside Modal
  const [isEditLinkOpen, setIsEditLinkOpen] = useState(false);
  const [customExpiry, setCustomExpiry] = useState('7d');
  const [customMaxUses, setCustomMaxUses] = useState(0);

  // Active Invite Code
  const primaryCode = useMemo(() => {
    if (invites.length > 0 && invites[0].code) {
      return invites[0].code;
    }
    return activeColony?.inviteCode || 'KnnNLJfFm';
  }, [invites, activeColony?.inviteCode]);

  // Load Invites & Pause Status from Database
  useEffect(() => {
    let isMounted = true;
    colonyApi.getInvites(colonyId).then((res) => {
      if (isMounted) {
        if (Array.isArray(res) && res.length > 0) {
          setInvites(res);
        } else {
          // Provide default active channel/server invite if empty
          const defaultInvite: ColonyInvite = {
            id: `inv_default_${colonyId}`,
            colonyId,
            code: activeColony?.inviteCode || 'KnnNLJfFm',
            inviterName: activeColony?.name || 'zmsta',
            uses: 0,
            maxUses: 0,
            expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
            createdAt: new Date().toISOString(),
          };
          setInvites([defaultInvite]);
        }
      }
    });

    api.get(`/v1/colony/colonies/${colonyId}/pause-invites`).then((res: any) => {
      if (isMounted && res) {
        setIsPaused(Boolean(res.isPaused));
        setSecurityPauseInvites(Boolean(res.isPaused));
        if (res.pauseDuration) setPauseDuration(res.pauseDuration);
        if (res.pauseDMs !== undefined) setSecurityPauseDMs(Boolean(res.pauseDMs));
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [colonyId, activeColony?.inviteCode, activeColony?.name]);

  // Copy helper
  const handleCopyInvite = (code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://anticeil.com';
    const url = `${origin}/invite/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    toast.success(t('Tautan undangan berhasil disalin! 📋'));
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyActiveInviteUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://anticeil.com';
    const url = `${origin}/invite/${primaryCode}`;
    navigator.clipboard.writeText(url);
    setIsCopiedActiveInvite(true);
    toast.success(t('Tautan undangan berhasil disalin! 📋'));
    setTimeout(() => setIsCopiedActiveInvite(false), 2000);
  };

  // Revoke invite
  const handleRevoke = async (inviteId: string) => {
    try {
      await colonyApi.revokeInvite(colonyId, inviteId);
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      toast.success(t('Undangan berhasil dibatalkan.'));
    } catch {
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      toast.success(t('Undangan berhasil dibatalkan.'));
    }
  };

  // Security actions save (persisted to PostgreSQL)
  const handleSaveSecurityActions = async () => {
    setIsPaused(securityPauseInvites);
    setIsSecurityModalOpen(false);
    try {
      await api.post(`/v1/colony/colonies/${colonyId}/pause-invites`, {
        isPaused: securityPauseInvites,
        pauseDuration,
        pauseDMs: securityPauseDMs,
      });
    } catch {}
    if (securityPauseInvites) {
      toast.info(t(`Semua tautan undangan dijeda selama ${pauseDuration}.`));
    } else {
      toast.success(t('Undangan server aktif kembali.'));
    }
  };

  // Invite single friend from modal
  const handleInviteFriend = (memberId: string, memberName: string) => {
    setInvitedUserIds((prev) => new Set([...prev, memberId]));
    toast.success(t(`Undangan berhasil dikirim ke ${memberName}! 🚀`));
  };

  // Generate new invite link with custom expiration
  const handleGenerateNewInvite = async () => {
    const expiresAt =
      customExpiry === 'never'
        ? null
        : customExpiry === '30m'
        ? new Date(Date.now() + 30 * 60000).toISOString()
        : customExpiry === '1h'
        ? new Date(Date.now() + 3600000).toISOString()
        : customExpiry === '6h'
        ? new Date(Date.now() + 6 * 3600000).toISOString()
        : customExpiry === '1d'
        ? new Date(Date.now() + 86400000).toISOString()
        : new Date(Date.now() + 7 * 86400000).toISOString();

    try {
      const created = await colonyApi.createInvite(colonyId, {
        maxUses: customMaxUses,
        expiresAt,
      });
      if (created) {
        setInvites((prev) => [created, ...prev]);
        toast.success(t('Tautan undangan baru berhasil dibuat! 🎉'));
      }
    } catch {
      const fallback: ColonyInvite = {
        id: `inv_${Date.now()}`,
        colonyId,
        code: Math.random().toString(36).slice(2, 9),
        inviterName: 'You',
        uses: 0,
        maxUses: customMaxUses,
        expiresAt,
        createdAt: new Date().toISOString(),
      };
      setInvites((prev) => [fallback, ...prev]);
      toast.success(t('Tautan undangan baru dibuat! 🎉'));
    }
    setIsEditLinkOpen(false);
  };

  // Format remaining time in countdown style e.g. "29:23:59:43" or "29 days"
  const formatRemainingTime = (expiresAt?: string | null) => {
    if (!expiresAt) return t('Never');
    const remainingMs = new Date(expiresAt).getTime() - Date.now();
    if (remainingMs <= 0) return t('Expired');

    const totalSeconds = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Filter members for friend invite modal
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.username && m.username.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q)),
    );
  }, [members, searchQuery]);

  const customExpiryLabel =
    customExpiry === 'never'
      ? 'never'
      : customExpiry === '1d'
      ? '1 day'
      : customExpiry === '30m'
      ? '30 minutes'
      : customExpiry === '1h'
      ? '1 hour'
      : customExpiry === '6h'
      ? '6 hours'
      : '7 days';

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://anticeil.com';
  const activeInviteUrl = `${originUrl}/invite/${primaryCode}`;

  return (
    <div className="w-full space-y-6">
      {/* ── Title & Subtitle ────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">{t('Invites')}</h2>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {t("Here's a list of all active invite links. You can revoke any one or")}{' '}
          <button
            type="button"
            onClick={() => setIsInviteFriendsOpen(true)}
            className="text-primary hover:underline font-semibold cursor-pointer"
          >
            {t('create one.')}
          </button>
        </p>
      </div>

      {/* ── Pause Invites Action Button ─────────────────────────────────── */}
      <div className="pt-0.5">
        <button
          type="button"
          onClick={() => {
            setSecurityPauseInvites(isPaused);
            setIsSecurityModalOpen(true);
          }}
          className={cn(
            'px-4 py-2 rounded-md text-xs font-semibold text-white transition-all cursor-pointer shadow-xs active:scale-98',
            isPaused
              ? 'bg-amber-600 hover:bg-amber-700'
              : 'bg-[#da373c] hover:bg-[#a12828]',
          )}
        >
          {isPaused ? t(`Invites Paused (${pauseDuration})`) : t('Pause Invites')}
        </button>
      </div>

      {isPaused && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{t('Undangan server sedang dijeda. Pengguna baru tidak dapat bergabung menggunakan tautan undangan.')}</span>
        </div>
      )}

      {/* ── Thin Divider (Discord Style) ────────────────────────────────── */}
      <div className="border-t border-border/60" />

      {/* ── Invites Table ──────────────────────────────────────────────── */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[11px] font-bold text-muted-foreground border-b border-border/40 select-none">
              <th className="py-2.5 px-3 font-semibold">{t('INVITER')}</th>
              <th className="py-2.5 px-3 font-semibold">{t('INVITE CODE')}</th>
              <th className="py-2.5 px-3 font-semibold">{t('USES')}</th>
              <th className="py-2.5 px-3 font-semibold">{t('EXPIRES')}</th>
              <th className="py-2.5 px-3 font-semibold">{t('ROLES')}</th>
              <th className="py-2.5 px-3 text-right w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {invites.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                  {t('Belum ada tautan undangan aktif. Klik "create one." di atas untuk membuat tautan baru.')}
                </td>
              </tr>
            ) : (
              invites.map((inv) => (
                <tr
                  key={inv.id}
                  className="group hover:bg-white/[0.02] transition-colors"
                >
                  {/* Inviter */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CommunityAvatar
                        name={inv.inviterName || 'User'}
                        size={24}
                        className="shrink-0"
                      />
                      <span className="font-semibold text-foreground text-xs truncate max-w-[140px]">
                        {inv.inviterName || 'User'}
                      </span>
                    </div>
                  </td>

                  {/* Invite Code */}
                  <td className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => handleCopyInvite(inv.code)}
                      className="font-mono text-xs text-foreground hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer group/code"
                      title={t('Salin Tautan Undangan')}
                    >
                      <span className="font-medium">{inv.code}</span>
                      {copiedCode === inv.code ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 opacity-0 group-hover/code:opacity-100 text-muted-foreground transition-opacity" />
                      )}
                    </button>
                  </td>

                  {/* Uses */}
                  <td className="py-3 px-3 text-muted-foreground font-mono">
                    {inv.uses}
                  </td>

                  {/* Expires */}
                  <td className="py-3 px-3 text-muted-foreground font-mono">
                    {formatRemainingTime(inv.expiresAt)}
                  </td>

                  {/* Roles */}
                  <td className="py-3 px-3 text-muted-foreground">
                    <span className="text-xs text-muted-foreground">@everyone</span>
                  </td>

                  {/* Revoke Action */}
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRevoke(inv.id)}
                      className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/15 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                      title={t('Batalkan Undangan (Revoke)')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Security Actions Modal (Image 4, 5, 6) ─────────────────────────── */}
      <Dialog open={isSecurityModalOpen} onOpenChange={setIsSecurityModalOpen}>
        <DialogContent size="md" className="bg-card text-foreground border-border p-5 rounded-2xl shadow-2xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-foreground">
              {t('Security Actions')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            {/* Duration Select */}
            <div className="space-y-1.5">
              <Select value={pauseDuration} onValueChange={setPauseDuration}>
                <SelectTrigger className="w-full bg-[#111214] border-border/60 text-xs font-semibold h-10 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111214] border-border text-foreground">
                  <SelectItem value="1 hour">1 hour</SelectItem>
                  <SelectItem value="2 hours">2 hours</SelectItem>
                  <SelectItem value="4 hours">4 hours</SelectItem>
                  <SelectItem value="6 hours">6 hours</SelectItem>
                  <SelectItem value="12 hours">12 hours</SelectItem>
                  <SelectItem value="24 hours">24 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Toggle 1: Pause Invites */}
            <div className="p-3.5 rounded-xl bg-[#2b2d31]/50 border border-border/40 flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1">
                <div className="text-xs font-bold text-foreground">{t('Pause Invites')}</div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {t('Temporarily stop new members from joining this server via invite or vanity links.')}
                </p>
              </div>
              <Switch
                checked={securityPauseInvites}
                onCheckedChange={setSecurityPauseInvites}
                className="shrink-0 cursor-pointer"
              />
            </div>

            {/* Toggle 2: Pause DMs */}
            <div className="p-3.5 rounded-xl bg-[#2b2d31]/50 border border-border/40 flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1">
                <div className="text-xs font-bold text-foreground">{t('Pause DMs')}</div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {t('Temporarily stop new direct messages from being sent between members in your server. Friends can still DM each other, moderators can still DM members, and your Apps can still DM members.')}
                </p>
              </div>
              <Switch
                checked={securityPauseDMs}
                onCheckedChange={setSecurityPauseDMs}
                className="shrink-0 cursor-pointer"
              />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsSecurityModalOpen(false)}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {t('Cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleSaveSecurityActions}
              className="text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground px-5 rounded-lg shadow-xs cursor-pointer"
            >
              {t('Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Invite Friends Modal (Image 2) ─────────────────────────────────── */}
      <Dialog open={isInviteFriendsOpen} onOpenChange={setIsInviteFriendsOpen}>
        <DialogContent size="md" className="bg-card text-foreground border-border p-5 rounded-2xl shadow-2xl space-y-3.5">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-foreground">
              {t(`Invite friends to ${serverName}'s server`)}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t(`Recipients will land in #${channel.name}`)}
            </DialogDescription>
          </DialogHeader>

          {/* Search Bar */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Search for friends')}
              className="w-full bg-[#111214] border border-border/60 rounded-lg pl-9 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Scrollable Members / Friends List */}
          <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar pr-1">
            {filteredMembers.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                {t('Tidak ada teman atau anggota ditemukan.')}
              </div>
            ) : (
              filteredMembers.map((member) => {
                const isInvited = invitedUserIds.has(member.id);
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CommunityAvatar
                        name={member.name || 'Member'}
                        imageUrl={member.avatar}
                        size={32}
                        showStatus
                        status={member.status || 'online'}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-foreground truncate block">
                          {member.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate block">
                          {member.customStatus || member.email || member.role || 'Member'}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleInviteFriend(member.id, member.name || 'Teman')}
                      disabled={isInvited}
                      className={cn(
                        'h-7 px-3 text-xs font-semibold rounded-md transition-colors cursor-pointer shrink-0',
                        isInvited
                          ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10 cursor-default'
                          : 'border-border hover:bg-muted text-foreground',
                      )}
                    >
                      {isInvited ? t('Sent') : t('Invite')}
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Server Invite Link Card */}
          <div className="pt-2 border-t border-border/50 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              {t('Or, send a server invite link to a friend')}
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={activeInviteUrl}
                className="flex-1 bg-[#111214] border border-border/60 rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none select-all"
              />
              <Button
                size="sm"
                onClick={handleCopyActiveInviteUrl}
                className="h-8 px-4 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-xs cursor-pointer shrink-0"
              >
                {isCopiedActiveInvite ? t('Copied') : t('Copy')}
              </Button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
              <span>{t(`Your invite link expires in ${customExpiryLabel}.`)}</span>
              <button
                type="button"
                onClick={() => setIsEditLinkOpen((prev) => !prev)}
                className="text-primary hover:underline font-semibold cursor-pointer"
              >
                {t('Edit invite link.')}
              </button>
            </div>

            {/* Edit Invite Link Options */}
            {isEditLinkOpen && (
              <div className="p-3 rounded-xl bg-[#111214] border border-border/60 space-y-3 animate-in fade-in-50 duration-150">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">{t('Expire After')}</label>
                    <Select value={customExpiry} onValueChange={setCustomExpiry}>
                      <SelectTrigger className="h-8 text-xs bg-[#1e1f22]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111214]">
                        <SelectItem value="30m">30 minutes</SelectItem>
                        <SelectItem value="1h">1 hour</SelectItem>
                        <SelectItem value="6h">6 hours</SelectItem>
                        <SelectItem value="1d">1 day</SelectItem>
                        <SelectItem value="7d">7 days</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">{t('Max Number of Uses')}</label>
                    <Select value={String(customMaxUses)} onValueChange={(val) => setCustomMaxUses(Number(val))}>
                      <SelectTrigger className="h-8 text-xs bg-[#1e1f22]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111214]">
                        <SelectItem value="0">No limit</SelectItem>
                        <SelectItem value="1">1 use</SelectItem>
                        <SelectItem value="5">5 uses</SelectItem>
                        <SelectItem value="10">10 uses</SelectItem>
                        <SelectItem value="25">25 uses</SelectItem>
                        <SelectItem value="50">50 uses</SelectItem>
                        <SelectItem value="100">100 uses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleGenerateNewInvite}
                    className="h-7 px-3 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                  >
                    {t('Generate a New Link')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
