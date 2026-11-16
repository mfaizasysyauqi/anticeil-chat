import React from 'react';
import {
  NectarSubtab,
  ColonyBoostSubtab,
  SubscriptionsSubtab,
  GiftInventorySubtab,
  BillingHistorySubtab,
} from './billing';

export interface BillingTabProps {
  activeSection: 'nitro' | 'boost' | 'subscriptions' | 'gifts' | 'billing';
  theme?: any;
  onNavigateSection?: (section: string) => void;
}

export function BillingTab({
  activeSection,
  theme,
  onNavigateSection,
}: BillingTabProps) {
  switch (activeSection) {
    case 'nitro':
      return <NectarSubtab theme={theme} />;
    case 'boost':
      return <ColonyBoostSubtab onNavigateSection={onNavigateSection} />;
    case 'subscriptions':
      return <SubscriptionsSubtab onNavigateSection={onNavigateSection} />;
    case 'gifts':
      return <GiftInventorySubtab />;
    case 'billing':
      return <BillingHistorySubtab />;
    default:
      return null;
  }
}

export {
  NectarSubtab,
  NectarSubtab as NitroSubtab,
  ColonyBoostSubtab,
  SubscriptionsSubtab,
  GiftInventorySubtab,
  BillingHistorySubtab,
};
