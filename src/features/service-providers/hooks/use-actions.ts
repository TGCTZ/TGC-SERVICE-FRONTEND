import { Eye, History, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { PERMISSIONS, perm, restorePerm } from '@/lib/permissions'
import { type RowAction } from '@/components/data-table'
import { useServiceProviders } from '../components/provider'
import { type ServiceProvider } from '../data/schema'

/** Every action the API exposes for a service provider, in one place. */
export function useServiceProviderActions(
  provider: ServiceProvider | null
): RowAction[] {
  const { setOpen, setCurrentRow } = useServiceProviders()

  function select(
    dialog: 'view' | 'history' | 'update' | 'delete' | 'restore'
  ) {
    setCurrentRow(provider)
    setOpen(dialog)
  }

  // Called unconditionally by the page before a row is chosen.
  if (!provider) return []

  const isDeleted = Boolean(provider.deleted_at)

  return [
    {
      label: 'View',
      icon: Eye,
      permission: perm('service-providers', 'view'),
      onSelect: () => select('view'),
    },
    {
      label: 'Edit',
      icon: Pencil,
      permission: perm('service-providers', 'change'),
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
      permission: restorePerm('service-providers'),
      onSelect: () => select('restore'),
      hidden: !isDeleted,
      separatorBefore: true,
    },
    {
      label: 'Delete',
      icon: Trash2,
      permission: perm('service-providers', 'delete'),
      onSelect: () => select('delete'),
      variant: 'destructive',
      hidden: isDeleted,
      separatorBefore: true,
    },
  ]
}
