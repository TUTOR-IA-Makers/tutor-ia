import { Callout, ProgressBar } from '@/components/ui'
import {
  failedStep,
  failureSummary,
  GENERATION_STEPS,
  stepPosition,
  type Generation,
  type GenerationStep,
} from '@/domain'
import styles from './GenerationFailure.module.css'

export interface GenerationFailureProps {
  generation: Generation
}

export function GenerationFailure({ generation }: GenerationFailureProps) {
  const step = failedStep(generation)
  if (!step) return null
  if (generation.resumable) {
    return (
      <div className={styles.failure}>
        <Callout tone="warning" title="A geração da questão foi interrompida na etapa:" />
        <StoppedAt step={step} />
      </div>
    )
  }
  const summary = failureSummary(generation.failureReason)
  return (
    <div className={styles.failure}>
      <Callout tone="danger" title="A geração da questão parou na etapa:">
        <div className={styles.body}>
          {summary && <p className={styles.reason}>{summary}</p>}
          <p>{step.recovery}</p>
        </div>
      </Callout>
      <StoppedAt step={step} />
    </div>
  )
}

function StoppedAt({ step }: { step: GenerationStep }) {
  const position = stepPosition(step)
  const total = GENERATION_STEPS.length
  return (
    <div className={styles.stoppedAt}>
      <p className={styles.step}>
        {String(position)} de {String(total)}: {step.label}
      </p>
      <ProgressBar
        value={position}
        max={total}
        className={styles.bar}
        label="Etapa em que a geração parou"
        valueText={`Etapa ${String(position)} de ${String(total)}`}
      />
    </div>
  )
}
