import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import styles from './Pill.module.css'

export interface PillProps {
  tone?: 'neutral' | 'primary' | 'accent'
  mono?: boolean
  children: ReactNode
}

// The app's Tag is sized for dense screens; the landing keeps every label at body size.
export function Pill({ tone = 'neutral', mono = false, children }: PillProps) {
  return <span className={cx(styles.pill, styles[tone], mono && styles.mono)}>{children}</span>
}
