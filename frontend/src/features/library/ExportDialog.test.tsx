import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpError } from '@/lib/http'
import { createTestQueryClient, renderInRouter } from '@/test/render'
import { withQuestions } from '@/test/services'
import { ExportDialog } from './ExportDialog'
import { MOODLE_IMPORT_STEPS } from './moodleImport'

const questions = [
  {
    id: 'q-0142',
    code: '#0142',
    title: 'Ano bissexto',
    description: '',
    contentId: 'condicionais',
    difficulty: { min: 1400, max: 1600 },
    status: 'GERADA' as const,
    testCaseCount: 6,
  },
]

describe('ExportDialog', () => {
  it('mostra as instruções de importação no Moodle', async () => {
    const user = userEvent.setup()
    renderInRouter(<ExportDialog open questions={questions} onClose={() => undefined} />)
    expect(screen.getByText('1 questão aprovada selecionada')).toBeInTheDocument()
    expect(screen.getByText('(Condicionais · Médio)')).toBeInTheDocument()
    await user.click(screen.getByText('Como importar no Moodle'))
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(
      expect.arrayContaining([...MOODLE_IMPORT_STEPS]),
    )
  })

  it('avisa quando o servidor recusa a exportação e recarrega a biblioteca', async () => {
    const user = userEvent.setup()
    const client = createTestQueryClient()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const services = withQuestions({
      exportMoodleXml: () =>
        Promise.reject(new HttpError(409, 'Só questões aprovadas podem ser exportadas.')),
    })
    renderInRouter(<ExportDialog open questions={questions} onClose={() => undefined} />, '/', {
      services,
      client,
    })
    await user.click(screen.getByRole('button', { name: 'Baixar XML' }))
    expect(await screen.findByText(/^Outra ação alterou esta questão/)).toHaveTextContent(
      'Carregamos a versão mais recente. Confira antes de continuar.',
    )
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['questions', 'list'] })
  })

  it('não exporta duas vezes enquanto o download está em andamento', async () => {
    const user = userEvent.setup()
    const exportMoodleXml = vi.fn(() => new Promise<never>(() => undefined))
    renderInRouter(<ExportDialog open questions={questions} onClose={() => undefined} />, '/', {
      services: withQuestions({ exportMoodleXml }),
    })
    const button = screen.getByRole('button', { name: 'Baixar XML' })
    await user.click(button)
    await waitFor(() => {
      expect(button).toBeDisabled()
    })
    await user.click(button)
    expect(exportMoodleXml).toHaveBeenCalledOnce()
  })

  it('desabilita o download sem questões', () => {
    renderInRouter(<ExportDialog open questions={[]} onClose={() => undefined} />)
    expect(screen.getByRole('button', { name: 'Baixar XML' })).toBeDisabled()
  })
})
