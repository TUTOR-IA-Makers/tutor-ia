import { screen, waitFor, within } from '@testing-library/react'
import { GENERATION_STEPS, type Generation, type QuestionDraft } from '@/domain'
import { HttpError } from '@/lib/http'
import { createTestServices, renderInRouter } from '@/test/render'
import { createClock, withQuestions } from '@/test/services'
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

const draft: QuestionDraft = {
  contentId: 'vetores',
  difficulty: { min: 800, max: 900 },
  testCaseCount: 4,
  testCaseHints: '',
  context: '',
  structures: { required: [], allowed: [], forbidden: [] },
}

const generating: Generation = {
  questionId: 'q-0143',
  runId: 'run-abc',
  status: 'GERANDO',
  completedSteps: 3,
  failureReason: null,
  resumable: false,
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
      await screen.findByText('A geração parou em: Compilar e testar', {}, { timeout: 4000 }),
    ).toBeInTheDocument()
    expect(screen.getByText('A geração da questão parou na etapa:')).toBeInTheDocument()
    expect(screen.getByText('4 de 5: Compilar e testar')).toBeInTheDocument()
    expect(
      screen.getByRole('progressbar', { name: 'Etapa em que a geração parou' }),
    ).toHaveAttribute('aria-valuenow', '4')
    expect(screen.queryByText('Geração em andamento')).toBeNull()
    expect(screen.queryByText('Questão gerada')).toBeNull()
  })

  it('não mostra stack trace quando a falha traz um', async () => {
    const reason = 'Traceback (most recent call last):\n  File "pipeline.py", line 3, in run'
    const services = withQuestions({
      generation: () =>
        Promise.resolve({
          ...generating,
          completedSteps: 1,
          status: 'FALHOU_VERIFICACAO',
          failureReason: reason,
        }),
    })
    renderInRouter(<ProgressView question={summary} />, '/', { services })
    expect(await screen.findByText('2 de 5: Gerar solução em C')).toBeInTheDocument()
    expect(screen.getByText(/A solução de referência não ficou pronta/)).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent('Traceback')
    expect(document.body).not.toHaveTextContent('pipeline.py')
  })

  it('fechar e reabrir retoma a geração na etapa em que ela está', async () => {
    const { clock, now } = createClock()
    const services = createTestServices({ stepMs: 1000, now })
    const { id } = await services.questions.create(draft)
    const question = { ...summary, id }

    const first = renderInRouter(<ProgressView question={question} />, '/', { services })
    expect(await screen.findByText('Escrevendo o enunciado')).toBeInTheDocument()
    first.unmount()

    clock.now += 2500
    renderInRouter(<ProgressView question={question} />, '/', { services })
    expect(await screen.findByText('Criando os casos de teste')).toBeInTheDocument()
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('concluída')
    expect(items[1]).toHaveTextContent('concluída')
    expect(items[2]).toHaveAttribute('aria-current', 'step')
  })

  it('explica falha ao consultar o andamento', async () => {
    const services = withQuestions({ generation: () => Promise.reject(new HttpError(404, '')) })
    renderInRouter(<ProgressView question={summary} />, '/', { services })
    expect(await screen.findByRole('alert')).toHaveTextContent('Não encontrado')
  })
})
