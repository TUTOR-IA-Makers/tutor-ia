import { screen, waitFor, within } from '@testing-library/react'
import { GENERATION_STEPS, type Generation } from '@/domain'
import { HttpError } from '@/lib/http'
import { renderInRouter } from '@/test/render'
import { withQuestions } from '@/test/services'
import { GenerationPanel } from './GenerationPanel'
import { ProgressView } from './ProgressView'
import { StepList } from './StepList'

const summary = {
  id: 'q-0143',
  code: '#0143',
  title: 'Soma de um vetor',
  description: '',
  contentId: 'vetores',
  difficulty: { min: 800, max: 900 },
  status: 'GERANDO' as const,
  testCaseCount: 4,
}

const generating: Generation = {
  questionId: 'q-0143',
  runId: 'run-abc',
  status: 'GERANDO',
  completedSteps: 3,
  failureReason: null,
}

describe('StepList', () => {
  it('marca etapas concluídas, a atual e as pendentes', () => {
    renderInRouter(<StepList generation={generating} />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(GENERATION_STEPS.length)
    expect(items[0]).toHaveTextContent('Criar enunciado, concluída')
    expect(items[3]).toHaveAttribute('aria-current', 'step')
    expect(items[4]).toHaveTextContent('aguardando')
  })

  it('mostra a etapa que falhou', () => {
    renderInRouter(<StepList generation={{ ...generating, status: 'FALHOU_VERIFICACAO' }} />)
    expect(screen.getAllByRole('listitem')[3]).toHaveTextContent('falhou')
  })
})

describe('GenerationPanel', () => {
  it('explica a etapa atual e anuncia a posição', () => {
    renderInRouter(<GenerationPanel generation={generating} />)
    expect(screen.getByText('Verificando a solução')).toBeInTheDocument()
    expect(
      screen.getByText('Estamos compilando o código e executando os casos de teste.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'Etapa 4 de 5')
  })

  it('tem texto de fechamento quando não há etapa atual', () => {
    renderInRouter(
      <GenerationPanel generation={{ ...generating, status: 'GERADA', completedSteps: 5 }} />,
    )
    expect(screen.getByText('Finalizando')).toBeInTheDocument()
  })
})

describe('ProgressView', () => {
  it('mostra painel, etapas, resumo e detalhes técnicos', async () => {
    const services = withQuestions({ generation: () => Promise.resolve(generating) })
    renderInRouter(<ProgressView question={summary} />, '/', { services })
    expect(await screen.findByText('Verificando a solução')).toBeInTheDocument()
    const card = screen.getByRole('region', { name: 'Soma de um vetor' })
    expect(within(card).getByText('Vetores')).toBeInTheDocument()
    expect(within(card).getByText('4')).toBeInTheDocument()
    expect(screen.getByText('run-abc')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar à biblioteca' })).toHaveAttribute(
      'href',
      '/biblioteca',
    )
  })

  it('avisa e recarrega a questão quando a geração termina', async () => {
    const generation = vi
      .fn()
      .mockResolvedValueOnce(generating)
      .mockResolvedValue({ ...generating, status: 'GERADA', completedSteps: 5 })
    const services = withQuestions({ generation })
    const { client } = renderInRouter(<ProgressView question={summary} />, '/', { services })
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    expect(await screen.findByText('Questão gerada', {}, { timeout: 4000 })).toBeInTheDocument()
    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['questions', 'detail', 'q-0143'] })
    })
  })

  it('avisa a falha quando a geração termina sem passar na verificação', async () => {
    const generation = vi
      .fn()
      .mockResolvedValueOnce(generating)
      .mockResolvedValue({ ...generating, status: 'FALHOU_VERIFICACAO' })
    const services = withQuestions({ generation })
    renderInRouter(<ProgressView question={summary} />, '/', { services })
    expect(
      await screen.findByText('A questão falhou na verificação', {}, { timeout: 4000 }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Questão gerada')).toBeNull()
  })

  it('explica falha ao consultar o andamento', async () => {
    const services = withQuestions({ generation: () => Promise.reject(new HttpError(404, '')) })
    renderInRouter(<ProgressView question={summary} />, '/', { services })
    expect(await screen.findByRole('alert')).toHaveTextContent('Não encontrado')
  })
})
