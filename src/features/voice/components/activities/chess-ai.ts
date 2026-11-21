import { Chess } from 'chess.js';

export const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Center squares bonus (d4, d5, e4, e5)
const CENTER_SQUARES = new Set(['d4', 'd5', 'e4', 'e5', 'c4', 'c5', 'f4', 'f5']);

export function evaluateBoard(chess: Chess): number {
  if (chess.isCheckmate()) {
    // If it's checkmate, who is checkmated? The one whose turn it is.
    return chess.turn() === 'w' ? -99999 : 99999;
  }
  if (chess.isDraw()) {
    return 0;
  }

  let totalScore = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        let val = PIECE_VALUES[piece.type] || 0;

        // Position bonus for center control
        const file = String.fromCharCode(97 + c);
        const rank = (8 - r).toString();
        const sq = file + rank;
        if (CENTER_SQUARES.has(sq)) {
          val += 15;
        }

        totalScore += piece.color === 'w' ? val : -val;
      }
    }
  }

  return totalScore;
}

export function chooseBotMove(
  game: Chess,
  difficulty: 'easy' | 'medium' | 'hard'
) {
  const possibleMoves = game.moves({ verbose: true });
  if (possibleMoves.length === 0) return null;

  const botColor = game.turn(); // 'w' or 'b'
  const isWhite = botColor === 'w';

  // Easy: 70% random, 30% tactical capture/checkmate
  if (difficulty === 'easy') {
    if (Math.random() < 0.7) {
      return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    }
  }

  // Medium: 1-ply search with immediate checkmate detection
  if (difficulty === 'easy' || difficulty === 'medium') {
    let bestScore = isWhite ? -Infinity : Infinity;
    let candidates = [possibleMoves[0]];

    for (const move of possibleMoves) {
      const testGame = new Chess(game.fen());
      testGame.move(move);

      if (testGame.isCheckmate()) {
        return move; // Win immediately
      }

      const score = evaluateBoard(testGame);
      if (isWhite ? score > bestScore : score < bestScore) {
        bestScore = score;
        candidates = [move];
      } else if (score === bestScore) {
        candidates.push(move);
      }
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // Hard: 2-ply minimax evaluation (bot move + opponent's best response)
  let bestScore = isWhite ? -Infinity : Infinity;
  let candidates = [possibleMoves[0]];

  for (const move of possibleMoves) {
    const testGame = new Chess(game.fen());
    testGame.move(move);

    if (testGame.isCheckmate()) {
      return move; // Win immediately
    }

    const opponentMoves = testGame.moves({ verbose: true });
    let opponentBestScore = isWhite ? Infinity : -Infinity;

    if (opponentMoves.length === 0) {
      // Opponent has no moves (stalemate or checkmate)
      opponentBestScore = evaluateBoard(testGame);
    } else {
      for (const opMove of opponentMoves) {
        const opGame = new Chess(testGame.fen());
        opGame.move(opMove);

        const score = evaluateBoard(opGame);
        if (isWhite ? score < opponentBestScore : score > opponentBestScore) {
          opponentBestScore = score;
        }
      }
    }

    if (isWhite ? opponentBestScore > bestScore : opponentBestScore < bestScore) {
      bestScore = opponentBestScore;
      candidates = [move];
    } else if (opponentBestScore === bestScore) {
      candidates.push(move);
    }
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}
