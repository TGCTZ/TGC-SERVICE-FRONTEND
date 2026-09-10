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
import { AddStoneDialog } from './components/add-stone-dialog'
import { OrderDeleteDialog } from './components/delete-dialog'
import { GenerateBillDialog } from './components/generate-bill-dialog'
import { OrderMutateDialog } from './components/mutate-dialog'
import { OrdersProvider, useOrders } from './components/provider'
import { OrderRestoreDialog } from './components/restore-dialog'
import { OrdersTable, type OrdersQueryState } from './components/table'
import { ordersQuery } from './data/api'
import { useOrderActions } from './hooks/use-actions'

const route = getRouteApi('/_authenticated/orders/')

export function Orders() {
  return (
    <OrdersProvider>
      <OrdersContent />
    </OrdersProvider>
  )
}

function OrdersContent() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { open, setOpen, currentRow, setCurrentRow } = useOrders()

  // The same list the table cell renders.
  const actions = useOrderActions(currentRow)

  const state: OrdersQueryState = {
    page: search.page ?? 1,
    perPage: search.pageSize ?? 10,
    search: search.search ?? '',
    sortBy: search.sortBy,
    sortDir: search.sortDir,
    showDeleted: search.showDeleted,
  }

  const { data, isPending, isError, isFetching } = useQuery(
    ordersQuery({
      page: state.page,
      perPage: state.perPage,
      search: state.search,
      sortBy: state.sortBy,
      sortDir: state.sortDir,
      trashed: state.showDeleted ? 'with' : undefined,
    })
  )

  function handleStateChange(next: Partial<OrdersQueryState>) {
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
            <h2 className='text-2xl font-bold tracking-tight'>Orders</h2>
            <p className='text-muted-foreground'>
              Each visit a customer makes, and the stones they left behind.
            </p>
          </div>

          <Can permission={perm('orders', 'add')}>
            <Button
              onClick={() => {
                setCurrentRow(null)
                setOpen('create')
              }}
            >
              Receive order
              <Plus className='ms-1 size-4' />
            </Button>
          </Can>
        </div>

        {isError ? (
          <GeneralError minimal className='h-auto py-12' />
        ) : (
          <OrdersTable
            data={data?.items ?? []}
            meta={data?.meta}
            isFetching={isPending || isFetching}
            state={state}
            onStateChange={handleStateChange}
            onRowClick={(order) => {
              setCurrentRow(order)
              setOpen('view')
            }}
          />
        )}
      </Main>

      {currentRow && (
        <RecordHistorySheet
          subjectType={subjectTypes.orders}
          subjectId={currentRow.id}
          title={currentRow.reference_number}
          open={open === 'history'}
          onOpenChange={(isOpen) => {
            if (!isOpen) setOpen(null)
          }}
        />
      )}

      {/* View and Edit share one dialog; `readOnly` decides which. */}
      <OrderMutateDialog
        key={currentRow ? `order-${currentRow.id}` : 'create'}
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
        onRegisterStone={() => setOpen('add-stone')}
        actions={actions}
      />

      {currentRow && (
        <AddStoneDialog
          open={open === 'add-stone'}
          onOpenChange={(isOpen) => {
            if (!isOpen) setOpen(null)
          }}
          order={currentRow}
        />
      )}

      {currentRow && (
        <GenerateBillDialog
          open={open === 'generate-bill'}
          onOpenChange={(isOpen) => {
            if (!isOpen) setOpen(null)
          }}
          order={currentRow}
        />
      )}

      {currentRow && (
        <OrderRestoreDialog
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
        <OrderDeleteDialog
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
