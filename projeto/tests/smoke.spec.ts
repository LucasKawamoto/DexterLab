import { expect, test } from '@playwright/test'

test.use({ browserName: 'chromium', channel: 'msedge', viewport: { width: 390, height: 844 } })

test('vitrine mobile não habilita checkout sem produto oficial', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Somente necessários' }).click()
  await expect(page.getByRole('heading', { name: 'Precisão em cada camada.' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Comprar na Kiwify/ })).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await page.getByRole('button', { name: 'Abrir menu' }).click()
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Painel administrativo' })).toHaveCount(0)
})

test('vitrine desktop mantém navegação e largura estáveis', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 768 })
  await page.goto('/')
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Login', exact: true, includeHidden: false })).toHaveCount(1)
  await expect(page.getByRole('link', { name: 'Explorar catálogo' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1365)
})

test('painel não aparece sem autenticação', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Painel administrativo' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Abrir menu' }).click()
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('button', { name: 'Login' }).click()
  await expect(page.getByRole('heading', { name: 'Entre na DexterLab' })).toBeVisible()
  await expect(page.getByText('PAINEL ADMINISTRATIVO')).toHaveCount(0)
})

test('campo de login aceita o código de oito dígitos enviado pelo Supabase', async ({ page }) => {
  await page.route('**/auth/v1/otp', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Abrir menu' }).click()
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('button', { name: 'Login' }).click()
  await page.getByRole('textbox', { name: 'E-mail' }).fill('admin@example.com')
  await page.getByRole('button', { name: 'Enviar código' }).click()
  const code = page.getByRole('textbox', { name: 'Código de 8 dígitos' })
  await expect(code).toBeVisible()
  await code.fill('12345678')
  await expect(code).toHaveValue('12345678')
})

test('arquivos públicos respondem na raiz', async ({ request }) => {
  for (const path of ['/robots.txt', '/sitemap.xml', '/llms.txt', '/dexterlab-logo.png', '/3d-printer-hero.webp']) {
    const response = await request.get(path)
    expect(response.ok(), path).toBe(true)
  }
})

test('privacidade e cookies podem ser revisados pelo visitante', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('dialog', { name: 'Preferências de cookies' })).toBeVisible()
  await page.getByRole('button', { name: 'Somente necessários' }).click()
  await expect(page.getByRole('dialog', { name: 'Preferências de cookies' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Privacidade e LGPD' }).click()
  await expect(page).toHaveURL(/\/privacidade$/)
  await expect(page.getByRole('heading', { name: 'Política de Privacidade' })).toBeVisible()
  await page.getByRole('button', { name: 'Gerenciar cookies' }).click()
  await expect(page.getByRole('dialog', { name: 'Preferências de cookies' })).toBeVisible()
})

test('rota pública de privacidade abre diretamente e exibe contato LGPD', async ({ page }) => {
  await page.goto('/privacidade')
  await expect(page.getByRole('heading', { name: 'Política de Privacidade' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'lucas.kawamoto2025@outlook.com.br' })).toHaveAttribute('href', 'mailto:lucas.kawamoto2025@outlook.com.br')
})
