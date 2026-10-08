import { expect, test } from '@playwright/test'

test('gerar, acompanhar, revisar, aprovar e exportar', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/gerar')

  await page.getByRole('combobox', { name: /Conteúdo de programação/ }).selectOption('condicionais')
  const min = page.getByRole('slider', { name: 'Dificuldade mínima' })
  await min.focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByText('1250 a 1600')).toBeVisible()
  await page.getByRole('button', { name: 'Aumentar casos de teste' }).click()
  await page.getByRole('textbox', { name: /Casos de teste específicos/ }).fill('incluir o ano 1900')
  await page.getByRole('textbox', { name: /Contexto do exercício/ }).fill('par ou ímpar')
  const required = page.getByRole('group', { name: 'Estruturas obrigatórias' })
  await required.getByRole('button', { name: 'for', exact: true }).click()
  await expect(
    page
      .getByRole('group', { name: 'Estruturas proibidas' })
      .getByRole('button', { name: 'laços de repetição' }),
  ).toBeDisabled()
  await required.getByRole('button', { name: 'for', exact: true }).click()
  await required.getByRole('button', { name: 'if / else' }).click()
  await page.getByRole('button', { name: 'Gerar questão' }).click()

  await expect(page.getByRole('heading', { name: 'Acompanhar geração' })).toBeVisible()
  await expect(page.getByRole('progressbar')).toBeVisible()
  await expect(page.getByRole('heading', { name: /Revisar questão/ })).toBeVisible({
    timeout: 20_000,
  })

  await expect(page.getByLabel('Código da solução em C')).toBeVisible()
  await page.getByRole('tab', { name: /Casos de teste e restrições/ }).click()
  await expect(page).toHaveURL(/aba=testes/)
  await expect(page.getByRole('table')).toBeVisible()

  await page.getByRole('button', { name: 'Aprovar e salvar' }).click()
  await expect(page.getByText('Questão aprovada', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Exportar na biblioteca' }).click()

  await page.getByRole('checkbox', { name: 'Selecionar Par ou ímpar' }).check()
  await page
    .getByRole('region', { name: 'Questões selecionadas' })
    .getByRole('button', { name: 'Exportar XML' })
    .click()
  const dialog = page.getByRole('dialog', { name: 'Exportar questões' })
  await expect(dialog).toBeVisible()
  const download = page.waitForEvent('download')
  await dialog.getByRole('button', { name: 'Baixar XML' }).click()
  expect((await download).suggestedFilename()).toBe('questoes_codeexpert.xml')
  await expect(dialog.getByText('XML exportado')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('rejeitar pede confirmação', async ({ page }) => {
  await page.goto('/questoes/q-0144')
  await page.getByRole('button', { name: 'Rejeitar' }).click()
  const dialog = page.getByRole('dialog', { name: 'Rejeitar questão?' })
  await dialog.getByRole('button', { name: 'Rejeitar questão' }).click()
  await expect(page.getByText('Rejeitada', { exact: true })).toBeVisible()
})
