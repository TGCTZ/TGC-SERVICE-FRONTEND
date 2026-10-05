import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { BadgeCheck, Plus } from 'lucide-react'
import { PERMISSIONS } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Can } from '@/components/can'
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
import { IssueCertificateDialog } from './components/issue-dialog'
import { CertificatePreviewDialog } from './components/preview-dialog'
import { CertificatesProvider, useCertificates } from './components/provider'
import { RevokeCertificateDialog } from './components/revoke-dialog'
import { CertificatesRowActions } from './components/row-actions'
import { CertificateStatusBadge } from './components/status-badge'
import { CertificateViewDialog } from './components/view-dialog'
import { certificateSchema, type Certificate } from './data/schema'
import { useCertificateActions } from './hooks/use-actions'

const route = getRouteApi('/_authenticated/certificates/')

export function Certificates() {
  return (
    <CertificatesProvider>
      <CertificatesContent />
    </CertificatesProvider>
  )
}

function CertificatesContent() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { open, setOpen, currentRow, setCurrentRow } = useCertificates()
  const [initialStone, setInitialStone] = useState<number | undefined>()

  // The same list the table cell renders.
  const actions = useCertificateActions(currentRow)

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
    workflowFeedQuery('/certificates/workflow-feed', {
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
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <PageHeading
            title='Certificates'
            description='The documents the lab stands behind. Each downloads as a PDF for printing, and can be withdrawn, but never edited.'
          />

          <Can permission={PERMISSIONS.issueCertificate}>
            <Button
              onClick={() => {
                setCurrentRow(null)
                setOpen('issue')
              }}
            >
              Issue certificate
              <Plus className='ms-1 size-4' />
            </Button>
          </Can>
        </div>

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
              row.kind === 'certificate' ? (
                <CertificateStatusBadge
                  status={certificateSchema.parse(row.detail).status}
                />
              ) : (
                <StatusBadge tone='info'>{row.status}</StatusBadge>
              )
            }
            renderAction={(row) => {
              if (row.kind === 'certificate') {
                return (
                  <CertificatesRowActions
                    certificate={
                      certificateSchema.parse(row.detail) as Certificate
                    }
                  />
                )
              }
              if (row.kind !== 'stone') return null
              const action: RowAction = {
                label: 'Issue certificate',
                icon: BadgeCheck,
                tone: 'advance',
                permission: PERMISSIONS.issueCertificate,
                onSelect: () => {
                  setInitialStone(row.record_id)
                  setOpen('issue')
                },
              }
              return <DataTableRowActions actions={[action]} />
            }}
            onAction={(row: WorkflowRow) => {
              if (row.kind === 'stone') {
                setInitialStone(row.record_id)
                setOpen('issue')
              }
            }}
            onRowClick={(row: WorkflowRow) => {
              if (row.kind === 'certificate') {
                setCurrentRow(
                  certificateSchema.parse(row.detail) as Certificate
                )
                setOpen('view')
              }
            }}
          />
        )}
      </Main>

      <IssueCertificateDialog
        open={open === 'issue'}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setOpen(null)
            setInitialStone(undefined)
          }
        }}
        initialStone={initialStone}
      />

      {currentRow && (
        <CertificateViewDialog
          key={`certificate-${currentRow.id}`}
          open={open === 'view'}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setOpen(null)
              setCurrentRow(null)
            }
          }}
          certificate={currentRow}
          actions={actions}
        />
      )}

      {currentRow && (
        <CertificatePreviewDialog
          open={open === 'preview'}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setOpen(null)
              setCurrentRow(null)
            }
          }}
          certificate={currentRow}
        />
      )}

      {currentRow && (
        <RevokeCertificateDialog
          open={open === 'revoke'}
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
