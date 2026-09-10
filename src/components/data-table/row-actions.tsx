import { hasAnyPermission } from '@/lib/authz'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

/**
 * One action available on a table row.
 *
 * Declared as data rather than JSX so a resource lists its full capability in
 * one place, and so the same array can feed both the row's icon buttons and
 * the record's view dialog.
 *
 * @example
 * const actions: RowAction[] = [
 *   { label: 'Edit', icon: Pencil, permission: perm('customers', 'change'), onSelect: openEdit },
 *   { label: 'Delete', icon: Trash, permission: perm('customers', 'delete'),
 *     variant: 'destructive', separatorBefore: true, onSelect: confirmDelete },
 * ]
 */
export type RowAction = {
  label: string
  icon: React.ElementType
  onSelect: () => void
  /** Permission(s) required; the user needs at least one. Omit to always show. */
  permission?: string | string[]
  variant?: 'default' | 'destructive'
  /** Draws a divider before this action, to fence destructive ones off. */
  separatorBefore?: boolean
  /** Hide entirely regardless of permission (e.g. Restore on a live record). */
  hidden?: boolean
}

/**
 * Drop actions the user cannot perform or that do not apply to this row.
 *
 * `hidden` and `permission` mean different things: `hidden` is "not applicable
 * to this record" (Restore on a live row), `permission` is "not allowed for
 * this user". Filtering here is a usability affordance only — the API
 * authorises every call independently.
 */
function visibleActions(actions: RowAction[]) {
  return actions.filter(
    (action) =>
      !action.hidden &&
      (!action.permission || hasAnyPermission(action.permission))
  )
}

/**
 * Row actions, rendered inline in the table cell.
 *
 * Icons rather than a dropdown: with at most four actions visible at once
 * (Delete and Restore are mutually exclusive) there is room to show them, and
 * a menu costs two clicks plus a guess at what the row can do.
 *
 * When the column gets tight the buttons **wrap** rather than shrink — a
 * half-size icon is harder to hit and no easier to read than a second line.
 *
 * Actions are declared as data rather than JSX so each table lists its full
 * capability in one place, and so the same list can be reused by the record's
 * view dialog via `RowActionButtons`.
 */
export function DataTableRowActions({ actions }: { actions: RowAction[] }) {
  const visible = visibleActions(actions)

  // An empty cell beats a "no actions" placeholder repeated down every row.
  if (visible.length === 0) return null

  return (
    <div className='flex flex-wrap items-center justify-end gap-0.5'>
      {visible.map((action, index) => (
        <div key={action.label} className='flex items-center'>
          {/* Never lead with a divider, however the list filtered down. */}
          {action.separatorBefore && index > 0 && (
            <span className='mx-1 h-4 w-px shrink-0 bg-border' />
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className={cn(
                  'size-8',
                  action.variant === 'destructive' &&
                    'text-destructive hover:bg-destructive/10 hover:text-destructive'
                )}
                // Icon-only controls are unusable without this.
                aria-label={action.label}
                onClick={action.onSelect}
              >
                <action.icon className='size-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{action.label}</TooltipContent>
          </Tooltip>
        </div>
      ))}
    </div>
  )
}

/**
 * The same actions as labelled buttons, for a record's view dialog.
 *
 * A dialog has horizontal room the table cell does not, so these carry their
 * labels — an unlabelled icon next to a destructive action is a poor bet, and
 * tooltips do not exist on touch devices.
 */
export function RowActionButtons({
  actions,
  className,
}: {
  actions: RowAction[]
  className?: string
}) {
  const visible = visibleActions(actions)

  if (visible.length === 0) return null

  return (
    <>
      {visible.map((action) => (
        <Button
          key={action.label}
          type='button'
          variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
          size='sm'
          className={className}
          onClick={action.onSelect}
        >
          <action.icon className='me-1 size-4' />
          {action.label}
        </Button>
      ))}
    </>
  )
}
