import { Eye, History, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { PERMISSIONS, perm, restorePerm } from '@/lib/permissions'
import { type RowAction } from '@/components/data-table'
import { useUsers } from '../components/provider'
import { type User } from '../data/schema'

/**
 * Every action the API exposes for a user, in one place.
 *
 * A hook rather than a component so the table cell and the record's view
 * dialog render the same list.
 */
export function useUserActions(user: User | null): RowAction[] {
  const { setOpen, setCurrentRow } = useUsers()

  function select(
    dialog: 'view' | 'history' | 'update' | 'delete' | 'restore'
  ) {
    setCurrentRow(user)
    setOpen(dialog)
  }

  // Called unconditionally by the page before a row is chosen.
  if (!user) return []

  const isDeleted = Boolean(user.deleted_at)

  // Every action the API exposes for a user. Role assignment lives inside the
  // edit dialog, which is where the API accepts it (PUT users/{id}/roles is
  // called from there), so it is not a separate menu entry.
  return [
    {
      label: 'View',
      icon: Eye,
      permission: perm('users', 'view'),
      onSelect: () => select('view'),
    },
    {
      label: 'Edit',
      icon: Pencil,
      permission: perm('users', 'change'),
      onSelect: () => select('update'),
      hidden: isDeleted,
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
      permission: restorePerm('users'),
      onSelect: () => select('restore'),
      hidden: !isDeleted,
      separatorBefore: true,
    },
    {
      label: 'Delete',
      icon: Trash2,
      permission: perm('users', 'delete'),
      onSelect: () => select('delete'),
      variant: 'destructive',
      hidden: isDeleted,
      separatorBefore: true,
    },
  ]
}
