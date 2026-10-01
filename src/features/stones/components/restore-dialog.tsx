import { AxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { serverMessageOr } from '@/lib/handle-server-error'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { restoreStone } from '../data/api'
import { type Stone } from '../data/schema'

type StoneRestoreDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Stone
}

export function StoneRestoreDialog({
  open,
  onOpenChange,
  currentRow,
}: StoneRestoreDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => restoreStone(currentRow.id),
    onSuccess: () => {
      toast.success(`Restored ${currentRow.label}`)
      queryClient.invalidateQueries({ queryKey: ['stones'] })
      onOpenChange(false)
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 403) {
        toast.error('You do not have permission to restore stones.')
        return
      }

      toast.error(
        serverMessageOr(error, 'Could not restore the stone. Please try again.')
      )
    },
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Restore stone'
      desc={`Bring ${currentRow.label} back into its order?`}
      confirmText={mutation.isPending ? 'Restoring...' : 'Restore'}
      disabled={mutation.isPending}
      handleConfirm={() => mutation.mutate()}
      className='sm:max-w-sm'
    />
  )
}
