import { test, expect } from '@playwright/test'

test.describe('Save progress consent', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows a consent banner on first visit with both choices', async ({ page }) => {
    const banner = page.locator('.consent-banner')
    await expect(banner).toBeVisible()
    await expect(banner.getByRole('button', { name: "Don't save" })).toBeVisible()
    await expect(banner.getByRole('button', { name: 'Save my progress' })).toBeVisible()
  })

  test('accepting persists progress across a reload', async ({ page }) => {
    await page.getByRole('button', { name: 'Save my progress' }).click()
    await expect(page.locator('.consent-banner')).toHaveCount(0)

    const emptyCell = page.locator('.cell:not(.prefilled)').first()
    await emptyCell.click()
    await page.keyboard.press('6')
    await expect(emptyCell).toHaveText('6')

    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('sudoku-saved-game')))
      .not.toBeNull()

    await page.reload()

    await expect(page.locator('.consent-banner')).toHaveCount(0)
    await expect(page.locator('.cell:not(.prefilled)').first()).toHaveText('6')
  })

  test('declining leaves nothing persisted across a reload', async ({ page }) => {
    await page.getByRole('button', { name: "Don't save" }).click()
    await expect(page.locator('.consent-banner')).toHaveCount(0)

    const emptyCell = page.locator('.cell:not(.prefilled)').first()
    await emptyCell.click()
    await page.keyboard.press('9')
    await expect(emptyCell).toHaveText('9')

    const saved = await page.evaluate(() => localStorage.getItem('sudoku-saved-game'))
    expect(saved).toBeNull()

    await page.reload()

    await expect(page.locator('.consent-banner')).toHaveCount(0)
    await expect(page.locator('.cell:not(.prefilled)').first()).toHaveText('')
  })

  test('the control panel checkbox reflects and can change the save decision', async ({ page }) => {
    const saveToggle = page.getByRole('checkbox', { name: 'Save progress in this browser' })

    await page.getByRole('button', { name: "Don't save" }).click()
    await expect(saveToggle).not.toBeChecked()

    await saveToggle.check()
    await expect(saveToggle).toBeChecked()
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('sudoku-save-consent')))
      .toBe('accepted')

    await saveToggle.uncheck()
    await expect(saveToggle).not.toBeChecked()

    const saved = await page.evaluate(() => localStorage.getItem('sudoku-saved-game'))
    expect(saved).toBeNull()
  })
})
