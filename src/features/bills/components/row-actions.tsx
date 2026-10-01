import { DataTableRowActions } from '@/components/data-table'
import { type Bill } from '../data/schema'
import { useBillActions } from '../hooks/use-actions'

export function BillsRowActions({ bill }: { bill: Bill }) {
  return <DataTableRowActions actions={useBillActions(bill)} />
}
