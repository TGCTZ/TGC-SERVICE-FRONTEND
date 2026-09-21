import { type Column } from '@tanstack/react-table'

/**
 * The human label for a column, for the places that cannot render its
 * `header`.
 *
 * A column's `header` is JSX — usually a `<DataTableColumnHeader>` carrying a
 * sort dropdown. That is right inside a `<th>` and wrong everywhere else: the
 * mobile card view needs a field label, and the View menu needs a checkbox
 * label, and neither wants a nested control.
 *
 * Resolution order, most explicit first:
 *
 * 1. `meta.label` — set this when the fallbacks read badly
 * 2. a `header` declared as a plain string rather than JSX
 * 3. the column id, humanised (`created_at` → "Created at")
 *
 * @param column - The TanStack Table column instance
 * @returns A label safe to render as plain text
 */
export function columnLabel<TData, TValue>(
  column: Column<TData, TValue>
): string {
  const { meta, header } = column.columnDef

  if (meta?.label) return meta.label
  if (typeof header === 'string' && header.trim()) return header

  // `snake_case` and `kebab-case` both appear as column ids here; normalise
  // the separator before capitalising so neither leaks into the UI.
  const words = column.id.replace(/[_-]+/g, ' ').trim()

  return words.charAt(0).toUpperCase() + words.slice(1)
}
