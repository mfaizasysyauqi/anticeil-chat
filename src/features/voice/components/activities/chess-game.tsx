import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Socket } from 'socket.io-client';
import { Chess, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Bot,
  Users,
  Trophy,
  Swords,
  RefreshCw,
  Flag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CommunityChannel } from '@/chat/chat-types';

export interface ChessGameProps {
  channel: CommunityChannel;
  socket: Socket | null;
  currentUserName?: string;
}

// Evaluasi nilai bidak untuk AI bot sederhana
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

export function ChessGame({ channel, socket, currentUserName }: ChessGameProps) {
  const [game, setGame] = useState(() => new Chess());
  const [gameFen, setGameFen] = useState(game.fen());
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [gameMode, setGameMode] = useState<'vs-bot' | 'pvp'>('vs-bot');
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  // Sinkronisasi realtime jika mode pvp di voice channel
  useEffect(() => {
    if (!socket) return;
    const handleRemoteActivityEvent = (data: { action: string; payload?: any }) => {
      if (data.action === 'CHESS_MOVE' && data.payload?.fen) {
        const newGame = new Chess(data.payload.fen);
        setGame(newGame);
        setGameFen(data.payload.fen);
        setMoveHistory(newGame.history());
        if (data.payload.playerName && data.payload.playerName !== currentUserName) {
          toast.info(`${data.payload.playerName} telah melangkah.`);
        }
      } else if (data.action === 'CHESS_RESET') {
        const resetGame = new Chess();
        setGame(resetGame);
        setGameFen(resetGame.fen());
        setMoveHistory([]);
        toast.info('Papan catur telah direset.');
      }
    };

    socket.on('COMMUNITY_CALL_ACTIVITY_EVENT', handleRemoteActivityEvent);
    return () => {
      socket.off('COMMUNITY_CALL_ACTIVITY_EVENT', handleRemoteActivityEvent);
    };
  }, [socket, currentUserName]);

  // Status game
  const isCheckmate = game.isCheckmate();
  const isDraw = game.isDraw();
  const isCheck = game.isCheck();
  const isGameOver = game.isGameOver();
  const turn = game.turn() === 'w' ? 'Putih' : 'Hitam';

  // AI evaluation sederhana untuk Bot
  const evaluateBoard = useCallback((chess: Chess) => {
    let totalScore = 0;
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          const val = PIECE_VALUES[piece.type] || 0;
          // White positif, Black negatif
          totalScore += piece.color === 'w' ? val : -val;
        }
      }
    }
    return totalScore;
  }, []);

  // Bot move generator
  const makeBotMove = useCallback(() => {
    if (game.isGameOver() || game.turn() !== 'b') return;

    setIsBotThinking(true);
    setTimeout(() => {
      const possibleMoves = game.moves({ verbose: true });
      if (possibleMoves.length === 0) {
        setIsBotThinking(false);
        return;
      }

      let selectedMove = possibleMoves[0];

      if (botDifficulty === 'easy') {
        // Acak
        selectedMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      } else {
        // Minimax kedalaman 1-2
        let bestEval = Infinity; // Black meminimalkan skor
        for (const move of possibleMoves) {
          const testGame = new Chess(game.fen());
          testGame.move(move);
          const score = evaluateBoard(testGame);
          if (score < bestEval) {
            bestEval = score;
            selectedMove = move;
          }
        }
      }

      const gameCopy = new Chess(game.fen());
      const res = gameCopy.move(selectedMove);
      if (res) {
        setGame(gameCopy);
        setGameFen(gameCopy.fen());
        setMoveHistory(gameCopy.history());

        if (gameCopy.isCheckmate()) {
          toast.error('Skakmat! Bot memenangkan permainan.');
        }
      }
      setIsBotThinking(false);
    }, 400);
  }, [game, botDifficulty, evaluateBoard]);

  // Trigger bot move jika gilirannya
  useEffect(() => {
    if (gameMode === 'vs-bot' && game.turn() === 'b' && !game.isGameOver()) {
      makeBotMove();
    }
  }, [game, gameMode, makeBotMove]);

  // Melangkah
  const makeAMove = useCallback(
    (move: { from: Square; to: Square; promotion?: string }) => {
      try {
        const gameCopy = new Chess(game.fen());
        const result = gameCopy.move(move);

        if (!result) return false;

        setGame(gameCopy);
        setGameFen(gameCopy.fen());
        setMoveHistory(gameCopy.history());

        if (gameCopy.isCheckmate()) {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
          toast.success('🎉 Skakmat! Anda menang!');
        }

        if (gameMode === 'pvp') {
          socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
            channelId: channel.id,
            action: 'CHESS_MOVE',
            payload: {
              fen: gameCopy.fen(),
              move,
              playerName: currentUserName || 'Pemain',
            },
          });
        }

        return true;
      } catch {
        return false;
      }
    },
    [game, gameMode, socket, channel.id, currentUserName],
  );

  const onDrop = ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) => {
    if (!targetSquare) return false;
    if (isBotThinking) return false;
    if (gameMode === 'vs-bot' && game.turn() === 'b') return false;

    const move = makeAMove({
      from: sourceSquare as Square,
      to: targetSquare as Square,
      promotion: 'q',
    });

    return !!move;
  };

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setGameFen(newGame.fen());
    setMoveHistory([]);
    if (gameMode === 'pvp') {
      socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
        channelId: channel.id,
        action: 'CHESS_RESET',
        payload: {},
      });
    }
    toast.success('Papan catur diatur ulang.');
  };

  const undoMove = () => {
    const gameCopy = new Chess(game.fen());
    // Jika vs bot, undo 2 langkah (langkah bot + langkah player)
    if (gameMode === 'vs-bot') {
      gameCopy.undo();
      gameCopy.undo();
    } else {
      gameCopy.undo();
    }
    setGame(gameCopy);
    setGameFen(gameCopy.fen());
    setMoveHistory(gameCopy.history());
  };

  // Menghitung bidak yang tertangkap
  const capturedPieces = useMemo(() => {
    const initialCounts: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const currentCountsWhite: Record<string, number> = { p: 0, n: 0, b: 0, r: 0, q: 0 };
    const currentCountsBlack: Record<string, number> = { p: 0, n: 0, b: 0, r: 0, q: 0 };

    game.board().forEach((row) => {
      row.forEach((piece) => {
        if (piece && piece.type !== 'k') {
          if (piece.color === 'w') {
            currentCountsWhite[piece.type] = (currentCountsWhite[piece.type] || 0) + 1;
          } else {
            currentCountsBlack[piece.type] = (currentCountsBlack[piece.type] || 0) + 1;
          }
        }
      });
    });

    const whiteLost: string[] = [];
    const blackLost: string[] = [];

    Object.keys(initialCounts).forEach((type) => {
      const lostW = initialCounts[type] - (currentCountsWhite[type] || 0);
      const lostB = initialCounts[type] - (currentCountsBlack[type] || 0);
      for (let i = 0; i < lostW; i++) whiteLost.push(type.toUpperCase());
      for (let i = 0; i < lostB; i++) blackLost.push(type);
    });

    return { whiteLost, blackLost };
  }, [game]);

  return (
    <div className="h-full w-full flex flex-col lg:flex-row items-center justify-center p-3 lg:p-6 gap-4 lg:gap-8 bg-zinc-950 text-foreground overflow-y-auto select-none">
      {/* Board Area */}
      <div className="flex flex-col items-center justify-center max-w-[520px] w-full shrink-0">
        {/* Top Player Info */}
        <div className="w-full flex items-center justify-between py-1.5 px-3 mb-2 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-zinc-400 border border-zinc-200" />
            <span className="font-semibold text-zinc-200">
              {orientation === 'white'
                ? gameMode === 'vs-bot'
                  ? `Bot AI (${botDifficulty.toUpperCase()})`
                  : 'Hitam'
                : 'Putih'}
            </span>
            {isBotThinking && (
              <span className="text-[10px] text-amber-400 animate-pulse font-mono">
                [Sedang berpikir...]
              </span>
            )}
          </div>
          <div className="flex gap-1 text-sm font-mono text-zinc-400">
            {orientation === 'white'
              ? capturedPieces.whiteLost.map((p, i) => <span key={i}>{p}</span>)
              : capturedPieces.blackLost.map((p, i) => <span key={i}>{p}</span>)}
          </div>
        </div>

        {/* The Chessboard */}
        <div className="w-full aspect-square rounded-xl overflow-hidden shadow-2xl border-4 border-zinc-800 bg-zinc-900">
          <Chessboard
            options={{
              position: gameFen,
              onPieceDrop: onDrop,
              boardOrientation: orientation,
              darkSquareStyle: { backgroundColor: '#2e3846' },
              lightSquareStyle: { backgroundColor: '#475569' },
              boardStyle: {
                borderRadius: '8px',
              },
            }}
          />
        </div>

        {/* Bottom Player Info */}
        <div className="w-full flex items-center justify-between py-1.5 px-3 mt-2 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-white border border-zinc-400" />
            <span className="font-semibold text-white">
              {orientation === 'white' ? currentUserName || 'Anda (Putih)' : 'Hitam'}
            </span>
          </div>
          <div className="flex gap-1 text-sm font-mono text-zinc-400">
            {orientation === 'white'
              ? capturedPieces.blackLost.map((p, i) => <span key={i}>{p}</span>)
              : capturedPieces.whiteLost.map((p, i) => <span key={i}>{p}</span>)}
          </div>
        </div>
      </div>

      {/* Control Panel / Sidebar */}
      <div className="w-full max-w-[340px] flex flex-col gap-3 rounded-xl bg-zinc-900/80 border border-zinc-800 p-4">
        {/* Title */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy className="size-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white">Anticeil Chess</h3>
              <p className="text-[10px] text-zinc-400">Activity Game Catur Realtime</p>
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

        {/* Mode Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Mode Permainan
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-950/60 rounded-lg border border-zinc-800">
            <button
              onClick={() => {
                setGameMode('vs-bot');
                resetGame();
              }}
              className={cn(
                'flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer',
                gameMode === 'vs-bot'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-zinc-400 hover:text-white',
              )}
            >
              <Bot className="size-3.5" />
              Lawan Bot
            </button>
            <button
              onClick={() => {
                setGameMode('pvp');
                resetGame();
              }}
              className={cn(
                'flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer',
                gameMode === 'pvp'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-zinc-400 hover:text-white',
              )}
            >
              <Users className="size-3.5" />
              Voice PvP
            </button>
          </div>
        </div>

        {/* Bot Difficulty Selector if vs-bot */}
        {gameMode === 'vs-bot' && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
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
        <div className="space-y-1.5 flex-1 min-h-0">
          <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            <span>Riwayat Gerakan</span>
            <span>{moveHistory.length} langkah</span>
          </div>
          <div className="h-28 overflow-y-auto bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-2 text-xs font-mono [scrollbar-width:thin]">
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
                        <span className="text-zinc-500 w-5">{stepNum}.</span>
                        <span className="font-semibold text-white">{mv}</span>
                        {nextMv && <span className="text-zinc-400">{nextMv}</span>}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={resetGame}
            className="text-xs gap-1 h-8 bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOrientation((prev) => (prev === 'white' ? 'black' : 'white'))}
            className="text-xs gap-1 h-8 bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
          >
            <RefreshCw className="size-3.5" />
            Putar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={undoMove}
            disabled={isGameOver || moveHistory.length === 0 || isBotThinking}
            className="text-xs gap-1 h-8 bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
          >
            <Flag className="size-3.5" />
            Undo
          </Button>
        </div>
      </div>
    </div>
  );
}
