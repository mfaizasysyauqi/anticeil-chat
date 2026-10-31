import React from 'react';
import { Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { colonyApi } from '@/chat/chat-api';
import type { Colony, ColonyBan } from '@/chat/chat-types';

interface BansTabProps {
  activeColony: Colony;
  serverBans: ColonyBan[];
  setServerBans: React.Dispatch<React.SetStateAction<ColonyBan[]>>;
  t: (key: string) => string;
}

export function BansTab({
  activeColony,
  serverBans,
  setServerBans,
  t,
}: BansTabProps) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-1">{t('Pengguna Diblokir')}</h2>
      <p className="text-sm text-muted-foreground mb-6">
        {t(
          'Daftar pengguna yang telah diblokir dari server ini. Pengguna diblokir tidak dapat melihat atau bergabung ke saluran.',
        )}
      </p>

      <div className="space-y-2">
        {serverBans.length === 0 ? (
          <div className="rounded-lg border bg-card/40 p-8 text-center">
            <Ban className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm font-medium">{t('Tidak ada pengguna yang diblokir')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('Komunitas Anda bersih dan tertib! ✨')}</p>
          </div>
        ) : (
          serverBans.map((ban) => (
            <div
              key={ban.id}
              className="flex items-center justify-between p-3.5 rounded-lg border bg-card/40 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <Ban className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{ban.userName}</p>
                  <p className="text-muted-foreground text-[11px]">
                    {t('Alasan')}: {ban.reason || t('Melanggar aturan')} • {dayjs(ban.createdAt).format('DD MMM YYYY')}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  setServerBans((prev) => prev.filter((b) => b.userId !== ban.userId));
                  await colonyApi.unbanUser(activeColony.id, ban.userId);
                  toast.success(t(`Blokir untuk ${ban.userName} telah dibatalkan! ✅`));
                }}
              >
                {t('Batal Blokir')}
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
