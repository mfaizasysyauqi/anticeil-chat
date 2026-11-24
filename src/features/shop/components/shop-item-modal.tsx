import React from 'react';
import {
  Heart,
  Sparkles,
  ShoppingBag,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-react';
import { MediumDialog } from '@/components/ui/medium-dialog';
import { Button } from '@/components/ui/button';
import { AnticeilLogo } from '@/components/ui/anticeil-logo';
import { AnticeilAvatarMannequin } from '@/components/ui/anticeil-avatar-mannequin';
import { NameplateRenderer } from '@/features/profile/components/nameplate-renderer';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import type { ShopItem, ShopBalance } from '../api/shop-api';

export interface ShopItemModalProps {
  open: boolean;
  item: ShopItem | null;
  onClose: () => void;
  currentUser?: any;
  balance: ShopBalance;
  ownedItemIds: Set<string>;
  wishlistedItemIds: Set<string>;
  isPurchasing: boolean;
  isEquipping: boolean;
  onPurchase: (item: ShopItem, currency: 'dew' | 'idr') => void;
  onEquip: (item: ShopItem) => void;
  onToggleWishlist: (e: React.MouseEvent, item: ShopItem) => void;
  onOpenEditProduct: (item: ShopItem) => void;
  onDeleteProduct: (e: React.MouseEvent, itemId: string) => void;
  onTopupDew: (amount: number) => void;
}

export function ShopItemModal({
  open,
  item,
  onClose,
  currentUser,
  balance,
  ownedItemIds,
  wishlistedItemIds,
  isPurchasing,
  isEquipping,
  onPurchase,
  onEquip,
  onToggleWishlist,
  onOpenEditProduct,
  onDeleteProduct,
  onTopupDew,
}: ShopItemModalProps) {
  const { t } = useTranslation();

  if (!item) return null;

  const canUseDew = item.allowDew !== false && (item.priceDew ?? item.priceOrbs ?? 0) > 0;

  return (
    <MediumDialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      icon={<ShoppingBag className="w-4 h-4 text-primary" />}
      title={item.name}
      bodyClassName="p-0 space-y-0"
      className="sm:max-w-md"
    >
      {/* Header Preview Banner with Real Animated Cosmetic in Action */}
      <div className="relative h-36 sm:h-44 bg-muted/30 flex items-center justify-center p-4 sm:p-6 border-b border-border/60 overflow-hidden shrink-0">
        {item.category === 'avatar_decoration' ? (
          <AnticeilAvatarMannequin
            size="xl"
            avatarUrl={currentUser?.avatar}
            decorationId={item.id}
          />
        ) : item.category === 'nameplate' ? (
          <div className="relative w-full max-w-[340px] h-14 sm:h-15 rounded-2xl bg-[#111214] border border-border/80 flex items-center px-3.5 gap-3 overflow-hidden shadow-2xl z-10 select-none">
            {item.gifUrl || item.previewIcon ? (
              <img
                src={item.gifUrl || item.previewIcon}
                alt={item.name}
                className="absolute inset-0 size-full object-cover opacity-95 pointer-events-none select-none z-0"
              />
            ) : (
              <NameplateRenderer nameplateId={item.id} />
            )}
            {/* Scrim gradient for contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent pointer-events-none z-[1]" />

            {/* Mannequin Avatar with Anticeil Logo and status dot */}
            <AnticeilAvatarMannequin
              size="md"
              avatarUrl={currentUser?.avatar}
              statusDot
              statusColor="#23a55a"
            />

            {/* Username display or Discord-style rounded placeholder pill */}
            {currentUser?.name ? (
              <div className="min-w-0 z-10 space-y-0.5">
                <div className="text-xs font-bold text-white drop-shadow-md flex items-center gap-2 leading-none">
                  <span className="truncate">{currentUser.name}</span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-primary/40 text-primary-foreground font-bold shrink-0">NAMECARD</span>
                </div>
                <p className="text-[10px] text-white/70 leading-none truncate">Pratinjau tampilan namecard di chat</p>
              </div>
            ) : (
              <div className="w-28 sm:w-36 h-4 sm:h-4.5 rounded-full bg-white/20 backdrop-blur-md z-10" />
            )}
          </div>
        ) : item.category === 'profile_effect' ? (
          <div className="relative w-full max-w-[280px] sm:max-w-[300px] h-36 rounded-2xl bg-[#1e1f22] border border-border/80 overflow-hidden shadow-2xl z-10 select-none">
            {/* Top Banner area */}
            <div className="h-12 bg-[#111214] border-b border-white/5 relative" />

            {/* Body area */}
            <div className="p-3 pt-0 relative">
              {/* Left Avatar Overlapping Banner */}
              <div className="relative -mt-5 size-11 sm:size-12 rounded-full bg-[#2b2d31] border-[3px] border-[#1e1f22] flex items-center justify-center shrink-0 z-10 shadow-lg">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="User Avatar" className="size-full rounded-full object-cover" />
                ) : (
                  <div className="size-5 text-muted-foreground/60 flex items-center justify-center pointer-events-none">
                    <AnticeilLogo className="size-full fill-current" />
                  </div>
                )}
                <div className="absolute bottom-0 right-0 size-2.5 rounded-full bg-[#23a55a] border-2 border-[#1e1f22]" />
              </div>

              {/* Profile Name & lines */}
              {currentUser?.name ? (
                <div className="mt-1 space-y-0.5">
                  <div className="text-xs font-bold text-white drop-shadow-md truncate">
                    {currentUser.name}
                  </div>
                  <p className="text-[10px] text-white/60 truncate">@{currentUser.username || 'user'}</p>
                </div>
              ) : (
                <div className="mt-1.5 space-y-1">
                  <div className="w-24 sm:w-28 h-2.5 rounded-full bg-white/20" />
                  <div className="w-16 h-2 rounded-full bg-white/10" />
                </div>
              )}
            </div>

            {/* Overlaid Profile Effect */}
            {(item.gifUrl || item.previewIcon) && (
              <img
                src={item.gifUrl || item.previewIcon}
                alt={item.name}
                className="absolute inset-0 size-full object-cover pointer-events-none select-none z-20 mix-blend-screen drop-shadow-[0_0_16px_rgba(0,0,0,0.8)] animate-in fade-in duration-300"
              />
            )}
          </div>
        ) : (
          <div className="absolute inset-0 size-full overflow-hidden">
            {(item.gifUrl || item.previewIcon) && (
              <img
                src={item.gifUrl || item.previewIcon}
                alt={item.name}
                className="absolute inset-0 size-full object-cover opacity-85 pointer-events-none select-none"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
            <div className="absolute bottom-3 left-4 flex items-center gap-2.5 z-10">
              <div className="size-8 rounded-full bg-[#1e1f22] border border-white/40 backdrop-blur-xs flex items-center justify-center p-1.5 text-white shrink-0">
                <AnticeilLogo className="size-full fill-current" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white drop-shadow-md truncate">{item.name}</div>
                <div className="text-[10px] text-white/80">Overlay animasi latar profil</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Details */}
      <div className="p-4 sm:p-5 space-y-3.5 sm:space-y-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider truncate">
              {item.collection || 'ANTICEIL NATIVE'}
            </span>
            {item.badge && (
              <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] font-bold uppercase border border-primary/30 shrink-0">
                {item.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Pricing Grid */}
        <div className={cn("grid gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-muted/40 border border-border/80", canUseDew ? "grid-cols-2" : "grid-cols-1")}>
          <div className="space-y-0.5 min-w-0">
            <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{t('Harga Resmi IDR')}</div>
            <div className="text-xs sm:text-sm font-bold text-foreground truncate">
              IDR {(item?.priceIdr ?? 0).toLocaleString('id-ID')}
            </div>
          </div>
          {canUseDew ? (
            <div className="space-y-0.5 text-right min-w-0">
              <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{t('Harga Dew')}</div>
              <div className="text-xs sm:text-sm font-bold text-cyan-400 flex items-center justify-end gap-1 truncate">
                <span>💧</span>
                <span>{item.priceDew ?? item.priceOrbs ?? 0} Dew</span>
              </div>
            </div>
          ) : (
            <div className="space-y-0.5 text-right min-w-0">
              <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{t('Metode')}</div>
              <div className="text-xs font-semibold text-amber-400 flex items-center justify-end gap-1 truncate">
                <span>💵</span>
                <span>{t('Hanya Uang Asli (IDR)')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions - Responsive Grid: Zero Overflow on Mobile, Tablet & Desktop */}
        <div className="space-y-2.5">
          {ownedItemIds.has(item.id) ? (
            <Button
              size="sm"
              variant="default"
              disabled={isEquipping}
              onClick={() => onEquip(item)}
              className="w-full h-9 font-bold text-xs cursor-pointer flex items-center justify-center gap-2 shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isEquipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{t('Pasang ke Profil Anda')}</span>
            </Button>
          ) : (
            <div className="space-y-2">
              {/* Purchase Buttons */}
              <div className={cn("grid gap-2", canUseDew ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
                {canUseDew && (
                  <Button
                    size="sm"
                    variant="default"
                    disabled={isPurchasing || (balance.dew ?? balance.orbs ?? 0) < (item.priceDew ?? item.priceOrbs ?? 0)}
                    onClick={() => onPurchase(item, 'dew')}
                    className="w-full h-9 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isPurchasing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>💧</span>
                        <span className="truncate">{t('Beli')} ({item.priceDew ?? item.priceOrbs ?? 0} Dew)</span>
                      </>
                    )}
                  </Button>
                )}

                <Button
                  size="sm"
                  variant={canUseDew ? "outline" : "default"}
                  disabled={isPurchasing}
                  onClick={() => onPurchase(item, 'idr')}
                  className={cn(
                    "w-full h-9 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-xs",
                    !canUseDew && "bg-primary hover:bg-primary/90 text-primary-foreground"
                  )}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span className="truncate">{t('Beli')} IDR {(item?.priceIdr ?? 0).toLocaleString('id-ID')}</span>
                </Button>
              </div>

              {/* Secondary Actions: Wishlist, Edit, Delete */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={(e) => onToggleWishlist(e, item)}
                  className={cn(
                    "h-8 px-2.5 text-xs font-medium cursor-pointer gap-1.5",
                    wishlistedItemIds.has(item.id) ? "text-pink-500 hover:text-pink-600 bg-pink-500/10" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Heart
                    className={cn(
                      'w-3.5 h-3.5',
                      wishlistedItemIds.has(item.id) && 'text-pink-500 fill-pink-500'
                    )}
                  />
                  <span>{wishlistedItemIds.has(item.id) ? t('Dalam Wishlist') : t('Wishlist')}</span>
                </Button>

                {currentUser?.email?.toLowerCase() === 'anticeil.official@gmail.com' && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditProduct(item);
                      }}
                      className="h-8 px-2.5 text-xs font-semibold cursor-pointer text-muted-foreground hover:text-foreground gap-1"
                      title={t('Edit Item')}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t('Edit')}</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProduct(e, item.id);
                        onClose();
                      }}
                      className="h-8 px-2.5 text-xs font-semibold cursor-pointer text-red-400 hover:text-white hover:bg-red-600 hover:border-red-600 border border-border/80 bg-background/80 shrink-0 transition-colors gap-1"
                      title={t('Hapus Item')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t('Hapus')}</span>
                    </Button>
                  </div>
                )}
              </div>

              {canUseDew && (balance.dew ?? balance.orbs ?? 0) < (item.priceDew ?? item.priceOrbs ?? 0) && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-[11px] text-muted-foreground bg-cyan-950/20 p-2 sm:p-2.5 rounded-xl border border-cyan-500/30">
                  <span className="truncate">Saldo Dew belum cukup ({balance.dew ?? balance.orbs ?? 0} / {item.priceDew ?? item.priceOrbs ?? 0})</span>
                  <button
                    type="button"
                    onClick={() => onTopupDew(500)}
                    className="text-cyan-400 hover:underline font-bold cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    + Klaim 500 Dew
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MediumDialog>
  );
}
