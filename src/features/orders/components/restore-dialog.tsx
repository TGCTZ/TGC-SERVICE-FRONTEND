import { AxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { serverMessageOr } from '@/lib/handle-server-error'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { restoreOrder } from '../data/api'
import { type Order } from '../data/schema'

type OrderRestoreDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Order
}

export function OrderRestoreDialog({
  open,
  onOpenChange,
  currentRow,
}: OrderRestoreDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => restoreOrder(currentRow.id),
    onSuccess: () => {
      toast.success(`Restored ${currentRow.reference_number}`)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['worklist'] })
      onOpenChange(false)
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 403) {
        toast.error('You do not have permission to restore orders.')
        return
      }

      toast.error(
        serverMessageOr(error, 'Could not restore the order. Please try again.')
      )
    },
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Restore order'
      desc={`Bring ${currentRow.reference_number} back?`}
      confirmText={mutation.isPending ? 'Restoring...' : 'Restore'}
      disabled={mutation.isPending}
      handleConfirm={() => mutation.mutate()}
      className='sm:max-w-sm'
    />
  )
}
