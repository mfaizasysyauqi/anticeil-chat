import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { availablePlatforms } from '@/features/user-settings/data/platforms';
import type { UserConnectionItem } from '@/features/user-settings/api/games-apps-api';

export interface ProfileConnectedPlatformsSectionProps {
  userConnections: UserConnectionItem[];
  onOpenConnectModal: (platform?: any) => void;
}

export function ProfileConnectedPlatformsSection({
  userConnections,
  onOpenConnectModal,
}: ProfileConnectedPlatformsSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-foreground">
            {t('Akun & Layanan Terhubung')}
          </span>
          <p className="text-[11px] text-muted-foreground">
            {t('Hubungkan profil GitHub, Spotify, Discord, atau Twitter Anda.')}
          </p>
        </div>
        <Button
          size="sm"
          variant="tealSecondary"
          onClick={() => onOpenConnectModal()}
          className="text-xs h-7 px-3 font-semibold cursor-pointer"
        >
          + {t('Hubungkan')}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {availablePlatforms.slice(0, 10).map((p) => {
          const isConnected = userConnections.some((c) => c.platformId === p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onOpenConnectModal(p)}
              className={cn(
                'size-9 rounded-xl flex items-center justify-center text-base border transition-all cursor-pointer relative group',
                isConnected
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-border/80 bg-secondary/60 hover:border-sidebar-primary hover:scale-105',
              )}
              title={isConnected ? `${p.name} (Terhubung)` : `Hubungkan ${p.name}`}
            >
              <span>{p.icon}</span>
              {isConnected && (
                <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-emerald-500 border border-card" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
