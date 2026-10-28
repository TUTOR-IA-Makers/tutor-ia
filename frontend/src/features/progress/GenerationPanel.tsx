import { Panel, ProgressBar, Spinner } from '@/components/ui'
import { currentStep, GENERATION_STEPS, progressPercent, type Generation } from '@/domain'
import styles from './GenerationPanel.module.css'

export interface GenerationPanelProps {
  generation: Generation
}

export function GenerationPanel({ generation }: GenerationPanelProps) {
  const step = currentStep(generation)
  const position = Math.min(generation.completedSteps + 1, GENERATION_STEPS.length)
  const stepText = `Etapa ${String(position)} de ${String(GENERATION_STEPS.length)}`
  return (
    <Panel tone="primary">
      <div className={styles.layout}>
        <div className={styles.text}>
          <p className={styles.eyebrow}>Geração em andamento</p>
          <p className={styles.headline}>{step?.headline ?? 'Finalizando'}</p>
          <p>{step?.description ?? 'Estamos conferindo o resultado.'}</p>
        </div>
        <span className={styles.spinner}>
          <Spinner size="md" />
        </span>
      </div>
      <ProgressBar
        value={progressPercent(generation)}
        label="Progresso da geração"
        valueText={stepText}
      />
      <p className={styles.step} aria-live="polite">
        {stepText}
        {step && <span className="visually-hidden">: {step.label}</span>}
      </p>
    </Panel>
  )
}
