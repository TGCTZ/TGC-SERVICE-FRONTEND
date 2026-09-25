import { Pencil } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/format'
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
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Can } from '@/components/can'
import { type RowAction } from '@/components/data-table'
import { DefinitionList } from '@/components/definition-list'
import { DialogBody } from '@/components/dialog-body'
import { StatusBadge } from '@/components/status-badge'
import { ViewFooterActions } from '@/components/view-footer-actions'
import { isFullyIdentified, type Order } from '../data/schema'
import { OrderStonesPanel } from './stones-panel'

type OrderViewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order
  /** Switches the view into the edit form, when the user may edit. */
  onRequestEdit?: () => void
  /** Opens the identification dialog from the embedded stones panel. */
  onRegisterStone?: () => void
  actions?: RowAction[]
}

/**
 * Everything known about one order.
 *
 * Its own component rather than the mutate form with `disabled` on a fieldset.
 * A greyed-out form reads as "you may not touch this", which is the wrong
 * message — most users viewing an order *can* edit it, they simply are not
 * editing it yet. It also buries the facts: a disabled `<input type='date'>`
 * shows a date picker where a date should be, and the customer, who is the
 * first thing anyone wants, sits behind a combobox.
 *
 * A definition list states the record; Edit is an explicit step from here.
 */
export function OrderViewDialog({
  open,
  onOpenChange,
  order,
  onRequestEdit,
  onRegisterStone,
  actions = [],
}: OrderViewDialogProps) {
  const complete = isFullyIdentified(order)
  const customer = order.customer_detail
  const remaining = Math.max(0, order.stone_count - order.identified_count)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex flex-wrap items-center gap-2'>
            {order.reference_number}
            <StatusBadge tone={complete ? 'success' : 'info'}>
              {complete ? 'Fully identified' : 'Awaiting identification'}
            </StatusBadge>
            {order.bill_number && (
              <StatusBadge tone='warning'>
                Billed {order.bill_number}
              </StatusBadge>
            )}
            {order.deleted_at && (
              <StatusBadge tone='danger'>Deleted</StatusBadge>
            )}
          </DialogTitle>
          <DialogDescription>
            Received {formatDate(order.received_date)}
            {customer ? ` · ${customer.full_name}` : ''}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className='space-y-5'>
          {/* Progress leads: it is the one thing that decides what happens to
              this order next — more identification, or a bill. */}
          <div className='space-y-2 rounded-md border p-3'>
            <div className='flex flex-wrap items-baseline justify-between gap-2'>
              <h3 className='text-sm font-medium'>Identification progress</h3>
              <span className='text-xs text-muted-foreground tabular-nums'>
                {order.identified_count} of {order.stone_count} identified
                {remaining > 0 && ` · ${remaining} to go`}
              </span>
            </div>
            <Progress
              value={order.identified_count}
              max={order.stone_count}
              label={`Identification progress for ${order.reference_number}`}
            />
          </div>

          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Customer</h3>
            <DefinitionList
              items={[
                { label: 'Name', value: customer?.full_name ?? null },
                { label: 'Phone', value: customer?.phone ?? null },
                { label: 'Company', value: customer?.company_name ?? null },
                {
                  label: 'Region',
                  value: regionLabel(customer?.region) || null,
                },
                { label: 'Email', value: customer?.email ?? null },
                { label: 'ID number', value: customer?.id_number ?? null },
                {
                  label: 'Address',
                  value: customer?.address ?? null,
                  wide: true,
                },
              ]}
            />
          </div>

          <Separator />

          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Order</h3>
            <DefinitionList
              items={[
                { label: 'Reference', value: order.reference_number },
                { label: 'Received', value: formatDate(order.received_date) },
                { label: 'Stones submitted', value: order.stone_count },
                { label: 'Stones identified', value: order.identified_count },
                { label: 'Bill', value: order.bill_number },
                { label: 'Created', value: formatDateTime(order.created_at) },
                {
                  label: 'Last updated',
                  value: formatDateTime(order.updated_at),
                },
              ]}
            />
          </div>

          <Separator />

          <OrderStonesPanel order={order} onRegister={onRegisterStone} />
        </DialogBody>

        <DialogFooter>
          <ViewFooterActions
            actions={actions}
            primary={
              onRequestEdit && (
                <Can permission={perm('orders', 'change')}>
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
