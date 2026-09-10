import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { serverMessageOr } from '@/lib/handle-server-error'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { finalizeReport } from '../data/api'
import { type IdentificationReport } from '../data/schema'

type FinalizeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: IdentificationReport
}

/**
 * Lock a report against further edits.
 *
 * One-way and irreversible from the UI, so it is worth confirming: afterwards
 * the report, and the instruments recorded against it, accept no changes — and
 * only then can a certificate be issued from it.
 */
export function FinalizeReportDialog({
  open,
  onOpenChange,
  currentRow,
}: FinalizeDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => finalizeReport(currentRow.id),
    onSuccess: (report) => {
      toast.success(`${report.report_number} finalized`)
      queryClient.invalidateQueries({ queryKey: ['identification-reports'] })
      queryClient.invalidateQueries({ queryKey: ['worklist'] })
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error(
        serverMessageOr(
          error,
          'Could not finalize the report. Please try again.'
        )
      ),
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Finalize report'
      desc={`Finalize ${currentRow.report_number}? The findings and their instrument readings are locked afterwards, and the stone becomes eligible for certification. This cannot be undone.`}
      confirmText={mutation.isPending ? 'Finalizing...' : 'Finalize'}
      disabled={mutation.isPending}
      handleConfirm={() => mutation.mutate()}
      className='sm:max-w-md'
    />
  )
}
