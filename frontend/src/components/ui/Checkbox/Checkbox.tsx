import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cx } from '@/lib/cx'
import styles from './Checkbox.module.css'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  hideLabel?: boolean
}

export function Checkbox({ label, hideLabel = false, className, id, ...props }: CheckboxProps) {
  const fallbackId = useId()
  const inputId = id ?? fallbackId
  return (
    <span className={cx(styles.wrapper, className)}>
      <input id={inputId} type="checkbox" className={styles.input} {...props} />
      <label htmlFor={inputId} className={cx(styles.label, hideLabel && 'visually-hidden')}>
        {label}
      </label>
    </span>
  )
}
