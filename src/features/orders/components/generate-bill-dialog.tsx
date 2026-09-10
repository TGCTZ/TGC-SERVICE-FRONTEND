import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { serverMessageOr } from '@/lib/handle-server-error'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { generateBill } from '../data/api'
import { type Order } from '../data/schema'

type GenerateBillDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order
}

/**
 * Bill an order.
 *
 * A confirmation rather than a form: the service prices every stone from its
 * type, picks the collecting provider, and submits to GePG — there is nothing
 * for the user to choose, but it is not reversible, so it is worth asking.
 */
export function GenerateBillDialog({
  open,
  onOpenChange,
  order,
}: GenerateBillDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => generateBill(order.id),
    onSuccess: (bill) => {
      toast.success(`Bill ${bill.bill_number} created`)
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['stones'] })
      queryClient.invalidateQueries({ queryKey: ['worklist'] })
      onOpenChange(false)
    },
    onError: (error) => {
      // An unregistered order, an unpriced stone type or an existing bill are
      // all refused by name — show the API's sentence, not ours.
      toast.error(
        serverMessageOr(error, 'Could not generate the bill. Please try again.')
      )
    },
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Generate bill'
      desc={`Bill ${order.reference_number} for its ${order.stone_count} stone(s)? Every stone is priced from its type and the bill is submitted to GePG for a control number.`}
      confirmText={mutation.isPending ? 'Generating...' : 'Generate bill'}
      disabled={mutation.isPending}
      handleConfirm={() => mutation.mutate()}
      className='sm:max-w-md'
    />
  )
}
