import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { logout } from '@/features/auth/data/api'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Confirms sign-out, then tears the session down.
 *
 * Three things happen in order, and all three matter: the token is revoked
 * server-side, the **entire query cache is cleared** so the next user cannot
 * see the previous one's data flash before a refetch, and the current location
 * is preserved as `redirect` so signing back in returns you where you were.
 *
 * `logout()` clears local auth before the revoke request. If that request
 * fails, the cache and navigation still need to finish locally.
 *
 * @param props.open - Whether the dialog is shown
 * @param props.onOpenChange - Called when it is dismissed
 */
export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const handleSignOut = async () => {
    // Local credentials are already gone even if the revoke request fails.
    try {
      await logout()
    } catch {
      // Continue clearing cached data and leave the protected page.
    }

    // Drop every cached query so the next user never sees the previous
    // user's data flash on screen before a refetch.
    queryClient.clear()

    // Preserve current location for redirect after sign-in
    const currentPath = location.href
    navigate({
      to: '/sign-in',
      search: { redirect: currentPath },
      replace: true,
    })
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Sign out'
      desc='Are you sure you want to sign out? You will need to sign in again to access your account.'
      confirmText='Sign out'
      destructive
      handleConfirm={handleSignOut}
      className='sm:max-w-sm'
    />
  )
}
