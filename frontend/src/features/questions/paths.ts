export function questionPath(id: string): string {
  return `/questoes/${encodeURIComponent(id)}`
}
