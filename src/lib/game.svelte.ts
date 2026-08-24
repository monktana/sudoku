import {
  BOARD_SIZE,
  generateSudoku,
  getDifficultyTargetClues,
  getPeerIndices,
  indexToCol,
  indexToRow,
  type Difficulty,
  type SudokuPuzzle
} from './sudoku'
import type { SavedGameState } from './persistence.svelte'

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert', 'master']

export type CheckResult = 'idle' | 'correct' | 'incorrect'

export type ArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'

export interface HintPolicy {
  enabled: boolean
  // null means unlimited hints for the game.
  maxHints: number | null
  // null means no cooldown between hints.
  cooldownMs: number | null
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
  master: 'Master'
}

// Hints get more restricted as difficulty rises, and are switched off entirely for the
// two hardest tiers so they can't be used to shortcut the puzzle.
const HINT_POLICIES: Record<Difficulty, HintPolicy> = {
  easy: { enabled: true, maxHints: null, cooldownMs: 30_000 },
  medium: { enabled: true, maxHints: 3, cooldownMs: 30_000 },
  hard: { enabled: true, maxHints: 2, cooldownMs: 45_000 },
  expert: { enabled: false, maxHints: 0, cooldownMs: null },
  master: { enabled: false, maxHints: 0, cooldownMs: null }
}

// Automatic conflict feedback is only shown for the three lower difficulties; the two
// hardest tiers get none, matching the "no feedback" hint policy above.
const CONFLICT_FEEDBACK_DIFFICULTIES: ReadonlySet<Difficulty> = new Set(['easy', 'medium', 'hard'])

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
  hintsUsed: number = $state(0)
  lastHintAt: number | null = $state(null)

  constructor(initialDifficulty: Difficulty, saved?: SavedGameState | null) {
    if (saved) {
      this.difficulty = saved.difficulty
      this.game = saved.game
      this.board = [...saved.board]
      this.notesByCell = saved.notesByCell.map((notes) => [...notes])
      this.isNotesMode = saved.isNotesMode
      this.hintsUsed = saved.hintsUsed ?? 0
      this.lastHintAt = saved.lastHintAt ?? null
    } else {
      this.difficulty = initialDifficulty
      this.game = generateSudoku(initialDifficulty)
      this.board = [...this.game.puzzle]
      this.notesByCell = emptyNotes()
    }
  }

  get clueTarget(): number {
    return getDifficultyTargetClues(this.difficulty)
  }

  get hintPolicy(): HintPolicy {
    return HINT_POLICIES[this.difficulty]
  }

  // Remaining hints for this game, or null when the policy allows unlimited hints.
  get hintsRemaining(): number | null {
    const policy = this.hintPolicy
    if (!policy.enabled) {
      return 0
    }
    return policy.maxHints === null ? null : Math.max(0, policy.maxHints - this.hintsUsed)
  }

  get isConflictFeedbackEnabled(): boolean {
    return CONFLICT_FEEDBACK_DIFFICULTIES.has(this.difficulty)
  }

  // Cells whose value duplicates another filled cell in the same row, column or box —
  // i.e. a mistake that's visible on the board without knowing the solution.
  get conflictingCellIndices(): Set<number> {
    const conflicts = new Set<number>()

    if (!this.isConflictFeedbackEnabled) {
      return conflicts
    }

    for (let index = 0; index < this.board.length; index += 1) {
      const value = this.board[index]

      if (value === 0) {
        continue
      }

      for (const peer of getPeerIndices(index)) {
        if (this.board[peer] === value) {
          conflicts.add(index)
          break
        }
      }
    }

    return conflicts
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
    this.hintsUsed = 0
    this.lastHintAt = null
  }

  selectCell(index: number): void {
    this.selectedCellIndex = index
  }

  // Moves the selection by one cell in the given direction, clamped to the board edges.
  // Selects the top-left cell first if nothing is selected yet.
  moveSelection(key: ArrowKey): void {
    if (this.selectedCellIndex === null) {
      this.selectedCellIndex = 0
      return
    }

    const row = indexToRow(this.selectedCellIndex)
    const col = indexToCol(this.selectedCellIndex)

    const nextRow = key === 'ArrowUp' ? Math.max(0, row - 1) : key === 'ArrowDown' ? Math.min(BOARD_SIZE - 1, row + 1) : row
    const nextCol =
      key === 'ArrowLeft' ? Math.max(0, col - 1) : key === 'ArrowRight' ? Math.min(BOARD_SIZE - 1, col + 1) : col

    this.selectedCellIndex = nextRow * BOARD_SIZE + nextCol
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

    if (isRemoving) {
      const nextBoard = [...this.board]
      nextBoard[index] = 0
      this.board = nextBoard

      const nextNotes = [...this.notesByCell]
      nextNotes[index] = []
      this.notesByCell = nextNotes
      this.checkResult = 'idle'
      return
    }

    this.placeValue(index, value)
  }

  // Reveals the solution value for the selected cell, if the current difficulty's hint
  // policy still allows it.
  useHint(now: number = Date.now()): void {
    if (!this.canRevealHint(now) || this.selectedCellIndex === null) {
      return
    }

    const index = this.selectedCellIndex
    this.placeValue(index, this.game.solution[index])
    this.hintsUsed += 1
    this.lastHintAt = now
  }

  canRevealHint(now: number = Date.now()): boolean {
    if (!this.canEditSelectedCell) {
      return false
    }

    const policy = this.hintPolicy

    if (!policy.enabled) {
      return false
    }

    if (policy.maxHints !== null && this.hintsUsed >= policy.maxHints) {
      return false
    }

    if (policy.cooldownMs !== null && this.lastHintAt !== null && now - this.lastHintAt < policy.cooldownMs) {
      return false
    }

    return true
  }

  // Milliseconds remaining before another hint may be revealed, or 0 if none apply.
  hintCooldownRemainingMs(now: number = Date.now()): number {
    const { cooldownMs } = this.hintPolicy

    if (cooldownMs === null || this.lastHintAt === null) {
      return 0
    }

    return Math.max(0, cooldownMs - (now - this.lastHintAt))
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

  // Places a definitive value in a cell, clearing its notes and removing that value from
  // peer notes. Shared by direct entry and hints.
  private placeValue(index: number, value: number): void {
    const nextBoard = [...this.board]
    nextBoard[index] = value
    this.board = nextBoard

    const nextNotes = [...this.notesByCell]
    nextNotes[index] = []

    for (const peer of getPeerIndices(index)) {
      if (nextNotes[peer].includes(value)) {
        nextNotes[peer] = nextNotes[peer].filter((note) => note !== value)
      }
    }

    this.notesByCell = nextNotes
    this.checkResult = 'idle'
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
