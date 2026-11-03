import { cx } from '@/lib/cx'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'md' | 'lg'

export function buttonClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string,
  block = false,
): string {
  return cx(styles.button, styles[variant], styles[size], block && styles.block, className)
}
