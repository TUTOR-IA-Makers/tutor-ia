import { generatorReducer, initialState, STEP_COUNT, type GeneratorState } from './generatorState'

describe('generatorReducer', () => {
  it('começa parado no conteúdo escolhido', () => {
    expect(initialState('lacos')).toEqual({
      questionId: 'lacos',
      phase: 'idle',
      completed: 0,
      lines: 0,
    })
  })

  it('percorre as cinco etapas e termina', () => {
    let state = generatorReducer(initialState('lacos'), {
      type: 'start',
      instant: false,
      solutionLines: 10,
    })
    expect(state.phase).toBe('running')
    for (let step = 1; step < STEP_COUNT; step++) {
      state = generatorReducer(state, { type: 'tick' })
      expect(state).toMatchObject({ phase: 'running', completed: step })
    }
    state = generatorReducer(state, { type: 'tick' })
    expect(state).toMatchObject({ phase: 'done', completed: STEP_COUNT })
    expect(generatorReducer(state, { type: 'tick' })).toBe(state)
  })

  it('mostra a questão pronta de uma vez quando o movimento é reduzido', () => {
    const state = generatorReducer(initialState('vetores'), {
      type: 'start',
      instant: true,
      solutionLines: 12,
    })
    expect(state).toEqual({ questionId: 'vetores', phase: 'done', completed: STEP_COUNT, lines: 12 })
  })

  it('revela a solução uma linha por vez', () => {
    const running: GeneratorState = { questionId: 'lacos', phase: 'running', completed: 1, lines: 3 }
    expect(generatorReducer(running, { type: 'reveal' }).lines).toBe(4)
  })

  it('não troca de conteúdo no meio de uma geração, mas troca depois', () => {
    const running: GeneratorState = { questionId: 'lacos', phase: 'running', completed: 2, lines: 0 }
    expect(generatorReducer(running, { type: 'select', questionId: 'vetores' })).toBe(running)
    const done: GeneratorState = { ...running, phase: 'done', completed: STEP_COUNT }
    expect(generatorReducer(done, { type: 'select', questionId: 'vetores' })).toEqual(
      initialState('vetores'),
    )
  })
})
