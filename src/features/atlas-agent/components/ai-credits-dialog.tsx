import React from 'react';
import { Zap, Sparkles, Crown, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/core/i18n';
import {
  getAiCreditsStatus,
  openUpgradeSubscription,
  type AiCreditsStatus,
} from '../services/ai-credits-service';

export interface AiCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status?: AiCreditsStatus;
}

export function AiCreditsDialog({
  open,
  onOpenChange,
  status: initialStatus,
}: AiCreditsDialogProps) {
  const { t } = useTranslation();
  const status = initialStatus || getAiCreditsStatus();

  const handleUpgradeClick = (plan: 'nectar_basic' | 'nectar_boost' | 'royal_enterprise') => {
    onOpenChange(false);
    openUpgradeSubscription(plan);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border border-border/80 bg-card rounded-2xl shadow-2xl">
        {/* Header with decorative glow */}
        <div className="relative p-6 pb-4 bg-gradient-to-b from-primary/15 via-background to-background border-b border-border/40">
          <div className="size-11 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary mb-3 shadow-inner">
            <Zap className="w-5 h-5" />
          </div>

          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
              <span>{t('Kredit AI Atlas Habis')}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-bold">
                0 {t('Tersisa')}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {t(
                'Anda telah menggunakan seluruh kuota gratis harian ({{limit}} kredit). Kuota akan di-reset otomatis setiap pukul 00:00.',
                { limit: status.dailyLimit }
              )}{' '}
              {t('Tingkatkan paket untuk melanjutkan tanpa jeda.')}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Upgrade Tier Options Grid */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* 1. POLLEN */}
          <div className="relative rounded-xl border border-border/70 hover:border-yellow-400/60 bg-muted/20 hover:bg-muted/30 p-3.5 transition-all flex items-center justify-between gap-3 group">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-yellow-400">POLLEN</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-yellow-400/15 text-yellow-400 font-semibold">
                  100 Kredit / Hari
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                IDR 35,000/bulan • Upload 50MB & Smart Artifacts
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => handleUpgradeClick('nectar_basic')}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs h-8 px-3 rounded-lg shrink-0 cursor-pointer"
            >
              <span>{t('Pilih')}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          {/* 2. NECTAR (POPULAR) */}
          <div className="relative rounded-xl border-2 border-primary bg-primary/5 p-3.5 transition-all flex items-center justify-between gap-3 shadow-md">
            <div className="absolute -top-2.5 right-4 px-2.5 py-0.2 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 text-[9px] font-black uppercase text-white shadow-xs">
              POPULAR
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-400">NECTAR VIP 🍯</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/20 text-primary font-bold">
                  500 Kredit / Hari
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                IDR 85,000/bulan • Akses GPT-OSS 120B & 2 Colony Boosts
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => handleUpgradeClick('nectar_boost')}
              className="bg-gradient-to-r from-indigo-500 to-pink-500 hover:opacity-95 text-white font-bold text-xs h-8 px-3.5 rounded-lg shrink-0 shadow-sm cursor-pointer"
            >
              <span>{t('Upgrade')}</span>
              <Sparkles className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          {/* 3. ROYAL ENTERPRISE */}
          <div className="relative rounded-xl border border-amber-500/40 hover:border-amber-400 bg-amber-500/5 p-3.5 transition-all flex items-center justify-between gap-3 group">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-400">ROYAL 👑</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold">
                  Unlimited
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                IDR 499,000/bulan • Tanpa batas harian & Enterprise Colony
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleUpgradeClick('royal_enterprise')}
              className="border-amber-500/40 hover:bg-amber-500/15 text-amber-400 font-bold text-xs h-8 px-3 rounded-lg shrink-0 cursor-pointer"
            >
              <span>{t('Pilih')}</span>
              <Crown className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-muted/30 border-t border-border/40 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            {t('Reset harian pukul 00:00 WIB')}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground hover:text-foreground h-7 px-2 cursor-pointer"
          >
            {t('Tutup')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
