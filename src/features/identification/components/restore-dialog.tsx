import { AxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { serverMessageOr } from '@/lib/handle-server-error'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { restoreReport } from '../data/api'
import { type IdentificationReport } from '../data/schema'

type RestoreDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: IdentificationReport
}

export function ReportRestoreDialog({
  open,
  onOpenChange,
  currentRow,
}: RestoreDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => restoreReport(currentRow.id),
    onSuccess: () => {
      toast.success(`Restored ${currentRow.report_number}`)
      queryClient.invalidateQueries({ queryKey: ['identification-reports'] })
      queryClient.invalidateQueries({ queryKey: ['worklist'] })
      onOpenChange(false)
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 403) {
        toast.error('You do not have permission to restore reports.')
        return
      }

      // A stone holds at most one report, so restoring collides if another was
      // opened meanwhile — the API says so plainly.
      toast.error(
        serverMessageOr(
          error,
          'Could not restore the report. Please try again.'
        )
      )
    },
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Restore report'
      desc={`Bring ${currentRow.report_number} back?`}
      confirmText={mutation.isPending ? 'Restoring...' : 'Restore'}
      disabled={mutation.isPending}
      handleConfirm={() => mutation.mutate()}
      className='sm:max-w-sm'
    />
  )
}
