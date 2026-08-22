import { describe, it, expect } from 'vitest'
import { SudokuGame } from './game.svelte'
import type { SavedGameState } from './persistence.svelte'
import type { SudokuPuzzle } from './sudoku'

function makeSavedState(overrides: Partial<SavedGameState> = {}): SavedGameState {
  const solution = Array.from({ length: 81 }, (_, i) => (i % 9) + 1)
  const puzzle = [...solution]
  puzzle[0] = 0

  const game: SudokuPuzzle = { difficulty: 'hard', puzzle, solution, clues: 80 }

  return {
    difficulty: 'hard',
    game,
    board: [...puzzle],
    notesByCell: Array.from({ length: 81 }, () => []),
    isNotesMode: true,
    ...overrides
  }
}

describe('SudokuGame restoring from a saved state', () => {
  it('restores difficulty, puzzle, board, notes and notes mode instead of generating a new game', () => {
    const saved = makeSavedState()
    saved.board[0] = 5
    saved.notesByCell[1] = [2, 4]

    const sudoku = new SudokuGame('medium', saved)

    expect(sudoku.difficulty).toBe('hard')
    expect(sudoku.game).toEqual(saved.game)
    expect(sudoku.board).toEqual(saved.board)
    expect(sudoku.notesByCell[1]).toEqual([2, 4])
    expect(sudoku.isNotesMode).toBe(true)
  })

  it('copies board and notes arrays instead of sharing references with the saved state', () => {
    const saved = makeSavedState({ isNotesMode: false })

    const sudoku = new SudokuGame('medium', saved)
    sudoku.selectCell(0)
    sudoku.setSelectedCellValue(9)

    expect(saved.board[0]).toBe(0)
    expect(sudoku.board[0]).toBe(9)
  })

  it('ignores the requested difficulty when a saved state is provided', () => {
    const saved = makeSavedState()

    const sudoku = new SudokuGame('easy', saved)

    expect(sudoku.difficulty).toBe('hard')
    expect(sudoku.clueTarget).toBe(30)
  })

  it('generates a fresh puzzle when no saved state is provided', () => {
    const sudoku = new SudokuGame('easy', null)

    expect(sudoku.difficulty).toBe('easy')
    expect(sudoku.board).toEqual(sudoku.game.puzzle)
    expect(sudoku.notesByCell.every((notes) => notes.length === 0)).toBe(true)
    expect(sudoku.isNotesMode).toBe(false)
  })

  it('generates a fresh puzzle when saved is undefined', () => {
    const sudoku = new SudokuGame('easy')

    expect(sudoku.board).toEqual(sudoku.game.puzzle)
  })
})
