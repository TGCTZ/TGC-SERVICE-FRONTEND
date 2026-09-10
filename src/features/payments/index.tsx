import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { subjectTypes } from '@/lib/subject-types'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { RecordHistorySheet } from '@/components/record-history-sheet'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { GeneralError } from '@/features/errors/general-error'
import { PaymentsProvider, usePayments } from './components/provider'
import { PaymentsTable, type PaymentsQueryState } from './components/table'
import { PaymentViewDialog } from './components/view-dialog'
import { paymentsQuery } from './data/api'
import { usePaymentActions } from './hooks/use-actions'

const route = getRouteApi('/_authenticated/payments/')

export function Payments() {
  return (
    <PaymentsProvider>
      <PaymentsContent />
    </PaymentsProvider>
  )
}

function PaymentsContent() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { open, setOpen, currentRow, setCurrentRow } = usePayments()

  // The same list the table cell renders.
  const actions = usePaymentActions(currentRow)

  const state: PaymentsQueryState = {
    page: search.page ?? 1,
    perPage: search.pageSize ?? 10,
    search: search.search ?? '',
    sortBy: search.sortBy,
    sortDir: search.sortDir,
    processed: search.processed,
  }

  const { data, isPending, isError, isFetching } = useQuery(
    paymentsQuery({
      page: state.page,
      perPage: state.perPage,
      search: state.search,
      sortBy: state.sortBy,
      sortDir: state.sortDir,
      filters: { is_processed: state.processed },
    })
  )

  function handleStateChange(next: Partial<PaymentsQueryState>) {
    navigate({
      search: (prev) => ({
        ...prev,
        page: next.page ?? prev.page,
        pageSize: next.perPage ?? prev.pageSize,
        search: next.search !== undefined ? next.search : prev.search,
        sortBy: 'sortBy' in next ? next.sortBy : prev.sortBy,
        sortDir: 'sortDir' in next ? next.sortDir : prev.sortDir,
        processed: 'processed' in next ? next.processed : prev.processed,
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
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Payments</h2>
          <p className='text-muted-foreground'>
            Every notification GePG has sent, exactly as it arrived.
          </p>
        </div>

        {isError ? (
          <GeneralError minimal className='h-auto py-12' />
        ) : (
          <PaymentsTable
            data={data?.items ?? []}
            meta={data?.meta}
            isFetching={isPending || isFetching}
            state={state}
            onStateChange={handleStateChange}
            onRowClick={(payment) => {
              setCurrentRow(payment)
              setOpen('view')
            }}
          />
        )}
      </Main>

      {currentRow && (
        <RecordHistorySheet
          subjectType={subjectTypes.payments}
          subjectId={currentRow.id}
          title={currentRow.trx_id || `Payment ${currentRow.id}`}
          open={open === 'history'}
          onOpenChange={(isOpen) => {
            if (!isOpen) setOpen(null)
          }}
        />
      )}

      {currentRow && (
        <PaymentViewDialog
          key={`payment-${currentRow.id}`}
          open={open === 'view'}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setOpen(null)
              setCurrentRow(null)
            }
          }}
          payment={currentRow}
          actions={actions}
        />
      )}
    </>
  )
}
