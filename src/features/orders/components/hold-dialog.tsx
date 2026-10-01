import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { holdOrder } from '../data/api'
import { isBilled, type Order } from '../data/schema'

type HoldOrderDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order
}

/**
 * Pause or withdraw a whole order.
 *
 * Everything else about where an order stands is derived from its stones — this
 * is the one decision somebody makes about the *visit*, so it is the one thing
 * stored. It undoes nothing: stones keep their statuses, the bill stands, and
 * releasing returns the order to exactly where it was.
 *
 * A reason is required rather than optional. A held order that says nothing
 * about why is a question for whoever finds it next, and the person who knows
 * the answer is the one filling this in.
 */
export function HoldOrderDialog({
  open,
  onOpenChange,
  order,
}: HoldOrderDialogProps) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<'on_hold' | 'cancelled'>('on_hold')
  const [reason, setReason] = useState('')

  // The API refuses this too; saying so here means the user is not invited to
  // fill in a reason only to have it rejected.
  const paid = isBilled(order) && order.stage !== 'awaiting_payment'

  const mutation = useMutation({
    mutationFn: () => holdOrder(order.id, { hold_status: status, reason }),
    onSuccess: (updated) => {
      toast.success(
        status === 'cancelled'
          ? `${updated.reference_number} has been cancelled`
          : `${updated.reference_number} is on hold`,
        {
          description:
            'Nothing was undone — the stones and any bill are unchanged. Release it to resume.',
        }
      )
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['worklist'] })
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error('The order was not held', {
        description: serverMessageOr(
          error,
          'Something went wrong and the order is unchanged. Please try again.'
        ),
      }),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>Hold {order.reference_number}</DialogTitle>
          <DialogDescription>
            Pause or withdraw the whole visit. Nothing is undone — the stones
            keep their statuses and any bill stands.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={status}
          onValueChange={(value) => setStatus(value as 'on_hold' | 'cancelled')}
          className='gap-3'
        >
          <div className='flex items-start gap-3 rounded-md border p-3'>
            <RadioGroupItem
              value='on_hold'
              id='hold-on-hold'
              className='mt-1'
            />
            <Label htmlFor='hold-on-hold' className='font-normal'>
              <span className='block font-medium'>Put on hold</span>
              <span className='block text-xs text-muted-foreground'>
                Work pauses. Release it to pick up where it left off.
              </span>
            </Label>
          </div>

          <div className='flex items-start gap-3 rounded-md border p-3'>
            <RadioGroupItem
              value='cancelled'
              id='hold-cancelled'
              className='mt-1'
              disabled={paid}
            />
            <Label htmlFor='hold-cancelled' className='font-normal'>
              <span className='block font-medium'>Cancel the order</span>
              <span className='block text-xs text-muted-foreground'>
                {paid
                  ? 'Not available: this order has been paid and there is no refund path. Put it on hold instead.'
                  : 'The customer withdrew. Still reversible, but it leaves the queues.'}
              </span>
            </Label>
          </div>
        </RadioGroup>

        <div className='space-y-2'>
          <Label htmlFor='hold-reason'>Reason</Label>
          <Textarea
            id='hold-reason'
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder='Why is this order stopping? Whoever finds it next reads this.'
            rows={3}
          />
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
            disabled={!reason.trim() || mutation.isPending}
          >
            {mutation.isPending
              ? 'Saving...'
              : status === 'cancelled'
                ? 'Cancel order'
                : 'Put on hold'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
