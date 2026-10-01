import { AxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { serverMessageOr } from '@/lib/handle-server-error'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { deleteCustomer } from '../data/api'
import { type Customer } from '../data/schema'

type CustomerDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Customer
}

export function CustomerDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: CustomerDeleteDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteCustomer(currentRow.id),
    onSuccess: () => {
      toast.success(`Deleted ${currentRow.full_name}`)
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customer-options'] })
      onOpenChange(false)
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 403) {
        toast.error('You do not have permission to delete customers.')
        return
      }

      // A customer with orders is protected by the database, and the API
      // explains that far better than a generic line would.
      toast.error(
        serverMessageOr(
          error,
          'Could not delete the customer. Please try again.'
        )
      )
    },
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Delete customer'
      desc={`Delete ${currentRow.full_name}? This is a soft delete — turn on "Show deleted" to find and restore them.`}
      confirmText={mutation.isPending ? 'Deleting...' : 'Delete'}
      destructive
      disabled={mutation.isPending}
      handleConfirm={() => mutation.mutate()}
      className='sm:max-w-sm'
    />
  )
}
