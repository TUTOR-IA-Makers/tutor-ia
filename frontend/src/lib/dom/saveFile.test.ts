import { saveFile } from './saveFile'

describe('saveFile', () => {
  it('cria um link temporário de download e libera a URL', () => {
    const createObjectURL = vi.fn(() => 'blob:fake')
    const revokeObjectURL = vi.fn()
    Object.assign(URL, { createObjectURL, revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    saveFile({ filename: 'questoes.xml', blob: new Blob(['<quiz/>']) })

    expect(createObjectURL).toHaveBeenCalledOnce()
    const anchor = click.mock.contexts[0] as HTMLAnchorElement
    expect(anchor.download).toBe('questoes.xml')
    expect(anchor.isConnected).toBe(false)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake')
  })
})
