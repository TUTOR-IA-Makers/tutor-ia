import type { ReactNode } from 'react'
import styles from './SectionHeader.module.css'

export interface SectionHeaderProps {
  id: string
  eyebrow: string
  title: ReactNode
  lead?: ReactNode
}

export function SectionHeader({ id, eyebrow, title, lead }: SectionHeaderProps) {
  return (
    <header className={styles.header}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h2 id={id} className={styles.title}>
        {title}
      </h2>
      {lead && <p className={styles.lead}>{lead}</p>}
    </header>
  )
}
