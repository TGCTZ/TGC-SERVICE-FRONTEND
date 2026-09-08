import { Eye, History, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { PERMISSIONS, perm, restorePerm } from '@/lib/permissions'
import { type RowAction } from '@/components/data-table'
import { useProducts } from '../components/provider'
import { type Product } from '../data/schema'

/**
 * Every action the API exposes for a product, in one place.
 *
 * A hook rather than a component so the table cell and the record's view
 * dialog render the same list — two hand-maintained copies would drift, and
 * the drift would be silent.
 *
 * Delete and Restore are mutually exclusive: a live record cannot be restored
 * and a deleted one cannot be deleted again.
 */
export function useProductActions(product: Product | null): RowAction[] {
  const { setOpen, setCurrentRow } = useProducts()

  function select(
    dialog: 'view' | 'history' | 'update' | 'delete' | 'restore'
  ) {
    setCurrentRow(product)
    setOpen(dialog)
  }

  // Called unconditionally by the page (hooks cannot be conditional) before a
  // row is chosen, so a null record yields an empty list rather than throwing.
  if (!product) return []

  const isDeleted = Boolean(product.deleted_at)

  return [
    {
      label: 'View',
      icon: Eye,
      permission: perm('products', 'view'),
      onSelect: () => select('view'),
    },
    {
      label: 'Edit',
      icon: Pencil,
      permission: perm('products', 'change'),
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
      permission: restorePerm('products'),
      onSelect: () => select('restore'),
      hidden: !isDeleted,
      separatorBefore: true,
    },
    {
      label: 'Delete',
      icon: Trash2,
      permission: perm('products', 'delete'),
      onSelect: () => select('delete'),
      variant: 'destructive',
      hidden: isDeleted,
      separatorBefore: true,
    },
  ]
}
