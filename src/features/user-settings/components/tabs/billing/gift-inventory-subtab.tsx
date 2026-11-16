import React, { useState, useEffect } from 'react';
import { Gift, CheckCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import { giftsApi, type GiftItem } from '@/features/billing/api/gifts-api';

export function GiftInventorySubtab() {
  const { t } = useTranslation();
  const [redeemCodeInput, setRedeemCodeInput] = useState('');
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    giftsApi.getGifts().then(setGifts);
  }, []);

  const handleRedeemCode = async () => {
    if (!redeemCodeInput.trim()) {
      toast.error(t('Masukkan kode hadiah terlebih dahulu'));
      return;
    }
    setIsRedeeming(true);
    try {
      const res = await giftsApi.redeemCode(redeemCodeInput);
      if (res.success) {
        toast.success(t(res.message));
        setRedeemCodeInput('');
        const updated = await giftsApi.getGifts();
        setGifts(updated);
      } else {
        toast.error(t(res.message));
      }
    } catch {
      toast.error(t('Gagal mengklaim kode hadiah'));
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <h2 className="text-xl font-bold text-foreground">
        {t('Gift Inventory')}
      </h2>

      {/* 1. Redeem Codes */}
      <div id="gift-redeem-codes" className="space-y-3 scroll-mt-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            {t('Redeem Codes')}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
            {t(
              "Received a code for Nectar or a game? That's exciting! Enter it below.",
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl">
          <Input
            value={redeemCodeInput}
            onChange={(e) => setRedeemCodeInput(e.target.value)}
            placeholder="WUMP-AAAAA-BBBBB-CCCCC"
            className="h-10 text-xs font-mono uppercase bg-card border-border tracking-wider"
          />
          <Button
            onClick={handleRedeemCode}
            disabled={isRedeeming}
            className="h-10 px-6 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer shrink-0"
          >
            {isRedeeming ? t('Mengklaim...') : t('Redeem')}
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border/50" />

      {/* 2. The Gifting Badge */}
      <div id="gift-gifting-badge" className="space-y-3 scroll-mt-4">
        <h3 className="text-sm font-bold text-foreground">
          {t('The Gifting Badge')}
        </h3>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-xs">
          {/* 6 Badges Progression */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
            {[
              {
                tier: 'Patron',
                count: 'Gifted 1x',
                icon: '🎁',
                color:
                  'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30',
              },
              {
                tier: 'Champion',
                count: 'Gifted 2x',
                icon: '💎',
                color:
                  'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
              },
              {
                tier: 'Luminary',
                count: 'Gifted 3x',
                icon: '🎀',
                color:
                  'from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30',
              },
              {
                tier: 'Icon',
                count: 'Gifted 6x',
                icon: '🔮',
                color:
                  'from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30',
              },
              {
                tier: 'Hero',
                count: 'Gifted 10x',
                icon: '👑',
                color:
                  'from-violet-500/20 to-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30',
              },
              {
                tier: 'Legend',
                count: 'Gifted 20x',
                icon: '🏆',
                color:
                  'from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30',
              },
            ].map((badge, idx) => (
              <div
                key={idx}
                className={cn(
                  'rounded-2xl border p-3 flex flex-col items-center justify-between gap-2 bg-linear-to-b shadow-2xs hover:scale-105 transition-transform cursor-pointer',
                  badge.color,
                )}
              >
                <span className="text-2xl select-none">{badge.icon}</span>
                <div>
                  <div className="text-xs font-bold text-foreground">
                    {badge.tier}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {badge.count}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border/50">
            <p className="text-[11px] text-muted-foreground leading-relaxed max-w-md">
              {t(
                'Your badge progresses as you gift. Exceptions include when a gift is refunded or when fraud is detected.',
              )}
            </p>
            <Button
              size="sm"
              onClick={() =>
                toast.info(
                  t(
                    'Pilih teman dari daftar kontak untuk mengirimkan hadiah.',
                  ),
                )
              }
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs h-9 px-4 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
            >
              <Gift className="w-4 h-4" />
              <span>{t('Send a Gift')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border/50" />

      {/* 3. Gifts I Purchased */}
      <div id="gift-purchased" className="space-y-3 scroll-mt-4">
        <h3 className="text-sm font-bold text-foreground">
          {t('Gifts I Purchased')}
        </h3>

        {gifts.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-1.5 shadow-xs">
            <div className="text-xs font-bold text-foreground">
              {t('There are no gifts.')}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {t(
                'Feeling generous? Give someone the gift of Nectar and make their day!',
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {gifts.map((g) => (
              <div
                key={g.id}
                className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground flex items-center gap-2">
                      <span>{g.title}</span>
                      {g.redeemed && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {t('Diklaim')}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      {g.code}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground text-right shrink-0">
                  {new Date(g.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
