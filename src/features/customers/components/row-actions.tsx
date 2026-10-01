import { DataTableRowActions } from '@/components/data-table'
import { type Customer } from '../data/schema'
import { useCustomerActions } from '../hooks/use-actions'

export function CustomersRowActions({ customer }: { customer: Customer }) {
  return <DataTableRowActions actions={useCustomerActions(customer)} />
}
