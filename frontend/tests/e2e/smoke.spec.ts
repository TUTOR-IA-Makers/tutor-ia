import { expect, test } from '@playwright/test'

test('abre na biblioteca com a navbar padrão', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL('/biblioteca')
  await expect(page).toHaveTitle('Biblioteca de questões · CodeExpert')
  const nav = page.getByRole('navigation', { name: 'Principal' })
  await expect(nav.getByRole('link', { name: 'Biblioteca' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page.getByRole('article')).toHaveCount(7)
})

test('pular para o conteúdo funciona pelo teclado', async ({ page }) => {
  await page.goto('/ajuda')
  await expect(page.getByRole('heading', { level: 1, name: 'Ajuda' })).toBeVisible()
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeInViewport()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()
})

test('rota desconhecida mostra 404 com volta à biblioteca', async ({ page }) => {
  await page.goto('/nao-existe')
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar à biblioteca' }).click()
  await expect(page).toHaveURL('/biblioteca')
})

test('build publica CSP restritiva e não gera erros de console', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  for (const path of ['/biblioteca', '/gerar', '/questoes/q-0142', '/questoes/q-0143', '/ajuda']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }
  const csp = await page
    .locator('meta[http-equiv="Content-Security-Policy"]')
    .getAttribute('content')
  expect(csp).toContain("script-src 'self'")
  expect(csp).toContain("object-src 'none'")
  expect(errors).toEqual([])
})

for (const path of ['/biblioteca', '/gerar', '/questoes/q-0142', '/ajuda']) {
  test(`sem rolagem horizontal em ${path}`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
}
