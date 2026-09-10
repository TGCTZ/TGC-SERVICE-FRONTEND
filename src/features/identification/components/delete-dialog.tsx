import { AxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { serverMessageOr } from '@/lib/handle-server-error'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { deleteReport } from '../data/api'
import { type IdentificationReport } from '../data/schema'

type DeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: IdentificationReport
}

export function ReportDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: DeleteDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteReport(currentRow.id),
    onSuccess: () => {
      toast.success(`Deleted ${currentRow.report_number}`)
      queryClient.invalidateQueries({ queryKey: ['identification-reports'] })
      queryClient.invalidateQueries({ queryKey: ['worklist'] })
      onOpenChange(false)
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 403) {
        toast.error('You do not have permission to delete reports.')
        return
      }

      toast.error(
        serverMessageOr(error, 'Could not delete the report. Please try again.')
      )
    },
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Delete report'
      desc={`Delete ${currentRow.report_number}? This is a soft delete — turn on "Show deleted" to find and restore it. The stone returns to the findings queue.`}
      confirmText={mutation.isPending ? 'Deleting...' : 'Delete'}
      destructive
      disabled={mutation.isPending}
      handleConfirm={() => mutation.mutate()}
      className='sm:max-w-sm'
    />
  )
}
