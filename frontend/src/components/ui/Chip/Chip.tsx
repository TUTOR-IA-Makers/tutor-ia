import { Check, X } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'
import { cx } from '@/lib/cx'
import { Icon } from '../Icon'
import styles from './Chip.module.css'

export type ChipTone = 'accent' | 'primary' | 'danger'

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onToggle'> {
  pressed: boolean
  tone?: ChipTone
  onToggle: () => void
}

export function Chip({
  pressed,
  tone = 'accent',
  onToggle,
  className,
  children,
  ...props
}: ChipProps) {
  const mark = tone === 'danger' ? X : Check
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cx(styles.chip, pressed && styles[tone], className)}
      onClick={onToggle}
      {...props}
    >
      {pressed && <Icon icon={mark} />}
      {children}
    </button>
  )
}
