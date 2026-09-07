import { test, expect, type Page } from '@playwright/test'

// Finds a row that has two cells the player can still fill in, so tests can create a
// row-duplicate without depending on the exact layout of a randomly generated puzzle.
async function findEmptyRowPair(page: Page): Promise<[number, number]> {
  const pair = (await page.evaluate(() => {
    const cells = Array.from(document.querySelectorAll('.cell'))

    for (let row = 0; row < 9; row += 1) {
      const editable: number[] = []
      for (let col = 0; col < 9; col += 1) {
        const index = row * 9 + col
        if (!cells[index].classList.contains('prefilled')) {
          editable.push(index)
        }
      }
      if (editable.length >= 2) {
        return [editable[0], editable[1]]
      }
    }

    return null
  })) as [number, number] | null

  if (!pair) {
    throw new Error('Expected at least one row with two editable cells')
  }

  return pair
}

// Finds the first cell that's neither a given clue nor already filled by the player.
async function findFirstEmptyEditableIndex(page: Page): Promise<number> {
  return page.evaluate(() => {
    const cells = Array.from(document.querySelectorAll('.cell'))
    return cells.findIndex((el) => !el.classList.contains('prefilled') && el.textContent?.trim() === '')
  })
}

test.describe('Hints', () => {
  test('easy grants unlimited hints gated only by a cooldown', async ({ page }) => {
    await page.clock.install()
    await page.goto('/')
    await page.locator('#difficulty').selectOption('easy')
    await page.locator('.new-game-btn').click()

    const hintBtn = page.locator('.hint-btn')
    const emptyCell = page.locator('.cell:not(.prefilled)').first()
    await emptyCell.click()

    await expect(hintBtn).toHaveText('Hint')
    await expect(hintBtn).toBeEnabled()

    await hintBtn.click()
    await expect(emptyCell).not.toHaveText('')
    await expect(hintBtn).toBeDisabled()
    await expect(hintBtn).toHaveText(/Hint \(\d+s\)/)

    await page.clock.fastForward(30_000)
    await expect(hintBtn).toHaveText('Hint')
    await expect(hintBtn).toBeEnabled()
  })

  test('medium allows exactly 3 hints per game', async ({ page }) => {
    await page.clock.install()
    await page.goto('/')
    await page.locator('#difficulty').selectOption('medium')
    await page.locator('.new-game-btn').click()

    const hintBtn = page.locator('.hint-btn')
    await expect(hintBtn).toHaveText('Hint (3 left)')

    for (const remaining of [2, 1, 0]) {
      const index = await findFirstEmptyEditableIndex(page)
      await page.locator('.cell').nth(index).click()
      await hintBtn.click()
      await page.clock.fastForward(30_000)
      await expect(hintBtn).toHaveText(`Hint (${remaining} left)`)
    }

    await expect(hintBtn).toBeDisabled()
  })

  test('hard allows exactly 2 hints per game with a longer cooldown', async ({ page }) => {
    await page.clock.install()
    await page.goto('/')
    await page.locator('#difficulty').selectOption('hard')
    await page.locator('.new-game-btn').click()

    const hintBtn = page.locator('.hint-btn')
    await expect(hintBtn).toHaveText('Hint (2 left)')

    let index = await findFirstEmptyEditableIndex(page)
    await page.locator('.cell').nth(index).click()
    await hintBtn.click()
    await expect(hintBtn).toBeDisabled()

    // The 30s cooldown used by easy/medium must not be enough for hard's 45s cooldown.
    await page.clock.fastForward(30_000)
    await expect(hintBtn).toBeDisabled()

    await page.clock.fastForward(15_000)
    await expect(hintBtn).toHaveText('Hint (1 left)')

    index = await findFirstEmptyEditableIndex(page)
    await page.locator('.cell').nth(index).click()
    await hintBtn.click()

    await page.clock.fastForward(45_000)
    await expect(hintBtn).toHaveText('Hint (0 left)')
    await expect(hintBtn).toBeDisabled()
  })

  test('expert disables hints entirely', async ({ page }) => {
    await page.goto('/')
    await page.locator('#difficulty').selectOption('expert')
    await page.locator('.new-game-btn').click()
    await page.locator('.cell:not(.prefilled)').first().click()

    const hintBtn = page.locator('.hint-btn')
    await expect(hintBtn).toHaveText('No hints')
    await expect(hintBtn).toBeDisabled()
  })

  test('master disables hints entirely', async ({ page }) => {
    await page.goto('/')
    await page.locator('#difficulty').selectOption('master')
    await page.locator('.new-game-btn').click()
    await page.locator('.cell:not(.prefilled)').first().click()

    const hintBtn = page.locator('.hint-btn')
    await expect(hintBtn).toHaveText('No hints')
    await expect(hintBtn).toBeDisabled()
  })

  test('repeatedly hinting fills the board with a solution that automatically passes the check', async ({ page }) => {
    await page.clock.install()
    await page.goto('/')
    await page.locator('#difficulty').selectOption('easy')
    await page.locator('.new-game-btn').click()

    const hintBtn = page.locator('.hint-btn')

    let index = await findFirstEmptyEditableIndex(page)
    while (index !== -1) {
      await page.locator('.cell').nth(index).click()
      await hintBtn.click()
      await page.clock.fastForward(30_000)
      index = await findFirstEmptyEditableIndex(page)
    }

    await expect(page.locator('.check-result')).toHaveClass(/correct/)
  })
})

test.describe('Conflict feedback', () => {
  test('flags two cells that share a value in the same row', async ({ page }) => {
    await page.goto('/')
    await page.locator('#difficulty').selectOption('medium')
    await page.locator('.new-game-btn').click()

    const [firstIndex, secondIndex] = await findEmptyRowPair(page)
    const firstCell = page.locator('.cell').nth(firstIndex)
    const secondCell = page.locator('.cell').nth(secondIndex)

    await firstCell.click()
    await page.locator('.num-btn', { hasText: '5' }).click()

    await secondCell.click()
    await page.locator('.num-btn', { hasText: '5' }).click()

    await expect(firstCell).toHaveClass(/conflict/)
    await expect(secondCell).toHaveClass(/conflict/)
  })

  test('does not flag a value with no visible duplicate on the board', async ({ page }) => {
    await page.goto('/')
    await page.locator('#difficulty').selectOption('easy')
    await page.locator('.new-game-btn').click()

    // A hint always reveals the true solution value, so it can never collide with a peer.
    const emptyCell = page.locator('.cell:not(.prefilled)').first()
    await emptyCell.click()
    await page.locator('.hint-btn').click()

    await expect(emptyCell).not.toHaveClass(/conflict/)
  })

  test('gives no conflict feedback at expert difficulty', async ({ page }) => {
    await page.goto('/')
    await page.locator('#difficulty').selectOption('expert')
    await page.locator('.new-game-btn').click()

    const [firstIndex, secondIndex] = await findEmptyRowPair(page)
    const firstCell = page.locator('.cell').nth(firstIndex)
    const secondCell = page.locator('.cell').nth(secondIndex)

    await firstCell.click()
    await page.locator('.num-btn', { hasText: '5' }).click()
    await secondCell.click()
    await page.locator('.num-btn', { hasText: '5' }).click()

    await expect(firstCell).not.toHaveClass(/conflict/)
    await expect(secondCell).not.toHaveClass(/conflict/)
  })

  test('gives no conflict feedback at master difficulty', async ({ page }) => {
    await page.goto('/')
    await page.locator('#difficulty').selectOption('master')
    await page.locator('.new-game-btn').click()

    const [firstIndex, secondIndex] = await findEmptyRowPair(page)
    const firstCell = page.locator('.cell').nth(firstIndex)
    const secondCell = page.locator('.cell').nth(secondIndex)

    await firstCell.click()
    await page.locator('.num-btn', { hasText: '5' }).click()
    await secondCell.click()
    await page.locator('.num-btn', { hasText: '5' }).click()

    await expect(firstCell).not.toHaveClass(/conflict/)
    await expect(secondCell).not.toHaveClass(/conflict/)
  })
})
