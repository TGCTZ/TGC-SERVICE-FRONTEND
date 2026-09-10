import { AxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { serverMessageOr } from '@/lib/handle-server-error'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { deleteServiceProvider } from '../data/api'
import { type ServiceProvider } from '../data/schema'

type DeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: ServiceProvider
}

export function ServiceProviderDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: DeleteDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteServiceProvider(currentRow.id),
    onSuccess: () => {
      toast.success(`Deleted ${currentRow.name}`)
      queryClient.invalidateQueries({ queryKey: ['service-providers'] })
      onOpenChange(false)
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 403) {
        toast.error('You do not have permission to delete service providers.')
        return
      }

      toast.error(
        serverMessageOr(error, 'Could not delete it. It may still be in use.')
      )
    },
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Delete service provider'
      desc={`Delete ${currentRow.name}? Bills already submitted under it keep their record; new bills can no longer use it.`}
      confirmText={mutation.isPending ? 'Deleting...' : 'Delete'}
      destructive
      disabled={mutation.isPending}
      handleConfirm={() => mutation.mutate()}
      className='sm:max-w-sm'
    />
  )
}
