import React from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/core/i18n';

export interface SubscriptionsSubtabProps {
  onNavigateSection?: (section: string) => void;
}

export function SubscriptionsSubtab({
  onNavigateSection,
}: SubscriptionsSubtabProps) {
  const { t } = useTranslation();

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
