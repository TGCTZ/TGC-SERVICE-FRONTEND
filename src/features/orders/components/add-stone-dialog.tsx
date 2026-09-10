import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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
import { lookupOptionsQuery } from '@/features/lookups/data/api'
import { WEIGHT_UNITS } from '@/features/stones/data/enums'
import { addStone } from '../data/api'
import { type Order } from '../data/schema'

const addStoneSchema = z.object({
  stone_type: z.string().min(1, 'Stone type is required.'),
  weight: z.string().optional(),
  weight_unit: z.string().default('carat'),
})

type FormValues = z.input<typeof addStoneSchema>

type AddStoneDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order
}

/**
 * Register the next stone against an order.
 *
 * There is no label field: the service allocates A, B, C… in sequence and caps
 * the count at `order.stone_count`, so the label is a fact about the order's
 * state rather than something a user chooses.
 */
export function AddStoneDialog({
  open,
  onOpenChange,
  order,
}: AddStoneDialogProps) {
  const queryClient = useQueryClient()
  const { data: stoneTypes = [] } = useQuery(lookupOptionsQuery('stone-types'))

  const form = useForm<FormValues>({
    resolver: zodResolver(addStoneSchema),
    defaultValues: { stone_type: '', weight: '', weight_unit: 'carat' },
  })

  useEffect(() => {
    if (!open) return
    form.reset({ stone_type: '', weight: '', weight_unit: 'carat' })
  }, [open, form])

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      addStone(order.id, {
        stone_type: Number(values.stone_type),
        weight: values.weight?.trim() ? values.weight.trim() : null,
        weight_unit: values.weight_unit,
      }),
    onSuccess: (stone) => {
      toast.success(`Registered ${stone.label}`)
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
      toast.error(
        serverMessageOr(
          error,
          'Could not register the stone. Please try again.'
        )
      )
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>Register stone</DialogTitle>
          <DialogDescription>
            {order.reference_number} — {order.identified_count} of{' '}
            {order.stone_count} registered so far. The label is allocated
            automatically.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id='add-stone-form'
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className='space-y-4'
          >
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
                    <Select value={field.value} onValueChange={field.onChange}>
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
            {mutation.isPending ? 'Registering...' : 'Register'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
