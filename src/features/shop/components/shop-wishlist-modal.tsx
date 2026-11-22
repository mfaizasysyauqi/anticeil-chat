import React from 'react';
import { Heart, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from '@/core/i18n';
import type { ShopItem } from '../api/shop-api';

export interface ShopWishlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wishlist: ShopItem[];
  onSelectItem: (item: ShopItem) => void;
  onToggleWishlist: (e: React.MouseEvent, item: ShopItem) => void;
}

export function ShopWishlistModal({
  open,
  onOpenChange,
  wishlist,
  onSelectItem,
  onToggleWishlist,
}: ShopWishlistModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" className="p-0 overflow-hidden rounded-2xl bg-card border border-border shadow-xl z-[150]">
        <div className="p-4 pr-12 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
            <DialogTitle className="text-sm font-bold text-foreground">
              {t('Wishlist Shop')} ({wishlist.length})
            </DialogTitle>
          </div>
        </div>

        <div className="max-h-[350px] overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {wishlist.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground space-y-2">
              <Heart className="w-8 h-8 mx-auto opacity-30 text-pink-500" />
              <p>{t('Belum ada item di wishlist Anda.')}</p>
              <p className="text-[11px] text-muted-foreground/70">
                {t('Klik ikon hati pada item untuk menyimpannya di sini.')}
              </p>
            </div>
          ) : (
            wishlist.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onOpenChange(false);
                  onSelectItem(item);
                }}
                className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border hover:border-primary/60 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-9 rounded-md bg-card border border-border flex items-center justify-center overflow-hidden shrink-0">
                    <img src={item.previewIcon} alt={item.name} className="size-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-foreground truncate">{item.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{item.collection}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-bold text-foreground">IDR {(item.priceIdr ?? 0).toLocaleString('id-ID')}</div>
                    <div className="text-[10px] text-cyan-400 font-bold">💧 {item.priceDew ?? item.priceOrbs ?? 0} Dew</div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => onToggleWishlist(e, item)}
                    className="p-1 rounded-md text-pink-500 hover:text-muted-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                    title={t('Hapus dari Wishlist')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
