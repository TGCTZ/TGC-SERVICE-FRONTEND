import { DataTableRowActions } from '@/components/data-table'
import { type ServiceProvider } from '../data/schema'
import { useServiceProviderActions } from '../hooks/use-actions'

export function ServiceProvidersRowActions({
  provider,
}: {
  provider: ServiceProvider
}) {
  return <DataTableRowActions actions={useServiceProviderActions(provider)} />
}
