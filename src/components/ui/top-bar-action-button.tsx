import React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface TopBarActionButtonProps extends Omit<ButtonProps, 'label'> {
  icon?: React.ReactNode;
  label?: React.ReactNode;
  shortLabel?: React.ReactNode;
  iconOnlyMobile?: boolean;
  iconOnlyTablet?: boolean;
}

export const TopBarActionButton = React.forwardRef<HTMLButtonElement, TopBarActionButtonProps>(
  (
    {
      className,
      icon,
      label,
      shortLabel,
      iconOnlyMobile = false,
      iconOnlyTablet = false,
      children,
      variant = 'default',
      size = 'xs',
      ...props
    },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          'h-6 sm:h-7 px-2 sm:px-2.5 py-1 text-xs font-bold transition-all bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 flex items-center gap-1.5 ml-0.5 cursor-pointer shadow-xs rounded-[4px]',
          className
        )}
        {...props}
      >
        {icon}
        {label && (
          <>
            {iconOnlyTablet ? (
              <span className="hidden lg:inline">{label}</span>
            ) : iconOnlyMobile ? (
              <span className="hidden sm:inline">{label}</span>
            ) : (
              <>
                <span className={cn(shortLabel ? 'hidden sm:inline' : '')}>{label}</span>
                {shortLabel && <span className="sm:hidden">{shortLabel}</span>}
              </>
            )}
          </>
        )}
        {children}
      </Button>
    );
  }
);

TopBarActionButton.displayName = 'TopBarActionButton';

