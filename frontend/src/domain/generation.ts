import type { QuestionStatus } from './question'

export const GENERATION_STEPS = [
  {
    id: 'statement',
    label: 'Criar enunciado',
    headline: 'Escrevendo o enunciado',
    description:
      'Estamos redigindo o enunciado a partir do conteúdo e das regras que você escolheu.',
  },
  {
    id: 'solution',
    label: 'Gerar solução em C',
    headline: 'Gerando a solução',
    description: 'Estamos escrevendo a solução de referência em C.',
  },
  {
    id: 'testcases',
    label: 'Criar casos de teste',
    headline: 'Criando os casos de teste',
    description: 'Estamos criando as entradas que vão exercitar a solução.',
  },
  {
    id: 'verification',
    label: 'Compilar e testar',
    headline: 'Verificando a solução',
    description: 'Estamos compilando o código e executando os casos de teste.',
  },
  {
    id: 'export',
    label: 'Preparar exportação',
    headline: 'Preparando a exportação',
    description: 'Estamos montando a questão no formato do Moodle.',
  },
] as const

export type GenerationStep = (typeof GENERATION_STEPS)[number]
export type GenerationStepId = GenerationStep['id']

export interface Generation {
  questionId: string
  runId: string
  status: QuestionStatus
  completedSteps: number
  failureReason: string | null
}

export type StepState = 'done' | 'current' | 'pending' | 'failed'

export function isFinished(generation: Pick<Generation, 'status'>): boolean {
  return generation.status !== 'GERANDO'
}

export function currentStep(generation: Generation): GenerationStep | null {
  if (generation.status !== 'GERANDO') return null
  return GENERATION_STEPS[Math.min(generation.completedSteps, GENERATION_STEPS.length - 1)] ?? null
}

export function stepState(generation: Generation, index: number): StepState {
  if (index < generation.completedSteps) return 'done'
  if (index > generation.completedSteps) return 'pending'
  if (generation.status === 'FALHOU_VERIFICACAO') return 'failed'
  return generation.status === 'GERANDO' ? 'current' : 'done'
}

export function progressPercent(generation: Generation): number {
  if (generation.status !== 'GERANDO' && generation.status !== 'FALHOU_VERIFICACAO') return 100
  return Math.round((generation.completedSteps / GENERATION_STEPS.length) * 100)
}
