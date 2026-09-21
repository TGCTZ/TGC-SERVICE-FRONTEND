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
import { finalizeReport, gemmologistCandidatesQuery } from '../data/api'
import { listLabels, missingForFinalize } from '../data/finalize-rules'
import { type IdentificationReport } from '../data/schema'

/** Radix forbids an empty-string SelectItem value, so "nobody" needs one. */
const NONE = 'none'

type FinalizeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: IdentificationReport
}

/**
 * Lock a report against further edits, naming the second gemmologist.
 *
 * One-way and irreversible from the UI, so it is worth confirming: afterwards
 * the report, and the instruments recorded against it, accept no changes — and
 * only then can a certificate be issued from it.
 *
 * The second gemmologist is asked for here rather than on the findings form
 * because it is a sign-off, not a finding: this is the moment the report stops
 * being a draft. It is optional, and the certificate prints one name when it is
 * left empty — but the printed document claims the stone was "examined by at
 * least two qualified Gemmologists", so the dialog says plainly what is lost.
 */
export function FinalizeReportDialog({
  open,
  onOpenChange,
  currentRow,
}: FinalizeDialogProps) {
  const queryClient = useQueryClient()
  const [verifiedBy, setVerifiedBy] = useState<string>(NONE)

  // Reset per opening. The dialog is not remounted between reports, so a choice
  // made for one would otherwise carry into the next — and naming the wrong
  // person as second gemmologist is not a mistake that can be undone once the
  // report is finalized.
  //
  // Adjusted during render rather than in an effect: that is React's supported
  // pattern for deriving state from new props, and it avoids the cascading
  // re-render an effect would cause. Same approach as the role permissions
  // dialog.
  const [syncedTo, setSyncedTo] = useState<number | null>(null)
  const openedFor = open ? currentRow.id : null
  if (syncedTo !== openedFor) {
    setSyncedTo(openedFor)
    setVerifiedBy(NONE)
  }

  // The endpoint already encodes who is eligible — active, on the bench, and
  // not the caller — so there is nothing left to filter here. Previously this
  // read `/users`, which the gemmologist role cannot see: the 403 fell through
  // an `?? []` and the dropdown came up empty with nothing said.
  const {
    data: candidates = [],
    isPending,
    isError,
  } = useQuery({ ...gemmologistCandidatesQuery(), enabled: open })

  // The service refuses an incomplete report, so the refusal is shown here
  // rather than spent on a round trip - and it names what is missing while the
  // gemmologist is still in front of the report they can fix.
  const missing = missingForFinalize(currentRow)

  const mutation = useMutation({
    mutationFn: () =>
      finalizeReport(currentRow.id, {
        verified_by: verifiedBy === NONE ? null : Number(verifiedBy),
      }),
    onSuccess: (report) => {
      toast.success(`Report ${report.report_number} has been finalized`, {
        description:
          'It can no longer be edited, and the stone is ready for certification.',
      })
      queryClient.invalidateQueries({ queryKey: ['identification-reports'] })
      queryClient.invalidateQueries({ queryKey: ['worklist'] })
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error('The report was not finalized', {
        description: serverMessageOr(
          error,
          'Something went wrong and nothing was changed. Please try again.'
        ),
      }),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>Finalize {currentRow.report_number}</DialogTitle>
          <DialogDescription>
            The findings and their instrument readings are locked afterwards,
            and the stone becomes eligible for certification. This cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        {missing.length > 0 && (
          <p className='rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive'>
            Record the {listLabels(missing)} before finalizing. A certificate
            quotes {missing.length === 1 ? 'it' : 'them'}, so the report cannot
            be signed off without {missing.length === 1 ? 'it' : 'them'}.
          </p>
        )}

        <div className='space-y-2'>
          <Label htmlFor='verified-by'>Second gemmologist</Label>
          <Select value={verifiedBy} onValueChange={setVerifiedBy}>
            <SelectTrigger id='verified-by' className='w-full'>
              <SelectValue placeholder='Who checked these findings?' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>No second gemmologist</SelectItem>
              {candidates.map((candidate) => (
                <SelectItem key={candidate.id} value={String(candidate.id)}>
                  {candidate.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isError && (
            <p className='text-xs text-destructive'>
              The list of gemmologists could not be loaded. You can still
              finalize with a single name.
            </p>
          )}
          {!isError && !isPending && candidates.length === 0 && (
            <p className='text-xs text-muted-foreground'>
              No other gemmologist is available to countersign.
            </p>
          )}
          <p className='text-xs text-muted-foreground'>
            {verifiedBy === NONE
              ? 'The certificate will name only you. It states that at least two gemmologists examined the stone.'
              : 'Both names are printed on the certificate and frozen into it.'}
          </p>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || missing.length > 0}
          >
            {mutation.isPending ? 'Finalizing...' : 'Finalize'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
