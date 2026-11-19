import React from 'react';
import { Socket } from 'socket.io-client';
import {
  RotateCcw,
  Bot,
  Users,
  Trophy,
  RefreshCw,
  Flag,
  UserCheck,
  ListOrdered,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface PlayerSeat {
  id: string;
  name: string;
  avatar?: string | null;
}

export interface ChessSidebarPanelProps {
  isCheckmate: boolean;
  isDraw: boolean;
  isCheck: boolean;
  turn: string;
  gameMode: 'pvp' | 'vs-bot';
  setGameMode: (m: 'pvp' | 'vs-bot') => void;
  socket: Socket | null;
  channelId: string;
  isFreePlay: boolean;
  setIsFreePlay: (v: boolean | ((prev: boolean) => boolean)) => void;
  whitePlayer: PlayerSeat | null;
  blackPlayer: PlayerSeat | null;
  myId: string;
  claimSeat: (role: 'white' | 'black') => void;
  botDifficulty: 'easy' | 'medium' | 'hard';
  setBotDifficulty: (d: 'easy' | 'medium' | 'hard') => void;
  moveHistory: string[] | readonly string[];
  moveHistoryEndRef: React.RefObject<HTMLDivElement | null>;
  resetGame: () => void;
  setOrientation: React.Dispatch<React.SetStateAction<'white' | 'black'>>;
  undoMove: () => void;
  isGameOver: boolean;
  isBotThinking: boolean;
}

export function ChessSidebarPanel({
  isCheckmate,
  isDraw,
  isCheck,
  turn,
  gameMode,
  setGameMode,
  socket,
  channelId,
  isFreePlay,
  setIsFreePlay,
  whitePlayer,
  blackPlayer,
  myId,
  claimSeat,
  botDifficulty,
  setBotDifficulty,
  moveHistory,
  moveHistoryEndRef,
  resetGame,
  setOrientation,
  undoMove,
  isGameOver,
  isBotThinking,
}: ChessSidebarPanelProps) {
  return (
    <div className="hidden xl:flex w-76 2xl:w-84 flex-col gap-3 rounded-xl bg-zinc-900/90 border border-zinc-800 p-3.5 shrink-0 max-h-[min(540px,calc(100vh-40px))] overflow-y-auto custom-scrollbar">
      {/* Title & Live Status */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Trophy className="size-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight text-white">Anticeil Chess</h3>
            <p className="text-[10px] text-zinc-400">Multiplayer Voice Activity</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'text-[10px] uppercase font-bold',
            isCheckmate
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              : isCheck
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          )}
        >
          {isCheckmate
            ? 'Skakmat!'
            : isDraw
            ? 'Remis'
            : isCheck
            ? `Skak! (${turn})`
            : `Giliran: ${turn}`}
        </Badge>
      </div>

      {/* Mode Selector (PvP Realtime vs Local Bot) */}
      <div className="space-y-1">
        <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
          Mode Permainan
        </label>
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-950/70 rounded-lg border border-zinc-800">
          <button
            onClick={() => {
              setGameMode('pvp');
              socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
                channelId,
                action: 'CHESS_MODE_CHANGE',
                payload: { mode: 'pvp' },
              });
            }}
            className={cn(
              'flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer',
              gameMode === 'pvp'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60',
            )}
          >
            <Users className="size-3.5" />
            <span>PvP Online</span>
          </button>
          <button
            onClick={() => {
              setGameMode('vs-bot');
              setOrientation('white');
              socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
                channelId,
                action: 'CHESS_MODE_CHANGE',
                payload: { mode: 'vs-bot' },
              });
            }}
            className={cn(
              'flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer',
              gameMode === 'vs-bot'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60',
            )}
          >
            <Bot className="size-3.5" />
            <span>Lawan Bot</span>
          </button>
        </div>
      </div>

      {/* PvP Player Seat Selection */}
      {gameMode === 'pvp' && (
        <div className="space-y-2 p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <UserCheck className="size-3" />
              Kursi Pemain
            </span>
            <button
              onClick={() => {
                const next = !isFreePlay;
                setIsFreePlay(next);
                socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
                  channelId,
                  action: 'CHESS_TOGGLE_FREEPLAY',
                  payload: { isFreePlay: next },
                });
              }}
              className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
            >
              {isFreePlay ? 'Bebas (Siapa Saja)' : 'Terkunci'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => claimSeat('white')}
              className={cn(
                'h-7 text-[11px] gap-1 justify-start px-2 cursor-pointer',
                whitePlayer?.id === myId
                  ? 'border-primary text-primary bg-primary/10'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300',
              )}
            >
              <span className="size-2 rounded-full bg-white border border-zinc-300 shrink-0" />
              <span className="truncate">{whitePlayer ? whitePlayer.name : 'Ambil Putih'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => claimSeat('black')}
              className={cn(
                'h-7 text-[11px] gap-1 justify-start px-2 cursor-pointer',
                blackPlayer?.id === myId
                  ? 'border-primary text-primary bg-primary/10'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300',
              )}
            >
              <span className="size-2 rounded-full bg-zinc-800 border border-zinc-600 shrink-0" />
              <span className="truncate">{blackPlayer ? blackPlayer.name : 'Ambil Hitam'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Bot Difficulty Selector if vs-bot */}
      {gameMode === 'vs-bot' && (
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
            Tingkat Kesulitan Bot
          </label>
          <div className="grid grid-cols-3 gap-1">
            {(['easy', 'medium', 'hard'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => setBotDifficulty(diff)}
                className={cn(
                  'py-1 text-[11px] font-bold rounded capitalize border transition-all cursor-pointer',
                  botDifficulty === diff
                    ? 'bg-zinc-800 text-white border-zinc-600'
                    : 'bg-zinc-950 text-zinc-500 border-zinc-800/80 hover:text-zinc-300',
                )}
              >
                {diff === 'easy' ? 'Mudah' : diff === 'medium' ? 'Sedang' : 'Sulit'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Move History Notation */}
      <div className="space-y-1 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <ListOrdered className="size-3" />
            Riwayat Langkah
          </span>
          <span className="font-mono">{moveHistory.length} langkah</span>
        </div>
        <div className="h-28 2xl:h-36 overflow-y-auto bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-2 text-xs font-mono custom-scrollbar">
          {moveHistory.length === 0 ? (
            <span className="text-zinc-600 italic">Belum ada langkah...</span>
          ) : (
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              {moveHistory.map((mv, idx) => {
                if (idx % 2 === 0) {
                  const stepNum = Math.floor(idx / 2) + 1;
                  const nextMv = moveHistory[idx + 1] || '';
                  return (
                    <div key={idx} className="flex gap-1.5 text-zinc-300">
                      <span className="text-zinc-500 w-4">{stepNum}.</span>
                      <span className="font-semibold text-white">{mv}</span>
                      {nextMv && <span className="text-zinc-400">{nextMv}</span>}
                    </div>
                  );
                }
                return null;
              })}
              <div ref={moveHistoryEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-zinc-800/80">
        <Button
          variant="outline"
          size="sm"
          onClick={resetGame}
          className="text-xs gap-1 h-8 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 cursor-pointer"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOrientation((prev) => (prev === 'white' ? 'black' : 'white'))}
          className="text-xs gap-1 h-8 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 cursor-pointer"
        >
          <RefreshCw className="size-3.5" />
          Putar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={undoMove}
          disabled={isGameOver || moveHistory.length === 0 || isBotThinking}
          className="text-xs gap-1 h-8 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 cursor-pointer"
        >
          <Flag className="size-3.5" />
          Undo
        </Button>
      </div>
    </div>
  );
}
