import { Link } from '@tanstack/react-router'
import { LogOut, Settings } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { getDisplayNameInitials } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

/**
 * The signed-in user, shaped for display.
 *
 * The auth store holds the API's snake_case user; every place that renders an
 * avatar needs the same three derived values, so the mapping lives here rather
 * than being repeated (and diverging) at each call site.
 */
export function useUserIdentity() {
  const user = useAuthStore((state) => state.auth.user)

  const name = user?.full_name || user?.username || 'Signed out'

  return {
    name,
    email: user?.email ?? '',
    avatar: user?.avatar_url ?? '',
    initials: getDisplayNameInitials(name),
  }
}

/** The identity block: avatar, name and email. */
export function UserIdentity({ className }: { className?: string }) {
  const { name, email, avatar, initials } = useUserIdentity()

  return (
    <div className={className}>
      <Avatar className='size-8 rounded-lg'>
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback className='rounded-lg'>{initials}</AvatarFallback>
      </Avatar>
      <div className='grid flex-1 text-start text-sm leading-tight'>
        <span className='truncate font-semibold'>{name}</span>
        <span className='truncate text-xs'>{email}</span>
      </div>
    </div>
  )
}

/**
 * The contents of the user menu, shared by the sidebar footer and the header
 * avatar.
 *
 * Both entry points must offer the same actions — a user who finds an item in
 * one place and not the other has to learn which menu is the "real" one. Only
 * the trigger and the popover placement differ, so only those live in the two
 * host components.
 */
export function UserMenuContent({ onSignOut }: { onSignOut: () => void }) {
  return (
    <>
      <DropdownMenuLabel className='p-0 font-normal'>
        <UserIdentity className='flex items-center gap-2 px-1 py-1.5 text-start text-sm' />
      </DropdownMenuLabel>
      <DropdownMenuSeparator />

      {/*
        One entry, not five. The settings page carries its own nav over
        Profile / Account / Appearance / Notifications / Display, so listing
        them here duplicates that nav and makes the menu a second place to
        keep in step every time a settings tab is added.
      */}
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link to='/settings'>
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <DropdownMenuSeparator />
      <DropdownMenuItem variant='destructive' onClick={onSignOut}>
        <LogOut />
        Sign out
      </DropdownMenuItem>
    </>
  )
}
