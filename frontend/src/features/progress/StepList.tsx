import { Check, X } from 'lucide-react'
import { Icon, Panel, Spinner } from '@/components/ui'
import { GENERATION_STEPS, stepState, type Generation, type StepState } from '@/domain'
import { cx } from '@/lib/cx'
import styles from './StepList.module.css'

const STATE_TEXT: Record<StepState, string> = {
  done: 'concluída',
  current: 'em andamento',
  pending: 'aguardando',
  failed: 'falhou',
}

function Marker({ state }: { state: StepState }) {
  if (state === 'done') return <Icon icon={Check} />
  if (state === 'failed') return <Icon icon={X} />
  if (state === 'current') return <Spinner size="sm" />
  return null
}

export interface StepListProps {
  generation: Generation
}

export function StepList({ generation }: StepListProps) {
  return (
    <Panel title="Etapas da geração">
      <ol className={styles.list}>
        {GENERATION_STEPS.map((step, index) => {
          const state = stepState(generation, index)
          return (
            <li
              key={step.id}
              className={cx(styles.step, styles[state])}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              <span className={styles.marker}>
                <Marker state={state} />
              </span>
              <span>{step.label}</span>
              <span className="visually-hidden">, {STATE_TEXT[state]}</span>
            </li>
          )
        })}
      </ol>
    </Panel>
  )
}
