import { Check, FileDown, Play, RotateCcw } from 'lucide-react'
import { useEffect, useReducer } from 'react'
import { Button, CodeViewer, Icon, ProgressBar } from '@/components/ui'
import { GENERATION_STEPS } from '@/domain'
import { DEMO_COMPILE_COMMAND, DEMO_QUESTIONS, type DemoQuestion } from './demoQuestions'
import {
  generatorReducer,
  initialState,
  SOLUTION_STEP,
  STEP_COUNT,
  type GeneratorState,
} from './generatorState'
import styles from './LiveGenerator.module.css'
import { Pill } from './Pill'

// Pacing of the replay: about seven seconds from click to finished question.
const STEP_MS = 1100
const LINE_MS = 45

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function solutionLines(question: DemoQuestion): string[] {
  return question.solution.replace(/\n$/, '').split('\n')
}

function passedText(question: DemoQuestion): string {
  const total = String(question.cases.length)
  return `${total} de ${total} casos de teste passaram.`
}

function CasesTable({ question, executed }: { question: DemoQuestion; executed: boolean }) {
  return (
    <table className={styles.table}>
      <caption className={styles.caption}>
        {executed ? 'Saída obtida ao executar a solução' : 'Entradas criadas para a questão'}
      </caption>
      <thead>
        <tr>
          <th scope="col">Entrada</th>
          <th scope="col">Saída esperada</th>
          {executed && <th scope="col">Resultado</th>}
        </tr>
      </thead>
      <tbody>
        {question.cases.map((testCase) => (
          <tr key={testCase.input}>
            <td className={styles.data}>{testCase.input}</td>
            <td className={executed ? styles.data : styles.waiting}>
              {executed ? testCase.output : 'aguardando a execução'}
            </td>
            {executed && (
              <td>
                <span className={styles.passed}>
                  <Icon icon={Check} />
                  Passou
                </span>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Stage({ state, question }: { state: GeneratorState; question: DemoQuestion }) {
  if (state.phase === 'idle') {
    return (
      <div className={styles.intro}>
        <p>
          Escolha um conteúdo e clique em Gerar questão para ver as cinco etapas com uma questão de
          exemplo. As saídas esperadas vêm da execução da solução.
        </p>
        <ol className={styles.introSteps}>
          {GENERATION_STEPS.map((step) => (
            <li key={step.id}>{step.label}</li>
          ))}
        </ol>
      </div>
    )
  }

  if (state.phase === 'done') {
    return (
      <div className={styles.result}>
        <p className={styles.resultTitle}>{question.title}</p>
        <div className={styles.pills}>
          <Pill tone="primary">{question.content}</Pill>
          <Pill mono>{question.difficulty}</Pill>
        </div>
        <p className={styles.verified}>{passedText(question)}</p>
        <CasesTable question={question} executed />
        <p className={styles.file}>
          <Icon icon={FileDown} size="md" />
          Moodle_Questionnaire.xml pronto para importar
        </p>
      </div>
    )
  }

  const stepId = GENERATION_STEPS[state.completed]?.id
  if (stepId === 'statement') {
    return (
      <div className={styles.result}>
        <p className={styles.resultTitle}>{question.title}</p>
        <p>{question.statement}</p>
      </div>
    )
  }
  if (stepId === 'solution') {
    return (
      <CodeViewer
        code={solutionLines(question).slice(0, state.lines).join('\n')}
        filename="solucao.c"
        label={`Solução de referência de ${question.title}`}
      />
    )
  }
  if (stepId === 'testcases') return <CasesTable question={question} executed={false} />
  if (stepId === 'verification') {
    return (
      <div className={styles.result}>
        <p className={styles.command}>
          <span aria-hidden="true">$ </span>
          {DEMO_COMPILE_COMMAND}
        </p>
        <CasesTable question={question} executed />
      </div>
    )
  }
  return (
    <div className={styles.result}>
      <p className={styles.file}>
        <Icon icon={FileDown} size="md" />
        Moodle_Questionnaire.xml
      </p>
      <div className={styles.pills}>
        <Pill tone="accent">CodeRunner c_program</Pill>
        <Pill mono>{`${String(question.cases.length)} casos de teste`}</Pill>
      </div>
    </div>
  )
}

export function LiveGenerator() {
  const [state, dispatch] = useReducer(generatorReducer, DEMO_QUESTIONS[0]?.id ?? '', initialState)
  const question = DEMO_QUESTIONS.find((item) => item.id === state.questionId) ?? DEMO_QUESTIONS[0]
  const totalLines = question ? solutionLines(question).length : 0

  useEffect(() => {
    if (state.phase !== 'running') return
    const typing = state.completed === SOLUTION_STEP && state.lines < totalLines
    const timer = setTimeout(
      () => {
        dispatch({ type: typing ? 'reveal' : 'tick' })
      },
      typing ? LINE_MS : STEP_MS,
    )
    return () => {
      clearTimeout(timer)
    }
  }, [state.phase, state.completed, state.lines, totalLines])

  if (!question) return null

  const running = state.phase === 'running'
  const current = GENERATION_STEPS[state.completed]
  const position = Math.min(state.completed + 1, STEP_COUNT)
  const status =
    state.phase === 'done'
      ? `Questão pronta. ${passedText(question)}`
      : running && current
        ? current.headline
        : 'Pronto para gerar'

  return (
    <div className={styles.window}>
      <div className={styles.titlebar}>
        <span className={styles.appName}>CodeExpert</span>
        <span className={styles.screen}>Gerar questão · demonstração</span>
      </div>

      <div className={styles.controls}>
        <fieldset className={styles.contents} disabled={running}>
          <legend className={styles.legend}>Conteúdo</legend>
          <div className={styles.options}>
            {DEMO_QUESTIONS.map((item) => (
              <label key={item.id} className={styles.option}>
                <input
                  type="radio"
                  name="conteudo-demonstracao"
                  value={item.id}
                  checked={item.id === state.questionId}
                  onChange={() => {
                    dispatch({ type: 'select', questionId: item.id })
                  }}
                  className={styles.radio}
                />
                <span className={styles.optionLabel}>{item.content}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <Button
          variant="primary"
          size="lg"
          icon={state.phase === 'done' ? RotateCcw : Play}
          isLoading={running}
          onClick={() => {
            dispatch({
              type: 'start',
              instant: prefersReducedMotion(),
              solutionLines: totalLines,
            })
          }}
        >
          {state.phase === 'done' ? 'Gerar de novo' : 'Gerar questão'}
        </Button>
      </div>

      <div className={styles.status}>
        <ProgressBar
          value={state.phase === 'done' ? 100 : (state.completed / STEP_COUNT) * 100}
          label="Progresso da demonstração"
          valueText={
            state.phase === 'done'
              ? 'Concluída'
              : `Etapa ${String(position)} de ${String(STEP_COUNT)}`
          }
        />
        <p className={styles.statusText} aria-live="polite">
          {running && <span className={styles.stepCount}>{`${String(position)}/${String(STEP_COUNT)} `}</span>}
          {status}
        </p>
      </div>

      <div className={styles.stage}>
        <Stage state={state} question={question} />
      </div>
    </div>
  )
}
