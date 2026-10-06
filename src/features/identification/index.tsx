import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { perm } from '@/lib/permissions'
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
import {
  WorkflowFeedTable,
  type WorkflowListState,
} from '@/features/workflow-feed'
import {
  workflowFeedQuery,
  type WorkflowRow,
} from '@/features/workflow-feed/data/api'
import { ReportDeleteDialog } from './components/delete-dialog'
import { FinalizeReportDialog } from './components/finalize-dialog'
import { ReportMutateDialog } from './components/mutate-dialog'
import { ReportsProvider, useReports } from './components/provider'
import { ReportRestoreDialog } from './components/restore-dialog'
import { ReportsRowActions } from './components/row-actions'
import { ReportViewDialog } from './components/view-dialog'
import { reportSchema, type IdentificationReport } from './data/schema'
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
  const [initialStone, setInitialStone] = useState<number | undefined>()

  // The same list the table cell renders.
  const actions = useReportActions(currentRow)

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
    workflowFeedQuery('/identification-reports/workflow-feed', {
      page: state.page,
      pageSize: state.perPage,
      search: state.search,
      sortBy: state.sortBy,
      sortDir: state.sortDir,
      status: state.status,
      type: state.type,
      source: state.source,
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
          title='Findings'
          description='Record findings for paid stones.'
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
              row.kind === 'report' ? (
                <StatusBadge
                  tone={row.status === 'Finalized' ? 'success' : 'neutral'}
                >
                  {row.status}
                </StatusBadge>
              ) : (
                <StatusBadge tone='info'>{row.status}</StatusBadge>
              )
            }
            renderAction={(row: WorkflowRow) => {
              if (row.kind === 'stone') {
                const action: RowAction = {
                  label: 'Record findings',
                  icon: Plus,
                  tone: 'advance',
                  permission: perm('identification-reports', 'add'),
                  onSelect: () => {
                    setInitialStone(row.record_id)
                    setCurrentRow(null)
                    setOpen('create')
                  },
                }
                return <DataTableRowActions actions={[action]} />
              }
              if (row.kind !== 'report') return null
              const report = reportSchema.parse(
                row.detail
              ) as IdentificationReport
              return <ReportsRowActions report={report} />
            }}
            onRowClick={(row: WorkflowRow) => {
              if (row.kind === 'report') {
                setCurrentRow(
                  reportSchema.parse(row.detail) as IdentificationReport
                )
                setOpen('view')
              }
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
        initialStone={initialStone}
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
