import { ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Icon } from '../Icon'
import styles from './Disclosure.module.css'

export interface DisclosureProps {
  summary: ReactNode
  icon?: LucideIcon
  framed?: boolean
  defaultOpen?: boolean
  onToggle?: (open: boolean) => void
  children: ReactNode
}

export function Disclosure({
  summary,
  icon,
  framed = false,
  defaultOpen,
  onToggle,
  children,
}: DisclosureProps) {
  return (
    <details
      className={cx(styles.details, framed && styles.framed)}
      open={defaultOpen}
      onToggle={
        onToggle &&
        ((event) => {
          onToggle(event.currentTarget.open)
        })
      }
    >
      <summary className={styles.summary}>
        {icon && <Icon icon={icon} size="md" />}
        <span className={styles.label}>{summary}</span>
        <Icon icon={ChevronDown} className={styles.chevron} />
      </summary>
      <div className={styles.content}>{children}</div>
    </details>
  )
}
