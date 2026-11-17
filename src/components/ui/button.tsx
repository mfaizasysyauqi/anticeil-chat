import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { Loader2 } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-normal whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-primary stroke-background text-primary-foreground enabled:hover:bg-primary/90',
        basic:
          'text-primary font-medium underline-offset-4 enabled:hover:bg-accent',
        secondary:
          'text-secondary-foreground bg-secondary enabled:hover:bg-secondary/80 enabled:hover:text-secondary-foreground',
        destructive:
          'bg-destructive text-white enabled:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40',
        outline:
          'border-input bg-background enabled:hover:bg-accent enabled:hover:text-accent-foreground border',
        accent: 'bg-accent text-accent-foreground enabled:hover:bg-accent/80',
        ghost:
          'hover:bg-gray-300/30 hover:text-accent-foreground dark:hover:bg-gray-300/10',
        link: 'text-primary underline-offset-4 hover:underline',
        transparent: 'text-primary enabled:hover:bg-transparent',
        teal:
          'bg-sidebar-primary text-sidebar-primary-foreground enabled:hover:bg-sidebar-primary/90 shadow-xs focus-visible:ring-sidebar-ring',
        tealSecondary:
          'bg-secondary text-secondary-foreground border border-border/70 enabled:hover:bg-muted enabled:hover:text-sidebar-primary enabled:hover:border-sidebar-primary/50 shadow-xs',
        tealOutline:
          'border border-sidebar-primary/60 text-sidebar-primary bg-transparent enabled:hover:bg-sidebar-primary/10 enabled:hover:text-sidebar-primary',
        tealGhost:
          'text-muted-foreground enabled:hover:bg-sidebar-accent enabled:hover:text-sidebar-primary',
        blue:
          'bg-sidebar-primary text-sidebar-primary-foreground enabled:hover:bg-sidebar-primary/90 shadow-xs focus-visible:ring-sidebar-ring',
        blueSecondary:
          'bg-secondary text-secondary-foreground border border-border/70 enabled:hover:bg-muted enabled:hover:text-sidebar-primary enabled:hover:border-sidebar-primary/50 shadow-xs',
        blueOutline:
          'border border-sidebar-primary/60 text-sidebar-primary bg-transparent enabled:hover:bg-sidebar-primary/10 enabled:hover:text-sidebar-primary',
        blueGhost:
          'text-muted-foreground enabled:hover:bg-sidebar-accent enabled:hover:text-sidebar-primary',
      },
      size: {
        default: 'h-9 px-3 py-2 has-[>svg]:px-2.5',
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 gap-1.5 rounded-md px-2.5 has-[>svg]:px-2',
        lg: 'h-10 rounded-md px-5 has-[>svg]:px-4',
        xl: 'h-11 rounded-md px-8 has-[>svg]:px-6',
        icon: 'size-9',
        'icon-xs': "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
