import React from 'react';
import { Users, TrendingUp, ShieldCheck, ChevronRight, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ColonyIcon } from './colony-icon';
import type { Colony } from '@/chat/chat-types';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';

export interface ColonyHeroCardProps {
  colony: Colony;
  isJoined?: boolean;
  onJoin?: (colony: Colony) => void;
  onOpen?: (colonyId: string) => void;
  isJoining?: boolean;
  className?: string;
}

export function ColonyHeroCard({
  colony,
  isJoined = false,
  onJoin,
  onOpen,
  isJoining = false,
  className,
}: ColonyHeroCardProps) {
  const { t } = useTranslation();

  return (
    <Card
      className={cn(
        'relative rounded-xl overflow-hidden border border-border/80 bg-gradient-to-r from-sidebar-primary/25 via-background to-emerald-950/20 p-5 sm:p-6 shadow-md',
        className
      )}
    >
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          <div className="size-14 rounded-xl bg-card border border-sidebar-primary/40 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
            <ColonyIcon hub={colony} />
          </div>
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sidebar-primary/20 text-sidebar-primary border border-sidebar-primary/40 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {t('Server Pilihan Komunitas')}
              </span>
              {colony.verified && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {t('Terverifikasi')}
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-foreground truncate">
              {colony.name}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2 max-w-xl leading-relaxed">
              {colony.description || t('Komunitas resmi Anticeil untuk kolaborasi kreatif dan obrolan.')}
            </p>
            <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{typeof colony.onlineCount === 'number' ? colony.onlineCount : (typeof colony.membersCount === 'number' ? Math.max(1, colony.membersCount) : 1)} Online</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-muted-foreground" />
                <span>{typeof colony.membersCount === 'number' ? colony.membersCount : 1} Anggota</span>
              </span>
            </div>
          </div>
        </div>

        {isJoined ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onOpen?.(colony.id)}
            className="h-8 px-4 text-xs font-semibold cursor-pointer shadow-xs shrink-0 flex items-center gap-1.5"
          >
            <span>{t('Buka Colony')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="teal"
            size="sm"
            disabled={isJoining}
            onClick={() => onJoin?.(colony)}
            className="h-8 px-4 text-xs font-semibold cursor-pointer shadow-xs shrink-0 flex items-center gap-1.5"
          >
            {isJoining ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span>{t('Gabung Sekarang')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  );
}
