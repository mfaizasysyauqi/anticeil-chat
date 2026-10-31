import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { Chess, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import confetti from 'canvas-confetti';
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
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ColonyChannel } from '@/chat/chat-types';

export interface ChessGameProps {
  channel: ColonyChannel;
  socket: Socket | null;
  currentUserName?: string;
  currentUser?: any;
  participants?: any[];
}

interface PlayerSeat {
  id: string;
  name: string;
  avatar?: string | null;
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

export function ChessGame({
  channel,
  socket,
  currentUserName,
  currentUser,
}: ChessGameProps) {
  const [game, setGame] = useState(() => new Chess());
  const [gameFen, setGameFen] = useState(game.fen());
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [gameMode, setGameMode] = useState<'pvp' | 'vs-bot'>('pvp');
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  // Kursi Pemain Multiplayer
  const [whitePlayer, setWhitePlayer] = useState<PlayerSeat | null>(null);
  const [blackPlayer, setBlackPlayer] = useState<PlayerSeat | null>(null);
  const [isFreePlay, setIsFreePlay] = useState(true);

  // Mobile / compact UI toggle for history
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  const myId = currentUser?.id || currentUserName || 'local-player';
  const myName = currentUserName || currentUser?.firstName || 'Pemain';

  const moveHistoryEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll history notation
  useEffect(() => {
    moveHistoryEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [moveHistory]);

  // Sinkronisasi realtime jika mode pvp di voice channel
  useEffect(() => {
    if (!socket) return;

    // 1. Query state terbaru saat bergabung ke aktivitas
    socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId: channel.id,
      action: 'CHESS_QUERY_STATE',
      payload: {},
    });

    const handleRemoteActivityEvent = (data: { action: string; payload?: any; fromSocketId?: string }) => {
      if (!data) return;

      if (data.action === 'CHESS_MOVE' && data.payload?.fen) {
        try {
          const newGame = new Chess(data.payload.fen);
          setGame(newGame);
          setGameFen(data.payload.fen);
          setMoveHistory(Array.isArray(data.payload.history) ? data.payload.history : newGame.history());

          if (data.payload.playerName && data.payload.playerName !== currentUserName) {
            toast.info(`${data.payload.playerName} telah melangkah.`);
          }

          if (newGame.isCheckmate()) {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            toast.success(`🎉 Skakmat! Permainan selesai.`);
          }
        } catch (err) {
          console.error('Failed to parse remote chess move', err);
        }
      } else if (data.action === 'CHESS_SYNC_STATE' && data.payload?.fen) {
        try {
          const syncGame = new Chess(data.payload.fen);
          setGame(syncGame);
          setGameFen(data.payload.fen);
          if (Array.isArray(data.payload.history)) {
            setMoveHistory(data.payload.history);
          }
          if (data.payload.whitePlayer !== undefined) setWhitePlayer(data.payload.whitePlayer);
          if (data.payload.blackPlayer !== undefined) setBlackPlayer(data.payload.blackPlayer);
        } catch (err) {
          console.error('Failed to sync remote chess state', err);
        }
      } else if (data.action === 'CHESS_RESET') {
        const resetGame = new Chess();
        setGame(resetGame);
        setGameFen(resetGame.fen());
        setMoveHistory([]);
        toast.info('Papan catur telah direset.');
      } else if (data.action === 'CHESS_UNDO' && data.payload?.fen) {
        try {
          const undoGame = new Chess(data.payload.fen);
          setGame(undoGame);
          setGameFen(data.payload.fen);
          setMoveHistory(Array.isArray(data.payload.history) ? data.payload.history : undoGame.history());
          toast.info('Langkah terakhir dibatalkan.');
        } catch (err) {
          console.error('Failed to undo remote chess move', err);
        }
      } else if (data.action === 'CHESS_CLAIM_ROLE') {
        if (data.payload?.role === 'white') {
          setWhitePlayer(data.payload.player || null);
          if (data.payload.player?.name) {
            toast.info(`${data.payload.player.name} mengambil bidak Putih`);
          }
        } else if (data.payload?.role === 'black') {
          setBlackPlayer(data.payload.player || null);
          if (data.payload.player?.name) {
            toast.info(`${data.payload.player.name} mengambil bidak Hitam`);
          }
        }
      } else if (data.action === 'CHESS_MODE_CHANGE' && data.payload?.mode) {
        setGameMode(data.payload.mode);
      } else if (data.action === 'CHESS_QUERY_STATE') {
        // Peer request current state: if we already have moves, answer back with current state
        if (game.history().length > 0) {
          socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
            channelId: channel.id,
            action: 'CHESS_SYNC_STATE',
            payload: {
              fen: game.fen(),
              history: game.history(),
              turn: game.turn(),
              whitePlayer,
              blackPlayer,
            },
          });
        }
      }
    };

    socket.on('COMMUNITY_CALL_ACTIVITY_EVENT', handleRemoteActivityEvent);
    return () => {
      socket.off('COMMUNITY_CALL_ACTIVITY_EVENT', handleRemoteActivityEvent);
    };
  }, [socket, channel.id, currentUserName, game, whitePlayer, blackPlayer]);

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
        selectedMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      } else {
        let bestEval = Infinity;
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
        const newHistory = gameCopy.history();
        setMoveHistory(newHistory);

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
              history: newHistory,
              playerName: myName,
              turn: gameCopy.turn(),
            },
          });
        }

        return true;
      } catch {
        return false;
      }
    },
    [game, gameMode, socket, channel.id, myName],
  );

  const canDragPiece = useCallback(
    ({ piece }: { piece: { pieceType: string } }) => {
      if (isBotThinking) return false;
      const pieceColor = piece.pieceType?.[0] === 'w' ? 'w' : 'b';

      // Giliran harus sesuai
      if (pieceColor !== game.turn()) return false;

      // Di mode vs-bot, user hanya boleh gerakkan putih
      if (gameMode === 'vs-bot' && pieceColor === 'b') return false;

      // Di mode PvP, jika kursi terkunci dan bukan free play
      if (gameMode === 'pvp' && !isFreePlay) {
        if (pieceColor === 'w' && whitePlayer && whitePlayer.id !== myId) return false;
        if (pieceColor === 'b' && blackPlayer && blackPlayer.id !== myId) return false;
      }

      return true;
    },
    [game, isBotThinking, gameMode, isFreePlay, whitePlayer, blackPlayer, myId],
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
    if (gameMode === 'vs-bot') {
      gameCopy.undo();
      gameCopy.undo();
    } else {
      gameCopy.undo();
    }
    setGame(gameCopy);
    setGameFen(gameCopy.fen());
    const updatedHistory = gameCopy.history();
    setMoveHistory(updatedHistory);

    if (gameMode === 'pvp') {
      socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
        channelId: channel.id,
        action: 'CHESS_UNDO',
        payload: {
          fen: gameCopy.fen(),
          history: updatedHistory,
        },
      });
    }
  };

  const claimSeat = (role: 'white' | 'black') => {
    const player: PlayerSeat = {
      id: myId,
      name: myName,
      avatar: currentUser?.imageUrl || null,
    };

    if (role === 'white') {
      setWhitePlayer(player);
      setOrientation('white');
    } else {
      setBlackPlayer(player);
      setOrientation('black');
    }

    if (gameMode === 'pvp') {
      socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
        channelId: channel.id,
        action: 'CHESS_CLAIM_ROLE',
        payload: { role, player },
      });
    }
    toast.success(`Anda bermain sebagai ${role === 'white' ? 'Putih' : 'Hitam'}`);
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

  const topPlayerLabel = useMemo(() => {
    if (orientation === 'white') {
      if (gameMode === 'vs-bot') return `Bot AI (${botDifficulty.toUpperCase()})`;
      return blackPlayer?.name ? `${blackPlayer.name} (Hitam)` : 'Hitam (Menunggu)';
    } else {
      if (gameMode === 'vs-bot') return 'Anda (Hitam)';
      return whitePlayer?.name ? `${whitePlayer.name} (Putih)` : 'Putih (Menunggu)';
    }
  }, [orientation, gameMode, botDifficulty, blackPlayer, whitePlayer]);

  const bottomPlayerLabel = useMemo(() => {
    if (orientation === 'white') {
      return whitePlayer?.name ? `${whitePlayer.name} (Putih)` : `${myName} (Putih)`;
    } else {
      return blackPlayer?.name ? `${blackPlayer.name} (Hitam)` : `${myName} (Hitam)`;
    }
  }, [orientation, whitePlayer, blackPlayer, myName]);

  return (
    <div className="h-full w-full flex flex-col xl:flex-row items-center justify-center p-2 sm:p-4 gap-2 sm:gap-4 lg:gap-6 bg-zinc-950 text-foreground overflow-hidden select-none">
      {/* ── BOARD COLUMN (Scales responsively on Mobile, Tablet & Desktop) ── */}
      <div className="flex flex-col items-center justify-center h-full max-h-full w-full max-w-[min(100%,calc(100vh-140px),440px)] xl:max-w-[min(520px,calc(100vh-60px))] shrink min-h-0">
        {/* Top Player Info Bar */}
        <div className="w-full flex items-center justify-between py-1 px-2.5 mb-1.5 rounded-lg bg-zinc-900/95 border border-zinc-800 text-[11px] sm:text-xs shrink-0 shadow-xs">
          <div className="flex items-center gap-1.5 truncate">
            <span
              className={cn(
                'size-2.5 sm:size-3 rounded-full shrink-0 border',
                orientation === 'white'
                  ? 'bg-zinc-800 border-zinc-600'
                  : 'bg-white border-zinc-300',
              )}
            />
            <span className="font-semibold text-zinc-200 truncate">{topPlayerLabel}</span>
            {isBotThinking && (
              <span className="text-[10px] text-amber-400 animate-pulse font-mono shrink-0">
                [berpikir...]
              </span>
            )}
          </div>
          <div className="flex gap-0.5 text-xs font-mono text-zinc-400 shrink-0">
            {orientation === 'white'
              ? capturedPieces.whiteLost.slice(0, 8).map((p, i) => <span key={i}>{p}</span>)
              : capturedPieces.blackLost.slice(0, 8).map((p, i) => <span key={i}>{p}</span>)}
          </div>
        </div>

        {/* The Chessboard Container (strictly contained to aspect-square and max viewport height) */}
        <div className="w-full aspect-square max-h-[min(calc(100vh-220px),calc(100vw-24px),440px)] xl:max-h-[min(480px,calc(100vh-130px))] rounded-xl overflow-hidden shadow-2xl border-2 sm:border-4 border-zinc-800 bg-zinc-900 shrink min-h-0 flex items-center justify-center">
          <Chessboard
            options={{
              position: gameFen,
              onPieceDrop: onDrop,
              canDragPiece,
              boardOrientation: orientation,
              darkSquareStyle: { backgroundColor: '#2e3846' },
              lightSquareStyle: { backgroundColor: '#475569' },
              boardStyle: {
                borderRadius: '8px',
                width: '100%',
                height: '100%',
              },
            }}
          />
        </div>

        {/* Bottom Player Info Bar */}
        <div className="w-full flex items-center justify-between py-1 px-2.5 mt-1.5 rounded-lg bg-zinc-900/95 border border-zinc-800 text-[11px] sm:text-xs shrink-0 shadow-xs">
          <div className="flex items-center gap-1.5 truncate">
            <span
              className={cn(
                'size-2.5 sm:size-3 rounded-full shrink-0 border',
                orientation === 'white'
                  ? 'bg-white border-zinc-300'
                  : 'bg-zinc-800 border-zinc-600',
              )}
            />
            <span className="font-semibold text-white truncate">{bottomPlayerLabel}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex gap-0.5 text-xs font-mono text-zinc-400">
              {orientation === 'white'
                ? capturedPieces.blackLost.slice(0, 8).map((p, i) => <span key={i}>{p}</span>)
                : capturedPieces.whiteLost.slice(0, 8).map((p, i) => <span key={i}>{p}</span>)}
            </div>
          </div>
        </div>

        {/* Mobile / Tablet Quick Control Ribbon */}
        <div className="xl:hidden w-full flex items-center justify-between gap-1 mt-1.5 pt-1 border-t border-zinc-800/60 shrink-0">
          <div className="flex items-center gap-1">
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] px-1.5 py-0 font-bold',
                isCheckmate
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  : isCheck
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              )}
            >
              {isCheckmate ? 'Skakmat' : isCheck ? `Skak! (${turn})` : `Giliran: ${turn}`}
            </Badge>
            <span className="text-[10px] text-zinc-400 font-mono">
              {moveHistory.length} langkah
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOrientation((prev) => (prev === 'white' ? 'black' : 'white'))}
              className="h-7 px-2 text-[11px] bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
            >
              <RefreshCw className="size-3 mr-1" />
              Putar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={undoMove}
              disabled={isGameOver || moveHistory.length === 0 || isBotThinking}
              className="h-7 px-2 text-[11px] bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
            >
              <Flag className="size-3 mr-1" />
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetGame}
              className="h-7 px-2 text-[11px] bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
            >
              <RotateCcw className="size-3 mr-1" />
              Reset
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsHistoryExpanded((prev) => !prev)}
              className="h-7 px-1.5 text-zinc-400 hover:text-white"
            >
              {isHistoryExpanded ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile / Tablet Collapsible Move History */}
        {isHistoryExpanded && (
          <div className="xl:hidden w-full max-h-24 overflow-y-auto bg-zinc-900/90 border border-zinc-800 rounded-lg p-2 mt-1 text-[11px] font-mono [scrollbar-width:thin]">
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
              {moveHistory.map((mv, idx) => {
                if (idx % 2 === 0) {
                  const stepNum = Math.floor(idx / 2) + 1;
                  const nextMv = moveHistory[idx + 1] || '';
                  return (
                    <div key={idx} className="flex gap-1 text-zinc-300">
                      <span className="text-zinc-500 w-4">{stepNum}.</span>
                      <span className="font-semibold text-white">{mv}</span>
                      {nextMv && <span className="text-zinc-400">{nextMv}</span>}
                    </div>
                  );
                }
                return null;
              })}
            </div>
            <div ref={moveHistoryEndRef} />
          </div>
        )}
      </div>

      {/* ── DESKTOP CONTROL PANEL / SIDEBAR (Responsive, zero scrollbar on high res) ── */}
      <div className="hidden xl:flex w-76 2xl:w-84 flex-col gap-3 rounded-xl bg-zinc-900/90 border border-zinc-800 p-3.5 shrink-0 max-h-[min(540px,calc(100vh-40px))] overflow-y-auto [scrollbar-width:thin]">
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
                  channelId: channel.id,
                  action: 'CHESS_MODE_CHANGE',
                  payload: { mode: 'pvp' },
                });
              }}
              className={cn(
                'flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer',
                gameMode === 'pvp'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-zinc-400 hover:text-white',
              )}
            >
              <Users className="size-3.5" />
              Realtime PvP
            </button>
            <button
              onClick={() => {
                setGameMode('vs-bot');
                socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
                  channelId: channel.id,
                  action: 'CHESS_MODE_CHANGE',
                  payload: { mode: 'vs-bot' },
                });
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
          </div>
        </div>

        {/* Seat / Role Claim in PvP */}
        {gameMode === 'pvp' && (
          <div className="space-y-1.5 p-2 rounded-lg bg-zinc-950/50 border border-zinc-800/80">
            <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-400 uppercase">
              <span>Kursi Pemain</span>
              <button
                onClick={() => setIsFreePlay((prev) => !prev)}
                className="text-primary hover:underline cursor-pointer"
              >
                {isFreePlay ? 'Mode Bebas Aktif' : 'Terkunci'}
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
          <div className="h-28 2xl:h-36 overflow-y-auto bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-2 text-xs font-mono [scrollbar-width:thin]">
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
    </div>
  );
}
