import React, { useState, useEffect } from 'react';
import { Ban, Store, Lock, Sparkles } from 'lucide-react';
import { useTranslation } from '@/core/i18n';
import { cn } from '@/lib/utils';
import { AVATAR_DECORATIONS_LIST } from '../data/avatar-decorations';
import { AvatarDecorationRenderer } from './avatar-decoration-renderer';
import { SplitPaneDialog } from '@/components/ui/split-pane-dialog';

interface ChangeAvatarDecorationDialogProps {
  open: boolean;
  onClose: () => void;
  currentDecoration?: string;
  onApply: (decorationId: string) => void;
  avatarUrl?: string | null;
  userName?: string;
  onOpenShop?: () => void;
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

  useEffect(() => {
    if (open) {
      setSelectedDecoration(currentDecoration || 'none');
    }
  }, [open, currentDecoration]);

  const nectarDecorations = AVATAR_DECORATIONS_LIST.filter((d) => d.category === 'nectar');
  const shopDecorations = AVATAR_DECORATIONS_LIST.filter((d) => d.category === 'shop');

  const handleApply = () => {
    onApply(selectedDecoration);
    onClose();
  };

  const previewContent = (
    <div className="flex items-center justify-center gap-4">
      {/* Big Avatar Preview */}
      <div className="size-[170px] rounded-xl bg-background/80 flex items-center justify-center relative shadow-inner border border-border/60">
        <div className="relative size-24 rounded-full overflow-hidden border-2 border-border/80 bg-muted/60 flex items-center justify-center shadow-lg">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="size-full object-cover" />
          ) : (
            <div className="size-full flex items-center justify-center bg-muted text-foreground font-bold text-xl select-none">
              {userName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <AvatarDecorationRenderer decorationId={selectedDecoration} />
        </div>
      </div>

      {/* Vertical Column of 4 small avatars showing real scaling */}
      <div className="flex flex-col items-center justify-between h-[170px] py-1">
        {/* 48px */}
        <div className="relative size-11 rounded-full overflow-hidden border border-border/60 bg-muted flex items-center justify-center shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-[10px] font-bold text-muted-foreground">
              {userName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <AvatarDecorationRenderer decorationId={selectedDecoration} />
        </div>

        {/* 36px */}
        <div className="relative size-8 rounded-full overflow-hidden border border-border/60 bg-muted flex items-center justify-center shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-[8px] font-bold text-muted-foreground">
              {userName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <AvatarDecorationRenderer decorationId={selectedDecoration} />
        </div>

        {/* 28px */}
        <div className="relative size-6 rounded-full overflow-hidden border border-border/60 bg-muted flex items-center justify-center shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-[7px] font-bold text-muted-foreground">
              {userName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <AvatarDecorationRenderer decorationId={selectedDecoration} />
        </div>

        {/* 20px */}
        <div className="relative size-5 rounded-full overflow-hidden border border-border/60 bg-muted flex items-center justify-center shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-[6px] font-bold text-muted-foreground">
              {userName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <AvatarDecorationRenderer decorationId={selectedDecoration} />
        </div>
      </div>
    </div>
  );

  return (
    <SplitPaneDialog
      open={open}
      onClose={onClose}
      title={t('Change Avatar Decoration')}
      size="2xl"
      onApply={handleApply}
      applyLabel={t('Apply')}
      cancelLabel={t('Cancel')}
      preview={previewContent}
    >
      {/* Section: Your Decorations */}
      <div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
          {t('Your Decorations')}
        </h3>
        <div className="flex items-center gap-3">
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
                  'aspect-square rounded-xl bg-card hover:bg-muted/70 border flex items-center justify-center relative cursor-pointer group transition-all p-2',
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

                <div className="relative size-11 rounded-full bg-muted/60 flex items-center justify-center">
                  <div className="size-full rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-bold">
                    {userName.slice(0, 1).toUpperCase()}
                  </div>
                  <AvatarDecorationRenderer decorationId={item.id} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section: See What's in Shop */}
      <div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
          {t("See What's in Shop")}
        </h3>
        <div className="grid grid-cols-3 gap-2.5">
          {shopDecorations.map((item) => {
            const isSelected = selectedDecoration === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedDecoration(item.id)}
                className={cn(
                  'aspect-square rounded-xl bg-card hover:bg-muted/70 border flex items-center justify-center relative cursor-pointer group transition-all p-2',
                  isSelected
                    ? 'border-primary bg-primary/15 shadow-[0_0_12px_rgba(var(--primary),0.35)]'
                    : 'border-border/70'
                )}
                title={item.name}
              >
                {/* Lock badge */}
                <span className="absolute top-1.5 right-1.5 size-4 rounded-full bg-black/60 flex items-center justify-center z-30 shadow-xs">
                  <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                </span>

                <div className="relative size-11 rounded-full bg-muted/60 flex items-center justify-center">
                  <div className="size-full rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-bold">
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
