export type CellValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | null;
export type Board = CellValue[][];
export type Difficulty = 'easy' | 'medium' | 'hard';

const EMPTY: CellValue = null;

/** Check if placing `num` at (row, col) is valid on the given board. */
export function isValid(board: Board, row: number, col: number, num: number): boolean {
  // Check row
  if (board[row].includes(num as CellValue)) return false;

  // Check column
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) return false;
  }

  // Check 3×3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }

  return true;
}

/** Deep-clone a board. */
function cloneBoard(board: Board): Board {
  return board.map(row => [...row]);
}

/** Solve the board in-place using backtracking. Returns true if solved. */
export function solve(board: Board): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === EMPTY) {
        const nums = shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of nums) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num as CellValue;
            if (solve(board)) return true;
            board[row][col] = EMPTY;
          }
        }
        return false;
      }
    }
  }
  return true;
}

/** Count solutions (up to `limit`) for early exit. */
function countSolutions(board: Board, limit = 2): number {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === EMPTY) {
        let count = 0;
        for (let num = 1; num <= 9; num++) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num as CellValue;
            count += countSolutions(board, limit - count);
            board[row][col] = EMPTY;
            if (count >= limit) return count;
          }
        }
        return count;
      }
    }
  }
  return 1;
}

/** Shuffle an array in-place using Fisher-Yates and return it. */
function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Generate a fully-solved, valid board. */
function generateSolvedBoard(): Board {
  const board: Board = Array.from({ length: 9 }, () => Array(9).fill(EMPTY));
  solve(board);
  return board;
}

/** Number of cells to remove per difficulty. */
const CLUES: Record<Difficulty, number> = {
  easy: 36,
  medium: 27,
  hard: 22,
};

/**
 * Generate a puzzle with a unique solution.
 * Returns { puzzle, solution }.
 */
export function generatePuzzle(difficulty: Difficulty = 'medium'): {
  puzzle: Board;
  solution: Board;
} {
  const solution = generateSolvedBoard();
  const puzzle = cloneBoard(solution);

  const clues = CLUES[difficulty];
  const toRemove = 81 - clues;
  const positions = shuffled(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9] as [number, number])
  );

  let removed = 0;
  for (const [r, c] of positions) {
    if (removed >= toRemove) break;
    const backup = puzzle[r][c];
    puzzle[r][c] = EMPTY;

    const test = cloneBoard(puzzle);
    if (countSolutions(test, 2) === 1) {
      removed++;
    } else {
      puzzle[r][c] = backup;
    }
  }

  return { puzzle, solution };
}

/** Check if all filled-in cells are correct compared to the solution. */
export function checkBoard(puzzle: Board, solution: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (puzzle[r][c] !== null && puzzle[r][c] !== solution[r][c]) {
        return false;
      }
    }
  }
  return true;
}

/** Check if the board is completely and correctly filled. */
export function isSolved(puzzle: Board, solution: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (puzzle[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}
