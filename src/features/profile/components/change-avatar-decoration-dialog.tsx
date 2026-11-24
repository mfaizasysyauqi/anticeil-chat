import React, { useState, useEffect } from 'react';
import { Ban, Store, Lock, Sparkles, ShoppingBag } from 'lucide-react';
import { useTranslation } from '@/core/i18n';
import { cn } from '@/lib/utils';
import { AVATAR_DECORATIONS_LIST } from '../data/avatar-decorations';
import { AvatarDecorationRenderer } from './avatar-decoration-renderer';
import { SplitPaneDialog } from '@/components/ui/split-pane-dialog';
import { shopApi, type ShopItem } from '@/features/shop/api/shop-api';

interface ChangeAvatarDecorationDialogProps {
  open: boolean;
  onClose: () => void;
  currentDecoration?: string;
  onApply: (decorationId: string) => void;
  avatarUrl?: string | null;
  userName?: string;
  onOpenShop?: (category?: string) => void;
}

export const ChangeAvatarDecorationDialog: React.FC<ChangeAvatarDecorationDialogProps> = ({
  open,
  onClose,
  currentDecoration = 'none',
  onApply,
  avatarUrl,
  userName = 'User',
  onOpenShop,
}) => {
  const { t } = useTranslation();
  const [selectedDecoration, setSelectedDecoration] = useState<string>(currentDecoration);
  const [shopDecorations, setShopDecorations] = useState<ShopItem[]>([]);
  const [ownedDecorations, setOwnedDecorations] = useState<ShopItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedDecoration(currentDecoration || 'none');
      setIsLoading(true);

      Promise.all([
        shopApi.getItems('avatar_decoration'),
        shopApi.getInventory(),
      ])
        .then(([items, inv]) => {
          if (Array.isArray(items) && items.length > 0) {
            setShopDecorations(items);
          } else {
            // Fallback to static list
            setShopDecorations(
              AVATAR_DECORATIONS_LIST.map((dec) => ({
                id: dec.id,
                name: dec.name,
                category: 'avatar_decoration',
                collection: dec.category === 'nectar' ? 'Nectar Exclusive' : 'Community Shop',
                description: dec.description || '',
                priceIdr: 35000,
                priceDew: 350,
                allowDew: true,
              }))
            );
          }

          if (Array.isArray(inv)) {
            setOwnedDecorations(inv.filter((i) => i.category === 'avatar_decoration'));
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, currentDecoration]);

  const isNectarItem = (d: { id: string; badge?: string; collection?: string }) => {
    return (
      d.badge?.toLowerCase().includes('nectar') ||
      d.badge?.toLowerCase().includes('exclusive') ||
      d.collection?.toLowerCase().includes('nectar') ||
      d.collection?.toLowerCase().includes('nitro') ||
      AVATAR_DECORATIONS_LIST.some((ref) => ref.id === d.id && ref.category === 'nectar')
    );
  };

  const nectarDecorations = shopDecorations.filter(isNectarItem).length > 0
    ? shopDecorations.filter(isNectarItem)
    : AVATAR_DECORATIONS_LIST.filter((d) => d.category === 'nectar').map((d) => ({
        id: d.id,
        name: d.name,
        category: 'avatar_decoration',
        collection: 'Nectar Exclusive',
        description: d.description,
        priceIdr: 0,
        priceDew: 0,
        allowDew: false,
      }));

  const standardShopDecorations = shopDecorations.filter((d) => !isNectarItem(d));

  const displayShopDecorations =
    standardShopDecorations.length > 0
      ? standardShopDecorations
      : AVATAR_DECORATIONS_LIST.filter((d) => d.category === 'shop').map((d) => ({
          id: d.id,
          name: d.name,
          category: 'avatar_decoration',
          collection: 'Community Shop',
          description: d.description,
          priceIdr: 35000,
          priceDew: 350,
          allowDew: true,
        }));

  const isSelectedOwned =
    selectedDecoration === 'none' ||
    ownedDecorations.some((d) => d.id === selectedDecoration) ||
    nectarDecorations.some((d) => d.id === selectedDecoration);

  const selectedDecData =
    shopDecorations.find((d) => d.id === selectedDecoration) ||
    AVATAR_DECORATIONS_LIST.find((d) => d.id === selectedDecoration);

  const handleShopRedirect = () => {
    if (onOpenShop) {
      onOpenShop('avatar_decoration');
    } else {
      window.history.pushState({}, '', '/shop');
      window.dispatchEvent(new CustomEvent('anticeil:navigate-home', { detail: 'shop' }));
      window.dispatchEvent(new CustomEvent('anticeil:close-all-modals'));
      window.dispatchEvent(new CustomEvent('anticeil:shop-category', { detail: 'avatar_decoration' }));
    }
    onClose();
  };

  const handleApply = () => {
    if (!isSelectedOwned && selectedDecoration !== 'none') {
      handleShopRedirect();
      return;
    }
    onApply(selectedDecoration);
    onClose();
  };

  const previewContent = (
    <div className="flex flex-col items-center justify-center gap-4 w-full">
      <div className="flex items-center justify-center gap-4">
        {/* Big Avatar Preview */}
        <div className="size-[170px] rounded-xl bg-background/80 flex items-center justify-center relative shadow-inner border border-border/60">
          <div className="relative size-24 flex items-center justify-center">
            {/* Inner avatar container with overflow-hidden for image */}
            <div className="size-full rounded-full overflow-hidden border-2 border-border/80 bg-muted/60 flex items-center justify-center shadow-lg">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="size-full object-cover" />
              ) : (
                <div className="size-full flex items-center justify-center bg-muted text-foreground font-bold text-xl select-none">
                  {userName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            {/* Decoration rendered outside overflow-hidden with high z-index */}
            <AvatarDecorationRenderer decorationId={selectedDecoration} />
          </div>
        </div>

        {/* Vertical Column of 4 small avatars showing real scaling */}
        <div className="flex flex-col items-center justify-between h-[170px] py-1">
          {/* 44px */}
          <div className="relative size-11 flex items-center justify-center shrink-0">
            <div className="size-full rounded-full overflow-hidden border border-border/60 bg-muted flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-muted-foreground">
                  {userName.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            <AvatarDecorationRenderer decorationId={selectedDecoration} />
          </div>

          {/* 32px */}
          <div className="relative size-8 flex items-center justify-center shrink-0">
            <div className="size-full rounded-full overflow-hidden border border-border/60 bg-muted flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                <span className="text-[8px] font-bold text-muted-foreground">
                  {userName.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            <AvatarDecorationRenderer decorationId={selectedDecoration} />
          </div>

          {/* 24px */}
          <div className="relative size-6 flex items-center justify-center shrink-0">
            <div className="size-full rounded-full overflow-hidden border border-border/60 bg-muted flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                <span className="text-[7px] font-bold text-muted-foreground">
                  {userName.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            <AvatarDecorationRenderer decorationId={selectedDecoration} />
          </div>

          {/* 20px */}
          <div className="relative size-5 flex items-center justify-center shrink-0">
            <div className="size-full rounded-full overflow-hidden border border-border/60 bg-muted flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                <span className="text-[6px] font-bold text-muted-foreground">
                  {userName.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            <AvatarDecorationRenderer decorationId={selectedDecoration} />
          </div>
        </div>
      </div>

      {/* Item info badge when locked */}
      {selectedDecData && !isSelectedOwned && selectedDecoration !== 'none' && (
        <div className="w-full max-w-[260px] p-2.5 rounded-xl bg-card border border-primary/30 flex items-center justify-between gap-2 shadow-xs">
          <div className="min-w-0">
            <div className="text-xs font-bold text-foreground truncate">{selectedDecData.name}</div>
            <div className="text-[10px] text-muted-foreground">
              {'priceDew' in selectedDecData && selectedDecData.priceDew
                ? `${selectedDecData.priceDew} Dew`
                : 'priceIdr' in selectedDecData && selectedDecData.priceIdr
                  ? `Rp ${selectedDecData.priceIdr.toLocaleString('id-ID')}`
                  : 'Rp 35.000'}
            </div>
          </div>
          <button
            type="button"
            onClick={handleShopRedirect}
            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1 cursor-pointer shrink-0"
          >
            <ShoppingBag className="w-3 h-3" />
            <span>{t('Beli')}</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <SplitPaneDialog
      open={open}
      onClose={onClose}
      title={t('Change Avatar Decoration')}
      size="2xl"
      onApply={handleApply}
      applyLabel={isSelectedOwned ? t('Apply') : t('Buka di Shop')}
      cancelLabel={t('Cancel')}
      preview={previewContent}
      footerActions={
        !isSelectedOwned && selectedDecoration !== 'none' ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg font-semibold text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              {t('Cancel')}
            </button>
            <button
              type="button"
              onClick={handleShopRedirect}
              className="px-6 py-2 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 transition-opacity cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t('Buka di Shop')}</span>
            </button>
          </div>
        ) : undefined
      }
    >
      {/* Section: Your Decorations */}
      <div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
          {t('Your Decorations')}
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          {/* None Button */}
          <button
            type="button"
            onClick={() => setSelectedDecoration('none')}
            className={cn(
              'w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all border',
              selectedDecoration === 'none'
                ? 'border-primary bg-primary/15 shadow-[0_0_12px_rgba(var(--primary),0.35)]'
                : 'border-border/70 bg-card hover:bg-muted/60'
            )}
          >
            <Ban className="w-7 h-7 text-muted-foreground" />
            <span className="text-[11px] font-semibold text-foreground">{t('None')}</span>
          </button>

          {/* Shop Button */}
          <button
            type="button"
            onClick={handleShopRedirect}
            className="w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer border border-border/70 bg-card hover:bg-muted/60 transition-colors"
          >
            <Store className="w-7 h-7 text-muted-foreground" />
            <span className="text-[11px] font-semibold text-foreground">{t('Shop')}</span>
          </button>

          {/* User's Owned Decorations from Database */}
          {ownedDecorations.map((owned) => {
            const isSelected = selectedDecoration === owned.id;
            return (
              <button
                key={owned.id}
                type="button"
                onClick={() => setSelectedDecoration(owned.id)}
                className={cn(
                  'w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all border relative overflow-hidden p-2',
                  isSelected
                    ? 'border-primary bg-primary/15 shadow-[0_0_12px_rgba(var(--primary),0.35)]'
                    : 'border-border/70 bg-card hover:bg-muted/60'
                )}
                title={owned.name}
              >
                <div className="relative size-10 flex items-center justify-center">
                  <div className="size-full rounded-full overflow-hidden bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-bold">
                    {userName.slice(0, 1).toUpperCase()}
                  </div>
                  <AvatarDecorationRenderer decorationId={owned.id} />
                </div>
                <span className="text-[10px] font-bold text-foreground truncate w-full text-center">
                  {owned.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section: Exclusive to Nitro / Nectar */}
      <div>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t('Exclusive to Nitro')}
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {nectarDecorations.map((item) => {
            const isSelected = selectedDecoration === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedDecoration(item.id)}
                className={cn(
                  'aspect-square rounded-xl bg-card hover:bg-muted/70 border flex items-center justify-center relative cursor-pointer group transition-all p-2 overflow-hidden',
                  isSelected
                    ? 'border-primary bg-primary/15 shadow-[0_0_12px_rgba(var(--primary),0.35)]'
                    : 'border-border/70'
                )}
                title={item.name}
              >
                {/* Top right badge */}
                <span className="absolute top-1.5 right-1.5 size-4 rounded-full bg-pink-500/80 flex items-center justify-center z-30 shadow-xs">
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </span>

                <div className="relative size-11 flex items-center justify-center">
                  <div className="size-full rounded-full overflow-hidden bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-bold">
                    {userName.slice(0, 1).toUpperCase()}
                  </div>
                  <AvatarDecorationRenderer decorationId={item.id} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section: See What's in Shop (Connected to Database) */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t("See What's in Shop")}
          </h3>
          <button
            type="button"
            onClick={handleShopRedirect}
            className="text-[11px] font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1"
          >
            <Store className="w-3 h-3" />
            {t('Buka Shop Katalog')}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {displayShopDecorations.map((item) => {
            const isSelected = selectedDecoration === item.id;
            const isOwned = ownedDecorations.some((o) => o.id === item.id);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedDecoration(item.id)}
                className={cn(
                  'aspect-square rounded-xl bg-card hover:bg-muted/70 border flex items-center justify-center relative cursor-pointer group transition-all p-2 overflow-hidden',
                  isSelected
                    ? 'border-primary bg-primary/15 shadow-[0_0_12px_rgba(var(--primary),0.35)]'
                    : 'border-border/70'
                )}
                title={item.name}
              >
                {/* Lock or Owned badge */}
                {!isOwned && (
                  <span className="absolute top-1.5 right-1.5 size-4 rounded-full bg-black/60 flex items-center justify-center z-30 shadow-xs">
                    <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                  </span>
                )}

                <div className="relative size-11 flex items-center justify-center">
                  <div className="size-full rounded-full overflow-hidden bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-bold">
                    {userName.slice(0, 1).toUpperCase()}
                  </div>
                  <AvatarDecorationRenderer decorationId={item.id} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </SplitPaneDialog>
  );
};
