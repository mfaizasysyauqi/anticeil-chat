import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  type DialogSize,
} from '@/components/ui/dialog';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/core/i18n';
import { cn } from '@/lib/utils';
import { Loader2, X } from 'lucide-react';

/**
 * MediumDialog (Template Dialog Sedang Reusable)
 * Title & Close Button (X) berada dalam 1 baris yang rapi (1 row flex).
 * Margin vertikal dan horizontal ramping & presisi.
 */
export interface MediumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  headerContent?: React.ReactNode;
  footer?: React.ReactNode;
  confirmLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  onConfirm?: () => void | Promise<void>;
  onSubmit?: (e: React.FormEvent) => void;
  isLoading?: boolean;
  showCloseButton?: boolean;
  size?: DialogSize;
  className?: string;
  bodyClassName?: string;
}

export function MediumDialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  children,
  headerContent,
  footer,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onSubmit,
  isLoading = false,
  showCloseButton = true,
  size = 'md',
  className,
  bodyClassName,
}: MediumDialogProps) {
  const { t } = useTranslation();

  const bodyAndFooter = (
    <>
      <div className={cn('flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 py-3 sm:px-4.5 sm:py-3.5 space-y-3.5', bodyClassName)}>
        {children}
      </div>

      {footer !== undefined ? (
        footer && (
          <DialogFooter className="px-4 py-2.5 sm:px-4.5 sm:py-3 border-t border-border/60 flex items-center justify-end gap-2 shrink-0 bg-card mt-0">
            {footer}
          </DialogFooter>
        )
      ) : (
        (onConfirm || cancelLabel || onSubmit) && (
          <DialogFooter className="px-4 py-2.5 sm:px-4.5 sm:py-3 border-t border-border/60 flex items-center justify-end gap-2 shrink-0 bg-card mt-0">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="h-8 px-3.5 text-xs font-semibold cursor-pointer"
            >
              {cancelLabel ?? t('Batal')}
            </Button>
            {(onConfirm || onSubmit) && (
              <Button
                type={onSubmit ? 'submit' : 'button'}
                size="sm"
                onClick={onSubmit ? undefined : onConfirm}
                disabled={isLoading}
                className="h-8 px-4 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                {confirmLabel ?? t('Simpan')}
              </Button>
            )}
          </DialogFooter>
        )
      )}
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size={size}
        showCloseButton={false}
        className={cn('bg-card border-border text-foreground p-0 sm:p-0 flex flex-col overflow-hidden max-h-[85vh]', className)}
      >
        {/* Header: Title and Button X in 1 unified flex row with slim padding */}
        <DialogHeader className="px-4 py-2.5 sm:px-4.5 sm:py-3 border-b border-border/50 shrink-0 space-y-1 text-left pr-4 sm:pr-4.5 mb-0">
          <div className="flex items-center justify-between gap-2.5 w-full">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {icon}
              <DialogTitle className="text-sm sm:text-base font-bold text-foreground truncate">
                {title}
              </DialogTitle>
            </div>
            {showCloseButton && (
              <DialogPrimitive.Close
                className="size-7 rounded-lg flex items-center justify-center text-muted-foreground/80 hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer shrink-0 -mr-1"
                title={t('Tutup')}
                aria-label={t('Tutup')}
              >
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            )}
          </div>
          {description && (
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed mt-0.5">
              {description}
            </DialogDescription>
          )}
          {headerContent}
        </DialogHeader>

        {onSubmit ? (
          <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {bodyAndFooter}
          </form>
        ) : (
          bodyAndFooter
        )}
      </DialogContent>
    </Dialog>
  );
}
