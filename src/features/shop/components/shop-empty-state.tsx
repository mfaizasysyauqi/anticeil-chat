import React from 'react';
import { ShoppingBag, Search, Sparkles, Store, Heart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty';
import { useTranslation } from '@/core/i18n';

export type ShopEmptyVariant =
  | 'search'
  | 'filter'
  | 'featured'
  | 'dew'
  | 'app_shops'
  | 'browse'
  | 'all'
  | 'wishlist';

export interface ShopEmptyStateProps {
  variant?: ShopEmptyVariant;
  searchQuery?: string;
  selectedApp?: string;
  hasActiveFilters?: boolean;
  isAdmin?: boolean;
  onResetSearch?: () => void;
  onResetFilters?: () => void;
  onOpenAddProduct?: () => void;
  compact?: boolean;
  className?: string;
}

/**
 * Reusable DRY empty state component for Shop tabs and modals
 * Ensures 100% consistency with other features (Message Requests, Friends, Apps, Quests)
 * using EmptyState with Lucide SVG icons instead of raw emojis or custom styling.
 */
export function ShopEmptyState({
  variant = 'all',
  searchQuery,
  selectedApp,
  hasActiveFilters,
  isAdmin,
  onResetSearch,
  onResetFilters,
  onOpenAddProduct,
  compact = false,
  className,
}: ShopEmptyStateProps) {
  const { t } = useTranslation();

  if (variant === 'wishlist') {
    return (
      <EmptyState
        icon={<Heart className="w-8 h-8 text-pink-500/80 stroke-[1.8]" />}
        title={t('Wishlist Masih Kosong')}
        description={t('Belum ada item di wishlist Anda. Klik ikon hati pada item untuk menyimpannya di sini.')}
        compact={compact}
        className={className}
      />
    );
  }

  if (searchQuery && searchQuery.trim().length > 0) {
    return (
      <EmptyState
        icon={<Search className="w-8 h-8 text-primary/80 stroke-[1.8]" />}
        title={t('Tidak Ada Item Ditemukan')}
        description={t(`Tidak ada item yang cocok dengan "${searchQuery}". Coba kata kunci lain.`)}
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
        compact={compact}
        className={className}
      />
    );
  }

  if (hasActiveFilters || variant === 'filter') {
    return (
      <EmptyState
        icon={<ShoppingBag className="w-8 h-8 text-primary/80 stroke-[1.8]" />}
        title={t('Tidak Ada Item yang Cocok')}
        description={t('Tidak ada item yang cocok dengan filter yang Anda pilih. Coba atur ulang filter Anda.')}
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
        compact={compact}
        className={className}
      />
    );
  }

  if (variant === 'dew') {
    return (
      <EmptyState
        icon={<Sparkles className="w-8 h-8 text-cyan-400 stroke-[1.8]" />}
        title={t('Belum Ada Item Dew Shop')}
        description={t('Item eksklusif yang dapat dibeli dengan Dew akan segera hadir di sini.')}
        action={
          isAdmin && onOpenAddProduct ? (
            <Button
              size="sm"
              onClick={onOpenAddProduct}
              className="gap-1.5 text-xs font-semibold cursor-pointer bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('Tambah Produk Dew')}</span>
            </Button>
          ) : undefined
        }
        compact={compact}
        className={className}
      />
    );
  }

  if (variant === 'app_shops') {
    return (
      <EmptyState
        icon={<Store className="w-8 h-8 text-primary/80 stroke-[1.8]" />}
        title={selectedApp ? `${selectedApp} Shop Kosong` : t('Toko Aplikasi Kosong')}
        description={t('Belum ada item kosmetik yang tersedia untuk aplikasi ini.')}
        action={
          isAdmin && onOpenAddProduct ? (
            <Button
              size="sm"
              onClick={onOpenAddProduct}
              className="gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('Tambah Produk Aplikasi')}</span>
            </Button>
          ) : undefined
        }
        compact={compact}
        className={className}
      />
    );
  }

  // Default: 'featured', 'browse', 'all'
  return (
    <EmptyState
      icon={<ShoppingBag className="w-8 h-8 text-primary/80 stroke-[1.8]" />}
      title={t('Belum Ada Item di Toko')}
      description={t('Belum ada item yang tersedia saat ini. Koleksi kosmetik baru akan segera hadir.')}
      action={
        isAdmin && onOpenAddProduct ? (
          <Button
            size="sm"
            onClick={onOpenAddProduct}
            className="gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('Tambah Produk Pertama')}</span>
          </Button>
        ) : undefined
      }
      compact={compact}
      className={className}
    />
  );
}
