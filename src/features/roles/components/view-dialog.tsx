import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { perm } from '@/lib/permissions'
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
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Can } from '@/components/can'
import { type RowAction } from '@/components/data-table'
import { DefinitionList } from '@/components/definition-list'
import { DialogBody } from '@/components/dialog-body'
import { ViewFooterActions } from '@/components/view-footer-actions'
import { groupedPermissionsQuery, roleQuery } from '../data/api'
import { type Role } from '../data/schema'
import { actionLabel } from './permissions-dialog'

type RoleViewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role
  /** Switches the view into the permission matrix, when the user may edit. */
  onRequestEdit?: () => void
  actions?: RowAction[]
}

/**
 * What a role may do, as a record rather than a matrix.
 *
 * The matrix in `<RolePermissionsDialog>` is an editor: every permission the
 * system defines, granted or not, as a switch. Reading a role through it means
 * hunting the few switches that are on among hundreds that are off, all of them
 * disabled — the exact "read-only edit form" this replaces.
 *
 * Here only what the role *holds* is listed, grouped by module with counts, so
 * the answer to "what can this role do?" is the whole content of the dialog.
 * Editing opens the matrix, which is the right tool for changing a grant.
 */
export function RoleViewDialog({
  open,
  onOpenChange,
  role,
  onRequestEdit,
  actions = [],
}: RoleViewDialogProps) {
  const [filter, setFilter] = useState('')

  // The list response carries only a count, so the detail call is what has the
  // permission names themselves.
  const { data: detail, isPending } = useQuery({
    ...roleQuery(role.id),
    enabled: open,
  })

  // Only to know each module's full size, for the "6 of 14" reading — a grant
  // means more when you can see what it was drawn from.
  const { data: groups = {} } = useQuery({
    ...groupedPermissionsQuery(),
    enabled: open,
  })

  const granted = useMemo(
    () => new Set(detail?.permissions ?? []),
    [detail?.permissions]
  )

  /** Held permissions bucketed by module, filtered, empty modules dropped. */
  const heldByGroup = useMemo(() => {
    const term = filter.trim().toLowerCase()

    return Object.entries(groups)
      .map(([group, permissions]) => {
        const held = permissions.filter((permission) => granted.has(permission))
        const matching = term
          ? held.filter(
              (permission) =>
                permission.toLowerCase().includes(term) || group.includes(term)
            )
          : held

        return { group, total: permissions.length, held, matching }
      })
      .filter((entry) => entry.matching.length > 0)
  }, [groups, granted, filter])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-3xl'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex flex-wrap items-center gap-2'>
            <span className='capitalize'>{role.name}</span>
            {role.is_protected && <Badge variant='secondary'>Protected</Badge>}
          </DialogTitle>
          <DialogDescription>
            {role.is_protected
              ? 'This role is protected: it always holds every permission and cannot be re-scoped.'
              : 'What this role may do, and who holds it.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className='space-y-5'>
          <DefinitionList
            items={[
              { label: 'Role', value: role.name },
              { label: 'Users holding it', value: role.user_count },
              { label: 'Permissions granted', value: granted.size },
              {
                label: 'Re-scopable',
                value: role.is_protected ? 'No — protected role' : 'Yes',
              },
            ]}
          />

          <Separator />

          <div className='space-y-3'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <h3 className='text-sm font-medium'>Permissions held</h3>
              <Input
                placeholder='Filter permissions...'
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className='h-8 w-full max-w-56'
              />
            </div>

            {isPending && <Skeleton className='h-32 w-full' />}

            {!isPending && heldByGroup.length === 0 && (
              <p className='rounded-md border border-dashed p-4 text-sm text-muted-foreground'>
                {filter.trim()
                  ? 'No permission held by this role matches that filter.'
                  : 'This role holds no permissions, so it grants no access.'}
              </p>
            )}

            {!isPending &&
              heldByGroup.map(({ group, total, held, matching }) => (
                <div key={group} className='rounded-md border p-3'>
                  <div className='flex flex-wrap items-center gap-2 border-b pb-2'>
                    <span className='font-medium capitalize'>
                      {group.replace(/-/g, ' ')}
                    </span>
                    <span className='text-xs text-muted-foreground tabular-nums'>
                      {held.length} of {total}
                    </span>
                    {/* How much of a module this role holds: "6 of 14" means
                        more when you can see the shape of it. */}
                    <Progress
                      value={held.length}
                      max={total}
                      label={`${group} permissions held`}
                      className='ms-auto h-1.5 w-24'
                    />
                  </div>

                  <div className='mt-3 flex flex-wrap gap-1.5'>
                    {matching.map((permission) => (
                      <Badge
                        key={permission}
                        variant='secondary'
                        className='font-normal'
                        title={permission}
                      >
                        {actionLabel(permission)}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </DialogBody>

        <DialogFooter>
          <ViewFooterActions
            actions={actions}
            primary={
              // A protected role refuses re-scoping at the API, so the button
              // is withdrawn rather than offered and then refused.
              onRequestEdit &&
              !role.is_protected && (
                <Can permission={perm('roles', 'change')}>
                  <Button onClick={onRequestEdit}>
                    <Pencil className='me-1 size-4' />
                    Edit permissions
                  </Button>
                </Can>
              )
            }
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
