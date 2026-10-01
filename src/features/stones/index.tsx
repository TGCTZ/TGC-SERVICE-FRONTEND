import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { PageHeading } from '@/components/page-heading'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { GeneralError } from '@/features/errors/general-error'
import { StoneDeleteDialog } from './components/delete-dialog'
import { StoneMutateDialog } from './components/mutate-dialog'
import { StonesProvider, useStones } from './components/provider'
import { StoneRestoreDialog } from './components/restore-dialog'
import { StonesTable, type StonesQueryState } from './components/table'
import { StoneTransitionDialog } from './components/transition-dialog'
import { StoneViewDialog } from './components/view-dialog'
import { stonesQuery } from './data/api'
import { useStoneActions } from './hooks/use-actions'

const route = getRouteApi('/_authenticated/stones/')

export function Stones() {
  return (
    <StonesProvider>
      <StonesContent />
    </StonesProvider>
  )
}

function StonesContent() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { open, setOpen, currentRow, setCurrentRow } = useStones()

  // The same list the table cell renders.
  const actions = useStoneActions(currentRow)

  const state: StonesQueryState = {
    page: search.page ?? 1,
    perPage: search.pageSize ?? 10,
    search: search.search ?? '',
    sortBy: search.sortBy,
    sortDir: search.sortDir,
    status: search.status,
    showDeleted: search.showDeleted,
  }

  const { data, isPending, isError, isFetching } = useQuery(
    stonesQuery({
      page: state.page,
      perPage: state.perPage,
      search: state.search,
      sortBy: state.sortBy,
      sortDir: state.sortDir,
      filters: { status: state.status },
      trashed: state.showDeleted ? 'with' : undefined,
    })
  )

  function handleStateChange(next: Partial<StonesQueryState>) {
    navigate({
      search: (prev) => ({
        ...prev,
        page: next.page ?? prev.page,
        pageSize: next.perPage ?? prev.pageSize,
        search: next.search !== undefined ? next.search : prev.search,
        sortBy: 'sortBy' in next ? next.sortBy : prev.sortBy,
        sortDir: 'sortDir' in next ? next.sortDir : prev.sortDir,
        status: 'status' in next ? next.status : prev.status,
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
        <PageHeading
          title='Stones'
          description='Every stone in the lab, what it was typed as, and where it has got to. Stones are typed on the Identification screen and weighed with the findings.'
        />

        {isError ? (
          <GeneralError minimal className='h-auto py-12' />
        ) : (
          <StonesTable
            data={data?.items ?? []}
            meta={data?.meta}
            isFetching={isPending || isFetching}
            state={state}
            onStateChange={handleStateChange}
            onRowClick={(stone) => {
              setCurrentRow(stone)
              setOpen('view')
            }}
          />
        )}
      </Main>

      {/* Viewing and editing are separate components: a record is read as a
          definition list, not as a form nobody may type into. */}
      {currentRow && (
        <StoneViewDialog
          key={`stone-view-${currentRow.id}`}
          open={open === 'view'}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setOpen(null)
              setCurrentRow(null)
            }
          }}
          stone={currentRow}
          onRequestEdit={() => setOpen('update')}
          actions={actions}
        />
      )}

      <StoneMutateDialog
        key={currentRow ? `stone-${currentRow.id}` : 'none'}
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
        <StoneTransitionDialog
          open={open === 'transition'}
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
        <StoneRestoreDialog
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
        <StoneDeleteDialog
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
