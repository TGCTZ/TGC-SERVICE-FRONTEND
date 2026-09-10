import { Eye, History } from 'lucide-react'
import { PERMISSIONS, perm } from '@/lib/permissions'
import { type RowAction } from '@/components/data-table'
import { useBills } from '../components/provider'
import { type Bill } from '../data/schema'

/**
 * The two things a user can do with a bill: look at it, or see what changed.
 *
 * No Edit, Delete or Restore — a bill is written once by the billing service
 * and thereafter only by the gateway, and the API refuses everything else.
 */
export function useBillActions(bill: Bill | null): RowAction[] {
  const { setOpen, setCurrentRow } = useBills()

  function select(dialog: 'view' | 'history') {
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
      label: 'History',
      icon: History,
      permission: PERMISSIONS.viewActivityLogs,
      onSelect: () => select('history'),
    },
  ]
}
