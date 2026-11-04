import { expect, test } from '@playwright/test'

// Mock mode only: the demo account lives in src/services/mock/fixtures.ts.
const ACCOUNT = { email: 'professora@exemplo.com', password: 'demo-codeexpert' }

test('entra com a conta de demonstração e cai na biblioteca', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/entrar$/)

  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByText('Informe seu e-mail.')).toBeVisible()
  await expect(page.getByLabel(/^E-mail/)).toBeFocused()

  await page.getByLabel(/^E-mail/).fill(ACCOUNT.email)
  await page.getByLabel(/^Senha/).fill(ACCOUNT.password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/biblioteca$/)
})

test('senha errada mostra mensagem genérica e não sai da tela', async ({ page }) => {
  await page.goto('/entrar')
  await page.getByLabel(/^E-mail/).fill(ACCOUNT.email)
  await page.getByLabel(/^Senha/).fill('senha-errada-1')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText('E-mail ou senha incorretos.')
  await expect(page).toHaveURL(/\/entrar$/)
})

test('botões sociais não fazem requisição', async ({ page }) => {
  const requests: string[] = []
  await page.goto('/entrar')
  await page.waitForLoadState('networkidle')
  page.on('request', (request) => requests.push(request.url()))
  await page.getByRole('button', { name: 'Entrar com Google' }).click()
  await page.getByRole('button', { name: 'Entrar com GitHub' }).click()
  await expect(page.getByRole('status')).toHaveText(/GitHub ainda não está disponível/)
  expect(requests).toEqual([])
})

test('cria conta com o convite de demonstração', async ({ page }) => {
  await page.goto('/criar-conta')
  await page.getByLabel(/^Nome completo/).fill('Ana Souza')
  await page.getByLabel(/^E-mail/).fill('ana@exemplo.com')
  await page.getByLabel(/^Senha/).fill('algoritmos-em-c')
  await page.getByLabel(/^Confirme a senha/).fill('algoritmos-em-c')
  await page.getByLabel(/^Código de convite/).fill('demo-2026')
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(page).toHaveURL(/\/biblioteca$/)
})

test('cabe em 320px sem rolagem horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  for (const path of ['/entrar', '/criar-conta']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow, path).toBeLessThanOrEqual(0)
  }
})

test.describe('com movimento reduzido', () => {
  test.use({ reducedMotion: 'reduce' })

  test('a troca de modo não anima', async ({ page }) => {
    await page.goto('/entrar')
    await page.getByRole('link', { name: 'Criar conta', exact: true }).first().click()
    await expect(page.getByRole('heading', { level: 1, name: 'Criar sua conta' })).toBeVisible()
    const duration = await page.getByRole('heading', { level: 1 }).evaluate((heading) => {
      // h1 sits in the header; the animated panel is the header's parent.
      const panel = heading.parentElement?.parentElement
      return panel ? getComputedStyle(panel).animationDuration : 'missing'
    })
    expect(Number.parseFloat(duration)).toBe(0)
  })
})
