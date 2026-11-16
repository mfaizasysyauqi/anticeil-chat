import { Chess } from 'chess.js';

export const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

export function evaluateBoard(chess: Chess): number {
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
}

export function chooseBotMove(
  game: Chess,
  difficulty: 'easy' | 'medium' | 'hard'
) {
  const possibleMoves = game.moves({ verbose: true });
  if (possibleMoves.length === 0) return null;

  if (difficulty === 'easy') {
    return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
  }

  let bestEval = Infinity;
  let selectedMove = possibleMoves[0];
  for (const move of possibleMoves) {
    const testGame = new Chess(game.fen());
    testGame.move(move);
    const score = evaluateBoard(testGame);
    if (score < bestEval) {
      bestEval = score;
      selectedMove = move;
    }
  }
  return selectedMove;
}
