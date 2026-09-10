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
import { Can } from '@/components/can'
import { type RowAction } from '@/components/data-table'
import { DialogBody } from '@/components/dialog-body'
import { ViewFooterActions } from '@/components/view-footer-actions'
import { createCustomer, updateCustomer } from '../data/api'
import { type Customer } from '../data/schema'

/**
 * Only the three the API insists on are required here.
 *
 * The phone number carries a partial unique constraint on the server, so a
 * duplicate comes back as a 400 on that field rather than being caught locally.
 */
const customerFormSchema = z.object({
  first_name: z.string().min(1, 'First name is required.'),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, 'Last name is required.'),
  phone: z.string().min(1, 'Phone is required.'),
  email: z.union([z.literal(''), z.email('Enter a valid email.')]).optional(),
  company_name: z.string().optional(),
  region: z.string().optional(),
  id_number: z.string().optional(),
  address: z.string().optional(),
})

type FormValues = z.input<typeof customerFormSchema>

type CustomerMutateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Customer | null
  /** Render the same form as a read-only view. */
  readOnly?: boolean
  /** Switches a read-only view into edit mode, when the user may edit. */
  onRequestEdit?: () => void
  /** The record's row actions, shown in the footer of the read-only view. */
  actions?: RowAction[]
}

export function CustomerMutateDialog({
  open,
  onOpenChange,
  currentRow,
  readOnly = false,
  onRequestEdit,
  actions = [],
}: CustomerMutateDialogProps) {
  const isEdit = Boolean(currentRow)
  const queryClient = useQueryClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: { first_name: '', last_name: '', phone: '' },
  })

  useEffect(() => {
    if (!open) return

    form.reset({
      first_name: currentRow?.first_name ?? '',
      middle_name: currentRow?.middle_name ?? '',
      last_name: currentRow?.last_name ?? '',
      phone: currentRow?.phone ?? '',
      email: currentRow?.email ?? '',
      company_name: currentRow?.company_name ?? '',
      region: currentRow?.region ?? '',
      id_number: currentRow?.id_number ?? '',
      address: currentRow?.address ?? '',
    })
  }, [open, currentRow, form])

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      currentRow
        ? updateCustomer(currentRow.id, values)
        : createCustomer(values),
    onSuccess: (customer) => {
      toast.success(
        isEdit ? `Updated ${customer.full_name}` : `Added ${customer.full_name}`
      )
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customer-options'] })
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
      <DialogContent className='flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {readOnly
              ? currentRow?.full_name
              : isEdit
                ? 'Edit customer'
                : 'Add customer'}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'Viewing the customer. Choose Edit to make changes.'
              : 'Who submitted the stones, and how to reach them.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <Form {...form}>
            <form
              id='customer-form'
              onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
              className='px-1'
            >
              {/* One fieldset disables every control, Radix triggers included. */}
              <fieldset
                disabled={readOnly}
                className='grid gap-4 sm:grid-cols-2'
              >
                <TextField
                  control={form.control}
                  name='first_name'
                  label='First name'
                />
                <TextField
                  control={form.control}
                  name='last_name'
                  label='Last name'
                />
                <TextField
                  control={form.control}
                  name='middle_name'
                  label='Middle name'
                />
                <FormField
                  control={form.control}
                  name='phone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormDescription>
                        Must be unique across customers.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <TextField control={form.control} name='email' label='Email' />
                <TextField
                  control={form.control}
                  name='company_name'
                  label='Company'
                />
                <TextField
                  control={form.control}
                  name='region'
                  label='Region'
                />
                <TextField
                  control={form.control}
                  name='id_number'
                  label='ID number'
                />
                <div className='sm:col-span-2'>
                  <TextField
                    control={form.control}
                    name='address'
                    label='Address'
                  />
                </div>
              </fieldset>
            </form>
          </Form>
        </DialogBody>

        <DialogFooter>
          {readOnly ? (
            <ViewFooterActions
              actions={actions}
              primary={
                onRequestEdit && (
                  <Can permission={perm('customers', 'change')}>
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
                form='customer-form'
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

type FieldProps = {
  // Loosely typed on purpose: this helper is local to the file.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any
  name: string
  label: string
}

function TextField({ control, name, label }: FieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...field} value={field.value ?? ''} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
