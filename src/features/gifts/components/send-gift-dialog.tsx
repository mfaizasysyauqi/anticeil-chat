import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface SendGiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendGift: (type: 'nitro' | 'nitro_basic') => void;
}

export function SendGiftDialog({
  open,
  onOpenChange,
  onSendGift,
}: SendGiftDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] bg-[#18191c] border-white/10 text-white p-4 sm:p-5 rounded-[16px] shadow-2xl overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between pb-2">
          <DialogTitle className="text-xl font-black text-white">Send a Gift</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          {/* 1. NITRO CARD (POPULAR) */}
          <div className="relative rounded-2xl bg-[#232428] border border-primary/40 hover:border-primary p-5 flex flex-col justify-between transition-all group shadow-xl">
            {/* POPULAR badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#5865f2] to-[#eb459e] text-[10px] font-black uppercase tracking-wider text-white shadow-md">
              POPULAR
            </div>

            <div>
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-black italic tracking-wide text-white">NITRO</h3>
                  <div className="mt-1">
                    <span className="text-xl font-extrabold text-white">IDR 142,714</span>
                    <span className="text-xs text-[#949ba4]">/month</span>
                  </div>
                  <span className="text-[11px] text-[#949ba4] block">IDR 1,428,428/year</span>
                </div>
                {/* Wumpus Astronaut Illustration */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center text-3xl shadow-lg">
                  🚀
                </div>
              </div>

              <div className="w-full h-px bg-white/10 my-4" />

              {/* Perks */}
              <div className="space-y-2 text-xs text-[#dbdee1]">
                <div className="flex items-center gap-2.5">
                  <span className="text-primary font-black">↑</span>
                  <span>1GB uploads</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span>😊</span>
                  <span>Custom emoji anywhere</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span>💥</span>
                  <span>Unlimited Super Reactions</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span>🖵</span>
                  <span>HD video streaming</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span>💎</span>
                  <span>2 Server Boosts</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span>👤</span>
                  <span>Custom profiles and more!</span>
                </div>
              </div>

              {/* Free reward box */}
              <div className="mt-4 p-3 rounded-xl bg-[#1e1f22] border border-white/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl shrink-0">
                  🔮
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Choose a FREE reward</span>
                  <span className="text-[10px] text-[#949ba4]">3 available options</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSendGift('nitro')}
              className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#5865f2] to-[#eb459e] hover:opacity-95 text-white font-bold text-xs transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              Send Nitro Gift
            </button>
          </div>

          {/* 2. NITRO BASIC CARD */}
          <div className="relative rounded-2xl bg-[#232428] border border-white/10 hover:border-white/20 p-5 flex flex-col justify-between transition-all group shadow-xl">
            <div>
              {/* Header */}
              <div>
                <h3 className="text-2xl font-black italic tracking-wide text-white">NITRO BASIC</h3>
                <div className="mt-1">
                  <span className="text-xl font-extrabold text-white">IDR 42,714</span>
                  <span className="text-xs text-[#949ba4]">/month</span>
                </div>
                <span className="text-[11px] text-[#949ba4] block">IDR 427,140/year</span>
              </div>

              <div className="w-full h-px bg-white/10 my-4" />

              {/* Perks */}
              <div className="space-y-2 text-xs text-[#dbdee1]">
                <div className="flex items-center gap-2.5">
                  <span className="text-primary font-black">↑</span>
                  <span>50MB uploads</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span>😊</span>
                  <span>Custom emoji anywhere</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span>💥</span>
                  <span>Unlimited Super Reactions</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span>🛡️</span>
                  <span>Special Nitro badge on your profile</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSendGift('nitro_basic')}
              className="mt-5 w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold font-bold text-xs transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              Send Nitro Basic Gift
            </button>
          </div>
        </div>

        {/* Bottom Patron Badge Banner */}
        <div className="mt-4 p-3 rounded-xl bg-[#1e1f22] border border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-lg shrink-0">
            🎁
          </div>
          <span className="text-xs text-[#dbdee1] font-medium">
            1 gift away from the Patron Badge!
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
