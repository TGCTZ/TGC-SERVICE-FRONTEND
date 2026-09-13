import { useEffect } from 'react'
import { z } from 'zod'
import { AxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { Separator } from '@/components/ui/separator'
import { Can } from '@/components/can'
import { type RowAction } from '@/components/data-table'
import { DialogBody } from '@/components/dialog-body'
import { ViewFooterActions } from '@/components/view-footer-actions'
import { createOrder, updateOrder } from '../data/api'
import { type Order } from '../data/schema'
import { CustomerPicker } from './customer-picker'
import { OrderStonesPanel } from './stones-panel'

/**
 * `reference_number` is absent on purpose: the service allocates
 * `ORD-YYYY-NNNN` on create, so offering the field would invite an edit the
 * API discards.
 *
 * `mode` decides which half of the customer block applies. A flat shape rather
 * than a discriminated union because react-hook-form addresses fields by a
 * stable name, and the conditional requirement is expressed in `superRefine` —
 * which is why the registration fields carry `RequiredMark` by hand.
 */
const orderFormSchema = z
  .object({
    mode: z.enum(['existing', 'new']).default('existing'),
    customer: z.string().default(''),

    first_name: z.string().default(''),
    middle_name: z.string().default(''),
    last_name: z.string().default(''),
    phone: z.string().default(''),
    email: z.string().default(''),
    company_name: z.string().default(''),
    region: z.string().default(''),
    id_number: z.string().default(''),
    address: z.string().default(''),

    received_date: z.string().min(1, 'Received date is required.'),
    stone_count: z.string().min(1, 'How many stones were submitted?'),
  })
  .superRefine((values, ctx) => {
    if (values.mode === 'existing') {
      if (!values.customer) {
        ctx.addIssue({
          code: 'custom',
          path: ['customer'],
          message: 'Find the customer, or register a new one.',
        })
      }
      return
    }

    for (const [field, message] of [
      ['first_name', 'First name is required.'],
      ['last_name', 'Last name is required.'],
      ['phone', 'Phone is required.'],
    ] as const) {
      if (!values[field].trim()) {
        ctx.addIssue({ code: 'custom', path: [field], message })
      }
    }
  })

type FormValues = z.input<typeof orderFormSchema>

/** Blank strings for every registration field, so a reset clears the block. */
const BLANK_CUSTOMER = {
  first_name: '',
  middle_name: '',
  last_name: '',
  phone: '',
  email: '',
  company_name: '',
  region: '',
  id_number: '',
  address: '',
} as const

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
  /** Opens the preliminary-identification dialog from the embedded panel. */
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

  const form = useForm<FormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      mode: 'existing',
      customer: '',
      ...BLANK_CUSTOMER,
      received_date: today(),
      stone_count: '1',
    },
  })

  useEffect(() => {
    if (!open) return

    form.reset({
      mode: 'existing',
      customer: currentRow ? String(currentRow.customer) : '',
      ...BLANK_CUSTOMER,
      received_date: currentRow?.received_date ?? today(),
      stone_count: currentRow ? String(currentRow.stone_count) : '1',
    })
  }, [open, currentRow, form])

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      // Exactly one of `customer` and `customer_data`; the API rejects both.
      const who =
        values.mode === 'new'
          ? {
              customer_data: {
                first_name: values.first_name,
                middle_name: values.middle_name,
                last_name: values.last_name,
                phone: values.phone,
                email: values.email,
                company_name: values.company_name,
                region: values.region,
                id_number: values.id_number,
                address: values.address,
              },
            }
          : { customer: Number(values.customer) }

      const payload = {
        ...who,
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
          // A nested customer comes back as customer_data: { phone: [...] };
          // flatten it onto the field the user actually filled in.
          if (field === 'customer_data' && !Array.isArray(messages)) {
            for (const [nested, nestedMessages] of Object.entries(
              messages as Record<string, string[]>
            )) {
              form.setError(nested as keyof FormValues, {
                message: nestedMessages[0],
              })
            }
            continue
          }

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
                {/* Reassigning an existing order picks somebody already on
                    file; registering happens at intake. */}
                <CustomerPicker allowCreate={!isEdit} readOnly={readOnly} />

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
                          Caps how many can be identified.
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
