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
import { Switch } from '@/components/ui/switch'
import { Can } from '@/components/can'
import { type RowAction } from '@/components/data-table'
import { DialogBody } from '@/components/dialog-body'
import { ViewFooterActions } from '@/components/view-footer-actions'
import { createServiceProvider, updateServiceProvider } from '../data/api'
import { type ServiceProvider } from '../data/schema'

const providerFormSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  sp_code: z.string().min(1, 'Service provider code is required.'),
  group_code: z.string().optional(),
  sys_code: z.string().optional(),
  is_active: z.boolean().default(true),
})

type FormValues = z.input<typeof providerFormSchema>

type ProviderMutateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: ServiceProvider | null
  /** Render the same form as a read-only view. */
  readOnly?: boolean
  /** Switches a read-only view into edit mode, when the user may edit. */
  onRequestEdit?: () => void
  /** The record's row actions, shown in the footer of the read-only view. */
  actions?: RowAction[]
}

export function ServiceProviderMutateDialog({
  open,
  onOpenChange,
  currentRow,
  readOnly = false,
  onRequestEdit,
  actions = [],
}: ProviderMutateDialogProps) {
  const isEdit = Boolean(currentRow)
  const queryClient = useQueryClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: { name: '', sp_code: '', is_active: true },
  })

  useEffect(() => {
    if (!open) return

    form.reset({
      name: currentRow?.name ?? '',
      sp_code: currentRow?.sp_code ?? '',
      group_code: currentRow?.group_code ?? '',
      sys_code: currentRow?.sys_code ?? '',
      is_active: currentRow?.is_active ?? true,
    })
  }, [open, currentRow, form])

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      currentRow
        ? updateServiceProvider(currentRow.id, values)
        : createServiceProvider(values),
    onSuccess: (provider) => {
      toast.success(
        isEdit ? `Updated ${provider.name}` : `Added ${provider.name}`
      )
      queryClient.invalidateQueries({ queryKey: ['service-providers'] })
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
      <DialogContent className='flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {readOnly
              ? currentRow?.name
              : isEdit
                ? 'Edit service provider'
                : 'Add service provider'}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'Viewing the provider. Choose Edit to make changes.'
              : 'How the lab identifies itself to GePG when submitting bills.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <Form {...form}>
            <form
              id='provider-form'
              onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
              className='px-1'
            >
              {/* One fieldset disables every control, Radix triggers included. */}
              <fieldset disabled={readOnly} className='space-y-4'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='sp_code'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service provider code</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormDescription>
                        Issued by GePG. A wrong code makes every submission
                        fail.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='group_code'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group code</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='sys_code'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>System code</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='is_active'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center gap-2'>
                      <FormControl>
                        <Switch
                          checked={Boolean(field.value)}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className='!mt-0 font-normal'>
                        Active
                      </FormLabel>
                    </FormItem>
                  )}
                />
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
                  <Can permission={perm('service-providers', 'change')}>
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
                form='provider-form'
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
