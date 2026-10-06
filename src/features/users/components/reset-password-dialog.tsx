import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { resetUserPassword, type UserWithTemporaryPassword } from '../data/api'
import { type User } from '../data/schema'
import { CredentialsPanel } from './credentials-panel'

/**
 * Issue a new temporary password - for credentials that never arrived, or a
 * forgotten password. Confirms first, since it signs the user out everywhere,
 * then shows the new details once.
 */
export function UserResetPasswordDialog({
  open,
  onOpenChange,
  currentRow,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}) {
  const queryClient = useQueryClient()
  const [reset, setReset] = useState<UserWithTemporaryPassword | null>(null)
  const name = currentRow.full_name || currentRow.email

  const mutation = useMutation({
    mutationFn: () => resetUserPassword(currentRow.id),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setReset(user)
    },
    onError: () => toast.error('The password was not reset. Please try again.'),
  })

  function close(next: boolean) {
    onOpenChange(next)
    if (!next) setReset(null)
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {reset ? 'New sign-in details' : 'Reset password'}
          </DialogTitle>
          <DialogDescription>
            {reset
              ? `${name} must change it at next sign-in.`
              : 'A temporary password is emailed; all sessions end and a change is required at next sign-in.'}
          </DialogDescription>
        </DialogHeader>

        {reset && <CredentialsPanel user={reset} />}

        <DialogFooter>
          {reset ? (
            <Button onClick={() => close(false)}>Done</Button>
          ) : (
            <>
              <Button
                variant='outline'
                onClick={() => close(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Resetting…' : 'Reset and send'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
