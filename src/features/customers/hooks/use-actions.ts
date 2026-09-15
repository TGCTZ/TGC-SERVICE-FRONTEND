import { Eye, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { perm, restorePerm } from '@/lib/permissions'
import { type RowAction } from '@/components/data-table'
import { useCustomers } from '../components/provider'
import { type Customer } from '../data/schema'

/**
 * Every action the API exposes for a customer, in one place.
 *
 * A hook rather than a component so the table cell and the record's view
 * dialog render the same list.
 */
export function useCustomerActions(customer: Customer | null): RowAction[] {
  const { setOpen, setCurrentRow } = useCustomers()

  function select(
    dialog: 'view' | 'history' | 'update' | 'delete' | 'restore'
  ) {
    setCurrentRow(customer)
    setOpen(dialog)
  }

  // Called unconditionally by the page before a row is chosen.
  if (!customer) return []

  const isDeleted = Boolean(customer.deleted_at)

  return [
    {
      label: 'View',
      icon: Eye,
      permission: perm('customers', 'view'),
      onSelect: () => select('view'),
    },
    {
      label: 'Edit',
      icon: Pencil,
      permission: perm('customers', 'change'),
      onSelect: () => select('update'),
      hidden: isDeleted,
    },
    {
      label: 'Restore',
      icon: RotateCcw,
      permission: restorePerm('customers'),
      onSelect: () => select('restore'),
      hidden: !isDeleted,
      separatorBefore: true,
    },
    {
      label: 'Delete',
      icon: Trash2,
      permission: perm('customers', 'delete'),
      onSelect: () => select('delete'),
      tone: 'destructive',
      hidden: isDeleted,
      separatorBefore: true,
    },
  ]
}
