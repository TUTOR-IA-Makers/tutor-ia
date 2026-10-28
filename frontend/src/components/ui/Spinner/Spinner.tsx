import { cx } from '@/lib/cx'
import styles from './Spinner.module.css'

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <svg
      className={cx(styles.spinner, styles[size], className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      data-testid="spinner"
    >
      <circle className={styles.track} cx="12" cy="12" r="9" />
      <path className={styles.arc} d="M12 3a9 9 0 0 1 9 9" />
    </svg>
  )
}
