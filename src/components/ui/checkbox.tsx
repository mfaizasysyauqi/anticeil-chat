import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked = false, onCheckedChange, disabled = false, id }, ref) => {
    return (
      <button
        type="button"
        id={id}
        ref={ref}
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) onCheckedChange?.(!checked);
        }}
        className={cn(
          'peer h-4.5 w-4.5 shrink-0 rounded-[5px] border transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer flex items-center justify-center select-none shadow-2xs',
          checked
            ? 'bg-primary border-primary text-primary-foreground shadow-xs'
            : 'bg-muted/40 hover:bg-muted/70 border-border/80 hover:border-primary/50',
          className,
        )}
      >
        {checked && <Check className="h-3 w-3 text-primary-foreground stroke-[3]" />}
      </button>
    );
  },
);
Checkbox.displayName = 'Checkbox';
