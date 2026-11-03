import { useId, type ReactNode } from 'react'
import { cx } from '@/lib/cx'
import styles from './Panel.module.css'

export type PanelTone = 'default' | 'primary' | 'accent' | 'muted'

export interface PanelProps {
  title?: ReactNode
  headingLevel?: 2 | 3
  description?: ReactNode
  actions?: ReactNode
  tone?: PanelTone
  className?: string
  children?: ReactNode
}

export function Panel({
  title,
  headingLevel = 2,
  description,
  actions,
  tone = 'default',
  className,
  children,
}: PanelProps) {
  const titleId = useId()
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <section
      className={cx(styles.panel, styles[tone], className)}
      aria-labelledby={title ? titleId : undefined}
    >
      {(Boolean(title) || Boolean(actions)) && (
        <header className={styles.header}>
          <div className={styles.heading}>
            {title && (
              <Heading id={titleId} className={styles.title}>
                {title}
              </Heading>
            )}
            {description && <p className={styles.description}>{description}</p>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
      )}
      {children}
    </section>
  )
}
