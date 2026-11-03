import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import styles from './StatusBadge.module.css'

export type BadgeTone = 'info' | 'warning' | 'success' | 'danger' | 'neutral'

export interface StatusBadgeProps {
  tone: BadgeTone
  children: ReactNode
}

export function StatusBadge({ tone, children }: StatusBadgeProps) {
  return (
    <span className={cx(styles.badge, styles[tone])} data-tone={tone}>
      <span className={styles.dot} aria-hidden="true" />
      {children}
    </span>
  )
}
