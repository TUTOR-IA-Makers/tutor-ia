import type { LucideIcon } from 'lucide-react'

export type IconSize = 'sm' | 'md'

export interface IconProps {
  icon: LucideIcon
  size?: IconSize
  className?: string | undefined
}

const PIXELS: Record<IconSize, number> = { sm: 16, md: 20 }

export function Icon({ icon: Glyph, size = 'sm', className }: IconProps) {
  return (
    <Glyph
      aria-hidden="true"
      focusable="false"
      size={PIXELS[size]}
      strokeWidth={1.75}
      className={className}
    />
  )
}
