import { type ColumnDef } from '@tanstack/react-table'
import { formatDate, formatMoney } from '@/lib/format'
import { LongText } from '@/components/long-text'
import { type ReportResult, type ReportRow } from '../data/schema'

/** Report columns use the same table and app-wide formatting as resource lists. */
export function reportColumns(
  columns: ReportResult['columns']
): ColumnDef<ReportRow>[] {
  return columns.map((column) => ({
    accessorKey: column.key,
    header: column.label,
    enableSorting: false,
    cell: ({ row }) => {
      const value = row.original[column.key]
      if (column.kind === 'money') {
        return (
          <span className='whitespace-nowrap tabular-nums'>
            {formatMoney(Number(value), String(row.original.currency))}
          </span>
        )
      }
      if (column.kind === 'date')
        return (
          <span className='whitespace-nowrap'>{formatDate(String(value))}</span>
        )
      return <LongText className='max-w-64'>{String(value ?? '')}</LongText>
    },
  }))
}
