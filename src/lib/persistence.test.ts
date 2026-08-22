import { describe, it, expect, beforeEach } from 'vitest'
import { PersistenceConsent, saveGame, loadSavedGame, clearSavedGame, type SavedGameState } from './persistence.svelte'
import type { SudokuPuzzle } from './sudoku'

// jsdom in this environment doesn't provide a real window.localStorage, so mock it (mirrors src/App.test.ts).
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

const CONSENT_KEY = 'sudoku-save-consent'
const GAME_KEY = 'sudoku-saved-game'

function makeSavedState(): SavedGameState {
  const solution = Array.from({ length: 81 }, (_, i) => (i % 9) + 1)
  const puzzle = [...solution]
  puzzle[0] = 0

  const game: SudokuPuzzle = { difficulty: 'easy', puzzle, solution, clues: 80 }

  return {
    difficulty: 'easy',
    game,
    board: [...puzzle],
    notesByCell: Array.from({ length: 81 }, () => []),
    isNotesMode: false
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe('PersistenceConsent', () => {
  it('starts undecided when nothing is stored', () => {
    const consent = new PersistenceConsent()

    expect(consent.choice).toBeNull()
    expect(consent.isDecided).toBe(false)
    expect(consent.isAccepted).toBe(false)
  })

  it('reads a previously accepted choice from storage', () => {
    localStorage.setItem(CONSENT_KEY, 'accepted')

    const consent = new PersistenceConsent()

    expect(consent.isDecided).toBe(true)
    expect(consent.isAccepted).toBe(true)
  })

  it('reads a previously declined choice from storage', () => {
    localStorage.setItem(CONSENT_KEY, 'declined')

    const consent = new PersistenceConsent()

    expect(consent.isDecided).toBe(true)
    expect(consent.isAccepted).toBe(false)
  })

  it('treats an invalid stored value as undecided', () => {
    localStorage.setItem(CONSENT_KEY, 'maybe-later')

    const consent = new PersistenceConsent()

    expect(consent.choice).toBeNull()
    expect(consent.isDecided).toBe(false)
  })

  it('accept() records acceptance in storage', () => {
    const consent = new PersistenceConsent()

    consent.accept()

    expect(consent.isDecided).toBe(true)
    expect(consent.isAccepted).toBe(true)
    expect(localStorage.getItem(CONSENT_KEY)).toBe('accepted')
  })

  it('decline() records the decline in storage and wipes any saved game', () => {
    saveGame(makeSavedState())
    const consent = new PersistenceConsent()

    consent.decline()

    expect(consent.isDecided).toBe(true)
    expect(consent.isAccepted).toBe(false)
    expect(localStorage.getItem(CONSENT_KEY)).toBe('declined')
    expect(localStorage.getItem(GAME_KEY)).toBeNull()
  })
})

describe('saveGame / loadSavedGame / clearSavedGame', () => {
  it('returns null when nothing has been saved', () => {
    expect(loadSavedGame()).toBeNull()
  })

  it('round-trips a saved game through localStorage', () => {
    const state = makeSavedState()

    saveGame(state)

    expect(loadSavedGame()).toEqual(state)
  })

  it('overwrites a previously saved game', () => {
    const first = makeSavedState()
    saveGame(first)

    const second = makeSavedState()
    second.board[1] = 4
    saveGame(second)

    expect(loadSavedGame()).toEqual(second)
  })

  it('returns null instead of throwing when the stored value is corrupted JSON', () => {
    localStorage.setItem(GAME_KEY, '{not valid json')

    expect(loadSavedGame()).toBeNull()
  })

  it('clearSavedGame removes the stored game', () => {
    saveGame(makeSavedState())

    clearSavedGame()

    expect(localStorage.getItem(GAME_KEY)).toBeNull()
    expect(loadSavedGame()).toBeNull()
  })
})
