import { useState } from 'react'
import { AxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { formatMoney } from '@/lib/format'
import { perm, restorePerm } from '@/lib/permissions'
import { subjectTypes } from '@/lib/subject-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { BoolBadge } from '@/components/bool-badge'
import { Can } from '@/components/can'
import { ConfigDrawer } from '@/components/config-drawer'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  DataTable,
  DataTableColumnHeader,
  DataTableRowActions,
  type RowAction,
  type TableQueryState,
} from '@/components/data-table'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { PageHeading } from '@/components/page-heading'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { RecordHistorySheet } from '@/components/record-history-sheet'
import { StatusBadge } from '@/components/status-badge'
import { ThemeSwitch } from '@/components/theme-switch'
import { GeneralError } from '@/features/errors/general-error'
import { LookupMutateDialog } from './components/mutate-dialog'
import { LookupViewDialog } from './components/view-dialog'
import { deleteLookupRow, lookupRowsQuery, restoreLookupRow } from './data/api'
import {
  lookupConfigBySlug,
  lookupFieldLabel,
  type LookupConfig,
  type LookupRow,
} from './data/config'

const route = getRouteApi('/_authenticated/lookups/$slug/')

type DialogState =
  | 'view'
  | 'history'
  | 'create'
  | 'update'
  | 'delete'
  | 'restore'

/**
 * One screen for every lookup table.
 *
 * Every lookup shares an identical API contract, so they share a screen
 * parameterised by `lookupConfigs` rather than each getting a near-identical
 * copy. Adding another lookup means adding a config entry.
 */
export function Lookups() {
  const { slug } = route.useParams()
  const config = lookupConfigBySlug(slug)

  if (!config) {
    return <GeneralError minimal className='h-auto py-12' />
  }

  // Remount on slug change so all local state resets between lookups.
  return <LookupsContent key={slug} config={config} />
}

function LookupsContent({ config }: { config: LookupConfig }) {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const queryClient = useQueryClient()

  const [open, setOpen] = useState<DialogState | null>(null)
  const [currentRow, setCurrentRow] = useState<LookupRow | null>(null)

  const state: TableQueryState & { showDeleted?: boolean } = {
    page: search.page ?? 1,
    perPage: search.pageSize ?? 10,
    search: search.search ?? '',
    sortBy: search.sortBy,
    sortDir: search.sortDir,
    showDeleted: search.showDeleted,
  }

  const { data, isPending, isError, isFetching } = useQuery(
    lookupRowsQuery(config.resource, {
      page: state.page,
      perPage: state.perPage,
      search: state.search,
      sortBy: state.sortBy,
      sortDir: state.sortDir,
      trashed: state.showDeleted ? 'with' : undefined,
    })
  )

  function handleStateChange(
    next: Partial<TableQueryState & { showDeleted?: boolean }>
  ) {
    navigate({
      search: (prev) => ({
        ...prev,
        page: next.page ?? prev.page,
        pageSize: next.perPage ?? prev.pageSize,
        search: next.search !== undefined ? next.search : prev.search,
        sortBy: 'sortBy' in next ? next.sortBy : prev.sortBy,
        sortDir: 'sortDir' in next ? next.sortDir : prev.sortDir,
        showDeleted:
          'showDeleted' in next ? next.showDeleted : prev.showDeleted,
      }),
      replace: true,
    })
  }

  function select(dialog: DialogState, row: LookupRow) {
    setCurrentRow(row)
    setOpen(dialog)
  }

  const deleteMutation = useMutation({
    mutationFn: (row: LookupRow) => deleteLookupRow(config.resource, row.id),
    onSuccess: () => {
      toast.success('Deleted')
      queryClient.invalidateQueries({ queryKey: ['lookups', config.resource] })
      setOpen(null)
    },
    onError: (error) => {
      // A lookup still referenced by a stone or report cannot be removed; the
      // API answers 400 rather than orphaning the rows that point at it.
      if (error instanceof AxiosError && error.response?.status === 403) {
        toast.error('You do not have permission to delete this.')
        return
      }
      toast.error(
        'Could not delete. It may still be in use by existing records.'
      )
    },
  })

  const restoreMutation = useMutation({
    mutationFn: (row: LookupRow) => restoreLookupRow(config.resource, row.id),
    onSuccess: () => {
      toast.success('Restored')
      queryClient.invalidateQueries({ queryKey: ['lookups', config.resource] })
      setOpen(null)
    },
    onError: () => toast.error('Could not restore. Please try again.'),
  })

  function rowActions(row: LookupRow): RowAction[] {
    const isDeleted = Boolean(row.deleted_at)

    return [
      {
        label: 'View',
        icon: Eye,
        permission: perm(config.resource, 'view'),
        onSelect: () => select('view', row),
      },
      {
        label: 'Edit',
        icon: Pencil,
        permission: perm(config.resource, 'change'),
        onSelect: () => select('update', row),
        hidden: isDeleted,
      },
      {
        label: 'Restore',
        icon: RotateCcw,
        permission: restorePerm(config.resource),
        onSelect: () => select('restore', row),
        hidden: !isDeleted,
        separatorBefore: true,
      },
      {
        label: 'Delete',
        icon: Trash2,
        permission: perm(config.resource, 'delete'),
        onSelect: () => select('delete', row),
        tone: 'destructive',
        hidden: isDeleted,
        separatorBefore: true,
      },
    ]
  }

  const columns: ColumnDef<LookupRow>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Name' />
      ),
      cell: ({ row }) => (
        <div className='flex items-center gap-2 font-medium'>
          {row.original.name}
          {row.original.deleted_at && (
            <StatusBadge tone='danger'>Deleted</StatusBadge>
          )}
        </div>
      ),
    },
    ...config.extraFields.map<ColumnDef<LookupRow>>((field) => ({
      accessorKey: field.key,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={field.label} />
      ),
      enableSorting: false,
      cell: ({ row }) => {
        const record = row.original as Record<string, unknown>
        const value = record[field.key]

        if (value === null || value === undefined || value === '') {
          return <span className='text-muted-foreground'>—</span>
        }

        if (field.type === 'color') {
          return (
            <span className='flex items-center gap-2'>
              <span
                className='size-4 rounded-full border'
                style={{ backgroundColor: String(value) }}
              />
              {String(value)}
            </span>
          )
        }

        if (field.type === 'money') {
          // Decimals cross the wire as strings, to survive the round trip.
          return formatMoney(Number(value))
        }

        return lookupFieldLabel(field, record) ?? String(value)
      },
    })),
    {
      accessorKey: 'is_active',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Active' />
      ),
      cell: ({ row }) => <BoolBadge value={row.original.is_active} />,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className='flex justify-end'>
          <DataTableRowActions actions={rowActions(row.original)} />
        </div>
      ),
    },
  ]

  const toolbar = (
    <>
      <Input
        placeholder='Search...'
        value={state.search}
        onChange={(e) => handleStateChange({ search: e.target.value, page: 1 })}
        className='h-8 w-full max-w-56'
      />

      <div className='flex items-center gap-2'>
        <Switch
          id='lookup-show-deleted'
          checked={Boolean(state.showDeleted)}
          onCheckedChange={(checked) =>
            handleStateChange({ showDeleted: checked || undefined, page: 1 })
          }
        />
        <Label
          htmlFor='lookup-show-deleted'
          className='text-sm font-normal whitespace-nowrap'
        >
          Show deleted
        </Label>
      </div>

      {(state.search || state.showDeleted) && (
        <Button
          variant='ghost'
          className='h-8 px-2 lg:px-3'
          onClick={() =>
            handleStateChange({
              search: '',
              showDeleted: undefined,
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
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeading title={config.title} description={config.description}>
          <Can permission={perm(config.resource, 'add')}>
            <Button
              onClick={() => {
                setCurrentRow(null)
                setOpen('create')
              }}
            >
              Add
              <Plus className='ms-1 size-4' />
            </Button>
          </Can>
        </PageHeading>

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
            onRowClick={(row) => select('view', row)}
            isRowDeleted={(row) => Boolean(row.deleted_at)}
            toolbar={toolbar}
            emptyMessage={`No ${config.title.toLowerCase()} found.`}
          />
        )}
      </Main>

      {currentRow &&
        subjectTypes[config.resource as keyof typeof subjectTypes] && (
          <RecordHistorySheet
            subjectType={
              subjectTypes[config.resource as keyof typeof subjectTypes]
            }
            subjectId={currentRow.id}
            title={currentRow.name}
            open={open === 'history'}
            onOpenChange={(isOpen) => !isOpen && setOpen(null)}
          />
        )}

      {/* Viewing and editing are separate components: a record is read as a
          definition list, not as a form nobody may type into. */}
      {currentRow && (
        <LookupViewDialog
          key={`row-view-${currentRow.id}`}
          config={config}
          row={currentRow}
          open={open === 'view'}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setOpen(null)
              setCurrentRow(null)
            }
          }}
          onRequestEdit={() => setOpen('update')}
          actions={rowActions(currentRow)}
        />
      )}

      <LookupMutateDialog
        key={
          currentRow && open !== 'create' ? `row-${currentRow.id}` : 'create'
        }
        config={config}
        currentRow={open === 'create' ? null : currentRow}
        open={open === 'create' || open === 'update'}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setOpen(null)
            setCurrentRow(null)
          }
        }}
      />

      {currentRow && (
        <ConfirmDialog
          open={open === 'delete'}
          onOpenChange={(isOpen) => !isOpen && setOpen(null)}
          title='Delete'
          desc={`Delete "${currentRow.name}"? This is a soft delete — turn on "Show deleted" to find and restore it.`}
          confirmText={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          destructive
          disabled={deleteMutation.isPending}
          handleConfirm={() => deleteMutation.mutate(currentRow)}
          className='sm:max-w-sm'
        />
      )}

      {currentRow && (
        <ConfirmDialog
          open={open === 'restore'}
          onOpenChange={(isOpen) => !isOpen && setOpen(null)}
          title='Restore'
          desc={`Bring "${currentRow.name}" back?`}
          confirmText={restoreMutation.isPending ? 'Restoring...' : 'Restore'}
          disabled={restoreMutation.isPending}
          handleConfirm={() => restoreMutation.mutate(currentRow)}
          className='sm:max-w-sm'
        />
      )}
    </>
  )
}
