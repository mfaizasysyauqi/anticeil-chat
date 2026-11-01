import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/core/i18n';
import { Sparkles } from 'lucide-react';

interface AuthRequiredDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleSignIn: () => void;
  featureTitle?: string;
  featureDescription?: string;
}

export function AuthRequiredDialog({
  isOpen,
  onClose,
  onGoogleSignIn,
  featureTitle,
  featureDescription,
}: AuthRequiredDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden bg-background border border-border shadow-2xl rounded-[16px] select-none">
        {/* Banner with gradient & Anticeil branding */}
        <div className="relative w-full h-28 bg-gradient-to-br from-amber-500/20 via-primary/20 to-purple-500/20 flex flex-col items-center justify-center border-b border-border/60">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent pointer-events-none" />
          <div className="w-14 h-14 rounded-2xl bg-background/90 p-2 shadow-xl border border-border/80 flex items-center justify-center relative z-10 animate-in zoom-in-95 duration-200">
            <img src="/logo.png" alt="Anticeil" className="w-full h-full object-contain" />
          </div>
        </div>

        <div className="p-5 flex flex-col items-center text-center">
          <DialogHeader className="space-y-1.5 flex flex-col items-center pr-0">
            <DialogTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-1.5">
              {featureTitle || t('Masuk ke Anticeil')}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground max-w-[340px] leading-relaxed">
              {featureDescription ||
                t('Masuk dengan akun Google Anda untuk bergabung ke colony, mengirim pesan, dan terhubung dengan komunitas Anticeil.')}
            </DialogDescription>
          </DialogHeader>

          {/* Action button */}
          <div className="w-full mt-4 space-y-2.5">
            <Button
              type="button"
              onClick={() => {
                onClose();
                onGoogleSignIn();
              }}
              className="w-full h-11 text-sm font-semibold flex items-center justify-center gap-2.5 bg-primary text-primary-foreground hover:opacity-95 shadow-md hover:shadow-lg transition-all rounded-xl cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{t('Lanjutkan dengan Google')}</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="w-full h-9 text-xs text-muted-foreground hover:text-foreground rounded-xl"
            >
              {t('Nanti Saja')}
            </Button>
          </div>

          <div className="mt-4 pt-3 border-t border-border/50 w-full flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/75">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>{t('Gratis & langsung terhubung ke seluruh fitur')}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
