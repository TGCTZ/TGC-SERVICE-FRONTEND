import { StatusBadge } from '@/components/status-badge'

/**
 * Shared yes/no rendering, so booleans look the same in every table.
 *
 * Drawn in the same vocabulary as every status: an active row is `success`, an
 * inactive one an ordinary neutral rather than an alarm. "No" is usually not
 * bad news — a lookup row that is switched off is a choice somebody made.
 */
export function BoolBadge({ value }: { value: boolean }) {
  return (
    <StatusBadge tone={value ? 'success' : 'neutral'}>
      {value ? 'Yes' : 'No'}
    </StatusBadge>
  )
}
