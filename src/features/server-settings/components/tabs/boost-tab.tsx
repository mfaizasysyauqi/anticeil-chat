import React, { useState } from 'react';
import { Zap, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { communityApi } from '@/chat/chat-api';
import type { CommunityHub } from '@/chat/chat-types';

interface BoostTabProps {
  activeHub: CommunityHub;
  onUpdateHub: (hubId: string, updates: Partial<CommunityHub>) => Promise<void>;
  t: (key: string) => string;
}

export function BoostTab({ activeHub, onUpdateHub, t }: BoostTabProps) {
  const [isBoostingServer, setIsBoostingServer] = useState(false);

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">{t('Server Boost Perks')}</h2>
      <p className="text-sm text-muted-foreground mb-6">
        {t('Tingkatkan performa server Anda untuk membuka batas kapasitas, audio HD, dan kustomisasi ekstra.')}
      </p>

      {/* Hero Boost Banner */}
      <div className="rounded-xl border bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">
                  {t('Tingkat')} {activeHub?.boostTier || 0}
                </h3>
                <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/30">
                  {activeHub?.boostsCount || 0} {t('Boost Aktif')}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {(activeHub?.boostTier || 0) >= 3
                  ? t('Tingkat Maksimal Tercapai!')
                  : `${
                      (activeHub?.boostTier || 0) === 2
                        ? 14 - (activeHub?.boostsCount || 0)
                        : (activeHub?.boostTier || 0) === 1
                          ? 7 - (activeHub?.boostsCount || 0)
                          : 2 - (activeHub?.boostsCount || 0)
                    } boost lagi menuju Tingkat ${(activeHub?.boostTier || 0) + 1}`}
              </p>
            </div>
          </div>

          <Button
            disabled={isBoostingServer}
            onClick={async () => {
              setIsBoostingServer(true);
              try {
                const res = await communityApi.boostHub(activeHub.id);
                confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
                await onUpdateHub(activeHub.id, {
                  boostsCount: res.boostsCount,
                  boostTier: res.boostTier,
                });
                toast.success(t(`Server berhasil di-boost! Sekarang di Tingkat ${res.boostTier} ⚡🎉`));
              } catch {
                toast.error(t('Gagal melakukan boost server.'));
              } finally {
                setIsBoostingServer(false);
              }
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
          >
            <Zap className="w-4 h-4 mr-2" />
            {isBoostingServer ? t('Memproses...') : t('Boost Server Ini (+1 Boost)')}
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{t('Kemajuan Boost')}</span>
            <span>{activeHub?.boostsCount || 0} / 14</span>
          </div>
          <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/5">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(5, ((activeHub?.boostsCount || 0) / 14) * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Perks per tier */}
      <div className="space-y-3">
        {[
          {
            tier: 1,
            boostsRequired: 2,
            title: t('Tingkat 1 — Dasar Komunitas'),
            perks: [t('+50 Slot Emoji Kustom Server'), t('Kualitas Audio Suara 128 Kbps'), t('Banner Server Kustom')],
          },
          {
            tier: 2,
            boostsRequired: 7,
            title: t('Tingkat 2 — Performa Tinggi'),
            perks: [t('+100 Slot Emoji Kustom Server'), t('Batas Upload File 50 MB'), t('Saluran Automasi Bot Khusus')],
          },
          {
            tier: 3,
            boostsRequired: 14,
            title: t('Tingkat 3 — Eksklusif & Vanity'),
            perks: [t('+250 Slot Emoji Kustom Server'), t('Batas Upload File 100 MB'), t('Link Undangan Vanity Kustom')],
          },
        ].map((tInfo) => {
          const isUnlocked = (activeHub?.boostTier || 0) >= tInfo.tier;
          return (
            <div
              key={tInfo.tier}
              className={cn(
                'rounded-lg border p-4 transition-colors',
                isUnlocked ? 'bg-purple-500/5 border-purple-500/20' : 'bg-card/40 opacity-70',
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm flex items-center gap-2">
                  <Award className={cn('w-4 h-4', isUnlocked ? 'text-purple-400' : 'text-muted-foreground')} />
                  {tInfo.title}
                </span>
                <Badge
                  variant={isUnlocked ? 'default' : 'outline'}
                  className={isUnlocked ? 'bg-purple-600 text-[10px]' : 'text-[10px]'}
                >
                  {isUnlocked ? t('Terbuka ✅') : `${tInfo.boostsRequired} Boost`}
                </Badge>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                {tInfo.perks.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
