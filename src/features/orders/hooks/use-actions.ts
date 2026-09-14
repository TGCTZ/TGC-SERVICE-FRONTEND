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
 * once the order is full, and billing until it is — the API enforces both, and
 * an action that always 400s is worse than no action at all.
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
      label: 'Identify stone',
      icon: Plus,
      permission: perm('stones', 'add'),
      onSelect: () => select('add-stone'),
      hidden: isDeleted || isFull,
      separatorBefore: true,
    },
    {
      label: 'Generate bill',
      icon: FileText,
      permission: PERMISSIONS.generateBill,
      onSelect: () => select('generate-bill'),
      // Gone once a bill exists, not just before every stone is identified: an
      // order awaiting payment is already billed, and `Bill.order` is a
      // OneToOne, so a second attempt is refused by the API anyway.
      hidden: isDeleted || !isFull || isBilled(order),
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
      variant: 'destructive',
      hidden: isDeleted,
      separatorBefore: true,
    },
  ]
}
