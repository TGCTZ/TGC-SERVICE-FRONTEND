import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { Textarea } from '@/components/ui/textarea'
import { transitionStone } from '../data/api'
import { STONE_STATUS_LABELS, TRANSITIONABLE_STATUSES } from '../data/enums'
import { type Stone } from '../data/schema'
import { StoneStatusBadge } from './status-badge'

type TransitionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Stone
}

/**
 * Move a stone to a new status by hand.
 *
 * The choices are deliberately narrow — see `TRANSITIONABLE_STATUSES`. The
 * pipeline writes `billed`, `paid` and `certified` itself, and offering them
 * here would let a user claim an outcome that never happened.
 */
export function StoneTransitionDialog({
  open,
  onOpenChange,
  currentRow,
}: TransitionDialogProps) {
  const queryClient = useQueryClient()
  const [toStatus, setToStatus] = useState('')
  const [note, setNote] = useState('')

  /**
   * Clearing on the way out rather than in an effect on `open`: the dialog
   * stays mounted between openings, and resetting during render would cascade.
   */
  function close() {
    setToStatus('')
    setNote('')
    onOpenChange(false)
  }

  const mutation = useMutation({
    mutationFn: () => transitionStone(currentRow.id, toStatus, note),
    onSuccess: (stone) => {
      toast.success(
        `${stone.label} is now ${STONE_STATUS_LABELS[stone.status] ?? stone.status}`
      )
      queryClient.invalidateQueries({ queryKey: ['stones'] })
      queryClient.invalidateQueries({ queryKey: ['status-history'] })
      queryClient.invalidateQueries({ queryKey: ['worklist'] })
      close()
    },
    onError: (error) => {
      // The service refuses illegal moves with an explanation; show it verbatim.
      toast.error(
        serverMessageOr(error, 'Could not change the status. Please try again.')
      )
    },
  })

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : close())}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader className='text-start'>
          <DialogTitle>Change status</DialogTitle>
          <DialogDescription className='flex items-center gap-2'>
            <span>{currentRow.label} is currently</span>
            <StoneStatusBadge status={currentRow.status} />
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='transition-status'>New status</Label>
            <Select value={toStatus} onValueChange={setToStatus}>
              <SelectTrigger id='transition-status' className='w-full'>
                <SelectValue placeholder='Select a status' />
              </SelectTrigger>
              <SelectContent>
                {TRANSITIONABLE_STATUSES.filter(
                  (status) => status !== currentRow.status
                ).map((status) => (
                  <SelectItem key={status} value={status}>
                    {STONE_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='transition-note'>Note</Label>
            <Textarea
              id='transition-note'
              rows={3}
              value={note}
              placeholder='Why is it moving? Shown in the status history.'
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
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
            disabled={!toStatus || mutation.isPending}
          >
            {mutation.isPending ? 'Saving...' : 'Change status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
