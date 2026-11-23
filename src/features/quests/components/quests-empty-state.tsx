import React from 'react';
import { Compass, Clock, Trophy, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty';
import { useTranslation } from '@/core/i18n';

export type QuestsTab = 'all' | 'accepted' | 'claimed';

export interface QuestsEmptyStateProps {
  activeTab: QuestsTab;
  searchQuery?: string;
  hasActiveFilters?: boolean;
  isAdmin?: boolean;
  onResetSearch?: () => void;
  onResetFilters?: () => void;
  onGoToAll?: () => void;
  onCreateQuest?: () => void;
  className?: string;
}

/**
 * Reusable DRY empty state component for Quests tabs
 * Ensures 100% consistency with other features (Message Requests, Friends, Apps, Shop)
 * using EmptyState with Lucide SVG icons instead of raw emojis and dashed boxes.
 */
export function QuestsEmptyState({
  activeTab,
  searchQuery,
  hasActiveFilters,
  isAdmin,
  onResetSearch,
  onResetFilters,
  onGoToAll,
  onCreateQuest,
  className,
}: QuestsEmptyStateProps) {
  const { t } = useTranslation();

  if (searchQuery && searchQuery.trim().length > 0) {
    return (
      <EmptyState
        icon={<Search className="w-8 h-8 text-primary/80 stroke-[1.8]" />}
        title={t('Tidak Ada Quest Ditemukan')}
        description={t(`Tidak ada quest yang cocok dengan "${searchQuery}". Coba kata kunci lain.`)}
        action={
          onResetSearch ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onResetSearch}
              className="h-8 px-4 text-xs font-semibold cursor-pointer"
            >
              {t('Reset Pencarian')}
            </Button>
          ) : undefined
        }
        className={className}
      />
    );
  }

  if (hasActiveFilters && activeTab === 'all') {
    return (
      <EmptyState
        icon={<Compass className="w-8 h-8 text-primary/80 stroke-[1.8]" />}
        title={t('Tidak Ada Quest yang Cocok')}
        description={t('Tidak ada quest yang sesuai dengan filter yang dipilih. Coba atur ulang filter Anda.')}
        action={
          onResetFilters ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onResetFilters}
              className="h-8 px-4 text-xs font-semibold cursor-pointer"
            >
              {t('Reset Filter')}
            </Button>
          ) : undefined
        }
        className={className}
      />
    );
  }

  if (activeTab === 'accepted') {
    return (
      <EmptyState
        icon={<Clock className="w-8 h-8 text-primary/80 stroke-[1.8]" />}
        title={t('Belum Ada Quest yang Diterima')}
        description={t('Ambil dan terima quest dari tab Semua Quest untuk mulai menjalankan misi dan mengumpulkan Dew gratis.')}
        action={
          onGoToAll ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onGoToAll}
              className="font-semibold text-xs h-8 px-4 cursor-pointer"
            >
              {t('Lihat Semua Quest')}
            </Button>
          ) : undefined
        }
        className={className}
      />
    );
  }

  if (activeTab === 'claimed') {
    return (
      <EmptyState
        icon={<Trophy className="w-8 h-8 text-primary/80 stroke-[1.8]" />}
        title={t('Belum Ada Quest yang Diklaim')}
        description={t('Selesaikan quest di tab Semua Quest untuk mengumpulkan Dew gratis dan membuka kosmetik profil.')}
        action={
          onGoToAll ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onGoToAll}
              className="font-semibold text-xs h-8 px-4 cursor-pointer"
            >
              {t('Lihat Semua Quest')}
            </Button>
          ) : undefined
        }
        className={className}
      />
    );
  }

  // Default: activeTab === 'all' with no quests in database
  return (
    <EmptyState
      icon={<Compass className="w-8 h-8 text-primary/80 stroke-[1.8]" />}
      title={t('Belum Ada Quest')}
      description={t('Database quest kosong saat ini. Quest baru akan muncul di sini saat tersedia.')}
      action={
        isAdmin && onCreateQuest ? (
          <Button
            size="sm"
            onClick={onCreateQuest}
            className="gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('Tambah Quest Pertama')}</span>
          </Button>
        ) : undefined
      }
      className={className}
    />
  );
}
