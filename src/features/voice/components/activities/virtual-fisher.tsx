import React, { useState } from 'react';
import { Check, Fish, Coins, Loader2, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import { toast } from 'sonner';

export interface VirtualFisherProps {
  currentUserName: string;
}

export function VirtualFisher({ currentUserName }: VirtualFisherProps) {
  const [fisherStats, setFisherStats] = useState({
    fishCount: 8,
    xp: 64,
    level: 3,
    coins: 140,
    rod: 'Kail Bambu Halus',
    lastCatch: {
      amount: 8,
      type: 'Fish',
      icon: '🐟',
      xp: 8,
      boostBy: 'lawny 🐕',
    },
  });
  const [fisherCooldown, setFisherCooldown] = useState(0);
  const [fisherFeed, setFisherFeed] = useState<Array<{
    id: string;
    userName: string;
    message: string;
    timestamp: string;
  }>>([
    {
      id: 'f-1',
      userName: 'zmsta',
      message: 'menangkap 8 🐟 Fish (+8 XP)',
      timestamp: '11.22',
    },
    {
      id: 'f-2',
      userName: 'lawny',
      message: 'mengaktifkan Global 🐕 Boost (2x XP)',
      timestamp: '11.20',
    },
  ]);

  const handleFishAction = () => {
    if (fisherCooldown > 0) {
      toast.error(`Harap tunggu ${fisherCooldown.toFixed(1)}s sebelum melempar kail lagi!`);
      return;
    }

    setFisherCooldown(3.5);
    const interval = setInterval(() => {
      setFisherCooldown((prev) => {
        if (prev <= 0.5) {
          clearInterval(interval);
          return 0;
        }
        return Number((prev - 0.5).toFixed(1));
      });
    }, 500);

    const rand = Math.random();
    let caughtFish = {
      amount: Math.floor(Math.random() * 8) + 4,
      type: 'Fish',
      icon: '🐟',
      xp: 8,
      boostBy: 'lawny 🐕',
    };

    if (rand > 0.92) {
      caughtFish = {
        amount: 1,
        type: 'Golden Dragon Koi',
        icon: '🐉',
        xp: 150,
        boostBy: 'server jackpot 🔥',
      };
    } else if (rand > 0.75) {
      caughtFish = {
        amount: 2,
        type: 'Cyber Shark',
        icon: '🦈',
        xp: 60,
        boostBy: 'anticeil 🐕',
      };
    } else if (rand > 0.45) {
      caughtFish = {
        amount: 4,
        type: 'Electric Eel',
        icon: '⚡',
        xp: 25,
        boostBy: 'zmsta ⚡',
      };
    }

    setFisherStats((prev) => ({
      ...prev,
      fishCount: prev.fishCount + caughtFish.amount,
      xp: prev.xp + caughtFish.xp,
      level: Math.floor((prev.xp + caughtFish.xp) / 50) + 1,
      lastCatch: caughtFish,
    }));

    setFisherFeed((prev) => [
      {
        id: `f-${Date.now()}`,
        userName: currentUserName,
        message: `menangkap ${caughtFish.amount} ${caughtFish.icon} ${caughtFish.type} (+${caughtFish.xp} XP)`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      ...prev.slice(0, 15),
    ]);

    toast.success(`Berhasil menangkap ${caughtFish.amount} ${caughtFish.type}! (+${caughtFish.xp} XP)`);
  };

  const handleSellFish = () => {
    if (fisherStats.fishCount <= 0) {
      toast.info('Tas ikan Anda kosong! Lempar kail terlebih dahulu.');
      return;
    }
    const earnedCoins = fisherStats.fishCount * 15;
    setFisherStats((prev) => ({
      ...prev,
      fishCount: 0,
      coins: prev.coins + earnedCoins,
    }));
    toast.success(`Berhasil menjual semua ikan dan mendapatkan ${earnedCoins} Koin! 🪙`);
  };

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden min-h-0 select-none">
      <div className={cn('flex-1 min-h-0 py-4 flex flex-col items-center justify-center bg-background relative overflow-y-auto', CHANNEL_HORIZONTAL_PADDING)}>
        <div className="w-full max-w-md bg-card rounded-2xl border border-border p-5 shadow-2xl relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs border border-cyan-500/30">
              🎣
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-foreground">{currentUserName}</span>
              <span className="text-xs text-muted-foreground">used</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold text-xs border border-cyan-800">
                ::fish
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-card border border-border p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold text-foreground">Virtual Fisher</span>
                <span className="bg-primary text-black text-[9px] font-extrabold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5 stroke-[3]" /> APP
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">Level {fisherStats.level}</span>
            </div>

            <div className="space-y-1 py-1">
              <p className="text-xs font-semibold text-foreground/90">
                <strong>{currentUserName}</strong>
              </p>
              <p className="text-base font-extrabold text-emerald-400 flex items-center gap-2">
                You caught:
              </p>
              <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-1">
                <div className="text-lg font-black text-foreground flex items-center gap-2">
                  <span>{fisherStats.lastCatch.amount}</span>
                  <span className="text-2xl">{fisherStats.lastCatch.icon}</span>
                  <span>{fisherStats.lastCatch.type}</span>
                </div>
                <div className="text-xs font-bold text-emerald-400">
                  +{fisherStats.lastCatch.xp} XP
                </div>
                <div className="text-[11px] text-muted-foreground italic">
                  Global boost by <strong className="text-amber-400">{fisherStats.lastCatch.boostBy}</strong>!
                </div>
              </div>
            </div>

            {fisherCooldown > 0 && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-center justify-between">
                <span>Tunggu <strong>{fisherCooldown}s</strong> sebelum memancing lagi</span>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 pt-2">
              <Button
                onClick={handleFishAction}
                disabled={fisherCooldown > 0}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-1.5 shadow-md cursor-pointer"
              >
                <Fish className="w-3.5 h-3.5" />
                Fish Again
              </Button>
              <Button
                onClick={handleSellFish}
                variant="outline"
                className="border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs gap-1 cursor-pointer"
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                Sell
              </Button>
              <Button
                variant="ghost"
                onClick={() => toast.info(`Tas Ikan: ${fisherStats.fishCount} Ikan, Koin: ${fisherStats.coins}`)}
                className="text-muted-foreground hover:text-white text-xs cursor-pointer"
              >
                Inventory
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className={cn('w-full md:w-80 border-t md:border-t-0 md:border-l border-border bg-card py-4 flex flex-col gap-3 shrink-0', CHANNEL_HORIZONTAL_PADDING)}>
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-400" /> Server Catch Log
          </span>
          <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
            <Coins className="w-3.5 h-3.5" /> {fisherStats.coins}
          </span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 [scrollbar-width:thin]">
          {fisherFeed.map((item) => (
            <div key={item.id} className="p-2 rounded-lg bg-muted/40 border border-border text-xs">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                <span className="font-bold text-foreground">{item.userName}</span>
                <span>{item.timestamp}</span>
              </div>
              <span className="text-foreground/90">{item.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
