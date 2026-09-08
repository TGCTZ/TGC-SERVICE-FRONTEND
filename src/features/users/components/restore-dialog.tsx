import { AxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { restoreUser } from '../data/api'
import { type User } from '../data/schema'

type UserRestoreDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UserRestoreDialog({
  open,
  onOpenChange,
  currentRow,
}: UserRestoreDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => restoreUser(currentRow.id),
    onSuccess: () => {
      toast.success(`Restored "${currentRow.full_name || currentRow.email}"`)
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onOpenChange(false)
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 403) {
        toast.error('You do not have permission to restore users.')
        return
      }

      toast.error('Could not restore the user. Please try again.')
    },
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Restore user'
      desc={`Reactivate the account for "${currentRow.full_name || currentRow.email}"?`}
      confirmText={mutation.isPending ? 'Restoring...' : 'Restore'}
      disabled={mutation.isPending}
      handleConfirm={() => mutation.mutate()}
      className='sm:max-w-sm'
    />
  )
}
