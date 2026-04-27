import { useId } from 'react'
import { LogoArt, LOGO_GRADIENT_FROM, LOGO_GRADIENT_TO } from '@/app/_logo-art'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: number
  className?: string
}

export function Logo({ size = 32, className }: LogoProps) {
  const gradientId = useId()
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label="Shop Watcher"
      className={cn('shrink-0', className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={LOGO_GRADIENT_FROM} />
          <stop offset="100%" stopColor={LOGO_GRADIENT_TO} />
        </linearGradient>
      </defs>
      <rect width="256" height="256" rx="56" fill={`url(#${gradientId})`} />
      <LogoArt />
    </svg>
  )
}
