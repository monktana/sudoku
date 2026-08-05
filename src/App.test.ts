import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import App from './App.svelte'

function getFirstEditableCell(container: HTMLElement): HTMLButtonElement {
  const editableCell = container.querySelector('.cell:not(.prefilled)')
  if (!(editableCell instanceof HTMLButtonElement)) {
    throw new Error('Expected at least one editable Sudoku cell')
  }

  return editableCell
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
})