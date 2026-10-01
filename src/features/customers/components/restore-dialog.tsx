import { AxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { restoreCustomer } from '../data/api'
import { type Customer } from '../data/schema'

type CustomerRestoreDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Customer
}

export function CustomerRestoreDialog({
  open,
  onOpenChange,
  currentRow,
}: CustomerRestoreDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => restoreCustomer(currentRow.id),
    onSuccess: () => {
      toast.success(`Restored ${currentRow.full_name}`)
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customer-options'] })
      onOpenChange(false)
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 403) {
        toast.error('You do not have permission to restore customers.')
        return
      }

      toast.error('Could not restore the customer. Please try again.')
    },
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Restore customer'
      desc={`Bring ${currentRow.full_name} back?`}
      confirmText={mutation.isPending ? 'Restoring...' : 'Restore'}
      disabled={mutation.isPending}
      handleConfirm={() => mutation.mutate()}
      className='sm:max-w-sm'
    />
  )
}
