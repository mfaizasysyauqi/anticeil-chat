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
    <div className="w-full min-w-0">
      <h2 className="text-xl font-bold mb-1">{t('Colony Boost Perks')}</h2>
      <p className="text-sm text-muted-foreground mb-6">
        {t('Tingkatkan performa colony Anda untuk membuka batas kapasitas, audio HD, dan kustomisasi ekstra.')}
      </p>

      {/* Hero Boost Banner */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/15 via-background to-card p-4 sm:p-6 mb-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-primary fill-primary/20" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg text-foreground">
                  {t('Tingkat')} {activeHub?.boostTier || 0}
                </h3>
                <Badge
                  variant="outline"
                  className="text-[10px] font-semibold bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/30"
                >
                  {activeHub?.boostsCount || 0} {t('Boost Aktif')}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate sm:whitespace-normal">
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
                toast.error(t('Gagal melakukan boost colony.'));
              } finally {
                setIsBoostingServer(false);
              }
            }}
            className="w-full sm:w-auto shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer shadow-xs rounded-[6px] transition-all flex items-center justify-center gap-2 h-9 px-4"
          >
            <Zap className="w-4 h-4 fill-primary-foreground/30" />
            <span className="truncate">{isBoostingServer ? t('Memproses...') : t('Boost Colony Ini (+1 Boost)')}</span>
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
            <span>{t('Kemajuan Boost')}</span>
            <span>{activeHub?.boostsCount || 0} / 14</span>
          </div>
          <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden border border-border/40">
            <div
              className="bg-gradient-to-r from-primary via-emerald-400 to-amber-400 h-full rounded-full transition-all duration-500"
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
            perks: [t('+50 Slot Emoji Kustom Server'), t('Kualitas Audio Suara 128 Kbps'), t('Banner Colony Kustom')],
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
                isUnlocked ? 'bg-primary/5 border-primary/30' : 'bg-card/40 border-border opacity-70',
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm flex items-center gap-2">
                  <Award className={cn('w-4 h-4', isUnlocked ? 'text-primary' : 'text-muted-foreground')} />
                  {tInfo.title}
                </span>
                <Badge
                  variant={isUnlocked ? 'default' : 'outline'}
                  className={isUnlocked ? 'bg-primary text-primary-foreground text-[10px] font-semibold' : 'text-[10px]'}
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
