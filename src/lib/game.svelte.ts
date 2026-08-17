import { generateSudoku, getDifficultyTargetClues, getPeerIndices, type Difficulty, type SudokuPuzzle } from './sudoku'

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert', 'master']

export type CheckResult = 'idle' | 'correct' | 'incorrect'

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
  master: 'Master'
}

export function labelForDifficulty(difficulty: Difficulty): string {
  return DIFFICULTY_LABELS[difficulty]
}

function emptyNotes(): number[][] {
  return Array.from({ length: 81 }, () => [])
}

// Owns the current puzzle, board and notes, and every mutation the UI can trigger on them.
export class SudokuGame {
  difficulty: Difficulty = $state()!
  game: SudokuPuzzle = $state()!
  board: number[] = $state()!
  selectedCellIndex: number | null = $state(null)
  notesByCell: number[][] = $state()!
  isNotesMode: boolean = $state(false)
  checkResult: CheckResult = $state('idle')

  constructor(initialDifficulty: Difficulty) {
    this.difficulty = initialDifficulty
    this.game = generateSudoku(initialDifficulty)
    this.board = [...this.game.puzzle]
    this.notesByCell = emptyNotes()
  }

  get clueTarget(): number {
    return getDifficultyTargetClues(this.difficulty)
  }

  get canEditSelectedCell(): boolean {
    return this.selectedCellIndex !== null && this.game.puzzle[this.selectedCellIndex] === 0
  }

  get isBoardComplete(): boolean {
    return this.board.every((value) => value !== 0)
  }

  get selectedFilledValue(): number | null {
    return this.selectedCellIndex !== null && this.board[this.selectedCellIndex] !== 0
      ? this.board[this.selectedCellIndex]
      : null
  }

  startNewGame(): void {
    this.game = generateSudoku(this.difficulty)
    this.board = [...this.game.puzzle]
    this.notesByCell = emptyNotes()
    this.isNotesMode = false
    this.selectedCellIndex = null
    this.checkResult = 'idle'
  }

  selectCell(index: number): void {
    this.selectedCellIndex = index
  }

  setSelectedCellValue(value: number): void {
    if (!this.canEditSelectedCell || this.selectedCellIndex === null) {
      return
    }

    if (this.isNotesMode) {
      this.toggleSelectedCellNote(value)
      return
    }

    const index = this.selectedCellIndex
    const isRemoving = this.board[index] === value
    const nextBoard = [...this.board]
    nextBoard[index] = isRemoving ? 0 : value
    this.board = nextBoard

    const nextNotes = [...this.notesByCell]
    nextNotes[index] = []

    if (!isRemoving) {
      for (const peer of getPeerIndices(index)) {
        if (nextNotes[peer].includes(value)) {
          nextNotes[peer] = nextNotes[peer].filter((note) => note !== value)
        }
      }
    }

    this.notesByCell = nextNotes
    this.checkResult = 'idle'
  }

  clearSelectedCell(): void {
    if (!this.canEditSelectedCell || this.selectedCellIndex === null) {
      return
    }

    const index = this.selectedCellIndex
    const nextBoard = [...this.board]
    nextBoard[index] = 0
    this.board = nextBoard

    const nextNotes = [...this.notesByCell]
    nextNotes[index] = []
    this.notesByCell = nextNotes
    this.checkResult = 'idle'
  }

  toggleNotesMode(): void {
    this.isNotesMode = !this.isNotesMode
  }

  checkSolution(): void {
    if (!this.isBoardComplete) {
      return
    }

    this.checkResult = this.board.every((value, index) => value === this.game.solution[index]) ? 'correct' : 'incorrect'
  }

  private toggleSelectedCellNote(value: number): void {
    if (!this.canEditSelectedCell || this.selectedCellIndex === null || this.board[this.selectedCellIndex] !== 0) {
      return
    }

    const index = this.selectedCellIndex
    const nextNotes = [...this.notesByCell]
    const currentNotes = nextNotes[index]
    const hasNote = currentNotes.includes(value)
    nextNotes[index] = hasNote ? currentNotes.filter((note) => note !== value) : [...currentNotes, value].sort((a, b) => a - b)
    this.notesByCell = nextNotes
    this.checkResult = 'idle'
  }
}
