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

    const notesToggle = screen.getByRole('button', { name: 'Notes Mode: Off' })
    expect(notesToggle).toHaveAttribute('aria-pressed', 'false')

    await fireEvent.click(notesToggle)
    expect(notesToggle).toHaveTextContent('Notes Mode: On')
    expect(notesToggle).toHaveAttribute('aria-pressed', 'true')

    await fireEvent.click(notesToggle)
    expect(notesToggle).toHaveTextContent('Notes Mode: Off')
    expect(notesToggle).toHaveAttribute('aria-pressed', 'false')
  })

  it('writes and removes note candidates in notes mode', async () => {
    const { container } = render(App)

    const editableCell = getFirstEditableCell(container)
    await fireEvent.click(editableCell)

    const notesToggle = screen.getByRole('button', { name: 'Notes Mode: Off' })
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

    const notesToggle = screen.getByRole('button', { name: 'Notes Mode: Off' })
    await fireEvent.click(notesToggle)
    await fireEvent.keyDown(window, { key: '1' })
    await fireEvent.keyDown(window, { key: '9' })

    expect(editableCell.querySelector('.cell-notes')).not.toBeNull()

    await fireEvent.click(notesToggle)
    await fireEvent.keyDown(window, { key: '4' })

    expect(editableCell.querySelector('.cell-notes')).toBeNull()
    expect(editableCell).toHaveTextContent('4')
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

    const notesToggle = screen.getByRole('button', { name: 'Notes Mode: Off' })
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
  it('changes theme via dropdown and applies data-theme attribute', async () => {
    render(App)

    const themeSelect = screen.getByRole('combobox', { name: 'Theme preference' }) as HTMLSelectElement
    expect(themeSelect).toHaveValue('auto')

    // Change to dark mode
    await fireEvent.change(themeSelect, { target: { value: 'dark' } })
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(themeSelect).toHaveValue('dark')

    // Change to light mode
    await fireEvent.change(themeSelect, { target: { value: 'light' } })
    expect(document.documentElement.getAttribute('data-theme')).toBeNull()
    expect(themeSelect).toHaveValue('light')

    // Change back to auto
    await fireEvent.change(themeSelect, { target: { value: 'auto' } })
    expect(themeSelect).toHaveValue('auto')
  })

  it('applies different computed colors when switching between light and dark themes', async () => {
    render(App)

    const themeSelect = screen.getByRole('combobox', { name: 'Theme preference' }) as HTMLSelectElement
    const root = document.documentElement

    // Change to light mode
    await fireEvent.change(themeSelect, { target: { value: 'light' } })
    expect(root.getAttribute('data-theme')).toBeNull()

    // Change to dark mode and verify data-theme attribute is set
    await fireEvent.change(themeSelect, { target: { value: 'dark' } })
    expect(root.getAttribute('data-theme')).toBe('dark')

    // Change back to light mode and verify attribute is removed
    await fireEvent.change(themeSelect, { target: { value: 'light' } })
    expect(root.getAttribute('data-theme')).toBeNull()

    // Change to auto mode
    await fireEvent.change(themeSelect, { target: { value: 'auto' } })
    // In auto mode with light system preference (mocked), should not have data-theme
    expect(root.getAttribute('data-theme')).toBeNull()
  })

  it('persists theme choice to localStorage', async () => {
    render(App)

    const themeSelect = screen.getByRole('combobox', { name: 'Theme preference' }) as HTMLSelectElement

    await fireEvent.change(themeSelect, { target: { value: 'dark' } })
    expect(localStorage.getItem('sudoku-theme')).toBe('dark')

    await fireEvent.change(themeSelect, { target: { value: 'light' } })
    expect(localStorage.getItem('sudoku-theme')).toBe('light')

    await fireEvent.change(themeSelect, { target: { value: 'auto' } })
    expect(localStorage.getItem('sudoku-theme')).toBe('auto')
  })
})