import { z } from 'zod/mini'
import {
  conflicts,
  DEFAULT_DIFFICULTY,
  RATING_MAX,
  RATING_MIN,
  RATING_STEP,
  type QuestionDraft,
} from '@/domain'

export const TEST_CASES_MIN = 1
export const TEST_CASES_MAX = 20
export const TEST_CASE_HINTS_MAX = 1000
export const CONTEXT_MAX = 300

const onStep = (value: number) => (value - RATING_MIN) % RATING_STEP === 0

export const generateSchema = z.object({
  contentId: z.string().check(z.minLength(1, 'Escolha o conteúdo da questão.')),
  difficulty: z
    .object({
      min: z.number().check(z.minimum(RATING_MIN), z.maximum(RATING_MAX)),
      max: z.number().check(z.minimum(RATING_MIN), z.maximum(RATING_MAX)),
    })
    .check(
      z.refine(({ min, max }) => min <= max, 'A dificuldade mínima não pode passar da máxima.'),
      z.refine(
        ({ min, max }) => onStep(min) && onStep(max),
        `A dificuldade anda de ${String(RATING_STEP)} em ${String(RATING_STEP)}.`,
      ),
    ),
  testCaseCount: z
    .number()
    .check(
      z.refine(Number.isInteger, 'Use um número inteiro de casos.'),
      z.minimum(TEST_CASES_MIN, `Peça pelo menos ${String(TEST_CASES_MIN)} caso de teste.`),
      z.maximum(TEST_CASES_MAX, `Peça no máximo ${String(TEST_CASES_MAX)} casos de teste.`),
    ),
  testCaseHints: z
    .string()
    .check(
      z.maxLength(TEST_CASE_HINTS_MAX, `Use no máximo ${String(TEST_CASE_HINTS_MAX)} caracteres.`),
    ),
  context: z
    .string()
    .check(z.maxLength(CONTEXT_MAX, `Use no máximo ${String(CONTEXT_MAX)} caracteres.`)),
  structures: z
    .object({
      required: z.array(z.string()),
      allowed: z.array(z.string()),
      forbidden: z.array(z.string()),
    })
    .check(
      z.refine(
        (rules) => rules.required.length > 0,
        'Escolha pelo menos uma estrutura obrigatória.',
      ),
      z.refine(
        (rules) => conflicts(rules).length === 0,
        'Uma estrutura não pode ser obrigatória e proibida ao mesmo tempo.',
      ),
    ),
})

export type GenerateFormValues = z.infer<typeof generateSchema>

export const DEFAULT_VALUES: QuestionDraft = {
  contentId: '',
  difficulty: DEFAULT_DIFFICULTY,
  testCaseCount: 6,
  testCaseHints: '',
  context: '',
  structures: { required: [], allowed: ['scanf-printf', 'tipos-primitivos'], forbidden: [] },
}
