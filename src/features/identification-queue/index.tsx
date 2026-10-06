import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { Pencil, Plus } from 'lucide-react'
import { getCurrentPermissions } from '@/lib/authz'
import { perm } from '@/lib/permissions'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { AddStoneDialog } from '@/features/orders/components/add-stone-dialog'
import {
  ORDER_STAGE_TONES,
  type Order,
  orderSchema,
} from '@/features/orders/data/schema'
import { Stones } from '@/features/stones'
import {
  WorkflowFeedTable,
  type WorkflowListState,
} from '@/features/workflow-feed'
import {
  workflowFeedQuery,
  type WorkflowRow,
} from '@/features/workflow-feed/data/api'

const route = getRouteApi('/_authenticated/identification/')

/**
 * One identification feed combines waiting and completed orders. Stones remain
 * available in the adjacent view for users who have stone-view access.
 */
export function IdentificationQueue() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const permissions = getCurrentPermissions()
  const canViewOrders = permissions.includes('orders.view_order')
  const canViewStones = permissions.includes('orders.view_stone')
  const selectedTab = canViewOrders
    ? search.tab === 'stones' && canViewStones
      ? 'stones'
      : 'work'
    : 'stones'
  const [identifying, setIdentifying] = useState<Order | null>(null)

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

  const { data, isPending, isError, isFetching } = useQuery({
    ...workflowFeedQuery('/orders/workflow-feed', {
      page: state.page,
      pageSize: state.perPage,
      search: state.search,
      sortBy: state.sortBy,
      sortDir: state.sortDir,
      status: state.status,
      type: state.type,
      source: state.source,
    }),
    enabled: canViewOrders && selectedTab === 'work',
  })

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

  /**
   * The row's one action, rather than the full menu.
   *
   * Every row here is fully identified, so the identify dialog is only for
   * retyping a stone - hence Edit, gated on the change permission. Gone once
   * the order is billed: the bill was priced from these types, the API refuses
   * a retype, and a button that can only fail is worse than no button.
   */
  function startAction(row: WorkflowRow) {
    if (row.kind !== 'order') return
    const order = orderSchema.parse(row.detail) as Order
    setIdentifying(order)
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
          title='Identification'
          description='Orders waiting for stone identification.'
        />
        <Tabs
          value={selectedTab}
          onValueChange={(tab) =>
            navigate({
              search: (prev) => ({ ...prev, tab: tab as 'work' | 'stones' }),
              replace: true,
            })
          }
        >
          <TabsList>
            {canViewOrders && (
              <TabsTrigger value='work'>Identification</TabsTrigger>
            )}
            {canViewStones && <TabsTrigger value='stones'>Stones</TabsTrigger>}
          </TabsList>
          {canViewOrders && (
            <TabsContent value='work'>
              {isError ? (
                <GeneralError minimal className='h-auto py-12' />
              ) : (
                <WorkflowFeedTable
                  rows={data?.results ?? []}
                  count={data?.count ?? 0}
                  isFetching={isPending || isFetching}
                  state={state}
                  onStateChange={handleStateChange}
                  renderStatus={(row) => {
                    const order = orderSchema.parse(row.detail)
                    return (
                      <StatusBadge tone={ORDER_STAGE_TONES[order.stage]}>
                        {row.status}
                      </StatusBadge>
                    )
                  }}
                  progressHeader='Stones identified'
                  renderProgress={(row) => {
                    const order = orderSchema.parse(row.detail)
                    return (
                      <div className='min-w-40 space-y-1.5'>
                        <div className='text-xs tabular-nums'>
                          {order.identified_count} of {order.stone_count}{' '}
                          identified
                        </div>
                        <Progress
                          value={order.identified_count}
                          max={order.stone_count}
                          label={`Identification progress for ${order.reference_number}`}
                        />
                      </div>
                    )
                  }}
                  renderAction={(row) => {
                    const action: RowAction = {
                      label: row.waiting ? 'Identify' : 'Edit identification',
                      icon: row.waiting ? Plus : Pencil,
                      tone: row.waiting ? 'advance' : 'neutral',
                      permission: row.waiting
                        ? 'orders.add_stone'
                        : perm('stones', 'change'),
                      onSelect: () => startAction(row),
                    }
                    return <DataTableRowActions actions={[action]} />
                  }}
                  onAction={startAction}
                />
              )}
            </TabsContent>
          )}
          {canViewStones && (
            <TabsContent value='stones'>
              <Stones embedded />
            </TabsContent>
          )}
        </Tabs>
      </Main>

      {identifying && (
        <AddStoneDialog
          open
          onOpenChange={(isOpen) => !isOpen && setIdentifying(null)}
          order={identifying}
        />
      )}
    </>
  )
}
