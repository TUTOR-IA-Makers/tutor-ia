import type { LucideIcon } from 'lucide-react'
import { Link, type LinkProps } from 'react-router'
import { Icon } from '../Icon'
import { buttonClassName, type ButtonSize, type ButtonVariant } from './buttonClassName'

export interface LinkButtonProps extends LinkProps {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  block?: boolean
}

export function LinkButton({
  variant = 'secondary',
  size = 'md',
  icon,
  block = false,
  className,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link className={buttonClassName(variant, size, className, block)} {...props}>
      {icon && <Icon icon={icon} size={size === 'lg' ? 'md' : 'sm'} />}
      {children}
    </Link>
  )
}
