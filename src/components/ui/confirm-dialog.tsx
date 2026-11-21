import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogSize,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/core/i18n';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onConfirm: () => void | Promise<void>;
  title: React.ReactNode;
  description: React.ReactNode;
  confirmLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  variant?: 'destructive' | 'default';
  isLoading?: boolean;
  size?: DialogSize;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = 'destructive',
  isLoading = false,
  size = 'sm',
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      onClose?.();
    }
    onOpenChange?.(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size={size} className="gap-3">
        <DialogHeader>
          <DialogTitle className={variant === 'destructive' ? 'text-destructive' : undefined}>
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-3 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel ?? t('Batal')}
          </Button>
          <Button
            type="button"
            variant={variant}
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {confirmLabel ?? (variant === 'destructive' ? t('Hapus') : t('Konfirmasi'))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
