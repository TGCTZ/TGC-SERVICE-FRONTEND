import { Eye, Lock, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { PERMISSIONS, perm, restorePerm } from '@/lib/permissions'
import { type RowAction } from '@/components/data-table'
import { useReports } from '../components/provider'
import { type IdentificationReport } from '../data/schema'

/**
 * Every action the API exposes for a report, in one place.
 *
 * Finalizing is one-way. Finalize disappears after sign-off, while Edit remains
 * available to users with the dedicated finalized-report correction permission.
 */
export function useReportActions(
  report: IdentificationReport | null
): RowAction[] {
  const { setOpen, setCurrentRow } = useReports()
  const permissions = useAuthStore(
    (state) => state.auth.user?.permissions ?? []
  )

  function select(
    dialog: 'view' | 'update' | 'delete' | 'restore' | 'finalize'
  ) {
    setCurrentRow(report)
    setOpen(dialog)
  }

  // Called unconditionally by the page before a row is chosen.
  if (!report) return []

  const isDeleted = Boolean(report.deleted_at)
  const isLocked =
    report.is_finalized &&
    !permissions.includes(PERMISSIONS.editFinalizedReport)

  return [
    {
      label: 'View',
      icon: Eye,
      permission: perm('identification-reports', 'view'),
      onSelect: () => select('view'),
    },
    {
      label: 'Edit',
      icon: Pencil,
      permission: perm('identification-reports', 'change'),
      onSelect: () => select('update'),
      hidden: isDeleted || isLocked,
    },
    {
      label: 'Finalize',
      tone: 'advance',
      icon: Lock,
      permission: PERMISSIONS.finalizeReport,
      onSelect: () => select('finalize'),
      // Correction permission unlocks Edit only; sign-off is already complete.
      hidden: isDeleted || report.is_finalized,
    },
    {
      label: 'Restore',
      icon: RotateCcw,
      permission: restorePerm('identification-reports'),
      onSelect: () => select('restore'),
      hidden: !isDeleted,
      separatorBefore: true,
    },
    {
      label: 'Delete',
      icon: Trash2,
      permission: perm('identification-reports', 'delete'),
      onSelect: () => select('delete'),
      tone: 'destructive',
      hidden: isDeleted,
      separatorBefore: true,
    },
  ]
}
