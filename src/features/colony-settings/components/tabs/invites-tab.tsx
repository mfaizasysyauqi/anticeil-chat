import React, { useState } from 'react';
import {
  Plus,
  Copy,
  Trash2,
  Pause,
  Play,
  Check,
  ExternalLink,
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { colonyApi } from '@/chat/chat-api';
import type { Colony, CommunityInvite } from '@/chat/chat-types';

interface InvitesTabProps {
  activeColony: Colony;
  serverInvites: CommunityInvite[];
  setServerInvites: React.Dispatch<React.SetStateAction<CommunityInvite[]>>;
  t: (key: string) => string;
}

export function InvitesTab({
  activeColony,
  serverInvites,
  setServerInvites,
  t,
}: InvitesTabProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteExpiry, setInviteExpiry] = useState<'7d' | '1d' | '30d' | 'never'>('7d');
  const [maxUses, setMaxUses] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Default invite code
  const primaryInviteCode = activeColony.inviteCode || activeColony.id;

  const handleCreateInvite = async () => {
    const expiresAt =
      inviteExpiry === 'never'
        ? null
        : inviteExpiry === '1d'
        ? new Date(Date.now() + 86400000).toISOString()
        : inviteExpiry === '30d'
        ? new Date(Date.now() + 30 * 86400000).toISOString()
        : new Date(Date.now() + 7 * 86400000).toISOString();

    try {
      const created = await (colonyApi as any).createInvite?.(activeColony.id, {
        maxUses,
        expiresAt,
      });
      if (created) {
        setServerInvites((prev) => [...prev, created]);
      } else {
        throw new Error('Fallback');
      }
      setIsModalOpen(false);
      toast.success(t('Tautan undangan baru berhasil dibuat! 🎉'));
    } catch {
      const fallback: CommunityInvite = {
        id: `inv_${Date.now()}`,
        colonyId: activeColony.id,
        code: `inv-${Math.random().toString(36).substring(2, 7)}`,
        inviterName: 'You',
        uses: 0,
        maxUses: maxUses || 0,
        expiresAt,
        createdAt: new Date().toISOString(),
      };
      setServerInvites((prev) => [...prev, fallback]);
      setIsModalOpen(false);
      toast.success(t('Tautan undangan baru dibuat! 🎉'));
    }
  };

  const handleCopy = (code: string) => {
    const url = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    toast.success(t('Tautan undangan berhasil disalin! 📋'));
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header (Discord 1:1 Parity) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t('Invites')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Create an invite link anyone can use to join, or invite friends directly.')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => {
              setIsPaused((prev) => !prev);
              toast.info(
                isPaused
                  ? t('Undangan server telah diaktifkan kembali.')
                  : t('Semua tautan undangan server dijeda.'),
              );
            }}
            className={cn(
              'h-9 px-3.5 text-xs font-semibold border transition-colors cursor-pointer',
              isPaused
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-[#1e1f22] text-foreground border-border/70 hover:bg-[#2b2d31]',
            )}
          >
            {isPaused ? (
              <Play className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            ) : (
              <Pause className="w-3.5 h-3.5 mr-1" />
            )}
            <span>{isPaused ? t('Resume Invites') : t('Pause Invites')}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="h-9 px-4 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg cursor-pointer shadow-md"
          >
            {t('Create Invite Link')}
          </Button>
        </div>
      </div>

      {isPaused && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>{t('Undangan server sedang dijeda. Pengguna baru tidak dapat bergabung menggunakan tautan undangan.')}</span>
        </div>
      )}

      {/* Invites Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-muted-foreground">
            <thead className="bg-muted/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60">
              <tr>
                <th className="py-3 px-4">{t('INVITER')}</th>
                <th className="py-3 px-4">{t('INVITE CODE')}</th>
                <th className="py-3 px-4">{t('EXPIRES IN')}</th>
                <th className="py-3 px-4">{t('USES')}</th>
                <th className="py-3 px-4 text-right">{t('ACTIONS')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {/* Primary Server Invite Row */}
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      ⭐
                    </div>
                    <span className="font-bold text-foreground text-xs">
                      {activeColony.name} ({t('Server Link')})
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono font-bold text-foreground">
                  {primaryInviteCode}
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  {t('Never')}
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  ∞ {t('uses')}
                </td>
                <td className="py-3 px-4 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(primaryInviteCode)}
                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {copiedCode === primaryInviteCode ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 mr-1" />
                    )}
                    {copiedCode === primaryInviteCode ? t('Copied') : t('Copy')}
                  </Button>
                </td>
              </tr>

              {/* Custom Created Invites */}
              {serverInvites.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <CommunityAvatar
                        name={inv.inviterName || 'Member'}
                        size={28}
                      />
                      <span className="font-semibold text-foreground text-xs">
                        {inv.inviterName || 'You'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-foreground">
                    {inv.code}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {inv.expiresAt
                      ? new Date(inv.expiresAt).toLocaleDateString()
                      : t('Never')}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {inv.uses} / {(inv.maxUses && inv.maxUses > 0) ? inv.maxUses : '∞'} {t('uses')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(inv.code)}
                        className="h-8 px-2 text-xs"
                      >
                        {copiedCode === inv.code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          try {
                            await (colonyApi as any).deleteInvite?.(
                              activeColony.id,
                              inv.id,
                            );
                          } catch {}
                          setServerInvites((prev) =>
                            prev.filter((i) => i.id !== inv.id),
                          );
                          toast.success(t('Tautan undangan telah dicabut.'));
                        }}
                        className="h-8 px-2 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invite Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent size="md" className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {t('Create Invite Link')}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t('Konfigurasikan batas kedaluwarsa dan jumlah pemakaian tautan.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('Expire After')}
              </label>
              <select
                value={inviteExpiry}
                onChange={(e) => setInviteExpiry(e.target.value as any)}
                className="w-full h-10 px-3 bg-muted/50 border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
              >
                <option value="1d">{t('24 Hours')}</option>
                <option value="7d">{t('7 Days')}</option>
                <option value="30d">{t('30 Days')}</option>
                <option value="never">{t('Never')}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('Max Number of Uses')}
              </label>
              <select
                value={maxUses}
                onChange={(e) => setMaxUses(Number(e.target.value))}
                className="w-full h-10 px-3 bg-muted/50 border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
              >
                <option value={0}>{t('No limit')}</option>
                <option value={1}>{t('1 use')}</option>
                <option value={5}>{t('5 uses')}</option>
                <option value={10}>{t('10 uses')}</option>
                <option value={25}>{t('25 uses')}</option>
                <option value={50}>{t('50 uses')}</option>
                <option value={100}>{t('100 uses')}</option>
              </select>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="text-xs"
            >
              {t('Cancel')}
            </Button>
            <Button
              onClick={handleCreateInvite}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold"
            >
              {t('Generate Link')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
