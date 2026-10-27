import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import { toast } from 'sonner';

export function MagicGarden() {
  const [gardenPlots, setGardenPlots] = useState([
    { id: 1, name: 'Luminescent Pumpkin', icon: '🎃', progress: 100, ready: true },
    { id: 2, name: 'Star Fruit', icon: '⭐', progress: 65, ready: false },
    { id: 3, name: 'Mystic Berry', icon: '🍓', progress: 40, ready: false },
    { id: 4, name: 'Golden Wheat', icon: '🌾', progress: 90, ready: false },
    { id: 5, name: 'Nightshade Orchid', icon: '🌸', progress: 10, ready: false },
    { id: 6, name: 'Sun Sunflower', icon: '🌻', progress: 100, ready: true },
  ]);
  const [gardenScore, setGardenScore] = useState(420);

  return (
    <div className={cn('h-full min-h-0 flex flex-col items-center justify-center py-4 bg-background overflow-y-auto select-none', CHANNEL_HORIZONTAL_PADDING)}>
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl p-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground">Magic Garden Server</span>
            <span className="bg-primary text-black text-[9px] font-extrabold px-1.5 py-0.2 rounded">
              ✓ APP
            </span>
          </div>
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Skor Kebun: {gardenScore} XP
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {gardenPlots.map((plot) => (
            <div
              key={plot.id}
              className="p-4 rounded-xl bg-card border border-border flex flex-col items-center justify-center gap-2 text-center group hover:border-amber-500/40 transition-all"
            >
              <div className="text-3xl animate-bounce-short">{plot.icon}</div>
              <span className="text-xs font-bold text-foreground">{plot.name}</span>
              <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/5">
                <div
                  className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all"
                  style={{ width: `${plot.progress}%` }}
                />
              </div>
              <Button
                size="sm"
                onClick={() => {
                  if (plot.ready) {
                    setGardenScore((prev) => prev + 50);
                    setGardenPlots((prev) =>
                      prev.map((p) => (p.id === plot.id ? { ...p, progress: 15, ready: false } : p)),
                    );
                    toast.success(`Panen ${plot.name}! +50 XP Kebun`);
                  } else {
                    setGardenPlots((prev) =>
                      prev.map((p) =>
                        p.id === plot.id
                          ? { ...p, progress: Math.min(100, p.progress + 30), ready: p.progress + 30 >= 100 }
                          : p,
                      ),
                    );
                    toast.info(`Menyiram ${plot.name}! Tanaman tumbuh.`);
                  }
                }}
                className={cn(
                  'w-full h-7 text-xs font-semibold cursor-pointer',
                  plot.ready
                    ? 'bg-amber-500 hover:bg-amber-600 text-black'
                    : 'bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30',
                )}
              >
                {plot.ready ? '🌾 Panen' : '💧 Siram'}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
