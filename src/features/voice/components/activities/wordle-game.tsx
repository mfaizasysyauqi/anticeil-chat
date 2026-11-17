import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Socket } from 'socket.io-client';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Sparkles,
  Trophy,
  Users,
  CheckCircle,
  HelpCircle,
  Delete,
  CornerDownLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { ColonyChannel } from '@/chat/chat-types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface WordleGameProps {
  channel: ColonyChannel;
  socket: Socket | null;
  currentUserName?: string;
  currentUser?: any;
  participants?: any[];
}

const WORD_BANK = [
  'REACT', 'CLOUD', 'VOICE', 'STAGE', 'POWER', 'LIGHT', 'GAMES',
  'MUSIC', 'BRAIN', 'CYBER', 'ROBOT', 'SPACE', 'CHESS', 'AUDIO',
  'PIXEL', 'TOKEN', 'MAGIC', 'SHARP', 'DREAM', 'SMART', 'ALPHA',
];

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
];

export interface WordleRowData {
  word: string;
  guesserName: string;
  guesserAvatar?: string | null;
}

export function WordleGame({
  channel,
  socket,
  currentUserName = 'Pemain',
  currentUser,
  participants = [],
}: WordleGameProps) {
  const [targetWord, setTargetWord] = useState(() => {
    return WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
  });

  const [guesses, setGuesses] = useState<WordleRowData[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [streak, setStreak] = useState(0);

  const myId = currentUser?.id || currentUserName || 'user-1';
  const myName = currentUserName || currentUser?.firstName || 'Pemain';

  // Sinkronisasi status game antar peserta di Voice Channel
  useEffect(() => {
    if (!socket) return;

    const handleSocketWordleEvent = (data: {
      channelId?: string;
      action: string;
      payload?: any;
    }) => {
      if (!data || data.channelId !== channel.id) return;

      if (data.action === 'WORDLE_SYNC') {
        const { target, guesses: syncGuesses, status, newStreak } = data.payload || {};
        if (target) setTargetWord(target);
        if (Array.isArray(syncGuesses)) setGuesses(syncGuesses);
        if (status) setGameStatus(status);
        if (typeof newStreak === 'number') setStreak(newStreak);
      } else if (data.action === 'WORDLE_GUESS') {
        const { guess, guesserName, guesserAvatar, isWin, isLose } = data.payload || {};
        if (guess) {
          setGuesses((prev) => [...prev, { word: guess, guesserName, guesserAvatar }]);
          setCurrentInput('');
          if (isWin) {
            setGameStatus('won');
            setStreak((s) => s + 1);
            confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
            toast.success(`🎉 ${guesserName} menebak kata ${guess} dengan benar!`);
          } else if (isLose) {
            setGameStatus('lost');
            toast.error(`Kesempatan habis! Kata yang benar adalah ${data.payload.targetWord || 'TARGET'}`);
          }
        }
      } else if (data.action === 'WORDLE_RESTART') {
        const { newWord } = data.payload || {};
        if (newWord) setTargetWord(newWord);
        setGuesses([]);
        setCurrentInput('');
        setGameStatus('playing');
        toast.info('Ronde Wordle baru dimulai!');
      }
    };

    socket.on('COMMUNITY_CALL_ACTIVITY_EVENT', handleSocketWordleEvent);

    return () => {
      socket.off('COMMUNITY_CALL_ACTIVITY_EVENT', handleSocketWordleEvent);
    };
  }, [socket, channel.id]);

  // Evaluasi status huruf untuk sebuah tebakan
  const getLetterStatus = useCallback((letter: string, index: number, word: string) => {
    if (!targetWord) return 'absent';
    if (targetWord[index] === letter) return 'correct';
    if (targetWord.includes(letter)) return 'present';
    return 'absent';
  }, [targetWord]);

  // Status tombol keyboard (hijau / kuning / abu-abu)
  const keyboardStatuses = useMemo(() => {
    const statuses: Record<string, 'correct' | 'present' | 'absent'> = {};
    guesses.forEach(({ word }) => {
      for (let i = 0; i < word.length; i++) {
        const letter = word[i];
        const status = getLetterStatus(letter, i, word);
        if (status === 'correct') {
          statuses[letter] = 'correct';
        } else if (status === 'present' && statuses[letter] !== 'correct') {
          statuses[letter] = 'present';
        } else if (!statuses[letter]) {
          statuses[letter] = 'absent';
        }
      }
    });
    return statuses;
  }, [guesses, getLetterStatus]);

  const handleKeyClick = (key: string) => {
    if (gameStatus !== 'playing') return;

    if (key === 'BACKSPACE') {
      setCurrentInput((prev) => prev.slice(0, -1));
    } else if (key === 'ENTER') {
      submitGuess();
    } else if (currentInput.length < 5 && /^[A-Z]$/.test(key)) {
      setCurrentInput((prev) => prev + key);
    }
  };

  const submitGuess = () => {
    if (currentInput.length !== 5) {
      toast.warning('Kata harus terdiri dari 5 huruf!');
      return;
    }

    const guess = currentInput.toUpperCase();
    const isWin = guess === targetWord;
    const isLose = !isWin && guesses.length + 1 >= 6;

    const newGuesses = [...guesses, { word: guess, guesserName: myName, guesserAvatar: currentUser?.imageUrl }];
    setGuesses(newGuesses);
    setCurrentInput('');

    if (isWin) {
      setGameStatus('won');
      setStreak((s) => s + 1);
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      toast.success('Luar biasa! Tebakan tim tepat!');
    } else if (isLose) {
      setGameStatus('lost');
      toast.error(`Ronde selesai! Kata yang benar adalah: ${targetWord}`);
    }

    // Broadcast ke rekan di voice channel
    socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId: channel.id,
      action: 'WORDLE_GUESS',
      payload: {
        guess,
        guesserName: myName,
        guesserAvatar: currentUser?.imageUrl,
        isWin,
        isLose,
        targetWord: isLose ? targetWord : undefined,
      },
    });
  };

  const handleRestart = () => {
    const nextWord = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
    setTargetWord(nextWord);
    setGuesses([]);
    setCurrentInput('');
    setGameStatus('playing');

    socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId: channel.id,
      action: 'WORDLE_RESTART',
      payload: { newWord: nextWord },
    });
  };

  // Dengarkan input keyboard fisik
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Backspace') {
        handleKeyClick('BACKSPACE');
      } else if (e.key === 'Enter') {
        handleKeyClick('ENTER');
      } else {
        const upper = e.key.toUpperCase();
        if (/^[A-Z]$/.test(upper)) {
          handleKeyClick(upper);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="w-full h-full flex flex-col bg-background text-foreground select-none overflow-y-auto p-4 sm:p-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">Wordle Daily Party</h2>
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                CO-OP VOICE
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Tebak kata 5 huruf harian bersama kawan di saluran #{channel.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold">
              <Trophy className="w-3.5 h-3.5" />
              <span>Streak: {streak}</span>
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleRestart}
            className="h-8 gap-1.5 text-xs border-border/80 hover:bg-muted cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ronde Baru</span>
          </Button>
        </div>
      </div>

      {/* Main Board Container */}
      <div className="flex-1 flex flex-col items-center justify-center my-4 min-h-[340px]">
        {/* 6 Rows Grid */}
        <div className="flex flex-col gap-1.5 w-full max-w-[340px]">
          {Array.from({ length: 6 }).map((_, rowIndex) => {
            const isCompletedRow = rowIndex < guesses.length;
            const isCurrentRow = rowIndex === guesses.length;
            const rowData = isCompletedRow ? guesses[rowIndex] : null;

            return (
              <div key={rowIndex} className="flex items-center gap-2">
                <div className="grid grid-cols-5 gap-1.5 flex-1">
                  {Array.from({ length: 5 }).map((_, colIndex) => {
                    let char = '';
                    let statusClass = 'border-border/70 bg-card/60 text-foreground';

                    if (isCompletedRow && rowData) {
                      char = rowData.word[colIndex] || '';
                      const status = getLetterStatus(char, colIndex, rowData.word);
                      if (status === 'correct') {
                        statusClass = 'border-emerald-600 bg-emerald-600 text-white font-black shadow-xs';
                      } else if (status === 'present') {
                        statusClass = 'border-amber-500 bg-amber-500 text-white font-black shadow-xs';
                      } else {
                        statusClass = 'border-zinc-700 bg-zinc-800/80 text-zinc-300 font-bold';
                      }
                    } else if (isCurrentRow) {
                      char = currentInput[colIndex] || '';
                      if (char) {
                        statusClass = 'border-primary ring-2 ring-primary/40 bg-card text-foreground font-bold scale-105';
                      }
                    }

                    return (
                      <div
                        key={colIndex}
                        className={cn(
                          'aspect-square flex items-center justify-center text-lg sm:text-xl font-bold uppercase rounded-lg border transition-all duration-200 select-none',
                          statusClass
                        )}
                      >
                        {char}
                      </div>
                    );
                  })}
                </div>

                {/* Guesser Avatar indicator */}
                <div className="w-6 flex items-center justify-center">
                  {rowData ? (
                    <CommunityAvatar
                      name={rowData.guesserName}
                      imageUrl={rowData.guesserAvatar}
                      size={20}
                      showStatus={false}
                      tooltipText={`Ditebak oleh: ${rowData.guesserName}`}
                      className="ring-1 ring-border shrink-0"
                    />
                  ) : isCurrentRow ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Win / Loss Notice Banner */}
        {gameStatus === 'won' && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center gap-2.5 text-xs sm:text-sm font-bold animate-in fade-in zoom-in-95">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Selamat! Tim berhasil memecahkan kata dalam {guesses.length} tebakan!</span>
          </div>
        )}
        {gameStatus === 'lost' && (
          <div className="mt-4 p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive flex items-center gap-2.5 text-xs sm:text-sm font-bold animate-in fade-in zoom-in-95">
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>Kesempatan habis! Kata yang tepat adalah: <strong className="underline tracking-widest">{targetWord}</strong></span>
          </div>
        )}
      </div>

      {/* Virtual On-screen Keyboard */}
      <div className="w-full max-w-[500px] mx-auto flex flex-col gap-1.5 pb-2 shrink-0">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1 sm:gap-1.5">
            {row.map((key) => {
              const status = keyboardStatuses[key];
              let keyBg = 'bg-card hover:bg-muted text-foreground border-border/80';

              if (status === 'correct') {
                keyBg = 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700';
              } else if (status === 'present') {
                keyBg = 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600';
              } else if (status === 'absent') {
                keyBg = 'bg-zinc-800 text-zinc-400 border-zinc-750 opacity-60';
              }

              const isWide = key === 'ENTER' || key === 'BACKSPACE';

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeyClick(key)}
                  className={cn(
                    'h-11 sm:h-12 rounded-lg border text-xs sm:text-sm font-bold transition-all active:scale-95 flex items-center justify-center cursor-pointer select-none shadow-2xs',
                    isWide ? 'px-2.5 sm:px-3 text-[11px] sm:text-xs min-w-[50px] sm:min-w-[65px]' : 'w-8 sm:w-10',
                    keyBg
                  )}
                >
                  {key === 'BACKSPACE' ? (
                    <Delete className="w-4 h-4" />
                  ) : key === 'ENTER' ? (
                    <span className="flex items-center gap-0.5">
                      <CornerDownLeft className="w-3 h-3" /> ENTER
                    </span>
                  ) : (
                    key
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
