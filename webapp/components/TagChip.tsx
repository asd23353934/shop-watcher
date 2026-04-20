import { cn } from '@/lib/utils'

interface TagChipProps {
  name: string
  color?: string | null
  className?: string
  onClick?: () => void
  selected?: boolean
  title?: string
}

// Decide readable text color (black/white) from a hex background
function textColorFor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luma = 0.299 * r + 0.587 * g + 0.114 * b
  return luma > 160 ? '#1f2937' : '#ffffff'
}

export function TagChip({ name, color, className, onClick, selected, title }: TagChipProps) {
  const hasColor = typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color)
  const style = hasColor
    ? { backgroundColor: color as string, color: textColorFor(color as string) }
    : undefined

  const interactive = typeof onClick === 'function'
  const Component = interactive ? 'button' : 'span'

  return (
    <Component
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      title={title}
      style={style}
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-opacity',
        !hasColor && 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
        interactive && 'cursor-pointer hover:opacity-80',
        selected && 'ring-2 ring-offset-1 ring-blue-500 dark:ring-offset-gray-900',
        className
      )}
    >
      {name}
    </Component>
  )
}
