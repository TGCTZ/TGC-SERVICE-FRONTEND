import { AxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type User } from '../data/schema'
import { deleteUser } from '../data/users-api'

type UserDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UserDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: UserDeleteDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteUser(currentRow.id),
    onSuccess: () => {
      toast.success(`Deleted ${currentRow.full_name}`)
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onOpenChange(false)
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 403) {
        toast.error('You do not have permission to delete users.')
        return
      }

      toast.error('Could not delete the user. Please try again.')
    },
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Delete user'
      desc={`Are you sure you want to delete ${currentRow.full_name}? This is a soft delete, so the account can be restored from the API.`}
      confirmText={mutation.isPending ? 'Deleting...' : 'Delete'}
      destructive
      disabled={mutation.isPending}
      handleConfirm={() => mutation.mutate()}
      className='sm:max-w-sm'
    />
  )
}
