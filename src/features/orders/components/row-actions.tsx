import { DataTableRowActions } from '@/components/data-table'
import { type Order } from '../data/schema'
import { useOrderActions } from '../hooks/use-actions'

export function OrdersRowActions({ order }: { order: Order }) {
  return <DataTableRowActions actions={useOrderActions(order)} />
}
