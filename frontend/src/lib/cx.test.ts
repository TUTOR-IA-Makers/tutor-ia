import { cx } from './cx'

describe('cx', () => {
  it('junta apenas as classes presentes', () => {
    expect(cx('a', false, undefined, 'b', null, '')).toBe('a b')
  })

  it('retorna string vazia sem classes', () => {
    expect(cx()).toBe('')
  })
})
