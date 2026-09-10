import {
  ArrowRightLeft,
  Eye,
  History,
  ListOrdered,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { PERMISSIONS, perm, restorePerm } from '@/lib/permissions'
import { type RowAction } from '@/components/data-table'
import { useStones } from '../components/provider'
import { type Stone } from '../data/schema'

/**
 * Every action the API exposes for a stone, in one place.
 *
 * Note the two history entries: "Status history" is the domain ledger the
 * pipeline writes, while "History" is the generic audit log of field changes.
 * They answer different questions and neither replaces the other.
 */
export function useStoneActions(stone: Stone | null): RowAction[] {
  const { setOpen, setCurrentRow } = useStones()

  function select(
    dialog:
      | 'view'
      | 'history'
      | 'statuses'
      | 'transition'
      | 'update'
      | 'delete'
      | 'restore'
  ) {
    setCurrentRow(stone)
    setOpen(dialog)
  }

  // Called unconditionally by the page before a row is chosen.
  if (!stone) return []

  const isDeleted = Boolean(stone.deleted_at)

  return [
    {
      label: 'View',
      icon: Eye,
      permission: perm('stones', 'view'),
      onSelect: () => select('view'),
    },
    {
      label: 'Edit',
      icon: Pencil,
      permission: perm('stones', 'change'),
      onSelect: () => select('update'),
      hidden: isDeleted,
    },
    {
      label: 'Change status',
      icon: ArrowRightLeft,
      permission: PERMISSIONS.transitionStone,
      onSelect: () => select('transition'),
      hidden: isDeleted,
    },
    {
      label: 'Status history',
      icon: ListOrdered,
      permission: perm('status-history', 'view'),
      onSelect: () => select('statuses'),
      separatorBefore: true,
    },
    {
      label: 'History',
      icon: History,
      permission: PERMISSIONS.viewActivityLogs,
      onSelect: () => select('history'),
    },
    {
      label: 'Restore',
      icon: RotateCcw,
      permission: restorePerm('stones'),
      onSelect: () => select('restore'),
      hidden: !isDeleted,
      separatorBefore: true,
    },
    {
      label: 'Delete',
      icon: Trash2,
      permission: perm('stones', 'delete'),
      onSelect: () => select('delete'),
      variant: 'destructive',
      hidden: isDeleted,
      separatorBefore: true,
    },
  ]
}
