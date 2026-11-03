import { seedQuestions } from './fixtures'
import { buildMockMoodleXml, escapeXml } from './moodleXml'

describe('moodleXml', () => {
  it('escapa caracteres especiais', () => {
    expect(escapeXml(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&apos;&amp;&apos;&lt;/a&gt;',
    )
  })

  it('monta um quiz com uma questão por item', () => {
    const [first] = seedQuestions()
    if (!first) throw new Error('fixture vazia')
    const xml = buildMockMoodleXml([{ ...first, title: 'A < B' }])
    expect(xml.startsWith('<?xml')).toBe(true)
    expect(xml).toContain('<name><text>A &lt; B</text></name>')
    expect(xml.match(/<question /g)).toHaveLength(1)
  })
})
