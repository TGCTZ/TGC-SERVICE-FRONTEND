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
import { PageHeading } from '@/components/page-heading'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { GeneralError } from '@/features/errors/general-error'
import { AddStoneDialog } from '@/features/orders/components/add-stone-dialog'
import { isBilled, type Order } from '@/features/orders/data/schema'
import {
  IdentificationTable,
  type IdentificationQueryState,
} from './components/table'
import { identificationOrdersQuery } from './data/api'

const route = getRouteApi('/_authenticated/identification/')

/**
 * Finished identification: orders whose every stone has been typed.
 *
 * The other half of the identification queue. The queue holds the work still
 * to do - orders with stones left to type - and a row leaves it the moment it
 * is finished, so it cannot show what has been done. This page is where that
 * lives, for review and for correcting a type before the order is billed.
 *
 * Order-shaped rather than stone-shaped on purpose — identification is work
 * done *against an order*. The stones themselves live on `/stones`.
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
    stage: search.stage,
  }

  const { data, isPending, isError, isFetching } = useQuery(
    identificationOrdersQuery({
      page: state.page,
      perPage: state.perPage,
      search: state.search,
      sortBy: state.sortBy,
      sortDir: state.sortDir,
      stage: state.stage,
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
        stage: 'stage' in next ? next.stage : prev.stage,
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
  const actionColumn: ColumnDef<Order> = {
    id: 'identify',
    cell: ({ row }) => {
      const order = row.original
      if (isBilled(order)) return null

      return (
        <div className='flex justify-end'>
          <Can permission={perm('stones', 'change')}>
            <Button
              size='sm'
              variant='outline'
              onClick={() => setIdentifying(order)}
            >
              Edit identification
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
        <PageHeading
          title='Identification'
          description='Orders whose stones have all been identified. A type can still be corrected until the order is billed; orders with stones left to type are in the identification queue.'
        />

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
