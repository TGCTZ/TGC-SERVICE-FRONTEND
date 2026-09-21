import '@tanstack/react-table'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    className?: string // apply to both th and td
    tdClassName?: string
    thClassName?: string
    /**
     * Human label for the column, used where the `header` JSX cannot be
     * rendered: the mobile card view's field labels and the View menu's
     * checkboxes. Falls back to a humanised `column.id` — set this whenever
     * that id would read badly to a user.
     */
    label?: string
    /**
     * Keep this column out of the mobile card view. For columns that only
     * make sense next to their neighbours in a real table row.
     */
    hideOnMobile?: boolean
  }
}
