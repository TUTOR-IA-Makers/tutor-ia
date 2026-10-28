import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpError } from '@/lib/http'
import { saveFile } from '@/lib/dom'
import { blockingViolations } from '@/test/axe'
import { renderInRouter } from '@/test/render'
import { withQuestions } from '@/test/services'
import { LibraryView } from './LibraryView'

vi.mock('@/lib/dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/dom')>()),
  saveFile: vi.fn(),
}))

async function renderLibrary(path = '/biblioteca', services = withQuestions({})) {
  const view = renderInRouter(<LibraryView />, path, { services })
  await screen.findByRole('list', { name: 'Questões' })
  return view
}

describe('LibraryView', () => {
  it('lista as questões em cards com estado e ação', async () => {
    await renderLibrary()
    const cards = within(screen.getByRole('list', { name: 'Questões' })).getAllByRole('article')
    expect(cards).toHaveLength(7)
    expect(screen.getByRole('link', { name: 'Gerar questão' })).toHaveAttribute('href', '/gerar')
  })

  it('filtra por status e grava o filtro no endereço', async () => {
    const user = userEvent.setup()
    const { router } = await renderLibrary()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'APROVADA')
    await waitFor(() => {
      expect(screen.getAllByRole('article')).toHaveLength(3)
    })
    expect(router.state.location.search).toBe('?estado=APROVADA')
  })

  it('lê filtros do endereço ao abrir', async () => {
    await renderLibrary('/biblioteca?conteudo=vetores&dificuldade=dificil')
    expect(
      screen.getAllByRole('article').map((card) => card.getAttribute('aria-labelledby')),
    ).toEqual(['q-0144-title'])
    expect(screen.getByRole('combobox', { name: 'Conteúdo' })).toHaveValue('vetores')
  })

  it('busca pelo título com atraso para não sobrecarregar o servidor', async () => {
    const user = userEvent.setup()
    const { router } = await renderLibrary()
    await user.type(screen.getByRole('searchbox', { name: 'Buscar questões' }), 'bissexto')
    await waitFor(() => {
      expect(screen.getAllByRole('article')).toHaveLength(1)
    })
    expect(router.state.location.search).toBe('?busca=bissexto')
  })

  it('orienta quando o filtro não encontra nada e limpa os filtros', async () => {
    const user = userEvent.setup()
    renderInRouter(<LibraryView />, '/biblioteca?busca=inexistente', {
      services: withQuestions({}),
    })
    expect(
      await screen.findByRole('heading', { name: 'Nenhuma questão com esses filtros' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    await waitFor(() => {
      expect(screen.getAllByRole('article')).toHaveLength(7)
    })
    expect(screen.getByRole('searchbox')).toHaveValue('')
  })

  it('mostra estado vazio convidando a gerar a primeira questão', async () => {
    renderInRouter(<LibraryView />, '/biblioteca', {
      services: withQuestions({ list: () => Promise.resolve([]) }),
    })
    expect(await screen.findByRole('link', { name: 'Gerar primeira questão' })).toHaveAttribute(
      'href',
      '/gerar',
    )
  })

  it('explica a falha e permite tentar de novo', async () => {
    const user = userEvent.setup()
    const list = vi.fn().mockRejectedValueOnce(new HttpError(500, '')).mockResolvedValue([])
    renderInRouter(<LibraryView />, '/biblioteca', { services: withQuestions({ list }) })
    expect(await screen.findByRole('alert')).toHaveTextContent('Erro no servidor')
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByText('Sua biblioteca está vazia')).toBeInTheDocument()
  })

  it('só permite selecionar aprovadas e exporta o XML do lote', async () => {
    const user = userEvent.setup()
    const save = vi.mocked(saveFile)
    await renderLibrary()
    expect(screen.getAllByRole('checkbox')).toHaveLength(3)
    expect(screen.queryByRole('region', { name: 'Questões selecionadas' })).toBeNull()

    await user.click(screen.getByRole('checkbox', { name: 'Selecionar Maior de três números' }))
    await user.click(
      screen.getByRole('checkbox', { name: 'Selecionar Cálculo de média ponderada' }),
    )
    const bar = screen.getByRole('region', { name: 'Questões selecionadas' })
    expect(bar).toHaveTextContent('2 questões aprovadas selecionadas')

    await user.click(within(bar).getByRole('button', { name: 'Exportar XML' }))
    const dialog = screen.getByRole('dialog', { name: 'Exportar questões' })
    expect(within(dialog).getByText('Maior de três números')).toBeInTheDocument()
    expect(within(dialog).getByText('questoes_codeexpert.xml')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Baixar XML' }))
    await waitFor(() => {
      expect(save).toHaveBeenCalledOnce()
    })
    expect(save.mock.calls[0]?.[0].filename).toBe('questoes_codeexpert.xml')
    expect(within(dialog).getByText('XML exportado')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Voltar à biblioteca' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('limpa a seleção', async () => {
    const user = userEvent.setup()
    await renderLibrary()
    await user.click(screen.getByRole('checkbox', { name: 'Selecionar Maior de três números' }))
    expect(screen.getByRole('region', { name: 'Questões selecionadas' })).toHaveTextContent(
      '1 questão aprovada selecionada',
    )
    await user.click(screen.getByRole('button', { name: 'Limpar seleção' }))
    expect(screen.queryByRole('region', { name: 'Questões selecionadas' })).toBeNull()
  })

  it('não tem violações sérias de acessibilidade', async () => {
    const { container } = await renderLibrary()
    expect(await blockingViolations(container)).toEqual([])
  })
})
