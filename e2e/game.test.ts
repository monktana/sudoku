import { test, expect } from '@playwright/test'

test.describe('Sudoku Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the board with 81 cells', async ({ page }) => {
    const cells = page.locator('.cell')
    await expect(cells).toHaveCount(81)
  })

  test('prefilled cells are not selectable', async ({ page }) => {
    const prefilled = page.locator('.cell.prefilled').first()
    await prefilled.click()
    await expect(page.locator('.cell.selected')).toHaveCount(0)
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
    await page.locator('button', { hasText: 'Clear Cell' }).click()
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
})
