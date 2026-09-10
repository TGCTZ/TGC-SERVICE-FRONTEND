import { AxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { serverMessageOr } from '@/lib/handle-server-error'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { deleteStone } from '../data/api'
import { type Stone } from '../data/schema'

type StoneDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Stone
}

export function StoneDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: StoneDeleteDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteStone(currentRow.id),
    onSuccess: () => {
      toast.success(`Deleted ${currentRow.label}`)
      queryClient.invalidateQueries({ queryKey: ['stones'] })
      onOpenChange(false)
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 403) {
        toast.error('You do not have permission to delete stones.')
        return
      }

      toast.error(
        serverMessageOr(error, 'Could not delete the stone. Please try again.')
      )
    },
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Delete stone'
      desc={`Delete ${currentRow.label}? The order still expects it, so the registration slot stays open.`}
      confirmText={mutation.isPending ? 'Deleting...' : 'Delete'}
      destructive
      disabled={mutation.isPending}
      handleConfirm={() => mutation.mutate()}
      className='sm:max-w-sm'
    />
  )
}
