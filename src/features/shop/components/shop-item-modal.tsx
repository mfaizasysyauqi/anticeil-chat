import React from 'react';
import {
  Heart,
  Sparkles,
  ShoppingBag,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AnticeilLogo } from '@/components/ui/anticeil-logo';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { DIALOG_STYLES } from '@/lib/layout-constants';
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
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className={DIALOG_STYLES.MODAL_PREVIEW}>
        {/* Header Preview Banner with Real Animated Cosmetic in Action */}
        <div className="relative h-44 bg-muted/40 flex items-center justify-center p-6 border-b border-border overflow-hidden">
          {item.category === 'avatar_decoration' ? (
            <div className="relative size-22 rounded-full bg-[#1e1f22] border-2 border-border/70 flex items-center justify-center shadow-2xl z-10">
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt="User Avatar" className="size-full rounded-full object-cover" />
              ) : (
                <div className="size-11 text-muted-foreground/45 flex items-center justify-center select-none">
                  <AnticeilLogo className="size-full fill-current" />
                </div>
              )}
              {(item.gifUrl || item.previewIcon) && (
                <img
                  src={item.gifUrl || item.previewIcon}
                  alt={item.name}
                  className="absolute -inset-4.5 size-[calc(100%+36px)] object-contain pointer-events-none select-none z-20 drop-shadow-[0_0_16px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-300"
                />
              )}
            </div>
          ) : item.category === 'nameplate' ? (
            <div className="relative w-full max-w-[340px] h-14 sm:h-15 rounded-2xl bg-[#111214] border border-border/80 flex items-center px-3.5 gap-3 overflow-hidden shadow-2xl z-10 select-none">
              {(item.gifUrl || item.previewIcon) && (
                <img
                  src={item.gifUrl || item.previewIcon}
                  alt={item.name}
                  className="absolute inset-0 size-full object-cover opacity-95 pointer-events-none select-none z-0"
                />
              )}
              {/* Scrim gradient for contrast */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent pointer-events-none z-[1]" />

              {/* Mannequin Avatar with Anticeil Logo and status dot */}
              <div className="relative size-8 sm:size-9 rounded-full bg-[#2b2d31] border border-black/40 flex items-center justify-center shrink-0 z-10 shadow-md">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="User Avatar" className="size-full rounded-full object-cover" />
                ) : (
                  <div className="size-4.5 sm:size-5 text-muted-foreground/60 flex items-center justify-center pointer-events-none select-none">
                    <AnticeilLogo className="size-full fill-current" />
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-[#23a55a] border-2 border-[#111214]" />
              </div>

              {/* Username display or Discord-style rounded placeholder pill */}
              {currentUser?.name ? (
                <div className="min-w-0 z-10 space-y-0.5">
                  <div className="text-xs font-bold text-white drop-shadow-md flex items-center gap-2 leading-none">
                    <span>{currentUser.name}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-primary/40 text-primary-foreground font-bold">NAMECARD</span>
                  </div>
                  <p className="text-[10px] text-white/70 leading-none">Pratinjau tampilan strip namecard animasi di chat</p>
                </div>
              ) : (
                <div className="w-28 sm:w-36 h-4 sm:h-4.5 rounded-full bg-white/20 backdrop-blur-md z-10" />
              )}
            </div>
          ) : item.category === 'profile_effect' ? (
            <div className="relative w-full max-w-[280px] sm:max-w-[300px] h-38 rounded-2xl bg-[#1e1f22] border border-border/80 overflow-hidden shadow-2xl z-10 select-none">
              {/* Top Banner area */}
              <div className="h-14 bg-[#111214] border-b border-white/5 relative" />

              {/* Body area */}
              <div className="p-3 pt-0 relative">
                {/* Left Avatar Overlapping Banner */}
                <div className="relative -mt-6 size-12 sm:size-13 rounded-full bg-[#2b2d31] border-[3px] border-[#1e1f22] flex items-center justify-center shrink-0 z-10 shadow-lg">
                  {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt="User Avatar" className="size-full rounded-full object-cover" />
                  ) : (
                    <div className="size-6 text-muted-foreground/60 flex items-center justify-center pointer-events-none">
                      <AnticeilLogo className="size-full fill-current" />
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 size-3 rounded-full bg-[#23a55a] border-2 border-[#1e1f22]" />
                </div>

                {/* Profile Name & lines */}
                {currentUser?.name ? (
                  <div className="mt-1.5 space-y-0.5">
                    <div className="text-xs font-bold text-white drop-shadow-md">
                      {currentUser.name}
                    </div>
                    <p className="text-[10px] text-white/60">@{currentUser.username || 'user'}</p>
                  </div>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    <div className="w-24 sm:w-28 h-3 rounded-full bg-white/20" />
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
                <div className="size-9 rounded-full bg-[#1e1f22] border border-white/40 backdrop-blur-xs flex items-center justify-center p-1.5 text-white shrink-0">
                  <AnticeilLogo className="size-full fill-current" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white drop-shadow-md">{item.name}</div>
                  <div className="text-[10px] text-white/80">Overlay animasi latar profil</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Details */}
        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                {item.collection || 'ANTICEIL NATIVE'}
              </span>
              {item.badge && (
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] font-bold uppercase border border-primary/30">
                  {item.badge}
                </span>
              )}
            </div>
            <DialogTitle className="text-base font-bold text-foreground mt-1">
              {item.name}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Pricing Grid */}
          <div className={cn("grid gap-3 p-3 rounded-lg bg-muted/40 border border-border", canUseDew ? "grid-cols-2" : "grid-cols-1")}>
            <div className="space-y-0.5">
              <div className="text-[10px] text-muted-foreground font-semibold">{t('Harga Resmi IDR')}</div>
              <div className="text-xs sm:text-sm font-bold text-foreground">
                IDR {(item?.priceIdr ?? 0).toLocaleString('id-ID')}
              </div>
            </div>
            {canUseDew ? (
              <div className="space-y-0.5 text-right">
                <div className="text-[10px] text-muted-foreground font-semibold">{t('Harga Dew')}</div>
                <div className="text-xs sm:text-sm font-bold text-cyan-400 flex items-center justify-end gap-1">
                  <span>💧</span>
                  <span>{item.priceDew ?? item.priceOrbs ?? 0} Dew</span>
                </div>
              </div>
            ) : (
              <div className="space-y-0.5 text-right">
                <div className="text-[10px] text-muted-foreground font-semibold">{t('Metode Pembayaran')}</div>
                <div className="text-xs font-semibold text-amber-400 flex items-center justify-end gap-1">
                  <span>💵</span>
                  <span>{t('Hanya Uang Asli (IDR)')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 space-y-2">
            {ownedItemIds.has(item.id) ? (
              <Button
                size="sm"
                variant="default"
                disabled={isEquipping}
                onClick={() => onEquip(item)}
                className="w-full h-9 font-bold text-xs cursor-pointer flex items-center justify-center gap-2"
              >
                {isEquipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{t('Pasang ke Profil Anda')}</span>
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {canUseDew && (
                    <Button
                      size="sm"
                      variant="default"
                      disabled={isPurchasing || (balance.dew ?? balance.orbs ?? 0) < (item.priceDew ?? item.priceOrbs ?? 0)}
                      onClick={() => onPurchase(item, 'dew')}
                      className="flex-1 h-9 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isPurchasing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <span>💧</span>
                          <span>Beli ({item.priceDew ?? item.priceOrbs ?? 0} Dew)</span>
                        </>
                      )}
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant={canUseDew ? "outline" : "default"}
                    disabled={isPurchasing}
                    onClick={() => onPurchase(item, 'idr')}
                    className="flex-1 h-9 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Beli IDR {(item?.priceIdr ?? 0).toLocaleString('id-ID')}</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => onToggleWishlist(e, item)}
                    className="h-9 px-3 cursor-pointer shrink-0"
                    title="Wishlist"
                  >
                    <Heart
                      className={cn(
                        'w-4 h-4',
                        wishlistedItemIds.has(item.id) && 'text-pink-500 fill-pink-500'
                      )}
                    />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEditProduct(item);
                    }}
                    className="h-9 px-3 cursor-pointer shrink-0 text-muted-foreground hover:text-foreground"
                    title={t('Edit Item')}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProduct(e, item.id);
                      onClose();
                    }}
                    className="h-9 px-3 cursor-pointer text-red-400 hover:text-white hover:bg-red-600 hover:border-red-600 border border-border/80 bg-background/80 shrink-0 transition-colors"
                    title={t('Hapus Item')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {canUseDew && (balance.dew ?? balance.orbs ?? 0) < (item.priceDew ?? item.priceOrbs ?? 0) && (
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-muted/40 p-2 rounded-lg border border-border">
                    <span>Saldo Dew belum cukup ({balance.dew ?? balance.orbs ?? 0} / {item.priceDew ?? item.priceOrbs ?? 0})</span>
                    <button
                      type="button"
                      onClick={() => onTopupDew(500)}
                      className="text-cyan-400 hover:underline font-bold cursor-pointer"
                    >
                      + Klaim 500 Dew
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
