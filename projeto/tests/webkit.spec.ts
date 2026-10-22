import { expect, test } from '@playwright/test'

test.use({ browserName: 'webkit' })

test('WebKit: loja e privacidade funcionam no desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 768 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Precisão em cada camada.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Painel administrativo' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Somente necessários' }).click()
  await page.getByRole('button', { name: 'Privacidade e LGPD' }).click()
  await expect(page.getByRole('heading', { name: 'Política de Privacidade' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1365)
})

test('WebKit: navegação mobile sem rolagem horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Abrir menu' }).click()
  await expect(page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('button', { name: 'Login' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})
