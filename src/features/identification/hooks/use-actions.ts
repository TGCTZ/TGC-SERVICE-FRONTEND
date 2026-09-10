import { Eye, History, Lock, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { PERMISSIONS, perm, restorePerm } from '@/lib/permissions'
import { type RowAction } from '@/components/data-table'
import { useReports } from '../components/provider'
import { type IdentificationReport } from '../data/schema'

/**
 * Every action the API exposes for a report, in one place.
 *
 * Finalizing is one-way and the service refuses every edit afterwards, so once
 * a report is finalized both Edit and Finalize disappear — leaving them would
 * offer two buttons that can only fail.
 */
export function useReportActions(
  report: IdentificationReport | null
): RowAction[] {
  const { setOpen, setCurrentRow } = useReports()

  function select(
    dialog: 'view' | 'history' | 'update' | 'delete' | 'restore' | 'finalize'
  ) {
    setCurrentRow(report)
    setOpen(dialog)
  }

  // Called unconditionally by the page before a row is chosen.
  if (!report) return []

  const isDeleted = Boolean(report.deleted_at)
  const isLocked = report.is_finalized

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
      icon: Lock,
      permission: PERMISSIONS.finalizeReport,
      onSelect: () => select('finalize'),
      hidden: isDeleted || isLocked,
    },
    {
      label: 'History',
      icon: History,
      permission: PERMISSIONS.viewActivityLogs,
      onSelect: () => select('history'),
      separatorBefore: true,
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
      variant: 'destructive',
      hidden: isDeleted,
      separatorBefore: true,
    },
  ]
}
