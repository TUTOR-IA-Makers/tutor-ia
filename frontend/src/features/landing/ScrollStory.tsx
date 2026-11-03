import { Check, FileDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CodeViewer, Icon } from '@/components/ui'
import { cx } from '@/lib/cx'
import { CtaStrip } from './CtaStrip'
import { DEMO_COMPILE_COMMAND, DEMO_QUESTIONS, type DemoQuestion } from './demoQuestions'
import styles from './ScrollStory.module.css'
import { SectionHeader } from './SectionHeader'
import { useScrollProgress } from './useScrollProgress'

const STEPS = [
  {
    id: 'enunciado',
    title: 'Enunciado',
  },
  {
    id: 'solucao',
    title: 'Solução em C',
  },
  {
    id: 'casos',
    title: 'Casos de teste',
  },
  {
    id: 'execucao',
    title: 'Execução e validação',
  },
  {
    id: 'exportacao',
    title: 'Exportação',
  },
] as const

type StepId = (typeof STEPS)[number]['id']

function Panel({ step, question }: { step: StepId; question: DemoQuestion }) {
  if (step === 'enunciado') {
    return (
      <div className={styles.block}>
        <p className={styles.blockTitle}>{question.title}</p>
        <p>{question.statement}</p>
      </div>
    )
  }

  if (step === 'solucao') {
    return <CodeViewer code={question.solution} filename="solucao.c" label="Solução de exemplo" />
  }

  if (step === 'exportacao') {
    return (
      <div className={styles.block}>
        <p className={styles.file}>
          <Icon icon={FileDown} size="md" />
          Moodle_Questionnaire.xml
        </p>
        <p>
          Enunciado, solução e {String(question.cases.length)} casos de teste em formato CodeRunner.
          Você baixa o arquivo e o importa no banco de questões do curso.
        </p>
      </div>
    )
  }

  const executed = step === 'execucao'
  return (
    <div className={styles.block}>
      {executed && (
        <p className={styles.command}>
          <span aria-hidden="true">$ </span>
          {DEMO_COMPILE_COMMAND}
        </p>
      )}
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Entrada</th>
            <th scope="col">{executed ? 'Saída obtida' : 'Saída esperada'}</th>
          </tr>
        </thead>
        <tbody>
          {question.cases.map((testCase) => (
            <tr key={testCase.input}>
              <td className={styles.data}>{testCase.input}</td>
              <td className={executed ? styles.data : styles.waiting}>
                {executed ? (
                  <>
                    <Icon icon={Check} /> {testCase.output}
                  </>
                ) : (
                  'aguardando a execução'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ScrollStory() {
  const question = DEMO_QUESTIONS[0]
  const [active, setActive] = useState<StepId>('enunciado')
  const layoutRef = useScrollProgress<HTMLDivElement>()
  const refs = useRef(new Map<StepId, HTMLLIElement>())

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const elements = refs.current
    // A thin band at the middle of the viewport: the step crossing it is the current one.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id.replace('etapa-', '') as StepId)
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    for (const element of elements.values()) observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [])

  if (!question) return null

  return (
    <section className={styles.section} aria-labelledby="fluxo-titulo">
      <SectionHeader
        id="fluxo-titulo"
        eyebrow="O produto em ação"
        title="Do enunciado ao Moodle, em um fluxo."
      />
      <div ref={layoutRef} className={styles.layout}>
        <div className={styles.stickyColumn}>
          <div className={styles.window}>
            <div className={styles.titlebar}>
              <span className={styles.appName}>CodeExpert</span>
              <span className={styles.screen}>Exemplo · {question.title}</span>
            </div>
            <div className={styles.panel}>
              <div key={active} className={styles.panelContent}>
                <Panel step={active} question={question} />
              </div>
            </div>
          </div>
        </div>
        <ol className={styles.steps}>
          {STEPS.map((step, index) => (
            <li
              key={step.id}
              id={`etapa-${step.id}`}
              ref={(element) => {
                if (element) refs.current.set(step.id, element)
                else refs.current.delete(step.id)
              }}
              className={cx(styles.step, step.id === active && styles.current)}
            >
              <span className={styles.number}>
                Etapa {index + 1} de {STEPS.length}
              </span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
            </li>
          ))}
        </ol>
      </div>
      <CtaStrip location="apos-fluxo">Quer ver isso com os conteúdos da sua disciplina?</CtaStrip>
    </section>
  )
}
