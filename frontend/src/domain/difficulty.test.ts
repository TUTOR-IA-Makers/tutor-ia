import {
  bandOf,
  bandRange,
  describeDifficulty,
  DIFFICULTY_BANDS,
  formatRating,
  isBandId,
  normalizeRange,
  overlapsBand,
  RATING_MAX,
  RATING_MIN,
  RATING_STEP,
  snapRating,
} from './difficulty'

describe('difficulty', () => {
  it.each([
    [512, 500],
    [524, 500],
    [526, 550],
    [100, RATING_MIN],
    [9999, RATING_MAX],
    [Number.NaN, RATING_MIN],
  ])('snapRating(%s) = %s', (input, expected) => {
    expect(snapRating(input)).toBe(expected)
  })

  it.each([
    [500, 'Muito fácil'],
    [950, 'Muito fácil'],
    [1000, 'Fácil'],
    [1400, 'Médio'],
    [1900, 'Difícil'],
    [2400, 'Muito difícil'],
    [3500, 'Muito difícil'],
  ])('classifica %s como %s', (rating, label) => {
    expect(bandOf(rating).label).toBe(label)
  })

  it('cobre todo o intervalo sem buracos', () => {
    const ranges = DIFFICULTY_BANDS.map((band) => bandRange(band.id))
    expect(ranges[0]?.min).toBe(RATING_MIN)
    expect(ranges.at(-1)?.max).toBe(RATING_MAX)
    ranges.slice(1).forEach((range, index) => {
      expect(range.min).toBe((ranges[index]?.max ?? 0) + RATING_STEP)
    })
  })

  it('descreve um intervalo pela faixa das pontas', () => {
    expect(describeDifficulty({ min: 1200, max: 1300 })).toBe('Fácil')
    expect(describeDifficulty({ min: 1200, max: 1600 })).toBe('Fácil a Médio')
  })

  it('formata o rating', () => {
    expect(formatRating({ min: 1200, max: 1600 })).toBe('1200 a 1600')
    expect(formatRating({ min: 800, max: 800 })).toBe('800')
  })

  it('verifica sobreposição com uma faixa', () => {
    expect(overlapsBand({ min: 1300, max: 1500 }, 'facil')).toBe(true)
    expect(overlapsBand({ min: 1300, max: 1500 }, 'medio')).toBe(true)
    expect(overlapsBand({ min: 1300, max: 1500 }, 'dificil')).toBe(false)
  })

  it('normaliza pontas invertidas e fora do passo', () => {
    expect(normalizeRange({ min: 1612, max: 1190 })).toEqual({ min: 1200, max: 1600 })
  })

  it('valida identificadores de faixa', () => {
    expect(isBandId('medio')).toBe(true)
    expect(isBandId('N2')).toBe(false)
  })
})
