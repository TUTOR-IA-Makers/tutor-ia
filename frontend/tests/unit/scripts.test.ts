import { readFileSync } from 'node:fs'
import { contrastRatio, evaluate, readTokens } from '../../scripts/contrast.mjs'
import { scan } from '../../scripts/check-bundle-secrets.mjs'

describe('scripts/contrast', () => {
  it('calcula a razão WCAG conhecida para preto e branco', () => {
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 5)
  })

  it('lê cores de tokens.css e todos os pares passam', () => {
    const css = readFileSync('src/styles/tokens.css', 'utf8')
    const failures = evaluate(readTokens(css)).filter((r) => !r.ok)
    expect(failures).toEqual([])
  })

  it('reprova par abaixo do mínimo e token ausente', () => {
    const tokens = new Map([
      ['--color-a', '#999'],
      ['--color-b', '#fff'],
    ])
    const [low, missing] = evaluate(tokens, [
      ['--color-a', '--color-b', 4.5],
      ['--color-x', '--color-b', 3],
    ])
    expect(low?.ok).toBe(false)
    expect(missing?.missing).toBe(true)
  })
})

describe('scripts/check-bundle-secrets', () => {
  it('detecta padrões de chave', () => {
    expect(scan(`const k = "sk-${'a'.repeat(40)}"`)).toContain('chave estilo OpenAI')
    expect(scan('CODEEXPERT_LLM_API_KEY')).toContain('variável de backend')
    expect(scan('/home/fulano/projeto/x')).toContain('caminho absoluto de usuário')
  })

  it('não acusa código comum', () => {
    expect(scan('export function task(){return "risk-free"}')).toEqual([])
  })
})
