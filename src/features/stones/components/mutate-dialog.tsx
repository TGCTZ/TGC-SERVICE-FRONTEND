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
import { Can } from '@/components/can'
import { type RowAction } from '@/components/data-table'
import { DialogBody } from '@/components/dialog-body'
import { ViewFooterActions } from '@/components/view-footer-actions'
import { lookupOptionsQuery } from '@/features/lookups/data/api'
import { updateStone } from '../data/api'
import { WEIGHT_UNITS } from '../data/enums'
import { type Stone } from '../data/schema'
import { StoneStatusBadge } from './status-badge'

/**
 * Only the three fields the API accepts on a stone.
 *
 * `label`, `status` and `order` are all read-only server-side, so putting them
 * in the form would offer edits that silently do nothing.
 */
const stoneFormSchema = z.object({
  stone_type: z.string().min(1, 'Stone type is required.'),
  weight: z.string().optional(),
  weight_unit: z.string().default('carat'),
})

type FormValues = z.input<typeof stoneFormSchema>

type StoneMutateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Stone | null
  /** Render the same form as a read-only view. */
  readOnly?: boolean
  /** Switches a read-only view into edit mode, when the user may edit. */
  onRequestEdit?: () => void
  /** The record's row actions, shown in the footer of the read-only view. */
  actions?: RowAction[]
}

export function StoneMutateDialog({
  open,
  onOpenChange,
  currentRow,
  readOnly = false,
  onRequestEdit,
  actions = [],
}: StoneMutateDialogProps) {
  const queryClient = useQueryClient()
  const { data: stoneTypes = [] } = useQuery(lookupOptionsQuery('stone-types'))

  const form = useForm<FormValues>({
    resolver: zodResolver(stoneFormSchema),
    defaultValues: { stone_type: '', weight: '', weight_unit: 'carat' },
  })

  useEffect(() => {
    if (!open) return

    form.reset({
      stone_type: currentRow?.stone_type ? String(currentRow.stone_type) : '',
      weight: currentRow?.weight ?? '',
      weight_unit: currentRow?.weight_unit ?? 'carat',
    })
  }, [open, currentRow, form])

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (!currentRow) throw new Error('No stone selected')

      return updateStone(currentRow.id, {
        stone_type: Number(values.stone_type),
        // The column is nullable, so a cleared weight must send an explicit
        // null rather than an empty string.
        weight: values.weight?.trim() ? values.weight.trim() : null,
        weight_unit: values.weight_unit,
      })
    },
    onSuccess: (stone) => {
      toast.success(`Updated ${stone.label}`)
      queryClient.invalidateQueries({ queryKey: ['stones'] })
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
          <DialogTitle className='flex items-center gap-2'>
            {currentRow?.label ?? 'Stone'}
            {currentRow && <StoneStatusBadge status={currentRow.status} />}
          </DialogTitle>
          <DialogDescription>
            {currentRow?.order_reference
              ? `Registered under ${currentRow.order_reference}.`
              : 'A stone in an order.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <Form {...form}>
            <form
              id='stone-form'
              onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
              className='px-1'
            >
              {/* One fieldset disables every control, Radix triggers included. */}
              <fieldset disabled={readOnly} className='space-y-4'>
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

                <div className='grid grid-cols-[1fr_8rem] gap-3'>
                  <FormField
                    control={form.control}
                    name='weight'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            step='0.001'
                            min='0'
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='weight_unit'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className='w-full'>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {WEIGHT_UNITS.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
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
                  <Can permission={perm('stones', 'change')}>
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
                form='stone-form'
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
