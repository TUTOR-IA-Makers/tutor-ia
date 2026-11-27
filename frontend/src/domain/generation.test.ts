import {
  currentStep,
  failedStep,
  failureSummary,
  GENERATION_STEPS,
  isFinished,
  progressPercent,
  stepPosition,
  stepState,
  type Generation,
} from './generation'

const base: Generation = {
  questionId: 'q',
  runId: 'r',
  status: 'GERANDO',
  completedSteps: 3,
  failureReason: null,
  resumable: false,
}

describe('generation', () => {
  it('tem cinco etapas', () => {
    expect(GENERATION_STEPS).toHaveLength(5)
  })

  it('aponta a etapa atual enquanto gera', () => {
    expect(currentStep(base)?.label).toBe('Compilar e testar')
    expect(currentStep({ ...base, status: 'GERADA' })).toBeNull()
  })

  it('classifica cada etapa', () => {
    expect([0, 1, 2, 3, 4].map((index) => stepState(base, index))).toEqual([
      'done',
      'done',
      'done',
      'current',
      'pending',
    ])
    expect(stepState({ ...base, status: 'FALHOU_VERIFICACAO' }, 3)).toBe('failed')
    expect(stepState({ ...base, status: 'GERADA', completedSteps: 5 }, 4)).toBe('done')
  })

  it('calcula o progresso', () => {
    expect(progressPercent(base)).toBe(60)
    expect(progressPercent({ ...base, status: 'GERADA' })).toBe(100)
  })

  it('sabe quando terminou', () => {
    expect(isFinished(base)).toBe(false)
    expect(isFinished({ status: 'APROVADA' })).toBe(true)
  })

  it('aponta a etapa em que a geração parou', () => {
    const failed = { ...base, status: 'FALHOU_VERIFICACAO' as const }
    expect(failedStep(base)).toBeNull()
    expect(failedStep(failed)?.label).toBe('Compilar e testar')
    expect(failedStep({ ...failed, completedSteps: 0 })?.id).toBe('statement')
    expect(failedStep({ ...failed, completedSteps: 9 })?.id).toBe('export')
  })

  it('dá a posição e um caminho de saída para cada etapa', () => {
    expect(GENERATION_STEPS.map(stepPosition)).toEqual([1, 2, 3, 4, 5])
    for (const step of GENERATION_STEPS) expect(step.recovery).toMatch(/Gere de novo\./)
  })

  it('resume o motivo da falha sem detalhe técnico', () => {
    expect(failureSummary(null)).toBeNull()
    expect(failureSummary('  \n ')).toBeNull()
    expect(failureSummary('\nA solução usou repetição.\nlinha 2')).toBe('A solução usou repetição.')
    expect(failureSummary('Traceback (most recent call last):\n  File "x.py", line 1')).toBeNull()
    expect(failureSummary('Error: boom\n    at run (pipeline.js:3:1)')).toBeNull()
    const long = failureSummary('a'.repeat(500))
    expect(long).toHaveLength(240)
    expect(long?.endsWith('…')).toBe(true)
  })
})
