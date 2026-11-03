import type { LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'
import { Icon } from '../Icon'
import { Spinner } from '../Spinner'
import { buttonClassName, type ButtonSize, type ButtonVariant } from './buttonClassName'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  iconPosition?: 'start' | 'end'
  isLoading?: boolean
  block?: boolean
}

export function Button({
  variant = 'secondary',
  size = 'md',
  type = 'button',
  icon,
  iconPosition = 'start',
  isLoading = false,
  block = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const glyph = icon ? <Icon icon={icon} size={size === 'lg' ? 'md' : 'sm'} /> : null
  return (
    <button
      type={type}
      className={buttonClassName(variant, size, className, block)}
      // isLoading comes first so an explicit disabled={false} cannot re-enable a pending button.
      disabled={isLoading || disabled}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? <Spinner size="sm" /> : iconPosition === 'start' && glyph}
      {children}
      {!isLoading && iconPosition === 'end' && glyph}
    </button>
  )
}
