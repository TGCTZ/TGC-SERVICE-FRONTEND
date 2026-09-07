import useDialogState from '@/hooks/use-dialog-state'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SignOutDialog } from '@/components/sign-out-dialog'
import {
  UserMenuContent,
  useUserIdentity,
} from '@/components/user-menu-content'

/**
 * The user menu in the page header.
 *
 * Shares its contents with the sidebar footer (`layout/nav-user.tsx`) — only
 * the trigger and the popover placement differ.
 */
export function ProfileDropdown() {
  const [open, setOpen] = useDialogState()
  const { name, avatar, initials } = useUserIdentity()

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='relative size-8 rounded-full'>
            <Avatar className='size-8'>
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-56' align='end' forceMount>
          <UserMenuContent onSignOut={() => setOpen(true)} />
        </DropdownMenuContent>
      </DropdownMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}
