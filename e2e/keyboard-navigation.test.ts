import { test, expect, type Page } from '@playwright/test'

// Finds two horizontally adjacent cells the player can still fill in, so the "digit entry
// follows keyboard focus" test doesn't depend on a specific randomly generated puzzle layout.
async function findAdjacentEmptyPair(page: Page): Promise<[number, number]> {
  const pair = (await page.evaluate(() => {
    const cells = Array.from(document.querySelectorAll('.cell'))

    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const a = row * 9 + col
        const b = a + 1
        if (!cells[a].classList.contains('prefilled') && !cells[b].classList.contains('prefilled')) {
          return [a, b]
        }
      }
    }

    return null
  })) as [number, number] | null

  if (!pair) {
    throw new Error('Expected at least one row with two horizontally adjacent editable cells')
  }

  return pair
}

test.describe('Keyboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('arrow key selects the top-left cell when nothing is selected yet', async ({ page }) => {
    await page.keyboard.press('ArrowDown')

    await expect(page.locator('.cell').first()).toHaveClass(/selected/)
  })

  test('arrow keys move the selection by one cell in each direction', async ({ page }) => {
    const cells = page.locator('.cell')
    // Row 4, col 4 (index 40) keeps every direction away from a board edge.
    await cells.nth(40).click()

    await page.keyboard.press('ArrowUp')
    await expect(cells.nth(31)).toHaveClass(/selected/)

    await page.keyboard.press('ArrowRight')
    await expect(cells.nth(32)).toHaveClass(/selected/)

    await page.keyboard.press('ArrowDown')
    await expect(cells.nth(41)).toHaveClass(/selected/)

    await page.keyboard.press('ArrowLeft')
    await expect(cells.nth(40)).toHaveClass(/selected/)
  })

  test('arrow keys clamp at the board edges instead of wrapping', async ({ page }) => {
    const cells = page.locator('.cell')

    await cells.first().click()
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('ArrowLeft')
    await expect(cells.first()).toHaveClass(/selected/)

    await cells.last().click()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowRight')
    await expect(cells.last()).toHaveClass(/selected/)
  })

  test('arrow key navigation moves actual DOM focus, and digit entry follows it', async ({ page }) => {
    const [firstIndex, secondIndex] = await findAdjacentEmptyPair(page)
    const cells = page.locator('.cell')
    const firstCell = cells.nth(firstIndex)
    const secondCell = cells.nth(secondIndex)

    await firstCell.click()
    await expect(firstCell).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await expect(secondCell).toBeFocused()
    await expect(secondCell).toHaveClass(/selected/)

    await page.keyboard.press('7')
    await expect(secondCell).toHaveText('7')
    await expect(firstCell).toHaveText('')
  })
})
