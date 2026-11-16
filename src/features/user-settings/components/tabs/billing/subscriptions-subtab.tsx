import React, { useState, useEffect } from 'react';
import { Sparkles, Check, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import {
  subscriptionsApi,
  type UserSubscription,
} from '@/features/billing/api/subscriptions-api';

export interface SubscriptionsSubtabProps {
  onNavigateSection?: (section: string) => void;
}

export function SubscriptionsSubtab({
  onNavigateSection,
}: SubscriptionsSubtabProps) {
  const { t } = useTranslation();
  const [sub, setSub] = useState<UserSubscription | null>(null);

  useEffect(() => {
    subscriptionsApi.getSubscription().then(setSub);
  }, []);

  const handleCancel = async () => {
    try {
      const updated = await subscriptionsApi.cancelSubscription();
      setSub(updated);
      toast.success(t('Langganan berhasil dibatalkan'));
    } catch {
      toast.error(t('Gagal membatalkan langganan'));
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <h2 className="text-xl font-bold text-foreground">
        {t('Subscriptions')}
      </h2>

      {/* 1. Your Subscriptions */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            {t('Your Subscriptions')}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
            {t(
              'These are your current subscriptions. They will be billed on the same billing cycle. You can update any subscription at any time.',
            )}
          </p>
        </div>

        {!sub || sub.status !== 'active' ? (
          <div className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center justify-center text-center space-y-3 shadow-xs">
            <div className="size-14 rounded-2xl bg-muted/60 border border-border flex items-center justify-center text-2xl select-none shadow-2xs">
              🎲
            </div>
            <div className="text-xs font-semibold text-muted-foreground">
              {t('You have no active subscriptions')}
            </div>
            <Button
              size="sm"
              onClick={() => onNavigateSection?.('nitro')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-8 px-4 rounded-xl cursor-pointer"
            >
              {t('Explore Nectar Plans')}
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-xl bg-gradient-to-tr from-pink-500 to-indigo-500 flex items-center justify-center text-white shadow-sm">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span>{sub.planName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {t('Aktif')}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {sub.renewsAt
                      ? `${t('Diperpanjang pada')} ${new Date(sub.renewsAt).toLocaleDateString()}`
                      : t('Langganan Aktif')}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30 cursor-pointer h-8"
              >
                {t('Batalkan')}
              </Button>
            </div>

            <div className="pt-3 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sub.perks.map((perk, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{perk}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Subscription Credit */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            {t('Subscription Credit')}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
            {t(
              'When you accept a gift while you have a running subscription, redeem a promotion, or accept a gift that differs from your current subscription, it will appear here as credit.',
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center justify-center text-center space-y-3 shadow-xs">
          <div className="size-14 rounded-2xl bg-muted/60 border border-border flex items-center justify-center text-2xl select-none shadow-2xs">
            🎲
          </div>
          <div className="text-xs font-semibold text-muted-foreground">
            {t('You have no unused credits')}
          </div>
        </div>
      </div>
    </div>
  );
}
