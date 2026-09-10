import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import { formatDateTime } from '@/lib/format'
import { ConfigDrawer } from '@/components/config-drawer'
import { DataTable, type TableQueryState } from '@/components/data-table'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { accessLogsQuery } from '@/features/certificates/data/api'
import { type CertificateAccessLog } from '@/features/certificates/data/schema'
import { GeneralError } from '@/features/errors/general-error'

const route = getRouteApi('/_authenticated/certificate-access-logs/')

/**
 * Who checked a certificate, and when.
 *
 * An append-only ledger with no dialogs at all: there is no record to open
 * beyond the four facts already in the row, and nothing here can be created,
 * edited or removed — the public verification endpoint is the only writer.
 */
export function CertificateAccessLogs() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const state: TableQueryState = {
    page: search.page ?? 1,
    perPage: search.pageSize ?? 10,
    search: '',
    sortBy: search.sortBy,
    sortDir: search.sortDir,
  }

  const { data, isPending, isError, isFetching } = useQuery(
    accessLogsQuery({
      page: state.page,
      perPage: state.perPage,
      sortBy: state.sortBy,
      sortDir: state.sortDir,
    })
  )

  const columns: ColumnDef<CertificateAccessLog>[] = [
    {
      accessorKey: 'certificate',
      header: () => <span>Certificate</span>,
      cell: ({ row }) => (
        <span className='font-medium'>#{row.original.certificate}</span>
      ),
    },
    {
      accessorKey: 'accessed_at',
      header: () => <span>When</span>,
      cell: ({ row }) => formatDateTime(row.original.accessed_at),
    },
    {
      accessorKey: 'ip_address',
      header: () => <span>IP address</span>,
      cell: ({ row }) =>
        row.original.ip_address ?? (
          <span className='text-muted-foreground'>Unknown</span>
        ),
    },
    {
      accessorKey: 'user_agent',
      header: () => <span>User agent</span>,
      cell: ({ row }) => (
        <span className='block max-w-96 truncate text-xs text-muted-foreground'>
          {row.original.user_agent || '—'}
        </span>
      ),
    },
  ]

  function handleStateChange(next: Partial<TableQueryState>) {
    navigate({
      search: (prev) => ({
        ...prev,
        page: next.page ?? prev.page,
        pageSize: next.perPage ?? prev.pageSize,
        sortBy: 'sortBy' in next ? next.sortBy : prev.sortBy,
        sortDir: 'sortDir' in next ? next.sortDir : prev.sortDir,
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
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>
            Verification log
          </h2>
          <p className='text-muted-foreground'>
            Every time someone checked a certificate through its public link.
          </p>
        </div>

        {isError ? (
          <GeneralError minimal className='h-auto py-12' />
        ) : (
          <DataTable
            columns={columns}
            data={data?.items ?? []}
            meta={data?.meta}
            isFetching={isPending || isFetching}
            state={state}
            onStateChange={handleStateChange}
            emptyMessage='No verifications recorded yet.'
          />
        )}
      </Main>
    </>
  )
}
