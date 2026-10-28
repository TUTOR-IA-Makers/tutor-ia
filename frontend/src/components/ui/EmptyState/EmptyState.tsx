import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Icon } from '../Icon'
import styles from './EmptyState.module.css'

export interface EmptyStateProps {
  icon: LucideIcon
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  headingLevel?: 1 | 2
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  headingLevel = 2,
}: EmptyStateProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2'
  return (
    <div className={styles.empty}>
      <span className={styles.icon}>
        <Icon icon={icon} size="md" />
      </span>
      <Heading className={styles.title}>{title}</Heading>
      {description && <p className={styles.description}>{description}</p>}
      {action}
    </div>
  )
}
