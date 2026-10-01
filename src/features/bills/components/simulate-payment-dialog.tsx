import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FlaskConical } from 'lucide-react'
import { toast } from 'sonner'
import { formatMoney } from '@/lib/format'
import { serverMessageOr } from '@/lib/handle-server-error'
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
import { Label } from '@/components/ui/label'
import { simulateBillPayment } from '../data/api'
import { type Bill } from '../data/schema'

type SimulatePaymentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  bill: Bill
}

/**
 * Settle a bill without the gateway. Development only.
 *
 * Only rendered where `/config` says simulation is on, and the endpoint answers
 * 404 otherwise — so the button cannot exist on a deployment that must never
 * have it, whichever way you arrive.
 *
 * The amount is editable because **partial payment has no other route**. The
 * management command always pays in full, and `PARTIALLY_PAID` is a real state
 * the system reaches that nothing else can produce offline — so the Bills
 * progress bar, the part-paid badge and the top-up path would otherwise never
 * be exercised before production.
 */
export function SimulatePaymentDialog({
  open,
  onOpenChange,
  bill,
}: SimulatePaymentDialogProps) {
  const queryClient = useQueryClient()

  const total = Number(bill.total_amount ?? 0)
  const paid = Number(bill.amount_paid ?? 0)
  const outstanding = Math.max(0, total - paid)

  const [amount, setAmount] = useState('')

  // Blank means "the balance", which is what the API defaults to. Keeping the
  // field empty rather than pre-filling it means the common case needs no
  // typing and no clearing.
  const value = amount.trim() === '' ? outstanding : Number(amount)
  const isValid = Number.isFinite(value) && value > 0

  const mutation = useMutation({
    mutationFn: () =>
      simulateBillPayment(bill.id, amount.trim() === '' ? undefined : amount),
    onSuccess: (updated) => {
      const settled = updated.status === 'paid'
      toast.success(
        settled
          ? `${updated.bill_number} has been settled`
          : `${updated.bill_number} is partly paid`,
        {
          description: settled
            ? 'Every stone on the order has moved to paid and is ready for findings.'
            : `${formatMoney(
                Number(updated.total_amount ?? 0) -
                  Number(updated.amount_paid ?? 0),
                updated.currency
              )} still outstanding. The stones stay billed until it is settled.`,
        }
      )
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['stones'] })
      queryClient.invalidateQueries({ queryKey: ['worklist'] })
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error('The payment was not simulated', {
        description: serverMessageOr(
          error,
          'Something went wrong and the bill is unchanged. Please try again.'
        ),
      }),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2'>
            <FlaskConical className='size-4' />
            Simulate payment
          </DialogTitle>
          <DialogDescription>
            Feeds a fabricated GePG notification through the same handler the
            live gateway calls — so this exercises the real path: a payment is
            recorded, the bill settles, and the stones transition.
          </DialogDescription>
        </DialogHeader>

        <dl className='grid grid-cols-1 gap-2 rounded-md border p-3 text-sm sm:grid-cols-3'>
          <div>
            <dt className='text-xs text-muted-foreground'>Total</dt>
            <dd className='tabular-nums'>
              {formatMoney(total, bill.currency)}
            </dd>
          </div>
          <div>
            <dt className='text-xs text-muted-foreground'>Paid</dt>
            <dd className='tabular-nums'>{formatMoney(paid, bill.currency)}</dd>
          </div>
          <div>
            <dt className='text-xs text-muted-foreground'>Outstanding</dt>
            <dd className='font-medium tabular-nums'>
              {formatMoney(outstanding, bill.currency)}
            </dd>
          </div>
        </dl>

        <div className='space-y-2'>
          <Label htmlFor='simulate-amount'>Amount to pay</Label>
          <Input
            id='simulate-amount'
            type='number'
            min='0.01'
            step='0.01'
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder={String(outstanding)}
          />
          <p className='text-xs text-muted-foreground'>
            {amount.trim() === ''
              ? 'Leave blank to settle the balance in full.'
              : value < outstanding
                ? 'Less than the balance — the bill will read as partly paid and the stones stay billed.'
                : 'Settles the bill. Anything above the balance is recorded as paid.'}
          </p>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!isValid || mutation.isPending}
          >
            {mutation.isPending
              ? 'Paying...'
              : `Pay ${formatMoney(value, bill.currency)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
