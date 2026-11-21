import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/core/i18n';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

/**
 * SmallDialog (Template Dialog Kecil)
 * Modeled after the Confirmation/Delete Dialog (e.g. Delete Channel, Delete Colony, Kick/Ban member).
 * Sizing: sm:max-w-sm (approx 384px - 400px), rounded-2xl, border-border, shadow-2xl.
 * Used for all dialogs smaller than Dialog Sedang.
 */
export interface SmallDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  confirmLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  onConfirm?: () => void | Promise<void>;
  variant?: 'destructive' | 'default';
  isLoading?: boolean;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  className?: string;
}

export function SmallDialog({
  open,
  onOpenChange,
  onClose,
  title,
  description,
  icon,
  children,
  confirmLabel,
  cancelLabel,
  onConfirm,
  variant = 'destructive',
  isLoading = false,
  footer,
  showCloseButton = true,
  className,
}: SmallDialogProps) {
  const { t } = useTranslation();

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      onClose?.();
    }
    onOpenChange?.(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        size="sm"
        showCloseButton={showCloseButton}
        className={cn('gap-3 bg-card border-border text-foreground', className)}
      >
        <DialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center gap-2">
            {icon}
            <DialogTitle
              className={cn(
                'text-base font-bold leading-tight',
                variant === 'destructive' ? 'text-destructive' : 'text-foreground'
              )}
            >
              {title}
            </DialogTitle>
          </div>
          {description && (
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {children && <div className="py-1 text-xs text-foreground">{children}</div>}

        {footer ? (
          <DialogFooter className="mt-3 gap-2">{footer}</DialogFooter>
        ) : (
          (onConfirm || onClose) && (
            <DialogFooter className="mt-3 gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onClose}
                disabled={isLoading}
                className="h-9 px-3.5 text-xs font-semibold cursor-pointer"
              >
                {cancelLabel ?? t('Batal')}
              </Button>
              {onConfirm && (
                <Button
                  type="button"
                  variant={variant}
                  size="sm"
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={cn(
                    'h-9 px-4 text-xs font-bold cursor-pointer transition-all shadow-xs active:scale-95',
                    variant === 'destructive'
                      ? 'bg-destructive hover:bg-destructive/90 text-white'
                      : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  )}
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                  {confirmLabel ?? (variant === 'destructive' ? t('Hapus') : t('Konfirmasi'))}
                </Button>
              )}
            </DialogFooter>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
