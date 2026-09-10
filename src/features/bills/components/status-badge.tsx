import { Badge } from '@/components/ui/badge'
import { BILL_STATUS_LABELS } from '../data/schema'

/**
 * A bill's payment state.
 *
 * `paid` is the only settled outcome, so it gets the solid badge; `cancelled`
 * is destructive; everything in between is money still owed.
 */
export function BillStatusBadge({ status }: { status: string }) {
  const variant =
    status === 'paid'
      ? ('default' as const)
      : status === 'cancelled'
        ? ('destructive' as const)
        : ('secondary' as const)

  return <Badge variant={variant}>{BILL_STATUS_LABELS[status] ?? status}</Badge>
}
