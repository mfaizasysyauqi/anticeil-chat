import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import { toast } from 'sonner';

export function WordleGame() {
  const [wordleTarget] = useState('REACT');
  const [wordleGuesses, setWordleGuesses] = useState<string[]>(['VOICE', 'CLEAN']);
  const [wordleCurrentInput, setWordleCurrentInput] = useState('');

  const handleKirimWordle = () => {
    if (wordleCurrentInput.length === 5) {
      setWordleGuesses((prev) => [...prev, wordleCurrentInput]);
      const guessed = wordleCurrentInput;
      setWordleCurrentInput('');
      if (guessed === wordleTarget) {
        toast.success('🎉 SELAMAT! Anda dan tim berhasil menebak kata Wordle!');
      }
    }
  };

  return (
    <div className={cn('h-full min-h-0 flex flex-col items-center justify-center py-4 bg-background overflow-y-auto select-none', CHANNEL_HORIZONTAL_PADDING)}>
      <div className="w-full max-w-sm flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black tracking-widest text-foreground">W O R D L E</span>
          <span className="bg-primary text-black text-[9px] font-extrabold px-1.5 py-0.2 rounded">
            ✓ APP
          </span>
        </div>
        <span className="text-xs text-muted-foreground">Tebak 5 huruf tersembunyi bersama rekan tim</span>

        {/* Wordle Rows */}
        <div className="grid grid-rows-6 gap-2 w-full max-w-[280px]">
          {Array.from({ length: 6 }).map((_, rowIdx) => {
            const guess = wordleGuesses[rowIdx] || '';
            return (
              <div key={rowIdx} className="grid grid-cols-5 gap-2">
                {Array.from({ length: 5 }).map((_, colIdx) => {
                  const char = guess[colIdx] || '';
                  let tileStyle = 'bg-card border-border text-foreground';
                  if (guess) {
                    if (wordleTarget[colIdx] === char) {
                      tileStyle = 'bg-emerald-600 border-emerald-500 text-white';
                    } else if (wordleTarget.includes(char)) {
                      tileStyle = 'bg-amber-600 border-amber-500 text-white';
                    } else {
                      tileStyle = 'bg-muted border-border text-muted-foreground';
                    }
                  }
                  return (
                    <div
                      key={colIdx}
                      className={cn(
                        'aspect-square rounded-lg border-2 flex items-center justify-center text-xl font-black uppercase transition-all',
                        tileStyle,
                      )}
                    >
                      {char}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Quick Input for Wordle */}
        <div className="w-full max-w-[280px] flex gap-2">
          <input
            type="text"
            maxLength={5}
            value={wordleCurrentInput}
            onChange={(e) => setWordleCurrentInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleKirimWordle();
              }
            }}
            placeholder="TEBAK KATA (5 HURUF)"
            className="flex-1 bg-muted/60 border border-border rounded-lg px-3 py-2 text-center font-bold tracking-widest text-sm text-foreground focus:outline-none focus:border-emerald-500"
          />
          <Button
            size="sm"
            onClick={handleKirimWordle}
            className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs cursor-pointer"
          >
            Kirim
          </Button>
        </div>
      </div>
    </div>
  );
}
