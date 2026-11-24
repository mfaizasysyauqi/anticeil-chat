import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

function Empty({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty"
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg border-dashed p-4 text-center text-balance md:p-8',
        className,
      )}
      {...props}
    />
  );
}

function EmptyHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-header"
      className={cn(
        'flex max-w-sm flex-col items-center gap-2 text-center',
        className,
      )}
      {...props}
    />
  );
}

const emptyMediaVariants = cva(
  'flex shrink-0 items-center justify-center mb-2 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        icon: "bg-muted text-foreground flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function EmptyMedia({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  );
}

function EmptyTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-title"
      className={cn('text-lg font-medium tracking-tight', className)}
      {...props}
    />
  );
}

function EmptyDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        'text-muted-foreground [&>a:hover]:text-primary text-sm/relaxed [&>a]:underline [&>a]:underline-offset-4',
        className,
      )}
      {...props}
    />
  );
}

function EmptyContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        'flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance',
        className,
      )}
      {...props}
    />
  );
}

export const emptyIconBadgeVariants = cva(
  'rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs shrink-0',
  {
    variants: {
      size: {
        default: 'size-16 [&_svg]:size-8',
        compact: 'size-12 [&_svg]:size-6',
        lg: 'size-20 [&_svg]:size-10',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

export interface EmptyIconBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyIconBadgeVariants> {}

function EmptyIconBadge({
  className,
  size = 'default',
  children,
  ...props
}: EmptyIconBadgeProps) {
  return (
    <div
      data-slot="empty-icon-badge"
      className={cn(emptyIconBadgeVariants({ size }), className)}
      {...props}
    >
      {children}
    </div>
  );
}

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  icon?: React.ReactNode;
  media?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
}

export function EmptyState({
  icon,
  media,
  title,
  description,
  action,
  compact = false,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        'flex flex-col items-center justify-center text-center px-4 w-full',
        compact ? 'py-8 sm:py-12' : 'py-16 sm:py-20',
        className,
      )}
      {...props}
    >
      {media ? (
        <div className="mb-4 flex items-center justify-center">{media}</div>
      ) : icon ? (
        <EmptyIconBadge size={compact ? 'compact' : 'default'} className="mb-4">
          {icon}
        </EmptyIconBadge>
      ) : null}
      <h3
        data-slot="empty-title"
        className={cn(
          'font-semibold text-foreground tracking-tight',
          compact ? 'text-xs mb-1' : 'text-sm mb-1.5',
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          data-slot="empty-description"
          className={cn(
            'text-muted-foreground leading-relaxed',
            compact ? 'text-[11px] max-w-xs' : 'text-xs max-w-sm sm:max-w-md',
          )}
        >
          {description}
        </p>
      )}
      {action && (
        <div data-slot="empty-action" className="mt-4 flex items-center justify-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
}

export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
  EmptyIconBadge,
};
