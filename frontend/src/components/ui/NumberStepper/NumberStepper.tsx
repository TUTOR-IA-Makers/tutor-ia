import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { Icon } from '../Icon'
import { clamp } from './clamp'
import styles from './NumberStepper.module.css'

export interface NumberStepperProps {
  id?: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  onBlur?: () => void
  decrementLabel?: string
  incrementLabel?: string
  'aria-describedby'?: string
  'aria-invalid'?: true
}

export function NumberStepper({
  value,
  min,
  max,
  step = 1,
  onChange,
  onBlur,
  decrementLabel = 'Diminuir',
  incrementLabel = 'Aumentar',
  ...inputProps
}: NumberStepperProps) {
  const [draft, setDraft] = useState<string | null>(null)

  const commit = (raw: string) => {
    const parsed = Number.parseInt(raw, 10)
    onChange(Number.isNaN(parsed) ? value : clamp(parsed, min, max))
    setDraft(null)
  }

  return (
    <div className={styles.stepper}>
      <button
        type="button"
        className={styles.button}
        aria-label={decrementLabel}
        disabled={value <= min}
        onClick={() => {
          onChange(clamp(value - step, min, max))
        }}
      >
        <Icon icon={Minus} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        className={styles.input}
        min={min}
        max={max}
        step={step}
        value={draft ?? String(value)}
        onChange={(event) => {
          setDraft(event.target.value)
        }}
        onBlur={(event) => {
          commit(event.target.value)
          onBlur?.()
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit(event.currentTarget.value)
        }}
        {...inputProps}
      />
      <button
        type="button"
        className={styles.button}
        aria-label={incrementLabel}
        disabled={value >= max}
        onClick={() => {
          onChange(clamp(value + step, min, max))
        }}
      >
        <Icon icon={Plus} />
      </button>
    </div>
  )
}
