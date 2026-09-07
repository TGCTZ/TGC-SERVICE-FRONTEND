import { useState } from 'react'
import { AxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, KeyRound, Lock, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Can } from '@/components/can'
import { ConfigDrawer } from '@/components/config-drawer'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { DataTableRowActions, type RowAction } from '@/components/data-table'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { GeneralError } from '@/features/errors/general-error'
import { RolePermissionsDialog } from './components/role-permissions-dialog'
import {
  createRole,
  deleteRole,
  rolesQuery,
  updateRole,
} from './data/roles-api'
import { type Role } from './data/schema'

export function Roles() {
  const queryClient = useQueryClient()
  const { data, isPending, isError } = useQuery(rolesQuery({ perPage: 100 }))

  const [viewFor, setViewFor] = useState<Role | null>(null)
  const [permissionsFor, setPermissionsFor] = useState<Role | null>(null)
  const [deleteFor, setDeleteFor] = useState<Role | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [renameFor, setRenameFor] = useState<Role | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const createMutation = useMutation({
    mutationFn: () => createRole({ name: newName.trim() }),
    onSuccess: (role) => {
      toast.success(`Created role "${role.name}"`)
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setCreateOpen(false)
      setNewName('')
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 422) {
        toast.error(
          error.response.data?.errors?.name?.[0] ??
            'That name is already taken.'
        )
        return
      }
      toast.error('Could not create the role.')
    },
  })

  const renameMutation = useMutation({
    mutationFn: () => updateRole(renameFor!.id, { name: renameValue.trim() }),
    onSuccess: () => {
      toast.success('Role renamed')
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setRenameFor(null)
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 422) {
        toast.error(
          error.response.data?.error ??
            error.response.data?.errors?.name?.[0] ??
            'That name is already taken.'
        )
        return
      }
      toast.error('Could not rename the role.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (role: Role) => deleteRole(role.id),
    onSuccess: () => {
      toast.success('Role deleted')
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setDeleteFor(null)
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 422) {
        toast.error(error.response.data?.error ?? 'This role is protected.')
        return
      }
      toast.error('Could not delete the role.')
    },
  })

  const roles = data?.items ?? []

  /**
   * Every action the API exposes for a role. Roles live in spatie's tables,
   * which have no soft deletes, so there is no Restore. Rename and Delete are
   * withheld from protected roles because the API rejects both with a 422.
   */
  function rowActions(role: Role): RowAction[] {
    return [
      {
        label: 'View',
        icon: Eye,
        permission: 'roles.view',
        onSelect: () => setViewFor(role),
      },
      {
        label: 'Permissions',
        icon: KeyRound,
        permission: 'roles.update',
        onSelect: () => setPermissionsFor(role),
      },
      {
        label: 'Rename',
        icon: Pencil,
        permission: 'roles.update',
        onSelect: () => {
          setRenameFor(role)
          setRenameValue(role.name)
        },
        hidden: role.is_protected,
      },
      {
        label: 'Delete',
        icon: Trash2,
        permission: 'roles.delete',
        onSelect: () => setDeleteFor(role),
        variant: 'destructive',
        hidden: role.is_protected,
        separatorBefore: true,
      },
    ]
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
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Roles</h2>
            <p className='text-muted-foreground'>
              Define what each role may do. Permissions are enforced by the API.
            </p>
          </div>

          <Can permission='roles.create'>
            <Button onClick={() => setCreateOpen(true)}>
              Add role
              <Plus className='ms-1 size-4' />
            </Button>
          </Can>
        </div>

        {isError ? (
          <GeneralError minimal className='h-auto py-12' />
        ) : (
          <div className='overflow-hidden rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Users</TableHead>
                  {/*
                    No fixed width: the actions cell is a wrapping flex row, so
                    pinning the column narrow (it was `w-1`) forced the icons
                    to stack vertically. Auto layout sizes it to its content.
                  */}
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}>
                        <Skeleton className='h-8 w-full' />
                      </TableCell>
                    </TableRow>
                  ))
                ) : roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className='h-24 text-center'>
                      No roles found.
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((role) => (
                    <TableRow
                      key={role.id}
                      className='cursor-pointer'
                      onClick={(event) => {
                        // Ignore clicks on the actions menu, which sits inside
                        // the row and opens its own surface.
                        if (
                          (event.target as HTMLElement).closest(
                            'button, [role="menuitem"]'
                          )
                        ) {
                          return
                        }
                        setViewFor(role)
                      }}
                    >
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <span className='font-medium capitalize'>
                            {role.name}
                          </span>
                          {role.is_protected && (
                            <Badge
                              variant='outline'
                              className='gap-1 text-muted-foreground'
                              title='Protected: always holds every permission'
                            >
                              <Lock className='size-3' />
                              Protected
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='tabular-nums'>
                        {role.permissions_count ?? '—'}
                      </TableCell>
                      <TableCell className='tabular-nums'>
                        {role.users_count ?? '—'}
                      </TableCell>
                      <TableCell>
                        <div className='flex justify-end'>
                          <DataTableRowActions actions={rowActions(role)} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Main>

      {/*
        A role IS its permissions, so the matrix doubles as the read-only view
        rather than a separate detail layout that could drift from it.
      */}
      {viewFor && (
        <RolePermissionsDialog
          key={`view-${viewFor.id}`}
          open={Boolean(viewFor)}
          onOpenChange={(open) => !open && setViewFor(null)}
          role={viewFor}
          readOnly
          // 'Permissions' is what the Edit button already does here — this
          // dialog IS the permission matrix — so it would be a second button
          // for the same thing.
          actions={rowActions(viewFor).filter(
            (action) => action.label !== 'Permissions'
          )}
          onRequestEdit={() => {
            setPermissionsFor(viewFor)
            setViewFor(null)
          }}
        />
      )}

      {permissionsFor && (
        <RolePermissionsDialog
          key={permissionsFor.id}
          open={Boolean(permissionsFor)}
          onOpenChange={(open) => !open && setPermissionsFor(null)}
          role={permissionsFor}
        />
      )}

      {deleteFor && (
        <ConfirmDialog
          open={Boolean(deleteFor)}
          onOpenChange={(open) => !open && setDeleteFor(null)}
          title='Delete role'
          desc={`Delete the "${deleteFor.name}" role? Users holding it will lose the access it grants.`}
          confirmText={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          destructive
          disabled={deleteMutation.isPending}
          handleConfirm={() => deleteMutation.mutate(deleteFor)}
          className='sm:max-w-sm'
        />
      )}

      <Dialog
        open={Boolean(renameFor)}
        onOpenChange={(open) => !open && setRenameFor(null)}
      >
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader className='text-start'>
            <DialogTitle>Rename role</DialogTitle>
            <DialogDescription>
              Renaming affects every user holding this role.
            </DialogDescription>
          </DialogHeader>

          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && renameValue.trim()) {
                renameMutation.mutate()
              }
            }}
          />

          <DialogFooter>
            <Button variant='outline' onClick={() => setRenameFor(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => renameMutation.mutate()}
              disabled={!renameValue.trim() || renameMutation.isPending}
            >
              {renameMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader className='text-start'>
            <DialogTitle>Add role</DialogTitle>
            <DialogDescription>
              Create the role first, then choose its permissions.
            </DialogDescription>
          </DialogHeader>

          <Input
            placeholder='e.g. auditor'
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newName.trim()) createMutation.mutate()
            }}
          />

          <DialogFooter>
            <Button variant='outline' onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!newName.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
