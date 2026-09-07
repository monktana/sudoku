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

  it('defaults hintsUsed and lastHintAt when restoring a save from before hints existed', () => {
    const saved = makeSavedState()
    delete saved.hintsUsed
    delete saved.lastHintAt

    const sudoku = new SudokuGame('medium', saved)

    expect(sudoku.hintsUsed).toBe(0)
    expect(sudoku.lastHintAt).toBeNull()
  })
})

describe('moveSelection', () => {
  it('selects the top-left cell when nothing is selected yet', () => {
    const sudoku = new SudokuGame('easy', makeSavedState())

    sudoku.moveSelection('ArrowDown')

    expect(sudoku.selectedCellIndex).toBe(0)
  })

  it('moves the selection by one cell per direction', () => {
    const sudoku = new SudokuGame('easy', makeSavedState())

    sudoku.selectCell(40) // row 4, col 4

    sudoku.moveSelection('ArrowUp')
    expect(sudoku.selectedCellIndex).toBe(31) // row 3, col 4

    sudoku.moveSelection('ArrowDown')
    expect(sudoku.selectedCellIndex).toBe(40) // back to row 4, col 4

    sudoku.moveSelection('ArrowLeft')
    expect(sudoku.selectedCellIndex).toBe(39) // row 4, col 3

    sudoku.moveSelection('ArrowRight')
    expect(sudoku.selectedCellIndex).toBe(40) // back to row 4, col 4
  })

  it('clamps at the top-left corner instead of wrapping', () => {
    const sudoku = new SudokuGame('easy', makeSavedState())
    sudoku.selectCell(0)

    sudoku.moveSelection('ArrowUp')
    expect(sudoku.selectedCellIndex).toBe(0)

    sudoku.moveSelection('ArrowLeft')
    expect(sudoku.selectedCellIndex).toBe(0)
  })

  it('clamps at the bottom-right corner instead of wrapping', () => {
    const sudoku = new SudokuGame('easy', makeSavedState())
    sudoku.selectCell(80)

    sudoku.moveSelection('ArrowDown')
    expect(sudoku.selectedCellIndex).toBe(80)

    sudoku.moveSelection('ArrowRight')
    expect(sudoku.selectedCellIndex).toBe(80)
  })

  it('does not cross into the next or previous row at the board edge', () => {
    const sudoku = new SudokuGame('easy', makeSavedState())

    sudoku.selectCell(8) // row 0, col 8 (last column)
    sudoku.moveSelection('ArrowRight')
    expect(sudoku.selectedCellIndex).toBe(8)

    sudoku.selectCell(9) // row 1, col 0 (first column)
    sudoku.moveSelection('ArrowLeft')
    expect(sudoku.selectedCellIndex).toBe(9)
  })
})

describe('hint policy', () => {
  it('gives easy unlimited hints gated only by a cooldown', () => {
    const saved = makeSavedState({ difficulty: 'easy' })
    const sudoku = new SudokuGame('easy', saved)

    expect(sudoku.hintsRemaining).toBeNull()
    expect(sudoku.hintPolicy.enabled).toBe(true)
  })

  it('limits medium and hard to a fixed number of hints', () => {
    const medium = new SudokuGame('medium', makeSavedState({ difficulty: 'medium' }))
    const hard = new SudokuGame('hard', makeSavedState({ difficulty: 'hard' }))

    expect(medium.hintsRemaining).toBe(3)
    expect(hard.hintsRemaining).toBe(2)
  })

  it('disables hints entirely for expert and master', () => {
    const expert = new SudokuGame('expert', makeSavedState({ difficulty: 'expert' }))
    const master = new SudokuGame('master', makeSavedState({ difficulty: 'master' }))

    expect(expert.hintPolicy.enabled).toBe(false)
    expect(master.hintPolicy.enabled).toBe(false)
    expect(expert.hintsRemaining).toBe(0)
    expect(master.hintsRemaining).toBe(0)

    expert.selectCell(0)
    expert.useHint(0)

    expect(expert.board[0]).toBe(0)
    expect(expert.hintsUsed).toBe(0)
  })

  it('reveals the solution value for the selected cell and counts it as used', () => {
    const saved = makeSavedState({ difficulty: 'medium' })
    const sudoku = new SudokuGame('medium', saved)

    sudoku.selectCell(0)
    sudoku.useHint(0)

    expect(sudoku.board[0]).toBe(sudoku.game.solution[0])
    expect(sudoku.hintsUsed).toBe(1)
    expect(sudoku.hintsRemaining).toBe(2)
    expect(sudoku.lastHintAt).toBe(0)
  })

  it('blocks another hint until the cooldown elapses', () => {
    const saved = makeSavedState({ difficulty: 'easy' })
    const sudoku = new SudokuGame('easy', saved)

    sudoku.selectCell(0)
    sudoku.useHint(0)

    expect(sudoku.canRevealHint(29_999)).toBe(false)
    expect(sudoku.canRevealHint(30_000)).toBe(true)
  })

  it('blocks hints once the per-game limit is used up, even after the cooldown', () => {
    const saved = makeSavedState({ difficulty: 'hard' })
    const sudoku = new SudokuGame('hard', saved)

    // Cell 0 stays editable (it's the puzzle's only blank), so it can absorb both hints.
    sudoku.selectCell(0)
    sudoku.useHint(0)
    sudoku.useHint(45_000)

    expect(sudoku.hintsUsed).toBe(2)
    expect(sudoku.canRevealHint(999_999)).toBe(false)
  })

  it('does not use up a hint when no editable cell is selected', () => {
    const saved = makeSavedState({ difficulty: 'easy' })
    const sudoku = new SudokuGame('easy', saved)

    sudoku.useHint(0)

    expect(sudoku.hintsUsed).toBe(0)
    expect(sudoku.lastHintAt).toBeNull()
  })

  it('resets hint usage on a new game', () => {
    const saved = makeSavedState({ difficulty: 'medium' })
    const sudoku = new SudokuGame('medium', saved)

    sudoku.selectCell(0)
    sudoku.useHint(0)
    sudoku.startNewGame()

    expect(sudoku.hintsUsed).toBe(0)
    expect(sudoku.lastHintAt).toBeNull()
  })
})

describe('conflict feedback', () => {
  it('flags cells that duplicate a value already visible in the same row', () => {
    const solution = Array.from({ length: 81 }, (_, i) => (i % 9) + 1)
    const puzzle = new Array(81).fill(0)
    const game: SudokuPuzzle = { difficulty: 'easy', puzzle, solution, clues: 0 }
    const saved: SavedGameState = {
      difficulty: 'easy',
      game,
      board: [...puzzle],
      notesByCell: Array.from({ length: 81 }, () => []),
      isNotesMode: false
    }

    const sudoku = new SudokuGame('easy', saved)
    // Row 0 gets two 5s: a visible, checkable duplicate.
    sudoku.board[0] = 5
    sudoku.board[1] = 5

    expect(sudoku.conflictingCellIndices.has(0)).toBe(true)
    expect(sudoku.conflictingCellIndices.has(1)).toBe(true)
  })

  it('does not flag a value that is simply wrong for the solution but has no visible duplicate', () => {
    const solution = Array.from({ length: 81 }, (_, i) => (i % 9) + 1)
    const puzzle = new Array(81).fill(0)
    const game: SudokuPuzzle = { difficulty: 'easy', puzzle, solution, clues: 0 }
    const saved: SavedGameState = {
      difficulty: 'easy',
      game,
      board: [...puzzle],
      notesByCell: Array.from({ length: 81 }, () => []),
      isNotesMode: false
    }

    const sudoku = new SudokuGame('easy', saved)
    // Cell 0's solution value is 1, but placing 9 here has no matching peer yet.
    sudoku.board[0] = 9

    expect(sudoku.conflictingCellIndices.size).toBe(0)
  })

  it('gives no conflict feedback at all for expert and master', () => {
    const solution = Array.from({ length: 81 }, (_, i) => (i % 9) + 1)
    const puzzle = new Array(81).fill(0)
    const game: SudokuPuzzle = { difficulty: 'expert', puzzle, solution, clues: 0 }
    const saved: SavedGameState = {
      difficulty: 'expert',
      game,
      board: [...puzzle],
      notesByCell: Array.from({ length: 81 }, () => []),
      isNotesMode: false
    }

    const sudoku = new SudokuGame('expert', saved)
    sudoku.board[0] = 5
    sudoku.board[1] = 5

    expect(sudoku.isConflictFeedbackEnabled).toBe(false)
    expect(sudoku.conflictingCellIndices.size).toBe(0)
  })
})

describe('automatic check result', () => {
  it('stays idle while the board still has empty cells', () => {
    const saved = makeSavedState()
    const sudoku = new SudokuGame('hard', saved)

    expect(sudoku.checkResult).toBe('idle')
  })

  it('turns correct the moment the last cell is filled with the right value', () => {
    const saved = makeSavedState({ isNotesMode: false })
    const sudoku = new SudokuGame('hard', saved)

    sudoku.selectCell(0)
    sudoku.setSelectedCellValue(sudoku.game.solution[0])

    expect(sudoku.checkResult).toBe('correct')
  })

  it('turns incorrect the moment the last cell is filled with a wrong value', () => {
    const saved = makeSavedState({ isNotesMode: false })
    const sudoku = new SudokuGame('hard', saved)
    const wrongValue = (sudoku.game.solution[0] % 9) + 1

    sudoku.selectCell(0)
    sudoku.setSelectedCellValue(wrongValue)

    expect(sudoku.checkResult).toBe('incorrect')
  })

  it('re-evaluates when a cell is edited after the board was already complete', () => {
    const saved = makeSavedState({ isNotesMode: false })
    const sudoku = new SudokuGame('hard', saved)
    const wrongValue = (sudoku.game.solution[0] % 9) + 1

    sudoku.selectCell(0)
    sudoku.setSelectedCellValue(wrongValue)
    expect(sudoku.checkResult).toBe('incorrect')

    sudoku.setSelectedCellValue(sudoku.game.solution[0])
    expect(sudoku.checkResult).toBe('correct')
  })

  it('resets to idle when a cell is cleared', () => {
    const saved = makeSavedState({ isNotesMode: false })
    const sudoku = new SudokuGame('hard', saved)

    sudoku.selectCell(0)
    sudoku.setSelectedCellValue(sudoku.game.solution[0])
    expect(sudoku.checkResult).toBe('correct')

    sudoku.clearSelectedCell()
    expect(sudoku.checkResult).toBe('idle')
  })

  it('turns correct automatically when the last cell is filled via a hint', () => {
    const saved = makeSavedState({ difficulty: 'easy' })
    const sudoku = new SudokuGame('easy', saved)

    sudoku.selectCell(0)
    sudoku.useHint(0)

    expect(sudoku.checkResult).toBe('correct')
  })
})
