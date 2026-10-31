import React, { useState } from 'react';
import { Plus, Copy, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
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
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [newInviteMaxUses, setNewInviteMaxUses] = useState(0);
  const [newInviteExpiry, setNewInviteExpiry] = useState<'never' | '1d' | '7d' | '30d'>('7d');

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-bold">{t('Link Undangan')}</h2>
        <Button size="sm" onClick={() => setIsCreatingInvite(!isCreatingInvite)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          {isCreatingInvite ? t('Batal') : t('Buat Link Baru')}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-6">{t('Kelola semua tautan undangan ke server ini.')}</p>

      {/* Active URL Card */}
      <div className="rounded-lg border bg-card/40 p-4 mb-6">
        <p className="text-xs font-semibold text-muted-foreground mb-1.5">{t('Link Undangan Utama')}</p>
        <div className="flex gap-2">
          <Input
            readOnly
            value={`${window.location.origin}/messages?invite=${activeColony?.inviteCode || activeColony?.id}`}
            className="text-xs font-mono"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/messages?invite=${activeColony?.inviteCode || activeColony?.id}`,
              );
              toast.success(t('Link undangan disalin! 📋'));
            }}
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Create New Invite Form */}
      {isCreatingInvite && (
        <div className="rounded-lg border bg-card/60 p-4 mb-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('Buat Link Undangan Kustom')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">{t('Masa Berlaku')}</label>
              <Select
                value={newInviteExpiry}
                onValueChange={(val: any) => setNewInviteExpiry(val)}
              >
                <SelectTrigger className="w-full text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">{t('24 Jam')}</SelectItem>
                  <SelectItem value="7d">{t('7 Hari')}</SelectItem>
                  <SelectItem value="30d">{t('30 Hari')}</SelectItem>
                  <SelectItem value="never">{t('Tanpa Batas Waktu')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">{t('Maksimal Penggunaan')}</label>
              <Select
                value={String(newInviteMaxUses)}
                onValueChange={(val) => setNewInviteMaxUses(Number(val))}
              >
                <SelectTrigger className="w-full text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t('Tanpa Batas Penggunaan')}</SelectItem>
                  <SelectItem value="1">1 {t('Penggunaan')}</SelectItem>
                  <SelectItem value="5">5 {t('Penggunaan')}</SelectItem>
                  <SelectItem value="25">25 {t('Penggunaan')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            size="sm"
            onClick={async () => {
              const expiryDate =
                newInviteExpiry === 'never'
                  ? null
                  : new Date(
                      Date.now() +
                        (newInviteExpiry === '1d' ? 86400000 : newInviteExpiry === '7d' ? 7 * 86400000 : 30 * 86400000),
                    ).toISOString();
              const inv = await colonyApi.createInvite(activeColony.id, {
                maxUses: newInviteMaxUses,
                expiresAt: expiryDate,
              });
              setServerInvites((prev) => [inv, ...prev]);
              setIsCreatingInvite(false);
              toast.success(t(`Link undangan baru dibuat: ${inv.code} 🎉`));
            }}
          >
            {t('Buat Tautan')}
          </Button>
        </div>
      )}

      {/* Invites list */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('Daftar Tautan Undangan Aktif')}
        </p>
        {serverInvites.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">{t('Belum ada tautan undangan kustom.')}</p>
        ) : (
          serverInvites.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/40 text-xs">
              <div>
                <p className="font-mono font-semibold text-primary">{inv.code}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {t('Dibuat oleh')} {inv.inviterName || 'Admin'} • {inv.uses} {t('digunakan')}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/messages?invite=${inv.code}`);
                    toast.success(t('Tautan undangan disalin! 📋'));
                  }}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  {t('Salin')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={async () => {
                    setServerInvites((prev) => prev.filter((i) => i.id !== inv.id));
                    await colonyApi.revokeInvite(activeColony.id, inv.id);
                    toast.success(t('Tautan undangan berhasil dibatalkan'));
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
