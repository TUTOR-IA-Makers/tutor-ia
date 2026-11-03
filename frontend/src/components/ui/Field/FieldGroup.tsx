import { useId, type ReactNode } from 'react'
import styles from './Field.module.css'

export interface FieldGroupProps {
  legend: ReactNode
  hint?: ReactNode
  error?: string | undefined
  children: (describedById: string | undefined) => ReactNode
}

export function FieldGroup({ legend, hint, error, children }: FieldGroupProps) {
  const id = useId()
  const hintId = hint === undefined ? undefined : `${id}-hint`
  const errorId = error ? `${id}-error` : undefined
  const described = [hintId, errorId].filter(Boolean).join(' ') || undefined
  return (
    <fieldset className={styles.group} aria-describedby={described}>
      <legend className={styles.label}>{legend}</legend>
      {children(described)}
      {hintId && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {errorId && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  )
}
