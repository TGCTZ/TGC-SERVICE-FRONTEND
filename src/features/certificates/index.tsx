import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { PERMISSIONS } from '@/lib/permissions'
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
import { IssueCertificateDialog } from './components/issue-dialog'
import { CertificatesProvider, useCertificates } from './components/provider'
import { RevokeCertificateDialog } from './components/revoke-dialog'
import {
  CertificatesTable,
  type CertificatesQueryState,
} from './components/table'
import { CertificateViewDialog } from './components/view-dialog'
import { certificatesQuery } from './data/api'
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

  // The same list the table cell renders.
  const actions = useCertificateActions(currentRow)

  const state: CertificatesQueryState = {
    page: search.page ?? 1,
    perPage: search.pageSize ?? 10,
    search: search.search ?? '',
    sortBy: search.sortBy,
    sortDir: search.sortDir,
    status: search.status,
  }

  const { data, isPending, isError, isFetching } = useQuery(
    certificatesQuery({
      page: state.page,
      perPage: state.perPage,
      search: state.search,
      sortBy: state.sortBy,
      sortDir: state.sortDir,
      filters: { status: state.status },
    })
  )

  function handleStateChange(next: Partial<CertificatesQueryState>) {
    navigate({
      search: (prev) => ({
        ...prev,
        page: next.page ?? prev.page,
        pageSize: next.perPage ?? prev.pageSize,
        search: next.search !== undefined ? next.search : prev.search,
        sortBy: 'sortBy' in next ? next.sortBy : prev.sortBy,
        sortDir: 'sortDir' in next ? next.sortDir : prev.sortDir,
        status: 'status' in next ? next.status : prev.status,
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
            <h2 className='text-2xl font-bold tracking-tight'>Certificates</h2>
            <p className='text-muted-foreground'>
              The documents the lab stands behind. Each carries a public
              verification link and can be withdrawn, but never edited.
            </p>
          </div>

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
          <CertificatesTable
            data={data?.items ?? []}
            meta={data?.meta}
            isFetching={isPending || isFetching}
            state={state}
            onStateChange={handleStateChange}
            onRowClick={(certificate) => {
              setCurrentRow(certificate)
              setOpen('view')
            }}
          />
        )}
      </Main>

      <IssueCertificateDialog
        open={open === 'issue'}
        onOpenChange={(isOpen) => {
          if (!isOpen) setOpen(null)
        }}
      />

      {currentRow && (
        <RecordHistorySheet
          subjectType={subjectTypes.certificates}
          subjectId={currentRow.id}
          title={currentRow.certificate_number}
          open={open === 'history'}
          onOpenChange={(isOpen) => {
            if (!isOpen) setOpen(null)
          }}
        />
      )}

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
