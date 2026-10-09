import type { Ref, TextareaHTMLAttributes } from 'react'
import { cx } from '@/lib/cx'
import { controlStyles } from '../TextInput'
import styles from './Textarea.module.css'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  ref?: Ref<HTMLTextAreaElement>
  showCount?: boolean
}

export function Textarea({
  className,
  showCount = false,
  maxLength,
  value,
  ...props
}: TextareaProps) {
  const length = typeof value === 'string' ? value.length : 0
  return (
    <div className={styles.wrapper}>
      <textarea
        className={cx(controlStyles.control, styles.textarea, className)}
        maxLength={maxLength}
        value={value}
        {...props}
      />
      {showCount && maxLength !== undefined && (
        <span className={styles.count} aria-hidden="true">
          {length}/{maxLength}
        </span>
      )}
    </div>
  )
}
