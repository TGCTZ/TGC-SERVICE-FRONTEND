import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate, formatMoney } from '@/lib/format'
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
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { DefinitionList } from '@/components/definition-list'
import { DialogBody } from '@/components/dialog-body'
import { billPreviewQuery } from '@/features/bills/data/api'
import { generateBill } from '../data/api'
import { type Order } from '../data/schema'

type GenerateBillDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order
}

/**
 * Bill an order, showing exactly what will be charged first.
 *
 * Was a bare confirmation, which asked the user to commit a customer to a
 * figure they could not see. Billing is not reversible — the stones transition
 * to `billed`, their types lock, and the bill goes to GePG — so the numbers
 * belong on screen *before* the button, not in the toast afterwards.
 *
 * The figures come from `/bills/preview`, priced by the same service that
 * writes the real bill. Deliberately not computed here: the fee is per stone
 * **category**, not per type, so a total worked out in the browser from
 * `stone_type.price` would quietly disagree with the bill it previews.
 */
export function GenerateBillDialog({
  open,
  onOpenChange,
  order,
}: GenerateBillDialogProps) {
  const queryClient = useQueryClient()

  const {
    data: preview,
    isPending,
    isError,
  } = useQuery({ ...billPreviewQuery(order.id), enabled: open })

  const mutation = useMutation({
    mutationFn: () => generateBill(order.id),
    onSuccess: (bill) => {
      toast.success(`Bill ${bill.bill_number} has been created`, {
        description: `Raised against ${order.reference_number}. It is now awaiting payment.`,
      })
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['stones'] })
      queryClient.invalidateQueries({ queryKey: ['worklist'] })
      onOpenChange(false)
    },
    onError: (error) => {
      // A partly identified order, an unpriced stone type or an existing bill are
      // all refused by name — show the API's sentence, not ours.
      toast.error('The bill was not created', {
        description: serverMessageOr(
          error,
          'Something went wrong and no bill was raised. Please try again.'
        ),
      })
    },
  })

  const blockers = preview?.blockers ?? []
  const canBill = !isPending && !isError && blockers.length === 0

  const money = (value: string | null) =>
    formatMoney(value === null ? null : Number(value), preview?.currency)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>Generate bill</DialogTitle>
          <DialogDescription>
            Check what the customer will be charged. Billing cannot be undone —
            the stones lock to their current types and the bill goes to GePG for
            a control number.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className='space-y-5'>
          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Billing</h3>
            <DefinitionList
              items={[
                { label: 'Order', value: order.reference_number },
                {
                  label: 'Customer',
                  value: order.customer_detail?.full_name ?? null,
                },
                { label: 'Phone', value: order.customer_detail?.phone ?? null },
                { label: 'Received', value: formatDate(order.received_date) },
              ]}
            />
          </div>

          <Separator />

          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Charges</h3>

            {isPending && <Skeleton className='h-24 w-full' />}

            {isError && (
              <p className='text-sm text-destructive'>
                Could not price this order. Close and try again.
              </p>
            )}

            {preview && (
              <>
                <ul className='divide-y rounded-md border'>
                  {preview.items.map((item) => (
                    <li
                      key={item.stone}
                      className='flex flex-wrap items-center justify-between gap-2 p-3'
                    >
                      <div className='min-w-0'>
                        <div className='font-medium'>
                          {item.label} · {item.description}
                        </div>
                        {/* The tier is what sets the fee, so it is named rather
                            than left for the reader to infer from the amount. */}
                        <div className='text-xs text-muted-foreground'>
                          {item.category || 'No category'}
                        </div>
                      </div>
                      <span className='tabular-nums'>
                        {item.amount === null ? (
                          <span className='text-destructive'>Not priced</span>
                        ) : (
                          money(item.amount)
                        )}
                      </span>
                    </li>
                  ))}
                  {preview.items.length === 0 && (
                    <li className='p-3 text-sm text-muted-foreground'>
                      No stones to bill.
                    </li>
                  )}
                </ul>

                <div className='flex items-center justify-between rounded-md border px-3 py-2'>
                  <span className='text-sm font-medium'>Total</span>
                  <span className='text-lg font-semibold tabular-nums'>
                    {money(preview.total)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Named rather than left to a 400 after the click: the user can fix
              an unpriced category or a partly identified order from here. */}
          {blockers.length > 0 && (
            <div className='space-y-1 rounded-md border border-amber-500/50 bg-amber-500/10 p-3'>
              <p className='flex items-center gap-2 text-sm font-medium'>
                <TriangleAlert className='size-4' />
                This order cannot be billed yet
              </p>
              <ul className='ms-6 list-disc text-sm'>
                {blockers.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
        </DialogBody>

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
            disabled={!canBill || mutation.isPending}
          >
            {/* The amount is on the button itself: the last thing you read
                before committing should be the figure you are committing to.
                Falls back to the plain verb while the price is unknown. */}
            {mutation.isPending
              ? 'Generating...'
              : canBill
                ? `Bill ${money(preview?.total ?? null)}`
                : 'Generate bill'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
