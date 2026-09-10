import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { perm } from '@/lib/permissions'
import { subjectTypes } from '@/lib/subject-types'
import { Button } from '@/components/ui/button'
import { Can } from '@/components/can'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { RecordHistorySheet } from '@/components/record-history-sheet'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { GeneralError } from '@/features/errors/general-error'
import { ServiceProviderDeleteDialog } from './components/delete-dialog'
import { ServiceProviderMutateDialog } from './components/mutate-dialog'
import {
  ServiceProvidersProvider,
  useServiceProviders,
} from './components/provider'
import { ServiceProviderRestoreDialog } from './components/restore-dialog'
import {
  ServiceProvidersTable,
  type ServiceProvidersQueryState,
} from './components/table'
import { serviceProvidersQuery } from './data/api'
import { useServiceProviderActions } from './hooks/use-actions'

const route = getRouteApi('/_authenticated/service-providers/')

export function ServiceProviders() {
  return (
    <ServiceProvidersProvider>
      <ServiceProvidersContent />
    </ServiceProvidersProvider>
  )
}

function ServiceProvidersContent() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { open, setOpen, currentRow, setCurrentRow } = useServiceProviders()

  // The same list the table cell renders.
  const actions = useServiceProviderActions(currentRow)

  const state: ServiceProvidersQueryState = {
    page: search.page ?? 1,
    perPage: search.pageSize ?? 10,
    search: search.search ?? '',
    sortBy: search.sortBy,
    sortDir: search.sortDir,
    showDeleted: search.showDeleted,
  }

  const { data, isPending, isError, isFetching } = useQuery(
    serviceProvidersQuery({
      page: state.page,
      perPage: state.perPage,
      search: state.search,
      sortBy: state.sortBy,
      sortDir: state.sortDir,
      trashed: state.showDeleted ? 'with' : undefined,
    })
  )

  function handleStateChange(next: Partial<ServiceProvidersQueryState>) {
    navigate({
      search: (prev) => ({
        ...prev,
        page: next.page ?? prev.page,
        pageSize: next.perPage ?? prev.pageSize,
        search: next.search !== undefined ? next.search : prev.search,
        sortBy: 'sortBy' in next ? next.sortBy : prev.sortBy,
        sortDir: 'sortDir' in next ? next.sortDir : prev.sortDir,
        showDeleted:
          'showDeleted' in next ? next.showDeleted : prev.showDeleted,
      }),
      replace: true,
    })
  }

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>
              Service providers
            </h2>
            <p className='text-muted-foreground'>
              How the lab identifies itself to GePG when a bill is submitted.
            </p>
          </div>

          <Can permission={perm('service-providers', 'add')}>
            <Button
              onClick={() => {
                setCurrentRow(null)
                setOpen('create')
              }}
            >
              Add provider
              <Plus className='ms-1 size-4' />
            </Button>
          </Can>
        </div>

        {isError ? (
          <GeneralError minimal className='h-auto py-12' />
        ) : (
          <ServiceProvidersTable
            data={data?.items ?? []}
            meta={data?.meta}
            isFetching={isPending || isFetching}
            state={state}
            onStateChange={handleStateChange}
            onRowClick={(provider) => {
              setCurrentRow(provider)
              setOpen('view')
            }}
          />
        )}
      </Main>

      {currentRow && (
        <RecordHistorySheet
          subjectType={subjectTypes['service-providers']}
          subjectId={currentRow.id}
          title={currentRow.name}
          open={open === 'history'}
          onOpenChange={(isOpen) => {
            if (!isOpen) setOpen(null)
          }}
        />
      )}

      {/* View and Edit share one dialog; `readOnly` decides which. */}
      <ServiceProviderMutateDialog
        key={currentRow ? `provider-${currentRow.id}` : 'create'}
        open={open === 'view' || open === 'create' || open === 'update'}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setOpen(null)
            setCurrentRow(null)
          }
        }}
        currentRow={open === 'create' ? null : currentRow}
        readOnly={open === 'view'}
        onRequestEdit={() => setOpen('update')}
        actions={actions}
      />

      {currentRow && (
        <ServiceProviderRestoreDialog
          open={open === 'restore'}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setOpen(null)
              setCurrentRow(null)
            }
          }}
          currentRow={currentRow}
        />
      )}

      {currentRow && (
        <ServiceProviderDeleteDialog
          open={open === 'delete'}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setOpen(null)
              setCurrentRow(null)
            }
          }}
          currentRow={currentRow}
        />
      )}
    </>
  )
}
