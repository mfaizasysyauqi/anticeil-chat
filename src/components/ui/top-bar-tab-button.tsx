import React from 'react';
import { cn } from '@/lib/utils';

export interface TopBarTabButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: React.ReactNode;
}

/**
 * Universal, DRY App Bar Tab Pill Button
 * 100% consistent with AppsView, ColoniesView, FriendsView, ShopView, and QuestsView.
 */
export const TopBarTabButton = React.forwardRef<HTMLButtonElement, TopBarTabButtonProps>(
  ({ active = false, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'px-2.5 py-1 rounded-[4px] text-xs font-semibold cursor-pointer transition-colors shrink-0 flex items-center gap-1.5 select-none outline-none',
          active
            ? 'bg-accent text-accent-foreground shadow-2xs font-bold'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

TopBarTabButton.displayName = 'TopBarTabButton';
