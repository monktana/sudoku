import type { Difficulty, SudokuPuzzle } from './sudoku'

export type ConsentChoice = 'accepted' | 'declined'

export interface SavedGameState {
  difficulty: Difficulty
  game: SudokuPuzzle
  board: number[]
  notesByCell: number[][]
  isNotesMode: boolean
  // Optional for backward compatibility with games saved before hints existed.
  hintsUsed?: number
  lastHintAt?: number | null
}

const CONSENT_KEY = 'sudoku-save-consent'
const GAME_KEY = 'sudoku-saved-game'

function readConsentChoice(): ConsentChoice | null {
  const saved = localStorage.getItem(CONSENT_KEY)
  return saved === 'accepted' || saved === 'declined' ? saved : null
}

// Tracks whether the player has agreed to persist their game progress in this browser.
// The choice itself is always remembered locally so we don't ask again on every visit.
export class PersistenceConsent {
  choice: ConsentChoice | null = $state(null)

  constructor() {
    this.choice = readConsentChoice()
  }

  get isDecided(): boolean {
    return this.choice !== null
  }

  get isAccepted(): boolean {
    return this.choice === 'accepted'
  }

  accept(): void {
    this.choice = 'accepted'
    localStorage.setItem(CONSENT_KEY, 'accepted')
  }

  decline(): void {
    this.choice = 'declined'
    localStorage.setItem(CONSENT_KEY, 'declined')
    clearSavedGame()
  }
}

export function loadSavedGame(): SavedGameState | null {
  try {
    const raw = localStorage.getItem(GAME_KEY)
    return raw ? (JSON.parse(raw) as SavedGameState) : null
  } catch {
    return null
  }
}

export function saveGame(state: SavedGameState): void {
  localStorage.setItem(GAME_KEY, JSON.stringify(state))
}

export function clearSavedGame(): void {
  localStorage.removeItem(GAME_KEY)
}
