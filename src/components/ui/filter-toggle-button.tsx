import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';

export interface FilterToggleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isOpen?: boolean;
  activeCount?: number;
  label?: string;
  openLabel?: string;
  closedLabel?: string;
}

export function FilterToggleButton({
  isOpen,
  activeCount = 0,
  label,
  openLabel,
  closedLabel,
  className,
  onClick,
  ...props
}: FilterToggleButtonProps) {
  const { t } = useTranslation();

  const text =
    label ??
    (isOpen !== undefined
      ? isOpen
        ? openLabel ?? t('Hide Filters')
        : closedLabel ?? t('Filters')
      : t('Filters'));

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-7 px-2.5 rounded-md border text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors select-none shrink-0',
        isOpen || activeCount > 0
          ? 'border-border bg-muted/70 hover:bg-muted text-foreground'
          : 'border-border/70 bg-muted/40 hover:bg-muted text-foreground',
        className
      )}
      {...props}
    >
      <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span>{text}</span>
      {activeCount > 0 && (
        <span className="size-4 rounded-full bg-primary text-primary-foreground text-[9px] font-black flex items-center justify-center shrink-0">
          {activeCount}
        </span>
      )}
    </button>
  );
}
