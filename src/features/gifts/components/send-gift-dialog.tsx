import React from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-[880px] max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader className="flex flex-row items-center justify-between pb-1">
          <DialogTitle className="text-lg font-black text-foreground">Send a Gift</DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
            title="Tutup"
            aria-label="Tutup"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
            {/* 1. POLLEN CARD (BASIC) */}
            <div className="relative rounded-2xl bg-card border border-border hover:border-border/80 p-4 flex flex-col justify-between transition-all group shadow-md">
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-black italic tracking-wide text-yellow-300">POLLEN 🌼</h3>
                    <div className="mt-0.5">
                      <span className="text-base font-extrabold text-foreground">IDR 42,714</span>
                      <span className="text-xs text-muted-foreground">/month</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground block">IDR 427,140/year</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-xl shadow-xs">
                    🌼
                  </div>
                </div>

                <div className="w-full h-px bg-border/60 my-3" />

                {/* Perks */}
                <div className="space-y-1.5 text-xs text-foreground/80">
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-black">↑</span>
                    <span>50MB uploads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>😊</span>
                    <span>Custom emoji anywhere</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>💥</span>
                    <span>Unlimited Super Reactions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🛡️</span>
                    <span>Special Pollen badge</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSendGift('pollen')}
                className="mt-4 w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/30 font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                Kirim Hadiah Pollen
              </button>
            </div>

            {/* 2. NECTAR CARD (POPULAR) */}
            <div className="relative rounded-2xl bg-card border border-primary/50 hover:border-primary p-4 flex flex-col justify-between transition-all group shadow-md">
              {/* POPULAR badge */}
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 text-[9px] font-black uppercase tracking-wider text-white shadow-md">
                POPULAR
              </div>

              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-black italic tracking-wide text-amber-400">NECTAR 🍯</h3>
                    <div className="mt-0.5">
                      <span className="text-base font-extrabold text-foreground">IDR 142,714</span>
                      <span className="text-xs text-muted-foreground">/month</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground block">IDR 1,428,428/year</span>
                  </div>
                  {/* Rocket Illustration */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-pink-500/20 border border-border flex items-center justify-center text-xl shadow-xs">
                    🚀
                  </div>
                </div>

                <div className="w-full h-px bg-border/60 my-3" />

                {/* Perks */}
                <div className="space-y-1.5 text-xs text-foreground/80">
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-black">↑</span>
                    <span>1GB uploads capacity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>😊</span>
                    <span>Custom emoji anywhere</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>💥</span>
                    <span>Unlimited Super Reactions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🖵</span>
                    <span>HD 4K video streaming</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>💎</span>
                    <span>2 Free Colony Boosts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>👤</span>
                    <span>Custom banner & profiles</span>
                  </div>
                </div>

                {/* Free reward box */}
                <div className="mt-3 p-2 rounded-xl bg-muted/40 border border-border/50 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-sm shrink-0">
                    🔮
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-foreground block">Free Reward Choice</span>
                    <span className="text-[9px] text-muted-foreground">3 options available</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSendGift('nectar')}
                className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 hover:opacity-95 text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Kirim Hadiah Nectar
              </button>
            </div>

            {/* 3. ROYAL CARD (ENTERPRISE) */}
            <div className="relative rounded-2xl bg-card border border-amber-500/40 hover:border-amber-400 p-4 flex flex-col justify-between transition-all group shadow-md">
              {/* ROYAL badge */}
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-[9px] font-black uppercase tracking-wider text-black shadow-md flex items-center gap-1">
                <span>👑</span>
                <span>ROYAL ENTERPRISE</span>
              </div>

              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-black italic tracking-wide text-amber-400">ROYAL 👑</h3>
                    <div className="mt-0.5">
                      <span className="text-base font-extrabold text-foreground">IDR 499,000</span>
                      <span className="text-xs text-muted-foreground">/month</span>
                    </div>
                    <span className="text-[10px] text-amber-400/90 font-medium block">Sovereign Colony Tier</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl shadow-xs">
                    👑
                  </div>
                </div>

                <div className="w-full h-px bg-border/60 my-3" />

                {/* Perks */}
                <div className="space-y-1.5 text-xs text-foreground/80">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-black">★</span>
                    <span>Corporate SSO & JIT Domain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-black">↑</span>
                    <span>Unlimited file uploads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>💎</span>
                    <span>10 Free Colony Boosts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📋</span>
                    <span>365-day audit log retention</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>⚡</span>
                    <span>Dedicated SLA & 99.9% uptime</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>👑</span>
                    <span>Sovereign Crown profile badge</span>
                  </div>
                </div>

                {/* Enterprise perk highlight box */}
                <div className="mt-3 p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-sm shrink-0">
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
                className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:opacity-95 text-black font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Kirim Hadiah Royal 👑
              </button>
            </div>
          </div>

          {/* Bottom Patron Badge Banner */}
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sm shrink-0">
              🎁
            </div>
            <span className="text-xs text-foreground/80 font-medium">
              1 gift away from the Patron Badge!
            </span>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
