import React from 'react';
import { Heart, X } from 'lucide-react';
import { ShopEmptyState } from './shop-empty-state';
import { MediumDialog } from '@/components/ui/medium-dialog';
import { useTranslation } from '@/core/i18n';
import type { ShopItem } from '../api/shop-api';
import { AnticeilAvatarMannequin } from '@/components/ui/anticeil-avatar-mannequin';
import { NameplateRenderer } from '@/features/profile';

export interface ShopWishlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wishlist: ShopItem[];
  onSelectItem: (item: ShopItem) => void;
  onToggleWishlist: (e: React.MouseEvent, item: ShopItem) => void;
}

function renderModalItemVisual(item: ShopItem) {
  const isDeco = item.category === 'avatar_decoration' || item.itemTypes?.includes('avatar_decoration');
  const isNameplate = item.category === 'nameplate' || item.itemTypes?.includes('nameplate');
  const mediaUrl = item.gifUrl || (item.previewIcon && item.previewIcon.startsWith('http') ? item.previewIcon : null);

  if (isDeco) {
    return <AnticeilAvatarMannequin size="xs" decorationId={item.id} statusDot={false} />;
  }
  if (isNameplate) {
    return (
      <div className="w-12 h-6 flex items-center justify-center overflow-hidden rounded bg-black/40 border border-border/50 shrink-0">
        <NameplateRenderer nameplateId={item.id} imageUrl={mediaUrl} className="scale-60 origin-center" />
      </div>
    );
  }
  if (mediaUrl) {
    return (
      <div className="size-9 rounded-lg bg-card border border-border flex items-center justify-center overflow-hidden shrink-0">
        <img src={mediaUrl} alt={item.name} className="size-full object-cover" />
      </div>
    );
  }
  return <AnticeilAvatarMannequin size="xs" statusDot={false} />;
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
    <MediumDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<Heart className="w-4 h-4 text-pink-500 fill-pink-500" />}
      title={`${t('Wishlist Shop')} (${wishlist.length})`}
      className="sm:max-w-md"
      bodyClassName="p-3 sm:p-4 space-y-2 max-h-[420px]"
    >
      {wishlist.length === 0 ? (
        <ShopEmptyState variant="wishlist" compact />
      ) : (
        wishlist.map((item) => (
          <div
            key={item.id}
            onClick={() => {
              onOpenChange(false);
              onSelectItem(item);
            }}
            className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/80 hover:border-primary/60 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {renderModalItemVisual(item)}
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
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWishlist(e, item);
                }}
                className="p-1 rounded-md text-pink-500 hover:text-muted-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                title={t('Hapus dari Wishlist')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))
      )}
    </MediumDialog>
  );
}
