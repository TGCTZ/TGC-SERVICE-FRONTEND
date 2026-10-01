import { AxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { serverMessageOr } from '@/lib/handle-server-error'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { deleteOrder } from '../data/api'
import { type Order } from '../data/schema'

type OrderDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Order
}

export function OrderDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: OrderDeleteDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteOrder(currentRow.id),
    onSuccess: () => {
      toast.success(`Deleted ${currentRow.reference_number}`)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['worklist'] })
      onOpenChange(false)
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 403) {
        toast.error('You do not have permission to delete orders.')
        return
      }

      toast.error(
        serverMessageOr(error, 'Could not delete the order. Please try again.')
      )
    },
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Delete order'
      desc={`Delete ${currentRow.reference_number}? This is a soft delete — turn on "Show deleted" to find and restore it.`}
      confirmText={mutation.isPending ? 'Deleting...' : 'Delete'}
      destructive
      disabled={mutation.isPending}
      handleConfirm={() => mutation.mutate()}
      className='sm:max-w-sm'
    />
  )
}
