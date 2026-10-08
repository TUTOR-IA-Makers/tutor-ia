import {
  currentStep,
  GENERATION_STEPS,
  isFinished,
  progressPercent,
  stepState,
  type Generation,
} from './generation'

const base: Generation = {
  questionId: 'q',
  runId: 'r',
  status: 'GERANDO',
  completedSteps: 3,
  failureReason: null,
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
})
