export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master'

export type SudokuBoard = number[]

export interface SudokuPuzzle {
  difficulty: Difficulty
  puzzle: SudokuBoard
  solution: SudokuBoard
  clues: number
}

interface DifficultyProfile {
  targetClues: number
}

const BOARD_SIZE = 9
const CELL_COUNT = BOARD_SIZE * BOARD_SIZE
const BOX_SIZE = 3

const DIFFICULTY_PROFILES: Record<Difficulty, DifficultyProfile> = {
  easy: { targetClues: 40 },
  medium: { targetClues: 34 },
  hard: { targetClues: 30 },
  expert: { targetClues: 27 },
  master: { targetClues: 24 }
}

// Returns a random integer in the range [0, maxExclusive).
function randomInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive)
}

// Returns a shuffled copy of the provided values.
function shuffled(values: number[]): number[] {
  const copy = [...values]

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1)
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }

  return copy
}

// Converts a flat index into its row number.
function indexToRow(index: number): number {
  return Math.floor(index / BOARD_SIZE)
}

// Converts a flat index into its column number.
function indexToCol(index: number): number {
  return index % BOARD_SIZE
}

// Checks whether a value can be placed in a cell under Sudoku rules.
function canPlace(board: SudokuBoard, index: number, value: number): boolean {
  const row = indexToRow(index)
  const col = indexToCol(index)

  for (let c = 0; c < BOARD_SIZE; c += 1) {
    if (board[row * BOARD_SIZE + c] === value) {
      return false
    }
  }

  for (let r = 0; r < BOARD_SIZE; r += 1) {
    if (board[r * BOARD_SIZE + col] === value) {
      return false
    }
  }

  const boxRowStart = Math.floor(row / BOX_SIZE) * BOX_SIZE
  const boxColStart = Math.floor(col / BOX_SIZE) * BOX_SIZE

  for (let r = boxRowStart; r < boxRowStart + BOX_SIZE; r += 1) {
    for (let c = boxColStart; c < boxColStart + BOX_SIZE; c += 1) {
      if (board[r * BOARD_SIZE + c] === value) {
        return false
      }
    }
  }

  return true
}

// Calculates all valid candidate values for an empty cell.
function getCandidates(board: SudokuBoard, index: number): number[] {
  if (board[index] !== 0) {
    return []
  }

  const candidates: number[] = []

  for (let value = 1; value <= BOARD_SIZE; value += 1) {
    if (canPlace(board, index, value)) {
      candidates.push(value)
    }
  }

  return candidates
}

// Finds the next empty cell with the fewest legal candidates (MRV heuristic).
function findBestEmptyCell(board: SudokuBoard): { index: number; candidates: number[] } | null {
  let bestIndex = -1
  let bestCandidates: number[] | null = null

  for (let index = 0; index < CELL_COUNT; index += 1) {
    // Skip filled cell(s)
    if (board[index] !== 0) {
      continue
    }

    const candidates = getCandidates(board, index)

    if (candidates.length === 0) {
      return { index, candidates }
    }

    // update best candidates if this cell has fewer candidates than the current best
    if (!bestCandidates || candidates.length < bestCandidates.length) {
      bestCandidates = candidates
      bestIndex = index

      if (candidates.length === 1) {
        break
      }
    }
  }

  if (bestIndex === -1 || !bestCandidates) {
    return null
  }

  return { index: bestIndex, candidates: bestCandidates }
}

// Fills a board recursively until it becomes a fully solved Sudoku.
function fillSolvedBoard(board: SudokuBoard): boolean {
  const choice = findBestEmptyCell(board)

  if (!choice) {
    return true
  }

  if (choice.candidates.length === 0) {
    return false
  }

  for (const value of shuffled(choice.candidates)) {
    board[choice.index] = value

    // check if this leads to a solution; if so, return true
    if (fillSolvedBoard(board)) {
      return true
    }

    // if placing this value didn't lead to a solution, reset the cell and try the next candidate
    board[choice.index] = 0
  }

  return false
}

// Counts solutions up to a limit to test puzzle uniqueness efficiently.
function countSolutions(board: SudokuBoard, limit: number): number {
  let solutionCount = 0

  function search(): void {
    if (solutionCount >= limit) {
      return
    }

    const choice = findBestEmptyCell(board)

    if (!choice) {
      solutionCount += 1
      return
    }

    if (choice.candidates.length === 0) {
      return
    }

    for (const value of choice.candidates) {
      board[choice.index] = value
      search()
      board[choice.index] = 0

      if (solutionCount >= limit) {
        return
      }
    }
  }

  search()
  return solutionCount
}

// Generates a complete valid solved Sudoku board.
function generateSolvedBoard(): SudokuBoard {
  const board = new Array<number>(CELL_COUNT).fill(0)

  if (!fillSolvedBoard(board)) {
    throw new Error('Failed to generate a solved Sudoku board.')
  }

  return board
}

// Counts how many non-empty cells (clues) a board currently has.
function countClues(board: SudokuBoard): number {
  return board.reduce((count, value) => (value === 0 ? count : count + 1), 0)
}

// Removes values while preserving a unique solution until target clues are reached.
function carvePuzzle(solution: SudokuBoard, targetClues: number): SudokuBoard {
  const puzzle = [...solution]
  const positions = shuffled(Array.from({ length: CELL_COUNT }, (_, index) => index))

  for (const position of positions) {
    if (countClues(puzzle) <= targetClues) {
      break
    }

    const backup = puzzle[position]
    puzzle[position] = 0

    const solutions = countSolutions([...puzzle], 2)

    if (solutions !== 1) {
      puzzle[position] = backup
    }
  }

  return puzzle
}

// Generates a Sudoku puzzle and its solution for the selected difficulty.
export function generateSudoku(difficulty: Difficulty = 'medium'): SudokuPuzzle {
  const profile = DIFFICULTY_PROFILES[difficulty]
  const solution = generateSolvedBoard()
  const puzzle = carvePuzzle(solution, profile.targetClues)

  return {
    difficulty,
    puzzle,
    solution,
    clues: countClues(puzzle)
  }
}

// Returns the configured target clue count for a difficulty.
export function getDifficultyTargetClues(difficulty: Difficulty): number {
  return DIFFICULTY_PROFILES[difficulty].targetClues
}
