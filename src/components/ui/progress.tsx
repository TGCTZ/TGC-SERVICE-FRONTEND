import { cn } from '@/lib/utils'

type ProgressProps = {
  /** Work completed so far. Clamped into `0…max`. */
  value: number
  /** The total the bar fills up to. A `max` of 0 renders an empty track. */
  max: number
  /** Accessible name, since the bar itself carries no text. */
  label: string
  className?: string
  /** Overrides the fill once the bar is full. Defaults to the success colour. */
  completeClassName?: string
}

/**
 * A determinate progress bar.
 *
 * Hand-rolled rather than `@radix-ui/react-progress`: the only thing that
 * package adds over this is its own state machine for the indeterminate case,
 * which nothing here needs — every bar in this app measures a known count
 * against a known total.
 *
 * Rendered as an ARIA `progressbar` so a screen reader announces "3 of 5"
 * rather than silence; the visible counts stay alongside it for everyone else,
 * because a bar alone cannot say whether "nearly full" means 4/5 or 49/50.
 */
export function Progress({
  value,
  max,
  label,
  className,
  completeClassName = 'bg-success',
}: ProgressProps) {
  const safeMax = Math.max(0, max)
  const safeValue = Math.min(Math.max(0, value), safeMax)
  const percent = safeMax === 0 ? 0 : (safeValue / safeMax) * 100
  const isComplete = safeMax > 0 && safeValue >= safeMax

  return (
    <div
      role='progressbar'
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={safeValue}
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-secondary',
        className
      )}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-300',
          // Semantic, not decorative: amber says "still outstanding", green
          // says "done". A brand-coloured full bar reads as just another blue
          // element rather than as a finished state.
          isComplete ? completeClassName : 'bg-warning'
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
