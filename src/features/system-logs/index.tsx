import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import { X } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfigDrawer } from '@/components/config-drawer'
import { DataTable, DataTableColumnHeader } from '@/components/data-table'
import { DialogBody } from '@/components/dialog-body'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { GeneralError } from '@/features/errors/general-error'
import { systemLogLevelsQuery, systemLogsQueryOptions } from './data/api'
import { type SystemLog } from './data/schema'

const route = getRouteApi('/_authenticated/system-logs/')

/** Severity colouring: only error-and-worse should draw the eye. */
const levelStyles: Record<string, string> = {
  emergency: 'border-destructive/40 bg-destructive/15 text-destructive',
  alert: 'border-destructive/40 bg-destructive/10 text-destructive',
  critical: 'border-destructive/40 bg-destructive/10 text-destructive',
  error: 'border-destructive/40 bg-destructive/10 text-destructive',
  warning:
    'border-amber-600/40 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  notice: 'border-sky-600/40 bg-sky-500/10 text-sky-700 dark:text-sky-400',
  info: 'border-sky-600/40 bg-sky-500/10 text-sky-700 dark:text-sky-400',
  debug: 'border-muted-foreground/30 bg-muted text-muted-foreground',
}

export function SystemLogs() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [selected, setSelected] = useState<SystemLog | null>(null)

  const { data: levels = [] } = useQuery(systemLogLevelsQuery())

  const state = {
    page: search.page ?? 1,
    perPage: search.pageSize ?? 25,
    search: search.search ?? '',
    level: search.level,
    dateFrom: search.dateFrom,
    dateTo: search.dateTo,
  }

  const { data, isPending, isError, isFetching } = useQuery(
    systemLogsQueryOptions({
      page: state.page,
      perPage: state.perPage,
      search: state.search,
      filters: {
        level: state.level,
        logged_at: { from: state.dateFrom, to: state.dateTo },
      },
    })
  )

  function handleStateChange(next: Record<string, unknown>) {
    navigate({
      search: (prev) => ({
        ...prev,
        page: (next.page as number) ?? prev.page,
        pageSize: (next.perPage as number) ?? prev.pageSize,
        search: 'search' in next ? (next.search as string) : prev.search,
        level: 'level' in next ? (next.level as string) : prev.level,
        dateFrom:
          'dateFrom' in next ? (next.dateFrom as string) : prev.dateFrom,
        dateTo: 'dateTo' in next ? (next.dateTo as string) : prev.dateTo,
      }),
      replace: true,
    })
  }

  const columns: ColumnDef<SystemLog>[] = [
    {
      accessorKey: 'logged_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='When' />
      ),
      enableSorting: false,
      cell: ({ row }) => (
        <div className='whitespace-nowrap'>
          <div>{formatDate(row.original.logged_at)}</div>
          <div className='text-xs text-muted-foreground'>
            {formatTime(row.original.logged_at)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'level',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Level' />
      ),
      enableSorting: false,
      cell: ({ row }) => (
        <Badge
          variant='outline'
          className={cn(
            levelStyles[row.original.level] ??
              'border-muted-foreground/30 bg-muted text-muted-foreground'
          )}
        >
          {row.original.level}
        </Badge>
      ),
    },
    {
      accessorKey: 'message',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Message' />
      ),
      enableSorting: false,
      cell: ({ row }) => (
        <div className='max-w-xl truncate' title={row.original.message}>
          {row.original.message}
        </div>
      ),
    },
    {
      accessorKey: 'file',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='File' />
      ),
      enableSorting: false,
      cell: ({ row }) => (
        <span className='text-xs text-muted-foreground'>
          {row.original.file}
        </span>
      ),
    },
  ]

  const hasFilters =
    Boolean(state.search) ||
    Boolean(state.level) ||
    Boolean(state.dateFrom) ||
    Boolean(state.dateTo)

  const toolbar = (
    <>
      <Input
        placeholder='Search messages and traces...'
        value={state.search}
        onChange={(e) => handleStateChange({ search: e.target.value, page: 1 })}
        className='h-8 w-full max-w-64'
      />

      <Select
        value={state.level ?? 'all'}
        onValueChange={(value) =>
          handleStateChange({
            level: value === 'all' ? undefined : value,
            page: 1,
          })
        }
      >
        <SelectTrigger className='h-8 w-36'>
          <SelectValue placeholder='Level' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All levels</SelectItem>
          {levels.map((level) => (
            <SelectItem key={level} value={level}>
              {level}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type='date'
        aria-label='From date'
        value={state.dateFrom ?? ''}
        onChange={(e) =>
          handleStateChange({ dateFrom: e.target.value || undefined, page: 1 })
        }
        className='h-8 w-36'
      />
      <Input
        type='date'
        aria-label='To date'
        value={state.dateTo ?? ''}
        onChange={(e) =>
          handleStateChange({ dateTo: e.target.value || undefined, page: 1 })
        }
        className='h-8 w-36'
      />

      {hasFilters && (
        <Button
          variant='ghost'
          className='h-8 px-2 lg:px-3'
          onClick={() =>
            handleStateChange({
              search: '',
              level: undefined,
              dateFrom: undefined,
              dateTo: undefined,
              page: 1,
            })
          }
        >
          Reset
          <X className='ms-2 size-4' />
        </Button>
      )}
    </>
  )

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
          <h2 className='text-2xl font-bold tracking-tight'>System log</h2>
          <p className='text-muted-foreground'>
            Application errors and warnings written by the API. Credentials are
            redacted before they leave the server.
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
            onRowClick={setSelected}
            toolbar={toolbar}
            emptyMessage='No log entries found.'
          />
        )}
      </Main>

      <Dialog
        open={selected !== null}
        onOpenChange={(isOpen) => !isOpen && setSelected(null)}
      >
        <DialogContent className='flex max-h-[85dvh] flex-col overflow-hidden sm:max-w-3xl'>
          {selected && (
            <>
              <DialogHeader className='text-start'>
                <DialogTitle className='flex flex-wrap items-center gap-2'>
                  <Badge
                    variant='outline'
                    className={cn(levelStyles[selected.level])}
                  >
                    {selected.level}
                  </Badge>
                  <span className='text-sm font-normal text-muted-foreground'>
                    {formatDate(selected.logged_at)}{' '}
                    {formatTime(selected.logged_at)} · {selected.file}
                  </span>
                </DialogTitle>
                <DialogDescription className='break-words'>
                  {selected.message}
                </DialogDescription>
              </DialogHeader>

              <DialogBody className='me-0 pe-0'>
                {/* The log format records no stack trace, so the message is the
                    whole entry; kept in a <pre> for long wrapped lines. */}
                <pre className='rounded-md bg-muted p-3 text-xs whitespace-pre-wrap'>
                  {selected.message.trim() || 'No detail recorded.'}
                </pre>
              </DialogBody>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
