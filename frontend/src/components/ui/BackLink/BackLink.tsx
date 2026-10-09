import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Icon } from '../Icon'
import styles from './BackLink.module.css'

export interface BackLinkProps {
  to: string
  children: ReactNode
}

export function BackLink({ to, children }: BackLinkProps) {
  return (
    <Link to={to} className={styles.link}>
      <Icon icon={ArrowLeft} />
      {children}
    </Link>
  )
}
