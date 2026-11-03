import type { ReactNode } from 'react'
import styles from './PageHeader.module.css'

export interface PageHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  description?: ReactNode
  before?: ReactNode
  meta?: ReactNode
  actions?: ReactNode
}

export function PageHeader({
  title,
  subtitle,
  description,
  before,
  meta,
  actions,
}: PageHeaderProps) {
  return (
    <header className={styles.header}>
      {before}
      <div className={styles.row}>
        <div className={styles.heading}>
          <h1 className={styles.title}>
            {title}
            {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
          </h1>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {(Boolean(meta) || Boolean(actions)) && (
          <div className={styles.aside}>
            {meta}
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}
