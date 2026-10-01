import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { serverMessageOr } from '@/lib/handle-server-error'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { releaseOrder } from '../data/api'
import { type Order } from '../data/schema'

type ReleaseOrderDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order
}

/**
 * Return a held or cancelled order to active work.
 *
 * A confirmation rather than a form: there is nothing to choose, and the order
 * resumes exactly where it left off — the hold undid nothing, so releasing
 * restores nothing. The reason is cleared, because a stale "customer
 * travelling" against an order back in the queue is worse than no reason at
 * all; the audit log keeps what it said.
 */
export function ReleaseOrderDialog({
  open,
  onOpenChange,
  order,
}: ReleaseOrderDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => releaseOrder(order.id),
    onSuccess: (updated) => {
      toast.success(`${updated.reference_number} is active again`, {
        description: `It has returned to ${updated.stage_label.toLowerCase()}, exactly where it left off.`,
      })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['worklist'] })
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error('The order was not released', {
        description: serverMessageOr(
          error,
          'Something went wrong and the order is unchanged. Please try again.'
        ),
      }),
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Release order'
      desc={`Return ${order.reference_number} to active work? It picks up exactly where it left off${order.hold_reason ? `, and the reason on file ("${order.hold_reason}") is cleared` : ''}.`}
      confirmText={mutation.isPending ? 'Releasing...' : 'Release'}
      disabled={mutation.isPending}
      handleConfirm={() => mutation.mutate()}
      className='sm:max-w-md'
    />
  )
}
