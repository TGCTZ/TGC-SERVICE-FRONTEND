import { Pencil } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/format'
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
import { Separator } from '@/components/ui/separator'
import { Can } from '@/components/can'
import { type RowAction } from '@/components/data-table'
import { DefinitionList } from '@/components/definition-list'
import { DialogBody } from '@/components/dialog-body'
import { StatusBadge } from '@/components/status-badge'
import { ViewFooterActions } from '@/components/view-footer-actions'
import { type User } from '../data/schema'

type UserViewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  /** Switches the view into the edit form, when the user may edit. */
  onRequestEdit?: () => void
  actions?: RowAction[]
}

/**
 * Join the address lines into the single block a postal address really is.
 *
 * Returns null when nothing is on file, so `DefinitionList` renders its em dash
 * rather than a row of stray separators.
 */
function formatAddress(user: User): string | null {
  const parts = [
    user.address_line1,
    user.address_line2,
    user.city,
    user.state,
    user.postal_code,
    user.country,
  ].filter((part): part is string => Boolean(part && part.trim()))

  return parts.length > 0 ? parts.join(', ') : null
}

/**
 * Everything known about one user account.
 *
 * A definition list rather than the mutate form with a disabled fieldset. It
 * also shows what the form cannot: `roles` and `permissions` are only present
 * when the requester may see them, and a granted permission is a fact about
 * the account rather than a checkbox nobody may tick.
 */
export function UserViewDialog({
  open,
  onOpenChange,
  user,
  onRequestEdit,
  actions = [],
}: UserViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex flex-wrap items-center gap-2'>
            {user.full_name || user.username}
            <StatusBadge tone={user.is_active ? 'success' : 'neutral'}>
              {user.is_active ? 'Active' : 'Inactive'}
            </StatusBadge>
            {user.deleted_at && (
              <StatusBadge tone='danger'>Deleted</StatusBadge>
            )}
          </DialogTitle>
          <DialogDescription>
            {user.username} · {user.email}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className='space-y-5'>
          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Account</h3>
            <DefinitionList
              items={[
                { label: 'Username', value: user.username },
                { label: 'Email', value: user.email },
                { label: 'Phone', value: user.phone_number },
                {
                  label: 'Status',
                  value: user.user_status_detail?.name ?? null,
                },
                {
                  label: 'Last signed in',
                  value: formatDateTime(user.last_login_at),
                },
                {
                  label: 'Account enabled',
                  value: user.is_active ? 'Yes' : 'No',
                },
              ]}
            />
          </div>

          <Separator />

          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Access</h3>

            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground'>Roles</p>
              {user.roles.length > 0 ? (
                <div className='flex flex-wrap gap-1.5'>
                  {user.roles.map((role) => (
                    <Badge key={role} variant='outline'>
                      {role}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className='text-sm text-muted-foreground'>
                  No roles assigned.
                </p>
              )}
            </div>

            {/* Permissions come from the roles above, so they are listed but
                never offered as something to change here. */}
            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground'>
                Permissions granted ({user.permissions.length})
              </p>
              {user.permissions.length > 0 ? (
                <div className='max-h-40 overflow-y-auto rounded-md border p-2'>
                  <div className='flex flex-wrap gap-1.5'>
                    {user.permissions.map((permission) => (
                      <Badge
                        key={permission}
                        variant='secondary'
                        className='font-mono text-xs font-normal'
                      >
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className='text-sm text-muted-foreground'>
                  No permissions granted.
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Profile</h3>
            <DefinitionList
              items={[
                { label: 'First name', value: user.first_name },
                { label: 'Middle name', value: user.middle_name },
                { label: 'Last name', value: user.last_name },
                { label: 'Gender', value: user.gender_detail?.name ?? null },
                {
                  label: 'Date of birth',
                  value: formatDate(user.date_of_birth),
                },
                { label: 'Timezone', value: user.timezone },
                { label: 'Locale', value: user.locale },
                { label: 'Address', value: formatAddress(user), wide: true },
                { label: 'Bio', value: user.bio, wide: true },
              ]}
            />
          </div>

          <Separator />

          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Record</h3>
            <DefinitionList
              items={[
                { label: 'Created', value: formatDateTime(user.created_at) },
                {
                  label: 'Last updated',
                  value: formatDateTime(user.updated_at),
                },
              ]}
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <ViewFooterActions
            actions={actions}
            primary={
              onRequestEdit && (
                <Can permission={perm('users', 'change')}>
                  <Button onClick={onRequestEdit}>
                    <Pencil className='me-1 size-4' />
                    Edit
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
