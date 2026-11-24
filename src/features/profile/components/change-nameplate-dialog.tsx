import React, { useState, useEffect } from 'react';
import { Ban, Store, Lock, Gamepad2 } from 'lucide-react';
import { useTranslation } from '@/core/i18n';
import { cn } from '@/lib/utils';
import { NAMEPLATES_LIST } from '../data/nameplates';
import { NameplateRenderer } from './nameplate-renderer';
import { AvatarDecorationRenderer } from './avatar-decoration-renderer';
import { SplitPaneDialog } from '@/components/ui/split-pane-dialog';

interface ChangeNameplateDialogProps {
  open: boolean;
  onClose: () => void;
  currentNameplate?: string;
  onApply: (nameplateId: string) => void;
  avatarUrl?: string | null;
  userName?: string;
  avatarDecoration?: string;
  onOpenShop?: () => void;
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

  useEffect(() => {
    if (open) {
      setSelectedNameplate(currentNameplate || 'none');
    }
  }, [open, currentNameplate]);

  const handleApply = () => {
    onApply(selectedNameplate);
    onClose();
  };

  const selectedPlateData = NAMEPLATES_LIST.find((n) => n.id === selectedNameplate);

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
            selectedNameplate !== 'none' && selectedPlateData
              ? cn(selectedPlateData.backgroundClass, 'border')
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
      applyLabel={t('Apply')}
      cancelLabel={t('Cancel')}
      preview={previewContent}
    >
      {/* Section: Your Nameplates */}
      <div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
          {t('Your Nameplates')}
        </h3>
        <div className="flex items-center gap-3">
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
                onOpenShop();
                onClose();
              }
            }}
            className="w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer border border-border/70 bg-card hover:bg-muted/60 transition-colors"
          >
            <Store className="w-7 h-7 text-muted-foreground" />
            <span className="text-[11px] font-semibold text-foreground">{t('Shop')}</span>
          </button>
        </div>
      </div>

      {/* Section: See What's in Shop */}
      <div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
          {t("See What's in Shop")}
        </h3>
        <div className="space-y-2.5">
          {NAMEPLATES_LIST.map((plate) => {
            const isSelected = selectedNameplate === plate.id;
            return (
              <button
                key={plate.id}
                type="button"
                onClick={() => setSelectedNameplate(plate.id)}
                className={cn(
                  'w-full h-13 rounded-xl border flex items-center justify-between px-3.5 relative overflow-hidden transition-all cursor-pointer group text-left',
                  plate.backgroundClass,
                  isSelected
                    ? 'border-primary ring-2 ring-primary/40 shadow-[0_0_12px_rgba(var(--primary),0.35)]'
                    : 'hover:border-border/80'
                )}
                title={plate.name}
              >
                <NameplateRenderer nameplateId={plate.id} />

                {/* Content representation */}
                <div className="flex items-center gap-3 relative z-10 pointer-events-none">
                  <div className="size-7 rounded-full bg-muted/80 border border-border/60 flex items-center justify-center relative">
                    <Gamepad2 className="w-3.5 h-3.5 text-muted-foreground" />
                    <div className="absolute bottom-0 right-0 size-2 rounded-full bg-emerald-500 border border-background" />
                  </div>
                  <div className="w-28 h-2.5 rounded-full bg-muted-foreground/30" />
                </div>

                {/* Lock icon badge */}
                <span className="relative z-10 size-4 rounded-full bg-black/60 flex items-center justify-center">
                  <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </SplitPaneDialog>
  );
};
