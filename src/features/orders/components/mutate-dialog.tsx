import { useEffect } from 'react'
import { z } from 'zod'
import { AxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { fieldErrors } from '@/lib/handle-server-error'
import { perm } from '@/lib/permissions'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Can } from '@/components/can'
import { type RowAction } from '@/components/data-table'
import { DialogBody } from '@/components/dialog-body'
import { ViewFooterActions } from '@/components/view-footer-actions'
import { customerOptionsQuery } from '@/features/customers/data/api'
import { createOrder, updateOrder } from '../data/api'
import { type Order } from '../data/schema'
import { OrderStonesPanel } from './stones-panel'

/**
 * `reference_number` is absent on purpose: the service allocates
 * `ORD-YYYY-NNNN` on create, so offering the field would invite an edit the
 * API discards.
 */
const orderFormSchema = z.object({
  customer: z.string().min(1, 'Customer is required.'),
  received_date: z.string().min(1, 'Received date is required.'),
  stone_count: z.string().min(1, 'How many stones were submitted?'),
})

type FormValues = z.input<typeof orderFormSchema>

/** Today in the `YYYY-MM-DD` shape a date input and the API both want. */
function today(): string {
  return new Date().toISOString().slice(0, 10)
}

type OrderMutateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Order | null
  /** Render the same form as a read-only view. */
  readOnly?: boolean
  /** Switches a read-only view into edit mode, when the user may edit. */
  onRequestEdit?: () => void
  /** The record's row actions, shown in the footer of the read-only view. */
  actions?: RowAction[]
  /** Opens the stone registration dialog from the embedded panel. */
  onRegisterStone?: () => void
}

export function OrderMutateDialog({
  open,
  onOpenChange,
  currentRow,
  readOnly = false,
  onRequestEdit,
  actions = [],
  onRegisterStone,
}: OrderMutateDialogProps) {
  const isEdit = Boolean(currentRow)
  const queryClient = useQueryClient()
  const { data: customers = [] } = useQuery(customerOptionsQuery())

  const form = useForm<FormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: { customer: '', received_date: today(), stone_count: '1' },
  })

  useEffect(() => {
    if (!open) return

    form.reset({
      customer: currentRow ? String(currentRow.customer) : '',
      received_date: currentRow?.received_date ?? today(),
      stone_count: currentRow ? String(currentRow.stone_count) : '1',
    })
  }, [open, currentRow, form])

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        customer: Number(values.customer),
        received_date: values.received_date,
        stone_count: Number(values.stone_count),
      }

      return currentRow
        ? updateOrder(currentRow.id, payload)
        : createOrder(payload)
    },
    onSuccess: (order) => {
      toast.success(
        isEdit
          ? `Updated ${order.reference_number}`
          : `Received ${order.reference_number}`
      )
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['worklist'] })
      onOpenChange(false)
    },
    onError: (error) => {
      const fields = fieldErrors(error)
      if (fields) {
        for (const [field, messages] of Object.entries(fields)) {
          form.setError(field as keyof FormValues, { message: messages[0] })
        }
        toast.error('Please fix the highlighted fields.')
        return
      }

      if (error instanceof AxiosError && error.response?.status === 403) {
        toast.error('You do not have permission to do that.')
        return
      }

      toast.error('Something went wrong. Please try again.')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {readOnly
              ? currentRow?.reference_number
              : isEdit
                ? 'Edit order'
                : 'Receive order'}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? currentRow?.customer_detail?.full_name
              : 'Who brought the stones, when, and how many.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <Form {...form}>
            <form
              id='order-form'
              onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
              className='px-1'
            >
              {/* One fieldset disables every control, Radix triggers included. */}
              <fieldset disabled={readOnly} className='space-y-4'>
                <FormField
                  control={form.control}
                  name='customer'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Select customer' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem
                              key={customer.id}
                              value={String(customer.id)}
                            >
                              {customer.full_name} · {customer.phone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='received_date'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Received date</FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='stone_count'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stones submitted</FormLabel>
                        <FormControl>
                          <Input type='number' min='1' step='1' {...field} />
                        </FormControl>
                        <FormDescription>
                          Caps how many can be registered.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </fieldset>
            </form>
          </Form>

          {/* Only on an existing order: a stone needs an order to hang off. */}
          {currentRow && (
            <>
              <Separator className='my-4' />
              <div className='px-1'>
                <OrderStonesPanel
                  order={currentRow}
                  onRegister={onRegisterStone}
                />
              </div>
            </>
          )}
        </DialogBody>

        <DialogFooter>
          {readOnly ? (
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
          ) : (
            <>
              <Button
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                form='order-form'
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
