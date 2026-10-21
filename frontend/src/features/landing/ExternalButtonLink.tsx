import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { buttonClassName, Icon, type ButtonSize, type ButtonVariant } from '@/components/ui'

export interface ExternalButtonLinkProps {
  href: string
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  className?: string | undefined
  children: ReactNode
}

// LinkButton only takes router paths; the documentation lives on another origin.
export function ExternalButtonLink({
  href,
  variant = 'secondary',
  size = 'md',
  icon,
  className,
  children,
}: ExternalButtonLinkProps) {
  return (
    <a href={href} className={buttonClassName(variant, size, className)}>
      {children}
      {icon && <Icon icon={icon} size={size === 'lg' ? 'md' : 'sm'} />}
    </a>
  )
}
