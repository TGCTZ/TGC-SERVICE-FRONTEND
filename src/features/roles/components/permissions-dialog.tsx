import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { handleServerError } from '@/lib/handle-server-error'
import { perm } from '@/lib/permissions'
import { cn } from '@/lib/utils'
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
import { Switch } from '@/components/ui/switch'
import { Can } from '@/components/can'
import { type RowAction } from '@/components/data-table'
import { DialogBody } from '@/components/dialog-body'
import { ViewFooterActions } from '@/components/view-footer-actions'
import { groupedPermissionsQuery, roleQuery, updateRole } from '../data/api'
import { type Role } from '../data/schema'

type RolePermissionsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role
  /** Render the matrix as a read-only view of what the role may do. */
  readOnly?: boolean
  /** Switches a read-only view into edit mode, when the user may edit. */
  onRequestEdit?: () => void
  /** The role's row actions, shown in the footer of the read-only view. */
  actions?: RowAction[]
}

/**
 * Turns a permission into a readable checkbox label.
 *
 * The role matrix works in bare codenames (`view_product`) grouped by app
 * label, so the model name has to stay in the label - a `catalog` group holds
 * permissions for several models, and "View" alone would appear many times over
 * with nothing to tell the rows apart. A fully qualified label is tolerated too,
 * since the same helper is handy wherever a permission is shown.
 */
function actionLabel(permission: string): string {
  const codename = permission.includes('.')
    ? permission.slice(permission.indexOf('.') + 1)
    : permission

  return codename
    .replace(/_/g, ' ')
    .replace(/^./, (c) => c.toUpperCase())
    .trim()
}

/**
 * The permission matrix: every permission the system defines, grouped by
 * resource, with the role's current set checked.
 *
 * This is what makes RBAC editable from the UI — the API seeds permissions but
 * lets roles be re-permissioned freely.
 */
export function RolePermissionsDialog({
  open,
  onOpenChange,
  role,
  readOnly = false,
  onRequestEdit,
  actions = [],
}: RolePermissionsDialogProps) {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('')

  const { data: groups = {}, isPending: loadingGroups } = useQuery(
    groupedPermissionsQuery()
  )

  // The list response only carries a count, so fetch the role to get its
  // actual permission names.
  const { data: detail, isPending: loadingRole } = useQuery({
    ...roleQuery(role.id),
    enabled: open,
  })

  // Seed the checkboxes once the role detail arrives. Adjusting state during
  // render (rather than in an effect) is React's supported pattern for
  // deriving state from new props/data and avoids a cascading re-render.
  const [syncedRoleId, setSyncedRoleId] = useState<number | null>(null)

  if (detail && syncedRoleId !== detail.id) {
    setSyncedRoleId(detail.id)
    setSelected(new Set(detail.permissions ?? []))
  }

  const currentUser = useAuthStore((state) => state.auth.user)

  const visibleGroups = useMemo(() => {
    const term = filter.trim().toLowerCase()
    if (!term) return groups

    return Object.fromEntries(
      Object.entries(groups)
        .map(([group, permissions]) => [
          group,
          permissions.filter(
            (p) => p.toLowerCase().includes(term) || group.includes(term)
          ),
        ])
        .filter(([, permissions]) => (permissions as string[]).length > 0)
    ) as Record<string, string[]>
  }, [groups, filter])

  const mutation = useMutation({
    // `permissions` is a writable field on the role, so the matrix saves
    // through the ordinary update - there is no separate sync endpoint.
    mutationFn: () =>
      updateRole(role.id, { permissions: Array.from(selected) }),
    onSuccess: () => {
      toast.success(`Updated permissions for "${role.name}"`)
      queryClient.invalidateQueries({ queryKey: ['roles'] })

      // If the signed-in user holds this role their own permissions just
      // changed, so refresh the session rather than leaving stale gates.
      if (currentUser?.roles.includes(role.name)) {
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
        toast.info('Your own access changed — reload to apply it everywhere.')
      }

      onOpenChange(false)
    },
    onError: (error) => {
      // A protected role refuses re-scoping with a `detail` message that
      // explains itself; anything else falls back to the shared handler.
      handleServerError(error)
    },
  })

  function toggle(permission: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)

      if (checked) {
        next.add(permission)
      } else {
        next.delete(permission)
      }

      return next
    })
  }

  function toggleGroup(permissions: string[], checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      permissions.forEach((p) => {
        if (checked) {
          next.add(p)
        } else {
          next.delete(p)
        }
      })
      return next
    })
  }

  // A protected role always holds everything and the API rejects changes to
  // it, so it is read-only whether or not the caller asked for that.
  const locked = readOnly || role.is_protected

  const isLoading = loadingGroups || loadingRole

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-3xl'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2'>
            Permissions
            <Badge variant='secondary' className='capitalize'>
              {role.name}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {role.is_protected
              ? 'This role is protected and always holds every permission.'
              : readOnly
                ? 'What this role may do. Choose Edit to change it.'
                : 'Choose what this role may do. Changes apply to every user holding it.'}
          </DialogDescription>
        </DialogHeader>

        <Input
          placeholder='Filter permissions...'
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className='h-8'
        />

        <DialogBody>
          {isLoading ? (
            <p className='py-8 text-center text-muted-foreground'>
              Loading permissions...
            </p>
          ) : (
            <div className='space-y-5 px-1'>
              {Object.entries(visibleGroups).map(([group, permissions]) => {
                const allChecked = permissions.every((p) => selected.has(p))
                const someChecked = permissions.some((p) => selected.has(p))

                return (
                  <div key={group} className='rounded-md border p-3'>
                    <label className='flex cursor-pointer items-center gap-2 border-b pb-2'>
                      {/*
                        Toggle-all for the module. A Switch has no
                        indeterminate state, so "on" means every permission in
                        the group is granted, and the count beside it carries
                        the partial case (3/7) - which reads more clearly than
                        an indeterminate dash anyway.
                      */}
                      <Switch
                        checked={allChecked}
                        disabled={locked}
                        aria-label={`Toggle all ${group} permissions`}
                        onCheckedChange={(value) =>
                          toggleGroup(permissions, value)
                        }
                      />
                      <span className='font-medium capitalize'>
                        {group.replace(/-/g, ' ')}
                      </span>
                      <span
                        className={cn(
                          'text-xs',
                          someChecked && !allChecked
                            ? 'font-medium text-primary'
                            : 'text-muted-foreground'
                        )}
                      >
                        {permissions.filter((p) => selected.has(p)).length}/
                        {permissions.length}
                      </span>
                    </label>

                    <div className='mt-3 grid gap-2 sm:grid-cols-3'>
                      {permissions.map((permission) => (
                        <label
                          key={permission}
                          className='flex cursor-pointer items-center gap-2 text-sm'
                          title={permission}
                        >
                          <Switch
                            checked={selected.has(permission)}
                            disabled={locked}
                            onCheckedChange={(value) =>
                              toggle(permission, value)
                            }
                          />
                          {actionLabel(permission)}
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </DialogBody>

        <DialogFooter className='items-center'>
          {readOnly ? (
            // The "N selected" count moves into the title row here, so the
            // start of the footer is free for the destructive action.
            <ViewFooterActions
              actions={actions}
              primary={
                onRequestEdit &&
                !role.is_protected && (
                  <Can permission={perm('roles', 'change')}>
                    <Button onClick={onRequestEdit}>
                      <Pencil className='me-1 size-4' />
                      Edit
                    </Button>
                  </Can>
                )
              }
            />
          ) : (
            <>
              <span className='text-sm text-muted-foreground sm:me-auto'>
                {selected.size} selected
              </span>
              <Button variant='outline' onClick={() => onOpenChange(false)}>
                {locked ? 'Close' : 'Cancel'}
              </Button>
              <Button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || role.is_protected}
              >
                {mutation.isPending ? 'Saving...' : 'Save permissions'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
