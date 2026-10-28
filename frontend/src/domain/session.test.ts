import { initials } from './session'

describe('initials', () => {
  it.each([
    ['Profa. Dra. Helena Silveira', 'HS'],
    ['Prof. Dr. João da Costa', 'JC'],
    ['Ana', 'A'],
    ['', '?'],
  ])('%s vira %s', (name, expected) => {
    expect(initials(name)).toBe(expected)
  })
})
