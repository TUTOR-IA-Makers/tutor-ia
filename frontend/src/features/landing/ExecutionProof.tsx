import { ArrowRight, Play, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, CodeViewer, Icon } from '@/components/ui'
import { cx } from '@/lib/cx'
import { trackEvent } from './analytics'
import { CtaStrip } from './CtaStrip'
import { DEMO_COMPILE_COMMAND, DEMO_QUESTIONS } from './demoQuestions'
import styles from './ExecutionProof.module.css'
import { SectionHeader } from './SectionHeader'

const STAGES = ['Código', 'Compilação', 'Execução', 'Saída esperada'] as const
const STAGE_MS = 900

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function ExecutionProof() {
  const question = DEMO_QUESTIONS[0]
  // 0 = not started; 1..4 = stage reached. Nothing starts without a click.
  const [reached, setReached] = useState(0)
  const running = reached > 0 && reached < STAGES.length

  useEffect(() => {
    if (!running) return
    const timer = setTimeout(() => {
      setReached((value) => value + 1)
    }, STAGE_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [running, reached])

  if (!question) return null

  const done = reached === STAGES.length

  return (
    <section className={styles.band} aria-labelledby="prova-titulo">
      <div className={styles.inner}>
        <SectionHeader
          id="prova-titulo"
          eyebrow="A diferença"
          title="A saída esperada não é um palpite da IA."
          lead="Ela vem da execução da solução compilada."
        />

        <ol className={styles.flow} aria-label="Do código à saída esperada">
          {STAGES.map((stage, index) => (
            <li
              key={stage}
              className={cx(styles.stage, index < reached && styles.reached)}
              aria-current={index === reached - 1 ? 'step' : undefined}
            >
              {stage}
              {index < STAGES.length - 1 && <Icon icon={ArrowRight} className={styles.arrow} />}
            </li>
          ))}
        </ol>

        <div className={styles.columns}>
          <CodeViewer code={question.solution} filename="solucao.c" label="Solução de exemplo" />

          <div className={styles.terminal}>
            <div className={styles.terminalBar}>
              <span>Terminal · exemplo</span>
              <Button
                variant="accent"
                icon={done ? RotateCcw : Play}
                isLoading={running}
                onClick={() => {
                  trackEvent('proof_run')
                  setReached(prefersReducedMotion() ? STAGES.length : 1)
                }}
              >
                {done ? 'Repetir' : 'Compilar e executar'}
              </Button>
            </div>
            <div className={styles.output} aria-live="polite">
              {reached === 0 && <p className={styles.muted}>Clique em Compilar e executar.</p>}
              {reached >= 2 && (
                <p className={styles.line}>
                  <span aria-hidden="true">$ </span>
                  {DEMO_COMPILE_COMMAND}
                </p>
              )}
              {reached >= 3 &&
                question.cases.map((testCase) => (
                  <p key={testCase.input} className={styles.line}>
                    <span className={styles.muted}>{`entrada ${testCase.input}`}</span>
                  </p>
                ))}
              {done &&
                question.cases.map((testCase) => (
                  <p key={testCase.input} className={styles.result}>
                    {`${testCase.input} → ${testCase.output}`}
                  </p>
                ))}
            </div>
            <p className={styles.note}>Exemplo gravado: saídas obtidas com gcc.</p>
          </div>
        </div>

        <CtaStrip location="apos-prova">
          Veja a execução acontecer com as suas próprias questões.
        </CtaStrip>
      </div>
    </section>
  )
}
