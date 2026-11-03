import type { CSSProperties } from 'react'
import styles from './ProgressBar.module.css'

export interface ProgressBarProps {
  value: number
  max?: number
  label: string
  valueText?: string
}

export function ProgressBar({ value, max = 100, label, valueText }: ProgressBarProps) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
    >
      <div className={styles.fill} style={{ '--progress': String(ratio) } as CSSProperties} />
    </div>
  )
}
