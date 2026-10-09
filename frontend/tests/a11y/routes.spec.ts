import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const ROUTES = [
  '/biblioteca',
  '/gerar',
  '/questoes/q-0142',
  '/questoes/q-0142?aba=testes',
  '/questoes/q-0141',
  '/questoes/q-0143',
  '/ajuda',
  '/nao-existe',
]

for (const path of ROUTES) {
  test(`sem violações axe sérias ou críticas em ${path}`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.waitForLoadState('networkidle')
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    const blocking = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    expect(
      blocking.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
    ).toEqual([])
  })
}

test('modal de exportação sem violações', async ({ page }) => {
  await page.goto('/biblioteca')
  await page.getByRole('checkbox', { name: 'Selecionar Maior de três números' }).check()
  await page.getByRole('button', { name: 'Exportar XML' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  const { violations } = await new AxeBuilder({ page }).include('dialog').analyze()
  expect(
    violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id),
  ).toEqual([])
})

test('reduced motion zera as durações dos tokens', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/biblioteca')
  const duration = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--dur-base').trim(),
  )
  expect(Number.parseFloat(duration)).toBe(0)
})
