import { Eye, History } from 'lucide-react'
import { PERMISSIONS, perm } from '@/lib/permissions'
import { type RowAction } from '@/components/data-table'
import { usePayments } from '../components/provider'
import { type Payment } from '../data/schema'

/** View and history only — a payment has no other legitimate operation. */
export function usePaymentActions(payment: Payment | null): RowAction[] {
  const { setOpen, setCurrentRow } = usePayments()

  function select(dialog: 'view' | 'history') {
    setCurrentRow(payment)
    setOpen(dialog)
  }

  // Called unconditionally by the page before a row is chosen.
  if (!payment) return []

  return [
    {
      label: 'View',
      icon: Eye,
      permission: perm('payments', 'view'),
      onSelect: () => select('view'),
    },
    {
      label: 'History',
      icon: History,
      permission: PERMISSIONS.viewActivityLogs,
      onSelect: () => select('history'),
    },
  ]
}
