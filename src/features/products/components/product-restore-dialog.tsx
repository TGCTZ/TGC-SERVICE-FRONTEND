import { AxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { restoreProduct } from '../data/products-api'
import { type Product } from '../data/schema'

type ProductRestoreDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Product
}

export function ProductRestoreDialog({
  open,
  onOpenChange,
  currentRow,
}: ProductRestoreDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => restoreProduct(currentRow.id),
    onSuccess: () => {
      toast.success(`Restored "${currentRow.name}"`)
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onOpenChange(false)
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 403) {
        toast.error('You do not have permission to restore products.')
        return
      }

      toast.error('Could not restore the product. Please try again.')
    },
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Restore product'
      desc={`Bring "${currentRow.name}" back into the catalogue?`}
      confirmText={mutation.isPending ? 'Restoring...' : 'Restore'}
      disabled={mutation.isPending}
      handleConfirm={() => mutation.mutate()}
      className='sm:max-w-sm'
    />
  )
}
