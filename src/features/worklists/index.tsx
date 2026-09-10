import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { ConfigDrawer } from '@/components/config-drawer'
import { DataTable, type TableQueryState } from '@/components/data-table'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { IssueCertificateDialog } from '@/features/certificates/components/issue-dialog'
import { GeneralError } from '@/features/errors/general-error'
import { ReportMutateDialog } from '@/features/identification/components/mutate-dialog'
import { AddStoneDialog } from '@/features/orders/components/add-stone-dialog'
import { ordersDataColumns } from '@/features/orders/components/columns'
import { GenerateBillDialog } from '@/features/orders/components/generate-bill-dialog'
import { type Order } from '@/features/orders/data/schema'
import { stonesDataColumns } from '@/features/stones/components/columns'
import { type Stone } from '@/features/stones/data/schema'
import { worklistQuery } from './data/api'
import { worklistConfigBySlug, type WorklistConfig } from './data/config'

const route = getRouteApi('/_authenticated/worklists/$slug/')

/** Which row the primary action was pressed on, and which dialog it opens. */
type PendingAction =
  | { slug: 'registration'; order: Order }
  | { slug: 'billing'; order: Order }
  | { slug: 'findings'; stone: Stone }
  | { slug: 'certification'; stone: Stone }

/**
 * One screen for all four queues.
 *
 * The queues differ only in their endpoint, their row shape and the dialog
 * their primary action opens — everything else, including the columns, is
 * borrowed from the feature that owns those rows. So a queue's rows look
 * exactly like the same records look everywhere else in the app.
 */
export function Worklists() {
  const { slug } = route.useParams()
  const config = worklistConfigBySlug(slug)

  if (!config) {
    return <GeneralError minimal className='h-auto py-12' />
  }

  // Remount on slug change so paging and any open dialog reset between queues.
  return <WorklistContent key={slug} config={config} />
}

function WorklistContent({ config }: { config: WorklistConfig }) {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [pending, setPending] = useState<PendingAction | null>(null)

  const state: TableQueryState = {
    page: search.page ?? 1,
    perPage: search.pageSize ?? 10,
    search: '',
    sortBy: undefined,
    sortDir: undefined,
  }

  const { data, isPending, isError, isFetching } = useQuery(
    worklistQuery(config, { page: state.page, perPage: state.perPage })
  )

  function handleStateChange(next: Partial<TableQueryState>) {
    navigate({
      search: (prev) => ({
        ...prev,
        page: next.page ?? prev.page,
        pageSize: next.perPage ?? prev.pageSize,
      }),
      replace: true,
    })
  }

  /**
   * The queue's last column: one button, not a menu.
   *
   * A queue exists to be worked through, so the row offers the single action
   * that clears it rather than the full row-action menu the owning feature
   * shows. Everything else about the row stays reachable from that feature.
   */
  function actionColumn<T>(onAct: (row: T) => void): ColumnDef<T> {
    return {
      id: 'worklist-action',
      cell: ({ row }) => (
        <div className='flex justify-end'>
          <Button size='sm' onClick={() => onAct(row.original)}>
            {config.actionLabel}
          </Button>
        </div>
      ),
    }
  }

  const orderColumns: ColumnDef<Order>[] = [
    ...ordersDataColumns,
    actionColumn<Order>((order) =>
      setPending(
        config.slug === 'registration'
          ? { slug: 'registration', order }
          : { slug: 'billing', order }
      )
    ),
  ]

  const stoneColumns: ColumnDef<Stone>[] = [
    ...stonesDataColumns,
    actionColumn<Stone>((stone) =>
      setPending(
        config.slug === 'findings'
          ? { slug: 'findings', stone }
          : { slug: 'certification', stone }
      )
    ),
  ]

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
          <h2 className='text-2xl font-bold tracking-tight'>{config.title}</h2>
          <p className='text-muted-foreground'>{config.description}</p>
        </div>

        {isError ? (
          <GeneralError minimal className='h-auto py-12' />
        ) : data?.kind === 'stone' ? (
          <DataTable
            columns={stoneColumns}
            data={data.page.items}
            meta={data.page.meta}
            isFetching={isPending || isFetching}
            state={state}
            onStateChange={handleStateChange}
            emptyMessage={config.emptyMessage}
          />
        ) : (
          <DataTable
            columns={orderColumns}
            data={data?.page.items ?? []}
            meta={data?.page.meta}
            isFetching={isPending || isFetching}
            state={state}
            onStateChange={handleStateChange}
            emptyMessage={config.emptyMessage}
          />
        )}
      </Main>

      {/* The dialogs belong to the features that own the action, so a queue
        cannot drift from the screen the same action is performed on. */}
      {pending?.slug === 'registration' && (
        <AddStoneDialog
          open
          onOpenChange={(isOpen) => !isOpen && setPending(null)}
          order={pending.order}
        />
      )}

      {pending?.slug === 'billing' && (
        <GenerateBillDialog
          open
          onOpenChange={(isOpen) => !isOpen && setPending(null)}
          order={pending.order}
        />
      )}

      {pending?.slug === 'findings' && (
        <ReportMutateDialog
          open
          onOpenChange={(isOpen) => !isOpen && setPending(null)}
          currentRow={null}
          initialStone={pending.stone.id}
        />
      )}

      {pending?.slug === 'certification' && (
        <IssueCertificateDialog
          open
          onOpenChange={(isOpen) => !isOpen && setPending(null)}
          initialStone={pending.stone.id}
        />
      )}
    </>
  )
}
