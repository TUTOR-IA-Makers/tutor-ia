const FALLBACK = '/'
const BASE = 'http://codeexpert.invalid'

function hasControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code < 0x20 || code === 0x7f) return true
  }
  return false
}

export function safeNextPath(candidate: string | null | undefined, fallback = FALLBACK): string {
  if (!candidate) return fallback

  const value = candidate.trim()
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback
  if (hasControlCharacter(value)) return fallback

  const url = new URL(value, BASE)
  if (url.origin !== BASE) return fallback

  return `${url.pathname}${url.search}${url.hash}`
}
