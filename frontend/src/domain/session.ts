export interface Teacher {
  name: string
  department: string
}

export function initials(name: string): string {
  const words = name
    .split(/\s+/)
    .filter((word) => word.length > 0 && !/^(profa?|dra?|me|msc)\.?$/i.test(word))
    .filter((word) => !/^(da|de|do|das|dos|e)$/i.test(word))
  const first = words[0]?.charAt(0) ?? ''
  const last = words.length > 1 ? (words.at(-1)?.charAt(0) ?? '') : ''
  return `${first}${last}`.toUpperCase() || '?'
}
