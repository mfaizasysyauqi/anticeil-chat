import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import {
  ITEM_TYPE_OPTIONS,
  COLOR_OPTIONS,
  THEME_OPTIONS,
} from '../data/shop-constants';

export interface ShopFilterContentProps {
  selectedTypes: string[];
  toggleType: (typeId: string) => void;
  showOnlyDew: boolean;
  setShowOnlyDew: (val: boolean) => void;
  showOnlyFeatured: boolean;
  setShowOnlyFeatured: (val: boolean) => void;
  showOnlyDiscount: boolean;
  setShowOnlyDiscount: (val: boolean) => void;
  selectedColor: string | null;
  toggleColor: (colorId: string) => void;
  setSelectedColor: (val: string | null) => void;
  selectedThemes: string[];
  toggleTheme: (themeId: string) => void;
  setSelectedThemes: (val: string[]) => void;
}

export function ShopFilterContent({
  selectedTypes,
  toggleType,
  showOnlyDew,
  setShowOnlyDew,
  showOnlyFeatured,
  setShowOnlyFeatured,
  showOnlyDiscount,
  setShowOnlyDiscount,
  selectedColor,
  toggleColor,
  setSelectedColor,
  selectedThemes,
  toggleTheme,
  setSelectedThemes,
}: ShopFilterContentProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* 1. Item Type */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
          {t('Item Type')}
        </h4>
        <div className="space-y-1.5">
          {ITEM_TYPE_OPTIONS.map((opt) => {
            const isSelected = selectedTypes.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleType(opt.id)}
                className="flex items-center gap-2.5 text-xs font-medium text-foreground/90 hover:text-foreground cursor-pointer group select-none text-left w-full py-0.5"
              >
                <div
                  className={cn(
                    'size-4 rounded-[4px] border flex items-center justify-center transition-colors shrink-0',
                    isSelected
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-muted-foreground/40 bg-muted/20 group-hover:border-foreground/60'
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Show Only */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
          {t('Show Only')}
        </h4>
        <div className="space-y-1.5">
          {/* Dew Eligible */}
          <button
            type="button"
            onClick={() => setShowOnlyDew(!showOnlyDew)}
            className="flex items-center gap-2.5 text-xs font-medium text-foreground/90 hover:text-foreground cursor-pointer group select-none text-left w-full py-0.5"
          >
            <div
              className={cn(
                'size-4 rounded-[4px] border flex items-center justify-center transition-colors shrink-0',
                showOnlyDew
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-muted-foreground/40 bg-muted/20 group-hover:border-foreground/60'
              )}
            >
              {showOnlyDew && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <span className="truncate flex items-center gap-1.5">
              <span>{t('Dew Eligible')}</span>
              <span className="text-[11px]">💧</span>
            </span>
          </button>

          {/* Featured / Collabs */}
          <button
            type="button"
            onClick={() => setShowOnlyFeatured(!showOnlyFeatured)}
            className="flex items-center gap-2.5 text-xs font-medium text-foreground/90 hover:text-foreground cursor-pointer group select-none text-left w-full py-0.5"
          >
            <div
              className={cn(
                'size-4 rounded-[4px] border flex items-center justify-center transition-colors shrink-0',
                showOnlyFeatured
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-muted-foreground/40 bg-muted/20 group-hover:border-foreground/60'
              )}
            >
              {showOnlyFeatured && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <span className="truncate">{t('Featured / Unggulan')}</span>
          </button>

          {/* Discount / Promo */}
          <button
            type="button"
            onClick={() => setShowOnlyDiscount(!showOnlyDiscount)}
            className="flex items-center gap-2.5 text-xs font-medium text-foreground/90 hover:text-foreground cursor-pointer group select-none text-left w-full py-0.5"
          >
            <div
              className={cn(
                'size-4 rounded-[4px] border flex items-center justify-center transition-colors shrink-0',
                showOnlyDiscount
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-muted-foreground/40 bg-muted/20 group-hover:border-foreground/60'
              )}
            >
              {showOnlyDiscount && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <span className="truncate">{t('Diskon / Promo')}</span>
          </button>
        </div>
      </div>

      {/* 3. Color Swatches (2 rows of 5) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
            {t('Color')}
          </h4>
          {selectedColor && (
            <button
              type="button"
              onClick={() => setSelectedColor(null)}
              className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {t('Clear')}
            </button>
          )}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {COLOR_OPTIONS.map((col) => {
            const isSelected = selectedColor === col.id;
            const isLight = col.id === 'white' || col.id === 'yellow';
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => toggleColor(col.id)}
                title={t(col.label)}
                className={cn(
                  'size-7 rounded-full flex items-center justify-center transition-all cursor-pointer relative',
                  isSelected
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 shadow-md'
                    : 'hover:scale-105 opacity-90 hover:opacity-100'
                )}
                style={{
                  backgroundColor: col.hex,
                  border:
                    col.id === 'dark' || col.id === 'white'
                      ? '1px solid rgba(255,255,255,0.2)'
                      : undefined,
                }}
              >
                {isSelected && (
                  <Check
                    className={cn(
                      'w-3.5 h-3.5 stroke-[3]',
                      isLight ? 'text-black' : 'text-white'
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Theme Grid (2 columns) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
            {t('Theme')}
          </h4>
          {selectedThemes.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedThemes([])}
              className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {t('Clear')}
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {THEME_OPTIONS.map((th) => {
            const isSelected = selectedThemes.includes(th.id);
            return (
              <button
                key={th.id}
                type="button"
                onClick={() => toggleTheme(th.id)}
                className={cn(
                  'h-8 px-2 rounded-md border text-[11px] font-medium flex items-center gap-1.5 truncate transition-all cursor-pointer select-none text-left',
                  isSelected
                    ? 'bg-primary/20 border-primary text-primary font-bold shadow-xs'
                    : 'bg-muted/30 border-border/60 text-foreground/80 hover:bg-muted/70 hover:text-foreground'
                )}
              >
                <span className="text-xs shrink-0">{th.icon}</span>
                <span className="truncate">{t(th.label)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
