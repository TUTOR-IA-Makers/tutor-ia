import { CircleAlert, CircleCheck, Info, ShieldCheck, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Icon } from '../Icon'
import styles from './Callout.module.css'

export type CalloutTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral'

const ICONS: Record<CalloutTone, LucideIcon> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
  neutral: ShieldCheck,
}

export interface CalloutProps {
  tone?: CalloutTone
  title?: ReactNode
  icon?: LucideIcon
  role?: 'status' | 'alert' | undefined
  children?: ReactNode
}

export function Callout({ tone = 'info', title, icon, role, children }: CalloutProps) {
  return (
    <div className={cx(styles.callout, styles[tone])} role={role} data-tone={tone}>
      <Icon icon={icon ?? ICONS[tone]} size="md" className={styles.icon} />
      <div className={styles.body}>
        {title && <p className={styles.title}>{title}</p>}
        {children && <div className={styles.text}>{children}</div>}
      </div>
    </div>
  )
}
