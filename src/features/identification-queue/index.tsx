import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import { perm } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Can } from '@/components/can'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { GeneralError } from '@/features/errors/general-error'
import { AddStoneDialog } from '@/features/orders/components/add-stone-dialog'
import { isFullyIdentified, type Order } from '@/features/orders/data/schema'
import {
  IdentificationTable,
  type IdentificationQueryState,
} from './components/table'
import { identificationOrdersQuery } from './data/api'

const route = getRouteApi('/_authenticated/identification/')

/**
 * The bench's intake screen: which orders still have stones to type.
 *
 * Order-shaped rather than stone-shaped on purpose — identifying a stone is
 * work done *against an order*, and what the gemmologist needs to see is how
 * many of each order's stones are still untyped. The stones themselves live on
 * `/stones`.
 *
 * Opens filtered to the work outstanding; switching to "Fully identified" is
 * how you review what has already been done, which a pure queue cannot show
 * because a row leaves it the moment it is finished.
 */
export function IdentificationQueue() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [identifying, setIdentifying] = useState<Order | null>(null)

  const state: IdentificationQueryState = {
    page: search.page ?? 1,
    perPage: search.pageSize ?? 10,
    search: search.search ?? '',
    sortBy: search.sortBy,
    sortDir: search.sortDir,
    identification: search.identification ?? 'pending',
  }

  const { data, isPending, isError, isFetching } = useQuery(
    identificationOrdersQuery({
      page: state.page,
      perPage: state.perPage,
      search: state.search,
      sortBy: state.sortBy,
      sortDir: state.sortDir,
      identification: state.identification,
    })
  )

  function handleStateChange(next: Partial<IdentificationQueryState>) {
    navigate({
      search: (prev) => ({
        ...prev,
        page: next.page ?? prev.page,
        pageSize: next.perPage ?? prev.pageSize,
        search: next.search !== undefined ? next.search : prev.search,
        sortBy: 'sortBy' in next ? next.sortBy : prev.sortBy,
        sortDir: 'sortDir' in next ? next.sortDir : prev.sortDir,
        identification:
          'identification' in next ? next.identification : prev.identification,
      }),
      replace: true,
    })
  }

  /**
   * The row's one action, rather than the full menu.
   *
   * Hidden once the order is full: the API refuses a stone past `stone_count`,
   * and a button that can only fail is worse than no button.
   */
  const actionColumn: ColumnDef<Order> = {
    id: 'identify',
    cell: ({ row }) => {
      if (isFullyIdentified(row.original)) return null

      return (
        <div className='flex justify-end'>
          <Can permission={perm('stones', 'add')}>
            <Button size='sm' onClick={() => setIdentifying(row.original)}>
              Identify stone
            </Button>
          </Can>
        </div>
      )
    },
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
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Identification</h2>
          <p className='text-muted-foreground'>
            Orders with stones still to be typed. A stone&apos;s type is what
            prices it, so nothing here can be billed until it is done.
          </p>
        </div>

        {isError ? (
          <GeneralError minimal className='h-auto py-12' />
        ) : (
          <IdentificationTable
            data={data?.items ?? []}
            meta={data?.meta}
            isFetching={isPending || isFetching}
            state={state}
            onStateChange={handleStateChange}
            actionColumn={actionColumn}
          />
        )}
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
