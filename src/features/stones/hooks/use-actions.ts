import { ArrowRightLeft, Eye, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { PERMISSIONS, perm, restorePerm } from '@/lib/permissions'
import { type RowAction } from '@/components/data-table'
import { useStones } from '../components/provider'
import { isStoneLocked } from '../data/enums'
import { type Stone } from '../data/schema'

/**
 * Every action the API exposes for a stone, in one place.
 *
 * A stone's status trail is not here: it is a section of the stone's details
 * dialog, and the generic audit log lives on its own screen.
 */
export function useStoneActions(stone: Stone | null): RowAction[] {
  const { setOpen, setCurrentRow } = useStones()

  function select(
    dialog: 'view' | 'transition' | 'update' | 'delete' | 'restore'
  ) {
    setCurrentRow(stone)
    setOpen(dialog)
  }

  // Called unconditionally by the page before a row is chosen.
  if (!stone) return []

  const isDeleted = Boolean(stone.deleted_at)
  // Billed: the type priced the bill, so the record is settled. Weight is still
  // editable, but on the findings form rather than here.
  const isLocked = isStoneLocked(stone)

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
      hidden: isDeleted || isLocked,
    },
    {
      label: 'Change status',
      tone: 'advance',
      icon: ArrowRightLeft,
      permission: PERMISSIONS.transitionStone,
      onSelect: () => select('transition'),
      hidden: isDeleted || isLocked,
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
      tone: 'destructive',
      hidden: isDeleted || isLocked,
      separatorBefore: true,
    },
  ]
}
