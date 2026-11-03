import { expect, test } from '@playwright/test'

const SCREENS = [
  ['biblioteca', '/biblioteca'],
  ['gerar', '/gerar'],
  ['progresso', '/questoes/q-0143'],
  ['revisao-enunciado', '/questoes/q-0142'],
  ['revisao-testes', '/questoes/q-0142?aba=testes'],
  ['ajuda', '/ajuda'],
] as const

test.skip(!process.env.SCREENSHOTS, 'Capturas só sob demanda: SCREENSHOTS=1')

for (const [name, path] of SCREENS) {
  test(`captura ${name}`, async ({ page }, info) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true })
  })
}

test('captura exportar', async ({ page }, info) => {
  test.skip(!process.env.SCREENSHOTS)
  await page.goto('/biblioteca')
  await page.getByRole('checkbox', { name: 'Selecionar Maior de três números' }).check()
  await page.getByRole('checkbox', { name: 'Selecionar Cálculo de média ponderada' }).check()
  await page.getByRole('button', { name: 'Exportar XML' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.screenshot({ path: info.outputPath('exportar.png') })
})
