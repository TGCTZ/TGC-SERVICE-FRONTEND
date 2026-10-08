import { useEffect } from 'react'
import { z } from 'zod'
import { AxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fieldErrors } from '@/lib/handle-server-error'
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
import { DialogBody } from '@/components/dialog-body'
import { updateStone } from '../data/api'
import { WEIGHT_UNITS, isStoneLocked } from '../data/enums'
import { type Stone } from '../data/schema'
import { StoneStatusBadge } from './status-badge'

/**
 * Only the three fields the API accepts on a stone.
 *
 * `label`, `status` and `order` are all read-only server-side, so putting them
 * in the form would offer edits that silently do nothing.
 */
const stoneFormSchema = z.object({
  weight: z.string().optional(),
  weight_unit: z.string().default('carat'),
})

type FormValues = z.input<typeof stoneFormSchema>

type StoneMutateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Stone | null
}

export function StoneMutateDialog({
  open,
  onOpenChange,
  currentRow,
}: StoneMutateDialogProps) {
  const queryClient = useQueryClient()
  // Pricing categories lock after billing. Exact type is recorded on the
  // findings form, where it can be matched to this category.
  const isLocked = isStoneLocked(currentRow)

  const form = useForm<FormValues>({
    resolver: zodResolver(stoneFormSchema),
    defaultValues: { weight: '', weight_unit: 'carat' },
  })

  useEffect(() => {
    if (!open) return

    form.reset({
      weight: currentRow?.weight ?? '',
      weight_unit: currentRow?.weight_unit ?? 'carat',
    })
  }, [open, currentRow, form])

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (!currentRow) throw new Error('No stone selected')

      return updateStone(currentRow.id, {
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
          {(isLocked || currentRow?.order_reference) && (
            <DialogDescription>
              {isLocked
                ? 'Billed stones keep their type; record weight with findings.'
                : `Identified under ${currentRow?.order_reference}.`}
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogBody>
          <Form {...form}>
            <form
              id='stone-form'
              onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
              className='px-1'
            >
              {/* One fieldset disables every control, Radix triggers included. */}
              <fieldset disabled={isLocked} className='space-y-4'>
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
            disabled={isLocked || mutation.isPending}
          >
            {mutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
