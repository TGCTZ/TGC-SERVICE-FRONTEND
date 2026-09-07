import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
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
import { useUserActions } from './components/use-user-actions'
import { UserDeleteDialog } from './components/user-delete-dialog'
import { UserMutateDialog } from './components/user-mutate-dialog'
import { UserRestoreDialog } from './components/user-restore-dialog'
import { UsersProvider, useUsers } from './components/users-provider'
import { UsersTable, type UsersQueryState } from './components/users-table'
import { usersQueryOptions } from './data/users-api'

const route = getRouteApi('/_authenticated/users/')

export function Users() {
  return (
    <UsersProvider>
      <UsersContent />
    </UsersProvider>
  )
}

function UsersContent() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { open, setOpen, currentRow, setCurrentRow } = useUsers()

  // The same list the table cell renders.
  const actions = useUserActions(currentRow)

  const state: UsersQueryState = {
    page: search.page ?? 1,
    perPage: search.pageSize ?? 10,
    search: search.search ?? '',
    sortBy: search.sortBy,
    sortDir: search.sortDir,
    statusId: search.statusId,
    isActive: search.isActive,
    showDeleted: search.showDeleted,
  }

  const { data, isPending, isError, isFetching } = useQuery(
    usersQueryOptions({
      page: state.page,
      perPage: state.perPage,
      search: state.search,
      sortBy: state.sortBy,
      sortDir: state.sortDir,
      filters: {
        user_status_id: state.statusId,
        is_active: state.isActive,
      },
      trashed: state.showDeleted ? 'with' : undefined,
    })
  )

  function handleStateChange(next: Partial<UsersQueryState>) {
    navigate({
      search: (prev) => ({
        ...prev,
        page: next.page ?? prev.page,
        pageSize: next.perPage ?? prev.pageSize,
        search: next.search !== undefined ? next.search : prev.search,
        sortBy: 'sortBy' in next ? next.sortBy : prev.sortBy,
        sortDir: 'sortDir' in next ? next.sortDir : prev.sortDir,
        statusId: 'statusId' in next ? next.statusId : prev.statusId,
        isActive: 'isActive' in next ? next.isActive : prev.isActive,
        showDeleted:
          'showDeleted' in next ? next.showDeleted : prev.showDeleted,
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
            <h2 className='text-2xl font-bold tracking-tight'>Users</h2>
            <p className='text-muted-foreground'>
              Manage accounts and the roles that grant their access.
            </p>
          </div>

          <Can permission='users.create'>
            <Button
              onClick={() => {
                setCurrentRow(null)
                setOpen('create')
              }}
            >
              Add user
              <Plus className='ms-1 size-4' />
            </Button>
          </Can>
        </div>

        {isError ? (
          <GeneralError minimal className='h-auto py-12' />
        ) : (
          <UsersTable
            data={data?.items ?? []}
            meta={data?.meta}
            isFetching={isPending || isFetching}
            state={state}
            onStateChange={handleStateChange}
            onRowClick={(user) => {
              setCurrentRow(user)
              setOpen('view')
            }}
          />
        )}
      </Main>

      {currentRow && (
        <RecordHistorySheet
          subjectType={subjectTypes.user}
          subjectId={currentRow.id}
          title={currentRow.full_name || currentRow.email}
          open={open === 'history'}
          onOpenChange={(isOpen) => {
            if (!isOpen) setOpen(null)
          }}
        />
      )}

      {/* View and Edit share one dialog; `readOnly` decides which. */}
      <UserMutateDialog
        key={currentRow ? `user-${currentRow.id}` : 'create'}
        open={open === 'view' || open === 'create' || open === 'update'}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setOpen(null)
            setCurrentRow(null)
          }
        }}
        currentRow={open === 'create' ? null : currentRow}
        readOnly={open === 'view'}
        onRequestEdit={() => setOpen('update')}
        actions={actions}
      />

      {currentRow && (
        <UserRestoreDialog
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
        <UserDeleteDialog
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
