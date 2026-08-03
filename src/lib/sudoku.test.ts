import { describe, it, expect } from 'vitest'
import {
  generateSudoku,
  getDifficultyTargetClues,
  type Difficulty,
  type SudokuBoard
} from './sudoku'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert', 'master']

const TARGET_CLUES: Record<Difficulty, number> = {
  easy: 40,
  medium: 34,
  hard: 30,
  expert: 27,
  master: 24
}

function isValidGroup(values: number[]): boolean {
  const filled = values.filter((v) => v !== 0)
  return new Set(filled).size === filled.length && filled.every((v) => v >= 1 && v <= 9)
}

function validateBoard(board: SudokuBoard): boolean {
  for (let r = 0; r < 9; r++) {
    const row = board.slice(r * 9, r * 9 + 9)
    if (!isValidGroup(row)) return false
  }

  for (let c = 0; c < 9; c++) {
    const col = Array.from({ length: 9 }, (_, r) => board[r * 9 + c])
    if (!isValidGroup(col)) return false
  }

  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const box: number[] = []
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          box.push(board[(br * 3 + r) * 9 + (bc * 3 + c)])
        }
      }
      if (!isValidGroup(box)) return false
    }
  }

  return true
}

describe('getDifficultyTargetClues', () => {
  it.each(DIFFICULTIES)('returns correct target for %s', (difficulty) => {
    expect(getDifficultyTargetClues(difficulty)).toBe(TARGET_CLUES[difficulty])
  })
})

describe('generateSudoku', () => {
  it('returns a puzzle with 81 cells', () => {
    const { puzzle } = generateSudoku('easy')
    expect(puzzle).toHaveLength(81)
  })

  it('returns a solution with 81 cells', () => {
    const { solution } = generateSudoku('easy')
    expect(solution).toHaveLength(81)
  })

  it('solution contains only digits 1-9', () => {
    const { solution } = generateSudoku('easy')
    expect(solution.every((v) => v >= 1 && v <= 9)).toBe(true)
  })

  it('solution satisfies Sudoku row, column and box constraints', () => {
    const { solution } = generateSudoku('easy')
    expect(validateBoard(solution)).toBe(true)
  })

  it('puzzle cells are a strict subset of solution cells', () => {
    const { puzzle, solution } = generateSudoku('medium')
    const allMatch = puzzle.every((v, i) => v === 0 || v === solution[i])
    expect(allMatch).toBe(true)
  })

  it('puzzle contains no cells outside 0-9', () => {
    const { puzzle } = generateSudoku('medium')
    expect(puzzle.every((v) => v >= 0 && v <= 9)).toBe(true)
  })

  it('puzzle satisfies Sudoku constraints for its filled cells', () => {
    const { puzzle } = generateSudoku('medium')
    expect(validateBoard(puzzle)).toBe(true)
  })

  it('reports correct clue count', () => {
    const { puzzle, clues } = generateSudoku('hard')
    const actual = puzzle.filter((v) => v !== 0).length
    expect(clues).toBe(actual)
  })

  it('records the requested difficulty', () => {
    const { difficulty } = generateSudoku('expert')
    expect(difficulty).toBe('expert')
  })

  // Generator removes clues while unique solution is guaranteed; result may exceed
  // the target when all remaining removals would create ambiguity. Allow up to 10% slack.
  it.each(DIFFICULTIES)('clue count is close to target for %s', (difficulty) => {
    const { clues } = generateSudoku(difficulty)
    const slack = Math.ceil(TARGET_CLUES[difficulty] * 0.1)
    expect(clues).toBeLessThanOrEqual(TARGET_CLUES[difficulty] + slack)
  })

  it.each(DIFFICULTIES)('clue count is at least 17 (minimum for unique puzzle) for %s', (difficulty) => {
    const { clues } = generateSudoku(difficulty)
    expect(clues).toBeGreaterThanOrEqual(17)
  })

  it('defaults to medium when no difficulty is given', () => {
    const { difficulty } = generateSudoku()
    expect(difficulty).toBe('medium')
  })

  it('generates different puzzles on subsequent calls', () => {
    const a = generateSudoku('easy')
    const b = generateSudoku('easy')
    expect(a.puzzle).not.toEqual(b.puzzle)
  })
})
