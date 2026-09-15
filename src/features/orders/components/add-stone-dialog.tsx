import { useEffect } from 'react'
import { z } from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formatMoney } from '@/lib/format'
import { fieldErrors, serverMessageOr } from '@/lib/handle-server-error'
import { zodResolver } from '@/lib/zod-resolver'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { lookupOptionsQuery } from '@/features/lookups/data/api'
import { orderStonesQuery } from '@/features/stones/data/api'
import { addStone, identifiableOrdersQuery, orderQuery } from '../data/api'
import { type Order } from '../data/schema'

const addStoneSchema = z.object({
  order: z.string().min(1, 'Order is required.'),
  stone_type: z.string().min(1, 'Stone type is required.'),
})

type FormValues = z.input<typeof addStoneSchema>

type AddStoneDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * The order to identify against. Omit it to let the user pick one — that is
   * how the Identification page opens this, where no order is on screen.
   */
  order?: Order
}

/**
 * Record the identification of a stone: which order it came in on, and its type.
 *
 * **No weight.** Identification records only the type, because the type is what
 * prices the bill. The stone is weighed at the bench and that weight is
 * recorded with the findings, after payment.
 *
 * There is no label field either: the service allocates A, B, C… in sequence
 * and caps the count at `order.stone_count`, so the label is a fact about the
 * order's state rather than something a user chooses.
 */
export function AddStoneDialog({
  open,
  onOpenChange,
  order,
}: AddStoneDialogProps) {
  const queryClient = useQueryClient()
  const { data: stoneTypes = [] } = useQuery(lookupOptionsQuery('stone-types'))
  // Only fetched when the caller supplied no order, so the three entry points
  // that already have one cost nothing extra.
  const { data: orders = [] } = useQuery({
    ...identifiableOrdersQuery(),
    enabled: open && !order,
  })

  // Every stone already on the order, refetched as each one is added. A live
  // read rather than a log of this sitting: what matters at the desk is what
  // the order holds now, not which of them you happened to type yourself.
  const { data: stones = [] } = useQuery({
    ...orderStonesQuery(order?.id ?? 0),
    enabled: open && Boolean(order),
  })

  // A live read, not the row snapshot the caller handed over. The dialog stays
  // open across several stones, so the progress bar and the next label have to
  // move as they are added — a snapshot would keep promising the same label.
  const { data: liveOrder } = useQuery({
    ...orderQuery(order?.id ?? 0),
    enabled: open && Boolean(order),
  })
  const current = liveOrder ?? order

  const form = useForm<FormValues>({
    resolver: zodResolver(addStoneSchema),
    defaultValues: { order: order ? String(order.id) : '', stone_type: '' },
  })

  // The tier the chosen type belongs to, and the fee it commits the customer
  // to. Read-only: it is a fact about the type, not a second choice.
  const chosenType = useWatch({ control: form.control, name: 'stone_type' })
  const remaining = current
    ? Math.max(0, current.stone_count - current.identified_count)
    : 0
  // Nothing further can be filed once every submitted stone is identified.
  const isFull = Boolean(current) && remaining === 0
  const category = stoneTypes.find(
    (type) => String(type.id) === chosenType
  )?.category_detail

  useEffect(() => {
    if (!open) return
    form.reset({ order: order ? String(order.id) : '', stone_type: '' })
  }, [open, order, form])

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      addStone(Number(values.order), {
        stone_type: Number(values.stone_type),
      }),
    // Stays open. An order is several stones and they are identified in one
    // sitting at the desk, so closing after each one made the user reopen the
    // dialog, re-find the order and re-read the progress every single time.
    // It closes on Cancel, on Done, or by clicking away.
    onSuccess: (stone) => {
      toast.success(`Stone ${stone.label} has been identified`)
      // Only the type: the order is fixed for the life of the dialog, and
      // clearing it would make the next stone unfileable.
      form.resetField('stone_type')

      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['stones'] })
      queryClient.invalidateQueries({ queryKey: ['worklist'] })
    },
    onError: (error) => {
      const fields = fieldErrors(error)
      if (fields) {
        for (const [field, messages] of Object.entries(fields)) {
          form.setError(field as keyof FormValues, { message: messages[0] })
        }
        return
      }

      // Registering past `stone_count` is refused with an explanation naming
      // the cap, which is far more useful than a generic failure.
      toast.error('The stone was not identified', {
        description: serverMessageOr(
          error,
          'Something went wrong and nothing was recorded. Please try again.'
        ),
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Capped and scrollable: the dialog now grows as stones are added, and
          on a laptop a five-stone order would otherwise push the footer off
          the bottom of the screen. */}
      <DialogContent className='flex max-h-[90dvh] flex-col overflow-y-auto sm:max-w-md'>
        <DialogHeader className='text-start'>
          {/* The label leads. It is allocated by the service, not chosen here,
              so naming it up front is the only way the user learns which stone
              they are about to create — and it is permanent once written. */}
          <DialogTitle>
            {current?.next_stone_label
              ? `Identify stone ${current.next_stone_label}`
              : 'Identify stone'}
          </DialogTitle>
          <DialogDescription>
            {current
              ? `${current.reference_number} — the label is allocated automatically and cannot be changed afterwards.`
              : 'Pick the order the stone came in on, then say what it is. The label is allocated automatically.'}
          </DialogDescription>
        </DialogHeader>

        {/* Only with an order in hand: opened from the identification queue
            there is no order yet, and the select below chooses one. */}
        {current && (
          <div className='space-y-1.5'>
            <div className='flex items-center justify-between gap-2'>
              <span className='text-sm font-medium'>
                Identification progress
              </span>
              <span className='text-xs text-muted-foreground tabular-nums'>
                {current.identified_count} of {current.stone_count} identified
                {remaining > 0 && ` · ${remaining} to go`}
              </span>
            </div>
            <Progress
              value={current.identified_count}
              max={current.stone_count}
              label={`Identification progress for ${current.reference_number}`}
            />
          </div>
        )}

        <Form {...form}>
          <form
            id='add-stone-form'
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className='space-y-4'
          >
            {!order && (
              <FormField
                control={form.control}
                name='order'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order</FormLabel>
                    <Select
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Select an order awaiting identification' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {orders.map((row) => (
                          <SelectItem key={row.id} value={String(row.id)}>
                            {/* The bar is how you pick: the order with the most
                                left to do is the one to open next. */}
                            <span className='flex w-full items-center gap-2'>
                              <span className='truncate'>
                                {row.reference_number}
                              </span>
                              <Progress
                                value={row.identified_count}
                                max={row.stone_count}
                                label={`Identification progress for ${row.reference_number}`}
                                className='h-1.5 w-16 shrink-0'
                              />
                              <span className='shrink-0 text-xs text-muted-foreground tabular-nums'>
                                {row.identified_count}/{row.stone_count}
                              </span>
                              {row.next_stone_label && (
                                <span className='shrink-0 text-xs font-medium'>
                                  next: {row.next_stone_label}
                                </span>
                              )}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {orders.length === 0 && (
                      <FormDescription>
                        Nothing is waiting — every order is fully identified.
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name='stone_type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stone type</FormLabel>
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Select stone type' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stoneTypes.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {category && (
              <div className='rounded-md border bg-muted/40 p-3'>
                <dl className='grid grid-cols-2 gap-2 text-sm'>
                  <dt className='text-muted-foreground'>Category</dt>
                  <dd className='text-end font-medium'>{category.name}</dd>

                  <dt className='text-muted-foreground'>Identification fee</dt>
                  <dd className='text-end font-medium tabular-nums'>
                    {formatMoney(
                      category.price === null ? null : Number(category.price)
                    )}
                  </dd>
                </dl>
                <p className='mt-2 text-xs text-muted-foreground'>
                  {category.price === null
                    ? 'This tier has no fee set, so the order cannot be billed until one is.'
                    : 'The fee comes from the tier, not the type — this is what the customer is billed for this stone.'}
                </p>
              </div>
            )}
          </form>
        </Form>

        {current && stones.length > 0 && (
          <div className='space-y-2'>
            <h3 className='text-sm font-medium'>
              Stones on this order ({stones.length})
            </h3>
            <ul className='max-h-36 divide-y overflow-y-auto rounded-md border'>
              {stones.map((stone) => (
                <li
                  key={stone.id}
                  className='flex items-center justify-between gap-2 p-2.5 text-sm'
                >
                  <span className='font-medium'>Stone {stone.label}</span>
                  <span className='truncate text-muted-foreground'>
                    {stone.stone_type_detail?.name ?? 'Untyped'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* The cap the service enforces, said before the button is pressed
            rather than as a 400 afterwards. */}
        {isFull && (
          <p className='rounded-md border border-dashed p-3 text-center text-sm'>
            Every stone on this order has been identified.
          </p>
        )}

        <DialogFooter>
          {/* "Cancel" is a lie once stones have been written — nothing would be
              undone by it. It becomes "Done" as soon as the first one lands. */}
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            {stones.length > 0 ? 'Done' : 'Cancel'}
          </Button>
          {!isFull && (
            <Button
              type='submit'
              form='add-stone-form'
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? 'Identifying...'
                : current?.next_stone_label
                  ? `Identify ${current.next_stone_label}`
                  : 'Identify'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
