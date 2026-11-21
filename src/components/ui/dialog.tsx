import { XIcon } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LAYOUT_DIALOG_SPACING } from '@/lib/layout-constants';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'two-pane';

export const dialogSizeClasses: Record<DialogSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  'two-pane': cn(LAYOUT_DIALOG_SPACING.TWO_PANE_CONTAINER, 'p-0'),
};

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      tabIndex={-1}
      className={cn(
        'fixed inset-0 z-50 bg-black/80 outline-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  showOverlay = true,
  overlayClassName,
  size,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & DialogContentProps) {
  const isTwoPane =
    size === 'two-pane' ||
    (typeof className === 'string' &&
      (className.includes('TWO_PANE_CONTAINER') ||
        className.includes('w-[9') ||
        className.includes('max-w-[9') ||
        className.includes('max-w-6xl') ||
        className.includes('max-w-7xl')));
  const resolvedSize: DialogSize = size ?? (isTwoPane ? 'two-pane' : 'lg');

  return (
    <DialogPortal data-slot="dialog-portal">
      {showOverlay && <DialogOverlay className={overlayClassName} />}
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          isTwoPane
            ? 'fixed top-[50%] left-[50%] z-50 flex flex-col translate-x-[-50%] translate-y-[-50%] duration-200 outline-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]'
            : 'fixed top-[50%] left-[50%] z-50 flex flex-col w-[calc(100vw-1.5rem)] sm:w-full max-h-[calc(100svh-2.5rem)] translate-x-[-50%] translate-y-[-50%] rounded-[16px] border border-border bg-background px-3.5 sm:px-4 md:px-5 lg:px-6 py-4 sm:py-5 text-foreground shadow-2xl duration-200 outline-hidden overflow-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
          dialogSizeClasses[resolvedSize],
          className,
        )}
        {...props}
      >
        {/* Fallback hidden title and description to satisfy Radix accessibility requirements */}
        <DialogPrimitive.Title className="sr-only">Dialog</DialogPrimitive.Title>
        <DialogPrimitive.Description className="sr-only">Dialog description</DialogPrimitive.Description>
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-3.5 right-3.5 z-20 flex size-7 items-center justify-center rounded-lg text-muted-foreground/80 hover:text-foreground hover:bg-muted/80 transition-all focus:outline-none cursor-pointer disabled:pointer-events-none [&_svg]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        'flex flex-col gap-1 text-left pr-7 mb-2 shrink-0',
        className,
      )}
      {...props}
    />
  );
}

function DialogBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-body"
      className={cn(
        'flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1 py-1 space-y-3',
        className,
      )}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<'div'> & DialogFooterProps) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-3 mt-2 border-t border-border/40 shrink-0',
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline" size="sm">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        'text-base leading-none font-semibold tracking-tight text-foreground',
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-xs text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};

export * from './confirm-dialog';

export type DialogContentProps = {
  showCloseButton?: boolean;
  showOverlay?: boolean;
  overlayClassName?: string;
  size?: DialogSize;
};

export type DialogFooterProps = {
  showCloseButton?: boolean;
};
