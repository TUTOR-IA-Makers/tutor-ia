import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const TEXT = 4.5
const NON_TEXT = 3

export const PAIRS = [
  ['--color-text', '--color-surface', TEXT],
  ['--color-text', '--color-page', TEXT],
  ['--color-text-muted', '--color-surface', TEXT],
  ['--color-text-muted', '--color-page', TEXT],
  ['--color-primary', '--color-surface', TEXT],
  ['--color-primary', '--color-primary-tint', TEXT],
  ['--color-on-fill', '--color-primary', TEXT],
  ['--color-on-fill', '--color-primary-hover', TEXT],
  ['--color-accent', '--color-surface', TEXT],
  ['--color-on-fill', '--color-accent', TEXT],
  ['--color-on-fill', '--color-accent-hover', TEXT],
  ['--color-accent-text', '--color-accent-tint', TEXT],
  ['--color-danger', '--color-surface', TEXT],
  ['--color-danger', '--color-danger-tint', TEXT],
  ['--color-on-fill', '--color-footer', TEXT],
  ['--status-info-text', '--status-info-bg', TEXT],
  ['--status-warning-text', '--status-warning-bg', TEXT],
  ['--status-success-text', '--status-success-bg', TEXT],
  ['--status-danger-text', '--status-danger-bg', TEXT],
  ['--status-neutral-text', '--status-neutral-bg', TEXT],
  ['--code-text', '--code-bg', TEXT],
  ['--code-comment', '--code-bg', TEXT],
  ['--code-keyword', '--code-bg', TEXT],
  ['--code-string', '--code-bg', TEXT],
  ['--code-number', '--code-bg', TEXT],
  ['--code-preprocessor', '--code-bg', TEXT],
  ['--code-success', '--code-bg', TEXT],
  ['--code-error', '--code-bg', TEXT],
  ['--code-text', '--code-bg-raised', TEXT],
  ['--code-comment', '--code-bg-raised', TEXT],
  ['--color-border-control', '--color-surface', NON_TEXT],
  ['--color-accent', '--color-accent-tint', NON_TEXT],
]

export function readTokens(css) {
  const tokens = new Map()
  for (const [, name, value] of css.matchAll(
    /(--(?:color|status|code)-[\w-]+)\s*:\s*(#[0-9a-f]{3,6})\s*;/gi,
  )) {
    tokens.set(name, value)
  }
  return tokens
}

function channel(value) {
  const c = value / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminance(hex) {
  const raw = hex.slice(1)
  const full = raw.length === 3 ? [...raw].map((c) => c + c).join('') : raw
  const [r, g, b] = [0, 2, 4].map((i) => channel(Number.parseInt(full.slice(i, i + 2), 16)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

export function evaluate(tokens, pairs = PAIRS) {
  return pairs.map(([fg, bg, min]) => {
    const a = tokens.get(fg)
    const b = tokens.get(bg)
    if (!a || !b) return { fg, bg, min, ratio: 0, ok: false, missing: true }
    const ratio = contrastRatio(a, b)
    return { fg, bg, min, ratio, ok: ratio >= min, missing: false }
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8')
  const results = evaluate(readTokens(css))
  for (const r of results) {
    const mark = r.ok ? 'ok  ' : 'FAIL'
    const detail = r.missing ? 'token ausente' : `${r.ratio.toFixed(2)} (mín. ${String(r.min)})`
    console.log(`${mark} ${r.fg} / ${r.bg}: ${detail}`)
  }
  if (results.some((r) => !r.ok)) process.exit(1)
}
