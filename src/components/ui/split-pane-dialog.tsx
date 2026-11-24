import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '@/core/i18n';
import { cn } from '@/lib/utils';

export interface SplitPaneDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: 'md-lg' | '2xl' | 'wide' | '3xl';
  previewWidth?: 'normal' | 'wide';
  children: React.ReactNode;
  preview: React.ReactNode;
  footerActions?: React.ReactNode;
  onApply?: () => void;
  applyLabel?: string;
  cancelLabel?: string;
  isApplyDisabled?: boolean;
}

export const SplitPaneDialog: React.FC<SplitPaneDialogProps> = ({
  open,
  onClose,
  title,
  size = '2xl',
  previewWidth = 'normal',
  children,
  preview,
  footerActions,
  onApply,
  applyLabel,
  cancelLabel,
  isApplyDisabled = false,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full bg-card text-card-foreground rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden',
          size === '2xl' && 'max-w-[680px]',
          size === 'wide' && 'max-w-[760px]',
          size === '3xl' && 'max-w-[880px]',
          size === 'md-lg' && 'max-w-[620px]'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: 2 Kolom (Kiri Konten, Kanan Preview) */}
        <div className="flex flex-col md:flex-row gap-6 p-6 min-h-[460px]">
          {/* Kolom Kiri */}
          <div className="flex-1 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar space-y-6">
            {children}
          </div>

          {/* Kolom Kanan: Preview Box */}
          <div
            className={cn(
              'shrink-0 flex flex-col justify-center bg-muted/30 p-4 rounded-xl border border-border/50',
              previewWidth === 'wide' ? 'w-full md:w-[340px]' : 'w-full md:w-[260px]'
            )}
          >
            {preview}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-muted/40 flex items-center justify-end gap-3 border-t border-border/60">
          {footerActions ? (
            footerActions
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-lg font-semibold text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                {cancelLabel || t('Batal')}
              </button>
              {onApply && (
                <button
                  type="button"
                  onClick={onApply}
                  disabled={isApplyDisabled}
                  className="px-6 py-2 rounded-lg font-semibold text-sm text-primary-foreground bg-primary hover:bg-primary/90 transition-colors cursor-pointer shadow-md disabled:opacity-50"
                >
                  {applyLabel || t('Terapkan')}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
