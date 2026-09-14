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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { lookupOptionsQuery } from '@/features/lookups/data/api'
import { addStone, identifiableOrdersQuery } from '../data/api'
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

  const form = useForm<FormValues>({
    resolver: zodResolver(addStoneSchema),
    defaultValues: { order: order ? String(order.id) : '', stone_type: '' },
  })

  // The tier the chosen type belongs to, and the fee it commits the customer
  // to. Read-only: it is a fact about the type, not a second choice.
  const chosenType = useWatch({ control: form.control, name: 'stone_type' })
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
    onSuccess: (stone) => {
      toast.success(`Stone ${stone.label} has been identified`, {
        // The dialog opens with or without an order in hand, so name the one
        // the API actually filed the stone under.
        description: `Recorded against ${stone.order_reference ?? order?.reference_number ?? 'the order'}. It is now ready for the next stage.`,
      })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['stones'] })
      queryClient.invalidateQueries({ queryKey: ['worklist'] })
      onOpenChange(false)
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
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>Identify stone</DialogTitle>
          <DialogDescription>
            {order
              ? `${order.reference_number} — ${order.identified_count} of ${order.stone_count} identified so far. The label is allocated automatically.`
              : 'Pick the order the stone came in on, then say what it is. The label is allocated automatically.'}
          </DialogDescription>
        </DialogHeader>

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
                            {row.reference_number} · {row.identified_count} of{' '}
                            {row.stone_count} identified
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

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            form='add-stone-form'
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Identifying...' : 'Identify'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
