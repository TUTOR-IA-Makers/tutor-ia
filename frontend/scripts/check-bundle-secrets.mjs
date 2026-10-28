import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

export const PATTERNS = [
  ['chave estilo OpenAI', /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/],
  ['chave Google', /AIza[0-9A-Za-z_-]{35}/],
  ['token GitHub', /gh[pousr]_[A-Za-z0-9]{36,}/],
  ['chave AWS', /AKIA[0-9A-Z]{16}/],
  ['chave privada', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['variável de backend', /CODEEXPERT_[A-Z_]+/],
  ['caminho absoluto de usuário', /\/(?:home|Users)\/[a-z][\w.-]+\//],
]

export function scan(text) {
  return PATTERNS.filter(([, pattern]) => pattern.test(text)).map(([label]) => label)
}

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* files(path)
    else yield path
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dist = fileURLToPath(new URL('../dist', import.meta.url))
  const hits = []
  for (const file of files(dist)) {
    if (!/\.(?:js|css|html|json|map|txt|svg)$/.test(file)) continue
    for (const label of scan(readFileSync(file, 'utf8')))
      hits.push(`${relative(dist, file)}: ${label}`)
  }
  if (hits.length > 0) {
    console.error('Possível segredo no bundle:')
    for (const hit of hits) console.error(`  ${hit}`)
    process.exit(1)
  }
  console.log('Nenhum padrão de segredo encontrado em dist/.')
}
