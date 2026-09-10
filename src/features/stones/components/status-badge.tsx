import { Badge } from '@/components/ui/badge'
import { STONE_STATUS_LABELS } from '../data/enums'

/**
 * Visual weight per status, so a queue can be read at a glance.
 *
 * Only the two exceptional states are coloured: `cancelled` is destructive and
 * `on_hold` is a warning. Everything else is a normal step along the pipeline
 * and colouring each one differently would turn the table into a rainbow with
 * no meaning behind it.
 */
function variantFor(status: string) {
  if (status === 'cancelled') return 'destructive' as const
  if (status === 'certified' || status === 'collected')
    return 'default' as const
  return 'secondary' as const
}

/** A stone's status, rendered from the code the API stores. */
export function StoneStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={variantFor(status)}>
      {STONE_STATUS_LABELS[status] ?? status}
    </Badge>
  )
}
