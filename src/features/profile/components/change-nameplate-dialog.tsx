import React, { useState, useEffect } from 'react';
import { Ban, Store, Lock, Gamepad2, ShoppingBag, Sparkles } from 'lucide-react';
import { useTranslation } from '@/core/i18n';
import { cn } from '@/lib/utils';
import { NAMEPLATES_LIST } from '../data/nameplates';
import { NameplateRenderer } from './nameplate-renderer';
import { AvatarDecorationRenderer } from './avatar-decoration-renderer';
import { SplitPaneDialog } from '@/components/ui/split-pane-dialog';
import { shopApi, type ShopItem } from '@/features/shop/api/shop-api';

interface ChangeNameplateDialogProps {
  open: boolean;
  onClose: () => void;
  currentNameplate?: string;
  onApply: (nameplateId: string) => void;
  avatarUrl?: string | null;
  userName?: string;
  avatarDecoration?: string;
  onOpenShop?: (category?: string) => void;
}

export const ChangeNameplateDialog: React.FC<ChangeNameplateDialogProps> = ({
  open,
  onClose,
  currentNameplate = 'none',
  onApply,
  avatarUrl,
  userName = 'User',
  avatarDecoration = 'none',
  onOpenShop,
}) => {
  const { t } = useTranslation();
  const [selectedNameplate, setSelectedNameplate] = useState<string>(currentNameplate);
  const [shopNameplates, setShopNameplates] = useState<ShopItem[]>([]);
  const [ownedNameplates, setOwnedNameplates] = useState<ShopItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedNameplate(currentNameplate || 'none');
      setIsLoading(true);

      Promise.all([
        shopApi.getItems('nameplate'),
        shopApi.getInventory(),
      ])
        .then(([items, inv]) => {
          if (Array.isArray(items) && items.length > 0) {
            setShopNameplates(items);
          } else {
            // Fallback to static list if offline or empty
            setShopNameplates(
              NAMEPLATES_LIST.map((np) => ({
                id: np.id,
                name: np.name,
                category: 'nameplate',
                collection: 'Anticeil',
                description: np.description,
                priceIdr: 40000,
                priceDew: 400,
                allowDew: true,
              }))
            );
          }

          if (Array.isArray(inv)) {
            setOwnedNameplates(inv.filter((i) => i.category === 'nameplate'));
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, currentNameplate]);

  const isSelectedOwned =
    selectedNameplate === 'none' ||
    ownedNameplates.some((p) => p.id === selectedNameplate);

  const handleApply = () => {
    onApply(selectedNameplate);
    onClose();
  };

  const selectedPlateData =
    NAMEPLATES_LIST.find((n) => n.id === selectedNameplate) ||
    shopNameplates.find((n) => n.id === selectedNameplate);

  const previewContent = (
    <div className="w-full">
      <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">
        {t('Preview Member List')}
      </div>

      <div className="rounded-xl bg-background/80 p-4 flex flex-col gap-3 border border-border/60 shadow-inner">
        {/* Dummy Row 1 */}
        <div className="flex items-center gap-3 px-2 py-1 opacity-40">
          <div className="size-8 rounded-full bg-muted-foreground/30 shrink-0" />
          <div className="w-24 h-2.5 rounded-full bg-muted-foreground/25" />
        </div>

        {/* Active User Row 2 (with selected nameplate) */}
        <div
          className={cn(
            'flex items-center gap-3 px-2.5 py-1.5 rounded-xl relative overflow-hidden transition-all',
            selectedNameplate !== 'none'
              ? 'bg-gradient-to-r from-blue-950/80 via-cyan-950/80 to-indigo-950/80 border border-primary/40'
              : 'bg-muted/50 border border-transparent'
          )}
        >
          {selectedNameplate !== 'none' && (
            <NameplateRenderer nameplateId={selectedNameplate} />
          )}

          {/* Avatar with decoration */}
          <div className="relative size-8 rounded-full bg-muted shrink-0 z-10 flex items-center justify-center border border-border/60">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="size-full rounded-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-foreground">
                {userName.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 border border-background" />
            <AvatarDecorationRenderer decorationId={avatarDecoration} />
          </div>

          {/* Display Name */}
          <span className="font-bold text-sm text-foreground drop-shadow-sm select-none z-10 truncate">
            {userName}
          </span>
        </div>

        {/* Dummy Row 3 */}
        <div className="flex items-center gap-3 px-2 py-1 opacity-40">
          <div className="size-8 rounded-full bg-muted-foreground/30 shrink-0" />
          <div className="w-20 h-2.5 rounded-full bg-muted-foreground/25" />
        </div>

        {/* Dummy Row 4 */}
        <div className="flex items-center gap-3 px-2 py-1 opacity-40">
          <div className="size-8 rounded-full bg-muted-foreground/30 shrink-0" />
          <div className="w-28 h-2.5 rounded-full bg-muted-foreground/25" />
        </div>
      </div>
    </div>
  );

  return (
    <SplitPaneDialog
      open={open}
      onClose={onClose}
      title={t('Change Nameplate')}
      size="2xl"
      onApply={handleApply}
      applyLabel={isSelectedOwned ? t('Apply') : t('Lihat di Shop')}
      cancelLabel={t('Cancel')}
      preview={previewContent}
      footerActions={
        !isSelectedOwned && selectedNameplate !== 'none' ? (
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
              onClick={() => {
                if (onOpenShop) {
                  onOpenShop('nameplate');
                  onClose();
                }
              }}
              className="px-6 py-2 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 transition-opacity cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t('Buka di Shop')}</span>
            </button>
          </div>
        ) : undefined
      }
    >
      {/* Section: Your Nameplates */}
      <div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
          {t('Your Nameplates')}
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          {/* None Button */}
          <button
            type="button"
            onClick={() => setSelectedNameplate('none')}
            className={cn(
              'w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all border',
              selectedNameplate === 'none'
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
            onClick={() => {
              if (onOpenShop) {
                onOpenShop('nameplate');
                onClose();
              }
            }}
            className="w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer border border-border/70 bg-card hover:bg-muted/60 transition-colors"
          >
            <Store className="w-7 h-7 text-muted-foreground" />
            <span className="text-[11px] font-semibold text-foreground">{t('Shop')}</span>
          </button>

          {/* User's Owned Nameplates from Database */}
          {ownedNameplates.map((owned) => {
            const isSelected = selectedNameplate === owned.id;
            return (
              <button
                key={owned.id}
                type="button"
                onClick={() => setSelectedNameplate(owned.id)}
                className={cn(
                  'w-28 h-20 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all border relative overflow-hidden p-2 text-left',
                  isSelected
                    ? 'border-primary bg-primary/20 ring-2 ring-primary/40 shadow-md'
                    : 'border-border/70 bg-card hover:bg-muted/60'
                )}
                title={owned.name}
              >
                <NameplateRenderer nameplateId={owned.id} />
                <span className="text-[10px] font-bold text-foreground truncate w-full text-center relative z-10">
                  {owned.name}
                </span>
                <span className="text-[9px] text-emerald-400 font-semibold relative z-10">
                  {t('Dimiliki')}
                </span>
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
            onClick={() => {
              if (onOpenShop) {
                onOpenShop('nameplate');
                onClose();
              }
            }}
            className="text-[11px] font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1"
          >
            <Store className="w-3 h-3" />
            {t('Buka Shop Katalog')}
          </button>
        </div>

        <div className="space-y-2.5">
          {shopNameplates.map((plate) => {
            const isSelected = selectedNameplate === plate.id;
            const isOwned = ownedNameplates.some((o) => o.id === plate.id);

            return (
              <button
                key={plate.id}
                type="button"
                onClick={() => setSelectedNameplate(plate.id)}
                className={cn(
                  'w-full h-12 rounded-xl border flex items-center justify-between px-3 relative overflow-hidden transition-all cursor-pointer group text-left bg-card',
                  isSelected
                    ? 'border-primary ring-2 ring-primary/40 shadow-[0_0_12px_rgba(var(--primary),0.35)]'
                    : 'border-border/70 hover:border-border'
                )}
                title={`${plate.name} - ${plate.priceDew ? `${plate.priceDew} Dew` : `Rp ${plate.priceIdr?.toLocaleString()}`}`}
              >
                <NameplateRenderer nameplateId={plate.id} />

                {/* Left: Discord Mock Member Pill: Avatar + Placeholder bar */}
                <div className="flex items-center gap-2.5 relative z-10 pointer-events-none">
                  <div className="size-6.5 rounded-full bg-muted/80 border border-border/60 flex items-center justify-center shrink-0">
                    <Gamepad2 className="w-3.5 h-3.5 text-muted-foreground/70" />
                  </div>
                  <div className="w-20 sm:w-28 h-2 rounded-full bg-white/20 shrink-0" />
                </div>

                {/* Right: Lock with price or Owned badge */}
                <div className="relative z-10 flex items-center gap-1.5 shrink-0 pointer-events-none">
                  {isOwned ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      {t('Dimiliki')}
                    </span>
                  ) : (
                    <div className="flex items-center gap-1 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-full border border-white/10 text-muted-foreground">
                      <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                      <span className="text-[10px] font-bold text-zinc-300">
                        {plate.priceDew ? `${plate.priceDew} Dew` : `Rp ${plate.priceIdr?.toLocaleString()}`}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </SplitPaneDialog>
  );
};
