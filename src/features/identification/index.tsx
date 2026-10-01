import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
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
import { ReportDeleteDialog } from './components/delete-dialog'
import { FinalizeReportDialog } from './components/finalize-dialog'
import { ReportMutateDialog } from './components/mutate-dialog'
import { ReportsProvider, useReports } from './components/provider'
import { ReportRestoreDialog } from './components/restore-dialog'
import { ReportsTable, type ReportsQueryState } from './components/table'
import { ReportViewDialog } from './components/view-dialog'
import { reportsQuery } from './data/api'
import { useReportActions } from './hooks/use-actions'

const route = getRouteApi('/_authenticated/identification-reports/')

export function Identification() {
  return (
    <ReportsProvider>
      <IdentificationContent />
    </ReportsProvider>
  )
}

function IdentificationContent() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { open, setOpen, currentRow, setCurrentRow } = useReports()

  // The same list the table cell renders.
  const actions = useReportActions(currentRow)

  const state: ReportsQueryState = {
    page: search.page ?? 1,
    perPage: search.pageSize ?? 10,
    search: search.search ?? '',
    sortBy: search.sortBy,
    sortDir: search.sortDir,
    finalized: search.finalized,
    showDeleted: search.showDeleted,
  }

  const { data, isPending, isError, isFetching } = useQuery(
    reportsQuery({
      page: state.page,
      perPage: state.perPage,
      search: state.search,
      sortBy: state.sortBy,
      sortDir: state.sortDir,
      filters: { is_finalized: state.finalized },
      trashed: state.showDeleted ? 'with' : undefined,
    })
  )

  function handleStateChange(next: Partial<ReportsQueryState>) {
    navigate({
      search: (prev) => ({
        ...prev,
        page: next.page ?? prev.page,
        pageSize: next.perPage ?? prev.pageSize,
        search: next.search !== undefined ? next.search : prev.search,
        sortBy: 'sortBy' in next ? next.sortBy : prev.sortBy,
        sortDir: 'sortDir' in next ? next.sortDir : prev.sortDir,
        finalized: 'finalized' in next ? next.finalized : prev.finalized,
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
            title='Findings'
            description="What the bench found, per stone — the findings recorded after payment. A report can only be opened once the stone's bill is settled."
          />

          <Can permission={perm('identification-reports', 'add')}>
            <Button
              onClick={() => {
                setCurrentRow(null)
                setOpen('create')
              }}
            >
              Record findings
              <Plus className='ms-1 size-4' />
            </Button>
          </Can>
        </div>

        {isError ? (
          <GeneralError minimal className='h-auto py-12' />
        ) : (
          <ReportsTable
            data={data?.items ?? []}
            meta={data?.meta}
            isFetching={isPending || isFetching}
            state={state}
            onStateChange={handleStateChange}
            onRowClick={(report) => {
              setCurrentRow(report)
              setOpen('view')
            }}
          />
        )}
      </Main>

      {/* Viewing and editing are separate components: a record is read as a
          definition list, not as a form nobody may type into. */}
      {currentRow && (
        <ReportViewDialog
          key={`report-view-${currentRow.id}`}
          open={open === 'view'}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setOpen(null)
              setCurrentRow(null)
            }
          }}
          report={currentRow}
          onRequestEdit={() => setOpen('update')}
          actions={actions}
        />
      )}

      <ReportMutateDialog
        key={currentRow ? `report-${currentRow.id}` : 'create'}
        open={open === 'create' || open === 'update'}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setOpen(null)
            setCurrentRow(null)
          }
        }}
        currentRow={open === 'create' ? null : currentRow}
      />

      {currentRow && (
        <FinalizeReportDialog
          open={open === 'finalize'}
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
        <ReportRestoreDialog
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
        <ReportDeleteDialog
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
