'use client';

import React from 'react';
import { BottomRailMeters } from './BottomRailMeters';
import { useCreditStore } from '../../features/credits/store/useCreditStore';

export interface SidebarRailProps {
  topContent?: React.ReactNode;
  children?: React.ReactNode;
  bottomContent?: React.ReactNode;
  showMeters?: boolean;
  onOpenTopup?: () => void;
  onOpenTiers?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function SidebarRail({
  topContent,
  children,
  bottomContent,
  showMeters = true,
  onOpenTopup,
  onOpenTiers,
  className = '',
  style,
}: SidebarRailProps) {
  const openPricingModal = useCreditStore((s) => s.openPricingModal);

  const handleTopup = onOpenTopup || (() => openPricingModal('topup'));
  const handleTiers = onOpenTiers || (() => openPricingModal('tiers'));

  return (
    <aside
      className={`sidebar-icon-rail ${className}`.trim()}
      style={{
        width: '48px',
        height: '100%',
        backgroundColor: 'var(--bg-main)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 0,
        flexShrink: 0,
        zIndex: 10,
        ...style,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        {topContent}
        {children}
      </div>

      {showMeters && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {bottomContent !== undefined ? (
            bottomContent
          ) : (
            <BottomRailMeters onOpenTopup={handleTopup} onOpenTiers={handleTiers} />
          )}
        </div>
      )}
    </aside>
  );
}
