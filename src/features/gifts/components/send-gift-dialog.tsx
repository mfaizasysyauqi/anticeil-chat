import React from 'react';
import { X, Gift } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { LAYOUT_DIALOG_SPACING } from '@/lib/layout-constants';
import { useTranslation } from '@/core/i18n';
import { cn } from '@/lib/utils';

export interface SendGiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendGift: (type: 'nectar' | 'pollen' | 'royal' | 'nitro' | 'nitro_basic') => void;
}

export function SendGiftDialog({
  open,
  onOpenChange,
  onSendGift,
}: SendGiftDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        showCloseButton={false}
        className="overflow-hidden bg-card border-0 sm:border border-border flex flex-col md:flex-col rounded-none sm:rounded-2xl shadow-2xl z-[80] select-none max-h-[90vh]"
        overlayClassName="z-[80]"
      >
        {/* Header (Template Dialog Besar) */}
        <div className={cn(LAYOUT_DIALOG_SPACING.HEADER_CONTAINER, 'w-full bg-card/95 border-b border-border/70')}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shrink-0 shadow-2xs">
              <Gift className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2 truncate">
                <span>{t('Send a Gift')}</span>
                <span className="text-[10px] font-semibold bg-primary/15 text-primary border border-primary/30 px-2 py-0.5 rounded-full shrink-0">
                  Midtrans Sandbox
                </span>
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground truncate">
                {t('Kirim hadiah langganan ke teman dan komunitas dengan pembayaran Midtrans Sandbox')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
            title={t('Tutup')}
            aria-label={t('Tutup')}
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Scrollable Body (Template Dialog Besar) */}
        <div className={cn(LAYOUT_DIALOG_SPACING.BODY_PADDING, 'space-y-5 flex-1 min-h-0 w-full overflow-y-auto custom-scrollbar')}>
          {/* Top Intro Banner */}
          <div className="relative p-3 sm:p-4 rounded-xl bg-gradient-to-r from-primary/10 via-accent/30 to-background border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 overflow-hidden">
            {/* Mascot decoration */}
            <div className="hidden sm:block absolute right-44 -bottom-1 h-20 w-auto pointer-events-none drop-shadow-md opacity-95 z-20">
              <img
                src="/atlas-nectar.png"
                alt="Atlas Mascot"
                className="h-full w-auto object-contain select-none"
              />
            </div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-base shrink-0">
                🎁
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">{t('Beri Kejutan Spesial untuk Teman Anda')}</h4>
                <p className="text-[11px] text-muted-foreground">
                  {t('Pilih paket hadiah di bawah ini. Kode voucher instan akan digenerate otomatis setelah pembayaran Midtrans selesai.')}
                </p>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground font-semibold px-2.5 py-1 rounded-md bg-muted/50 border border-border/60 shrink-0">
              🔒 QRIS • GoPay • Virtual Account
            </div>
          </div>

          {/* 3-Column Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 items-stretch">
            {/* 1. POLLEN CARD (BASIC) */}
            <div className="relative rounded-2xl bg-card border border-border/80 hover:border-yellow-500/50 p-4 sm:p-5 flex flex-col justify-between transition-all group shadow-xs hover:shadow-md">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-wide text-yellow-400">POLLEN 🌼</h3>
                    <div className="mt-1">
                      <span className="text-lg font-black text-foreground">IDR 29,000</span>
                      <span className="text-xs text-muted-foreground">/bulan</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">IDR 290,000/tahun</span>
                  </div>
                  <div className="size-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-xl shadow-2xs">
                    🌼
                  </div>
                </div>

                <div className="w-full h-px bg-border/60" />

                <div className="space-y-2 text-xs text-foreground/80">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400 font-black">↑</span>
                    <span>Upload file hingga 50MB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>😊</span>
                    <span>Custom emoji di mana saja</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>💥</span>
                    <span>Super Reactions tanpa batas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🛡️</span>
                    <span>Badge profil spesial Pollen</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSendGift('pollen')}
                className="mt-6 w-full py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                Kirim Hadiah Pollen (Midtrans)
              </button>
            </div>

            {/* 2. NECTAR CARD (POPULAR) */}
            <div className="relative rounded-2xl bg-card border-2 border-primary hover:border-primary/90 p-4 sm:p-5 flex flex-col justify-between transition-all group shadow-md hover:shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 text-[9px] font-black uppercase tracking-wider text-white shadow-md">
                POPULAR
              </div>

              <div className="space-y-4">
                <div className="flex items-start justify-between pt-1">
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-wide text-amber-400">NECTAR 🍯</h3>
                    <div className="mt-1">
                      <span className="text-lg font-black text-foreground">IDR 85,000</span>
                      <span className="text-xs text-muted-foreground">/bulan</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">IDR 850,000/tahun</span>
                  </div>
                  <div className="size-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-pink-500/20 border border-primary/30 flex items-center justify-center text-xl shadow-2xs">
                    🚀
                  </div>
                </div>

                <div className="w-full h-px bg-border/60" />

                <div className="space-y-2 text-xs text-foreground/80">
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-black">↑</span>
                    <span>Kapasitas upload file 1GB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>😊</span>
                    <span>Custom emoji di mana saja</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>💥</span>
                    <span>Super Reactions tanpa batas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🖵</span>
                    <span>Streaming video kualitas HD 4K</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>💎</span>
                    <span>2 Free Colony Boosts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>👤</span>
                    <span>Custom banner & avatar profil</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 flex items-center gap-2.5">
                  <div className="size-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-sm shrink-0">
                    🔮
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-foreground block">Free Reward Choice</span>
                    <span className="text-[9px] text-muted-foreground">3 pilihan bonus tersedia</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSendGift('nectar')}
                className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 hover:opacity-95 text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Kirim Hadiah Nectar (Midtrans)
              </button>
            </div>

            {/* 3. ROYAL CARD (ENTERPRISE) */}
            <div className="relative rounded-2xl bg-card border border-amber-500/40 hover:border-amber-400 p-4 sm:p-5 flex flex-col justify-between transition-all group shadow-xs hover:shadow-md">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-[9px] font-black uppercase tracking-wider text-black shadow-md flex items-center gap-1">
                <span>👑</span>
                <span>ROYAL ENTERPRISE</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-start justify-between pt-1">
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-wide text-amber-400">ROYAL 👑</h3>
                    <div className="mt-1">
                      <span className="text-lg font-black text-foreground">IDR 499,000</span>
                      <span className="text-xs text-muted-foreground">/bulan</span>
                    </div>
                    <span className="text-[10px] text-amber-400/90 font-medium block mt-0.5">Sovereign Colony Tier</span>
                  </div>
                  <div className="size-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl shadow-2xs">
                    👑
                  </div>
                </div>

                <div className="w-full h-px bg-border/60" />

                <div className="space-y-2 text-xs text-foreground/80">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-black">★</span>
                    <span>Corporate SSO & JIT Domain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-black">↑</span>
                    <span>Upload file tanpa batas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>💎</span>
                    <span>10 Free Colony Boosts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📋</span>
                    <span>Retensi audit log 365 hari</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>⚡</span>
                    <span>Dedicated SLA & 99.9% uptime</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>👑</span>
                    <span>Badge profil Sovereign Crown</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2.5">
                  <div className="size-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-sm shrink-0">
                    🏛️
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-amber-300 block">Sovereign Team Access</span>
                    <span className="text-[9px] text-muted-foreground">Full domain capture & SSO</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSendGift('royal')}
                className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:opacity-95 text-black font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Kirim Hadiah Royal 👑 (Midtrans)
              </button>
            </div>
          </div>

          {/* Bottom Patron Badge & Guarantee Footer */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-muted/40 border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sm shrink-0">
                🎁
              </div>
              <span className="text-xs text-foreground/90 font-medium">
                1 hadiah lagi untuk membuka Badge Patron Komunitas!
              </span>
            </div>

            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <span>🔒 Pembayaran Resmi & Terverifikasi Midtrans Sandbox</span>
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
