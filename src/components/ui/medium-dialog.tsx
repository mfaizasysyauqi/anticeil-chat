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
 * MediumDialog (Template Dialog Sedang)
 * Modeled after the Colony Komunitas Dialog / standard single-pane feature dialogs.
 * Sizing: sm:max-w-md (approx 480px - 500px), rounded-2xl, border-border, shadow-2xl.
 * Used for all dialogs smaller than Dialog Besar (Two-Pane Settings).
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
  isLoading?: boolean;
  showCloseButton?: boolean;
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
  isLoading = false,
  showCloseButton = true,
  className,
  bodyClassName,
}: MediumDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="md"
        showCloseButton={showCloseButton}
        className={cn('bg-card border-border text-foreground', className)}
      >
        <DialogHeader className="space-y-1.5 text-left pb-1">
          <div className="flex items-center gap-2">
            {icon}
            <DialogTitle className="text-base font-bold text-foreground">
              {title}
            </DialogTitle>
          </div>
          {description && (
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed mt-0.5">
              {description}
            </DialogDescription>
          )}
          {headerContent}
        </DialogHeader>

        <div className={cn('flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-4 py-2', bodyClassName)}>
          {children}
        </div>

        {footer !== undefined ? (
          footer && (
            <DialogFooter className="pt-3 mt-2 border-t border-border/40 flex items-center justify-end gap-2 shrink-0">
              {footer}
            </DialogFooter>
          )
        ) : (
          (onConfirm || cancelLabel) && (
            <DialogFooter className="pt-3 mt-2 border-t border-border/40 flex items-center justify-end gap-2 shrink-0">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="h-9 px-4 text-xs font-semibold cursor-pointer"
              >
                {cancelLabel ?? t('Batal')}
              </Button>
              {onConfirm && (
                <Button
                  type="button"
                  size="sm"
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="h-9 px-5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                  {confirmLabel ?? t('Simpan')}
                </Button>
              )}
            </DialogFooter>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
