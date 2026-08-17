import { test, expect } from '@playwright/test'

test.describe('Sudoku Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the board with 81 cells', async ({ page }) => {
    const cells = page.locator('.cell')
    await expect(cells).toHaveCount(81)
  })

  test('prefilled cells are selectable', async ({ page }) => {
    const prefilled = page.locator('.cell.prefilled').first()
    await prefilled.click()
    await expect(prefilled).toHaveClass(/selected/)
  })

  test('clicking an empty cell selects it', async ({ page }) => {
    const emptyCell = page.locator('.cell:not(.prefilled)').first()
    await emptyCell.click()
    await expect(emptyCell).toHaveClass(/selected/)
  })

  test('number button sets value in selected cell', async ({ page }) => {
    const emptyCell = page.locator('.cell:not(.prefilled)').first()
    await emptyCell.click()

    await page.locator('.num-btn', { hasText: '5' }).click()
    await expect(emptyCell).toHaveText('5')
  })

  test('clicking the same number again clears the cell', async ({ page }) => {
    const emptyCell = page.locator('.cell:not(.prefilled)').first()
    await emptyCell.click()

    await page.locator('.num-btn', { hasText: '3' }).click()
    await page.locator('.num-btn', { hasText: '3' }).click()
    await expect(emptyCell).toHaveText('')
  })

  test('keyboard digit fills selected cell', async ({ page }) => {
    const emptyCell = page.locator('.cell:not(.prefilled)').first()
    await emptyCell.click()

    await page.keyboard.press('7')
    await expect(emptyCell).toHaveText('7')
  })

  test('keyboard non-digit has no effect', async ({ page }) => {
    const emptyCell = page.locator('.cell:not(.prefilled)').first()
    await emptyCell.click()

    await page.keyboard.press('a')
    await page.keyboard.press('0')
    await page.keyboard.press('Escape')
    await expect(emptyCell).toHaveText('')
  })

  test('clear cell button empties the selected cell', async ({ page }) => {
    const emptyCell = page.locator('.cell:not(.prefilled)').first()
    await emptyCell.click()

    await page.locator('.num-btn', { hasText: '4' }).click()
    await page.locator('.actions button', { hasText: 'Clear' }).click()
    await expect(emptyCell).toHaveText('')
  })

  test('check button is disabled when board is incomplete', async ({ page }) => {
    await expect(page.locator('button', { hasText: 'Check' })).toBeDisabled()
  })

  test('number buttons are disabled when no cell is selected', async ({ page }) => {
    const numButtons = page.locator('.num-btn')
    for (const btn of await numButtons.all()) {
      await expect(btn).toBeDisabled()
    }
  })

  test('new game resets the board', async ({ page }) => {
    const emptyCell = page.locator('.cell:not(.prefilled)').first()
    await emptyCell.click()
    await page.locator('.num-btn', { hasText: '1' }).click()

    await page.locator('.new-game-btn').click()

    const cells = page.locator('.cell')
    const count = await cells.count()
    let filledUserCells = 0

    for (let i = 0; i < count; i++) {
      const cell = cells.nth(i)
      const isPrefilled = await cell.evaluate((el) => el.classList.contains('prefilled'))
      const text = (await cell.textContent())?.trim()
      if (!isPrefilled && text) filledUserCells++
    }

    expect(filledUserCells).toBe(0)
  })

  test('difficulty dropdown changes selected value', async ({ page }) => {
    await page.locator('#difficulty').selectOption('hard')
    await expect(page.locator('#difficulty')).toHaveValue('hard')
  })

  test('notes mode toggles via control button', async ({ page }) => {
    const notesToggle = page.locator('.notes-toggle')

    await expect(notesToggle).toHaveAttribute('aria-pressed', 'false')
    await expect(notesToggle).toContainText('Notes off')

    await notesToggle.click()
    await expect(notesToggle).toHaveAttribute('aria-pressed', 'true')
    await expect(notesToggle).toContainText('Notes on')

    await notesToggle.click()
    await expect(notesToggle).toHaveAttribute('aria-pressed', 'false')
    await expect(notesToggle).toContainText('Notes off')
  })

  test('notes mode writes desaturated note candidates into a selected empty cell', async ({ page }) => {
    const emptyCell = page.locator('.cell:not(.prefilled)').first()
    await emptyCell.click()

    await page.locator('.notes-toggle').click()
    await page.locator('.num-btn', { hasText: '2' }).click()
    await page.locator('.num-btn', { hasText: '7' }).click()

    const notesContainer = emptyCell.locator('.cell-notes')
    await expect(notesContainer).toBeVisible()
    await expect(emptyCell.locator('.note-value', { hasText: '2' })).toHaveCount(1)
    await expect(emptyCell.locator('.note-value', { hasText: '7' })).toHaveCount(1)

    const noteColor = await emptyCell.locator('.note-value', { hasText: '2' }).evaluate((el) => {
      return getComputedStyle(el).color
    })
    expect(noteColor).toBe('oklch(0.46 0.028 250)')
  })

  test('digit keys toggle notes in notes mode and set final value in normal mode', async ({ page }) => {
    const emptyCell = page.locator('.cell:not(.prefilled)').first()
    await emptyCell.click()

    await page.locator('.notes-toggle').click()

    await page.keyboard.press('5')
    await expect(emptyCell.locator('.note-value', { hasText: '5' })).toHaveCount(1)

    await page.keyboard.press('5')
    await expect(emptyCell.locator('.note-value', { hasText: '5' })).toHaveCount(0)

    await page.locator('.notes-toggle').click()
    await page.keyboard.press('5')
    await expect(emptyCell).toHaveText('5')
    await expect(emptyCell.locator('.cell-notes')).toHaveCount(0)
  })

  test('setting a final value clears existing notes in that cell', async ({ page }) => {
    const emptyCell = page.locator('.cell:not(.prefilled)').first()
    await emptyCell.click()

    await page.locator('.notes-toggle').click()
    await page.locator('.num-btn', { hasText: '1' }).click()
    await page.locator('.num-btn', { hasText: '9' }).click()
    await expect(emptyCell.locator('.note-value', { hasText: '1' })).toHaveCount(1)
    await expect(emptyCell.locator('.note-value', { hasText: '9' })).toHaveCount(1)

    await page.locator('.notes-toggle').click()
    await page.locator('.num-btn', { hasText: '4' }).click()

    await expect(emptyCell).toHaveText('4')
    await expect(emptyCell.locator('.cell-notes')).toHaveCount(0)
  })

  test('selecting a filled cell highlights all cells with the same filled value', async ({ page }) => {
    const prefilledCells = page.locator('.cell.prefilled')
    const prefilledCount = await prefilledCells.count()

    let targetValue: string | null = null
    for (let i = 0; i < prefilledCount; i++) {
      const value = (await prefilledCells.nth(i).textContent())?.trim() ?? ''
      if (!value) continue
      const sameValueCount = await page.locator('.cell', { hasText: value }).count()
      if (sameValueCount > 1) {
        targetValue = value
        break
      }
    }

    expect(targetValue).not.toBeNull()

    const selectedPrefilled = page.locator('.cell.prefilled', { hasText: targetValue! }).first()
    await selectedPrefilled.click()

    await expect(selectedPrefilled).toHaveClass(/selected/)

    const allCells = page.locator('.cell')
    const totalCells = await allCells.count()
    for (let i = 0; i < totalCells; i++) {
      const cell = allCells.nth(i)
      const text = (await cell.textContent())?.trim() ?? ''
      const hasNotes = (await cell.locator('.cell-notes').count()) > 0
      if (!hasNotes && text === targetValue) {
        await expect(cell).toHaveClass(/matching-value/)
      }
    }
  })

  test('note-only cells are not treated as matching-value highlights', async ({ page }) => {
    const emptyCell = page.locator('.cell:not(.prefilled)').first()
    await emptyCell.click()

    await page.locator('.notes-toggle').click()
    await page.locator('.num-btn', { hasText: '5' }).click()
    await expect(emptyCell.locator('.cell-notes')).toHaveCount(1)

    const prefilledFive = page.locator('.cell.prefilled', { hasText: '5' }).first()
    await prefilledFive.click()

    await expect(prefilledFive).toHaveClass(/selected/)
    await expect(emptyCell).not.toHaveClass(/matching-value/)
  })
})
