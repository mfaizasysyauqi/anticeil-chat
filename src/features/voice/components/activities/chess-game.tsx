import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { Chess, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import confetti from 'canvas-confetti';
import { ChessSidebarPanel, type PlayerSeat } from './chess-sidebar-panel';
import { chooseBotMove } from './chess-ai';
import {
  RotateCcw,
  Bot,
  Users,
  RefreshCw,
  Flag,
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

export function ChessGame({
  channel,
  socket,
  currentUserName,
  currentUser,
}: ChessGameProps) {
  const [game, setGame] = useState(() => new Chess());
  const [gameFen, setGameFen] = useState(game.fen());
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [gameMode, setGameMode] = useState<'pvp' | 'vs-bot'>('vs-bot');
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  // Click-to-Move Selection State
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

  // Kursi Pemain Multiplayer
  const [whitePlayer, setWhitePlayer] = useState<PlayerSeat | null>(null);
  const [blackPlayer, setBlackPlayer] = useState<PlayerSeat | null>(null);
  const [isFreePlay, setIsFreePlay] = useState(true);

  // Mobile / compact UI toggle for history
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  const myId = currentUser?.id || currentUserName || 'local-player';
  const myName = currentUserName || currentUser?.firstName || 'Pemain';

  const moveHistoryEndRef = useRef<HTMLDivElement>(null);
  const boardWrapperRef = useRef<HTMLDivElement>(null);
  const [boardDimension, setBoardDimension] = useState<number>(400);

  // Responsively scale board so it fits 100% within available width AND height without any overflow
  useEffect(() => {
    const el = boardWrapperRef.current;
    if (!el) return;

    const updateDimension = () => {
      const rect = el.getBoundingClientRect();
      const availableSize = Math.floor(Math.min(rect.width, rect.height) - 4);
      if (availableSize > 100) {
        setBoardDimension(availableSize);
      }
    };

    updateDimension();
    const ro = new ResizeObserver(updateDimension);
    ro.observe(el);
    window.addEventListener('resize', updateDimension);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateDimension);
    };
  }, []);

  // Auto scroll history notation
  useEffect(() => {
    moveHistoryEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [moveHistory]);

  // Sinkronisasi realtime jika mode pvp di voice channel
  useEffect(() => {
    if (!socket) return;

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
          setSelectedSquare(null);

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
          setSelectedSquare(null);
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
        setSelectedSquare(null);
        toast.info('Papan catur telah direset.');
      } else if (data.action === 'CHESS_UNDO' && data.payload?.fen) {
        try {
          const undoGame = new Chess(data.payload.fen);
          setGame(undoGame);
          setGameFen(data.payload.fen);
          setMoveHistory(Array.isArray(data.payload.history) ? data.payload.history : undoGame.history());
          setSelectedSquare(null);
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

  // Bot color determination: bot plays the opposite color of user's orientation in vs-bot mode
  const botColor = orientation === 'white' ? 'b' : 'w';
  const playerColor = orientation === 'white' ? 'w' : 'b';

  // Bot move generator
  const makeBotMove = useCallback(() => {
    if (game.isGameOver() || game.turn() !== botColor) return;

    setIsBotThinking(true);
    const timer = setTimeout(() => {
      try {
        const selectedMove = chooseBotMove(game, botDifficulty);
        if (!selectedMove) {
          setIsBotThinking(false);
          return;
        }

        const gameCopy = new Chess(game.fen());
        const res = gameCopy.move(selectedMove);
        if (res) {
          setGame(gameCopy);
          setGameFen(gameCopy.fen());
          setMoveHistory(gameCopy.history());
          setSelectedSquare(null);

          if (gameCopy.isCheckmate()) {
            toast.error('Skakmat! Bot memenangkan permainan.');
          } else if (gameCopy.isDraw()) {
            toast.info('Permainan berakhir remis.');
          }
        }
      } catch (err) {
        console.error('Error during bot move calculation:', err);
      } finally {
        setIsBotThinking(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [game, botDifficulty, botColor]);

  // Trigger bot move saat giliran bot
  useEffect(() => {
    if (gameMode === 'vs-bot' && game.turn() === botColor && !game.isGameOver()) {
      const cleanup = makeBotMove();
      return cleanup;
    }
  }, [game, gameMode, botColor, makeBotMove]);

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
        setSelectedSquare(null);

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

  // Click-to-Move Handler
  const onSelectOrMoveSquare = useCallback(
    (square: Square) => {
      if (isBotThinking || game.isGameOver()) return;

      // Di mode vs-bot, user hanya boleh melangkah saat gilirannya
      if (gameMode === 'vs-bot' && game.turn() === botColor) return;

      // Di mode PvP dengan kursi terkunci
      if (gameMode === 'pvp' && !isFreePlay) {
        if (game.turn() === 'w' && whitePlayer && whitePlayer.id !== myId) return;
        if (game.turn() === 'b' && blackPlayer && blackPlayer.id !== myId) return;
      }

      const pieceOnSquare = game.get(square);

      // Jika belum ada bidak yang dipilih
      if (!selectedSquare) {
        if (pieceOnSquare && pieceOnSquare.color === game.turn()) {
          // Di vs-bot, pastikan hanya memilih bidak milik pemain
          if (gameMode === 'vs-bot' && pieceOnSquare.color !== playerColor) return;
          setSelectedSquare(square);
        }
        return;
      }

      // Jika mengklik square yang sama -> batalkan pilihan
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      // Jika mengklik bidak lain dengan warna yang sama -> ganti pilihan
      if (pieceOnSquare && pieceOnSquare.color === game.turn()) {
        setSelectedSquare(square);
        return;
      }

      // Cek apakah square yang diklik merupakan langkah valid
      const validMoves = game.moves({ square: selectedSquare, verbose: true });
      const isValid = validMoves.some((m) => m.to === square);

      if (isValid) {
        makeAMove({
          from: selectedSquare,
          to: square,
          promotion: 'q',
        });
      }

      setSelectedSquare(null);
    },
    [
      isBotThinking,
      game,
      gameMode,
      botColor,
      playerColor,
      isFreePlay,
      whitePlayer,
      blackPlayer,
      myId,
      selectedSquare,
      makeAMove,
    ],
  );

  // Square and Piece Click events from react-chessboard
  const handleSquareClick = useCallback(
    (args: any) => {
      const sq = (typeof args === 'string' ? args : args?.square) as Square;
      if (sq) onSelectOrMoveSquare(sq);
    },
    [onSelectOrMoveSquare],
  );

  const handlePieceClick = useCallback(
    (args: any) => {
      const sq = (typeof args === 'string' ? args : args?.square) as Square;
      if (sq) onSelectOrMoveSquare(sq);
    },
    [onSelectOrMoveSquare],
  );

  // Drag-and-drop piece permission
  const canDragPiece = useCallback(
    (args: any) => {
      if (isBotThinking || game.isGameOver()) return false;

      let pieceCode = '';
      if (typeof args === 'string') {
        pieceCode = args;
      } else if (args?.piece) {
        pieceCode = typeof args.piece === 'string' ? args.piece : args.piece.pieceType || '';
      } else if (args?.pieceType) {
        pieceCode = args.pieceType;
      }

      const pieceColor = pieceCode[0]?.toLowerCase() === 'w' ? 'w' : 'b';

      // Giliran harus sesuai
      if (pieceColor !== game.turn()) return false;

      // Di mode vs-bot, user hanya boleh menggerakkan bidaknya sendiri
      if (gameMode === 'vs-bot' && pieceColor !== playerColor) return false;

      // Di mode PvP, jika kursi terkunci
      if (gameMode === 'pvp' && !isFreePlay) {
        if (pieceColor === 'w' && whitePlayer && whitePlayer.id !== myId) return false;
        if (pieceColor === 'b' && blackPlayer && blackPlayer.id !== myId) return false;
      }

      return true;
    },
    [game, isBotThinking, gameMode, playerColor, isFreePlay, whitePlayer, blackPlayer, myId],
  );

  // Drop Handler (resilient to both positional and object arguments)
  const onDrop = (arg1: any, arg2?: any) => {
    if (isBotThinking) return false;

    const sourceSquare = (typeof arg1 === 'string' ? arg1 : arg1?.sourceSquare) as Square;
    const targetSquare = (typeof arg2 === 'string' ? arg2 : arg1?.targetSquare) as Square;

    if (!sourceSquare || !targetSquare) return false;
    if (gameMode === 'vs-bot' && game.turn() === botColor) return false;

    const success = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });

    if (success) {
      setSelectedSquare(null);
      return true;
    }
    return false;
  };

  // Highlighting selected square & legal move dots
  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    if (selectedSquare) {
      styles[selectedSquare] = {
        backgroundColor: 'rgba(245, 158, 11, 0.45)',
        boxShadow: 'inset 0 0 0 2px #f59e0b',
      };

      const validMoves = game.moves({ square: selectedSquare, verbose: true });
      for (const m of validMoves) {
        const isTargetOccupied = !!game.get(m.to as Square);
        styles[m.to] = {
          background: isTargetOccupied
            ? 'radial-gradient(circle, rgba(239, 68, 68, 0.65) 80%, transparent 80%)'
            : 'radial-gradient(circle, rgba(255, 255, 255, 0.5) 24%, transparent 24%)',
          borderRadius: '50%',
          cursor: 'pointer',
        };
      }
    }

    return styles;
  }, [selectedSquare, game]);

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setGameFen(newGame.fen());
    setMoveHistory([]);
    setSelectedSquare(null);
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
    setSelectedSquare(null);
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
      if (gameMode === 'vs-bot') return `Bot AI (${botDifficulty.toUpperCase()})`;
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
    <div className="h-full w-full flex flex-col xl:flex-row items-center justify-center p-2 sm:p-4 gap-2 sm:gap-4 lg:gap-6 bg-zinc-950 text-foreground overflow-hidden select-none rounded-none border-0">
      {/* ── BOARD COLUMN (Scales responsively on Mobile, Tablet & Desktop) ── */}
      <div className="flex flex-col items-center justify-center h-full max-h-full flex-1 min-h-0 min-w-0 max-w-full xl:max-w-[min(580px,calc(100vh-80px))] py-1">
        {/* Top Player Info Bar */}
        <div
          style={{ width: boardDimension, maxWidth: '100%' }}
          className="flex items-center justify-between py-1 px-2.5 mb-1.5 rounded-lg bg-zinc-900/95 border border-zinc-800 text-[11px] sm:text-xs shrink-0 shadow-xs transition-all"
        >
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

        {/* The Chessboard Flex Wrapper: takes remaining height and centers square perfectly */}
        <div ref={boardWrapperRef} className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden">
          <div
            style={{ width: boardDimension, height: boardDimension }}
            className="rounded-xl overflow-hidden shadow-2xl border-2 sm:border-4 border-zinc-800 bg-zinc-900 shrink-0 flex items-center justify-center transition-all"
          >
            <Chessboard
              options={{
                position: gameFen,
                onPieceDrop: onDrop,
                onSquareClick: handleSquareClick,
                onPieceClick: handlePieceClick,
                canDragPiece,
                squareStyles,
                boardOrientation: orientation,
                darkSquareStyle: { backgroundColor: '#2e3846' },
                lightSquareStyle: { backgroundColor: '#475569' },
                boardStyle: {
                  borderRadius: '8px',
                  width: `${boardDimension}px`,
                  height: `${boardDimension}px`,
                  touchAction: 'none',
                },
              }}
            />
          </div>
        </div>

        {/* Bottom Player Info Bar */}
        <div
          style={{ width: boardDimension, maxWidth: '100%' }}
          className="flex items-center justify-between py-1 px-2.5 mt-1.5 rounded-lg bg-zinc-900/95 border border-zinc-800 text-[11px] sm:text-xs shrink-0 shadow-xs transition-all"
        >
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
        <div
          style={{ width: boardDimension, maxWidth: '100%' }}
          className="xl:hidden flex flex-col gap-1.5 mt-2 pt-1.5 border-t border-zinc-800/80 shrink-0 transition-all"
        >
          {/* Row 1: Mode Switcher & Bot Difficulty on Mobile/Tablet */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1 bg-zinc-950/80 p-0.5 rounded-lg border border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setGameMode('vs-bot');
                  toast.info('Mode Lawan Bot AI aktif');
                }}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer',
                  gameMode === 'vs-bot'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-zinc-400 hover:text-white',
                )}
              >
                <Bot className="size-3" />
                <span>Lawan Bot</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setGameMode('pvp');
                  toast.info('Mode PvP Online aktif');
                  socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
                    channelId: channel.id,
                    action: 'CHESS_MODE_CHANGE',
                    payload: { mode: 'pvp' },
                  });
                }}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer',
                  gameMode === 'pvp'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-zinc-400 hover:text-white',
                )}
              >
                <Users className="size-3" />
                <span>PvP</span>
              </button>
            </div>

            {gameMode === 'vs-bot' && (
              <div className="flex items-center gap-0.5 bg-zinc-950/80 p-0.5 rounded-lg border border-zinc-800">
                {(['easy', 'medium', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setBotDifficulty(diff)}
                    className={cn(
                      'px-1.5 py-0.5 text-[10px] font-medium rounded transition-all cursor-pointer',
                      botDifficulty === diff
                        ? 'bg-zinc-800 text-white font-bold'
                        : 'text-zinc-500 hover:text-zinc-300',
                    )}
                  >
                    {diff === 'easy' ? 'Mudah' : diff === 'medium' ? 'Sedang' : 'Sulit'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Row 2: Status & Quick Control Buttons */}
          <div className="flex items-center justify-between gap-1">
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
                className="h-7 px-2 text-[11px] bg-zinc-900 border-zinc-700 hover:bg-zinc-800 cursor-pointer"
              >
                <RefreshCw className="size-3 mr-1" />
                Putar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={undoMove}
                disabled={isGameOver || moveHistory.length === 0 || isBotThinking}
                className="h-7 px-2 text-[11px] bg-zinc-900 border-zinc-700 hover:bg-zinc-800 cursor-pointer"
              >
                <Flag className="size-3 mr-1" />
                Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetGame}
                className="h-7 px-2 text-[11px] bg-zinc-900 border-zinc-700 hover:bg-zinc-800 cursor-pointer"
              >
                <RotateCcw className="size-3 mr-1" />
                Reset
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsHistoryExpanded((prev) => !prev)}
                className="h-7 px-1.5 text-zinc-400 hover:text-white cursor-pointer"
              >
                {isHistoryExpanded ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile / Tablet Collapsible Move History */}
        {isHistoryExpanded && (
          <div className="xl:hidden w-full max-h-24 overflow-y-auto bg-zinc-900/90 border border-zinc-800 rounded-lg p-2 mt-1 text-[11px] font-mono custom-scrollbar">
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

      <ChessSidebarPanel
        isCheckmate={isCheckmate}
        isDraw={isDraw}
        isCheck={isCheck}
        turn={turn}
        gameMode={gameMode}
        setGameMode={setGameMode}
        socket={socket}
        channelId={channel.id}
        isFreePlay={isFreePlay}
        setIsFreePlay={setIsFreePlay}
        whitePlayer={whitePlayer}
        blackPlayer={blackPlayer}
        myId={myId}
        claimSeat={claimSeat}
        botDifficulty={botDifficulty}
        setBotDifficulty={setBotDifficulty}
        moveHistory={moveHistory}
        moveHistoryEndRef={moveHistoryEndRef}
        resetGame={resetGame}
        setOrientation={setOrientation}
        undoMove={undoMove}
        isGameOver={isGameOver}
        isBotThinking={isBotThinking}
      />
    </div>
  );
}
