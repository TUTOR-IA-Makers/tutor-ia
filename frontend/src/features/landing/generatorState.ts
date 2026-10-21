import { GENERATION_STEPS } from '@/domain'

export const STEP_COUNT = GENERATION_STEPS.length
/** Index of the step during which the solution is typed line by line. */
export const SOLUTION_STEP = GENERATION_STEPS.findIndex((step) => step.id === 'solution')

export type Phase = 'idle' | 'running' | 'done'

export interface GeneratorState {
  questionId: string
  phase: Phase
  /** Steps finished so far; while running, it is also the index of the current step. */
  completed: number
  /** Lines of the solution already shown. */
  lines: number
}

export type GeneratorAction =
  | { type: 'select'; questionId: string }
  | { type: 'start'; instant: boolean; solutionLines: number }
  | { type: 'tick' }
  | { type: 'reveal' }

export function initialState(questionId: string): GeneratorState {
  return { questionId, phase: 'idle', completed: 0, lines: 0 }
}

export function generatorReducer(state: GeneratorState, action: GeneratorAction): GeneratorState {
  switch (action.type) {
    case 'select':
      if (state.phase === 'running') return state
      return initialState(action.questionId)
    case 'start':
      // With reduced motion the run is not replayed: the finished question appears at once.
      if (action.instant) {
        return { ...state, phase: 'done', completed: STEP_COUNT, lines: action.solutionLines }
      }
      return { ...state, phase: 'running', completed: 0, lines: 0 }
    case 'tick': {
      if (state.phase !== 'running') return state
      const completed = state.completed + 1
      return { ...state, completed, phase: completed >= STEP_COUNT ? 'done' : 'running' }
    }
    case 'reveal':
      return { ...state, lines: state.lines + 1 }
  }
}
