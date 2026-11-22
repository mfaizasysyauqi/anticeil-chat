import React from 'react';
import { Heart, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import type { ShopItem } from '@/features/shop/api/shop-api';

export interface ProfileWishlistSubtabProps {
  wishlistItems: ShopItem[];
  catalogItems: ShopItem[];
  newCustomWishlistInput: string;
  setNewCustomWishlistInput: (val: string) => void;
  onPreviewShopItem: (item: any) => void;
  onRemoveFromWishlist: (itemId: string) => void;
  onToggleWishlist: (itemId: string, itemName: string) => void;
  onAddCustomWishlist: (e: React.FormEvent) => void;
  onOpenShop: () => void;
}

export function ProfileWishlistSubtab({
  wishlistItems,
  catalogItems,
  newCustomWishlistInput,
  setNewCustomWishlistInput,
  onPreviewShopItem,
  onRemoveFromWishlist,
  onToggleWishlist,
  onAddCustomWishlist,
  onOpenShop,
}: ProfileWishlistSubtabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* User's Wishlist Items */}
      {wishlistItems && wishlistItems.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
              {t('Item Favorit Anda')}
            </span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-semibold">
              {wishlistItems.length} {t('Item')}
            </Badge>
          </div>

          <div className="space-y-2">
            {wishlistItems.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-border/70 bg-card flex items-center justify-between hover:border-sidebar-primary/40 transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.previewIcon && item.previewIcon.startsWith('http') ? (
                    <img
                      src={item.previewIcon}
                      alt={item.name}
                      className="size-9 rounded-lg object-cover border border-border/60 shrink-0"
                    />
                  ) : (
                    <div className="size-9 rounded-lg bg-sidebar-primary/10 text-sidebar-primary flex items-center justify-center text-base shrink-0">
                      {item.previewIcon || '✨'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-foreground truncate">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                      <span className="font-medium text-sidebar-primary">{item.collection || item.category}</span>
                      {(item.priceDew || item.priceOrbs) && (
                        <span>• 💧 {(item.priceDew || item.priceOrbs || 0).toLocaleString()} Dew</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="tealGhost"
                    onClick={() => onPreviewShopItem(item)}
                    className="h-7 px-2.5 text-[11px] font-semibold cursor-pointer"
                  >
                    {t('Preview')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemoveFromWishlist(item.id)}
                    className="h-7 px-2 text-destructive hover:bg-destructive/10 cursor-pointer"
                    title={t('Hapus dari Wishlist')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Empty Wishlist Card */
        <div className="p-8 rounded-2xl border border-border/70 bg-card text-center space-y-4 shadow-xs">
          <div className="size-11 rounded-2xl bg-secondary/80 flex items-center justify-center text-xl mx-auto text-rose-500">
            <Heart className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">
              {t('Belum ada item di Wishlist')}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {t('Jelajahi katalog Shop dan tandai item favorit dengan ikon hati untuk menyimpannya di sini.')}
            </p>
          </div>

          <Button
            size="sm"
            variant="teal"
            onClick={onOpenShop}
            className="text-xs h-8 px-4 font-bold cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            {t('Jelajahi Shop')}
          </Button>
        </div>
      )}

      {/* Suggested Items for You (Loaded from real catalog) */}
      <div className="space-y-3 pt-2">
        <span className="text-xs font-bold text-foreground">
          {t('Disarankan untuk Anda')}
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {catalogItems.slice(0, 6).map((item) => {
            const isHearted = wishlistItems.some((w) => w.id === item.id);
            return (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-border/80 bg-card flex flex-col justify-between hover:border-sidebar-primary/60 transition-colors shadow-2xs group"
              >
                <div className="flex items-start justify-between">
                  {item.previewIcon && item.previewIcon.startsWith('http') ? (
                    <img
                      src={item.previewIcon}
                      alt={item.name}
                      className="size-8 rounded-lg object-cover border border-border/60"
                    />
                  ) : (
                    <span className="text-xl">{item.previewIcon || '✨'}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => onToggleWishlist(item.id, item.name)}
                    className={cn(
                      'p-1 rounded-full transition-colors cursor-pointer',
                      isHearted
                        ? 'text-rose-500 hover:text-rose-600'
                        : 'text-muted-foreground hover:text-rose-400',
                    )}
                    title={isHearted ? t('Hapus dari Wishlist') : t('Tambah ke Wishlist')}
                  >
                    <Heart
                      className={cn('w-4 h-4', isHearted && 'fill-current')}
                    />
                  </button>
                </div>
                <div className="mt-2 space-y-0.5">
                  <div className="text-xs font-bold text-foreground truncate" title={item.name}>
                    {item.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate font-medium">
                    💧 {item.priceDew || item.priceOrbs || 500} Dew
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="tealGhost"
                  onClick={() => onPreviewShopItem(item)}
                  className="mt-2 h-6 text-[10px] w-full font-semibold cursor-pointer"
                >
                  {t('Preview')}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Custom Wishlist Item */}
      <form onSubmit={onAddCustomWishlist} className="flex items-center gap-2 pt-2 border-t border-border/50">
        <Input
          type="text"
          value={newCustomWishlistInput}
          onChange={(e) => setNewCustomWishlistInput(e.target.value)}
          placeholder={t('Tambah item kustom ke Wishlist...')}
          className="flex-1 text-xs h-8"
        />
        <Button type="submit" size="sm" variant="teal" className="h-8 text-xs font-bold">
          + {t('Tambah')}
        </Button>
      </form>
    </div>
  );
}
