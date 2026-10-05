import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { FileText } from 'lucide-react'
import { ConfigDrawer } from '@/components/config-drawer'
import { DataTableRowActions, type RowAction } from '@/components/data-table'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { PageHeading } from '@/components/page-heading'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { StatusBadge } from '@/components/status-badge'
import { ThemeSwitch } from '@/components/theme-switch'
import { GeneralError } from '@/features/errors/general-error'
import { GenerateBillDialog } from '@/features/orders/components/generate-bill-dialog'
import {
  ORDER_STAGE_TONES,
  orderSchema,
  type Order,
} from '@/features/orders/data/schema'
import {
  WorkflowFeedTable,
  type WorkflowListState,
} from '@/features/workflow-feed'
import {
  workflowFeedQuery,
  type WorkflowRow,
} from '@/features/workflow-feed/data/api'
import { BillsProvider, useBills } from './components/provider'
import { BillsRowActions } from './components/row-actions'
import { SimulatePaymentDialog } from './components/simulate-payment-dialog'
import { BillStatusBadge } from './components/status-badge'
import { BillViewDialog } from './components/view-dialog'
import { billSchema, type Bill } from './data/schema'
import { useBillActions } from './hooks/use-actions'

const route = getRouteApi('/_authenticated/bills/')

export function Bills() {
  return (
    <BillsProvider>
      <BillsContent />
    </BillsProvider>
  )
}

function BillsContent() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { open, setOpen, currentRow, setCurrentRow } = useBills()
  const [billOrder, setBillOrder] = useState<Order | null>(null)

  // The same list the table cell renders.
  const actions = useBillActions(currentRow)

  const state: WorkflowListState = {
    page: search.page ?? 1,
    perPage: search.pageSize ?? 10,
    search: search.search ?? '',
    sortBy: search.sortBy,
    sortDir: search.sortDir,
    status: search.status,
    type: search.type,
    source: search.source,
  }

  const { data, isPending, isError, isFetching } = useQuery(
    workflowFeedQuery('/bills/workflow-feed', {
      page: state.page,
      pageSize: state.perPage,
      search: state.search,
      sortBy: state.sortBy,
      sortDir: state.sortDir,
      status: state.status,
      type: search.type,
      source: search.source,
    })
  )

  function handleStateChange(next: Partial<WorkflowListState>) {
    navigate({
      search: (prev) => ({
        ...prev,
        page: next.page ?? prev.page,
        pageSize: next.perPage ?? prev.pageSize,
        search: next.search !== undefined ? next.search : prev.search,
        sortBy: 'sortBy' in next ? next.sortBy : prev.sortBy,
        sortDir: 'sortDir' in next ? next.sortDir : prev.sortDir,
        status: 'status' in next ? next.status : prev.status,
        type: 'type' in next ? next.type : prev.type,
        source:
          'source' in next
            ? (next.source as 'waiting' | 'records' | undefined)
            : prev.source,
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
        <PageHeading
          title='Bills'
          description='What each order was charged, what GePG has collected, and which orders are ready to bill.'
        />

        {isError ? (
          <GeneralError minimal className='h-auto py-12' />
        ) : (
          <WorkflowFeedTable
            rows={data?.results ?? []}
            count={data?.count ?? 0}
            isFetching={isPending || isFetching}
            state={state}
            onStateChange={handleStateChange}
            renderStatus={(row) =>
              row.kind === 'bill' ? (
                <BillStatusBadge status={billSchema.parse(row.detail).status} />
              ) : (
                <StatusBadge
                  tone={ORDER_STAGE_TONES[orderSchema.parse(row.detail).stage]}
                >
                  {row.status}
                </StatusBadge>
              )
            }
            renderAction={(row) => {
              if (row.kind === 'bill') {
                return (
                  <BillsRowActions
                    bill={billSchema.parse(row.detail) as Bill}
                  />
                )
              }
              if (row.kind !== 'order') return null
              const action: RowAction = {
                label: 'Generate bill',
                icon: FileText,
                tone: 'advance',
                permission: 'billing.generate_bill',
                onSelect: () => setBillOrder(orderSchema.parse(row.detail)),
              }
              return <DataTableRowActions actions={[action]} />
            }}
            onAction={(row: WorkflowRow) =>
              row.kind === 'order' &&
              setBillOrder(orderSchema.parse(row.detail))
            }
            onRowClick={(row: WorkflowRow) => {
              if (row.kind === 'bill') {
                setCurrentRow(billSchema.parse(row.detail) as Bill)
                setOpen('view')
              }
            }}
          />
        )}
      </Main>

      {currentRow && (
        <SimulatePaymentDialog
          key={`simulate-${currentRow.id}`}
          open={open === 'simulate-payment'}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setOpen(null)
              setCurrentRow(null)
            }
          }}
          bill={currentRow}
        />
      )}
      {billOrder && (
        <GenerateBillDialog
          open
          onOpenChange={(next) => !next && setBillOrder(null)}
          order={billOrder}
        />
      )}

      {currentRow && (
        <BillViewDialog
          key={`bill-${currentRow.id}`}
          open={open === 'view'}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setOpen(null)
              setCurrentRow(null)
            }
          }}
          bill={currentRow}
          actions={actions}
        />
      )}
    </>
  )
}
