import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { subjectTypes } from '@/lib/subject-types'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { PageHeading } from '@/components/page-heading'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { RecordHistorySheet } from '@/components/record-history-sheet'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { GeneralError } from '@/features/errors/general-error'
import { CustomerDeleteDialog } from './components/delete-dialog'
import { CustomerMutateDialog } from './components/mutate-dialog'
import { CustomersProvider, useCustomers } from './components/provider'
import { CustomerRestoreDialog } from './components/restore-dialog'
import { CustomersTable, type CustomersQueryState } from './components/table'
import { CustomerViewDialog } from './components/view-dialog'
import { customersQuery } from './data/api'
import { useCustomerActions } from './hooks/use-actions'

const route = getRouteApi('/_authenticated/customers/')

export function Customers() {
  return (
    <CustomersProvider>
      <CustomersContent />
    </CustomersProvider>
  )
}

function CustomersContent() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { open, setOpen, currentRow, setCurrentRow } = useCustomers()

  // The same list the table cell renders.
  const actions = useCustomerActions(currentRow)

  const state: CustomersQueryState = {
    page: search.page ?? 1,
    perPage: search.pageSize ?? 10,
    search: search.search ?? '',
    sortBy: search.sortBy,
    sortDir: search.sortDir,
    showDeleted: search.showDeleted,
  }

  const { data, isPending, isError, isFetching } = useQuery(
    customersQuery({
      page: state.page,
      perPage: state.perPage,
      search: state.search,
      sortBy: state.sortBy,
      sortDir: state.sortDir,
      trashed: state.showDeleted ? 'with' : undefined,
    })
  )

  function handleStateChange(next: Partial<CustomersQueryState>) {
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
        <Search />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <PageHeading
            title='Customers'
            description='The people and companies that submit stones for identification. New ones are registered while receiving an order.'
          />
        </div>

        {isError ? (
          <GeneralError minimal className='h-auto py-12' />
        ) : (
          <CustomersTable
            data={data?.items ?? []}
            meta={data?.meta}
            isFetching={isPending || isFetching}
            state={state}
            onStateChange={handleStateChange}
            onRowClick={(customer) => {
              setCurrentRow(customer)
              setOpen('view')
            }}
          />
        )}
      </Main>

      {currentRow && (
        <RecordHistorySheet
          subjectType={subjectTypes.customers}
          subjectId={currentRow.id}
          title={currentRow.full_name}
          open={open === 'history'}
          onOpenChange={(isOpen) => {
            if (!isOpen) setOpen(null)
          }}
        />
      )}

      {/* Viewing and editing are separate components: a record is read as a
          definition list, not as a form nobody may type into. */}
      {currentRow && (
        <CustomerViewDialog
          key={`customer-view-${currentRow.id}`}
          open={open === 'view'}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setOpen(null)
              setCurrentRow(null)
            }
          }}
          customer={currentRow}
          onRequestEdit={() => setOpen('update')}
          actions={actions}
        />
      )}

      <CustomerMutateDialog
        key={currentRow ? `customer-${currentRow.id}` : 'none'}
        open={open === 'update'}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setOpen(null)
            setCurrentRow(null)
          }
        }}
        currentRow={currentRow}
      />

      {currentRow && (
        <CustomerRestoreDialog
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
        <CustomerDeleteDialog
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
