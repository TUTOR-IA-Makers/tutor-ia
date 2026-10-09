import type { ReactNode } from 'react'
import styles from './DescriptionList.module.css'

export interface DescriptionItem {
  term: ReactNode
  value: ReactNode
}

export interface DescriptionListProps {
  items: readonly DescriptionItem[]
}

export function DescriptionList({ items }: DescriptionListProps) {
  return (
    <dl className={styles.list}>
      {items.map((item, index) => (
        <div key={index} className={styles.row}>
          <dt className={styles.term}>{item.term}</dt>
          <dd className={styles.value}>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
