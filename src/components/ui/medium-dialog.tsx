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
        className={cn('bg-card border-border text-foreground p-0 flex flex-col overflow-hidden max-h-[85vh]', className)}
      >
        <DialogHeader className="px-5 sm:px-6 pt-5 pb-3 border-b border-border/50 shrink-0 space-y-1.5 text-left">
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

        <div className={cn('flex-1 min-h-0 overflow-y-auto custom-scrollbar px-5 sm:px-6 py-4 space-y-4', bodyClassName)}>
          {children}
        </div>

        {footer !== undefined ? (
          footer && (
            <DialogFooter className="px-5 sm:px-6 py-3 border-t border-border/60 flex items-center justify-end gap-2 shrink-0 bg-card mt-0">
              {footer}
            </DialogFooter>
          )
        ) : (
          (onConfirm || cancelLabel) && (
            <DialogFooter className="px-5 sm:px-6 py-3 border-t border-border/60 flex items-center justify-end gap-2 shrink-0 bg-card mt-0">
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
