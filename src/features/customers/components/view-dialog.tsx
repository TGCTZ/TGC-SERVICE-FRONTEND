import { Pencil } from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import { perm } from '@/lib/permissions'
import { regionLabel } from '@/lib/regions'
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
import { type Customer } from '../data/schema'

type CustomerViewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer
  /** Switches the view into the edit form, when the user may edit. */
  onRequestEdit?: () => void
  actions?: RowAction[]
}

/**
 * Everything known about one customer.
 *
 * A definition list rather than the mutate form with a disabled fieldset: a
 * greyed-out form reads as "you may not touch this", when in fact most people
 * viewing a customer *can* edit one — they simply are not editing it yet.
 * Editing is an explicit step from here.
 */
export function CustomerViewDialog({
  open,
  onOpenChange,
  customer,
  onRequestEdit,
  actions = [],
}: CustomerViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex flex-wrap items-center gap-2'>
            {customer.full_name}
            {customer.deleted_at && (
              <StatusBadge tone='danger'>Deleted</StatusBadge>
            )}
          </DialogTitle>
          <DialogDescription>
            {customer.phone}
            {customer.company_name ? ` · ${customer.company_name}` : ''}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className='space-y-5'>
          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Contact</h3>
            <DefinitionList
              items={[
                { label: 'Phone', value: customer.phone },
                { label: 'Email', value: customer.email },
                { label: 'Company', value: customer.company_name },
                { label: 'Region', value: regionLabel(customer.region) },
                { label: 'Address', value: customer.address, wide: true },
              ]}
            />
          </div>

          <Separator />

          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Identity</h3>
            <DefinitionList
              items={[
                { label: 'First name', value: customer.first_name },
                { label: 'Middle name', value: customer.middle_name },
                { label: 'Last name', value: customer.last_name },
                { label: 'ID number', value: customer.id_number },
              ]}
            />
          </div>

          <Separator />

          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Record</h3>
            <DefinitionList
              items={[
                {
                  label: 'Registered',
                  value: formatDateTime(customer.created_at),
                },
                {
                  label: 'Last updated',
                  value: formatDateTime(customer.updated_at),
                },
                ...(customer.deleted_at
                  ? [
                      {
                        label: 'Deleted',
                        value: formatDateTime(customer.deleted_at),
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <ViewFooterActions
            actions={actions}
            primary={
              onRequestEdit && (
                <Can permission={perm('customers', 'change')}>
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
