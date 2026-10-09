export const RATING_MIN = 500
export const RATING_MAX = 3500
export const RATING_STEP = 50

export interface DifficultyRange {
  min: number
  max: number
}

export const DEFAULT_DIFFICULTY: DifficultyRange = { min: 1200, max: 1600 }

export const DIFFICULTY_BANDS = [
  { id: 'muito-facil', label: 'Muito fácil', max: 950 },
  { id: 'facil', label: 'Fácil', max: 1350 },
  { id: 'medio', label: 'Médio', max: 1850 },
  { id: 'dificil', label: 'Difícil', max: 2350 },
  { id: 'muito-dificil', label: 'Muito difícil', max: RATING_MAX },
] as const

export type DifficultyBand = (typeof DIFFICULTY_BANDS)[number]
export type DifficultyBandId = DifficultyBand['id']

export function snapRating(value: number): number {
  if (!Number.isFinite(value)) return RATING_MIN
  const stepped = Math.round(value / RATING_STEP) * RATING_STEP
  return Math.min(RATING_MAX, Math.max(RATING_MIN, stepped))
}

export function bandOf(rating: number): DifficultyBand {
  const snapped = snapRating(rating)
  return DIFFICULTY_BANDS.find((band) => snapped <= band.max) ?? DIFFICULTY_BANDS[4]
}

export function isBandId(value: unknown): value is DifficultyBandId {
  return DIFFICULTY_BANDS.some((band) => band.id === value)
}

export function bandRange(id: DifficultyBandId): DifficultyRange {
  const index = DIFFICULTY_BANDS.findIndex((band) => band.id === id)
  const previous = DIFFICULTY_BANDS[index - 1]
  const band = DIFFICULTY_BANDS[index] ?? DIFFICULTY_BANDS[4]
  return { min: previous ? previous.max + RATING_STEP : RATING_MIN, max: band.max }
}

export function overlapsBand(range: DifficultyRange, id: DifficultyBandId): boolean {
  const band = bandRange(id)
  return range.min <= band.max && range.max >= band.min
}

export function describeDifficulty({ min, max }: DifficultyRange): string {
  const low = bandOf(min).label
  const high = bandOf(max).label
  return low === high ? low : `${low} a ${high}`
}

export function formatRating({ min, max }: DifficultyRange): string {
  return min === max ? String(min) : `${String(min)} a ${String(max)}`
}

export function normalizeRange(range: DifficultyRange): DifficultyRange {
  const a = snapRating(range.min)
  const b = snapRating(range.max)
  return a <= b ? { min: a, max: b } : { min: b, max: a }
}
