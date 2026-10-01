import { useQuery } from '@tanstack/react-query'
import { Eye, FlaskConical } from 'lucide-react'
import { appConfigQuery } from '@/lib/app-config-query'
import { PERMISSIONS, perm } from '@/lib/permissions'
import { type RowAction } from '@/components/data-table'
import { useBills } from '../components/provider'
import { type Bill } from '../data/schema'

/**
 * What a user can do with a bill: look at it — and, in development, pay it.
 *
 * No Edit, Delete or Restore — a bill is written once by the billing service
 * and thereafter only by the gateway, and the API refuses everything else.
 *
 * "Simulate payment" is gated on what the *server* reports rather than on a
 * build-time flag, so the UI cannot disagree with it about whether the endpoint
 * exists. A button that 404s is worse than no button.
 */
export function useBillActions(bill: Bill | null): RowAction[] {
  const { data: config } = useQuery(appConfigQuery())
  const { setOpen, setCurrentRow } = useBills()

  function select(dialog: 'view' | 'simulate-payment') {
    setCurrentRow(bill)
    setOpen(dialog)
  }

  // Called unconditionally by the page before a row is chosen.
  if (!bill) return []

  return [
    {
      label: 'View',
      icon: Eye,
      permission: perm('bills', 'view'),
      onSelect: () => select('view'),
    },
    {
      label: 'Simulate payment',
      tone: 'advance',
      icon: FlaskConical,
      // The same authority as raising the bill: whoever may charge a customer
      // is who may pretend they paid.
      permission: PERMISSIONS.generateBill,
      onSelect: () => select('simulate-payment'),
      hidden: !config?.simulate_payments || bill.status === 'paid',
      separatorBefore: true,
    },
  ]
}
