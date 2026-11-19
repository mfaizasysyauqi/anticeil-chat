import React from 'react';
import { Users, Plus, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ColonyIcon } from './colony-icon';
import type { Colony } from '@/chat/chat-types';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';

export interface ColonyCardProps {
  colony: Colony;
  isJoined?: boolean;
  onJoin?: (colony: Colony) => void;
  onOpen?: (colonyId: string) => void;
  isJoining?: boolean;
  className?: string;
}

export function ColonyCard({
  colony,
  isJoined = false,
  onJoin,
  onOpen,
  isJoining = false,
  className,
}: ColonyCardProps) {
  const { t } = useTranslation();

  const handleCardClick = () => {
    if (isJoined && onOpen) {
      onOpen(colony.id);
    } else if (!isJoined && onJoin) {
      onJoin(colony);
    }
  };

  return (
    <Card
      onClick={handleCardClick}
      className={cn(
        'p-4 rounded-xl border border-border/80 bg-card hover:border-sidebar-primary/50 transition-all flex flex-col justify-between gap-3.5 shadow-xs group hover:shadow-md cursor-pointer',
        className
      )}
    >
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="size-12 rounded-lg bg-secondary/60 border border-border flex items-center justify-center shrink-0 overflow-hidden shadow-xs group-hover:scale-105 transition-transform">
            <ColonyIcon hub={colony} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-foreground truncate group-hover:text-sidebar-primary transition-colors">
                {colony.name}
              </h3>
              {colony.verified && (
                <span title={t('Terverifikasi')}>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
              {colony.description || t('Komunitas Anticeil untuk kolaborasi dan obrolan.')}
            </p>
          </div>
        </div>

        {/* Tags row */}
        {colony.tags && colony.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {colony.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-muted-foreground font-mono"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-border/50 flex items-center justify-between">
        <div className="text-[10px] text-muted-foreground flex items-center gap-2 font-medium">
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>{colony.onlineCount || Math.max(Math.floor((colony.membersCount || 10) * 0.3), 1)}</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3 text-muted-foreground" />
            <span>{colony.membersCount || 10}</span>
          </span>
        </div>

        {isJoined ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onOpen?.(colony.id);
            }}
            className="h-7 px-3 text-xs font-bold gap-1 cursor-pointer rounded-lg shadow-xs"
          >
            <span>{t('Buka Colony')}</span>
            <ArrowRight className="w-3 h-3" />
          </Button>
        ) : (
          <Button
            size="sm"
            variant="teal"
            disabled={isJoining}
            onClick={(e) => {
              e.stopPropagation();
              onJoin?.(colony);
            }}
            className="h-7 px-3 text-xs font-bold gap-1 cursor-pointer rounded-lg shadow-xs"
          >
            {isJoining ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Plus className="w-3 h-3 stroke-[2.5]" />
            )}
            <span>{t('Gabung')}</span>
          </Button>
        )}
      </div>
    </Card>
  );
}
