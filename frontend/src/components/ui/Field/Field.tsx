import { useId, type ReactNode } from 'react'
import { describedBy } from './describedBy'
import styles from './Field.module.css'

export interface FieldControlProps {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: true
  'aria-required'?: true
}

export interface FieldProps {
  label: ReactNode
  hint?: ReactNode
  error?: string | undefined
  required?: boolean
  optional?: boolean
  children: (control: FieldControlProps) => ReactNode
}

export function Field({ label, hint, error, required, optional, children }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const control: FieldControlProps = { id }
  const described = describedBy(hint !== undefined && hintId, error && errorId)
  if (described) control['aria-describedby'] = described
  if (error) control['aria-invalid'] = true
  if (required) control['aria-required'] = true

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
        {optional && <span className={styles.optional}>(opcional)</span>}
      </label>
      {children(control)}
      {hint !== undefined && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
