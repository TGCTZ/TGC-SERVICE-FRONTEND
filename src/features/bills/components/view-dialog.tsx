import { useQuery } from '@tanstack/react-query'
import { formatDateTime, formatMoney } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { type RowAction } from '@/components/data-table'
import { DefinitionList } from '@/components/definition-list'
import { DialogBody } from '@/components/dialog-body'
import { ViewFooterActions } from '@/components/view-footer-actions'
import { billPaymentsQuery } from '@/features/payments/data/api'
import { type Bill } from '../data/schema'
import { BillStatusBadge } from './status-badge'

type BillViewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  bill: Bill
  actions?: RowAction[]
}

/**
 * Everything known about one bill.
 *
 * A definition list rather than a disabled form: nothing here is editable by
 * anyone, so a form would imply a permission that does not exist.
 */
export function BillViewDialog({
  open,
  onOpenChange,
  bill,
  actions = [],
}: BillViewDialogProps) {
  // Payments live on their own endpoint, so they are fetched rather than
  // embedded — and only while the dialog is open.
  const { data: payments, isPending } = useQuery({
    ...billPaymentsQuery(bill.id),
    enabled: open,
  })

  const money = (value: string | null) =>
    formatMoney(value === null ? null : Number(value), bill.currency)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2'>
            {bill.bill_number}
            <BillStatusBadge status={bill.status} />
          </DialogTitle>
          <DialogDescription>
            {bill.order_reference} · {bill.customer_name}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className='space-y-5'>
          <DefinitionList
            items={[
              { label: 'Control number', value: bill.control_number },
              { label: 'Total', value: money(bill.total_amount) },
              { label: 'Paid', value: money(bill.amount_paid) },
              {
                label: 'Service provider',
                value: bill.service_provider_detail?.name ?? null,
              },
              { label: 'Issued', value: formatDateTime(bill.issued_at) },
              { label: 'Expires', value: formatDateTime(bill.expiry_at) },
            ]}
          />

          <Separator />

          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Charges</h3>
            <ul className='divide-y rounded-md border'>
              {bill.items.map((item) => (
                <li
                  key={item.id}
                  className='flex flex-wrap items-center justify-between gap-2 p-3'
                >
                  <div>
                    <div className='font-medium'>
                      {item.stone_label ?? 'Item'}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {item.description}
                    </div>
                  </div>
                  <span className='tabular-nums'>{money(item.amount)}</span>
                </li>
              ))}
              {bill.items.length === 0 && (
                <li className='p-3 text-sm text-muted-foreground'>
                  No charge lines.
                </li>
              )}
            </ul>
          </div>

          <Separator />

          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Payments</h3>

            {isPending && <Skeleton className='h-16 w-full' />}

            {!isPending && payments?.length === 0 && (
              <p className='rounded-md border border-dashed p-4 text-sm text-muted-foreground'>
                Nothing received yet.
              </p>
            )}

            {payments && payments.length > 0 && (
              <ul className='divide-y rounded-md border'>
                {payments.map((payment) => (
                  <li
                    key={payment.id}
                    className='flex flex-wrap items-center justify-between gap-2 p-3'
                  >
                    <div>
                      <div className='font-medium'>{payment.trx_id}</div>
                      <div className='text-xs text-muted-foreground'>
                        {payment.psp_name} · {formatDateTime(payment.trx_dt_tm)}
                      </div>
                    </div>
                    <span className='tabular-nums'>
                      {money(payment.paid_amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Separator />

          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Gateway</h3>
            <DefinitionList
              items={[
                {
                  label: 'Submitted to GePG',
                  value: bill.is_gepg_submitted ? (
                    <Badge variant='outline'>
                      {formatDateTime(bill.gepg_submitted_at)}
                    </Badge>
                  ) : (
                    <Badge variant='destructive'>Not submitted</Badge>
                  ),
                },
                { label: 'Status code', value: bill.status_code },
                {
                  label: 'Status message',
                  value: bill.status_desc,
                  wide: true,
                },
                { label: 'Bill type', value: bill.bill_type },
                { label: 'Pay type', value: bill.pay_type },
              ]}
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <ViewFooterActions actions={actions} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
