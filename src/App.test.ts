import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import App from './App.svelte'

// Mock localStorage for tests
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
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

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: query === '(prefers-color-scheme: light)',
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true
  })
})

beforeEach(() => {
  // Reset localStorage before each test
  window.localStorage.clear()
  // Reset data-theme attribute
  document.documentElement.removeAttribute('data-theme')
})

afterEach(() => {
  window.localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

function getFirstEditableCell(container: HTMLElement): HTMLButtonElement {
  const editableCell = container.querySelector('.cell:not(.prefilled)')
  if (!(editableCell instanceof HTMLButtonElement)) {
    throw new Error('Expected at least one editable Sudoku cell')
  }

  return editableCell
}

function getCellsByDisplayedValue(container: HTMLElement, value: number): HTMLButtonElement[] {
  const allCells = Array.from(container.querySelectorAll('.cell'))
  return allCells.filter(
    (cell): cell is HTMLButtonElement =>
      cell instanceof HTMLButtonElement && cell.querySelector('.cell-notes') === null && cell.textContent?.trim() === String(value)
  )
}

describe('App notes mode', () => {
  it('toggles notes mode button state and label', async () => {
    render(App)

    const notesToggle = screen.getByRole('button', { name: 'Notes off' })
    expect(notesToggle).toHaveAttribute('aria-pressed', 'false')

    await fireEvent.click(notesToggle)
    expect(notesToggle).toHaveTextContent('Notes on')
    expect(notesToggle).toHaveAttribute('aria-pressed', 'true')

    await fireEvent.click(notesToggle)
    expect(notesToggle).toHaveTextContent('Notes off')
    expect(notesToggle).toHaveAttribute('aria-pressed', 'false')
  })

  it('writes and removes note candidates in notes mode', async () => {
    const { container } = render(App)

    const editableCell = getFirstEditableCell(container)
    await fireEvent.click(editableCell)

    const notesToggle = screen.getByRole('button', { name: 'Notes off' })
    await fireEvent.click(notesToggle)

    const numberTwo = screen.getByRole('button', { name: '2' })
    await fireEvent.click(numberTwo)
    expect(editableCell.querySelectorAll('.note-value')).toHaveLength(9)
    expect(editableCell.querySelector('.cell-notes')).not.toBeNull()
    expect(editableCell).toHaveTextContent('2')

    await fireEvent.click(numberTwo)
    expect(editableCell.querySelector('.cell-notes')).toBeNull()
    expect(editableCell).toHaveTextContent('')
  })

  it('sets final value and clears notes after switching back to normal mode', async () => {
    const { container } = render(App)

    const editableCell = getFirstEditableCell(container)
    await fireEvent.click(editableCell)

    const notesToggle = screen.getByRole('button', { name: 'Notes off' })
    await fireEvent.click(notesToggle)
    await fireEvent.keyDown(window, { key: '1' })
    await fireEvent.keyDown(window, { key: '9' })

    expect(editableCell.querySelector('.cell-notes')).not.toBeNull()

    await fireEvent.click(notesToggle)
    await fireEvent.keyDown(window, { key: '4' })

    expect(editableCell.querySelector('.cell-notes')).toBeNull()
    expect(editableCell).toHaveTextContent('4')
  })

  it.each(['Backspace', 'Delete'])('clears the selected cell with %s', async (key) => {
    const { container } = render(App)

    const editableCell = getFirstEditableCell(container)
    await fireEvent.click(editableCell)
    await fireEvent.keyDown(window, { key: '7' })

    expect(editableCell).toHaveTextContent('7')

    await fireEvent.keyDown(window, { key })

    expect(editableCell).toHaveTextContent('')
    expect(editableCell.querySelector('.cell-notes')).toBeNull()
  })

  it('allows selecting prefilled cells and highlights matching filled values', async () => {
    const { container } = render(App)

    const prefilledCells = Array.from(container.querySelectorAll('.cell.prefilled')).filter(
      (cell): cell is HTMLButtonElement => cell instanceof HTMLButtonElement
    )

    const selectedGroup = prefilledCells
      .map((cell) => ({
        cell,
        value: Number(cell.textContent?.trim() ?? '0')
      }))
      .find((item) => getCellsByDisplayedValue(container, item.value).length > 1)

    if (!selectedGroup) {
      throw new Error('Expected at least one prefilled value that appears more than once')
    }

    await fireEvent.click(selectedGroup.cell)

    expect(selectedGroup.cell).toHaveClass('selected')
    const matchingCells = getCellsByDisplayedValue(container, selectedGroup.value)
    expect(matchingCells.length).toBeGreaterThan(1)
    for (const cell of matchingCells) {
      expect(cell).toHaveClass('matching-value')
    }
  })

  it('does not highlight note-only cells for the selected value', async () => {
    const { container } = render(App)

    const editableCell = getFirstEditableCell(container)
    await fireEvent.click(editableCell)

    const notesToggle = screen.getByRole('button', { name: 'Notes off' })
    await fireEvent.click(notesToggle)

    const numberFive = screen.getByRole('button', { name: '5' })
    await fireEvent.click(numberFive)

    const prefilledWithFive = Array.from(container.querySelectorAll('.cell.prefilled')).find(
      (cell) => cell.textContent?.trim() === '5'
    )

    if (!(prefilledWithFive instanceof HTMLButtonElement)) {
      throw new Error('Expected at least one prefilled cell with value 5')
    }

    await fireEvent.click(prefilledWithFive)

    expect(editableCell.querySelector('.cell-notes')).not.toBeNull()
    expect(editableCell).not.toHaveClass('matching-value')
  })
})

describe('App theme', () => {
  it('cycles through auto, dark and light on click and applies data-theme attribute', async () => {
    render(App)

    const themeToggle = screen.getByRole('button', { name: /Auto theme/ })
    expect(document.documentElement.getAttribute('data-theme')).toBeNull()

    // auto -> dark
    await fireEvent.click(themeToggle)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(screen.getByRole('button', { name: /Dark theme/ })).toBeInTheDocument()

    // dark -> light
    await fireEvent.click(screen.getByRole('button', { name: /Dark theme/ }))
    expect(document.documentElement.getAttribute('data-theme')).toBeNull()
    expect(screen.getByRole('button', { name: /Light theme/ })).toBeInTheDocument()

    // light -> auto
    await fireEvent.click(screen.getByRole('button', { name: /Light theme/ }))
    expect(screen.getByRole('button', { name: /Auto theme/ })).toBeInTheDocument()
  })

  it('persists theme choice to localStorage', async () => {
    render(App)

    // auto -> dark
    await fireEvent.click(screen.getByRole('button', { name: /Auto theme/ }))
    expect(localStorage.getItem('sudoku-theme')).toBe('dark')

    // dark -> light
    await fireEvent.click(screen.getByRole('button', { name: /Dark theme/ }))
    expect(localStorage.getItem('sudoku-theme')).toBe('light')

    // light -> auto
    await fireEvent.click(screen.getByRole('button', { name: /Light theme/ }))
    expect(localStorage.getItem('sudoku-theme')).toBe('auto')
  })
})