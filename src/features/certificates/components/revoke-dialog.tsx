import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { serverMessageOr } from '@/lib/handle-server-error'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { revokeCertificate } from '../data/api'
import { type Certificate } from '../data/schema'

type RevokeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Certificate
}

/**
 * Withdraw a certificate.
 *
 * Not a delete: the record and its verification link survive, so a holder
 * checking the printed document is told it was withdrawn rather than that it
 * never existed. That is the whole point of revoking rather than removing.
 */
export function RevokeCertificateDialog({
  open,
  onOpenChange,
  currentRow,
}: RevokeDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => revokeCertificate(currentRow.id),
    onSuccess: (certificate) => {
      toast.success(`${certificate.certificate_number} revoked`)
      queryClient.invalidateQueries({ queryKey: ['certificates'] })
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error(
        serverMessageOr(error, 'Could not revoke it. Please try again.')
      ),
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Revoke certificate'
      desc={`Revoke ${currentRow.certificate_number}? Anyone checking its verification link will be told the document has been withdrawn.`}
      confirmText={mutation.isPending ? 'Revoking...' : 'Revoke'}
      destructive
      disabled={mutation.isPending}
      handleConfirm={() => mutation.mutate()}
      className='sm:max-w-md'
    />
  )
}
