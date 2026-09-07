import { type RowAction, RowActionButtons } from '@/components/data-table'

type ViewFooterActionsProps = {
  /** The record's row actions. View and Edit are handled separately. */
  actions: RowAction[]
  /** The primary action, normally the Edit button. */
  primary?: React.ReactNode
}

/**
 * The footer of a record's read-only view.
 *
 * Everything you can do to a record from its table row, you can also do while
 * looking at it — otherwise the view is a dead end and you have to close it,
 * find the row again, and act from there.
 *
 * Two exclusions: **View**, because it is the surface you are already on, and
 * **Edit**, which each dialog wires itself so it can flip in place rather than
 * reopening.
 *
 * Destructive actions are pushed to the opposite end with `me-auto`, not
 * merely coloured — the point is that Delete cannot sit next to the action a
 * user reaches for by reflex.
 *
 * There is no Close button: `DialogContent` already renders one in the corner,
 * and Escape closes too, so a third route out is just another thing between
 * the reader and the record's actions.
 */
export function ViewFooterActions({
  actions,
  primary,
}: ViewFooterActionsProps) {
  const rest = actions.filter(
    (action) => action.label !== 'View' && action.label !== 'Edit'
  )

  const destructive = rest.filter((action) => action.variant === 'destructive')
  const safe = rest.filter((action) => action.variant !== 'destructive')

  return (
    <>
      {destructive.length > 0 && (
        <div className='flex gap-2 sm:me-auto'>
          <RowActionButtons actions={destructive} />
        </div>
      )}

      <RowActionButtons actions={safe} />

      {primary}
    </>
  )
}
