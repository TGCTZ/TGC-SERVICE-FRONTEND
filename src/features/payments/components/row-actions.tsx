import { DataTableRowActions } from '@/components/data-table'
import { type Payment } from '../data/schema'
import { usePaymentActions } from '../hooks/use-actions'

export function PaymentsRowActions({ payment }: { payment: Payment }) {
  return <DataTableRowActions actions={usePaymentActions(payment)} />
}
