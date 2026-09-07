import { Eye, History, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { type RowAction } from '@/components/data-table'
import { type User } from '../data/schema'
import { useUsers } from './users-provider'

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
      permission: 'users.view',
      onSelect: () => select('view'),
    },
    {
      label: 'Edit',
      icon: Pencil,
      permission: 'users.update',
      onSelect: () => select('update'),
      hidden: isDeleted,
    },
    {
      label: 'History',
      icon: History,
      permission: 'activity-logs.viewAny',
      onSelect: () => select('history'),
    },
    {
      label: 'Restore',
      icon: RotateCcw,
      permission: 'users.restore',
      onSelect: () => select('restore'),
      hidden: !isDeleted,
      separatorBefore: true,
    },
    {
      label: 'Delete',
      icon: Trash2,
      permission: 'users.delete',
      onSelect: () => select('delete'),
      variant: 'destructive',
      hidden: isDeleted,
      separatorBefore: true,
    },
  ]
}
