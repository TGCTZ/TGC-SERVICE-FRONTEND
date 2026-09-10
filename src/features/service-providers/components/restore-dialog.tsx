import { AxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { restoreServiceProvider } from '../data/api'
import { type ServiceProvider } from '../data/schema'

type RestoreDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: ServiceProvider
}

export function ServiceProviderRestoreDialog({
  open,
  onOpenChange,
  currentRow,
}: RestoreDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => restoreServiceProvider(currentRow.id),
    onSuccess: () => {
      toast.success(`Restored ${currentRow.name}`)
      queryClient.invalidateQueries({ queryKey: ['service-providers'] })
      onOpenChange(false)
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 403) {
        toast.error('You do not have permission to restore service providers.')
        return
      }

      toast.error('Could not restore it. Please try again.')
    },
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Restore service provider'
      desc={`Bring ${currentRow.name} back?`}
      confirmText={mutation.isPending ? 'Restoring...' : 'Restore'}
      disabled={mutation.isPending}
      handleConfirm={() => mutation.mutate()}
      className='sm:max-w-sm'
    />
  )
}
