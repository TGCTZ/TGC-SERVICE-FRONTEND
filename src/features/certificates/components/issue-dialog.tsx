import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { serverMessageOr } from '@/lib/handle-server-error'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { certificationWorklistQuery, issueCertificate } from '../data/api'

type IssueCertificateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * Preselected stone, when the dialog is opened from a queue row.
   *
   * The select still renders, so the choice remains visible and changeable —
   * it just starts on the row the user acted from.
   */
  initialStone?: number
}

/**
 * Issue a certificate for a stone.
 *
 * One field, because the stone is the whole payload — the service mints the
 * number, the token and the snapshots together. The choices come from
 * `/certificates/worklist/`, which already encodes all three guards (finalized
 * report, settled bill, not already certified), so the dialog offers only what
 * the service will accept.
 */
export function IssueCertificateDialog({
  open,
  onOpenChange,
  initialStone,
}: IssueCertificateDialogProps) {
  const queryClient = useQueryClient()
  const [stone, setStone] = useState(initialStone ? String(initialStone) : '')

  const { data: worklist = [], isPending } = useQuery({
    ...certificationWorklistQuery(),
    enabled: open,
  })

  /**
   * Clearing on the way out rather than in an effect on `open`: the dialog
   * stays mounted between openings, and resetting during render would cascade.
   */
  function close() {
    setStone(initialStone ? String(initialStone) : '')
    onOpenChange(false)
  }

  const mutation = useMutation({
    mutationFn: () => issueCertificate(Number(stone)),
    onSuccess: (certificate) => {
      toast.success(`Issued ${certificate.certificate_number}`)
      queryClient.invalidateQueries({ queryKey: ['certificates'] })
      queryClient.invalidateQueries({ queryKey: ['stones'] })
      queryClient.invalidateQueries({ queryKey: ['worklist'] })
      close()
    },
    onError: (error) =>
      // All four refusal reasons arrive as `detail`; each names the guard that
      // stopped it, which is more use than anything we could substitute.
      toast.error(
        serverMessageOr(
          error,
          'Could not issue the certificate. Please try again.'
        )
      ),
  })

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : close())}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>Issue certificate</DialogTitle>
          <DialogDescription>
            A stone appears here once its findings are finalized and its bill is
            settled.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-2'>
          <Label htmlFor='certificate-stone'>Stone</Label>
          <Select value={stone} onValueChange={setStone}>
            <SelectTrigger id='certificate-stone' className='w-full'>
              <SelectValue
                placeholder={
                  isPending ? 'Loading...' : 'Select a stone ready to certify'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {worklist.map((row) => (
                <SelectItem key={row.id} value={String(row.id)}>
                  {row.order_reference} · {row.label} ·{' '}
                  {row.stone_type_detail?.name ?? 'Untyped'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!isPending && worklist.length === 0 && (
            <p className='text-sm text-muted-foreground'>
              Nothing is ready to certify.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={close}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!stone || mutation.isPending}
          >
            {mutation.isPending ? 'Issuing...' : 'Issue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
