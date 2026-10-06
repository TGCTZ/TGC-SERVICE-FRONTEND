import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LoaderCircle, TriangleAlert } from 'lucide-react'
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
import { billPreviewQuery, billQuery } from '@/features/bills/data/api'
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
 * to `billed`, their pricing categories lock, and the bill goes to GePG — so the numbers
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
  const [requestedBill, setRequestedBill] = useState<{
    id: number
    bill_number: string
    control_number: string | null
  } | null>(null)

  const billDetails = useQuery({
    ...billQuery(requestedBill?.id ?? 0),
    enabled: requestedBill !== null && !requestedBill.control_number,
    refetchInterval: (query) =>
      query.state.data?.control_number ? false : 3000,
  })
  const controlNumber =
    requestedBill?.control_number || billDetails.data?.control_number || null
  const closeRequestedBill = () => {
    setRequestedBill(null)
    onOpenChange(false)
  }

  const {
    data: preview,
    isPending,
    isError,
  } = useQuery({ ...billPreviewQuery(order.id), enabled: open })

  const mutation = useMutation({
    mutationFn: () => generateBill(order.id),
    onSuccess: async (bill) => {
      setRequestedBill({
        id: bill.id,
        bill_number: bill.bill_number,
        control_number: bill.control_number || null,
      })
      toast.success(`Bill ${bill.bill_number} has been created`, {
        description: `Raised against ${order.reference_number}. It is now awaiting payment.`,
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bills'] }),
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: ['stones'] }),
        queryClient.invalidateQueries({ queryKey: ['worklist'] }),
        queryClient.invalidateQueries({ queryKey: ['workflow-feed'] }),
      ])
    },
    onError: (error) => {
      // A partly identified order, an unpriced category or an existing bill are
      // all refused by name — show the API's sentence, not ours.
      toast.error('The bill was not created', {
        description: serverMessageOr(
          error,
          'Something went wrong and no bill was raised. Please try again.'
        ),
      })
    },
  })
  const handleRequestDialogChange = (nextOpen: boolean) => {
    if (!nextOpen && mutation.isPending) return
    onOpenChange(nextOpen)
  }

  const blockers = preview?.blockers ?? []
  const canBill = !isPending && !isError && blockers.length === 0

  const money = (value: string | null) =>
    formatMoney(value === null ? null : Number(value), preview?.currency)

  return (
    <>
      <Dialog
        open={open && requestedBill === null}
        onOpenChange={handleRequestDialogChange}
      >
      <DialogContent className='flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>Request control number</DialogTitle>
          <DialogDescription>
            Review charges before sending the bill to GePG; pricing categories lock and
            billing cannot be undone.
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
            onClick={() => handleRequestDialogChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!canBill || mutation.isPending}
          >
            {mutation.isPending ? 'Requesting...' : 'Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog
      open={requestedBill !== null}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) closeRequestedBill()
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>Control number</DialogTitle>
          <DialogDescription>
            Bill {requestedBill?.bill_number} · {order.reference_number}
          </DialogDescription>
        </DialogHeader>

        <div
          aria-live='polite'
          className='flex min-h-36 flex-col items-center justify-center gap-3 rounded-md border bg-muted/30 p-5 text-center'
        >
          {controlNumber ? (
            <>
              <p className='text-sm text-muted-foreground'>GePG control number</p>
              <p className='break-all font-mono text-3xl font-bold tracking-wide tabular-nums sm:text-4xl'>
                {controlNumber}
              </p>
            </>
          ) : (
            <>
              <LoaderCircle className='size-6 animate-spin text-muted-foreground' />
              <p className='text-sm font-medium'>
                Waiting for GePG to return the control number…
              </p>
              <p className='text-xs text-muted-foreground'>
                This dialog will update automatically.
              </p>
            </>
          )}
        </div>

        {billDetails.isError && !controlNumber && (
          <p className='text-sm text-muted-foreground' role='status'>
            Still waiting for GePG. We’ll keep checking automatically.
          </p>
        )}

        <DialogFooter>
          <Button onClick={closeRequestedBill}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
