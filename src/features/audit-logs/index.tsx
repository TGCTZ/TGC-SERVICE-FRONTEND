import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { GeneralError } from '@/features/errors/general-error'
import { AuditLogDetailDialog } from './components/detail-dialog'
import { AuditLogsTable, type AuditLogsQueryState } from './components/table'
import { activityLogsQueryOptions } from './data/api'
import { type ActivityLog } from './data/schema'

const route = getRouteApi('/_authenticated/audit-logs/')

export function AuditLogs() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [selected, setSelected] = useState<ActivityLog | null>(null)

  // Table state lives in the URL, so a filtered view is shareable - which
  // matters more here than anywhere else: "look at what happened on Tuesday"
  // should be a link you can paste to a colleague.
  const state: AuditLogsQueryState = {
    page: search.page ?? 1,
    perPage: search.pageSize ?? 25,
    search: search.search ?? '',
    sortBy: search.sortBy,
    sortDir: search.sortDir,
    event: search.event,
    dateFrom: search.dateFrom,
    dateTo: search.dateTo,
  }

  const { data, isPending, isError, isFetching } = useQuery(
    activityLogsQueryOptions({
      page: state.page,
      perPage: state.perPage,
      search: state.search,
      sortBy: state.sortBy,
      sortDir: state.sortDir,
      filters: {
        event: state.event,
        created_at: { from: state.dateFrom, to: state.dateTo },
      },
    })
  )

  function handleStateChange(next: Partial<AuditLogsQueryState>) {
    navigate({
      search: (prev) => ({
        ...prev,
        page: next.page ?? prev.page,
        pageSize: next.perPage ?? prev.pageSize,
        search: next.search !== undefined ? next.search : prev.search,
        sortBy: 'sortBy' in next ? next.sortBy : prev.sortBy,
        sortDir: 'sortDir' in next ? next.sortDir : prev.sortDir,
        event: 'event' in next ? next.event : prev.event,
        dateFrom: 'dateFrom' in next ? next.dateFrom : prev.dateFrom,
        dateTo: 'dateTo' in next ? next.dateTo : prev.dateTo,
      }),
      replace: true,
    })
  }

  return (
    <>
      <Header fixed>
        <div className='ms-auto flex items-center gap-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Audit log</h2>
          <p className='text-muted-foreground'>
            Every change, sign-in and permission grant recorded by the API.
            Filter by event to isolate sign-ins or permission changes.
          </p>
        </div>

        {isError ? (
          <GeneralError minimal className='h-auto py-12' />
        ) : (
          <AuditLogsTable
            data={data?.items ?? []}
            meta={data?.meta}
            isFetching={isPending || isFetching}
            state={state}
            onStateChange={handleStateChange}
            onRowClick={setSelected}
          />
        )}
      </Main>

      <AuditLogDetailDialog
        log={selected}
        open={selected !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelected(null)
        }}
      />
    </>
  )
}
