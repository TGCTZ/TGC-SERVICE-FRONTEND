import {
  Eye,
  FileText,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { PERMISSIONS, perm, restorePerm } from '@/lib/permissions'
import { type RowAction } from '@/components/data-table'
import { useOrders } from '../components/provider'
import { isBilled, isFullyIdentified, isHeld, type Order } from '../data/schema'

/**
 * Every action the API exposes for an order, in one place.
 *
 * The two workflow actions are hidden when they cannot succeed: identification
 * once the order is billed, and billing until every stone is identified — the
 * API enforces both, and an action that always 400s is worse than no action.
 *
 * Identification outlives the last stone on purpose. A fully identified order
 * drops out of the identification queue, so this row action is the only way
 * back in to correct a type before the bill fixes the price.
 */
export function useOrderActions(order: Order | null): RowAction[] {
  const { setOpen, setCurrentRow } = useOrders()

  function select(
    dialog:
      | 'view'
      | 'update'
      | 'delete'
      | 'restore'
      | 'add-stone'
      | 'generate-bill'
      | 'hold'
      | 'release'
  ) {
    setCurrentRow(order)
    setOpen(dialog)
  }

  // Called unconditionally by the page before a row is chosen.
  if (!order) return []

  const isDeleted = Boolean(order.deleted_at)
  const isFull = isFullyIdentified(order)

  return [
    {
      label: 'View',
      icon: Eye,
      permission: perm('orders', 'view'),
      onSelect: () => select('view'),
    },
    {
      label: 'Edit',
      icon: Pencil,
      permission: perm('orders', 'change'),
      onSelect: () => select('update'),
      hidden: isDeleted,
    },
    {
      // Same dialog either way; once every stone is in, all that is left to do
      // in it is retype one, so the label and the permission say that.
      label: isFull ? 'Edit identification' : 'Identify stone',
      // Not solid once full: Generate bill is then the row's next step, and a
      // row has one headline action.
      tone: isFull ? undefined : 'advance',
      icon: isFull ? Pencil : Plus,
      permission: isFull ? perm('stones', 'change') : perm('stones', 'add'),
      onSelect: () => select('add-stone'),
      // Hidden while held, which is what a hold means: work on this visit has
      // paused. It also keeps one solid button per row — Release is the
      // headline on a held order, not identification. Hidden once billed,
      // because the bill was priced from these types and they are now fixed.
      hidden: isDeleted || isBilled(order) || isHeld(order),
      separatorBefore: true,
    },
    {
      label: 'Generate bill',
      tone: 'advance',
      icon: FileText,
      permission: PERMISSIONS.generateBill,
      onSelect: () => select('generate-bill'),
      // Gone once a bill exists, not just before every stone is identified: an
      // order awaiting payment is already billed, and `Bill.order` is a
      // OneToOne, so a second attempt is refused by the API anyway.
      hidden: isDeleted || !isFull || isBilled(order) || isHeld(order),
    },
    {
      label: 'Hold',
      icon: PauseCircle,
      permission: PERMISSIONS.holdOrder,
      onSelect: () => select('hold'),
      hidden: isDeleted || isHeld(order),
      separatorBefore: true,
    },
    {
      label: 'Release',
      tone: 'advance',
      icon: PlayCircle,
      permission: PERMISSIONS.holdOrder,
      onSelect: () => select('release'),
      hidden: isDeleted || !isHeld(order),
      separatorBefore: true,
    },
    {
      label: 'Restore',
      icon: RotateCcw,
      permission: restorePerm('orders'),
      onSelect: () => select('restore'),
      hidden: !isDeleted,
      separatorBefore: true,
    },
    {
      label: 'Delete',
      icon: Trash2,
      permission: perm('orders', 'delete'),
      onSelect: () => select('delete'),
      tone: 'destructive',
      hidden: isDeleted,
      separatorBefore: true,
    },
  ]
}
