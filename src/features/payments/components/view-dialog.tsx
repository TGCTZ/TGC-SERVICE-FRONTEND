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
import { type RowAction } from '@/components/data-table'
import { DefinitionList } from '@/components/definition-list'
import { DialogBody } from '@/components/dialog-body'
import { ViewFooterActions } from '@/components/view-footer-actions'
import { type Payment } from '../data/schema'

type PaymentViewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  payment: Payment
  actions?: RowAction[]
}

/**
 * The gateway's notification, field for field.
 *
 * Grouped into what a person actually asks — who paid, what the gateway called
 * it, and what we acknowledged — with the raw XML last, because when a payment
 * is disputed the original message is the only authority.
 */
export function PaymentViewDialog({
  open,
  onOpenChange,
  payment,
  actions = [],
}: PaymentViewDialogProps) {
  const currency = payment.currency ?? undefined
  const money = (value: string | null) =>
    formatMoney(value === null ? null : Number(value), currency)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2'>
            {payment.trx_id || 'Payment'}
            {payment.is_processed ? (
              <Badge variant='outline'>Processed</Badge>
            ) : (
              <Badge variant='destructive'>Unprocessed</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {money(payment.paid_amount)} received{' '}
            {formatDateTime(payment.trx_dt_tm)}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className='space-y-5'>
          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Payer</h3>
            <DefinitionList
              items={[
                { label: 'Name', value: payment.pyr_name },
                { label: 'Phone', value: payment.pyr_cell_num },
                { label: 'Email', value: payment.pyr_email },
                { label: 'Channel', value: payment.usd_pay_chnl },
              ]}
            />
          </div>

          <Separator />

          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Amounts</h3>
            <DefinitionList
              items={[
                { label: 'Billed', value: money(payment.bill_amount) },
                { label: 'Paid', value: money(payment.paid_amount) },
                { label: 'Currency', value: payment.currency },
                { label: 'Payment option', value: payment.bill_pay_opt },
              ]}
            />
          </div>

          <Separator />

          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Gateway</h3>
            <DefinitionList
              items={[
                { label: 'Control number', value: payment.bill_ctr_num },
                { label: 'GePG bill id', value: payment.gepg_bill_id },
                {
                  label: 'Customer centre number',
                  value: payment.cust_cntr_num,
                },
                {
                  label: 'PSP',
                  value: `${payment.psp_name} (${payment.psp_code})`,
                },
                { label: 'Payment reference', value: payment.pay_ref_id },
                { label: 'Collection account', value: payment.coll_acc_num },
                { label: 'Service provider code', value: payment.sp_code },
                { label: 'Request id', value: payment.req_id },
                {
                  label: 'Acknowledged',
                  value: payment.ack_id
                    ? `${payment.ack_id} · ${payment.ack_sts_code}`
                    : null,
                  wide: true,
                },
              ]}
            />
          </div>

          {payment.raw_request && (
            <>
              <Separator />
              <div className='space-y-2'>
                <h3 className='text-sm font-medium'>Raw notification</h3>
                <pre className='max-h-64 overflow-auto rounded-md border bg-muted p-3 text-xs'>
                  {payment.raw_request}
                </pre>
              </div>
            </>
          )}
        </DialogBody>

        <DialogFooter>
          <ViewFooterActions actions={actions} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
