import { hasAnyPermission } from '@/lib/authz'
import { Button } from '@/components/ui/button'

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
 *   { label: 'Generate bill', icon: FileText, tone: 'advance', onSelect: openBill },
 *   { label: 'Delete', icon: Trash, permission: perm('customers', 'delete'),
 *     tone: 'destructive', separatorBefore: true, onSelect: confirmDelete },
 * ]
 */
export type RowAction = {
  label: string
  icon: React.ElementType
  onSelect: () => void
  /** Permission(s) required; the user needs at least one. Omit to always show. */
  permission?: string | string[]
  /**
   * What kind of thing this action is, which decides how loudly it is drawn.
   *
   * - `neutral` (default) — looking or editing. Outlined and quiet.
   * - `advance` — moves the record to its next stage: identify, bill,
   *   finalize, issue. **Solid blue**, and there should be at most one visible
   *   per row, because it is the thing you came to that row to do.
   * - `document` — hands over a finished document. **Solid green**.
   * - `destructive` — deletes, revokes, cancels. Red, but outlined rather than
   *   filled so it does not compete with the row's actual headline.
   *
   * Colour is rationed on purpose. Every button coloured is every button
   * shouting, and a row of five equals means the eye has nowhere to land.
   */
  tone?: 'neutral' | 'advance' | 'document' | 'destructive'
  /** Draws a divider before this action, to fence destructive ones off. */
  separatorBefore?: boolean
  /** Hide entirely regardless of permission (e.g. Restore on a live record). */
  hidden?: boolean
}

/** How each tone is drawn. Solid reads as "this one"; outlined as "also available". */
const TONE_VARIANT = {
  neutral: 'outline',
  advance: 'default',
  document: 'success',
  destructive: 'destructive-outline',
} as const

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
 * **Labelled**, not icon-only. A row of bare icons asks the user to decode a
 * pictogram before every click: a document glyph could be "view", "generate
 * bill" or "certificate", and the same icon means different things on
 * different screens. Tooltips do not answer it either — they need a hover, so
 * they do not exist on touch devices and are useless to anyone scanning the
 * column. The label is the affordance; the icon only speeds up recognition
 * once you already know what you are looking for.
 *
 * Icons rather than a dropdown: with at most four or five actions visible at
 * once (Delete and Restore are mutually exclusive) there is room to show them,
 * and a menu costs two clicks plus a guess at what the row can do.
 *
 * The buttons **wrap** rather than shrink or truncate, so a narrow column makes
 * the row taller instead of hiding what it can do. That is the deliberate
 * trade: vertical space is cheap, a misread action is not.
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
    // The max-width is what makes `flex-wrap` mean anything. A table cell sizes
    // to its content, so without a cap the buttons would sit on one ever-wider
    // line and push the whole table into horizontal scroll instead of wrapping.
    <div className='ms-auto flex max-w-80 flex-wrap items-center justify-end gap-1'>
      {visible.map((action, index) => (
        <div key={action.label} className='flex items-center'>
          {/* Never lead with a divider, however the list filtered down. */}
          {action.separatorBefore && index > 0 && (
            <span className='me-1 h-4 w-px shrink-0 bg-border' />
          )}
          <Button
            variant={TONE_VARIANT[action.tone ?? 'neutral']}
            size='sm'
            className='h-8 gap-1.5 px-2.5'
            onClick={action.onSelect}
          >
            <action.icon className='size-4 shrink-0' />
            {action.label}
          </Button>
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
          variant={TONE_VARIANT[action.tone ?? 'neutral']}
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
