import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import styles from './Tag.module.css'

export type TagTone = 'neutral' | 'primary' | 'accent'

export interface TagProps {
  tone?: TagTone
  mono?: boolean
  children: ReactNode
}

export function Tag({ tone = 'neutral', mono = false, children }: TagProps) {
  return <span className={cx(styles.tag, styles[tone], mono && styles.mono)}>{children}</span>
}
