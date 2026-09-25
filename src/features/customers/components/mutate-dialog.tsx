import { useEffect } from 'react'
import { z } from 'zod'
import { AxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fieldErrors } from '@/lib/handle-server-error'
import { isRegion } from '@/lib/regions'
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
import { DialogBody } from '@/components/dialog-body'
import { RegionSelect } from '@/components/region-select'
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
  // Free text from before regions were a list stays in the field, visible, until
  // someone picks the region it meant - or clears it.
  region: z
    .string()
    .optional()
    .refine((value) => !value || isRegion(value), {
      message: 'Pick a region from the list, or clear it.',
    }),
  id_number: z.string().optional(),
  address: z.string().optional(),
})

type FormValues = z.input<typeof customerFormSchema>

type CustomerMutateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Customer | null
}

export function CustomerMutateDialog({
  open,
  onOpenChange,
  currentRow,
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
            {isEdit ? `Edit ${currentRow?.full_name}` : 'Add customer'}
          </DialogTitle>
          <DialogDescription>
            Who submitted the stones, and how to reach them.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <Form {...form}>
            <form
              id='customer-form'
              onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
              className='px-1'
            >
              <fieldset className='grid gap-4 sm:grid-cols-2'>
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
                <FormField
                  control={form.control}
                  name='region'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region</FormLabel>
                      <FormControl>
                        <RegionSelect
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
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
