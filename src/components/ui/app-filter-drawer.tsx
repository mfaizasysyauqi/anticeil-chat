import React from 'react';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';

export interface AppFilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  activeFilterCount?: number;
  onReset?: () => void;
  children: React.ReactNode;
  className?: string;
  widthClassName?: string;
}

export function AppFilterDrawer({
  open,
  onOpenChange,
  title,
  activeFilterCount = 0,
  onReset,
  children,
  className,
  widthClassName = 'w-[270px] sm:w-[280px] max-w-[85vw] sm:max-w-[280px]',
}: AppFilterDrawerProps) {
  const { t } = useTranslation();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          'p-4 overflow-y-auto custom-scrollbar bg-card border-border z-[170]',
          widthClassName,
          className
        )}
      >
        <SheetHeader className="p-0 pb-3 border-b border-border/50 text-left pr-8">
          <SheetTitle className="text-sm font-bold flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">{title}</span>
              {activeFilterCount > 0 && (
                <span className="text-[11px] font-semibold text-primary shrink-0">
                  ({activeFilterCount})
                </span>
              )}
            </div>
            {activeFilterCount > 0 && onReset && (
              <button
                type="button"
                onClick={onReset}
                className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer shrink-0 ml-2"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t('Reset')}</span>
              </button>
            )}
          </SheetTitle>
        </SheetHeader>
        <div className="py-4">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
