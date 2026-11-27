import React from 'react';
import {
  Heart,
  Pencil,
  Trash2,
  Check,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AvatarDecorationRenderer } from '@/features/profile/components/avatar-decoration-renderer';
import { NameplateRenderer } from '@/features/profile/components/nameplate-renderer';
import { AnticeilAvatarMannequin } from '@/components/ui/anticeil-avatar-mannequin';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import type { ShopItem } from '../api/shop-api';

export interface ShopItemCardProps {
  item: ShopItem;
  currentUser?: any;
  isOwned: boolean;
  isWishlisted: boolean;
  isAdmin: boolean;
  onToggleWishlist: (e: React.MouseEvent, item: ShopItem) => void;
  onOpenItemDetail: (item: ShopItem) => void;
  onOpenEditProduct: (item: ShopItem) => void;
  onDeleteProduct: (e: React.MouseEvent, itemId: string) => void;
}

export function ShopItemCard({
  item,
  currentUser,
  isOwned,
  isWishlisted,
  isAdmin,
  onToggleWishlist,
  onOpenItemDetail,
  onOpenEditProduct,
  onDeleteProduct,
}: ShopItemCardProps) {
  const { t } = useTranslation();

  const renderCardArtwork = () => {
    const gifUrl = item.gifUrl || item.previewIcon;

    if (item.category === 'avatar_decoration') {
      return (
        <div className="h-32 sm:h-36 p-3 relative flex items-center justify-center bg-muted/40 border-b border-border/40 overflow-hidden">
          <div className="absolute inset-0 bg-radial from-primary/10 via-transparent to-transparent pointer-events-none" />

          {/* Avatar Base Silhouette with Live Avatar Decoration */}
          <div className="relative size-16 sm:size-18 rounded-full bg-secondary border-2 border-border/70 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt="" className="size-full rounded-full object-cover" />
            ) : (
              <User className="size-8 text-muted-foreground/40" />
            )}

            {/* Layered Animated Frame GIF or Vector/SVG Renderer */}
            {gifUrl ? (
              <img
                src={gifUrl}
                alt={item.name}
                className="absolute -inset-3.5 size-[calc(100%+28px)] object-contain pointer-events-none select-none z-10 drop-shadow-[0_0_12px_rgba(0,0,0,0.8)]"
                loading="lazy"
              />
            ) : (
              <AvatarDecorationRenderer decorationId={item.id} />
            )}
          </div>

          <span className="absolute bottom-2 left-2 text-[8px] font-bold text-muted-foreground/60 tracking-wider">
            DECORATION
          </span>
        </div>
      );
    }

    if (item.category === 'nameplate') {
      return (
        <div className="h-32 sm:h-36 p-3 relative flex items-center justify-center bg-muted/40 border-b border-border/40 overflow-hidden">
          <div className="absolute inset-0 bg-radial from-cyan-500/10 via-transparent to-transparent pointer-events-none" />

          {/* Discord/Anticeil Chat Row Preview */}
          <div className="w-[92%] h-13 rounded-xl bg-card border border-border/60 p-2 flex items-center gap-2.5 relative overflow-hidden shadow-lg group-hover:border-primary/50 transition-colors">
            {gifUrl ? (
              <img
                src={gifUrl}
                alt={item.name}
                className="absolute inset-0 size-full object-cover opacity-80 mix-blend-screen pointer-events-none select-none group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <NameplateRenderer nameplateId={item.id} imageUrl={item.previewIcon} />
            )}

            <AnticeilAvatarMannequin
              size="sm"
              avatarUrl={currentUser?.avatarUrl}
              statusDot
              statusColor="#23a55a"
            />

            <div className="min-w-0 z-10 space-y-0.5">
              <div className="text-[11px] font-bold text-foreground drop-shadow-sm flex items-center gap-1.5 leading-none">
                <span className="truncate">{currentUser?.username || 'Username'}</span>
                {item.badge && (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-primary/40 text-primary-foreground font-bold">
                    {item.badge}
                  </span>
                )}
              </div>
              <div className="w-16 h-1 rounded-full bg-muted-foreground/30" />
            </div>
          </div>

          <span className="absolute bottom-2 left-2 text-[8px] font-bold text-muted-foreground/60 tracking-wider">
            NAMEPLATE
          </span>
        </div>
      );
    }

    if (item.category === 'profile_banner') {
      const bannerUrl = (item as any).bannerUrl || gifUrl;
      return (
        <div className="h-32 sm:h-36 relative overflow-hidden bg-muted/40 border-b border-border/40">
          {bannerUrl ? (
            <img
              src={bannerUrl}
              alt={item.name}
              className="absolute inset-0 size-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-60" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent pointer-events-none" />
          <span className="absolute bottom-2 left-2 text-[8px] font-bold text-foreground/80 bg-background/70 px-1.5 py-0.5 rounded backdrop-blur-xs tracking-wider z-10 border border-border/40">
            BANNER
          </span>
        </div>
      );
    }

    if (item.category === 'animated_avatar') {
      return (
        <div className="h-32 sm:h-36 p-3 relative flex items-center justify-center bg-muted/40 border-b border-border/40 overflow-hidden">
          <div className="absolute inset-0 bg-radial from-violet-500/10 via-transparent to-transparent pointer-events-none" />
          <div className="relative size-16 sm:size-18 rounded-full bg-secondary border-2 border-border/70 overflow-hidden flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
            {gifUrl ? (
              <img
                src={gifUrl}
                alt={item.name}
                className="size-full object-cover"
                loading="lazy"
              />
            ) : (
              <User className="size-8 text-muted-foreground/40" />
            )}
          </div>
          <span className="absolute bottom-2 left-2 text-[8px] font-bold text-muted-foreground/60 tracking-wider">
            ANIMATED AVATAR
          </span>
        </div>
      );
    }

    if (item.category === 'profile_effect') {
      return (
        <div className="h-32 sm:h-36 relative overflow-hidden bg-muted/40 border-b border-border/40">
          {gifUrl && (
            <img
              src={gifUrl}
              alt={item.name}
              className="absolute inset-0 size-full object-cover opacity-85 pointer-events-none select-none group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent pointer-events-none" />

          <div className="absolute bottom-2.5 left-3 right-3 flex items-center gap-2 z-10 opacity-75">
            <div className="size-7 rounded-full bg-muted border border-border backdrop-blur-xs shrink-0" />
            <div className="space-y-1 min-w-0">
              <div className="w-16 h-2 rounded bg-muted-foreground/40" />
              <div className="w-10 h-1.5 rounded bg-muted-foreground/20" />
            </div>
          </div>

          <span className="absolute bottom-2.5 left-3 text-[8px] font-bold text-foreground/80 bg-background/70 px-1.5 py-0.5 rounded backdrop-blur-xs tracking-wider z-10 border border-border/40">
            OVERLAY .GIF
          </span>
        </div>
      );
    }

    // Bundle / Fallback
    return (
      <div className="h-32 sm:h-36 relative overflow-hidden bg-muted/40 border-b border-border/40 flex items-center justify-center p-3">
        {gifUrl && (
          <img
            src={gifUrl}
            alt={item.name}
            className="absolute inset-0 size-full object-cover opacity-40 mix-blend-screen pointer-events-none select-none"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent pointer-events-none" />

        <div className="relative size-14 rounded-full bg-card border border-border/60 flex items-center justify-center z-10 shadow-lg">
          <span className="text-muted-foreground/50 text-sm font-bold">❄</span>
          {gifUrl && (
            <img
              src={gifUrl}
              alt={item.name}
              className="absolute -inset-3 size-[calc(100%+24px)] object-contain pointer-events-none select-none z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
          )}
        </div>

        <span className="absolute bottom-2 left-2 text-[8px] font-bold text-muted-foreground/60 tracking-wider">
          3PC BUNDLE .GIF
        </span>
      </div>
    );
  };

  return (
    <div
      onClick={() => onOpenItemDetail(item)}
      className="group rounded-xl border border-border/70 bg-card hover:bg-card/90 overflow-hidden flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-xs hover:border-primary/50 relative hover:shadow-md"
    >
      {/* Top Media Area */}
      <div className="relative w-full">
        {/* Badge on top-left if present */}
        {item.badge && (
          <span className="absolute top-2.5 left-2.5 z-20 text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur-md">
            {item.badge}
          </span>
        )}

        {/* Wishlist button on top-right */}
        <button
          type="button"
          onClick={(e) => onToggleWishlist(e, item)}
          className="absolute top-2.5 right-2.5 z-20 size-7 rounded-md bg-background/80 hover:bg-background border border-border/60 flex items-center justify-center text-muted-foreground hover:text-pink-500 transition-colors cursor-pointer shadow-xs"
          title={isWishlisted ? t('Hapus dari Wishlist') : t('Tambah ke Wishlist')}
        >
          <Heart className={cn('w-3.5 h-3.5', isWishlisted && 'text-pink-500 fill-pink-500')} />
        </button>

        {/* Edit & Delete buttons on card hover (Admin only) */}
        {isAdmin && (
          <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenEditProduct(item);
              }}
              className="size-6 rounded-md bg-background/80 hover:bg-background border border-border/60 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shadow-xs"
              title={t('Edit Item ini')}
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => onDeleteProduct(e, item.id)}
              className="size-6 rounded-md bg-background/90 hover:bg-red-600 border border-border/80 hover:border-red-600 text-red-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs backdrop-blur-md"
              title={t('Hapus Item ini dari Database Shop')}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Dedicated Cosmetic Artwork Renderer */}
        {renderCardArtwork()}
      </div>

      {/* Card Body */}
      <div className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between gap-2.5 sm:gap-3">
        <div>
          <span className="text-[9px] sm:text-[10px] font-semibold text-primary block uppercase tracking-wider truncate mb-0.5">
            {item.collection || 'ANTICEIL NATIVE'}
          </span>
          <h4 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {item.name}
          </h4>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground line-clamp-2 mt-0.5 sm:mt-1 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Card Footer */}
        <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs font-bold text-foreground truncate">
              IDR {(item.priceIdr ?? 0).toLocaleString('id-ID')}
            </div>
            {item.allowDew !== false && (item.priceDew ?? item.priceOrbs ?? 0) > 0 ? (
              <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold text-cyan-400">
                <span>💧</span>
                <span>{item.priceDew ?? item.priceOrbs ?? 0} Dew</span>
              </div>
            ) : (
              <div className="text-[9px] sm:text-[10px] font-semibold text-amber-400/90 flex items-center gap-1">
                <span>💵</span>
                <span>{t('Hanya Uang Asli')}</span>
              </div>
            )}
          </div>

          {isOwned ? (
            <span className="h-7 px-2 sm:px-2.5 rounded-[4px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-[9px] sm:text-[10px] font-bold flex items-center gap-1 shrink-0">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>{t('Dimiliki')}</span>
            </span>
          ) : (
            <Button
              size="sm"
              variant="default"
              onClick={(e) => {
                e.stopPropagation();
                onOpenItemDetail(item);
              }}
              className="h-7 px-2.5 sm:px-3 text-xs font-semibold cursor-pointer shadow-xs shrink-0"
            >
              <span>{t('Buka')}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
