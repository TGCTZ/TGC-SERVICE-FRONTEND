import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * How a status reads, independent of which resource it belongs to.
 *
 * Five meanings, and every status in the system is one of them. A stone that is
 * `certified`, a bill that is `paid` and a certificate that is `issued` are the
 * same news — this arrived where it was going — so they are drawn the same way.
 * Someone reading a screen learns the palette once.
 *
 * Built on the `-subtle` / `-border` / `-text` triplets from the colour system
 * rather than the solid fills. A table is mostly badges; solid pills turn it
 * into a traffic light, while a tint carries the same meaning quietly enough to
 * read a hundred rows of it. Both halves of each pair are theme tokens, so dark
 * mode follows without a second definition.
 */
export const statusToneVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium transition-colors [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      tone: {
        /** Arrived where it was going: paid, certified, collected, issued. */
        success: 'border-success-border bg-success-subtle text-success-text',
        /** Paused or short: on hold, partly paid, awaiting something. */
        warning: 'border-warning-border bg-warning-subtle text-warning-text',
        /** Stopped or withdrawn: cancelled, revoked, expired, deleted. */
        danger: 'border-danger-border bg-danger-subtle text-danger-text',
        /** Under way: being identified, in findings, in progress. */
        info: 'border-info-border bg-info-subtle text-info-text',
        /** An ordinary step with no news in it: received, pending, draft. */
        neutral: 'bg-muted text-muted-foreground border-border',
      },
    },
    defaultVariants: { tone: 'neutral' },
  }
)

export type StatusTone = NonNullable<
  VariantProps<typeof statusToneVariants>['tone']
>

/**
 * A status pill.
 *
 * Every resource's status badge renders through this one component, so the
 * meaning of a colour is decided in a single place. A feature's own badge is
 * then nothing but a map from its status codes to a tone — see
 * `features/stones/components/status-badge.tsx`.
 */
export function StatusBadge({
  tone,
  className,
  children,
}: {
  tone?: StatusTone
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      data-slot='status-badge'
      className={cn(statusToneVariants({ tone }), className)}
    >
      {children}
    </span>
  )
}

/**
 * Build a badge component from a code-to-tone map.
 *
 * The repetition this removes: every resource was writing the same
 * `variantFor` ladder of ternaries, and each one drifted - a paid bill got the
 * solid badge while a certified stone got a different one, for no reason
 * anybody chose.
 *
 * @param labels - Status code to the words shown. An unmapped code falls
 *   through to the raw value, so a status the API adds is visible rather than
 *   blank.
 * @param tones - Status code to tone. Anything unlisted is `neutral`, which is
 *   the right default: an ordinary step deserves no colour.
 */
export function createStatusBadge(
  labels: Record<string, string>,
  tones: Record<string, StatusTone>
) {
  return function ResourceStatusBadge({
    status,
    className,
  }: {
    status: string
    className?: string
  }) {
    return (
      <StatusBadge tone={tones[status] ?? 'neutral'} className={className}>
        {labels[status] ?? status}
      </StatusBadge>
    )
  }
}
