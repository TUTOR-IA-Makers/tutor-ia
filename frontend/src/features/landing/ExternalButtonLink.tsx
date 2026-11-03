import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { buttonClassName, Icon, type ButtonSize, type ButtonVariant } from '@/components/ui'
import { trackEvent } from './analytics'

export interface ExternalButtonLinkProps {
  href: string
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  className?: string | undefined
  /** Page position, reported as an access_request_click event. */
  location?: string
  children: ReactNode
}

// LinkButton only takes router paths; the documentation lives on another origin.
export function ExternalButtonLink({
  href,
  variant = 'secondary',
  size = 'md',
  icon,
  className,
  location,
  children,
}: ExternalButtonLinkProps) {
  return (
    <a
      href={href}
      className={buttonClassName(variant, size, className)}
      onClick={() => {
        if (location) trackEvent('access_request_click', { location })
      }}
    >
      {children}
      {icon && <Icon icon={icon} size={size === 'lg' ? 'md' : 'sm'} />}
    </a>
  )
}
